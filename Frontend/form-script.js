document.addEventListener('DOMContentLoaded', function() {
    // === CONSTANTES E ELEMENTOS DO DOM ===
    const VALOR_KWH_PADRAO = 1.19;
    const proposalForm = document.getElementById('proposalForm');
    if (!proposalForm) return; // Se não houver formulário, não faz nada

    // Elementos do formulário
    const tipoTensao = document.getElementById('tipoTensao');
    const secaoBaixaTensao = document.getElementById('secaoBaixaTensao');
    const tipoConsumo = document.getElementById('tipoConsumo');
    const consumoMensal = document.getElementById('consumoMensal');
    const consumoMedia = document.getElementById('consumoMedia');
    const geracaoPropria = document.getElementById('geracaoPropria');
    const injecaoMedia = document.getElementById('injecaoMedia');
    const cepInput = document.getElementById('cep');
    const cpfCnpjInput = document.getElementById('cpfCnpj');
    const contatoInput = document.getElementById('contato');

    // Remove a classe 'loading' para iniciar as animações CSS
    document.body.classList.remove('loading');

    // === FUNÇÕES DE CONTROLE DO FORMULÁRIO ===

    // Controla a visibilidade da seção de baixa tensão
    function controlarSecaoBaixaTensao() {
        if (!tipoTensao || !secaoBaixaTensao) return;

        if (tipoTensao.value === 'baixa') {
            secaoBaixaTensao.classList.add('visible');
            secaoBaixaTensao.classList.remove('hidden-section');
            tornarCamposObrigatorios(true);
        } else {
            secaoBaixaTensao.classList.remove('visible');
            secaoBaixaTensao.classList.add('hidden-section');
            tornarCamposObrigatorios(false);
        }
    }

    // Define campos como obrigatórios ou não
    function tornarCamposObrigatorios(obrigatorio) {
        const campos = ['tipoPadrao', 'geracaoPropria'];
        campos.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.required = !!obrigatorio;
                if (!obrigatorio) element.value = ''; // Limpa a seleção se não for obrigatório
            }
        });
    }

    // Alterna entre os campos de consumo mensal e média
    function alternarTipoConsumo() {
        if (!tipoConsumo || !consumoMensal || !consumoMedia) return;
        
        if (tipoConsumo.value === 'mensal') {
            consumoMensal.classList.remove('hidden');
            consumoMedia.classList.add('hidden');
        } else {
            consumoMensal.classList.add('hidden');
            consumoMedia.classList.remove('hidden');
        }
    }

    // Mostra/oculta o campo de injeção de energia
    function controlarInjecaoMedia() {
        if (!geracaoPropria || !injecaoMedia) return;

        if (geracaoPropria.value === 'sim') {
            injecaoMedia.classList.remove('hidden');
        } else {
            injecaoMedia.classList.add('hidden');
        }
    }

    // === FUNÇÕES DE FORMATAÇÃO E API (MÁSCARAS E CEP) ===

    const formatadores = {
        cep: (v) => v.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2').substring(0, 9),
        cpfCnpj: (v) => {
            v = v.replace(/\D/g, '');
            if (v.length <= 11) { // CPF
                return v.replace(/(\d{3})(\d)/, '$1.$2')
                        .replace(/(\d{3})(\d)/, '$1.$2')
                        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
            } else { // CNPJ
                return v.substring(0, 14)
                        .replace(/^(\d{2})(\d)/, '$1.$2')
                        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
                        .replace(/\.(\d{3})(\d)/, '.$1/$2')
                        .replace(/(\d{4})(\d)/, '$1-$2');
            }
        },
        telefone: (v) => {
            v = v.replace(/\D/g, '');
            if (v.length > 10) { // Celular
                return v.substring(0, 11).replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
            } else { // Fixo
                return v.substring(0, 10).replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
            }
        }
    };

    async function buscarEnderecoPorCEP() {
        const cep = cepInput.value.replace(/\D/g, '');
        if (cep.length !== 8) return;

        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();
            if (!data.erro) {
                document.getElementById('rua').value = data.logradouro || '';
                document.getElementById('bairro').value = data.bairro || '';
                document.getElementById('cidade').value = data.localidade || '';
                document.getElementById('estado').value = data.uf || '';
                document.getElementById('numero').focus(); // Foco no próximo campo
            } else {
                alert('CEP não encontrado.');
            }
        } catch (error) {
            alert('Erro ao buscar CEP. Verifique sua conexão.');
        }
    }

    // === LÓGICA DE CÁLCULO E ENVIO ===

    function calcularEconomia(data) {
        // Implementação da função de cálculo (sem alterações)
        const valorKwh = parseFloat(data.valorKwh) || VALOR_KWH_PADRAO;
        const desconto = parseFloat(data.desconto) || 0;
        let economiaMedia = 0, economiaAnual = 0, valorPagoFlexMedia = 0, valorPagoFlexAnual = 0, valorPagoCemigMedia = 0, valorPagoCemigAnual = 0;
        
        if (data.tipoTensao === 'baixa' && data.tipoPadrao) {
            const custoDisponibilidadeKwh = {'monofasico': 30, 'bifasico': 50, 'trifasico': 100}[data.tipoPadrao] || 0;
            const geracao = (data.geracaoPropria === 'sim') ? (parseFloat(data.mediaInjecao) || 0) : 0;
            const custoIluminacaoPublica = 20; // Valor exemplo
            let consumoCalculado = 0;

            if (data.tipoConsumo === 'media') {
                consumoCalculado = parseFloat(data.mediaConsumo) || 0;
            } else {
                const meses = ['janeiro','fevereiro','marco','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
                let totalConsumo = 0;
                let mesesPreenchidos = 0;
                meses.forEach(mes => {
                    const consumoMes = parseFloat(data[mes]) || 0;
                    if (consumoMes > 0) {
                        totalConsumo += consumoMes;
                        mesesPreenchidos++;
                    }
                });
                consumoCalculado = mesesPreenchidos > 0 ? totalConsumo / mesesPreenchidos : 0;
            }

            if (consumoCalculado > 0) {
                economiaMedia = (consumoCalculado - custoDisponibilidadeKwh - geracao) * valorKwh * (desconto / 100);
                economiaMedia = Math.max(0, economiaMedia); // Garante que a economia não seja negativa
                valorPagoFlexMedia = (consumoCalculado * valorKwh) - economiaMedia + (custoDisponibilidadeKwh * valorKwh) + custoIluminacaoPublica;
                valorPagoCemigMedia = (consumoCalculado * valorKwh) + custoIluminacaoPublica;
                economiaAnual = economiaMedia * 12;
                valorPagoFlexAnual = valorPagoFlexMedia * 12;
                valorPagoCemigAnual = valorPagoCemigMedia * 12;
            }
        }
        return { economiaMedia, economiaAnual, valorPagoFlexMedia, valorPagoFlexAnual, valorPagoCemigMedia, valorPagoCemigAnual };
    }

    async function handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(proposalForm);
        const data = Object.fromEntries(formData.entries());

        // Monta endereço completo
        data.endereco = `${data.rua}, ${data.numero}${data.complemento ? ' - ' + data.complemento : ''}, ${data.bairro}, ${data.cidade} - ${data.estado}, CEP: ${data.cep}`;
        
        // Calcula economia
        Object.assign(data, calcularEconomia(data));

        // Converte campos numéricos que podem estar vazios
        const numericFields = ['janeiro','fevereiro','marco','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro','mediaConsumo','mediaInjecao','desconto','valorKwh'];
        numericFields.forEach(field => {
            data[field] = data[field] ? parseFloat(data[field]) : null;
        });

        // Feedback visual de envio
        const submitBtn = proposalForm.querySelector('.btn-enviar');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '⏳ Enviando...';
        submitBtn.disabled = true;

        try {
            const response = await fetch('https://propostas-energy.onrender.com/api/propostas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            if (result.success) {
                alert('✅ Proposta salva com sucesso! ID: ' + result.id);
                window.location.href = `proposta.html?instalacao=${encodeURIComponent(data.numeroInstalacao)}`;
            } else {
                alert(`❌ Erro ao salvar proposta: ${result.message}`);
            }
        } catch (error) {
            alert('❌ Erro de conexão com o servidor. Tente novamente.');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    // === EVENT LISTENERS ===
    if (tipoTensao) tipoTensao.addEventListener('change', controlarSecaoBaixaTensao);
    if (tipoConsumo) tipoConsumo.addEventListener('change', alternarTipoConsumo);
    if (geracaoPropria) geracaoPropria.addEventListener('change', controlarInjecaoMedia);
    if (cepInput) {
        cepInput.addEventListener('input', (e) => e.target.value = formatadores.cep(e.target.value));
        cepInput.addEventListener('blur', buscarEnderecoPorCEP);
    }
    if (cpfCnpjInput) cpfCnpjInput.addEventListener('input', (e) => e.target.value = formatadores.cpfCnpj(e.target.value));
    if (contatoInput) contatoInput.addEventListener('input', (e) => e.target.value = formatadores.telefone(e.target.value));
    
    proposalForm.addEventListener('submit', handleFormSubmit);

    // === INICIALIZAÇÃO ===
    controlarSecaoBaixaTensao(); // Roda uma vez para definir o estado inicial
});