import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { PermissionName } from "@prisma/client"
import { hasPermission as checkPermission } from "@/lib/permissions"
import { logContentAction } from "@/lib/audit"
import { join } from "path"
import { unlink } from "fs/promises"
import { existsSync } from "fs"

export const dynamic = 'force-dynamic'

// DELETE: Remove a specific version archive
export async function DELETE(
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

    // Get the version
    const version = await (prisma as any).contentVersion.findFirst({
      where: {
        id: vId,
        contentId: cId,
      }
    })

    if (!version) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 })
    }

    // Delete the archive zip file from disk
    if (version.contentUrl) {
      const uploadsDir = join(process.cwd(), "public", "uploads")
      const zipPath = join(uploadsDir, version.contentUrl.replace('/uploads/', ''))
      if (existsSync(zipPath)) {
        try {
          await unlink(zipPath)
        } catch (err) {
          console.warn(`[delete-version] Failed to delete zip: ${zipPath}`, err)
        }
      }
    }

    // Delete DB record
    await (prisma as any).contentVersion.delete({
      where: { id: vId }
    })

    // Audit log
    logContentAction(session.user.id, 'version_deleted', String(cId), {
      deletedVersionId: vId,
      deletedVersion: version.version,
    }).catch(console.error)

    return NextResponse.json({ message: "Version deleted successfully" })
  } catch (error) {
    console.error("Error deleting version:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
