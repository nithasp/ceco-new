-- The two site-wide files that are not page content: the company-profile PDF the footer links to,
-- and the logo in the navbar. A NULL locale means the file is used in every language.
CREATE TABLE site_documents (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    kind VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(1000) NULL,
    locale VARCHAR(5) NULL,
    media_id INT UNSIGNED NULL,
    position INT UNSIGNED NOT NULL DEFAULT 0,
    is_published TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_site_documents_media FOREIGN KEY (media_id) REFERENCES media (id) ON DELETE SET NULL,
    CONSTRAINT chk_site_documents_kind CHECK (kind IN ('pdf', 'logo')),
    CONSTRAINT chk_site_documents_locale CHECK (locale IS NULL OR locale IN ('th', 'en')),
    INDEX idx_site_documents_kind (kind, position),
    INDEX idx_site_documents_media (media_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
