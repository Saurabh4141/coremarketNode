CREATE TABLE report_media (
  id INT AUTO_INCREMENT PRIMARY KEY,

  report_id INT NOT NULL,

  media_type ENUM(
    'hero',
    'chart',
    'competitive_chart',
    'infographic',
    'table',
    'other'
  ) NOT NULL,

  title VARCHAR(255) DEFAULT NULL,
  description VARCHAR(500) DEFAULT NULL,

  file_path VARCHAR(255) NOT NULL,
  thumbnail_path VARCHAR(255) DEFAULT NULL,

  sort_order INT DEFAULT 0,

  is_sample TINYINT(1) DEFAULT 1,  -- visible on report page?
  is_downloadable TINYINT(1) DEFAULT 0,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  KEY idx_report (report_id, media_type),
  CONSTRAINT fk_media_report
    FOREIGN KEY (report_id)
    REFERENCES report_master(Id)
    ON DELETE CASCADE
);
