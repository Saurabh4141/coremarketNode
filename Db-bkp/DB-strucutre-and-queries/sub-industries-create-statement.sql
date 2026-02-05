CREATE TABLE `sub_industries_master` (
  `Id` int(11) NOT NULL AUTO_INCREMENT,

  /* Relation */
  `industry_id` int(11) NOT NULL,              -- FK → industries_master.Id

  /* Identity */
  `Name` varchar(255) NOT NULL,
  `Rephrased_Name` varchar(255) DEFAULT NULL,
  `Path` varchar(150) NOT NULL,                 -- /industry/{industry}/{sub-industry}
  `Initial` char(5) DEFAULT NULL,

  /* SEO control */
  `seo_title` varchar(255) DEFAULT NULL,
  `seo_description` varchar(300) DEFAULT NULL,

  /* UI / display */
  `Image_Path` varchar(150) DEFAULT NULL,
  `Icon` varchar(100) DEFAULT NULL,
  `Color` varchar(150) DEFAULT NULL,

  /* Short facts */
  `description` varchar(160) DEFAULT NULL,
  `marketSize` varchar(30) DEFAULT NULL,
  `growthRate` varchar(30) DEFAULT NULL,
  `topPlayers` varchar(255) DEFAULT NULL,

  /* Numeric values (future analytics) */
  `market_size_value` decimal(18,2) DEFAULT NULL,
  `growth_rate_value` decimal(5,2) DEFAULT NULL,

  /* Long content */
  `overview` text DEFAULT NULL,

  /* SEO priority */
  `priority` int(3) DEFAULT 99,                 -- Lower = higher importance

  /* Status & audit */
  `IsActive` bit(1) NOT NULL DEFAULT b'1',
  `Ip` varchar(15) DEFAULT NULL,
  `CreateAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `CreateBY` int(11) DEFAULT NULL,
  `UpdateAt` datetime DEFAULT NULL,
  `UpdateBY` int(11) DEFAULT NULL,

  PRIMARY KEY (`Id`),

  /* SEO safety */
  UNIQUE KEY `unique_subindustry_path` (`Path`),
  KEY `idx_industry_id` (`industry_id`),
  KEY `idx_priority` (`priority`),
  KEY `idx_active` (`IsActive`),

  CONSTRAINT `fk_subindustry_industry`
    FOREIGN KEY (`industry_id`)
    REFERENCES `industries_master` (`Id`)
    ON DELETE CASCADE
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_general_ci;
