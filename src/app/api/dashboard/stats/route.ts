import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { hasPermission as checkPermission } from "@/lib/permissions"
import { PermissionName } from "@prisma/client"

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    console.log("Dashboard stats - Session:", session)
    
    if (!session?.user?.id) {
      console.log("Dashboard stats - No session or user ID")
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Check permission
    const hasAccess = await checkPermission(
      PermissionName.VIEW_DASHBOARD_STATS,
      session.user.id
    )
    console.log("Dashboard stats - Permission check result:", hasAccess)
    
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

    // Calculate date ranges
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Base where clause for content based on permissions
    let contentWhereClause: any = { isDeleted: false }
    if (!isAdmin && !canManageAll) {
      contentWhereClause.OR = [
        { ownerId: Number(session.user.id) as any },
        { shares: { some: { sharedWithId: Number(session.user.id) as any, canView: true, status: 'ACTIVE' } } }
      ]
    }

    // Get projects stats
    const projectsWhereClause = isAdmin ? {} : { 
      OR: [
        { contentData: { some: contentWhereClause } },
        { modules: { some: { contentData: { some: contentWhereClause } } } }
      ]
    }

    const [
      totalProjects,
      activeProjects,
      totalModules,
      activeModules,
      totalContent,
      todayContent,
      weekContent,
      monthContent,
      totalUsers,
      recentProjects,
      recentContent
    ] = await Promise.all([
      // Projects
      prisma.project.count({
        where: { ...projectsWhereClause, isDeleted: false }
      }),
      prisma.project.count({
        where: { ...projectsWhereClause, isDeleted: false, status: 'ACTIVE' }
      }),
      
      // Modules
      prisma.module.count({
        where: { 
          isDeleted: false,
          project: projectsWhereClause
        }
      }),
      prisma.module.count({
        where: { 
          isDeleted: false, 
          status: 'ACTIVE',
          project: projectsWhereClause
        }
      }),
      
      // Content
      prisma.contentData.count({
        where: contentWhereClause
      }),
      prisma.contentData.count({
        where: {
          ...contentWhereClause,
          createdAt: { gte: todayStart }
        }
      }),
      prisma.contentData.count({
        where: {
          ...contentWhereClause,
          createdAt: { gte: weekAgo }
        }
      }),
      prisma.contentData.count({
        where: {
          ...contentWhereClause,
          createdAt: { gte: monthAgo }
        }
      }),
      
      // Users (only for admin)
      isAdmin ? prisma.user.count({ where: { status: 'ACTIVE' } }) : 0,
      
      // Recent projects
      prisma.project.findMany({
        where: { ...projectsWhereClause, isDeleted: false },
        orderBy: { updatedAt: 'desc' },
        take: 5,
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
      }),
      
      // Recent content
      prisma.contentData.findMany({
        where: contentWhereClause,
        orderBy: { updatedAt: 'desc' },
        take: 5,
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
    ])

    // Calculate growth rates
    const contentGrowthWeek = weekAgo > monthAgo ? 
      Math.round(((weekContent - (monthContent - weekContent)) / Math.max(monthContent - weekContent, 1)) * 100) : 0

    const stats = {
      projects: {
        total: totalProjects,
        active: activeProjects,
        archived: totalProjects - activeProjects
      },
      modules: {
        total: totalModules,
        active: activeModules,
        inactive: totalModules - activeModules
      },
      content: {
        total: totalContent,
        today: todayContent,
        thisWeek: weekContent,
        thisMonth: monthContent,
        growthRate: contentGrowthWeek
      },
      users: {
        total: totalUsers
      },
      recent: {
        projects: recentProjects,
        content: recentContent
      }
    }

    return NextResponse.json({
      message: "Dashboard stats retrieved successfully",
      data: stats
    })
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
