// Backend/integracao-flow.js
const criarConta = require('./rotas/enviaconta');
const criarContato = require('./rotas/enviacontato');
const criarOportunidade = require('./rotas/enviaoportunidade');
const criarCotacao = require('./rotas/enviacotacao');
const criarOrdemServico = require('./rotas/enviaos'); // <--- 1. FALTAVA ESSE IMPORT

async function executarFluxoIntegracao(dadosProposta) {
    console.log("==========================================");
    console.log("🔄 INICIANDO FLUXO COMPLETO (ACC -> CTC -> OPP -> QT -> OS)");
    console.log("==========================================");

    try {
        // 1. CONTA
        console.log("1️⃣  Chamando Módulo Conta...");
        const accountId = await criarConta(dadosProposta);
        if (!accountId) throw new Error("Falha na Conta.");
        console.log(`💾 Conta OK: ${accountId}`);

        // 2. CONTATO
        console.log("2️⃣  Chamando Módulo Contato...");
        const contactId = await criarContato(dadosProposta, accountId);
        console.log(`💾 Contato OK: ${contactId}`);

        // 3. OPORTUNIDADE
        console.log("3️⃣  Chamando Módulo Oportunidade...");
        const opportunityId = await criarOportunidade(dadosProposta, accountId);
        if (!opportunityId) throw new Error("Falha na Oportunidade.");
        console.log(`💾 Oportunidade OK: ${opportunityId}`);

        // 4. COTAÇÃO
        console.log("4️⃣  Chamando Módulo Cotação...");
        // 2. CORREÇÃO: Adicionei 'contactId' aqui para vincular na cotação
        const quoteId = await criarCotacao(dadosProposta, accountId, opportunityId, contactId);
        console.log(`💾 Cotação OK: ${quoteId}`);

        // (REMOVI O RETURN QUE ESTAVA AQUI E PARAVA O CÓDIGO)

        // 5. ORDEM DE SERVIÇO
        console.log("5️⃣  Chamando Módulo Ordem de Serviço...");
        const serviceOrderId = await criarOrdemServico(dadosProposta, accountId, quoteId, opportunityId);
        console.log(`💾 OS OK: ${serviceOrderId}`);

        console.log("==========================================");
        console.log(`🏁 FLUXO FINALIZADO!`);
        console.log(`   IDs: ACC=${accountId} | OPP=${opportunityId} | QT=${quoteId} | OS=${serviceOrderId}`);
        console.log("==========================================");

        return { success: true, accountId, contactId, opportunityId, quoteId, serviceOrderId };

    } catch (error) {
        console.error("⚠️ FLUXO INTERROMPIDO:", error.message);
        return { success: false, error: error.message };
    }
}

module.exports = { executarFluxoIntegracao };