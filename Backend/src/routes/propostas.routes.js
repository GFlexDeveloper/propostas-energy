<<<<<<< HEAD
const express = require('express');
const router = express.Router();

const controller = require('../controllers/propostas.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');

router.use(authMiddleware);

router.post('/', controller.criarProposta);
router.get('/', controller.listarPropostas);
router.get('/instalacao/:numeroInstalacao', controller.buscarPorInstalacao);

module.exports = router;
=======
const express = require('express');
const router = express.Router();

const controller = require('../controllers/propostas.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');

router.use(authMiddleware);

router.post('/', controller.criarProposta);
router.get('/', controller.listarPropostas);
router.get('/instalacao/:numeroInstalacao', controller.buscarPorInstalacao);

module.exports = router;
>>>>>>> b52c59025a5e31c6d8b81637195ee70976af80b7
