CREATE TABLE versions(
    id int NOT NULL PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    libraryId int NOT NULL,
    create_time timestamp with time zone,
    version FLOAT,
    FOREIGN KEY (libraryId) REFERENCES libraries (id) ON DELETE CASCADE
);