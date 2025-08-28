SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE `people` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  `deleted_at` DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_people_name` (`name`),
  KEY `idx_people_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `destination` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `destination_name` VARCHAR(255) NOT NULL,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  `deleted_at` DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_destination_name` (`destination_name`),
  KEY `idx_destination_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `vehicle` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `vehicle_name` VARCHAR(255) NOT NULL,
  `numberPlate` VARCHAR(255) NOT NULL,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  `deleted_at` DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_vehicle_name` (`vehicle_name`),
  KEY `idx_vehicle_numberPlate` (`numberPlate`),
  KEY `idx_vehicle_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `m_loc` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `people_id` INT UNSIGNED NOT NULL,
  `destination_id` INT UNSIGNED NOT NULL,
  `requestBy` VARCHAR(255) NOT NULL,
  `leaveDate` DATETIME NOT NULL,
  `returnDate` DATETIME NOT NULL,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  `deleted_at` DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_mloc_people_id` (`people_id`),
  KEY `idx_mloc_destination_id` (`destination_id`),
  KEY `idx_mloc_leaveDate` (`leaveDate`),
  KEY `idx_mloc_returnDate` (`returnDate`),
  CONSTRAINT `fk_mloc_people`
    FOREIGN KEY (`people_id`) REFERENCES `people` (`id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_mloc_destination`
    FOREIGN KEY (`destination_id`) REFERENCES `destination` (`id`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `v_trip` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `people_id` INT UNSIGNED NOT NULL,
  `vehicle_id` INT UNSIGNED NOT NULL,
  `destination_id` INT UNSIGNED NOT NULL,
  `requestBy` VARCHAR(255) NOT NULL,
  `leaveDate` DATETIME NOT NULL,
  `returnDate` DATETIME NOT NULL,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  `deleted_at` DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_vtrip_people_id` (`people_id`),
  KEY `idx_vtrip_vehicle_id` (`vehicle_id`),
  KEY `idx_vtrip_destination_id` (`destination_id`),
  KEY `idx_vtrip_leaveDate` (`leaveDate`),
  KEY `idx_vtrip_returnDate` (`returnDate`),
  CONSTRAINT `fk_vtrip_people`
    FOREIGN KEY (`people_id`) REFERENCES `people` (`id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_vtrip_vehicle`
    FOREIGN KEY (`vehicle_id`) REFERENCES `vehicle` (`id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_vtrip_destination`
    FOREIGN KEY (`destination_id`) REFERENCES `destination` (`id`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `tmp_people` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `created_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_tmp_people_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `tmp_destination` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `destination_name` VARCHAR(255) NOT NULL,
  `created_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_tmp_destination_name` (`destination_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `tmp_vehicle` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `vehicle_name` VARCHAR(255) NOT NULL,
  `vehicleID` VARCHAR(255) NOT NULL,
  `created_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_tmp_vehicle_name` (`vehicle_name`),
  KEY `idx_tmp_vehicle_vehicleID` (`vehicleID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `tmp_mLoc` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `people_id` INT UNSIGNED NOT NULL,
  `destination_id` INT UNSIGNED NOT NULL,
  `requestBy` VARCHAR(255) NOT NULL,
  `leaveDate` DATETIME NOT NULL,
  `returnDate` DATETIME NOT NULL,
  `created_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_tmp_mloc_people_id` (`people_id`),
  KEY `idx_tmp_mloc_destination_id` (`destination_id`),
  CONSTRAINT `fk_tmp_mloc_people`
    FOREIGN KEY (`people_id`) REFERENCES `people` (`id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_tmp_mloc_destination`
    FOREIGN KEY (`destination_id`) REFERENCES `destination` (`id`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `tmp_vtrip` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `people_id` INT UNSIGNED NOT NULL,
  `vehicle_id` INT UNSIGNED NOT NULL,
  `destination_id` INT UNSIGNED NOT NULL,
  `requestBy` VARCHAR(255) NOT NULL,
  `leaveDate` DATETIME NOT NULL,
  `returnDate` DATETIME NOT NULL,
  `created_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_tmp_vtrip_people_id` (`people_id`),
  KEY `idx_tmp_vtrip_vehicle_id` (`vehicle_id`),
  KEY `idx_tmp_vtrip_destination_id` (`destination_id`),
  CONSTRAINT `fk_tmp_vtrip_people`
    FOREIGN KEY (`people_id`) REFERENCES `people` (`id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_tmp_vtrip_vehicle`
    FOREIGN KEY (`vehicle_id`) REFERENCES `vehicle` (`id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_tmp_vtrip_destination`
    FOREIGN KEY (`destination_id`) REFERENCES `destination` (`id`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
