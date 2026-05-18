import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { hasPermission as checkPermission } from "@/lib/permissions"
import { PermissionName } from "@prisma/client"

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Check permission
    const hasAccess = await checkPermission(
      PermissionName.VIEW_DASHBOARD_STATS,
      session.user.id
    )
    if (!hasAccess) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    // Get user's role to determine data scope
    const userRoles = await prisma.userRole.findMany({
      where: { userId: Number(session.user.id) as any },
      include: { role: true }
    })

    const isAdmin = userRoles.some(ur => ur.role.name === 'ADMINISTRATOR')
    const canManageAll = await checkPermission(PermissionName.MANAGE_ALL_CONTENT, session.user.id)

    // Base where clause for content based on permissions
    let contentWhereClause: any = { isDeleted: false }
    if (!isAdmin && !canManageAll) {
      contentWhereClause.OR = [
        { ownerId: Number(session.user.id) as any },
        { shares: { some: { sharedWithId: Number(session.user.id) as any, canView: true, status: 'ACTIVE' } } }
      ]
    }

    // Get recent activities from audit logs
    const recentActivities = await prisma.auditLog.findMany({
      where: {
        OR: [
          { actorId: Number(session.user.id) as any }, // User's own actions
          ...(isAdmin || canManageAll ? [{}] : []) // Admin can see all
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        actor: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    // Get recent content updates
    const recentContentUpdates = await prisma.contentData.findMany({
      where: {
        ...contentWhereClause,
        updatedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
      select: {
        id: true,
        title: true,
        contentType: true,
        status: true,
        updatedAt: true,
        project: { select: { name: true } },
        module: { select: { name: true } },
        owner: { select: { name: true, email: true } }
      }
    })

    // Get recent project updates
    const recentProjectUpdates = await prisma.project.findMany({
      where: {
        isDeleted: false,
        updatedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        updatedAt: true,
        _count: {
          select: {
            modules: { where: { isDeleted: false } },
            contentData: { where: { isDeleted: false } }
          }
        }
      }
    })

    // Get recent user activities (if admin)
    const recentUserActivities = isAdmin ? await prisma.user.findMany({
      where: {
        updatedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
      },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        updatedAt: true
      }
    }) : []

    // Combine and sort all activities
    const allActivities = [
      ...recentActivities.map(activity => ({
        id: activity.id,
        type: 'audit' as const,
        action: activity.action,
        entityType: activity.entityType,
        entityId: activity.entityId,
        actor: activity.actor,
        createdAt: activity.createdAt,
        metadata: activity.metadata
      })),
      ...recentContentUpdates.map(content => ({
        id: `content-${content.id}`,
        type: 'content' as const,
        action: 'updated',
        entityType: 'ContentData',
        entityId: content.id,
        actor: content.owner,
        createdAt: content.updatedAt,
        metadata: {
          title: content.title,
          contentType: content.contentType,
          projectName: content.project.name,
          moduleName: content.module.name
        }
      })),
      ...recentProjectUpdates.map(project => ({
        id: `project-${project.id}`,
        type: 'project' as const,
        action: 'updated',
        entityType: 'Project',
        entityId: project.id,
        actor: null, // Project doesn't have direct owner
        createdAt: project.updatedAt,
        metadata: {
          name: project.name,
          description: project.description,
          status: project.status,
          modulesCount: project._count.modules,
          contentCount: project._count.contentData
        }
      })),
      ...recentUserActivities.map(user => ({
        id: `user-${user.id}`,
        type: 'user' as const,
        action: 'updated',
        entityType: 'User',
        entityId: user.id,
        actor: null,
        createdAt: user.updatedAt,
        metadata: {
          name: user.name,
          email: user.email,
          status: user.status
        }
      }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 20)

    return NextResponse.json({
      message: "Recent activity retrieved successfully",
      data: allActivities
    })
  } catch (error) {
    console.error("Error fetching recent activity:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
