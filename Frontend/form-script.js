// Frontend/form-script.js

FlexAuth.init(); // Protege a página

// === CONSTANTES E ELEMENTOS DO DOM ===
const VALOR_KWH_PADRAO = 1.19;
const proposalForm = document.getElementById('proposalForm');

// Verifica se os elementos existem antes de tentar usar
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

if (document.body.classList.contains('loading')) {
    document.body.classList.remove('loading');
}

// === FUNÇÕES DE CONTROLE DO FORMULÁRIO ===

function controlarSecaoBaixaTensao() {
    if (!tipoTensao || !secaoBaixaTensao) return;
    
    // CORREÇÃO AQUI: O valor no HTML é "Baixa Tensao"
    const isBaixa = tipoTensao.value === 'Baixa Tensao'; 
    
    if (isBaixa) {
        secaoBaixaTensao.classList.remove('hidden-section');
        secaoBaixaTensao.classList.add('visible'); // Usa classe 'visible' do CSS novo
        secaoBaixaTensao.style.display = 'block'; // Força display block por garantia
    } else {
        secaoBaixaTensao.classList.remove('visible');
        secaoBaixaTensao.classList.add('hidden-section');
        secaoBaixaTensao.style.display = 'none';
    }
    
    tornarCamposObrigatorios(isBaixa);
}

function tornarCamposObrigatorios(obrigatorio) {
    // Lista de IDs que devem ser obrigatórios apenas se for Baixa Tensão
    const campos = ['tipoPadrao', 'tipoConsumo', 'valorKwh'];
    
    campos.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            if (obrigatorio) {
                element.setAttribute('required', 'required');
            } else {
                element.removeAttribute('required');
                element.value = ''; // Limpa o valor se esconder
            }
        }
    });
}

function alternarTipoConsumo() {
    if (!tipoConsumo || !consumoMensal || !consumoMedia) return;
    
    const isMensal = tipoConsumo.value === 'mensal';
    
    if (isMensal) {
        consumoMensal.classList.remove('hidden');
        consumoMedia.classList.add('hidden');
    } else {
        consumoMensal.classList.add('hidden');
        consumoMedia.classList.remove('hidden');
    }
}

function controlarInjecaoMedia() {
    if (!geracaoPropria || !injecaoMedia) return;
    
    // Valor no HTML é "sim" (minúsculo)
    const temGeracao = geracaoPropria.value === 'sim';
    
    if (temGeracao) {
        injecaoMedia.classList.remove('hidden');
    } else {
        injecaoMedia.classList.add('hidden');
        const inputInjecao = document.getElementById('mediaInjecao');
        if (inputInjecao) inputInjecao.value = ''; // Limpa valor
    }
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
            if(document.getElementById('rua')) document.getElementById('rua').value = data.logradouro || '';
            if(document.getElementById('bairro')) document.getElementById('bairro').value = data.bairro || '';
            if(document.getElementById('cidade')) document.getElementById('cidade').value = data.localidade || '';
            if(document.getElementById('estado')) document.getElementById('estado').value = data.uf || '';
            if(document.getElementById('numero')) document.getElementById('numero').focus();
        } else {
            alert('CEP não encontrado.');
        }
    } catch (error) {
        // Silencioso ou alert, opcional
    }
}

// === LÓGICA DE CÁLCULO E ENVIO ===

function calcularEconomia(data) {
    const valorKwh = parseFloat(data.tarifa) || parseFloat(data.valorKwh) || VALOR_KWH_PADRAO; // Pega 'tarifa' ou 'valorKwh'
    const desconto = parseFloat(data.desconto) || 0;
    
    let economiaMedia = 0, economiaAnual = 0, valorPagoFlexMedia = 0, valorPagoFlexAnual = 0, valorPagoCemigMedia = 0, valorPagoCemigAnual = 0;
    
    // CORREÇÃO AQUI: Verifica "Baixa Tensao"
    if (data.tipoTensao === 'Baixa Tensao' && data.fase) {
        // data.fase vem do select name="fase" (Monofásico, Bifásico...)
        const custoDisponibilidadeKwh = {
            'Monofásico': 30, 
            'Bifásico': 50, 
            'Trifásico': 100
        }[data.fase] || 0;

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
            // Lógica de cálculo simplificada para demonstração
            economiaMedia = Math.max(0, (consumoCalculado - custoDisponibilidadeKwh - geracao) * valorKwh * (desconto / 100));
            valorPagoCemigMedia = (consumoCalculado * valorKwh) + custoIluminacaoPublica;
            valorPagoFlexMedia = valorPagoCemigMedia - economiaMedia;
            
            economiaAnual = economiaMedia * 12;
            valorPagoFlexAnual = valorPagoFlexMedia * 12;
            valorPagoCemigAnual = valorPagoCemigMedia * 12;
        }
    }
    return { economiaMedia, economiaAnual, valorPagoFlexMedia, valorPagoFlexAnual, valorPagoCemigMedia, valorPagoCemigAnual };
}

// No arquivo Frontend/form-script.js

async function handleFormSubmit(e) {
    e.preventDefault();
    const formData = new FormData(proposalForm);
    const data = Object.fromEntries(formData.entries());

    // 1. Tratamento de campos numéricos
    for (let key in data) {
        if (typeof data[key] === 'string' && data[key].includes(',')) {
            data[key] = data[key].replace(',', '.');
        }
    }

    // 2. Cálculo da média no front apenas para garantir o dado se preenchido mês a mês
    if (data.tipoConsumo === 'mensal') {
        const meses = ['janeiro','fevereiro','marco','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
        let soma = 0, count = 0;
        meses.forEach(m => {
            const val = parseFloat(data[m] || 0);
            if(val > 0) { soma += val; count++; }
        });
        if(count > 0) data.mediaConsumo = (soma / count).toFixed(2);
    }

    const submitBtn = proposalForm.querySelector('.btn-enviar');
    submitBtn.disabled = true;

    try {
        const response = await FlexAuth.fetchWithAuth('/api/propostas', {
            method: 'POST',
            body: JSON.stringify(data) // Enviamos apenas o que foi digitado
        });
        const result = await response.json();

        if (result.success) {
            alert('✅ Proposta salva!');
            // Redireciona para a visualização usando a UC digitada
            window.location.href = `proposta.html?instalacao=${data.uc}`;
        }
    } catch (error) {
        alert(`❌ Erro: ${error.message}`);
    } finally {
        submitBtn.disabled = false;
    }
}

// === EVENT LISTENERS ===
document.addEventListener('DOMContentLoaded', () => {
    // Roda uma vez para garantir o estado inicial
    controlarSecaoBaixaTensao();
    alternarTipoConsumo();
    controlarInjecaoMedia();

    // Adiciona os eventos
    if (tipoTensao) tipoTensao.addEventListener('change', controlarSecaoBaixaTensao);
    if (tipoConsumo) tipoConsumo.addEventListener('change', alternarTipoConsumo);
    if (geracaoPropria) geracaoPropria.addEventListener('change', controlarInjecaoMedia);
    
    if (cepInput) {
        cepInput.addEventListener('input', (e) => e.target.value = formatadores.cep(e.target.value));
        cepInput.addEventListener('blur', buscarEnderecoPorCEP);
    }
    if (cpfCnpjInput) cpfCnpjInput.addEventListener('input', (e) => e.target.value = formatadores.cpfCnpj(e.target.value));
    if (contatoInput) contatoInput.addEventListener('input', (e) => e.target.value = formatadores.telefone(e.target.value));
    
    if (proposalForm) proposalForm.addEventListener('submit', handleFormSubmit);
});