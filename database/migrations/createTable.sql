CREATE TABLE libraries(  
    id int NOT NULL PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    create_time timestamp with time zone,
    update_time timestamp with time zone,
    name VARCHAR(255) UNIQUE
);