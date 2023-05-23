const Router = require('express');
const router = new Router();

const librariesController = require('../controller/libraries.controller');

router.post('/createLibrary', librariesController.createLibrary);
router.post('/editLibrary', librariesController.editLibrary);
router.get('/getLibraries', librariesController.getLibraries);
router.get('/getLibrary/:name', librariesController.getLibrary);
router.delete('/deleteLibrary/:id', librariesController.deleteLibrary);

module.exports = router;