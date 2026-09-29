-- Runs once, on the first start of an empty data volume. The test database has to exist before
-- `npm test` resets it, and the app user needs the same rights on it as on the dev database.
CREATE DATABASE IF NOT EXISTS ceco_test
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

GRANT ALL PRIVILEGES ON ceco_test.* TO 'ceco_user'@'%';
FLUSH PRIVILEGES;
