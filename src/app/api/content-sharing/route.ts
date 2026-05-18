import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { hasPermission } from "@/lib/permissions"
import { PermissionName, ShareScope } from "@prisma/client"
import { createAuditLog } from "@/lib/audit"

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const contentId = searchParams.get('contentId')

    let whereClause: any = {}

    if (userId) {
      whereClause.sharedWithId = Number(userId) as any
    }

    if (contentId) {
      whereClause.contentId = Number(contentId) as any
    }

    const shares = await prisma.contentShare.findMany({
      where: whereClause,
      include: {
        content: {
          select: {
            id: true,
            title: true,
            contentType: true,
            status: true,
            project: {
              select: {
                id: true,
                name: true
              }
            },
            module: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        sharedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        sharedWith: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        batch: {
          select: {
            id: true,
            scope: true,
            projectId: true,
            moduleId: true,
            ownerId: true,
            itemsCount: true,
            createdAt: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ data: shares })
  } catch (error) {
    console.error("Error fetching content shares:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Check SHARE_CONTENT_ACCESS permission
    const canShare = await hasPermission(PermissionName.SHARE_CONTENT_ACCESS, session.user.id)
    if (!canShare) {
      return NextResponse.json({ message: "Forbidden: Missing SHARE_CONTENT_ACCESS permission" }, { status: 403 })
    }

    const body = await req.json()
    const {
      contentId,
      sharedWithId,
      canView = true,
      canEdit = false,
      canDelete = false,
      canDownload = true,
      // Admin bulk share inputs (optional)
      projectId,
      moduleId,
      ownerId,
      contentIds
    } = body

    const numeric = {
      contentId: contentId != null ? Number(contentId) : undefined,
      sharedWithId: sharedWithId != null ? Number(sharedWithId) : undefined,
      projectId: projectId != null ? Number(projectId) : undefined,
      moduleId: moduleId != null ? Number(moduleId) : undefined,
      ownerId: ownerId != null ? Number(ownerId) : undefined,
      contentIds: Array.isArray(contentIds) ? contentIds.map((v: any) => Number(v)) : undefined,
    }

    const isAdmin = Array.isArray(session.user?.roles) && (session.user!.roles as any[]).includes("ADMINISTRATOR")
    const canManageAll = await hasPermission(PermissionName.MANAGE_ALL_CONTENT, session.user.id)

    // BULK SHARE: project/module/owner/contentIds (requires SHARE_CONTENT_ACCESS permission)
    if (numeric.sharedWithId && (numeric.projectId || numeric.moduleId || numeric.ownerId || (Array.isArray(numeric.contentIds) && numeric.contentIds.length > 0))) {
      // Check permissions for different bulk share types
      if (numeric.projectId && !isAdmin && !canManageAll) {
        return NextResponse.json({ message: "Forbidden: Project sharing requires admin privileges" }, { status: 403 })
      }
      
      if (numeric.moduleId && !isAdmin && !canManageAll) {
        return NextResponse.json({ message: "Forbidden: Module sharing requires admin privileges" }, { status: 403 })
      }
      
      if (numeric.ownerId && !isAdmin && !canManageAll && numeric.ownerId !== Number(session.user.id)) {
        return NextResponse.json({ message: "Forbidden: Can only share your own content" }, { status: 403 })
      }
      
      // Collect content IDs by filters
      const whereClause: any = { isDeleted: false }
      if (numeric.projectId) whereClause.projectId = numeric.projectId as any
      if (numeric.moduleId) whereClause.moduleId = numeric.moduleId as any
      if (numeric.ownerId) whereClause.ownerId = numeric.ownerId as any
      if (Array.isArray(numeric.contentIds) && numeric.contentIds.length > 0) whereClause.id = { in: numeric.contentIds as any }

      const contents = await prisma.contentData.findMany({ where: whereClause, select: { id: true } })
      if (contents.length === 0) {
        return NextResponse.json({ message: "No content found for specified criteria" }, { status: 404 })
      }

      // Ensure target user exists
      const user = await prisma.user.findUnique({ where: { id: numeric.sharedWithId! as any } })
      if (!user) {
        return NextResponse.json({ message: "User not found" }, { status: 404 })
      }

      // Create batch record
      const scope: ShareScope = numeric.projectId
        ? ShareScope.PROJECT
        : numeric.moduleId
        ? ShareScope.MODULE
        : numeric.ownerId
        ? ShareScope.OWNER
        : ShareScope.LIST

      const batch = await prisma.shareBatch.create({
        data: {
          scope,
          sharedById: Number(session.user!.id) as any,
          sharedWithId: numeric.sharedWithId! as any,
          projectId: (numeric.projectId || null) as any,
          moduleId: (numeric.moduleId || null) as any,
          ownerId: (numeric.ownerId || null) as any,
          canView,
          canEdit,
          canDelete,
          canDownload,
          itemsCount: contents.length,
        },
      })

      // Smart sharing: Create new or update existing based on contentId + sharedWithId (unique constraint)
      const results = []
      for (const c of contents) {
        // Use upsert to handle existing shares (avoid unique constraint violation)
        const share = await prisma.contentShare.upsert({
          where: {
            contentId_sharedWithId: {
              contentId: c.id as any,
              sharedWithId: numeric.sharedWithId! as any
            }
          },
          update: {
            canView,
            canEdit,
            canDelete,
            canDownload,
            batchId: batch.id as any,
            status: 'ACTIVE',
            updatedAt: new Date()
          },
          create: {
            contentId: c.id as any,
            sharedById: Number(session.user!.id) as any,
            sharedWithId: numeric.sharedWithId! as any,
            canView,
            canEdit,
            canDelete,
            canDownload,
            batchId: batch.id as any,
            status: 'ACTIVE'
          }
        })
        results.push(share)
      }
      
      // Log audit for bulk share
      await createAuditLog({
        actorId: session.user.id,
        action: 'bulk_shared',
        entityType: 'ContentShare',
        entityId: String(batch.id),
        metadata: {
          scope: scope,
          sharedWithId: numeric.sharedWithId,
          projectId: numeric.projectId,
          moduleId: numeric.moduleId,
          ownerId: numeric.ownerId,
          contentCount: results.length,
          permissions: { canView, canEdit, canDelete, canDownload }
        }
      })
      
      return NextResponse.json({ data: { count: results.length, batchId: batch.id } }, { status: 201 })
    }

    // STANDARD SHARE: owner can share their own content
    if (!numeric.contentId || !numeric.sharedWithId) {
      return NextResponse.json({ message: "Content ID and shared with user ID are required" }, { status: 400 })
    }

    // Check if content exists and user has permission to share it
    const content = await prisma.contentData.findFirst({
      where: isAdmin
        ? { id: numeric.contentId as any }
        : { id: numeric.contentId as any, ownerId: Number(session.user.id) as any }
    })

    if (!content) {
      return NextResponse.json({ message: "Content not found or you don't have permission to share it" }, { status: 404 })
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: numeric.sharedWithId! as any }
    })

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    // Create batch for standard share (OWNER scope)
    const batch = await prisma.shareBatch.create({
      data: {
        scope: ShareScope.OWNER,
        sharedById: Number(session.user.id) as any,
        sharedWithId: numeric.sharedWithId! as any,
        ownerId: Number(session.user.id) as any,
        canView,
        canEdit,
        canDelete,
        canDownload,
        itemsCount: 1,
      },
    })

    // Check if there's an active share with same scope (OWNER scope for standard share)
    const existingShare = await prisma.contentShare.findFirst({
      where: {
        contentId: numeric.contentId! as any,
        sharedWithId: numeric.sharedWithId! as any,
        status: 'ACTIVE',
        batch: {
          scope: ShareScope.OWNER,
          sharedById: Number(session.user.id) as any
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (existingShare) {
      // Update existing share with same scope
      const updatedShare = await prisma.contentShare.update({
        where: {
          id: existingShare.id
        },
        data: {
          canView,
          canEdit,
          canDelete,
          canDownload,
          batchId: batch.id as any,
          updatedAt: new Date()
        },
        include: {
          content: {
            select: {
              id: true,
              title: true,
              contentType: true,
              status: true,
              project: {
                select: {
                  id: true,
                  name: true
                }
              },
              module: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          sharedBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          sharedWith: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      })
      
      // Log audit for share update
      await createAuditLog({
        actorId: session.user.id,
        action: 'updated',
        entityType: 'ContentShare',
        entityId: String(updatedShare.id),
        metadata: {
          contentId: numeric.contentId,
          contentTitle: updatedShare.content?.title,
          sharedWithId: numeric.sharedWithId,
          sharedWithEmail: updatedShare.sharedWith?.email,
          permissions: { canView, canEdit, canDelete, canDownload }
        }
      })

      return NextResponse.json({ data: updatedShare })
    } else {
      // Create new share
      const newShare = await prisma.contentShare.create({
        data: {
          contentId: numeric.contentId! as any,
          sharedById: Number(session.user.id) as any,
          sharedWithId: numeric.sharedWithId! as any,
          canView,
          canEdit,
          canDelete,
          canDownload,
          batchId: batch.id as any
        },
        include: {
          content: {
            select: {
              id: true,
              title: true,
              contentType: true,
              status: true,
              project: {
                select: {
                  id: true,
                  name: true
                }
              },
              module: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          sharedBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          sharedWith: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      })
      
      // Log audit for new share
      await createAuditLog({
        actorId: session.user.id,
        action: 'created',
        entityType: 'ContentShare',
        entityId: String(newShare.id),
        metadata: {
          contentId: numeric.contentId,
          contentTitle: newShare.content?.title,
          sharedWithId: numeric.sharedWithId,
          sharedWithEmail: newShare.sharedWith?.email,
          permissions: { canView, canEdit, canDelete, canDownload }
        }
      })

      return NextResponse.json({ data: newShare }, { status: 201 })
    }
  } catch (error) {
    console.error("Error sharing content:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const contentId = searchParams.get('contentId')
    const sharedWithId = searchParams.get('sharedWithId')

    if (!contentId || !sharedWithId) {
      return NextResponse.json({ message: "Content ID and shared with user ID are required" }, { status: 400 })
    }

    // Check if user has permission to remove the share
    const share = await prisma.contentShare.findFirst({
      where: {
        contentId: Number(contentId) as any,
        sharedWithId: Number(sharedWithId) as any,
        OR: [
          { sharedById: Number(session.user.id) as any },
          { sharedWithId: Number(session.user.id) as any }
        ]
      }
    })

    if (!share) {
      return NextResponse.json({ message: "Share not found or you don't have permission to remove it" }, { status: 404 })
    }

    await prisma.contentShare.delete({
      where: {
        id: share.id
      }
    })

    return NextResponse.json({ message: "Content share removed successfully" })
  } catch (error) {
    console.error("Error removing content share:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}