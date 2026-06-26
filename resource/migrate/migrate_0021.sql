ALTER TABLE client_config_backup
    ADD COLUMN enabled INTEGER DEFAULT 0 NOT NULL;

CREATE UNIQUE INDEX client_config_backup_enabled_client_unique
    ON client_config_backup (client)
    WHERE enabled = 1;
