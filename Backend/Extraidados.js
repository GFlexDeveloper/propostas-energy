const pdfParse = require('pdf-parse');
const OpenAI = require('openai');
require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Extrai texto do PDF
async function extrairTextoBruto(pdfBuffer) {
  try {
    const data = await pdfParse(pdfBuffer);
    return data.text.replace(/\s\s+/g, ' ').trim();
  } catch (error) {
    console.error('Erro ao extrair texto do PDF:', error);
    throw new Error('Falha na extração do PDF');
  }
}

// Prompt ajustado para GPT-3.5-Turbo
async function extrairCamposComLLM(textoBruto) {
  try {
    const prompt = `
      Aja como um auditor de faturas de energia (Baixa Tensão).
      Extraia os dados deste texto para um JSON.
      
      DADOS ALVO:
      - Cliente: Nome, CPF/CNPJ, Nº Instalação, Endereço.
      - Técnico: Classe (Residencial/Comercial), Tipo (Monofásico/Bifásico/Trifásico).
      - Financeiro: Total Fatura, Vencimento. Tente achar impostos (ICMS/PIS/COFINS) se possível.
      - Consumo: Leitura atual (kWh) e Histórico dos últimos 12 meses.
      
      Retorne APENAS um JSON válido nesta estrutura:
      {
        "nome": "string",
        "cpfCnpj": "string",
        "numeroInstalacao": "string",
        "vencimento": "dd/mm/aaaa",
        "valorTotalFatura": 0.00,
        "endereco": {
          "rua": "", "numero": "", "bairro": "", "cidade": "", "estado": "", "cep": ""
        },
        "tipoTensao": "baixa",
        "classe": "Comercial",
        "tipoPadrao": "monofasico/bifasico/trifasico",
        "valorKwh": 0.00,
        "consumoAtualKwh": 0,
        "impostos": { "totalImpostos": 0 },
        "historicoConsumo": {
          "janeiro": 0, "fevereiro": 0, "marco": 0, "abril": 0, "maio": 0, "junho": 0,
          "julho": 0, "agosto": 0, "setembro": 0, "outubro": 0, "novembro": 0, "dezembro": 0
        },
        "mediaInjecao": 0
      }

      Texto:
      ---
      ${textoBruto.substring(0, 3000)}
      ---
    `;

    const response = await openai.chat.completions.create({
      // --- AQUI ESTÁ A MUDANÇA: USANDO O MODELO 3.5 ---
      model: "gpt-3.5-turbo", 
      messages: [{ role: "user", content: prompt }],
      // gpt-3.5 as vezes falha com 'json_object', então removemos o response_format forçado
      // mas mantemos a temperatura baixa para ele ser preciso.
      temperature: 0.1
    });

    let conteudo = response.choices[0].message.content;
    
    // Limpeza de segurança caso o GPT-3.5 mande texto antes do JSON
    if (conteudo.includes("```json")) {
        conteudo = conteudo.split("```json")[1].split("```")[0];
    } else if (conteudo.includes("```")) {
        conteudo = conteudo.split("```")[1].split("```")[0];
    }

    const dadosJSON = JSON.parse(conteudo);

    // Tratamentos de segurança
    dadosJSON.tipoTensao = 'baixa';
    if (!dadosJSON.valorKwh || dadosJSON.valorKwh === 0) {
        if (dadosJSON.valorTotalFatura > 0 && dadosJSON.consumoAtualKwh > 0) {
            dadosJSON.valorKwh = parseFloat((dadosJSON.valorTotalFatura / dadosJSON.consumoAtualKwh).toFixed(2));
        } else {
            dadosJSON.valorKwh = 1.19; 
        }
    }
    
    // Garante média
    dadosJSON.mediaConsumo = calcularMedia(dadosJSON.historicoConsumo);

    return dadosJSON;

  } catch (error) {
    console.error('Erro na IA:', error);
    // Em produção, isso ajuda a ver o que a IA retornou errado
    throw new Error('Falha ao processar dados da fatura.');
  }
}

function calcularMedia(historico) {
  if (!historico) return 0;
  const valores = Object.values(historico).filter(v => v > 0);
  if (valores.length === 0) return 0;
  const soma = valores.reduce((a, b) => a + b, 0);
  return parseFloat((soma / valores.length).toFixed(2));
}

module.exports = { extrairTextoBruto, extrairCamposComLLM };