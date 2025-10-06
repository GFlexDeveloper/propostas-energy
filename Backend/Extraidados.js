const pdfParse = require('pdf-parse');
const OpenAI = require('openai');
require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Função para extrair texto bruto do PDF
async function extrairTextoBruto(pdfBuffer) {
  try {
    const data = await pdfParse(pdfBuffer);
    return data.text.replace(/\s+/g, ' ').trim();
  } catch (error) {
    console.error('Erro ao extrair texto do PDF:', error);
    throw new Error('Falha na extração do PDF');
  }
}

// Função para enviar o texto bruto para a LLM
async function extrairCamposComLLM(textoBruto) {
  try {
    const prompt = `
Você é um assistente que extrai informações de faturas de energia da CEMIG.
Retorne um JSON com os seguintes campos:

{
  "endereco": { "rua": "", "numero": "", "bairro": "", "cidade": "", "estado": "", "cep": "" },
  "mediaConsumo": 0,
  "historicoConsumo": { "janeiro": 0, "fevereiro": 0, "marco": 0, "abril": 0, "maio": 0, "junho": 0, "julho": 0, "agosto": 0, "setembro": 0, "outubro": 0, "novembro": 0, "dezembro": 0 },
  "mediaInjecao": 0,
  "valorKwh": 0
}

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
      dadosJSON = JSON.parse(respostaLLM);
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
