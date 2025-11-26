const service = require('../services/propostas.service');

async function criarProposta(req, res, next) {
  try {
    const result = await service.criarProposta(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function listarPropostas(req, res, next) {
  try {
    const propostas = await service.listarPropostas();
    res.json(propostas);
  } catch (err) {
    next(err);
  }
}

async function buscarPorInstalacao(req, res, next) {
  try {
    const { numeroInstalacao } = req.params;
    const proposta = await service.buscarPorInstalacao(numeroInstalacao);

    if (!proposta) {
      return res.status(404).json({ message: 'Proposta não encontrada' });
    }

    res.json(proposta);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  criarProposta,
  listarPropostas,
  buscarPorInstalacao
};
