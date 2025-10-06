const pdfParse = require('pdf-parse');

// Função assíncrona para analisar o PDF e extrair endereço e dados de consumo
async function analisarFaturaCemig(pdfBuffer) {
  try {
    // Parsear o PDF para extrair o texto
    const data = await pdfParse(pdfBuffer);
    const text = data.text.replace(/\s+/g, ' ').trim(); // Normalizar espaços
    console.log('Texto bruto:', text); // Debug pra ver o texto extraído

    // Objeto para armazenar os dados extraídos
    const dados = {
      endereco: {
        rua: '',
        numero: '',
        bairro: '',
        cidade: '',
        estado: '',
        cep: ''
      },
      mediaConsumo: 0,
      historicoConsumo: [], // Array de { mesAno: '', consumoKwh: number }
      mediaInjecao: 0,
      valorKwh: 0
    };

    // Extrair Endereço (rua, número, bairro, cidade, CEP, estado)
    const enderecoMatch = text.match(/((RUA|AV|ALAMEDA|PRAÇA|TRAVESSA)\s+.+?)\s+([A-Z0-9-]+\s+[A-Z\s]+,\s+[A-Z]{2})/i);
    if (enderecoMatch) {
      const ruaCompleta = enderecoMatch[1].trim();
      const partesRua = ruaCompleta.match(/((RUA|AV|ALAMEDA|PRAÇA|TRAVESSA)\s+.+?)\s+(\d+)\s+(.*)/i);
      if (partesRua) {
        dados.endereco.rua = partesRua[1].trim();
        dados.endereco.numero = partesRua[3].trim();
        dados.endereco.bairro = partesRua[4].trim();
      }
      const cidadeCepEstado = enderecoMatch[3].trim().match(/(\d{5}-\d{3})\s+(.+?),\s+([A-Z]{2})/);
      if (cidadeCepEstado) {
        dados.endereco.cep = cidadeCepEstado[1];
        dados.endereco.cidade = cidadeCepEstado[2].trim();
        dados.endereco.estado = cidadeCepEstado[3];
      }
    }

    // Extrair Consumo Médio (da seção "Informações Técnicas")
    const consumoMatch = text.match(/Consumo kWh\s+\w+\s+\d+(?:[.,]\d+)?\s+\d+(?:[.,]\d+)?\s+\d+\s+([\d.,]+)/i);
    if (consumoMatch) {
      dados.mediaConsumo = parseFloat(consumoMatch[1].replace('.', '').replace(',', '.'));
    }

    // Extrair Histórico de Consumo (ajustado pra 4 colunas)
    const historicoSection = text.match(/Histórico de Consumo\s+(.+?)(Reservado ao Fisco)/s);
    if (historicoSection) {
      const historicoText = historicoSection[1].trim();
      const linhas = historicoText.split(/\s+/).filter(Boolean);
      for (let i = 0; i < linhas.length; i += 4) { // 4 colunas: MÊS/ANO, Cons. kWh, Média kWh/Dia, Dias
        if (linhas[i] && linhas[i + 1] && !isNaN(parseFloat(linhas[i + 1])) && linhas[i].match(/^\w{3}\/\d{2}$/)) {
          dados.historicoConsumo.push({
            mesAno: linhas[i],
            consumoKwh: parseFloat(linhas[i + 1].replace('.', '').replace(',', '.'))
          });
        }
      }
      // Calcular média de consumo se não definido
      if (dados.mediaConsumo === 0 && dados.historicoConsumo.length > 0) {
        const totalConsumo = dados.historicoConsumo.reduce((sum, item) => sum + item.consumoKwh, 0);
        dados.mediaConsumo = totalConsumo / dados.historicoConsumo.length;
      }
    }

    // Extrair Média de Injeção (da seção "Informações Técnicas")
    const injecaoMatch = text.match(/Energia Injetada\s+\w+\s+\d+(?:[.,]\d+)?\s+\d+(?:[.,]\d+)?\s+(\d+(?:[.,]\d+)?)/i);
    if (injecaoMatch) {
      dados.mediaInjecao = parseFloat(injecaoMatch[1].replace('.', '').replace(',', '.'));
    }

    // Extrair Valor do kWh (da seção "Valores Faturados")
    const valorKwhMatch = text.match(/Energia Elétrica\s+kWh\s+\d+\s+([\d,.]+)/i);
    if (valorKwhMatch) {
      dados.valorKwh = parseFloat(valorKwhMatch[1].replace(',', '.'));
    }

    return dados;
  } catch (error) {
    console.error('Erro ao analisar PDF:', error);
    throw new Error('Falha na análise do PDF');
  }
}

module.exports = { analisarFaturaCemig };