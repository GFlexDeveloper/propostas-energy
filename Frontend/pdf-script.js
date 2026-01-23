// Frontend/pdf-script.js

FlexAuth.init(); // Protege a página no início

// === CONSTANTES E ELEMENTOS DO DOM ===
const VALOR_KWH_PADRAO = 1.19;
const uploadSection = document.getElementById('uploadSection');
const uploadForm = document.getElementById('uploadForm');
const proposalFormPdf = document.getElementById('proposalFormPdf');

const pdfFileInput = document.getElementById('pdfFile');
const fileNameSpan = document.getElementById('file-name-span');
const btnProcessarPdf = document.getElementById('btnProcessarPdf');
const btnVoltarPdf = document.getElementById('btnVoltarPdf');

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

// === LÓGICA DA INTERFACE DE UPLOAD ===
if (pdfFileInput && fileNameSpan) {
    pdfFileInput.addEventListener('change', () => {
        if (pdfFileInput.files.length > 0) {
            fileNameSpan.textContent = pdfFileInput.files[0].name;
            fileNameSpan.style.color = 'var(--primary-yellow)';
        } else {
            fileNameSpan.textContent = 'Clique para selecionar o arquivo PDF';
            fileNameSpan.style.color = 'var(--text-secondary)';
        }
    });
}

if (uploadForm) {
    uploadForm.addEventListener('submit', handleUploadSubmit);
}

if (btnVoltarPdf) {
    btnVoltarPdf.addEventListener('click', () => {
        uploadSection.classList.remove('hidden');
        proposalFormPdf.classList.add('hidden');
        uploadForm.reset();
        proposalFormPdf.reset();
        fileNameSpan.textContent = 'Clique para selecionar o arquivo PDF';
        fileNameSpan.style.color = 'var(--text-secondary)';
        if (secaoBaixaTensao) {
            secaoBaixaTensao.classList.remove('visible');
            secaoBaixaTensao.classList.add('hidden-section');
        }
    });
}

// === FUNÇÕES DE CONTROLE E FORMATAÇÃO ===
if (tipoTensao && secaoBaixaTensao) {
    tipoTensao.addEventListener('change', function() {
        const isBaixa = this.value === 'baixa';
        // Esta é a linha corrigida que apenas alterna a classe 'visible'
        secaoBaixaTensao.classList.toggle('visible', isBaixa);
    });
}

if (tipoConsumo) {
    tipoConsumo.addEventListener('change', () => {
        consumoMensal.classList.toggle('hidden', tipoConsumo.value !== 'mensal');
        consumoMedia.classList.toggle('hidden', tipoConsumo.value !== 'media');
    });
}

if (geracaoPropria) {
    geracaoPropria.addEventListener('change', () => {
        injecaoMedia.classList.toggle('hidden', geracaoPropria.value !== 'sim');
    });
}

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
            document.getElementById('rua').value = data.logouro || '';
            document.getElementById('bairro').value = data.bairro || '';
            document.getElementById('cidade').value = data.localidade || '';
            document.getElementById('estado').value = data.uf || '';
            document.getElementById('numero').focus();
        } else { alert('CEP não encontrado.'); }
    } catch (error) { alert('Erro ao buscar CEP.'); }
}

if (cepInput) { cepInput.addEventListener('input', (e) => e.target.value = formatadores.cep(e.target.value)); cepInput.addEventListener('blur', buscarEnderecoPorCEP); }
if (cpfCnpjInput) cpfCnpjInput.addEventListener('input', (e) => e.target.value = formatadores.cpfCnpj(e.target.value));
if (contatoInput) contatoInput.addEventListener('input', (e) => e.target.value = formatadores.telefone(e.target.value));

