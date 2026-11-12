-- AlterTable
ALTER TABLE `Booking` ADD COLUMN `ownerCommission` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `ownerPayout` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `Product` MODIFY `images` JSON NOT NULL,
    MODIFY `features` JSON NULL,
    MODIFY `includedKit` JSON NULL;


-- Наявні бронювання: власник отримує оренду мінус 15% (фінансова модель, розділ 2).
-- Сума, яку вже сплатив орендар (serviceFee, protectionCost, totalAmount), не змінюється.
UPDATE `Booking`
SET `ownerCommission` = ROUND(`rentAmount` * 0.15),
    `ownerPayout` = `rentAmount` - ROUND(`rentAmount` * 0.15);
