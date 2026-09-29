-- One row per uploaded file. `key` is where the object sits in the bucket (or on disk) and `url` is
-- what a browser loads; storing both means moving to a new bucket or domain is a data change rather
-- than a code change. provider records which driver wrote it.
CREATE TABLE media (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `key` VARCHAR(512) NOT NULL,
    url VARCHAR(1024) NOT NULL,
    name VARCHAR(255) NOT NULL,
    alternative_text VARCHAR(255) NULL,
    caption VARCHAR(500) NULL,
    mime VARCHAR(100) NOT NULL,
    ext VARCHAR(16) NOT NULL,
    size INT UNSIGNED NOT NULL,
    width INT UNSIGNED NULL,
    height INT UNSIGNED NULL,
    provider VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uniq_media_key UNIQUE (`key`(255)),
    CONSTRAINT chk_media_provider CHECK (provider IN ('r2', 'local')),
    INDEX idx_media_created_at (created_at DESC),
    INDEX idx_media_mime (mime)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
