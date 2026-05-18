import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { PermissionName } from "@prisma/client"
import { hasPermission as checkPermission, hasAnyPermission } from "@/lib/permissions"
import { logContentAction } from "@/lib/audit"
import { Prisma } from "@prisma/client"
import { mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"
import { SCORMService } from "@/services/scormService"
import { contentEventBus } from "@/lib/content-events"
import {
  sanitizeVietnameseString,
  streamFileToDisk,
  scanZipEntries,
  extractZipFromDisk,
  findLaunchFileFromList,
  cleanupTempZip,
} from "@/lib/file-utils"

export const maxDuration = 300 // 5 minutes
export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string; contentId: string }> }
) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: projectId, moduleId, contentId } = await params

    // Batch DB lookups in parallel
    const [project, module, content] = await Promise.all([
      prisma.project.findUnique({ where: { id: Number(projectId) as any } }),
      prisma.module.findUnique({ where: { id: Number(moduleId) as any } }),
      prisma.contentData.findUnique({
        where: { id: Number(contentId) as any },
        include: { owner: { select: { id: true, name: true, email: true } } }
      })
    ])

    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 })
    if (!module) return NextResponse.json({ error: "Module not found" }, { status: 404 })
    if (!content) return NextResponse.json({ error: "Content not found" }, { status: 404 })

    // Permission checks in parallel
    const isAdmin = (session.user.roles || []).includes("ADMINISTRATOR")
    const [canManageAll, canUpdate, sharedContent] = await Promise.all([
      isAdmin ? Promise.resolve(true) : checkPermission(PermissionName.MANAGE_ALL_CONTENT, session.user.id),
      hasAnyPermission([PermissionName.EDIT_CONTENT, PermissionName.MANAGE_OWN_CONTENT], session.user.id),
      prisma.contentShare.findFirst({
        where: {
          contentId: content.id as any,
          sharedWithId: Number(session.user.id) as any,
          status: 'ACTIVE',
          canEdit: true
        }
      })
    ])

    const isOwner = content.ownerId === (Number(session.user.id) as any)
    const hasEditViaShare = !!sharedContent

    if (!canManageAll && !isOwner && !hasEditViaShare) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    if (!canUpdate && !hasEditViaShare) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Parse form data
    const formData = await request.formData()
    const contentType = formData.get("contentType") as "FILE_ZIP_HTML" | "FILE_ZIP_SCORM"
    const file = formData.get("file") as File

    if (!contentType || !file) {
      return NextResponse.json({ error: "Missing required fields: contentType and file" }, { status: 400 })
    }
    if (file.size === 0) return NextResponse.json({ error: "File is empty" }, { status: 400 })
    if (file.size > 1000 * 1024 * 1024) return NextResponse.json({ error: "File too large (max 1000MB)" }, { status: 400 })
    if (!file.name.toLowerCase().endsWith('.zip')) return NextResponse.json({ error: "Only ZIP files are allowed" }, { status: 400 })

    // Build paths
    const timestamp = Date.now()
    const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "")
    const extractedDirName = `${fileNameWithoutExt}_${timestamp}`
    const sanitizedProject = sanitizeVietnameseString(project.name)
    const sanitizedModule = sanitizeVietnameseString(module.name)

    const uploadDir = join(process.cwd(), "public", "uploads", "content", sanitizedProject, sanitizedModule, extractedDirName)
    const tempZipPath = join(process.cwd(), "public", "uploads", "content", sanitizedProject, sanitizedModule, `_tmp_${timestamp}.zip`)
    const relativeDirPath = `/uploads/content/${sanitizedProject}/${sanitizedModule}/${extractedDirName}`

    // Ensure upload directory exists
    await mkdir(uploadDir, { recursive: true })

    // Stream file to disk — does NOT load entire file into memory
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

    // Mark as PROCESSING
    await prisma.contentData.update({
      where: { id: Number(contentId) as any },
      data: {
        contentType,
        contentUrl: relativeDirPath,
        fileSize: file.size,
        status: "PROCESSING" as any,
        progress: 0
      } as any
    })

    // Log audit (non-blocking)
    logContentAction(session.user.id, 'uploaded', contentId, {
      contentTitle: content.title,
      fileSize: file.size,
      contentType
    }).catch(console.error)

    // Return response immediately, process in background
    const response = NextResponse.json({
      message: "File upload started successfully",
      contentId
    })

    // Process asynchronously
    setImmediate(async () => {
      try {
        // Extract ZIP from disk — memory-efficient for large files
        const { files: extractedFiles } = await extractZipFromDisk(tempZipPath, uploadDir)

        // Remove temp ZIP file
        await cleanupTempZip(tempZipPath)

        let launchFile: string | null = null
        let scormInfo: any = null

        if (contentType === "FILE_ZIP_SCORM") {
          try {
            const validation = await SCORMService.validateSCORMPackage(uploadDir)
            if (validation.isValid && validation.manifest) {
              const manifest = validation.manifest
              const manifestPath = join(uploadDir, 'imsmanifest.xml')
              const scormVersion = existsSync(manifestPath)
                ? SCORMService.detectSCORMVersion(manifestPath)
                : SCORMService.getSCORMVersion(manifest)
              launchFile = SCORMService.findLaunchFile(manifest, uploadDir)
              scormInfo = {
                version: scormVersion,
                title: manifest.title,
                identifier: manifest.identifier,
                organizations: manifest.organizations.length,
                resources: manifest.resources.length,
                validation: { errors: validation.errors, warnings: validation.warnings }
              }
            } else {
              console.warn("[upload] SCORM validation failed, falling back to HTML:", validation.errors)
              launchFile = findLaunchFileFromList(extractedFiles)
            }
          } catch (scormError) {
            console.warn("[upload] SCORM processing failed, falling back to HTML:", scormError)
            launchFile = findLaunchFileFromList(extractedFiles)
          }
        } else {
          launchFile = findLaunchFileFromList(extractedFiles)
        }

        if (launchFile) {
          const existingDesc = content.description && typeof content.description === 'object'
            ? (content.description as Record<string, unknown>)
            : {}
          const newDesc: Record<string, unknown> = { ...existingDesc, launchFile }
          if (scormInfo) newDesc.scorm = scormInfo

          await prisma.contentData.update({
            where: { id: Number(contentId) as any },
            data: {
              status: "COMPLETED" as any,
              progress: 100,
              contentUrl: relativeDirPath,
              description: newDesc as Prisma.InputJsonValue
            } as any
          })
          console.log(`[upload] Content ${contentId} completed. Launch: ${launchFile}, Files: ${extractedFiles.length}`)
          contentEventBus.emitStatusChange({
            contentId: Number(contentId),
            projectId: Number(projectId),
            moduleId: Number(moduleId),
            status: "COMPLETED",
            progress: 100,
          })
        } else {
          await prisma.contentData.update({
            where: { id: Number(contentId) as any },
            data: { status: "FAILED" as any, progress: 0 } as any
          })
          console.error(`[upload] No HTML file found in content ${contentId}`)
          contentEventBus.emitStatusChange({
            contentId: Number(contentId),
            projectId: Number(projectId),
            moduleId: Number(moduleId),
            status: "FAILED",
          })
        }
      } catch (error) {
        console.error(`[upload] Error processing content ${contentId}:`, error)
        await cleanupTempZip(tempZipPath)
        const errMsg = error instanceof Error ? error.message : String(error)
        await prisma.contentData.update({
          where: { id: Number(contentId) as any },
          data: { status: "FAILED" as any, progress: 0, description: { error: errMsg } } as any
        }).catch(console.error)
        contentEventBus.emitStatusChange({
          contentId: Number(contentId),
          projectId: Number(projectId),
          moduleId: Number(moduleId),
          status: "FAILED",
        })
      }
    })

    return response
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
