const { gerarTexto } = require('../integrations/openai.client');

async function extrairDadosDePdf(textoExtraido) {
  const prompt = `
Você é um assistente que extrai dados de propostas de energia a partir de faturas CEMIG.

Retorne um JSON com os campos:
- nome
- cpfCnpj
- endereco
- numeroInstalacao
- contato
- tipoTensao
- tipoPadrao
- geracaoPropria
- classe

Texto:
${textoExtraido}
`;

  const resposta = await gerarTexto(prompt);

  // aqui idealmente você faria um JSON.parse com tratamento de erro
  return resposta;
}

module.exports = {
  extrairDadosDePdf
};
