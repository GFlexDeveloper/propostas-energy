// Backend/rotas/enviacotacao.js
const { getSalesforceConnection } = require('./salesforce-auth');

async function criaCotacao(dados, accountId, opportunityId, contactId) {
    // ... (código anterior de conexão e datas igual) ...
    const conn = await getSalesforceConnection();
    const hoje = new Date();
    const dataValidade = new Date();
    dataValidade.setDate(hoje.getDate() + 15);
    
    const quantidade = parseFloat(dados.consumo || 0);
    const precoUnitario = parseFloat(dados.valorKwh || 1.19);
    
    const listaItens = [];
    if (quantidade > 0) {
        listaItens.push({
            codigoProduto: "Quilowatt Hora/Mês", 
            quantidade: quantidade,
            precoUnitario: precoUnitario,
            descricao: "Consumo Estimado",
            percentualDesconto: parseFloat(dados.desconto || 0)
        });
    }

    // === MAPEAMENTO ATUALIZADO ===
    const quoteMap = {
        nomeCotacao: `Proposta Comercial - ${dados.nome || dados.nomeConta}`,
        dataValidade: dataValidade.toISOString().split('T')[0],
        status: "Aceito",
        descricao: `Gerada via Integração Web.`,
        Appexternos: "Sim",
        // Campos que já existiam
        empresaProprietaria: dados.empresaProprietaria || "Flex Energy",
        concessionariaEnergia: dados.concessionaria, // Verifica se é "CEMIG" ou "Cemig"
        consumoKw: quantidade,
        
        // NOVOS CAMPOS PREENCHIDOS
        faseContaLuz: dados.faseContaLuz || "Bifásico", // Exemplo padrão
        valorTarifa: parseFloat(dados.valorTarifa || 0.95), 
        iluminacaoPublica: parseFloat(dados.iluminacaoPublica || 50.00),
        tempoContrato: dados.tempoContrato || "", // Verifique os valores da sua Picklist
        
        
        itens: listaItens
    };

    const fullPayload = {
        meta: { idInterno: `QT-${Date.now()}`, origemSistema: "Worker Node" },
        quote: quoteMap,
        opportunity: { idSalesforce: opportunityId },
        account: { idSalesforce: accountId },
        contact: { idSalesforce: contactId },
        lead: null, serviceOrder: null 
    };

    // ... (envio para API igual ao anterior) ...
    try {
        console.log(`🚀 [CriaCotacao] Enviando Cotação...`);
        const result = await conn.apex.post('/IntegracaoPropostas/', fullPayload);
        if (result.success && result.quoteId) return result.quoteId;
        else throw new Error(result.message);
    } catch (error) { throw error; }
}

module.exports = criaCotacao;