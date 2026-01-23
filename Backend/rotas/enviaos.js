// Backend/rotas/enviaos.js
const { getSalesforceConnection } = require('./salesforce-auth');

async function criaOrdemServico(dados, accountId, quoteId, opportunityId) {
    console.log(`🛠️ [CriaOS] Iniciando para Quote ID: ${quoteId}`);

    if (!quoteId) throw new Error('ID da Cotação é obrigatório para criar a OS.');

    const conn = await getSalesforceConnection();

    // Mapping dos campos baseados na sua lista
    const osMap = {
        // Vínculos e Status
        status: "Aguardando Aprovação", // Valor corrigido no passo anterior
        empresaProprietaria: "Flex Energy",
        
        // Dados de Energia
        concessionariaEnergia: dados.concessionaria,
        numeroInstalacao1: dados.numeroInstalacao,
        consumoInstalacao1: parseFloat(dados.consumo || 0),
        quantidadeInstalacoes: "1", 
        
        // Dados de Acesso 
        loginCemig: dados.loginConcessionaria || "",
        senhaCemig: dados.senhaConcessionaria || "",
        
        // Dados do Cliente Final 
        clienteFinal: dados.nomeConta,
        
        // --- CORREÇÃO AQUI: LIMPEZA DO CNPJ ---
        cnpj: dados.cnpj ? dados.cnpj.replace(/\D/g, '') : null, // Remove pontos/traços para ficar com 14 dígitos
        
        cpfCnpjClienteFinal: dados.cnpj || dados.cpf,
        emailClienteFinal: dados.email,
        celularClienteFinal: dados.celular,
        enderecoClienteFinal: `${dados.ruaCobranca}, ${dados.cidadeCobranca} - ${dados.estadoCobranca}`,
        cidadeClienteFinal: dados.cidadeCobranca,
        estadoClienteFinal: dados.estadoCobranca, 
        
        // Dados do Responsável 
        nomeResponsavel: dados.representante || "Comercial Flex",
        emailResponsavel: dados.email, 
        
        // Dados Contratuais
        periodoFidelidade: 12, 
        prazoDenuncia: 120,     
        observacoes: `OS Gerada via Integração.\nOrigem: ${dados.origem}`
    };

    const fullPayload = {
        meta: { idInterno: `OS-${Date.now()}`, origemSistema: "Worker Node" },
        serviceOrder: osMap,
        account: { idSalesforce: accountId },
        quote: { idSalesforce: quoteId },
        opportunity: { idSalesforce: opportunityId },
        lead: null, contact: null
    };

    try {
        console.log(`🚀 [CriaOS] Enviando Ordem de Serviço...`);
        const result = await conn.apex.post('/IntegracaoPropostas/', fullPayload);

        if (result.success && result.serviceOrderId) {
            console.log(`✅ [CriaOS] Sucesso! ID: ${result.serviceOrderId}`);
            return result.serviceOrderId;
        } else {
            throw new Error(`Erro API Apex: ${result.message}`);
        }
    } catch (error) {
        console.error(`❌ [CriaOS] Falha: ${error.message}`);
        throw error;
    }
}

module.exports = criaOrdemServico;