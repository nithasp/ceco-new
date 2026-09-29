-- Open jobs on the career page. `position` is the job title, kept under that name because the
-- frontend already binds it; the list is ordered by priority. description holds the rich text the
-- CMS editor produces, which Angular sanitizes on its way into [innerHTML].
CREATE TABLE recruitments (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    position VARCHAR(255) NOT NULL,
    description MEDIUMTEXT NULL,
    amount SMALLINT UNSIGNED NULL,
    priority INT UNSIGNED NOT NULL DEFAULT 0,
    locale VARCHAR(5) NOT NULL,
    is_published TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_recruitments_locale CHECK (locale IN ('th', 'en')),
    INDEX idx_recruitments_locale (locale, priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
