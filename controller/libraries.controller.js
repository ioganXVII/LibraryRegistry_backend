const db = require('../database/db');
const logController = require('./log.controller');

/**
 * Функция приводящая библиотеки к нужному формату
 * @param {array} arr - список библиотек 
 * @returns {array}
 */
const getFormattedArray = (arr) => {
  const result = [];

  arr.forEach((lib) => {
    try {
      let itemIndex = result.findIndex((item) => item.name === lib.name);
      
      if(itemIndex === -1) {
        result.push({ id: lib.id, name: lib.name, versions: [{ version: lib.version, dependencies: [] }] });
        itemIndex = result.length - 1;
      } else {
        const item = result[itemIndex];
        const versionIndex = item.versions.findIndex((version) => version.version === lib.version);
        if(versionIndex === -1) {
          item.versions.push({ version: lib.version, dependencies: [] });
        }
      }
      
      if(lib.dependlib && lib.dependversion) {
        const item = result[itemIndex];
        const versionIndex = item.versions.findIndex((version) => version.version === lib.version);
        item.versions[versionIndex].dependencies.push({ name: lib.dependlib, version: lib.dependversion });
      }
    } catch(err) {
      console.log(err);
    }
  });

  // Сортируем версии библиотеки
  result.forEach((item) => item.versions.sort((a, b) => {
    if (a.version > b.version) return 1
    else if (a.version < b.version) return -1
    return 0
  }));

  return result;
}

class LibrariesController {
  async createLibrary(req, res) {
    try {
      const { name, versions } = req.body;

      // Добавляем библиотеку в базу
      const { rows } = await db.query(
        'INSERT INTO libraries (name, create_time, update_time) values ($1, now()::timestamp, now()::timestamp) RETURNING id',
        [name],
      );

      const { id } = rows[0];

      // Добавляем версию и её зависимости в базу
      versions.forEach(async (version) => {
        const result = await db.query('INSERT INTO versions (libraryid, create_time, version) VALUES ($1, now()::timestamp, $2) RETURNING id',
          [id, version.version],
        );
        const versionId = result.rows[0].id;
        
        version.dependencies.forEach(async (depend) => {
          await db.query(
            `INSERT INTO dependencies VALUES ($1,
            (SELECT id FROM libraries WHERE name = $2)::integer,
            $3,
            (SELECT id FROM versions WHERE libraryid = (SELECT id FROM libraries WHERE name = $4)::integer AND version = $5))`,
            [id, depend.name, versionId, depend.name, depend.version]
          );
        })
      });

      // Логгируем действие
      await logController.createLog(`Create new library - ${name}`);

      res.status(201).send(`Library created!`);
    } catch(err) {
      console.log(err);
      res.status(400).send(err);
    }
  }

