-- A task completion update points at its task: approving it marks the task done, rejecting it reopens the task.
-- AlterTable
ALTER TABLE `Update` ADD COLUMN `taskId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `Update_taskId_idx` ON `Update`(`taskId`);

-- AddForeignKey
ALTER TABLE `Update` ADD CONSTRAINT `Update_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `Task`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
