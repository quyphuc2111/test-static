import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { existsSync } from "fs"
import { join } from "path"
import archiver from "archiver"
import { PermissionName, ShareStatus } from "@prisma/client"
import { hasAnyPermission, hasPermission } from "@/lib/permissions"

type Params = { params: Promise<{ id: string; moduleId: string; contentId: string }> }

export async function GET(request: NextRequest, { params }: Params) {
  try {
    console.log('Download API called')
    
    const session = await getSession()
    
    if (!session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: projectId, moduleId, contentId } = await params
    const pId = Number(projectId)
    const mId = Number(moduleId)
    const cId = Number(contentId)

    // Verify content exists
    const content = await prisma.contentData.findFirst({
      where: {
        id: cId as any,
        projectId: pId as any,
        moduleId: mId as any,
        isDeleted: false
      }
    })

    if (!content) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 })
    }

    // Check system permissions first
    const isAdmin = (session.user.roles || []).includes("ADMINISTRATOR")
    const canDownloadAny = await hasPermission(PermissionName.DOWNLOAD_CONTENT, session.user.id)
    const canManageAll = await hasAnyPermission([PermissionName.MANAGE_ALL_CONTENT], session.user.id)
    const canManageOwn = await hasPermission(PermissionName.MANAGE_OWN_CONTENT, session.user.id)
    
    // Check if user can download this specific content
    const isOwner = Number(content.ownerId) === Number(session.user.id)
    const canDownloadThis = isAdmin || canManageAll || (isOwner && (canDownloadAny || canManageOwn))
    
    // If not owner and no general download permission, check sharing
    if (!canDownloadThis) {
      const share = await prisma.contentShare.findFirst({
        where: { contentId: content.id as any, sharedWithId: Number(session.user.id) as any, canDownload: true, status: ShareStatus.ACTIVE }
      })
      const moduleShare = await prisma.moduleShare.findFirst({
        where: { moduleId: content.moduleId as any, sharedWithId: Number(session.user.id) as any, permission: { in: ['DOWNLOAD', 'EDIT'] }, status: ShareStatus.ACTIVE }
      })
      if (!share && !moduleShare) {
        return NextResponse.json({ error: "Bạn không có quyền tải xuống nội dung này" }, { status: 403 })
      }
    }

    // Get the content directory path
    const contentDir = join(process.cwd(), 'public', content.contentUrl)
    
    if (!existsSync(contentDir)) {
      return NextResponse.json({ error: "Content files not found" }, { status: 404 })
    }

    // Create ZIP archive
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    })

    // Collect chunks
    const chunks: Buffer[] = []
    
    archive.on('data', (chunk) => {
      chunks.push(chunk)
    })

    archive.on('error', (err) => {
      console.error('Archive error:', err)
      throw err
    })

    // Add directory to archive and wait for completion
    try {
      archive.directory(contentDir, false)
      
      // Wait for archive to complete
      await new Promise<void>((resolve, reject) => {
        archive.on('end', () => {
          resolve()
        })
        archive.on('error', reject)
        
        // Finalize the archive
        archive.finalize()
      })
      
    } catch (archiveError) {
      console.error('Error creating archive:', archiveError)
      return NextResponse.json({ error: "Failed to create ZIP archive" }, { status: 500 })
    }

    // Combine all chunks
    const buffer = Buffer.concat(chunks)

    // Helper function to sanitize filename
    const sanitizeFilename = (filename: string): string => {
      return filename
        .normalize('NFD') // Decompose accented characters
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters except spaces
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .toLowerCase()
    }

    // Set response headers
    const headers = new Headers()
    headers.set('Content-Type', 'application/zip')
    headers.set('Content-Disposition', `attachment; filename="${sanitizeFilename(content.title)}.zip"`)
    headers.set('Content-Length', buffer.length.toString())
    headers.set('Cache-Control', 'no-cache')

    return new NextResponse(buffer, { headers })

  } catch (error) {
    console.error("Error downloading content:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
