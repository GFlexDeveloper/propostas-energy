<<<<<<< HEAD
const express = require('express');
const router = express.Router();
const controller = require('../controllers/health.controller');

router.get('/health', controller.healthCheck);

module.exports = router;
=======
const express = require('express');
const router = express.Router();
const controller = require('../controllers/health.controller');

router.get('/health', controller.healthCheck);

module.exports = router;
>>>>>>> b52c59025a5e31c6d8b81637195ee70976af80b7
