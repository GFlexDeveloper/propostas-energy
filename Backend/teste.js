// Backend/teste-manual.js
const { executarFluxoIntegracao } = require('./integracao-flow');

const dadosParaTeste = {
    // --- Identificação ---
    nomeConta: "Empresa Teste Completa Ltda",
    cnpj: "59.530.636/0001-36",
    email: "diretoria@testecompleto.com.br",
    telefone: "11999998888",
    celular: "11999997777",

    // --- Identificadores e Energia ---
    numeroInstalacao: "300999111",
    concessionaria: "Cemig",
    representante: "Ricardo Hilário",
    fimFidelidade: "2025-12-31",
    origem: "Teste Script Node", // Vai para origemLead
    mensagem: "Testando criação de Oportunidade com TODOS os campos",

    // --- Picklists da Conta ---
    categoriaConta: "Pessoa Jurídica",
    tipoContaLuz: "Baixa Tensao", // O Apex vai ajustar para "Baixa Tensão" na Opp
    temInscricaoEstadual: "Não",
    faseContaLuz: "Trifásico",      // Verifique se esse valor existe na sua Picklist
    valorTarifa: 1.05,
    iluminacaoPublica: 45.50,
    tempoContrato: "1 Ano",
    setor: "Energia",
    // Adicione no dadosParaTeste
loginConcessionaria: "usuario_cemig_teste",
senhaConcessionaria: "123456",

    // --- 💰 DADOS FINANCEIROS (Oportunidade) ---
    consumo: 2500,              // Quantidade (kWh)
    valorKwh: 1.15,             // Preço Unitário
    valorPagoFlexAnual: 35000,  // Valor Total da Proposta (Amount)
    economiaMedia: 450.00,      // Para descrição
    desconto: 5,                // 5% de desconto

    // --- 🆕 CAMPOS ESPECÍFICOS DA OPORTUNIDADE (Que faltavam) ---
    faixaConsumo: "2000 - 10000 kW", 
    pontosConexao: 3, 
    etapaContrato: "Contrato Enviado", 
    categoriaLead: "Indicação", // Vai para a Descrição
    temContratoConcorrente: "Sim", // Mapeado no JS para possuiContratoConcorrente
    temperatura: "Quente",
    empresaProprietaria: "Flex Energy", // Para garantir

    // --- Endereço ---
    ruaCobranca: "Av. do Teste Final, 2024",
    cidadeCobranca: "Belo Horizonte",
    estadoCobranca: "MG",
    cepCobranca: "30130-999",
    paisCobranca: "Brasil"
};

async function rodarTeste() {
    console.clear();
    console.log("▶️  RODANDO TESTE COMPLETO (ACC -> CTC -> OPP)");
    try {
        await executarFluxoIntegracao(dadosParaTeste);
    } catch (erro) {
        console.error("\n💥 ERRO:", erro);
    }
}

rodarTeste();