  async editLibrary(req, res) {
    const { name, versions } = req.body;

    // Получаем старые версии и их зависимости для дальнейшего сравнения изменений
    const { rows } = await db.query(`
    SELECT id as versionid, libraryid, vers.version,
      dep.iddependlibrary,
      (SELECT name FROM libraries WHERE id = dep.iddependlibrary) as depname,
      dep.idversiondependlib,
      (SELECT version FROM versions WHERE id = dep.idversiondependlib) as depversion
    FROM versions as vers
    LEFT JOIN dependencies as dep ON dep.idversionlib = vers.id 
    WHERE libraryid = (SELECT id FROM libraries WHERE name = $1)
    `, [name]);
  
    
    // Проверяем была ли удалена версия и её зависимости из библиотеки
    rows.forEach(async (dep) => {
      const versionIndex = versions.findIndex((version) => version.version === dep.version);
      
      if (versionIndex === -1) {
        await db.query(`DELETE FROM versions WHERE libraryid = $1 AND version = $2`, [dep.libraryid, dep.version]);
        await logController.createLog(`Delete version - ${name} ${dep.version}`);
      } else {
        const dependIndex = versions[versionIndex].dependencies.findIndex((depend) => {
          return depend.name === dep.depname && depend.version === dep.depversion
        });
        if (dependIndex === -1) {
          if (dep.depname && dep.depversion) {
            await db.query(
              `DELETE FROM dependencies WHERE idlibrary = $1 AND iddependlibrary = $2 AND idversionlib = $3 AND idversiondependlib = $4`, 
              [dep.libraryid, dep.iddependlibrary, dep.versionid, dep.idversiondependlib]
            );

            // Логгируем действие
            await logController.createLog(`Delete dependencie - ${name} ${dep.version}: ${dep.depname} - ${dep.depversion}`);
          }
        }
      }
    });


    // Приводим записанные в базе версии к нужному формату для дальнейшего сравнения
    const correctRows = [];

    rows.forEach((row) => {
      let crIndex = correctRows.findIndex((cr) => cr.version === row.version);
      if(crIndex === -1) {
        correctRows.push({ version: row.version, dependencies: [] });
        crIndex = correctRows.length - 1;
      }

      if (row.depname && row.depversion) {
        correctRows[crIndex].dependencies.push({ name: row.depname, version: row.depversion });
      }
    })

    // Обрабатываем изменения версий
    versions.forEach(async (version) => {
      const rowIndex = correctRows.findIndex((row) => row.version === version.version);
      const libraryId = rows[0].libraryid;

      // Добавляем новую версию и её зависимости в базу
      if (rowIndex === -1) {
        const result = await db.query('INSERT INTO versions (libraryid, create_time, version) VALUES ($1, now()::timestamp, $2) RETURNING id',
          [libraryId, version.version],
        );
        // Логгируем действие
        await logController.createLog(`Create ${name} new version - ${version.version}`);

        const versionId = result.rows[0].id;

        version.dependencies.forEach(async (depend) => {
          await db.query(
            `INSERT INTO dependencies VALUES ($1,
            (SELECT id FROM libraries WHERE name = $2)::integer,
            $3,
            (SELECT id FROM versions WHERE libraryid = (SELECT id FROM libraries WHERE name = $4)::integer AND version = $5))`,
            [libraryId, depend.name, versionId, depend.name, depend.version]
          );

          await logController.createLog(`Add new dependencie to ${name}:${version.version} - ${depend.name}:${depend.version}`);
        });

      } else {
        // Добавляем к уже имеющейся версии зависимости
        const newDependencies = [];
        if (version.dependencies.toString() !== correctRows[rowIndex].dependencies.toString()) {
          version.dependencies.forEach((dep) => {
            if(!correctRows[rowIndex].dependencies.some((crDep) => crDep.name === dep.name)) newDependencies.push(dep);
          })


          newDependencies.forEach(async (depend) => {
            await db.query(
              `INSERT INTO dependencies VALUES (
                $1,
                (SELECT id FROM libraries WHERE name = $2)::integer,
                (SELECT id FROM versions WHERE libraryid =
                  (SELECT id FROM libraries WHERE name = $3)::integer AND version = $4),
                (SELECT id FROM versions WHERE libraryid =
                  (SELECT id FROM libraries WHERE name = $5)::integer AND version = $6))`,
              [libraryId, depend.name, name, version.version, depend.name, depend.version]
            );
            // Логгируем действие
            await logController.createLog(`Add new dependencie to ${name}:${version.version} - ${depend.name}:${depend.version}`);
          })
        }
      }
    });
    // Логгируем действие
    await logController.createLog(`Edit library - ${name}`);
    res.status(200).send(`${name} edited!`);
  }

  async getLibraries(req, res) {
    try {
      const { page } = req.query;
      const offset = page > 1 ? (page - 1) * 10 : 0;
      const { rows } = await db.query(
        `SELECT
          lib.id,
          name,
          vers.version,
          (SELECT name FROM libraries WHERE id = dep.iddependlibrary) as dependlib,
          (SELECT version FROM versions WHERE id = dep.idversiondependlib) as dependversion,
          (SELECT count(id) FROM libraries) as total
        FROM libraries as lib
        JOIN versions as vers ON vers.libraryid = lib.id
        LEFT JOIN dependencies as dep ON dep.idlibrary = lib.id and dep.idversionlib = vers.id
        ORDER BY id
        OFFSET $1 LIMIT 10
        `,
        [offset],
      );
      const total = rows[0].total;
      const result = getFormattedArray(rows);

      res.status(200).send({ data: result, total });
    } catch(err) {
      res.status(400).send(err);
    }
  }

  async getLibrary(req, res) {
    try {
      const { name } = req.params;
      const { rows } = await db.query(
        `SELECT
          lib.id,
          name,
          vers.version,
          (SELECT name FROM libraries WHERE id = dep.iddependlibrary) as dependlib,
          (SELECT version FROM versions WHERE id = dep.idversiondependlib) as dependversion
        FROM libraries as lib
        JOIN versions as vers ON vers.libraryid = lib.id
        LEFT JOIN dependencies as dep ON dep.idlibrary = lib.id and dep.idversionlib = vers.id WHERE lib.name = $1
        `,
        [name],
      );
      const result = getFormattedArray(rows);

      res.status(200).send(result[0]);
    } catch(err) {
      console.log(err);
      res.status(400).send(err);
    }
  }

  async deleteLibrary(req, res) {
    try {
      const { id } = req.params;
      const { rows } = await db.query('DELETE FROM libraries WHERE id = $1 RETURNING name', [id]);
      await logController.createLog(`Library ${rows[0].name} was deleted`);
      res.status(200).send(`${id} was successful deleted!`);
    } catch(err) {
      res.status(400).send(err);
    }
  }
}

module.exports = new LibrariesController();