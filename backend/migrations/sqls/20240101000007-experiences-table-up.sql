-- The "previous work" table each service page shows. The type values are the ones the frontend
-- already passes as typeData, and one row per type per language keeps the lookup unambiguous.
CREATE TABLE experiences (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(30) NOT NULL,
    locale VARCHAR(5) NOT NULL,
    position INT UNSIGNED NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uniq_experience_type_locale UNIQUE (type, locale),
    CONSTRAINT chk_experiences_type CHECK (type IN ('installation', 'design', 'commission', 'maintenance')),
    CONSTRAINT chk_experiences_locale CHECK (locale IN ('th', 'en')),
    INDEX idx_experiences_locale (locale, position)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE experience_companies (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    experience_id INT UNSIGNED NOT NULL,
    name VARCHAR(255) NOT NULL,
    position INT UNSIGNED NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_experience_companies_experience FOREIGN KEY (experience_id)
      REFERENCES experiences (id) ON DELETE CASCADE,
    INDEX idx_experience_companies_experience (experience_id, position)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- year is nullable: a project that has not finished yet has no year to show
CREATE TABLE experience_works (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    company_id INT UNSIGNED NOT NULL,
    description VARCHAR(1000) NOT NULL,
    year SMALLINT UNSIGNED NULL,
    position INT UNSIGNED NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_experience_works_company FOREIGN KEY (company_id)
      REFERENCES experience_companies (id) ON DELETE CASCADE,
    CONSTRAINT chk_experience_works_year CHECK (year IS NULL OR (year BETWEEN 1900 AND 2200)),
    INDEX idx_experience_works_company (company_id, position)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
