const propostasRepository = require('../repositories/propostas.repository');
const { ValidationError } = require('../utils/errors');
// const { getConnection } = require('../integrations/salesforce.client'); // pra integrar depois
const { logger } = require('../utils/logger');

const CAMPOS_OBRIGATORIOS = [
  'nome',
  'cpfCnpj',
  'endereco',
  'numeroInstalacao',
  'contato',
  'tipoTensao',
  'tipoPadrao',
  'geracaoPropria',
  'classe'
];

function validarProposta(dados) {
  const missing = CAMPOS_OBRIGATORIOS.filter(campo => !dados[campo]);
  if (missing.length > 0) {
    throw new ValidationError(`Campos obrigatórios faltando: ${missing.join(', ')}`);
  }
}

async function criarProposta(dadosProposta) {
  validarProposta(dadosProposta);

  const propostaCriada = await propostasRepository.inserir(dadosProposta);


  return {
    success: true,
    message: 'Proposta salva com sucesso!',
    data: propostaCriada
  };
}

function listarPropostas() {
  return propostasRepository.buscarTodas();
}

function buscarPorInstalacao(numeroInstalacao) {
  return propostasRepository.buscarPorInstalacao(numeroInstalacao);
}

module.exports = {
  criarProposta,
  listarPropostas,
  buscarPorInstalacao
};
