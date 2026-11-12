-- AlterTable
ALTER TABLE `Booking` MODIFY `deliveryMethod` ENUM('PICKUP', 'COURIER') NOT NULL;

-- AlterTable
ALTER TABLE `Product` DROP COLUMN `postomatAddress`,
    MODIFY `images` JSON NOT NULL,
    MODIFY `features` JSON NULL,
    MODIFY `includedKit` JSON NULL;

