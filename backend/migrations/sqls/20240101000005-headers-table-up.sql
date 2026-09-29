-- The home page hero carousel: one header per language, holding its slides in display order.
CREATE TABLE headers (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    locale VARCHAR(5) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uniq_header_locale UNIQUE (locale),
    CONSTRAINT chk_headers_locale CHECK (locale IN ('th', 'en'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- media_id is SET NULL rather than CASCADE: deleting a picture must not delete the slide's words
CREATE TABLE header_slides (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    header_id INT UNSIGNED NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    media_id INT UNSIGNED NULL,
    position INT UNSIGNED NOT NULL DEFAULT 0,
    is_published TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_header_slides_header FOREIGN KEY (header_id) REFERENCES headers (id) ON DELETE CASCADE,
    CONSTRAINT fk_header_slides_media FOREIGN KEY (media_id) REFERENCES media (id) ON DELETE SET NULL,
    INDEX idx_header_slides_header (header_id, position),
    INDEX idx_header_slides_media (media_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
