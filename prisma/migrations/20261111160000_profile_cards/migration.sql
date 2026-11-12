-- AlterTable
ALTER TABLE `Product` MODIFY `images` JSON NOT NULL,
    MODIFY `features` JSON NULL,
    MODIFY `includedKit` JSON NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `avatarUrl` VARCHAR(255) NULL,
    ADD COLUMN `firstName` VARCHAR(50) NOT NULL DEFAULT '',
    ADD COLUMN `lastName` VARCHAR(50) NOT NULL DEFAULT '',
    ADD COLUMN `verifiedAt` DATETIME(3) NULL,
    MODIFY `isVerified` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `PaymentCard` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `brand` VARCHAR(16) NOT NULL,
    `last4` CHAR(4) NOT NULL,
    `expMonth` INTEGER NOT NULL,
    `expYear` INTEGER NOT NULL,
    `holder` VARCHAR(100) NOT NULL,
    `label` VARCHAR(50) NULL,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PaymentCard_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PaymentCard` ADD CONSTRAINT `PaymentCard_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;


-- Розкладаємо наявне повне ім'я на ім'я та прізвище; верифікованим — дата верифікації
UPDATE `User`
SET `firstName` = LEFT(SUBSTRING_INDEX(TRIM(`name`), ' ', 1), 50),
    `lastName`  = LEFT(TRIM(SUBSTRING(TRIM(`name`), CHAR_LENGTH(SUBSTRING_INDEX(TRIM(`name`), ' ', 1)) + 1)), 50);
UPDATE `User` SET `verifiedAt` = `createdAt` WHERE `isVerified` = true AND `verifiedAt` IS NULL;
