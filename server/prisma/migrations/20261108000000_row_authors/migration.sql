-- Who added each archive / shopping row. A restricted member (contractor) may change or remove only rows they added;
-- before this they could delete the client's documents, photos and reminders. Existing rows stay NULL (= the client's).
ALTER TABLE `Contact` ADD COLUMN `authorId` VARCHAR(191) NULL;
ALTER TABLE `ShoppingItem` ADD COLUMN `authorId` VARCHAR(191) NULL;
ALTER TABLE `Reminder` ADD COLUMN `authorId` VARCHAR(191) NULL;
ALTER TABLE `Document` ADD COLUMN `authorId` VARCHAR(191) NULL;
ALTER TABLE `GalleryItem` ADD COLUMN `authorId` VARCHAR(191) NULL;
ALTER TABLE `Inspiration` ADD COLUMN `authorId` VARCHAR(191) NULL;
