-- Add content versioning support
-- This migration is additive only - no existing data is affected

-- Add launchFile column to ContentData (nullable, safe for existing rows)
ALTER TABLE `ContentData` ADD COLUMN `launchFile` VARCHAR(191) NULL;

-- Create ContentVersion table
CREATE TABLE `ContentVersion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `version` INTEGER NOT NULL,
    `contentUrl` VARCHAR(191) NOT NULL,
    `launchFile` VARCHAR(191) NULL,
    `fileSize` INTEGER NULL,
    `status` ENUM('PROCESSING', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'PROCESSING',
    `errorMessage` VARCHAR(191) NULL,
    `contentId` INTEGER NOT NULL,
    `createdById` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ContentVersion_contentId_idx`(`contentId`),
    UNIQUE INDEX `ContentVersion_contentId_version_key`(`contentId`, `version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Add foreign key constraints
ALTER TABLE `ContentVersion` ADD CONSTRAINT `ContentVersion_contentId_fkey` FOREIGN KEY (`contentId`) REFERENCES `ContentData`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ContentVersion` ADD CONSTRAINT `ContentVersion_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
