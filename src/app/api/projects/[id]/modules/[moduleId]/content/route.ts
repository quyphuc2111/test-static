import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { PermissionName, ShareStatus } from "@prisma/client"
import { hasPermission as checkPermission, hasAnyPermission } from "@/lib/permissions"
import { logContentAction } from "@/lib/audit"
import { Prisma } from "@prisma/client"
import { writeFile, mkdir, rm } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"
import { SCORMService } from "@/services/scormService"
import { contentEventBus } from "@/lib/content-events"
import { sanitizeVietnameseString, extractZipToDir, scanZipEntries } from "@/lib/file-utils"

export const maxDuration = 300 // 5 minutes
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
  try {
    const { id: projectId, moduleId } = await params
    const pId = Number(projectId)
    const mId = Number(moduleId)

    // Require authenticated session
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify project and module exist
    const project = await prisma.project.findUnique({
      where: { id: pId as any }
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const module = await prisma.module.findUnique({
      where: { id: mId as any }
    })

    if (!module) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 })
    }

    // Permission/Role-based visibility
    const isAdmin = (session.user.roles || []).includes("ADMINISTRATOR")
    const canViewAll = isAdmin || await checkPermission(PermissionName.MANAGE_ALL_CONTENT, session.user.id)
    const canViewDeletedAll = await checkPermission(PermissionName.VIEW_DELETED_ALL_CONTENT, session.user.id)
    const canViewDeletedOwn = await checkPermission(PermissionName.VIEW_DELETED_OWN_CONTENT, session.user.id)

    const whereClause: any = {
      projectId: pId as any,
      moduleId: mId as any,
    }

    if (canViewAll || canViewDeletedAll) {
      // Admin or VIEW_DELETED_ALL_CONTENT: See ALL content (including deleted)
      // No additional filters needed
    } else {
      // Regular users: complex visibility logic
      const orConditions: any[] = []
      
      // Own content
      if (canViewDeletedOwn) {
        // Can see own content (both active and deleted)
        orConditions.push({ ownerId: Number(session.user.id) as any })
      } else {
        // Can only see own ACTIVE content
        orConditions.push({ ownerId: Number(session.user.id) as any, isDeleted: false })
      }
      
      // Content-level sharing - ALWAYS exclude deleted
      orConditions.push({
        isDeleted: false,
        shares: { some: { sharedWithId: Number(session.user.id) as any, canView: true, status: ShareStatus.ACTIVE } }
      })

      // Module-level sharing - user có ModuleShare ACTIVE cho module này thì thấy tất cả content active
      orConditions.push({
        isDeleted: false,
        module: {
          moduleShares: {
            some: {
              sharedWithId: Number(session.user.id) as any,
              status: ShareStatus.ACTIVE,
            }
          }
        }
      })
      
      whereClause.OR = orConditions
    }

    const content = await prisma.contentData.findMany({
      where: whereClause,
      include: {
        owner: {
          select: { id: true, username: true, name: true, email: true }
        },
        shares: {
          where: { sharedWithId: Number(session.user.id) as any, status: ShareStatus.ACTIVE },
          select: { canView: true, canDownload: true, canEdit: true, canDelete: true, sharedById: true }
        },
        module: {
          select: {
            moduleShares: {
              where: { sharedWithId: Number(session.user.id) as any, status: ShareStatus.ACTIVE },
              select: { permission: true, sharedById: true }
            }
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    // Transform to include share permissions for current user
    // Priority: content-level share > module-level share
    const transformedContent = content.map(item => {
      const contentShare = item.shares?.[0]
      const moduleShare = item.module?.moduleShares?.[0]
      const isShared = !!contentShare || !!moduleShare

      let sharePermissions = null
      if (contentShare) {
        sharePermissions = {
          canView: contentShare.canView,
          canDownload: contentShare.canDownload,
          canEdit: contentShare.canEdit,
          canDelete: contentShare.canDelete
        }
      } else if (moduleShare) {
        // Map ModuleShare permission (VIEW/DOWNLOAD/EDIT) to content permissions
        const perm = moduleShare.permission
        sharePermissions = {
          canView: true,
          canDownload: perm === 'DOWNLOAD' || perm === 'EDIT',
          canEdit: perm === 'EDIT',
          canDelete: false
        }
      }

      // Remove nested module.moduleShares from response
      const { module: _module, ...rest } = item
      return {
        ...rest,
        isShared,
        sharePermissions
      }
    })

    return NextResponse.json({ data: transformedContent })
  } catch (error) {
    console.error("Error fetching content:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { id: projectId, moduleId } = await params
    const pId = Number(projectId)
    const mId = Number(moduleId)

    // Verify project and module exist
    const project = await prisma.project.findUnique({
      where: { id: pId as any }
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const module = await prisma.module.findUnique({
      where: { id: mId as any }
    })

    if (!module) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 })
    }

    // Permission check for creating content
    const canCreate = await hasAnyPermission([
      PermissionName.EDIT_CONTENT,
      PermissionName.MANAGE_OWN_CONTENT
    ], session.user.id)
    if (!canCreate) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Parse form data
    const formData = await request.formData()
    const title = formData.get("title") as string
    const description = formData.get("description") as string | null
    const contentType = formData.get("contentType") as "FILE_ZIP_HTML" | "FILE_ZIP_SCORM"
    const file = formData.get("file") as File

    if (!title || !contentType || !file) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Check if content with same title already exists for this owner
    const existingContent = await prisma.contentData.findFirst({
      where: {
        projectId: pId as any,
        moduleId: mId as any,
        ownerId: Number(session.user.id) as any,
        title: title as any,
        isDeleted: false
      } as any
    })

    if (existingContent) {
      return NextResponse.json(
        { error: "Bạn đã có nội dung với tiêu đề này trong module này" },
        { status: 409 }
      )
    }

    // Create directory structure: <project_name>/<module_name>/<file_name + timestamp>
    const timestamp = Date.now()
    const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "")
    const extractedDirName = `${fileNameWithoutExt}_${timestamp}`
    
    const uploadDir = join(
      process.cwd(), 
      "public", 
      "uploads", 
      "content",
      sanitizeVietnameseString(project.name), // Sanitize project name
      sanitizeVietnameseString(module.name),  // Sanitize module name
      extractedDirName
    )

    // Create directory structure
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Save ZIP file temporarily
    const tempZipPath = join(uploadDir, file.name)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(tempZipPath, buffer)

    // Validate: HTML type must have exactly 1 HTML file
    if (contentType === "FILE_ZIP_HTML") {
      const { htmlFiles: zipHtmlFiles } = await scanZipEntries(tempZipPath)
      if (zipHtmlFiles.length === 0) {
        await require('fs').promises.unlink(tempZipPath)
        await rm(uploadDir, { recursive: true, force: true }).catch(() => {})
        return NextResponse.json(
          { error: "File ZIP không chứa file HTML nào." },
          { status: 400 }
        )
      }
      if (zipHtmlFiles.length > 1) {
        await require('fs').promises.unlink(tempZipPath)
        await rm(uploadDir, { recursive: true, force: true }).catch(() => {})
        return NextResponse.json(
          { error: `File ZIP chứa ${zipHtmlFiles.length} file HTML. Chỉ được phép 1 file HTML duy nhất.`, htmlFiles: zipHtmlFiles },
          { status: 400 }
        )
      }
    }

    // Extract ZIP file
    try {
      console.log("Starting ZIP extraction...")
      console.log("ZIP path:", tempZipPath)
      console.log("Extract to:", uploadDir)
      
      await extractZipToDir(tempZipPath, uploadDir)
      console.log("ZIP extraction completed")
      
      // Remove temporary ZIP file
      await require('fs').promises.unlink(tempZipPath)
      console.log("Temporary ZIP file removed")
    } catch (extractError) {
      console.error("Error extracting ZIP:", extractError)
      const errorMessage = extractError instanceof Error ? extractError.message : "Unknown error"
      return NextResponse.json(
        { error: "Failed to extract ZIP file", details: errorMessage },
        { status: 400 }
      )
    }

    // Create content record — use same sanitize function as directory creation
    const relativePath = `/uploads/content/${sanitizeVietnameseString(project.name)}/${sanitizeVietnameseString(module.name)}/${extractedDirName}`
    
    const content = await prisma.contentData.create({
      data: {
        title,
        description: (() => {
          if (!description) return null
          try {
            const parsed = JSON.parse(description)
            return parsed as Prisma.InputJsonValue
          } catch {
            // if client sent plain text, wrap into object
            return { text: description } as Prisma.InputJsonValue
          }
        })(),
        contentType,
        contentUrl: relativePath,
        fileSize: file.size, // Store as number instead of BigInt
        projectId: pId as any,
        moduleId: mId as any,
        ownerId: Number(session.user.id) as any,
        status: "PROCESSING" as any,
        progress: 0
      } as any
    })

    // Process extracted content
    setTimeout(async () => {
      try {
        // Update progress: Starting extraction (10%)
        await prisma.contentData.update({
          where: { id: content.id },
          data: { progress: 10 } as any
        })

        // Use transaction to ensure atomicity
        await prisma.$transaction(async (tx) => {
        // Find index file (index.html, index.htm, or first HTML file)
        const fs = require('fs')
        const path = require('path')
        
        // Update progress: Finding files (20%)
        await tx.contentData.update({
          where: { id: content.id },
          data: { progress: 20 } as any
        })
        
        const findIndexFile = (dir: string): string | null => {
          // Recursive search: collect all HTML files with their relative paths
          const allHtmlFiles: string[] = []
          
          const walk = (currentDir: string) => {
            const entries = fs.readdirSync(currentDir)
            for (const entry of entries) {
              // Skip __MACOSX metadata folders
              if (entry === '__MACOSX' || entry.startsWith('.')) continue
              const fullPath = path.join(currentDir, entry)
              try {
                const stat = fs.statSync(fullPath)
                if (stat.isDirectory()) {
                  walk(fullPath)
                } else if (entry.toLowerCase().endsWith('.html') || entry.toLowerCase().endsWith('.htm')) {
                  allHtmlFiles.push(fullPath)
                }
              } catch { /* skip inaccessible */ }
            }
          }
          walk(dir)
          
          if (allHtmlFiles.length === 0) return null
          
          // Priority: index.html anywhere > any .html
          return (
            allHtmlFiles.find(f => path.basename(f).toLowerCase() === 'index.html') ??
            allHtmlFiles.find(f => path.basename(f).toLowerCase() === 'index.htm') ??
            allHtmlFiles[0]
          )
        }
        
        const indexFile = findIndexFile(uploadDir)
        
        // Update progress: Files found (30%)
        await tx.contentData.update({
          where: { id: content.id },
          data: { progress: 30 } as any
        })
        
        let launchFile: string | null = null
        let scormInfo: any = null

        if (contentType === "FILE_ZIP_SCORM") {
          // Process SCORM package
          console.log("Processing SCORM package...")
          
          // Update progress: Validating SCORM (40%)
          await tx.contentData.update({
            where: { id: content.id },
            data: { progress: 40 } as any
          })
          
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
                validation: {
                  errors: validation.errors,
                  warnings: validation.warnings
                }
              }
              
              // Update progress: SCORM processed (60%)
              await tx.contentData.update({
                where: { id: content.id },
                data: { progress: 60 } as any
              })
              
              console.log("SCORM package validated:", scormInfo)
            } else {
              console.warn("SCORM validation failed, falling back to HTML processing:", validation.errors)
              // Fallback to HTML processing if SCORM validation fails
              if (indexFile) {
                launchFile = indexFile.replace(uploadDir + '/', '')
              }
            }
          } catch (scormError) {
            console.warn("SCORM processing failed, falling back to HTML processing:", scormError)
            // Fallback to HTML processing if SCORM processing fails
            if (indexFile) {
              launchFile = indexFile.replace(uploadDir + '/', '')
            }
          }
        } else {
          // Process HTML package
          // Update progress: Processing HTML (50%)
          await tx.contentData.update({
            where: { id: content.id },
            data: { progress: 50 } as any
          })
          
          if (indexFile) {
            launchFile = indexFile.replace(uploadDir + '/', '')
          }
        }
        
        if (launchFile) {
          // Update progress: Saving content (80%)
          await tx.contentData.update({
            where: { id: content.id },
            data: { progress: 80 } as any
          })
          
          // Update content with directory path and SCORM info
          const relativeDirPath = uploadDir.replace(process.cwd() + '/public', '')
          
          await tx.contentData.update({
            where: { id: content.id },
            data: {
              status: "COMPLETED" as any,
              progress: 100,
              contentUrl: relativeDirPath,
              // Store description with launch file and SCORM info (if available)
              description: (() => {
                try {
                  const existingDesc = (content as any).description && typeof (content as any).description === 'object'
                    ? (content as any).description
                    : {}
                  
                  const newDesc: any = {
                    ...existingDesc,
                    launchFile: launchFile
                  }
                  
                  // Add SCORM info if it's a SCORM package
                  if (scormInfo) {
                    newDesc.scorm = {
                      version: scormInfo.version,
                      title: scormInfo.title,
                      identifier: scormInfo.identifier,
                      organizations: scormInfo.organizations,
                      resources: scormInfo.resources,
                      validation: {
                        errors: scormInfo.validation.errors,
                        warnings: scormInfo.validation.warnings
                      }
                    }
                  }
                  
                  return newDesc as Prisma.InputJsonValue
                } catch (error) {
                  console.error('Error merging existing description:', error)
                  const fallbackDesc: any = {
                    launchFile: launchFile
                  }
                  
                  if (scormInfo) {
                    fallbackDesc.scorm = {
                      version: scormInfo.version,
                      title: scormInfo.title,
                      identifier: scormInfo.identifier
                    }
                  }
                  
                  return fallbackDesc as Prisma.InputJsonValue
                }
              })()
            } as any
          })
          
          console.log(`Content processed successfully. Launch file: ${launchFile}`)
          contentEventBus.emitStatusChange({
            contentId: content.id,
            projectId: pId,
            moduleId: mId,
            status: "COMPLETED",
            progress: 100,
          })
        } else {
          // No index file found, mark as failed
          await tx.contentData.update({
            where: { id: content.id },
            data: {
              status: "FAILED" as any,
              progress: 0
            } as any
          })
          contentEventBus.emitStatusChange({
            contentId: content.id,
            projectId: pId,
            moduleId: mId,
            status: "FAILED",
          })
        }
        }) // End transaction
      } catch (error) {
        console.error("Error processing content:", error)
        const errMsg = error instanceof Error ? error.message : String(error)
        // If transaction fails, update status outside transaction
        try {
          await prisma.contentData.update({
            where: { id: content.id },
            data: {
              status: "FAILED" as any,
              progress: 0,
              description: { error: errMsg } as any
            } as any
          })
        } catch (updateError) {
          console.error("Failed to update status to FAILED:", updateError)
        }
        contentEventBus.emitStatusChange({
          contentId: content.id,
          projectId: pId,
          moduleId: mId,
          status: "FAILED",
        })
      }
    }, 2000)
    
    // Log audit
    await logContentAction(
      session.user.id,
      'created',
      String(content.id),
      {
        contentTitle: content.title,
        contentType: content.contentType,
        projectId: pId,
        moduleId: mId,
        fileSize: file.size
      }
    )

    return NextResponse.json({ data: content })
  } catch (error) {
    console.error("Error creating content:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
