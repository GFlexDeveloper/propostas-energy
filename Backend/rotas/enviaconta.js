// Backend/criaconta.js
const { getSalesforceConnection } = require('./salesforce-auth');

/**
 * Função para criar/atualizar Conta via API Apex Customizada (/IntegracaoPropostas/)
 * Alinhada estritamente com o método upsertAccount fornecido.
 */
async function criarConta(dados) {
    console.log(`👤 [CriaConta] Iniciando para: ${dados.nomeConta}`);

    // 1. Conecta
    const conn = await getSalesforceConnection();

    // 2. Funções auxiliares
    const apenasNumeros = (val) => val ? String(val).replace(/[^0-9]/g, '') : null;
    
    // 3. Preparar o Payload "Account" com as CHAVES EXATAS do Apex
    const accountMap = {
        // --- Chaves Identificadas no seu Apex ---
        
        // Identificação Básica
        nomeConta: dados.nomeConta,
        cnpj: apenasNumeros(dados.cnpj),
        cpf: apenasNumeros(dados.cpf),
        site: dados.origem === 'App vendedores externos',
        
        // Dados de Energia
        setor: dados.setor || 'Energia',
        consumoKWh: parseFloat(dados.consumo || 0),
        
        // Chaves Críticas (Mudamos aqui para bater com seu Apex)
        UC: dados.numeroInstalacao,                 // Apex: accMap.get('UC')
        concessionaria: dados.concessionaria,       // Apex: accMap.get('concessionaria')
        concessionariaEnergia: dados.concessionaria,// Apex: accMap.get('concessionariaEnergia') (Mantendo compatibilidade)
        
        // Contato e Descrição
        telefone: dados.telefone,
        descricao: dados.mensagem ? `Mensagem: ${dados.mensagem}` : 'Integração app externos',
        representante: dados.representante,         // Apex: accMap.get('representante')
        
        // Chaves Específicas
        empresaproprietaria: "Flex Energy",         // Apex: accMap.get('empresaproprietaria')
        Fimdafidelidade: dados.fimFidelidade,       // Apex: accMap.get('Fimdafidelidade')
        
 
        categoriaConta: dados.categoriaConta,
        tipoContaLuz: dados.tipoContaLuz,
        temInscricaoEstadual: dados.temInscricaoEstadual || 'Não',
        possuiContratoConcorrente: dados.temContratoConcorrente || 'Não',


        enderecoCobranca: {
            rua: dados.ruaCobranca,
            cidade: dados.cidadeCobranca,
            estado: dados.estadoCobranca,
            cep: dados.cepCobranca,
            pais: dados.paisCobranca || 'Brasil'
        }
    };


    const fullPayload = {
        meta: {
            idInterno: `ACC-${Date.now()}`,
            origemSistema: "Worker CriaConta Node"
        },
        account: accountMap,

        lead: {},
        contact: {},
        opportunity: {},
        quote: {},
        serviceOrder: {}
    };

    try {

        const result = await conn.apex.post('/IntegracaoPropostas/', fullPayload);

        if (result.success && result.accountId) {
            console.log(`✅ [CriaConta] Conta processada! ID: ${result.accountId}`);
            return result.accountId; // Retorna o ID para o próximo passo
        } else {
            throw new Error(`Erro API Apex: ${result.message || 'Retorno desconhecido'}`);
        }

    } catch (error) {
        console.error(`❌ [CriaConta] Falha: ${error.message}`);
        throw error;
    }
}

module.exports = criarConta;