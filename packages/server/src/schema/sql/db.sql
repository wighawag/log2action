CREATE TABLE IF NOT EXISTS Actions (
    questGroupID text NULL,
    actionID text NULL,
    timestamp timestamp NULL,
    PRIMARY KEY (questGroupID, actionID)
);

CREATE TABLE IF NOT EXISTS SyncingStatus (
    questGroupID text NULL,
    lastSync text NULL,
    PRIMARY KEY (questGroupID)
);