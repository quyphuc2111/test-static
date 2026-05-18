import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { PermissionName } from "@prisma/client"
import { hasPermission as checkPermission } from "@/lib/permissions"
import { logContentAction } from "@/lib/audit"
import { contentEventBus } from "@/lib/content-events"
import { join } from "path"
import { mkdir, rm, stat as fsStat } from "fs/promises"
import { existsSync } from "fs"
import { archiveDirectory, extractZipToDir } from "@/lib/file-utils"

export const dynamic = 'force-dynamic'

// POST: Restore a specific version
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string; contentId: string; versionId: string }> }
) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: projectId, moduleId, contentId, versionId } = await params
    const cId = Number(contentId)
    const vId = Number(versionId)

    // Permission check
    const isAdmin = (session.user.roles || []).includes("ADMINISTRATOR")
    const canEdit = isAdmin || await checkPermission(PermissionName.EDIT_CONTENT, session.user.id)
    if (!canEdit) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get current content
    const content = await prisma.contentData.findFirst({
      where: {
        id: cId as any,
        projectId: Number(projectId) as any,
        moduleId: Number(moduleId) as any,
        isDeleted: false,
      }
    })

    if (!content) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 })
    }

    // Get the version to restore
    const versionToRestore = await (prisma as any).contentVersion.findFirst({
      where: {
        id: vId as any,
        contentId: cId as any,
        status: "COMPLETED",
      }
    })

    if (!versionToRestore) {
      return NextResponse.json({ error: "Version not found or not restorable" }, { status: 404 })
    }

    const uploadsDir = join(process.cwd(), "public", "uploads")
    const currentContentUrl = content.contentUrl
    if (!currentContentUrl) {
      return NextResponse.json({ error: "Content has no file path" }, { status: 400 })
    }

    const contentDir = join(uploadsDir, currentContentUrl.replace('/uploads/', ''))
    const versionsDir = join(contentDir, '..', `_versions_${cId}`)
    await mkdir(versionsDir, { recursive: true })

    // 1. Snapshot current state → archive into zip
    const maxVersion = await (prisma as any).contentVersion.findFirst({
      where: { contentId: cId as any },
      orderBy: { version: "desc" },
      select: { version: true }
    })
    const nextVersion = (maxVersion?.version || 0) + 1
    const snapshotZipName = `v${nextVersion}.zip`
    const snapshotZipPath = join(versionsDir, snapshotZipName)
    const snapshotZipRelUrl = currentContentUrl.replace(/[^/]+$/, `_versions_${cId}/${snapshotZipName}`)

    let archiveSizeBytes: number | null = null
    if (existsSync(contentDir)) {
      await archiveDirectory(contentDir, snapshotZipPath)
      try {
        const zipStat = await fsStat(snapshotZipPath)
        archiveSizeBytes = zipStat.size
      } catch { /* ignore */ }
    }

    await (prisma as any).contentVersion.create({
      data: {
        version: nextVersion,
        contentUrl: snapshotZipRelUrl,
        launchFile: (content as any).launchFile ?? null,
        fileSize: content.fileSize,
        archiveSize: archiveSizeBytes,
        status: content.status,
        contentId: cId,
        createdById: Number(session.user.id),
      }
    })

    // 2. Clear current content directory (_versions is a sibling dir, safe to rm -rf)
    await rm(contentDir, { recursive: true, force: true })
    await mkdir(contentDir, { recursive: true })

    // 3. Extract the version zip into the content directory
    const versionZipPath = join(uploadsDir, versionToRestore.contentUrl.replace('/uploads/', ''))
    if (!existsSync(versionZipPath)) {
      return NextResponse.json({ error: "Version archive not found on disk" }, { status: 404 })
    }

    await extractZipToDir(versionZipPath, contentDir)

    // 4. Update DB — contentUrl stays the same, update metadata
    const updated = await prisma.contentData.update({
      where: { id: cId as any },
      data: {
        launchFile: versionToRestore.launchFile ?? null,
        fileSize: versionToRestore.fileSize,
        status: "COMPLETED",
        progress: 100,
      } as any
    })

    // Audit log
    logContentAction(session.user.id, 'version_restored', String(cId), {
      restoredVersionId: vId,
      restoredVersion: versionToRestore.version,
      snapshotVersion: nextVersion,
    }).catch(console.error)

    // SSE: notify clients about the restore
    contentEventBus.emitStatusChange({
      contentId: cId,
      projectId: Number(projectId),
      moduleId: Number(moduleId),
      status: "COMPLETED",
    })

    return NextResponse.json({
      message: "Version restored successfully",
      data: updated
    })
  } catch (error) {
    console.error("Error restoring version:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
