-- DropForeignKey
ALTER TABLE `Product` DROP FOREIGN KEY `Product_ownerId_fkey`;

-- AlterTable
ALTER TABLE `Product` ADD COLUMN `buybackPercent` INTEGER NOT NULL DEFAULT 30,
    ADD COLUMN `fullTitle` VARCHAR(255) NULL,
    ADD COLUMN `includedKit` JSON NULL,
    ADD COLUMN `marketBuyPrice` INTEGER NULL,
    ADD COLUMN `postomatAddress` VARCHAR(255) NULL,
    ADD COLUMN `price3Days` INTEGER NULL,
    ADD COLUMN `priceWeek` INTEGER NULL,
    ADD COLUMN `rentalCount` INTEGER NOT NULL DEFAULT 0,
    MODIFY `name` VARCHAR(150) NOT NULL,
    MODIFY `category` ENUM('repair', 'tech', 'tourism', 'sport', 'kids', 'transport', 'gaming') NOT NULL,
    MODIFY `images` JSON NOT NULL,
    MODIFY `rentalPricePerDay` INTEGER NOT NULL,
    MODIFY `depositAmount` INTEGER NOT NULL,
    MODIFY `purchasePrice` INTEGER NULL,
    MODIFY `location` VARCHAR(150) NOT NULL,
    MODIFY `status` ENUM('AVAILABLE', 'RENTED', 'HIDDEN') NOT NULL DEFAULT 'AVAILABLE',
    MODIFY `condition` VARCHAR(32) NOT NULL DEFAULT 'GOOD',
    MODIFY `features` JSON NULL;

-- CreateIndex
CREATE INDEX `Product_category_idx` ON `Product`(`category`);

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `Product` RENAME INDEX `Product_ownerId_fkey` TO `Product_ownerId_idx`;

