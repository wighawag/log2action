CREATE TABLE IF NOT EXISTS Actions (
    id text NULL,
    timestamp timestamp NULL,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS SyncingStatus (
    id text NULL,
    lastSync text NULL,
    PRIMARY KEY (id)
);