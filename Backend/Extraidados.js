const pdfParse = require('pdf-parse');
const OpenAI = require('openai');
require('dotenv').config();

// Configuração da OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Função para extrair texto bruto do PDF (sem alterações)
async function extrairTextoBruto(pdfBuffer) {
  try {
    const data = await pdfParse(pdfBuffer);
    // Melhora a limpeza, removendo múltiplas quebras de linha
    const textoBruto = data.text.replace(/\s\s+/g, ' ').trim();
    return textoBruto;
  } catch (error) {
    console.error('Erro ao extrair texto do PDF:', error);
    throw new Error('Falha na extração do PDF');
  }
}

// Função para limpar JSON da LLM (sem alterações)
function parseJSONDaLLM(respostaLLM) {
  const cleaned = respostaLLM
    .replace(/```json/g, '')
    .replace(/```/g, '')
    .trim();
  return JSON.parse(cleaned);
}

// Função para enviar o texto bruto para a LLM e receber JSON estruturado (ATUALIZADA)
async function extrairCamposComLLM(textoBruto) {
  try {
    // PROMPT MELHORADO PARA EXTRAIR MAIS CAMPOS
    const prompt = `
Você é um especialista em analisar faturas de energia da CEMIG no Brasil.
Sua única função é extrair os dados do texto bruto fornecido e retornar um JSON VÁLIDO.
NÃO inclua explicações, apenas o JSON.

Siga estas regras:
1.  Se um campo não for encontrado, retorne "" (string vazia) para textos ou 0 para números.
2.  Para o "historicoConsumo", extraia os 12 meses. Se um mês não estiver listado, deixe como 0.
3.  "mediaConsumo" deve ser a média aritmética dos valores encontrados no "historicoConsumo".
4.  "valorKwh" é o preço da tarifa de energia (TE) somado com a tarifa de distribuição (TUSD). Calcule-o se não estiver explícito.
5.  "tipo_padrao" refere-se a Monofásico, Bifásico ou Trifásico.
6.   mediaInjecao deve ser baseada no campo Energia Injetada, se disponível.
7.   mediaInjecao deve ser 0 se não houver geração própria.
O JSON de saída DEVE ter a seguinte estrutura:

{
  "nome_cliente": "",
  "cpf_cnpj": "",
  "numero_instalacao": "",
  "classe": "",
  "tipo_padrao": "",
  "valor_total_fatura": 0,
  "data_vencimento": "",
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
    "janeiro": 0, "fevereiro": 0, "marco": 0, "abril": 0,
    "maio": 0, "junho": 0, "julho": 0, "agosto": 0,
    "setembro": 0, "outubro": 0, "novembro": 0, "dezembro": 0
  },
  "mediaInjecao": 0,
  "valorKwh": 0
}

Agora, analise o seguinte texto bruto da fatura:
---
${textoBruto}
---
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }, // Força a saída em JSON
      temperature: 0.1 // Temperatura baixa para maior precisão
    });

    const respostaLLM = response.choices[0].message.content;

    let dadosJSON;
    try {
      // A função parseJSONDaLLM pode ser simplificada, pois o modelo já deve retornar JSON puro
      dadosJSON = JSON.parse(respostaLLM);
    } catch (err) {
      console.error('Erro ao parsear JSON da LLM:', err, "\nResposta recebida:", respostaLLM);
      // Tenta limpar a resposta como um fallback, caso o modelo ignore a instrução
      try {
        dadosJSON = parseJSONDaLLM(respostaLLM);
      } catch (fallbackErr) {
        throw new Error('LLM retornou uma resposta JSON inválida, mesmo após a limpeza.');
      }
    }

    return dadosJSON;

  } catch (error) {
    console.error('Erro na chamada da API OpenAI:', error);
    throw new Error('Falha ao comunicar com a IA para extrair os dados.');
  }
}

module.exports = { extrairTextoBruto, extrairCamposComLLM };