// Load environment variables from .env file
require('dotenv').config()

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedRBAC() {
  console.log('🌱 Seeding RBAC data...')

  try {
    // Create permissions based on schema with Vietnamese names
    const permissions = [
      // Content Management - CRUD
      { name: 'VIEW_CONTENT', nameVi: 'Xem nội dung', description: 'View content' },
      { name: 'CREATE_CONTENT', nameVi: 'Tạo nội dung', description: 'Create new content' },
      { name: 'EDIT_CONTENT', nameVi: 'Chỉnh sửa nội dung', description: 'Edit content' },
      { name: 'DOWNLOAD_CONTENT', nameVi: 'Tải xuống nội dung', description: 'Download content' },
      { name: 'SOFT_DELETE_CONTENT', nameVi: 'Xóa mềm nội dung', description: 'Soft delete content (recoverable)' },
      { name: 'HARD_DELETE_CONTENT', nameVi: 'Xóa vĩnh viễn nội dung', description: 'Permanently delete content' },
      { name: 'VIEW_DELETED_ALL_CONTENT', nameVi: 'Xem tất cả nội dung đã xóa', description: 'View all deleted content' },
      { name: 'VIEW_DELETED_OWN_CONTENT', nameVi: 'Xem nội dung đã xóa của mình', description: 'View own deleted content' },
      { name: 'RESTORE_CONTENT', nameVi: 'Khôi phục nội dung', description: 'Restore deleted content' },
      
      // Content Scope
      { name: 'MANAGE_ALL_CONTENT', nameVi: 'Quản lý tất cả nội dung', description: 'Manage all content (override ownership)' },
      { name: 'MANAGE_OWN_CONTENT', nameVi: 'Quản lý nội dung của mình', description: 'Only manage own content' },
      { name: 'VIEW_OWN_CONTENT_ONLY', nameVi: 'Chỉ xem nội dung của mình', description: 'Restricted to viewing only own content' },
      
      // Content Sharing
      { name: 'VIEW_SHARED_CONTENT', nameVi: 'Xem nội dung được chia sẻ', description: 'View shared content' },
      { name: 'SHARE_CONTENT_ACCESS', nameVi: 'Chia sẻ quyền truy cập nội dung', description: 'Share content access' },
      
      // Project Management - CRUD
      { name: 'VIEW_PROJECTS', nameVi: 'Xem dự án', description: 'View projects' },
      { name: 'CREATE_PROJECTS', nameVi: 'Tạo dự án', description: 'Create new projects' },
      { name: 'EDIT_PROJECTS', nameVi: 'Chỉnh sửa dự án', description: 'Edit projects' },
      { name: 'SOFT_DELETE_PROJECTS', nameVi: 'Xóa mềm dự án', description: 'Soft delete projects' },
      { name: 'HARD_DELETE_PROJECTS', nameVi: 'Xóa vĩnh viễn dự án', description: 'Permanently delete projects' },
      { name: 'VIEW_DELETED_PROJECTS', nameVi: 'Xem dự án đã xóa', description: 'View deleted projects' },
      { name: 'RESTORE_PROJECTS', nameVi: 'Khôi phục dự án', description: 'Restore deleted projects' },
      
      // Module Management - CRUD
      { name: 'VIEW_MODULES', nameVi: 'Xem module', description: 'View modules' },
      { name: 'CREATE_MODULES', nameVi: 'Tạo module', description: 'Create new modules' },
      { name: 'EDIT_MODULES', nameVi: 'Chỉnh sửa module', description: 'Edit modules' },
      { name: 'SOFT_DELETE_MODULES', nameVi: 'Xóa mềm module', description: 'Soft delete modules' },
      { name: 'HARD_DELETE_MODULES', nameVi: 'Xóa vĩnh viễn module', description: 'Permanently delete modules' },
      { name: 'VIEW_DELETED_MODULES', nameVi: 'Xem module đã xóa', description: 'View deleted modules' },
      { name: 'RESTORE_MODULES', nameVi: 'Khôi phục module', description: 'Restore deleted modules' },
      
      // User Management - CRUD
      { name: 'VIEW_USERS', nameVi: 'Xem người dùng', description: 'View users' },
      { name: 'CREATE_USERS', nameVi: 'Tạo người dùng', description: 'Create users' },
      { name: 'EDIT_USERS', nameVi: 'Chỉnh sửa người dùng', description: 'Edit users' },
      { name: 'SOFT_DELETE_USERS', nameVi: 'Vô hiệu hóa người dùng', description: 'Disable users' },
      { name: 'HARD_DELETE_USERS', nameVi: 'Xóa vĩnh viễn người dùng', description: 'Permanently delete users' },
      { name: 'MANAGE_USER_PERMISSIONS', nameVi: 'Quản lý quyền người dùng', description: 'Manage user roles and permissions' },
      
      // Audit & Dashboard
      { name: 'VIEW_AUDIT_LOGS', nameVi: 'Xem nhật ký kiểm toán', description: 'View audit logs' },
      { name: 'VIEW_DASHBOARD_STATS', nameVi: 'Xem thống kê dashboard', description: 'View dashboard statistics' }
    ]

    console.log('📝 Creating permissions...')
    for (const perm of permissions) {
      await prisma.permission.upsert({
        where: { name: perm.name },
        update: { nameVi: perm.nameVi, description: perm.description },
        create: perm
      })
    }

    // Create roles
    console.log('👥 Creating roles...')
    
    // Administrator role
    const adminRole = await prisma.role.upsert({
      where: { name: 'ADMINISTRATOR' },
      update: {},
      create: {
        name: 'ADMINISTRATOR',
        description: 'Quản trị viên với quyền truy cập đầy đủ'
      }
    })

    // Developer role
    const devRole = await prisma.role.upsert({
      where: { name: 'DEV' },
      update: {},
      create: {
        name: 'DEV',
        description: 'Nhà phát triển với quyền truy cập kỹ thuật'
      }
    })

    // Tester role
    const testerRole = await prisma.role.upsert({
      where: { name: 'TESTER' },
      update: {},
      create: {
        name: 'TESTER',
        description: 'Người kiểm thử với quyền xem và test'
      }
    })

    // Assign permissions to roles
    console.log('🔗 Assigning permissions to roles...')
    
    // Administrator gets all permissions
    const allPermissions = await prisma.permission.findMany()
    for (const permission of allPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: adminRole.id,
            permissionId: permission.id
          }
        },
        update: {},
        create: {
          roleId: adminRole.id,
          permissionId: permission.id
        }
      })
    }

    // Developer gets content and project management permissions (own content + some global)
    const devPermissions = await prisma.permission.findMany({
      where: {
        name: {
          in: [
            // Content permissions
            'VIEW_CONTENT', 'CREATE_CONTENT', 'EDIT_CONTENT', 'DOWNLOAD_CONTENT', 
            'SOFT_DELETE_CONTENT', 'VIEW_DELETED_OWN_CONTENT', 'RESTORE_CONTENT', 'VIEW_OWN_CONTENT_ONLY',
            'VIEW_SHARED_CONTENT',
            // Project permissions
            'VIEW_PROJECTS',
            // Module permissions
            'VIEW_MODULES'
          ]
        }
      }
    })
    for (const permission of devPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: devRole.id,
            permissionId: permission.id
          }
        },
        update: {},
        create: {
          roleId: devRole.id,
          permissionId: permission.id
        }
      })
    }

    // Tester gets view shared content permissions only
    const testerPermissions = await prisma.permission.findMany({
      where: {
        name: {
          in: [
            'VIEW_SHARED_CONTENT',
            'VIEW_PROJECTS',
            'VIEW_MODULES',
            'DOWNLOAD_CONTENT'
          ]
        }
      }
    })
    for (const permission of testerPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: testerRole.id,
            permissionId: permission.id
          }
        },
        update: {},
        create: {
          roleId: testerRole.id,
          permissionId: permission.id
        }
      })
    }

    console.log('✅ RBAC seeding completed!')
    console.log(`📊 Created ${permissions.length} permissions`)
    console.log(`👥 Created 3 roles: Administrator, Developer, Tester`)

  } catch (error) {
    console.error('❌ Error seeding RBAC:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the seed function
if (require.main === module) {
  seedRBAC()
    .catch((e) => {
      console.error(e)
      process.exit(1)
    })
}

module.exports = { seedRBAC }
