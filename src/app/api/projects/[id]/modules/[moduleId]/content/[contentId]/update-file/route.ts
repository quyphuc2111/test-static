import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { PermissionName } from "@prisma/client"
import { hasPermission as checkPermission } from "@/lib/permissions"
import { logContentAction } from "@/lib/audit"
import { Prisma } from "@prisma/client"
import { mkdir, rm, stat as fsStat } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"
import { SCORMService } from "@/services/scormService"
import { contentEventBus } from "@/lib/content-events"
import {
  sanitizeVietnameseString,
  streamFileToDisk,
  scanZipEntries,
  extractZipFromDisk,
  cleanupTempZip,
  archiveDirectory,
} from "@/lib/file-utils"

export const maxDuration = 300 // 5 minutes
export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string; contentId: string }> }
) {
  try {
    const { id: projectId, moduleId, contentId } = await params
    const pId = Number(projectId)
    const mId = Number(moduleId)
    const cId = Number(contentId)

    const session = await getSession()
    if (!session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch content + shared permission in parallel
    const [content, sharedContent] = await Promise.all([
      prisma.contentData.findFirst({
        where: { id: cId as any, projectId: pId as any, moduleId: mId as any, isDeleted: false },
        include: { owner: true }
      }),
      prisma.contentShare.findFirst({
        where: {
          contentId: cId as any,
          sharedWithId: Number(session.user.id) as any,
          status: 'ACTIVE',
          canEdit: true
        }
      }),
      prisma.moduleShare.findFirst({
        where: {
          moduleId: mId as any,
          sharedWithId: Number(session.user.id) as any,
          status: 'ACTIVE',
          permission: 'EDIT'
        }
      })
    ])

    if (!content) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 })
    }

    const isOwner = Number(content.owner?.id ?? NaN) === Number(session.user.id)
    const hasManageAllContent = await checkPermission(PermissionName.MANAGE_ALL_CONTENT, session.user.id)
    const hasEditViaShare = !!sharedContent || !!sharedModule

    if (!isOwner && !hasManageAllContent && !hasEditViaShare) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    // Parse form data
    const formData = await request.formData()
    const contentType = formData.get("contentType") as string
    const file = formData.get("file") as File

    if (!contentType || !file) {
      return NextResponse.json({ error: "Missing contentType or file" }, { status: 400 })
    }
    if (!["FILE_ZIP_HTML", "FILE_ZIP_SCORM"].includes(contentType)) {
      return NextResponse.json({ error: "Invalid contentType" }, { status: 400 })
    }
    if (file.size === 0) return NextResponse.json({ error: "File is empty" }, { status: 400 })
    if (file.size > 1000 * 1024 * 1024) return NextResponse.json({ error: "File too large (max 1000MB)" }, { status: 400 })
    if (!file.name.toLowerCase().endsWith('.zip')) return NextResponse.json({ error: "Only ZIP files are allowed" }, { status: 400 })

    const currentContentUrl = content.contentUrl
    if (!currentContentUrl) {
      return NextResponse.json({ error: "Content has no existing file path" }, { status: 400 })
    }

    // Snapshot current version: archive current directory into zip
    const uploadsDir = join(process.cwd(), "public", "uploads")
    const contentDir = join(uploadsDir, currentContentUrl.replace('/uploads/', ''))
    const versionsDir = join(contentDir, '..', `_versions_${cId}`)
    await mkdir(versionsDir, { recursive: true })

    const maxVersion = await (prisma as any).contentVersion.findFirst({
      where: { contentId: cId },
      orderBy: { version: "desc" },
      select: { version: true }
    })
    const nextVersion = (maxVersion?.version || 0) + 1

    // Archive current content directory into a zip for version history
    const versionZipName = `v${nextVersion}.zip`
    const versionZipPath = join(versionsDir, versionZipName)
    const versionZipRelUrl = currentContentUrl.replace(/[^/]+$/, `_versions_${cId}/${versionZipName}`)

    let archiveSizeBytes: number | null = null
    if (existsSync(contentDir)) {
      await archiveDirectory(contentDir, versionZipPath)
      try {
        const zipStat = await fsStat(versionZipPath)
        archiveSizeBytes = zipStat.size
      } catch { /* ignore */ }
    }

    await (prisma as any).contentVersion.create({
      data: {
        version: nextVersion,
        contentUrl: versionZipRelUrl,
        launchFile: (content as any).launchFile ?? null,
        fileSize: content.fileSize,
        archiveSize: archiveSizeBytes,
        status: content.status,
        contentId: cId,
        createdById: Number(session.user.id),
      }
    })

    // Mark as PROCESSING
    await prisma.contentData.update({
      where: { id: cId as any },
      data: {
        status: "PROCESSING",
        progress: 0,
        contentType: contentType as "FILE_ZIP_HTML" | "FILE_ZIP_SCORM",
        fileSize: file.size
      }
    })

    // Stream file to temp location on disk — does NOT load into memory
    const timestamp = Date.now()
    const tempZipPath = join(uploadsDir, `_tmp_update_${cId}_${timestamp}.zip`)

    await streamFileToDisk(file, tempZipPath)

    // Validate: HTML type must have exactly 1 HTML file
    if (contentType === "FILE_ZIP_HTML") {
      const { htmlFiles: zipHtmlFiles } = await scanZipEntries(tempZipPath)
      if (zipHtmlFiles.length === 0) {
        await cleanupTempZip(tempZipPath)
        return NextResponse.json(
          { error: "File ZIP không chứa file HTML nào." },
          { status: 400 }
        )
      }
      if (zipHtmlFiles.length > 1) {
        await cleanupTempZip(tempZipPath)
        return NextResponse.json(
          { error: `File ZIP chứa ${zipHtmlFiles.length} file HTML. Chỉ được phép 1 file HTML duy nhất.`, htmlFiles: zipHtmlFiles },
          { status: 400 }
        )
      }
    }

    // Log audit (non-blocking)
    logContentAction(session.user.id, 'file_updated', String(cId), {
      contentTitle: content.title,
      fileSize: file.size,
      contentType
    }).catch(console.error)

    // Return response immediately
    const response = NextResponse.json({
      message: "File update started successfully",
      contentId: cId
    })

    // Process asynchronously
    setImmediate(async () => {
      try {
        // Parse existing launchFile from description
        let currentLaunchFile: string | null = null
        if (content.description) {
          try {
            const desc = typeof content.description === 'string'
              ? JSON.parse(content.description)
              : content.description
            currentLaunchFile = desc.launchFile || null
          } catch {
            console.warn("[update-file] Failed to parse existing description")
          }
        }

        // Determine target directory and expected HTML file
        let targetDir = contentDir
        let launchDir: string | null = null
        let expectedHtmlFile: string | null = null

        if (currentLaunchFile && currentLaunchFile.includes('/')) {
          launchDir = currentLaunchFile.split('/')[0]
          expectedHtmlFile = currentLaunchFile.split('/').slice(1).join('/')
          targetDir = join(contentDir, launchDir)
        }

        // Scan ZIP entries to compute strip prefix (memory-efficient, reads only central directory)
        const { allFiles, htmlFiles: zipHtmlFiles, wrapperFolder } = await scanZipEntries(tempZipPath)

        // Compute strip prefix
        let stripPrefix = ''
        if (expectedHtmlFile) {
          const match = allFiles.find(f => {
            const parts = f.split('/')
            return parts[parts.length - 1].toLowerCase() === expectedHtmlFile!.toLowerCase()
          })
          if (match) {
            const idx = match.lastIndexOf(expectedHtmlFile)
            if (idx > 0) stripPrefix = match.substring(0, idx)
          }
        } else if (wrapperFolder) {
          stripPrefix = wrapperFolder + '/'
        }

        // Also strip launchDir prefix if targetDir already includes it
        const launchDirPrefix = launchDir && targetDir !== contentDir ? launchDir + '/' : ''
        if (launchDirPrefix && !stripPrefix.endsWith(launchDirPrefix)) {
          // If stripPrefix doesn't already include launchDir, we need to handle it during extraction
        }

        // Validate ZIP contains expected HTML
        if (expectedHtmlFile) {
          const found = zipHtmlFiles.some(f =>
            f === expectedHtmlFile ||
            f.endsWith(`/${expectedHtmlFile}`) ||
            f.includes(`/${expectedHtmlFile}`)
          )
          if (!found) {
            await cleanupTempZip(tempZipPath)
            await prisma.contentData.update({
              where: { id: cId as any },
              data: {
                status: "FAILED",
                description: {
                  error: `File ZIP không chứa file HTML mong đợi: ${expectedHtmlFile}. Các file HTML tìm thấy: ${zipHtmlFiles.join(', ')}`,
                  originalLaunchFile: currentLaunchFile,
                  foundFiles: zipHtmlFiles
                } as Prisma.InputJsonValue
              }
            })
            return
          }
        } else if (zipHtmlFiles.length === 0) {
          await cleanupTempZip(tempZipPath)
          await prisma.contentData.update({
            where: { id: cId as any },
            data: {
              status: "FAILED",
              description: { error: "File ZIP không chứa file HTML nào." } as Prisma.InputJsonValue
            }
          })
          return
        }

        // Clear old content directory and recreate (already archived above)
        // _versions dir is a sibling, not inside contentDir, so safe to rm -rf
        await rm(contentDir, { recursive: true, force: true })
        await mkdir(targetDir, { recursive: true })

        // Extract ZIP from disk with prefix stripping — memory-efficient
        const { files: extractedFiles, htmlFiles: extractedHtmlFiles } = await extractZipFromDisk(
          tempZipPath,
          targetDir,
          stripPrefix
        )

        // Remove temp ZIP
        await cleanupTempZip(tempZipPath)

        console.log(`[update-file] Extracted ${extractedFiles.length} files for content ${cId}`)

        // Determine launch file and description
        let description: Record<string, unknown> = {}
        let launchFile: string | null = null

        if (contentType === "FILE_ZIP_SCORM") {
          const scormData = await SCORMService.parseManifest(targetDir)
          if (scormData) {
            const scormLaunchFile = scormData.resources?.[0]?.href || "index.html"
            description = { scorm: scormData, launchFile: scormLaunchFile }
            launchFile = scormLaunchFile
          } else {
            throw new Error("Failed to process SCORM package")
          }
        } else {
          if (currentLaunchFile) {
            launchFile = currentLaunchFile
            description = { launchFile, type: "html" }
          } else {
            const candidates = extractedHtmlFiles
            launchFile =
              candidates.find(f => f.includes('/') && f.toLowerCase().endsWith('index.html')) ??
              candidates.find(f => !f.includes('/') && f.toLowerCase() === 'index.html') ??
              candidates[0] ?? null

            if (!launchFile) throw new Error("No HTML file found in package")
            description = { launchFile, type: "html" }
          }
        }

        await prisma.contentData.update({
          where: { id: content.id as any },
          data: {
            description: description as Prisma.InputJsonValue,
            status: "COMPLETED",
            progress: 100
          }
        })

        console.log(`[update-file] Content ${cId} updated successfully. Launch: ${launchFile}`)
        contentEventBus.emitStatusChange({
          contentId: cId,
          projectId: pId,
          moduleId: mId,
          status: "COMPLETED",
          progress: 100,
        })
      } catch (error) {
        console.error(`[update-file] Error processing content ${cId}:`, error)
        await cleanupTempZip(tempZipPath)
        const errMsg = error instanceof Error ? error.message : String(error)
        await prisma.contentData.update({
          where: { id: content.id as any },
          data: {
            status: "FAILED",
            description: { error: errMsg } as any
          }
        }).catch(console.error)
        contentEventBus.emitStatusChange({
          contentId: cId,
          projectId: pId,
          moduleId: mId,
          status: "FAILED",
        })
      }
    })

    return response
  } catch (error) {
    console.error("Error updating file:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
