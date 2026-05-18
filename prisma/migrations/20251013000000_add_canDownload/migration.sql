-- Add canDownload column to ContentShare table
ALTER TABLE `ContentShare` 
ADD COLUMN `canDownload` BOOLEAN NOT NULL DEFAULT true 
AFTER `canView`;

-- Add canDownload column to ShareBatch table
ALTER TABLE `ShareBatch` 
ADD COLUMN `canDownload` BOOLEAN NOT NULL DEFAULT true 
AFTER `canView`;

