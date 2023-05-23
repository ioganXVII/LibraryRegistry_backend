const Router = require('express');
const router = new Router();

const logController = require('../controller/log.controller');

router.get('/getLogs', logController.getLogs);

module.exports = router;