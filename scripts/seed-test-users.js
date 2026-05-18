// Load environment variables
require('dotenv').config()

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function seedTestUsers() {
  console.log('👤 Creating test users...')

  try {
    // Get roles
    const adminRole = await prisma.role.findUnique({ where: { name: 'ADMINISTRATOR' } })
    const devRole = await prisma.role.findUnique({ where: { name: 'DEV' } })
    const testerRole = await prisma.role.findUnique({ where: { name: 'TESTER' } })

    if (!adminRole || !devRole || !testerRole) {
      throw new Error('Roles not found. Please run seed-rbac.js first.')
    }

    // Create test users
    const testUsers = [
      {
        email: 'admin@example.com',
        name: 'Nguyễn Văn Admin',
      username: 'admin',
        passwordHash: await bcrypt.hash('admin123', 10),
        status: 'ACTIVE',
        roleId: adminRole.id,
        roleName: 'ADMINISTRATOR'
      },
      {
        email: 'dev@example.com',
        name: 'Trần Thị Developer',
      username: 'dev',
        passwordHash: await bcrypt.hash('dev123', 10),
        status: 'ACTIVE',
        roleId: devRole.id,
        roleName: 'DEV'
      },
      {
        email: 'tester@example.com',
        name: 'Lê Văn Tester',
      username: 'tester',
        passwordHash: await bcrypt.hash('tester123', 10),
        status: 'ACTIVE',
        roleId: testerRole.id,
        roleName: 'TESTER'
      }
    ]

    for (const userData of testUsers) {
      // Create user
      const user = await prisma.user.upsert({
        where: { username: userData.username },
        update: {
          name: userData.name,
          passwordHash: userData.passwordHash,
          status: userData.status
        },
        create: {
          email: userData.email,
          name: userData.name,
          username: userData.username,
          passwordHash: userData.passwordHash,
          status: userData.status
        }
      })

      // Assign role to user
      await prisma.userRole.upsert({
        where: {
          userId_roleId: {
            userId: user.id,
            roleId: userData.roleId
          }
        },
        update: {},
        create: {
          userId: user.id,
          roleId: userData.roleId
        }
      })

      console.log(`✅ Created ${userData.roleName} user: ${userData.email}`)
    }

    console.log('🎉 Test users created successfully!')
    console.log('\n📋 Test Account Credentials:')
    console.log('┌─────────────────┬─────────────────┬──────────────┐')
    console.log('│ Email           │ Password        │ Role         │')
    console.log('├─────────────────┼─────────────────┼──────────────┤')
    console.log('│ admin@example.com │ admin123       │ ADMINISTRATOR│')
    console.log('│ dev@example.com   │ dev123         │ DEV          │')
    console.log('│ tester@example.com│ tester123      │ TESTER       │')
    console.log('└─────────────────┴─────────────────┴──────────────┘')

  } catch (error) {
    console.error('❌ Error creating test users:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run if called directly
if (require.main === module) {
  seedTestUsers()
    .then(() => {
      console.log('✅ Test users seeding completed!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Test users seeding failed:', error)
      process.exit(1)
    })
}

module.exports = { seedTestUsers }
