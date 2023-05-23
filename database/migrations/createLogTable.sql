CREATE TABLE log(
    id int NOT NULL PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    create_time timestamp with time zone,
    action character varying(255)
);