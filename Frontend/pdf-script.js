document.addEventListener('DOMContentLoaded', function() {
    // === CONFIGURAÇÕES INICIAIS ===
    const VALOR_KWH_PADRAO = 1.19;

    // === ELEMENTOS DO DOM ===
    const tipoTensao = document.getElementById('tipoTensao');
    const secaoBaixaTensao = document.getElementById('secaoBaixaTensao');
    const tipoConsumo = document.getElementById('tipoConsumo');
    const consumoMensal = document.getElementById('consumoMensal');
    const consumoMedia = document.getElementById('consumoMedia');
    const geracaoPropria = document.getElementById('geracaoPropria');
    const injecaoMedia = document.getElementById('injecaoMedia');
    const proposalFormPdf = document.getElementById('proposalFormPdf');
    const uploadForm = document.getElementById('uploadForm');
    const btnVoltarPdf = document.getElementById('btnVoltarPdf');

    // === FUNÇÃO DE INICIALIZAÇÃO ===
    function iniciarAnimacaoFormulario() {
        document.body.classList.remove('loading');
        if (secaoBaixaTensao) {
            secaoBaixaTensao.classList.add('hidden');
            secaoBaixaTensao.style.display = 'none';
        }
    }
    iniciarAnimacaoFormulario();

    // === FUNÇÃO PARA TORNAR CAMPOS OBRIGATÓRIOS ===
    function tornarCamposObrigatorios(obrigatorio) {
        const campos = ['tipoConsumo', 'tipoPadrao', 'geracaoPropria'];
        const camposEndereco = ['rua', 'numero', 'bairro', 'cidade', 'estado', 'cep'];

        camposEndereco.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.required = true;
        });

        campos.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.required = !!obrigatorio;
                if (!obrigatorio && el.tagName === 'SELECT') el.value = '';
            }
        });
    }

    // === MOSTRAR/OCULTAR SECÃO POR TENSÃO ===
    if (tipoTensao && secaoBaixaTensao) {
        tipoTensao.addEventListener('change', () => {
            if (tipoTensao.value === 'baixa') {
                secaoBaixaTensao.style.display = 'block';
                setTimeout(() => secaoBaixaTensao.classList.remove('hidden'), 10);
                tornarCamposObrigatorios(true);
            } else {
                secaoBaixaTensao.classList.add('hidden');
                setTimeout(() => secaoBaixaTensao.style.display = 'none', 500);
                tornarCamposObrigatorios(false);
            }
        });
    }

    // === TROCA ENTRE CONSUMO MENSAL E MÉDIA ===
    if (tipoConsumo && consumoMensal && consumoMedia) {
        tipoConsumo.addEventListener('change', () => {
            if (tipoConsumo.value === 'mensal') {
                consumoMensal.classList.remove('hidden');
                consumoMedia.classList.add('hidden');
            } else {
                consumoMensal.classList.add('hidden');
                consumoMedia.classList.remove('hidden');
            }
        });
    }

    // === MOSTRAR/OCULTAR CAMPO DE INJEÇÃO ===
    if (geracaoPropria && injecaoMedia) {
        geracaoPropria.addEventListener('change', () => {
            if (geracaoPropria.value.toLowerCase() === 'sim') {
                injecaoMedia.classList.remove('hidden');
            } else {
                injecaoMedia.classList.add('hidden');
            }
        });
    }

    // === FORMATAÇÃO DE CAMPOS ===
    const formatadores = {
        cep: (v) => {
            v = v.replace(/\D/g, '');
            if (v.length > 5) v = v.replace(/^(\d{5})(\d)/, '$1-$2');
            return v.substring(0, 9);
        },
        cpfCnpj: (v) => {
            v = v.replace(/\D/g, '');
            if (v.length <= 11) {
                v = v.replace(/(\d{3})(\d)/, '$1.$2');
                v = v.replace(/(\d{3})(\d)/, '$1.$2');
                v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
            } else {
                v = v.replace(/^(\d{2})(\d)/, '$1.$2');
                v = v.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
                v = v.replace(/\.(\d{3})(\d)/, '.$1/$2');
                v = v.replace(/(\d{4})(\d)/, '$1-$2');
            }
            return v;
        },
        telefone: (v) => {
            v = v.replace(/\D/g, '');
            if (v.length <= 10) {
                v = v.replace(/(\d{2})(\d)/, '($1) $2');
                v = v.replace(/(\d{4})(\d)/, '$1-$2');
            } else {
                v = v.replace(/(\d{2})(\d)/, '($1) $2');
                v = v.replace(/(\d{5})(\d)/, '$1-$2');
            }
            return v;
        }
    };

    const cepInput = document.getElementById('cep');
    if (cepInput) {
        cepInput.addEventListener('input', e => e.target.value = formatadores.cep(e.target.value));
        cepInput.addEventListener('blur', async () => {
            const cep = cepInput.value.replace(/\D/g, '');
            if (cep.length !== 8) return;
            try {
                const resp = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                const data = await resp.json();
                if (!data.erro) {
                    document.getElementById('rua').value = data.logradouro || '';
                    document.getElementById('bairro').value = data.bairro || '';
                    document.getElementById('cidade').value = data.localidade || '';
                    document.getElementById('estado').value = data.uf || '';
                } else alert('CEP não encontrado.');
            } catch { alert('Erro ao buscar CEP.'); }
        });
    }

    const cpfCnpjInput = document.getElementById('cpfCnpj');
    if (cpfCnpjInput) cpfCnpjInput.addEventListener('input', e => e.target.value = formatadores.cpfCnpj(e.target.value));

    const contatoInput = document.getElementById('contato');
    if (contatoInput) contatoInput.addEventListener('input', e => e.target.value = formatadores.telefone(e.target.value));

    // === UPLOAD E PROCESSAMENTO DE PDF ===
    async function handleUploadForm(e) {
        e.preventDefault();
        const pdfFile = document.getElementById('pdfFile').files[0];
        if (!pdfFile) return alert('Selecione um PDF!');

        const btn = uploadForm.querySelector('.btn-enviar');
        const originalText = btn.innerHTML;
        btn.innerHTML = '⏳ Processando...';
        btn.disabled = true;

        try {
            const formData = new FormData();
            formData.append('pdfFile', pdfFile);
            const resp = await fetch('/api/upload-pdf', { method: 'POST', body: formData });
            const result = await resp.json();
            if (result.success) {
                preencherFormulario(result.data);
                document.getElementById('uploadSection').style.display = 'none';
                proposalFormPdf.style.display = 'block';
            } else alert('❌ Erro ao processar PDF: ' + result.message);
        } catch {
            alert('❌ Erro ao conectar com o servidor.');
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }

    if (uploadForm) uploadForm.addEventListener('submit', handleUploadForm);

    function preencherFormulario(dados) {
        const set = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.value = val || '';
        };

        // === CAMPOS PRINCIPAIS ===
        set('nome', dados.nome);
        set('numeroInstalacao', dados.numeroInstalacao);
        set('cpfCnpj', dados.cpfCnpj);
        set('contato', dados.contato);

        // === ENDEREÇO ===
        if (dados.endereco) {
            set('rua', dados.endereco.rua);
            set('numero', dados.endereco.numero);
            set('bairro', dados.endereco.bairro);
            set('cidade', dados.endereco.cidade);
            set('estado', dados.endereco.estado);
            set('cep', dados.endereco.cep);
        }

        // === CONSUMO ===
        if (dados.mediaConsumo) {
            tipoConsumo.value = 'media';
            consumoMensal.classList.add('hidden');
            consumoMedia.classList.remove('hidden');
            set('mediaConsumo', dados.mediaConsumo);
        } else if (dados.historicoConsumo) {
            tipoConsumo.value = 'mensal';
            consumoMensal.classList.remove('hidden');
            consumoMedia.classList.add('hidden');
            Object.entries(dados.historicoConsumo).forEach(([mes, valor]) => set(mes, valor));
        }

        // === INJEÇÃO MÉDIA ===
        set('mediaInjecao', dados.mediaInjecao || 0);

        // === VALOR KWH ===
        set('valorKwh', dados.valorKwh || VALOR_KWH_PADRAO);

        // === TENSÃO ===
        tipoTensao.value = 'baixa';
        tipoTensao.dispatchEvent(new Event('change'));
    }


    // === ENVIO FINAL DO FORMULÁRIO ===
    if (proposalFormPdf) {
        proposalFormPdf.addEventListener('submit', async function(e) {
            e.preventDefault();
            const btn = this.querySelector('.btn-enviar');
            const originalText = btn.innerHTML;
            btn.innerHTML = '⏳ Enviando...';
            btn.disabled = true;

            try {
                const formData = new FormData(this);
                const data = Object.fromEntries(formData.entries());

                const requiredFields = ['nome','cpfCnpj','numeroInstalacao','contato','tipoPadrao','geracaoPropria','tipoTensao','classe'];
                requiredFields.forEach(f => data[f] = document.getElementById(f)?.value || '');

                data.endereco = `${document.getElementById('rua')?.value || ''}, ${document.getElementById('numero')?.value || ''}${document.getElementById('complemento')?.value ? ' - ' + document.getElementById('complemento').value : ''}, ${document.getElementById('bairro')?.value || ''}, ${document.getElementById('cidade')?.value || ''} - ${document.getElementById('estado')?.value || ''}, CEP: ${document.getElementById('cep')?.value || ''}`;

                const numericFields = ['janeiro','fevereiro','marco','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro','mediaConsumo','mediaInjecao','desconto','valorKwh'];
                numericFields.forEach(f => data[f] = parseFloat(data[f]) || 0);

                Object.assign(data, calcularEconomia(data));

                const resp = await fetch('/api/propostas', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(data) });
                const result = await resp.json();

                if (result.success) {
                    alert('✅ Proposta salva com sucesso! ID: ' + result.id);
                    this.reset();
                    resetarCamposDinamicos();
                    window.location.href = `proposta.html?instalacao=${encodeURIComponent(data.numeroInstalacao)}`;
                } else alert('❌ Erro ao salvar proposta: ' + result.message);
            } catch (err) {
                console.error(err);
                alert('❌ Erro de conexão com o servidor.');
            } finally {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        });
    }

    // === FUNÇÕES AUXILIARES ===
    function calcularEconomia(data) {
        let mediaConsumo = data.mediaConsumo || 0;
        if (!mediaConsumo && data.tipoConsumo === 'mensal') {
            const meses = ['janeiro','fevereiro','marco','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
            mediaConsumo = meses.reduce((sum, m) => sum + (parseFloat(data[m]) || 0), 0) / 12;
        }
        const mediaInjecao = data.mediaInjecao || 0;
        const desconto = data.desconto / 100;
        const valorKwh = data.valorKwh;

        const valorPagoCemigMedia = mediaConsumo * valorKwh;
        const valorPagoFlexMedia = (mediaConsumo - mediaInjecao) * valorKwh * (1 - desconto);
        const economiaMedia = valorPagoCemigMedia - valorPagoFlexMedia;
        const economiaAnual = economiaMedia * 12;

        return { economiaMedia, economiaAnual, valorPagoFlexMedia, valorPagoFlexAnual: valorPagoFlexMedia*12, valorPagoCemigMedia, valorPagoCemigAnual: valorPagoCemigMedia*12 };
    }

    function resetarCamposDinamicos() {
        if (secaoBaixaTensao) { secaoBaixaTensao.style.display = 'block'; secaoBaixaTensao.classList.remove('hidden'); }
        if (tipoConsumo) tipoConsumo.value = 'mensal';
        if (consumoMensal) consumoMensal.classList.remove('hidden');
        if (consumoMedia) consumoMedia.classList.add('hidden');
        if (injecaoMedia) injecaoMedia.classList.add('hidden');
        const valorKwhInput = document.getElementById('valorKwh');
        if (valorKwhInput) valorKwhInput.value = VALOR_KWH_PADRAO;
        if (tipoTensao) tipoTensao.value = '';
        const dist = document.getElementById('distribuidora');
        if (dist) dist.value = 'CEMIG';
        const classe = document.getElementById('classe');
        if (classe) classe.value = '';
    }

    if (btnVoltarPdf) {
        btnVoltarPdf.addEventListener('click', () => {
            proposalFormPdf.style.display = 'none';
            document.getElementById('uploadSection').style.display = 'block';
            proposalFormPdf.reset();
            resetarCamposDinamicos();
        });
    }
});
