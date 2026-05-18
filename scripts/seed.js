/* eslint-disable no-console */
// Load environment variables
require('dotenv').config()

const { PrismaClient, PermissionName, UserStatus } = require("@prisma/client")
const bcrypt = require("bcryptjs")

const prisma = new PrismaClient()

async function main() {
  // 1) Ensure all permissions exist
  const allPermissions = Object.values(PermissionName)
  await Promise.all(
    allPermissions.map((name) =>
      prisma.permission.upsert({
        where: { name },
        update: {},
        create: { name },
      })
    )
  )

  // 2) Ensure ADMINISTRATOR, DEV, TESTER roles exist
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMINISTRATOR' },
    update: {},
    create: { name: 'ADMINISTRATOR' },
  })
  const devRole = await prisma.role.upsert({
    where: { name: 'DEV' },
    update: {},
    create: { name: 'DEV' },
  })
  const testerRole = await prisma.role.upsert({
    where: { name: 'TESTER' },
    update: {},
    create: { name: 'TESTER' },
  })

  // 3) Grant all permissions to ADMINISTRATOR
  const perms = await prisma.permission.findMany()
  await Promise.all(
    perms.map((p) =>
      prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: adminRole.id, permissionId: p.id } },
        update: {},
        create: { roleId: adminRole.id, permissionId: p.id },
      })
    )
  )

  // 4) Create admin user if not exists
  const email = "admin@docmanager.com"
  const password = "admin123"
  const passwordHash = await bcrypt.hash(password, 10)

  const adminUser = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      email,
      name: "Administrator",
      username: "admin",
      passwordHash,
      status: UserStatus.ACTIVE,
    },
  })

  // 5) Attach ADMIN role to user
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
    update: {},
    create: { userId: adminUser.id, roleId: adminRole.id },
  })

  console.log("Seed completed. Admin account:")
  console.log({ email, password })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


