CREATE DATABASE IF NOT EXISTS `wru_db`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE `wru_db`;

-- ========================================================
-- 1) MASTER TABLES (people, destination, vehicle)
-- ========================================================

-- people (10 rows)
INSERT INTO `people` (`name`, `created_at`, `updated_at`) VALUES
('Andi Saputra',   NOW(), NOW()),
('Budi Santoso',   NOW(), NOW()),
('Citra Lestari',  NOW(), NOW()),
('Dewi Anggraini', NOW(), NOW()),
('Eko Prasetyo',   NOW(), NOW()),
('Farhan Akbar',   NOW(), NOW()),
('Gita Widya',     NOW(), NOW()),
('Hendra Kurnia',  NOW(), NOW()),
('Intan Permata',  NOW(), NOW()),
('Joko Susilo',    NOW(), NOW());

-- destination (10 rows)
INSERT INTO `destination` (`destination_name`, `created_at`, `updated_at`) VALUES
('Bandung HQ',      NOW(), NOW()),
('Jakarta Office',  NOW(), NOW()),
('Surabaya Branch', NOW(), NOW()),
('Yogyakarta Site', NOW(), NOW()),
('Bali Workshop',   NOW(), NOW()),
('Semarang Hub',    NOW(), NOW()),
('Medan Plant',     NOW(), NOW()),
('Makassar Depot',  NOW(), NOW()),
('Bogor Warehouse', NOW(), NOW()),
('Depok Lab',       NOW(), NOW());

-- vehicle (10 rows)
INSERT INTO `vehicle` (`vehicle_name`, `numberPlate`, `created_at`, `updated_at`) VALUES
('Toyota Avanza',       'D 1234 AB',  NOW(), NOW()),
('Honda BR-V',          'B 5678 CD',  NOW(), NOW()),
('Mitsubishi Xpander',  'L 9012 EF',  NOW(), NOW()),
('Suzuki Ertiga',       'AB 3456 GH', NOW(), NOW()),
('Isuzu Elf',           'DK 7890 IJ', NOW(), NOW()),
('Toyota HiAce',        'H 1122 KL',  NOW(), NOW()),
('Daihatsu Gran Max',   'F 3344 MN',  NOW(), NOW()),
('Wuling Confero',      'E 5566 PQ',  NOW(), NOW()),
('Hyundai Staria',      'T 7788 RS',  NOW(), NOW()),
('Kia Carnival',        'Z 9900 TU',  NOW(), NOW());

-- ========================================================
-- 2) TRANSACTIONAL TABLES (m_loc, v_trip)
--    Pakai INSERT ... SELECT ... JOIN agar FK valid
-- ========================================================

-- m_loc (10 rows)
INSERT INTO `m_loc`
(`people_id`,`destination_id`,`requestBy`,`leaveDate`,`returnDate`,`created_at`,`updated_at`)
SELECT p.id, d.id, x.requestBy, x.leaveDate, x.returnDate, NOW(), NOW()
FROM (
  SELECT 'Andi Saputra'   AS person, 'Jakarta Office'  AS dest, 'Rina'  AS requestBy,
         '2025-09-01 08:00:00' AS leaveDate, '2025-09-03 18:00:00' AS returnDate
  UNION ALL SELECT 'Budi Santoso',   'Surabaya Branch',          'Rina',
         '2025-09-05 07:30:00', '2025-09-07 20:00:00'
  UNION ALL SELECT 'Citra Lestari',  'Bandung HQ',               'Fajar',
         '2025-08-28 09:00:00', '2025-08-28 21:00:00'
  UNION ALL SELECT 'Dewi Anggraini', 'Bali Workshop',            'Fajar',
         '2025-09-10 06:00:00', '2025-09-14 20:00:00'
  UNION ALL SELECT 'Eko Prasetyo',   'Yogyakarta Site',          'Tasya',
         '2025-09-02 08:00:00', '2025-09-04 19:00:00'
  UNION ALL SELECT 'Farhan Akbar',   'Semarang Hub',             'Yoga',
         '2025-09-06 07:00:00', '2025-09-06 22:00:00'
  UNION ALL SELECT 'Gita Widya',     'Medan Plant',              'Mira',
         '2025-09-12 05:30:00', '2025-09-15 21:30:00'
  UNION ALL SELECT 'Hendra Kurnia',  'Makassar Depot',           'Yoga',
         '2025-09-08 09:00:00', '2025-09-09 18:30:00'
  UNION ALL SELECT 'Intan Permata',  'Bogor Warehouse',          'Mira',
         '2025-09-03 08:15:00', '2025-09-03 20:00:00'
  UNION ALL SELECT 'Joko Susilo',    'Depok Lab',                'Rina',
         '2025-09-18 06:30:00', '2025-09-19 19:00:00'
) AS x
JOIN `people`      AS p ON p.`name` = x.person
JOIN `destination` AS d ON d.`destination_name` = x.dest;

