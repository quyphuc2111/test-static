import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"

export const dynamic = 'force-dynamic'

// GET: List all versions of a content (including current as latest)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string; contentId: string }> }
) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: projectId, moduleId, contentId } = await params
    const cId = Number(contentId)

    // Verify content exists and get current state
    const content = await prisma.contentData.findFirst({
      where: {
        id: cId as any,
        projectId: Number(projectId) as any,
        moduleId: Number(moduleId) as any,
      },
      include: {
        owner: { select: { id: true, username: true, name: true } }
      }
    })

    if (!content) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 })
    }

    // Get historical versions
    const historicalVersions = await (prisma as any).contentVersion.findMany({
      where: { contentId: cId },
      include: {
        createdBy: {
          select: { id: true, username: true, name: true }
        }
      },
      orderBy: { version: "desc" }
    })

    // Build "current" version from ContentData (always the latest)
    const maxVersion = historicalVersions.length > 0
      ? historicalVersions[0].version
      : 0

    const currentVersion = {
      id: -1, // Virtual ID — not a real ContentVersion row
      version: maxVersion + 1,
      contentUrl: content.contentUrl,
      launchFile: (content as any).launchFile ?? null,
      fileSize: content.fileSize,
      archiveSize: null,
      status: content.status,
      errorMessage: null,
      contentId: cId,
      createdById: content.ownerId,
      createdBy: content.owner,
      createdAt: content.updatedAt,
      isCurrent: true, // Flag to identify current version in UI
    }

    // Prepend current version to the list
    const allVersions = [currentVersion, ...historicalVersions.map((v: any) => ({
      ...v,
      isCurrent: false,
    }))]

    return NextResponse.json({ data: allVersions })
  } catch (error) {
    console.error("Error listing versions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
