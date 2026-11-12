-- AlterTable
ALTER TABLE `Product` MODIFY `images` JSON NOT NULL,
    MODIFY `features` JSON NULL,
    MODIFY `includedKit` JSON NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `bio` VARCHAR(500) NULL,
    MODIFY `rating` DOUBLE NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `Review` (
    `id` VARCHAR(191) NOT NULL,
    `bookingId` VARCHAR(191) NOT NULL,
    `authorId` VARCHAR(191) NOT NULL,
    `targetId` VARCHAR(191) NOT NULL,
    `targetRole` ENUM('OWNER', 'RENTER') NOT NULL,
    `rating` INTEGER NOT NULL,
    `text` VARCHAR(1000) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Review_targetId_createdAt_idx`(`targetId`, `createdAt`),
    UNIQUE INDEX `Review_bookingId_authorId_key`(`bookingId`, `authorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Review` ADD CONSTRAINT `Review_bookingId_fkey` FOREIGN KEY (`bookingId`) REFERENCES `Booking`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Review` ADD CONSTRAINT `Review_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Review` ADD CONSTRAINT `Review_targetId_fkey` FOREIGN KEY (`targetId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;


-- Рейтинг тепер рахується з реальних відгуків; тестові значення з seed обнуляємо
UPDATE `User` SET `rating` = 0, `reviewsCount` = 0;