-- v_trip (10 rows)
INSERT INTO `v_trip`
(`people_id`,`vehicle_id`,`destination_id`,`requestBy`,`leaveDate`,`returnDate`,`created_at`,`updated_at`)
SELECT p.id, v.id, d.id, x.requestBy, x.leaveDate, x.returnDate, NOW(), NOW()
FROM (
  SELECT 'Andi Saputra'   AS person, 'D 1234 AB'  AS plate, 'Bandung HQ'      AS dest, 'Rina'  AS requestBy,
         '2025-09-15 06:00:00' AS leaveDate, '2025-09-16 20:00:00' AS returnDate
  UNION ALL SELECT 'Budi Santoso',   'B 5678 CD',           'Jakarta Office',           'Rina',
         '2025-08-30 09:00:00', '2025-08-30 21:00:00'
  UNION ALL SELECT 'Citra Lestari',  'L 9012 EF',           'Bali Workshop',            'Fajar',
         '2025-09-12 07:00:00', '2025-09-15 19:00:00'
  UNION ALL SELECT 'Dewi Anggraini', 'AB 3456 GH',          'Surabaya Branch',          'Tasya',
         '2025-09-08 08:30:00', '2025-09-09 18:30:00'
  UNION ALL SELECT 'Eko Prasetyo',   'DK 7890 IJ',          'Yogyakarta Site',          'Fajar',
         '2025-09-03 05:30:00', '2025-09-05 22:00:00'
  UNION ALL SELECT 'Farhan Akbar',   'H 1122 KL',           'Semarang Hub',             'Yoga',
         '2025-09-06 06:30:00', '2025-09-06 23:30:00'
  UNION ALL SELECT 'Gita Widya',     'F 3344 MN',           'Medan Plant',              'Mira',
         '2025-09-12 10:00:00', '2025-09-14 18:00:00'
  UNION ALL SELECT 'Hendra Kurnia',  'E 5566 PQ',           'Makassar Depot',           'Yoga',
         '2025-09-08 07:45:00', '2025-09-09 20:15:00'
  UNION ALL SELECT 'Intan Permata',  'T 7788 RS',           'Bogor Warehouse',          'Mira',
         '2025-09-04 09:15:00', '2025-09-04 22:45:00'
  UNION ALL SELECT 'Joko Susilo',    'Z 9900 TU',           'Depok Lab',                'Rina',
         '2025-09-19 06:15:00', '2025-09-20 21:45:00'
) AS x
JOIN `people`      AS p ON p.`name` = x.person
JOIN `vehicle`     AS v ON v.`numberPlate` = x.plate
JOIN `destination` AS d ON d.`destination_name` = x.dest;

-- ========================================================
-- 3) TMP/STAGING TABLES (tmp_people, tmp_destination, tmp_vehicle)
-- ========================================================

-- tmp_people (10 rows)
INSERT INTO `tmp_people` (`name`, `created_at`) VALUES
('Tmp Person 01', NOW()),
('Tmp Person 02', NOW()),
('Tmp Person 03', NOW()),
('Tmp Person 04', NOW()),
('Tmp Person 05', NOW()),
('Tmp Person 06', NOW()),
('Tmp Person 07', NOW()),
('Tmp Person 08', NOW()),
('Tmp Person 09', NOW()),
('Tmp Person 10', NOW());

-- tmp_destination (10 rows)
INSERT INTO `tmp_destination` (`destination_name`, `created_at`) VALUES
('Tmp Destination 01', NOW()),
('Tmp Destination 02', NOW()),
('Tmp Destination 03', NOW()),
('Tmp Destination 04', NOW()),
('Tmp Destination 05', NOW()),
('Tmp Destination 06', NOW()),
('Tmp Destination 07', NOW()),
('Tmp Destination 08', NOW()),
('Tmp Destination 09', NOW()),
('Tmp Destination 10', NOW());

-- tmp_vehicle (10 rows)
INSERT INTO `tmp_vehicle` (`vehicle_name`, `vehicleID`, `created_at`) VALUES
('Tmp Vehicle 01', 'TMP-VEH-001', NOW()),
('Tmp Vehicle 02', 'TMP-VEH-002', NOW()),
('Tmp Vehicle 03', 'TMP-VEH-003', NOW()),
('Tmp Vehicle 04', 'TMP-VEH-004', NOW()),
('Tmp Vehicle 05', 'TMP-VEH-005', NOW()),
('Tmp Vehicle 06', 'TMP-VEH-006', NOW()),
('Tmp Vehicle 07', 'TMP-VEH-007', NOW()),
('Tmp Vehicle 08', 'TMP-VEH-008', NOW()),
('Tmp Vehicle 09', 'TMP-VEH-009', NOW()),
('Tmp Vehicle 10', 'TMP-VEH-010', NOW());

-- ========================================================
-- 4) TMP TRANSACTIONAL (tmp_mLoc, tmp_vtrip)
-- ========================================================

