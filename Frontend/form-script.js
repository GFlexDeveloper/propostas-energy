// Frontend/form-script.js

FlexAuth.init(); // Protege a página

// === CONSTANTES E ELEMENTOS DO DOM ===
const VALOR_KWH_PADRAO = 1.19;
const proposalForm = document.getElementById('proposalForm');
if (!proposalForm) throw new Error('Formulário principal #proposalForm não encontrado.');

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

document.body.classList.remove('loading');

// === FUNÇÕES DE CONTROLE DO FORMULÁRIOS ===
function controlarSecaoBaixaTensao() {
    if (!tipoTensao || !secaoBaixaTensao) return;
    const isBaixa = tipoTensao.value === 'baixa';
    
    // Esta é a linha corrigida que apenas alterna a classe 'visible'
    secaoBaixaTensao.classList.toggle('visible', isBaixa); 
    
    tornarCamposObrigatorios(isBaixa);
}

function tornarCamposObrigatorios(obrigatorio) {
    ['tipoPadrao', 'geracaoPropria'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.required = !!obrigatorio;
            if (!obrigatorio) element.value = '';
        }
    });
}

function alternarTipoConsumo() {
    if (!tipoConsumo || !consumoMensal || !consumoMedia) return;
    const isMensal = tipoConsumo.value === 'mensal';
    consumoMensal.classList.toggle('hidden', !isMensal);
    consumoMedia.classList.toggle('hidden', isMensal);
}

function controlarInjecaoMedia() {
    if (!geracaoPropria || !injecaoMedia) return;
    injecaoMedia.classList.toggle('hidden', geracaoPropria.value !== 'sim');
}

// === FUNÇÕES DE FORMATAÇÃO E API ===
const formatadores = {
    cep: v => v.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2').substring(0, 9),
    cpfCnpj: v => {
        v = v.replace(/\D/g, '');
        return v.length <= 11 ?
            v.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2') :
            v.substring(0, 14).replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2');
    },
    telefone: v => {
        v = v.replace(/\D/g, '');
        return v.length > 10 ?
            v.substring(0, 11).replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3') :
            v.substring(0, 10).replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
};

async function buscarEnderecoPorCEP() {
    const cep = (cepInput.value || '').replace(/\D/g, '');
    if (cep.length !== 8) return;
    try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        if (!data.erro) {
            document.getElementById('rua').value = data.logradouro || '';
            document.getElementById('bairro').value = data.bairro || '';
            document.getElementById('cidade').value = data.localidade || '';
            document.getElementById('estado').value = data.uf || '';
            document.getElementById('numero').focus();
        } else {
            alert('CEP não encontrado.');
        }
    } catch (error) {
        alert('Erro ao buscar CEP. Verifique sua conexão.');
    }
}

// === LÓGICA DE CÁLCULO E ENVIO ===
function calcularEconomia(data) {
    const valorKwh = parseFloat(data.valorKwh) || VALOR_KWH_PADRAO;
    const desconto = parseFloat(data.desconto) || 0;
    let economiaMedia = 0, economiaAnual = 0, valorPagoFlexMedia = 0, valorPagoFlexAnual = 0, valorPagoCemigMedia = 0, valorPagoCemigAnual = 0;
    
    if (data.tipoTensao === 'baixa' && data.tipoPadrao) {
        const custoDisponibilidadeKwh = {'monofasico': 30, 'bifasico': 50, 'trifasico': 100}[data.tipoPadrao] || 0;
        const geracao = (data.geracaoPropria === 'sim') ? (parseFloat(data.mediaInjecao) || 0) : 0;
        const custoIluminacaoPublica = 20;
        let consumoCalculado = 0;

        if (data.tipoConsumo === 'media') {
            consumoCalculado = parseFloat(data.mediaConsumo) || 0;
        } else {
            const meses = ['janeiro','fevereiro','marco','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
            const { totalConsumo, mesesPreenchidos } = meses.reduce((acc, mes) => {
                const consumoMes = parseFloat(data[mes]) || 0;
                if (consumoMes > 0) {
                    acc.totalConsumo += consumoMes;
                    acc.mesesPreenchidos++;
                }
                return acc;
            }, { totalConsumo: 0, mesesPreenchidos: 0 });
            consumoCalculado = mesesPreenchidos > 0 ? totalConsumo / mesesPreenchidos : 0;
        }

        if (consumoCalculado > 0) {
            economiaMedia = Math.max(0, (consumoCalculado - custoDisponibilidadeKwh - geracao) * valorKwh * (desconto / 100));
            valorPagoCemigMedia = (consumoCalculado * valorKwh) + custoIluminacaoPublica;
            valorPagoFlexMedia = valorPagoCemigMedia - economiaMedia + (custoDisponibilidadeKwh * valorKwh);
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

    data.endereco = `${data.rua}, ${data.numero}${data.complemento ? ' - ' + data.complemento : ''}, ${data.bairro}, ${data.cidade} - ${data.estado}, CEP: ${data.cep}`;
    Object.assign(data, calcularEconomia(data));

    ['janeiro','fevereiro','marco','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro','mediaConsumo','mediaInjecao','desconto','valorKwh'].forEach(field => {
        data[field] = data[field] ? parseFloat(data[field]) : null;
    });

    const submitBtn = proposalForm.querySelector('.btn-enviar');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '⏳ Enviando...';
    submitBtn.disabled = true;

    try {
        const response = await FlexAuth.fetchWithAuth('/api/propostas', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        const result = await response.json();

        if (result.success) {
            alert('✅ Proposta salva com sucesso! ID: ' + result.id);
            window.location.href = `proposta.html?instalacao=${encodeURIComponent(data.numeroInstalacao)}`;
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        alert(`❌ Erro ao salvar proposta: ${error.message}`);
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// === EVENT LISTENERS ===
// Estes "escutadores" agora são anexados assim que o script é lido
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
// As funções rodam uma vez para configurar o estado inicial do formulário
controlarSecaoBaixaTensao();
alternarTipoConsumo();
controlarInjecaoMedia();