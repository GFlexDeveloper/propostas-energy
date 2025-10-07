// Função para extrair o parâmetro "instalacao" da URL
function getNumeroInstalacao() {
    const params = new URLSearchParams(window.location.search);
    return params.get('instalacao');
}

// Função para formatar valores como moeda (R$)
function formatarMoeda(valor) {
    if (typeof valor !== 'number') {
        valor = 0;
    }
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Função para preencher um elemento do HTML
function preencherCampo(id, valor, formatador) {
    const elemento = document.getElementById(id);
    if (elemento) {
        elemento.textContent = formatador ? formatador(valor) : valor;
    }
}

// Função principal para buscar e exibir a proposta
async function buscarEExibirProposta(numeroInstalacao) {
    const loadingDiv = document.getElementById('loading');
    const proposalDiv = document.getElementById('proposal-content');

    try {
        const response = await fetch(`https://propostas-energy.onrender.com/api/propostas/instalacao/${numeroInstalacao}`);
        
        if (!response.ok) {
            throw new Error('Proposta não encontrada ou erro no servidor.');
        }

        const result = await response.json();

        if (result.success && result.data) {
            const proposta = result.data;
            
            // Preenche o cabeçalho
            preencherCampo('proposta-id', proposta.id);
            preencherCampo('proposta-data', new Date(proposta.data_criacao).toLocaleDateString('pt-BR'));
            preencherCampo('cliente-nome', proposta.nome);
            preencherCampo('cliente-documento', proposta.cpf_cnpj);
            preencherCampo('cliente-endereco', proposta.endereco);
            preencherCampo('cliente-instalacao', proposta.numero_instalacao);

            // Preenche os cards
            preencherCampo('fatura-cemig', proposta.valor_pago_cemig_media, formatarMoeda);
            preencherCampo('consumo-medio', proposta.media_consumo);
            preencherCampo('desconto', `${proposta.desconto || 0}%`);
            preencherCampo('fatura-flex', proposta.valor_pago_flex_media, formatarMoeda);
            preencherCampo('economia-mensal', proposta.economia_media, formatarMoeda);
            preencherCampo('economia-anual', proposta.economia_anual, formatarMoeda);
            
            // Preenche a tabela de simulação
            preencherCampo('tabela-cemig-mensal', proposta.valor_pago_cemig_media, formatarMoeda);
            preencherCampo('tabela-cemig-anual', proposta.valor_pago_cemig_anual, formatarMoeda);
            preencherCampo('tabela-flex-mensal', proposta.valor_pago_flex_media, formatarMoeda);
            preencherCampo('tabela-flex-anual', proposta.valor_pago_flex_anual, formatarMoeda);
            preencherCampo('tabela-economia-mensal', proposta.economia_media, formatarMoeda);
            preencherCampo('tabela-economia-anual', proposta.economia_anual, formatarMoeda);

            // Mostra o conteúdo e esconde o "carregando"
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

// Inicialização ao carregar a página
window.onload = function() {
    const numeroInstalacao = getNumeroInstalacao();
    if (!numeroInstalacao) {
        const loadingDiv = document.getElementById('loading');
        loadingDiv.textContent = 'Erro: Número de instalação não informado na URL.';
        loadingDiv.style.color = 'red';
        return;
    }
    buscarEExibirProposta(numeroInstalacao);
};