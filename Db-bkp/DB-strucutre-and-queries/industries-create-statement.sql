CREATE TABLE `industries_master` (
  `Id` int(11) NOT NULL AUTO_INCREMENT,

  /* Core identity */
  `Name` varchar(512) NOT NULL,
  `Rephrased_Name` varchar(125) DEFAULT NULL,
  `Slug` varchar(100) NOT NULL,              -- SEO slug (/industry/{path})
  `Initial` char(3) DEFAULT NULL,             -- UI shorthand (NOT unique)

  /* SEO control */
  `seo_title` varchar(255) DEFAULT NULL,
  `seo_description` varchar(300) DEFAULT NULL,

  /* Display / UI */
  `Image_Path` varchar(125) DEFAULT NULL,
  `Icon` varchar(100) DEFAULT NULL,
  `Color` varchar(150) DEFAULT NULL,

  /* Short facts (display-friendly) */
  `description` varchar(125) DEFAULT NULL,
  `marketSize` varchar(25) DEFAULT NULL,      -- e.g. "USD 5.2 Trillion"
  `growthRate` varchar(25) DEFAULT NULL,      -- e.g. "7.8%"
  `topPlayers` varchar(125) DEFAULT NULL,

  /* Numeric values (future-proof) */
  `market_size_value` decimal(18,2) DEFAULT NULL,
  `growth_rate_value` decimal(5,2) DEFAULT NULL,

  /* Long-form content */
  `overview` text DEFAULT NULL,

  /* SEO + UI priority */
  `priority` int(2) DEFAULT 99,               -- 1 = highest priority

  /* Status & audit */
  `IsActive` bit(1) NOT NULL DEFAULT b'1',
  `Ip` varchar(15) DEFAULT NULL,
  `CreateAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `CreateBY` int(11) DEFAULT NULL,
  `UpdateAt` datetime DEFAULT NULL,
  `UpdateBY` int(11) DEFAULT NULL,

  PRIMARY KEY (`Id`),
  UNIQUE KEY `unique_path` (`Path`),
  KEY `idx_priority` (`priority`),
  KEY `idx_active` (`IsActive`)
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_general_ci;
