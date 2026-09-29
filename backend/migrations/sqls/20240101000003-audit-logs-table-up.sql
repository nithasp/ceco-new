-- user_id deliberately has no foreign key: the log is history and has to outlive the account,
-- which is also why the username is copied into each row instead of joined in when read.
CREATE TABLE audit_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    user_id INT UNSIGNED NULL,
    username VARCHAR(100) NULL,
    user_role VARCHAR(20) NULL,
    action VARCHAR(20) NOT NULL,
    event VARCHAR(60) NOT NULL,
    method VARCHAR(10) NULL,
    path VARCHAR(255) NULL,
    status_code SMALLINT UNSIGNED NULL,
    ip_address VARCHAR(45) NULL,
    user_agent VARCHAR(255) NULL,
    details JSON NULL,
    CONSTRAINT chk_audit_logs_action CHECK (
      action IN ('CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGIN_FAILED', 'LOGOUT', 'SECURITY')
    ),
    INDEX idx_audit_logs_created_at (created_at DESC),
    INDEX idx_audit_logs_user_id (user_id, created_at DESC),
    INDEX idx_audit_logs_action (action, created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
