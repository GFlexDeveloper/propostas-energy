// Backend/rotas/enviaoportunidade.js
const { getSalesforceConnection } = require('./salesforce-auth');

async function criaOportunidade(dados, accountId) {
    console.log(`💼 [CriaOportunidade] Iniciando para Conta ID: ${accountId}`);

    if (!accountId) throw new Error('ID da Conta é obrigatório.');

    const conn = await getSalesforceConnection();

    // Datas
    const hoje = new Date(); // Data de hoje para fechamento

    const nomeOportunidade = `Proposta Web - ${dados.nome || dados.nomeConta}`;
    const quantidade = parseFloat(dados.consumo || 0);
    const precoUnitario = parseFloat(dados.valorKwh || 1.19);

    // Itens (Produto)
    const listaItens = [];
    if (quantidade > 0) {
        listaItens.push({
            codigoProduto: "Quilowatt Hora/Mês",
            quantidade: quantidade,
            precoUnitario: precoUnitario,
            descricao: "Consumo Estimado via Web",
            percentualDesconto: parseFloat(dados.desconto || 0)
        });
    }

    // === MAPEAMENTO COMPLETO (ID Flex + Campos Novos) ===
    const oppMap = {
        // --- 1. CONFIGURAÇÕES FIXAS DA FLEX ---
        empresaProprietaria: "Flex Energy", // Ou dados.empresaProprietaria
        iddaempresaproprietaria: "012bJ000000h4bRQAQ", // <--- SEU ID HARDCODED AQUI
        
        // --- 2. DADOS BÁSICOS ---
        nomeOportunidade: nomeOportunidade,
        fase: "Fechado Ganho",           // Você pediu para fixar como Ganho
        dataFechamento: hoje.toISOString().split('T')[0], 
        valor: parseFloat(dados.valorPagoFlexAnual || 0), 
        probabilidade: 100,              
        origemLead: dados.origem || "App vendedores externos",
        tipo: "Primeira Oportunidade",   
        
        // --- 3. CAMPOS ESPECÍFICOS (Que estavam faltando no seu snippet) ---
        faixaConsumo: dados.faixaConsumo || "500 - 2000 kW", 
        pontosConexao: parseFloat(dados.pontosConexao || 1),
        concessionariaEnergia: dados.concessionaria || dados.distribuidora,
        tipoContaLuz: dados.tipoContaLuz, 
        etapaContrato: "Contrato Enviado", 
        possuiContratoConcorrente: dados.temContratoConcorrente || "Não",
        temperatura: "Quente", 
        datadeenviodocontrato: hoje.toISOString().split('T')[0],
        // --- 4. TÉCNICOS ---
        consumoKWh: quantidade,
        consumoDeclarado_kW: quantidade,
        categoriaConta: dados.categoriaConta,
        
        // --- 5. ITENS ---
        itens: listaItens,
        
        // --- 6. DESCRIÇÃO ---
        descricao: `Gerada via Integração Web.
        Categoria do Lead Original: ${dados.categoriaLead || 'N/A'}
        Concessionária: ${dados.concessionaria}
        Economia Estimada: R$ ${dados.economiaMedia || 0}`
    };

    const fullPayload = {
        meta: { idInterno: `OPP-${Date.now()}`, origemSistema: "Worker Node" },
        opportunity: oppMap,
        account: { idSalesforce: accountId },
        lead: null, contact: null, quote: null, serviceOrder: null
    };

    try {
        const result = await conn.apex.post('/IntegracaoPropostas/', fullPayload);
        if (result.success && result.opportunityId) {
            console.log(`✅ [CriaOportunidade] Sucesso! ID: ${result.opportunityId}`);
            return result.opportunityId;
        } else {
            throw new Error(`Erro API Apex: ${result.message}`);
        }
    } catch (error) {
        console.error(`❌ [CriaOportunidade] Falha: ${error.message}`);
        throw error;
    }
}

module.exports = criaOportunidade;