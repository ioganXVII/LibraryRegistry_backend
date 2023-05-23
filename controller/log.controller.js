const db = require('../database/db');

class LogController {
  async getLogs(req, res) {
    const { rows } = await db.query('SELECT * FROM log');
    res.status(200).send(rows);
  }

  async createLog(action) {
    await db.query('INSERT INTO log (create_time, action) values (now()::timestamp, $1)', [action]);
  }
}

module.exports = new LogController();