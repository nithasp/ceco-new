-- The "Recently Projects" slider on the home page. One row per project per language.
CREATE TABLE recent_projects (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    locale VARCHAR(5) NOT NULL,
    media_id INT UNSIGNED NULL,
    position INT UNSIGNED NOT NULL DEFAULT 0,
    is_published TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_recent_projects_media FOREIGN KEY (media_id) REFERENCES media (id) ON DELETE SET NULL,
    CONSTRAINT chk_recent_projects_locale CHECK (locale IN ('th', 'en')),
    INDEX idx_recent_projects_locale (locale, position),
    INDEX idx_recent_projects_media (media_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
