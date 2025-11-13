// Frontend/proposta.js (CORRIGIDO)

FlexAuth.init(); // Protege a página

function getNumeroInstalacao() {
    return new URLSearchParams(window.location.search).get('instalacao');
}

function formatarMoeda(valor) {
    return (Number(valor) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function preencherCampo(id, valor, formatador) {
    const elemento = document.getElementById(id);
    if (elemento) {
        // Adiciona uma verificação para consumo médio, caso seja 0 ou null
        if (id === 'consumo-medio' && (!valor || valor == 0)) {
            elemento.textContent = 'N/A';
            return;
        }
        elemento.textContent = formatador ? formatador(valor) : (valor || 'N/A');
    }
}

async function buscarEExibirProposta(numeroInstalacao) {
    const loadingDiv = document.getElementById('loading');
    const proposalDiv = document.getElementById('proposal-content');

    try {
        const response = await FlexAuth.fetchWithAuth(`/api/propostas/instalacao/${numeroInstalacao}`);
        
        if (!response.ok) {
            throw new Error(`Proposta não encontrada (status: ${response.status})`);
        }

        const result = await response.json();

        if (result.success && result.data) {
            const proposta = result.data;
            
            preencherCampo('proposta-id', proposta.id);
            preencherCampo('proposta-data', new Date(proposta.data_criacao).toLocaleDateString('pt-BR'));
            preencherCampo('cliente-nome', proposta.nome);
            preencherCampo('cliente-documento', proposta.cpf_cnpj);
            preencherCampo('cliente-endereco', proposta.endereco);
            preencherCampo('cliente-instalacao', proposta.numero_instalacao);

            preencherCampo('fatura-cemig', proposta.valor_pago_cemig_media, formatarMoeda);
            preencherCampo('consumo-medio', proposta.media_consumo); // Agora deve ter o valor correto
            preencherCampo('desconto', `${proposta.desconto || 0}%`);
            preencherCampo('fatura-flex', proposta.valor_pago_flex_media, formatarMoeda);
            preencherCampo('economia-mensal', proposta.economia_media, formatarMoeda);
            preencherCampo('economia-anual', proposta.economia_anual, formatarMoeda);
            
            preencherCampo('tabela-cemig-mensal', proposta.valor_pago_cemig_media, formatarMoeda);
            preencherCampo('tabela-cemig-anual', proposta.valor_pago_cemig_anual, formatarMoeda);
            preencherCampo('tabela-flex-mensal', proposta.valor_pago_flex_media, formatarMoeda);
            preencherCampo('tabela-flex-anual', proposta.valor_pago_flex_anual, formatarMoeda);
            preencherCampo('tabela-economia-mensal', proposta.economia_media, formatarMoeda);
            preencherCampo('tabela-economia-anual', proposta.economia_anual, formatarMoeda);

            loadingDiv.classList.add('hidden');
            proposalDiv.classList.remove('hidden');
        } else {
            throw new Error(result.message || 'Dados da proposta não encontrados.');
        }
    } catch (err) {
        loadingDiv.textContent = `Erro ao carregar a proposta: ${err.message}`;
        loadingDiv.style.color = 'red';
    }
}

// --- CORREÇÃO AQUI ---
// Removemos o 'window.onload' e chamamos a função de busca diretamente.
const numeroInstalacao = getNumeroInstalacao();
if (!numeroInstalacao) {
    document.getElementById('loading').textContent = 'Erro: Número de instalação não informado na URL.';
} else {
    buscarEExibirProposta(numeroInstalacao);
}