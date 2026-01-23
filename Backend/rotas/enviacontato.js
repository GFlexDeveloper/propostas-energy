// Backend/rotas/enviacontato.js
const { getSalesforceConnection } = require('./salesforce-auth');

/**
 * Cria o Contato vinculado à Conta.
 * Campos: Nome, Sobrenome, Email, Celular e Vínculo com a Conta.
 */
async function criaContato(dados, accountId) {
    console.log(`👤 [CriaContato] Iniciando vínculo com Conta: ${accountId}`);

    if (!accountId) {
        throw new Error('ID da Conta é obrigatório para criar o contato.');
    }

    const conn = await getSalesforceConnection();

    // LÓGICA DE NOME:
    // O Salesforce exige Sobrenome (LastName). 
    // Se o nome vier de uma empresa (PJ), jogamos tudo no Sobrenome para não quebrar.
    const nomeOriginal = dados.nome || dados.nomeConta || 'Cliente Sem Nome';
    let primeiroNome = '';
    let sobrenome = nomeOriginal;

    // Se parecer nome de pessoa (tem espaço e não é gigante), tenta separar
    if (nomeOriginal.includes(' ') && nomeOriginal.length < 50) {
        const parts = nomeOriginal.split(' ');
        primeiroNome = parts[0];
        sobrenome = parts.slice(1).join(' ');
    }
    
    // 1. Payload do Contato (Simplificado)
    const contactMap = {
        // Identificação
        primeiroNome: primeiroNome,         // Apex: getString(cMap, 'primeiroNome')
        sobrenome: sobrenome,               // Apex: getString(cMap, 'sobrenome')
        
        // Dados de Contato
        email: dados.email || null,
        celular: dados.celular || dados.contato || dados.telefone || null, // Prioridade: Celular > Contato > Telefone
        telefone: dados.telefone || null,
        
        // Vínculos Obrigatórios da Regra de Negócio
        empresaProprietaria: "Flex Energy",
        concessionariaEnergia: dados.concessionaria || dados.distribuidora
    };

    // 2. Payload da Conta (APENAS PARA VÍNCULO)
    // Ao enviar o ID aqui, seu Apex retorna ele e usa para preencher 'AccountId' no contato.
    // Isso preenche o campo "Nome da Conta" no Salesforce.
    const accountReferenceMap = {
        idSalesforce: accountId
    };

    // 3. Monta o Envelope Geral
    const fullPayload = {
        meta: {
            idInterno: `CTC-${Date.now()}`,
            origemSistema: "Worker Node"
        },
        contact: contactMap,
        account: accountReferenceMap, // <--- O VÍNCULO ACONTECE AQUI
        
        // Outros vazios
        lead: {}, opportunity: {}, quote: {}, serviceOrder: {}
    };

    try {
        const result = await conn.apex.post('/IntegracaoPropostas/', fullPayload);

        if (result.success && result.contactId) {
            console.log(`✅ [CriaContato] Sucesso! ID: ${result.contactId}`);
            return result.contactId;
        } else {
            throw new Error(`Erro API Apex: ${result.message}`);
        }
    } catch (error) {
        console.error(`❌ [CriaContato] Falha: ${error.message}`);
        throw error;
    }
}

module.exports = criaContato;