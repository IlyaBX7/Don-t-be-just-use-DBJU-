-- AlterTable
ALTER TABLE `Product` ADD COLUMN `city` VARCHAR(80) NULL,
    ADD COLUMN `lat` DOUBLE NULL,
    ADD COLUMN `lng` DOUBLE NULL,
    ADD COLUMN `region` VARCHAR(80) NULL,
    ADD COLUMN `street` VARCHAR(150) NULL,
    MODIFY `images` JSON NOT NULL,
    MODIFY `features` JSON NULL,
    MODIFY `includedKit` JSON NULL;

-- CreateIndex
CREATE INDEX `Product_city_idx` ON `Product`(`city`);


-- Розкладаємо наявний текст адреси: «Місто, решта». Якщо решта — назва області, кладемо її в region.
UPDATE `Product`
SET `city` = LEFT(TRIM(SUBSTRING_INDEX(`location`, ',', 1)), 80),
    `street` = NULLIF(LEFT(TRIM(SUBSTRING(`location`, CHAR_LENGTH(SUBSTRING_INDEX(`location`, ',', 1)) + 2)), 150), '');
UPDATE `Product` SET `region` = LEFT(`street`, 80), `street` = NULL WHERE `street` LIKE '%область';
UPDATE `Product` SET `region` = 'Київ' WHERE `city` = 'Київ' AND `region` IS NULL;
