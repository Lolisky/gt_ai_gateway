CREATE TABLE client_config_backup
(
    id         INTEGER                             not null constraint client_config_backup_pk primary key autoincrement,
    client     TEXT                                not null,
    name       TEXT                                not null,
    configContent TEXT                             not null,
    created_at TIMESTAMP default CURRENT_TIMESTAMP not null,
    updated_at TIMESTAMP default CURRENT_TIMESTAMP not null
);

CREATE INDEX client_config_backup_client_index
    ON client_config_backup (client);
