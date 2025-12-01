<<<<<<< HEAD
const express = require('express');
const router = express.Router();
const controller = require('../controllers/auth.controller');

router.post('/registrar', controller.registrar);
router.post('/login', controller.login);

module.exports = router;
=======
const express = require('express');
const router = express.Router();
const controller = require('../controllers/auth.controller');

router.post('/registrar', controller.registrar);
router.post('/login', controller.login);

module.exports = router;
>>>>>>> b52c59025a5e31c6d8b81637195ee70976af80b7