-- tmp_mLoc (10 rows)
INSERT INTO `tmp_mLoc`
(`people_id`,`destination_id`,`requestBy`,`leaveDate`,`returnDate`,`created_at`)
SELECT p.id, d.id, x.requestBy, x.leaveDate, x.returnDate, NOW()
FROM (
  SELECT 'Andi Saputra'   AS person, 'Jakarta Office'  AS dest, 'Rina'  AS requestBy,
         '2025-09-20 08:00:00' AS leaveDate, '2025-09-20 17:30:00' AS returnDate
  UNION ALL SELECT 'Budi Santoso',   'Bandung HQ',               'Rina',
         '2025-09-06 08:00:00', '2025-09-06 19:00:00'
  UNION ALL SELECT 'Citra Lestari',  'Yogyakarta Site',          'Fajar',
         '2025-09-11 07:30:00', '2025-09-11 21:00:00'
  UNION ALL SELECT 'Dewi Anggraini', 'Surabaya Branch',          'Tasya',
         '2025-09-09 08:00:00', '2025-09-10 18:00:00'
  UNION ALL SELECT 'Eko Prasetyo',   'Bali Workshop',            'Fajar',
         '2025-09-04 06:00:00', '2025-09-06 20:00:00'
  UNION ALL SELECT 'Farhan Akbar',   'Semarang Hub',             'Yoga',
         '2025-09-07 09:00:00', '2025-09-07 21:00:00'
  UNION ALL SELECT 'Gita Widya',     'Medan Plant',              'Mira',
         '2025-09-13 06:45:00', '2025-09-14 19:15:00'
  UNION ALL SELECT 'Hendra Kurnia',  'Makassar Depot',           'Yoga',
         '2025-09-08 10:00:00', '2025-09-09 18:00:00'
  UNION ALL SELECT 'Intan Permata',  'Bogor Warehouse',          'Mira',
         '2025-09-05 08:30:00', '2025-09-05 16:45:00'
  UNION ALL SELECT 'Joko Susilo',    'Depok Lab',                'Rina',
         '2025-09-21 07:00:00', '2025-09-21 20:30:00'
) AS x
JOIN `people`      AS p ON p.`name` = x.person
JOIN `destination` AS d ON d.`destination_name` = x.dest;

-- tmp_vtrip (10 rows)
INSERT INTO `tmp_vtrip`
(`people_id`,`vehicle_id`,`destination_id`,`requestBy`,`leaveDate`,`returnDate`,`created_at`)
SELECT p.id, v.id, d.id, x.requestBy, x.leaveDate, x.returnDate, NOW()
FROM (
  SELECT 'Andi Saputra'   AS person, 'D 1234 AB'  AS plate, 'Bandung HQ'      AS dest, 'Rina'  AS requestBy,
         '2025-09-18 06:00:00' AS leaveDate, '2025-09-18 22:00:00' AS returnDate
  UNION ALL SELECT 'Budi Santoso',   'B 5678 CD',           'Surabaya Branch',         'Rina',
         '2025-09-07 07:00:00', '2025-09-08 19:30:00'
  UNION ALL SELECT 'Citra Lestari',  'L 9012 EF',           'Jakarta Office',          'Fajar',
         '2025-09-13 08:00:00', '2025-09-13 21:00:00'
  UNION ALL SELECT 'Dewi Anggraini', 'AB 3456 GH',          'Bali Workshop',           'Tasya',
         '2025-09-10 06:30:00', '2025-09-12 20:30:00'
  UNION ALL SELECT 'Eko Prasetyo',   'DK 7890 IJ',          'Yogyakarta Site',         'Fajar',
         '2025-09-05 05:30:00', '2025-09-06 22:00:00'
  UNION ALL SELECT 'Farhan Akbar',   'H 1122 KL',           'Semarang Hub',            'Yoga',
         '2025-09-06 10:15:00', '2025-09-06 23:45:00'
  UNION ALL SELECT 'Gita Widya',     'F 3344 MN',           'Medan Plant',             'Mira',
         '2025-09-12 11:00:00', '2025-09-14 17:30:00'
  UNION ALL SELECT 'Hendra Kurnia',  'E 5566 PQ',           'Makassar Depot',          'Yoga',
         '2025-09-09 07:45:00', '2025-09-10 20:15:00'
  UNION ALL SELECT 'Intan Permata',  'T 7788 RS',           'Bogor Warehouse',         'Mira',
         '2025-09-04 09:15:00', '2025-09-04 22:45:00'
  UNION ALL SELECT 'Joko Susilo',    'Z 9900 TU',           'Depok Lab',               'Rina',
         '2025-09-20 06:15:00', '2025-09-20 21:45:00'
) AS x
JOIN `people`      AS p ON p.`name` = x.person
JOIN `vehicle`     AS v ON v.`numberPlate` = x.plate
JOIN `destination` AS d ON d.`destination_name` = x.dest;
