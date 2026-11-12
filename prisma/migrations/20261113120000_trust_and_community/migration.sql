-- AlterTable
ALTER TABLE `Booking` ADD COLUMN `bonusUsed` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `handoverPhotos` JSON NULL,
    ADD COLUMN `ownerCompensation` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `pickupPhotos` JSON NULL,
    MODIFY `status` ENUM('PAID', 'PICKED_UP', 'RETURNED', 'DISPUTED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PAID';

-- AlterTable
ALTER TABLE `Product` MODIFY `images` JSON NOT NULL,
    MODIFY `features` JSON NULL,
    MODIFY `includedKit` JSON NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `blockedAt` DATETIME(3) NULL,
    ADD COLUMN `blockedReason` VARCHAR(300) NULL,
    ADD COLUMN `referralCode` VARCHAR(16) NULL,
    ADD COLUMN `referredById` VARCHAR(191) NULL,
    ADD COLUMN `verifiedVia` VARCHAR(16) NULL;

-- CreateTable
CREATE TABLE `Message` (
    `id` VARCHAR(191) NOT NULL,
    `bookingId` VARCHAR(191) NOT NULL,
    `senderId` VARCHAR(191) NOT NULL,
    `text` VARCHAR(2000) NOT NULL,
    `readAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Message_bookingId_createdAt_idx`(`bookingId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Notification` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(40) NOT NULL,
    `title` VARCHAR(150) NOT NULL,
    `body` VARCHAR(500) NULL,
    `link` VARCHAR(255) NULL,
    `dedupeKey` VARCHAR(191) NULL,
    `readAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Notification_dedupeKey_key`(`dedupeKey`),
    INDEX `Notification_userId_readAt_createdAt_idx`(`userId`, `readAt`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Dispute` (
    `id` VARCHAR(191) NOT NULL,
    `bookingId` VARCHAR(191) NOT NULL,
    `openedById` VARCHAR(191) NOT NULL,
    `reason` TEXT NOT NULL,
    `photos` JSON NOT NULL,
    `claimAmount` INTEGER NOT NULL,
    `status` ENUM('OPEN', 'CONTESTED', 'RESOLVED') NOT NULL DEFAULT 'OPEN',
    `renterResponse` TEXT NULL,
    `resolution` TEXT NULL,
    `awardedFromDeposit` INTEGER NOT NULL DEFAULT 0,
    `awardedFromFund` INTEGER NOT NULL DEFAULT 0,
    `resolvedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `resolvedAt` DATETIME(3) NULL,

    UNIQUE INDEX `Dispute_bookingId_key`(`bookingId`),
    INDEX `Dispute_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ItemRequest` (
    `id` VARCHAR(191) NOT NULL,
    `authorId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(150) NOT NULL,
    `description` VARCHAR(1000) NULL,
    `category` ENUM('repair', 'home', 'tech', 'tourism', 'sport', 'kids', 'transport', 'gaming', 'pets', 'garden', 'events', 'music', 'fashion') NULL,
    `city` VARCHAR(80) NULL,
    `maxPricePerDay` INTEGER NULL,
    `neededFrom` DATE NULL,
    `neededTo` DATE NULL,
    `status` ENUM('OPEN', 'CLOSED') NOT NULL DEFAULT 'OPEN',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ItemRequest_status_createdAt_idx`(`status`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RequestOffer` (
    `id` VARCHAR(191) NOT NULL,
    `requestId` VARCHAR(191) NOT NULL,
    `ownerId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `message` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `RequestOffer_requestId_productId_key`(`requestId`, `productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BonusTransaction` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `amount` INTEGER NOT NULL,
    `reason` VARCHAR(40) NOT NULL,
    `bookingId` VARCHAR(191) NULL,
    `uniqueKey` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `BonusTransaction_uniqueKey_key`(`uniqueKey`),
    INDEX `BonusTransaction_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Report` (
    `id` VARCHAR(191) NOT NULL,
    `reporterId` VARCHAR(191) NOT NULL,
    `targetType` ENUM('PRODUCT', 'USER') NOT NULL,
    `productId` VARCHAR(191) NULL,
    `targetUserId` VARCHAR(191) NULL,
    `reason` VARCHAR(40) NOT NULL,
    `details` VARCHAR(1000) NULL,
    `status` ENUM('OPEN', 'RESOLVED', 'DISMISSED') NOT NULL DEFAULT 'OPEN',
    `adminNote` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `resolvedAt` DATETIME(3) NULL,

    INDEX `Report_status_createdAt_idx`(`status`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RateLimitHit` (
    `id` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `RateLimitHit_key_createdAt_idx`(`key`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VerificationRequest` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `method` VARCHAR(16) NOT NULL,
    `bank` VARCHAR(40) NULL,
    `code` VARCHAR(16) NOT NULL,
    `status` VARCHAR(16) NOT NULL DEFAULT 'PENDING',
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `VerificationRequest_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `User_referralCode_key` ON `User`(`referralCode`);

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_referredById_fkey` FOREIGN KEY (`referredById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_bookingId_fkey` FOREIGN KEY (`bookingId`) REFERENCES `Booking`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Dispute` ADD CONSTRAINT `Dispute_bookingId_fkey` FOREIGN KEY (`bookingId`) REFERENCES `Booking`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Dispute` ADD CONSTRAINT `Dispute_openedById_fkey` FOREIGN KEY (`openedById`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ItemRequest` ADD CONSTRAINT `ItemRequest_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RequestOffer` ADD CONSTRAINT `RequestOffer_requestId_fkey` FOREIGN KEY (`requestId`) REFERENCES `ItemRequest`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RequestOffer` ADD CONSTRAINT `RequestOffer_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RequestOffer` ADD CONSTRAINT `RequestOffer_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BonusTransaction` ADD CONSTRAINT `BonusTransaction_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Report` ADD CONSTRAINT `Report_reporterId_fkey` FOREIGN KEY (`reporterId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Report` ADD CONSTRAINT `Report_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Report` ADD CONSTRAINT `Report_targetUserId_fkey` FOREIGN KEY (`targetUserId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VerificationRequest` ADD CONSTRAINT `VerificationRequest_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

