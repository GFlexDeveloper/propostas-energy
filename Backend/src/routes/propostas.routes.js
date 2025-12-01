const express = require('express');
const router = express.Router();

const controller = require('../controllers/propostas.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');

router.use(authMiddleware);

router.post('/', controller.criarProposta);
router.get('/', controller.listarPropostas);
router.get('/instalacao/:numeroInstalacao', controller.buscarPorInstalacao);

module.exports = router;
