const db = require('../database/db');

class LogController {
  async getLogs(req, res) {
    const { rows } = await db.query('SELECT * FROM log');
    res.status(200).send(rows);
  }

  /**
   * Создание лога в таблице log
   * @param {string} action - действие которое хотим сохранить в базу
   */
  async createLog(action) {
    await db.query('INSERT INTO log (create_time, action) values (now()::timestamp, $1)', [action]);
  }
}

module.exports = new LogController();