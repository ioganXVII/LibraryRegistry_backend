const db = require('../database/db');

class LogController {
  async getLogs(req, res) {
    const { page } = req.query;
    const offset = parseInt(page) > 1 ? (page - 1) * 10 : 0;
    const { rows } = await db.query(
      'SELECT *, (SELECT count(*) FROM log) as total FROM log OFFSET $1 LIMIT 10',
      [offset],
    );
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