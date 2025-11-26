const express = require('express');
const router = express.Router();
const healthController = require('../controllers/health.controller');

router.get('/health', healthController.healthCheck);
router.get('/estatisticas', healthController.estatisticas);

module.exports = router;
