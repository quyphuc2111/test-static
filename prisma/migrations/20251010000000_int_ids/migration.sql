-- DropForeignKey
ALTER TABLE `AuditLog` DROP FOREIGN KEY `AuditLog_actorId_fkey`;

-- DropForeignKey
ALTER TABLE `ContentData` DROP FOREIGN KEY `ContentData_moduleId_fkey`;

-- DropForeignKey
ALTER TABLE `ContentData` DROP FOREIGN KEY `ContentData_ownerId_fkey`;

-- DropForeignKey
ALTER TABLE `ContentData` DROP FOREIGN KEY `ContentData_projectId_fkey`;

-- DropForeignKey
ALTER TABLE `ContentShare` DROP FOREIGN KEY `ContentShare_batchId_fkey`;

-- DropForeignKey
ALTER TABLE `ContentShare` DROP FOREIGN KEY `ContentShare_contentId_fkey`;

-- DropForeignKey
ALTER TABLE `ContentShare` DROP FOREIGN KEY `ContentShare_sharedById_fkey`;

-- DropForeignKey
ALTER TABLE `ContentShare` DROP FOREIGN KEY `ContentShare_sharedWithId_fkey`;

-- DropForeignKey
ALTER TABLE `Module` DROP FOREIGN KEY `Module_projectId_fkey`;

-- DropForeignKey
ALTER TABLE `RolePermission` DROP FOREIGN KEY `RolePermission_permissionId_fkey`;

-- DropForeignKey
ALTER TABLE `RolePermission` DROP FOREIGN KEY `RolePermission_roleId_fkey`;

-- DropForeignKey
ALTER TABLE `ShareBatch` DROP FOREIGN KEY `ShareBatch_sharedById_fkey`;

-- DropForeignKey
ALTER TABLE `ShareBatch` DROP FOREIGN KEY `ShareBatch_sharedWithId_fkey`;

-- DropForeignKey
ALTER TABLE `UserPermission` DROP FOREIGN KEY `UserPermission_permissionId_fkey`;

-- DropForeignKey
ALTER TABLE `UserPermission` DROP FOREIGN KEY `UserPermission_userId_fkey`;

-- DropForeignKey
ALTER TABLE `UserRole` DROP FOREIGN KEY `UserRole_roleId_fkey`;

-- DropForeignKey
ALTER TABLE `UserRole` DROP FOREIGN KEY `UserRole_userId_fkey`;

-- AlterTable
ALTER TABLE `AuditLog` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    MODIFY `actorId` INTEGER NULL,
    MODIFY `entityId` INTEGER NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `ContentData` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    MODIFY `projectId` INTEGER NOT NULL,
    MODIFY `moduleId` INTEGER NOT NULL,
    MODIFY `ownerId` INTEGER NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `ContentShare` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    MODIFY `contentId` INTEGER NOT NULL,
    MODIFY `sharedById` INTEGER NOT NULL,
    MODIFY `sharedWithId` INTEGER NOT NULL,
    MODIFY `batchId` INTEGER NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `Module` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    MODIFY `projectId` INTEGER NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `Permission` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `Project` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `Role` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `RolePermission` DROP PRIMARY KEY,
    MODIFY `roleId` INTEGER NOT NULL,
    MODIFY `permissionId` INTEGER NOT NULL,
    ADD PRIMARY KEY (`roleId`, `permissionId`);

-- AlterTable
ALTER TABLE `ShareBatch` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    MODIFY `sharedById` INTEGER NOT NULL,
    MODIFY `sharedWithId` INTEGER NOT NULL,
    MODIFY `projectId` INTEGER NULL,
    MODIFY `moduleId` INTEGER NULL,
    MODIFY `ownerId` INTEGER NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `User` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `UserPermission` DROP PRIMARY KEY,
    MODIFY `userId` INTEGER NOT NULL,
    MODIFY `permissionId` INTEGER NOT NULL,
    ADD PRIMARY KEY (`userId`, `permissionId`);

-- AlterTable
ALTER TABLE `UserRole` DROP PRIMARY KEY,
    MODIFY `userId` INTEGER NOT NULL,
    MODIFY `roleId` INTEGER NOT NULL,
    ADD PRIMARY KEY (`userId`, `roleId`);

-- AddForeignKey
ALTER TABLE `ContentData` ADD CONSTRAINT `ContentData_moduleId_fkey` FOREIGN KEY (`moduleId`) REFERENCES `Module`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ContentData` ADD CONSTRAINT `ContentData_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ContentData` ADD CONSTRAINT `ContentData_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Module` ADD CONSTRAINT `Module_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RolePermission` ADD CONSTRAINT `RolePermission_permissionId_fkey` FOREIGN KEY (`permissionId`) REFERENCES `Permission`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RolePermission` ADD CONSTRAINT `RolePermission_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Role`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserRole` ADD CONSTRAINT `UserRole_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Role`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserRole` ADD CONSTRAINT `UserRole_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserPermission` ADD CONSTRAINT `UserPermission_permissionId_fkey` FOREIGN KEY (`permissionId`) REFERENCES `Permission`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserPermission` ADD CONSTRAINT `UserPermission_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ContentShare` ADD CONSTRAINT `ContentShare_batchId_fkey` FOREIGN KEY (`batchId`) REFERENCES `ShareBatch`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ContentShare` ADD CONSTRAINT `ContentShare_contentId_fkey` FOREIGN KEY (`contentId`) REFERENCES `ContentData`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ContentShare` ADD CONSTRAINT `ContentShare_sharedById_fkey` FOREIGN KEY (`sharedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ContentShare` ADD CONSTRAINT `ContentShare_sharedWithId_fkey` FOREIGN KEY (`sharedWithId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ShareBatch` ADD CONSTRAINT `ShareBatch_sharedById_fkey` FOREIGN KEY (`sharedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ShareBatch` ADD CONSTRAINT `ShareBatch_sharedWithId_fkey` FOREIGN KEY (`sharedWithId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_actorId_fkey` FOREIGN KEY (`actorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

