-- AlterTable
ALTER TABLE `Member` ADD COLUMN `inviteToken` VARCHAR(64) NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `tokenVersion` INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX `Member_inviteToken_key` ON `Member`(`inviteToken`);

