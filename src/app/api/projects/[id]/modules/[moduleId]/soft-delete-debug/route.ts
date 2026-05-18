import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { hasPermission as checkPermission } from "@/lib/permissions"
import { PermissionName } from "@prisma/client"

type Params = { params: Promise<{ id: string; moduleId: string }> }

export async function POST(
  req: NextRequest,
  context: Params
) {
  try {
    const params = await context.params
    
    console.log('=== DEBUG SOFT DELETE MODULE ===')
    console.log('Module ID:', params.moduleId)
    console.log('Project ID:', params.id)
    
    const session = await getSession()
    console.log('Session exists:', !!session)
    console.log('User ID:', session?.user?.id)
    console.log('User roles:', session?.user?.roles)
    console.log('User permissions:', session?.user?.permissions)
    
    if (!session?.user?.id) {
      console.log('❌ FAILED: No session')
      return NextResponse.json({ 
        message: "Unauthorized",
        debug: { step: 'session', hasSession: false }
      }, { status: 401 })
    }

    // Check permission
    console.log('Checking permission SOFT_DELETE_MODULES for user:', session.user.id)
    const hasAccess = await checkPermission(
      PermissionName.SOFT_DELETE_MODULES,
      session.user.id
    )
    console.log('Has permission result:', hasAccess)
    
    if (!hasAccess) {
      console.log('❌ FAILED: No permission')
      
      // Get detailed permission info
      const user = await prisma.user.findUnique({
        where: { id: Number(session.user.id) as any },
        include: {
          roles: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: {
                      permission: true
                    }
                  }
                }
              }
            }
          }
        }
      })
      
      const userPerms = user?.roles.flatMap(ur => 
        ur.role.permissions.map(rp => rp.permission.name)
      )
      
      console.log('User actual permissions from DB:', userPerms)
      
      return NextResponse.json({ 
        message: "Forbidden",
        debug: {
          step: 'permission',
          hasAccess,
          requiredPermission: 'SOFT_DELETE_MODULES',
          userPermissions: userPerms,
          userRoles: user?.roles.map(ur => ur.role.name)
        }
      }, { status: 403 })
    }

    const { moduleId } = params

    // Check if module exists and not already deleted
    const module = await prisma.module.findUnique({
      where: { id: Number(moduleId) as any },
    })

    console.log('Module found:', !!module)
    console.log('Module already deleted:', module?.isDeleted)

    if (!module) {
      console.log('❌ FAILED: Module not found')
      return NextResponse.json({ message: "Module not found" }, { status: 404 })
    }

    if (module.isDeleted) {
      console.log('❌ FAILED: Module already deleted')
      return NextResponse.json(
        { message: "Module is already deleted" },
        { status: 400 }
      )
    }

    // Soft delete the module
    const updatedModule = await prisma.module.update({
      where: { id: Number(moduleId) as any },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    })

    console.log('✅ SUCCESS: Module soft deleted')
    console.log('================================')

    return NextResponse.json({
      message: "Module soft deleted successfully",
      data: updatedModule,
    })
  } catch (error) {
    console.error("Error soft deleting module:", error)
    return NextResponse.json(
      { message: "Internal server error", error: String(error) },
      { status: 500 }
    )
  }
}
