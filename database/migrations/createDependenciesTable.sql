CREATE TABLE dependencies (
  idLibrary INT NOT NULL,
  idDependLibrary INT NOT NULL,
  idVersionLib INT NOT NULL,
  idVersionDependLib INT NOT NULL,
  FOREIGN KEY(idLibrary) REFERENCES libraries(id) ON DELETE CASCADE,
  FOREIGN KEY(idDependLibrary) REFERENCES libraries(id) ON DELETE CASCADE,
  FOREIGN KEY(idVersionLib) REFERENCES versions(id) ON DELETE CASCADE,
  FOREIGN KEY(idVersionDependLib) REFERENCES versions(id) ON DELETE CASCADE
);