// === CÁLCULO DE ECONOMIA ===
// Em Frontend/pdf-script.js

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
                if (consumoMes > 0) { acc.totalConsumo += consumoMes; acc.mesesPreenchidos++; }
                return acc;
            }, { totalConsumo: 0, mesesPreenchidos: 0 });
            consumoCalculado = mesesPreenchidos > 0 ? totalConsumo / mesesPreenchidos : 0;
        }
        
        if (consumoCalculado > 0) {
            economiaMedia = Math.max(0, (consumoCalculado - custoDisponibilidadeKwh - geracao) * valorKwh * (desconto / 100));
            valorPagoCemigMedia = (consumoCalculado * valorKwh) + custoIluminacaoPublica;
            
            // CORREÇÃO AQUI TAMBÉM:
            valorPagoFlexMedia = valorPagoCemigMedia - economiaMedia;
            
            economiaAnual = economiaMedia * 12;
            valorPagoFlexAnual = valorPagoFlexMedia * 12;
            valorPagoCemigAnual = valorPagoCemigMedia * 12;
        }
    }
    return { economiaMedia, economiaAnual, valorPagoFlexMedia, valorPagoFlexAnual, valorPagoCemigMedia, valorPagoCemigAnual };
}

// === PROCESSAMENTO E SUBMISSÃO ===
async function handleUploadSubmit(e) {
    e.preventDefault();
    const pdfFile = pdfFileInput.files[0];
    if (!pdfFile) {
        alert('Por favor, selecione um arquivo PDF antes de processar.');
        return;
    }

    const originalText = btnProcessarPdf.innerHTML;
    btnProcessarPdf.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';
    btnProcessarPdf.disabled = true;

    try {
        const formData = new FormData();
        formData.append('pdfFile', pdfFile);

        const response = await FlexAuth.fetchWithAuth('/api/upload-pdf', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success && result.data) {
            uploadSection.classList.add('hidden');
            preencherFormulario(result.data);
            proposalFormPdf.classList.remove('hidden');
            alert('PDF processado! Verifique e complete os dados antes de enviar.');
        } else {
            throw new Error(result.message || 'Falha ao processar o PDF no servidor.');
        }
    } catch (error) {
        console.error("ERRO COMPLETO NO UPLOAD:", error);
        alert(`❌ Erro ao processar o PDF: ${error.message}.`);
    } finally {
        btnProcessarPdf.innerHTML = originalText;
        btnProcessarPdf.disabled = false;
    }
}

function preencherFormulario(data) {
    const set = (id, val) => {
        const el = document.getElementById(id);
        if (el && val !== undefined && val !== null) el.value = val;
    };
    
    if (data.valorKwh > 0) {
        set('tipoTensao', 'baixa');
        if (tipoTensao) tipoTensao.dispatchEvent(new Event('change'));
        set('valorKwh', parseFloat(data.valorKwh).toFixed(4));
    }
    if (data.mediaInjecao > 0) {
        set('geracaoPropria', 'sim');
        set('mediaInjecao', data.mediaInjecao);
        if (geracaoPropria) geracaoPropria.dispatchEvent(new Event('change'));
    } else {
        set('geracaoPropria', 'nao');
    }
    if (data.endereco) {
        set('rua', data.endereco.rua);
        set('numero', data.endereco.numero);
        set('bairro', data.endereco.bairro);
        set('cidade', data.endereco.cidade);
        set('estado', (data.endereco.estado || '').toUpperCase());
        set('cep', data.endereco.cep);
    }
    if (data.mediaConsumo > 0) {
        set('tipoConsumo', 'media');
        set('mediaConsumo', data.mediaConsumo);
    } else if (data.historicoConsumo) {
        set('tipoConsumo', 'mensal');
        Object.keys(data.historicoConsumo).forEach(mes => {
            if (data.historicoConsumo[mes] > 0) {
                set(mes.toLowerCase(), data.historicoConsumo[mes]);
            }
        });
    }
    if (tipoConsumo) tipoConsumo.dispatchEvent(new Event('change'));
}

if (proposalFormPdf) {
    proposalFormPdf.addEventListener('submit', async function(e){
        e.preventDefault();
        const formData = new FormData(this);
        const data = Object.fromEntries(formData.entries());

        data.endereco = `${data.rua}, ${data.numero}${data.complemento ? ' - ' + data.complemento : ''}, ${data.bairro}, ${data.cidade} - ${data.estado}, CEP: ${data.cep}`;
        Object.assign(data, calcularEconomia(data));
        ['janeiro','fevereiro','marco','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro','mediaConsumo','mediaInjecao','desconto','valorKwh'].forEach(field => {
            data[field] = data[field] ? parseFloat(data[field]) : null;
        });

        const submitBtn = this.querySelector('.btn-enviar');
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
    });
}