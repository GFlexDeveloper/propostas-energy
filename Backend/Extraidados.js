const pdfParse = require('pdf-parse');
const OpenAI = require('openai');
require('dotenv').config();

// Configuração da OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Função apenas para extrair texto bruto do PDF
async function extrairTextoBruto(pdfBuffer) {
  try {
    const data = await pdfParse(pdfBuffer);
    const textoBruto = data.text.replace(/\s+/g, ' ').trim();
    return textoBruto;
  } catch (error) {
    console.error('Erro ao extrair texto do PDF:', error);
    throw new Error('Falha na extração do PDF');
  }
}

// Função para limpar JSON da LLM (remove ```json e ``` caso existam)
function parseJSONDaLLM(respostaLLM) {
  const cleaned = respostaLLM
    .replace(/```json/g, '')
    .replace(/```/g, '')
    .trim();

  return JSON.parse(cleaned);
}

// Função para enviar o texto bruto para a LLM e receber JSON estruturado
async function extrairCamposComLLM(textoBruto) {
  try {
    const prompt = `
Você é um assistente que extrai informações de faturas de energia da CEMIG.
Responda SOMENTE com JSON válido, sem explicações ou blocos de código.
Receberá o texto bruto da fatura e deve retornar um JSON com os seguintes campos:

{
  "endereco": {
    "rua": "",
    "numero": "",
    "bairro": "",
    "cidade": "",
    "estado": "",
    "cep": ""
  },
  "mediaConsumo": 0,
  "historicoConsumo": {
    "janeiro": 0,
    "fevereiro": 0,
    "marco": 0,
    "abril": 0,
    "maio": 0,
    "junho": 0,
    "julho": 0,
    "agosto": 0,
    "setembro": 0,
    "outubro": 0,
    "novembro": 0,
    "dezembro": 0
  },
  "mediaInjecao": 0,
  "valorKwh": 0
}

Extraia os valores do texto e preencha o JSON. Se algum campo não estiver presente, deixe como zero ou string vazia.
o valor da media de consumo deve ser a média dos valores mensais extraídos.

Texto bruto:
${textoBruto}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0
    });

    const respostaLLM = response.choices[0].message.content;

    let dadosJSON;
    try {
      dadosJSON = parseJSONDaLLM(respostaLLM);
    } catch (err) {
      console.error('Erro ao parsear JSON da LLM:', err, respostaLLM);
      throw new Error('LLM retornou JSON inválido');
    }

    return dadosJSON;

  } catch (error) {
    console.error('Erro ao extrair campos com LLM:', error);
    throw error;
  }
}

module.exports = { extrairTextoBruto, extrairCamposComLLM };
