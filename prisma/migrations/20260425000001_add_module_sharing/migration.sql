-- CreateTable: ModuleShare for v2 module-level sharing
CREATE TABLE `ModuleShare` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `moduleId` INTEGER NOT NULL,
    `projectId` INTEGER NOT NULL,
    `sharedById` INTEGER NOT NULL,
    `sharedWithId` INTEGER NOT NULL,
    `permission` ENUM('VIEW', 'DOWNLOAD', 'EDIT') NOT NULL DEFAULT 'VIEW',
    `status` ENUM('ACTIVE', 'REVOKED') NOT NULL DEFAULT 'ACTIVE',
    `revokedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ModuleShare_sharedById_idx`(`sharedById`),
    INDEX `ModuleShare_sharedWithId_idx`(`sharedWithId`),
    INDEX `ModuleShare_moduleId_idx`(`moduleId`),
    INDEX `ModuleShare_projectId_idx`(`projectId`),
    UNIQUE INDEX `ModuleShare_moduleId_sharedWithId_key`(`moduleId`, `sharedWithId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ModuleShare` ADD CONSTRAINT `ModuleShare_moduleId_fkey` FOREIGN KEY (`moduleId`) REFERENCES `Module`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ModuleShare` ADD CONSTRAINT `ModuleShare_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ModuleShare` ADD CONSTRAINT `ModuleShare_sharedById_fkey` FOREIGN KEY (`sharedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ModuleShare` ADD CONSTRAINT `ModuleShare_sharedWithId_fkey` FOREIGN KEY (`sharedWithId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
