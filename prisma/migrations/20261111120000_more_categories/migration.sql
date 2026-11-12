-- AlterTable
ALTER TABLE `Product` MODIFY `category` ENUM('repair', 'home', 'tech', 'tourism', 'sport', 'kids', 'transport', 'gaming', 'pets', 'garden', 'events', 'music', 'fashion') NOT NULL,
    MODIFY `images` JSON NOT NULL,
    MODIFY `features` JSON NULL,
    MODIFY `includedKit` JSON NULL;

