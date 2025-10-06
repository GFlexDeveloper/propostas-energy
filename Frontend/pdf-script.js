document.addEventListener('DOMContentLoaded', function() {
    // === CONFIGURAÇÕES INICIAIS ===
    const VALOR_KWH_PADRAO = 1.19;

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

    // === ANIMAÇÃO INICIAL ===
    function iniciarAnimacaoFormulario() {
        document.body.classList.remove('loading');
        setTimeout(() => {
            if (secaoBaixaTensao) {
                secaoBaixaTensao.classList.add('hidden');
            }
        }, 100);
    }
    iniciarAnimacaoFormulario();

    // === MOSTRAR/OCULTAR CAMPOS POR TENSÃO ===
    if (tipoTensao && secaoBaixaTensao) {
        tipoTensao.addEventListener('change', function() {
            if (this.value === 'baixa') {
                secaoBaixaTensao.style.display = 'block';
                setTimeout(() => secaoBaixaTensao.classList.remove('hidden'), 10);
                tornarCamposObrigatorios(true);
            } else {
                secaoBaixaTensao.classList.add('hidden');
                setTimeout(() => (secaoBaixaTensao.style.display = 'none'), 500);
                tornarCamposObrigatorios(false);
            }
        });
        setTimeout(() => {
            if (tipoTensao.value !== 'baixa') {
                secaoBaixaTensao.classList.add('hidden');
                secaoBaixaTensao.style.display = 'none';
            }
        }, 100);
    }

    // === TORNAR CAMPOS OBRIGATÓRIOS ===
    function tornarCamposObrigatorios(obrigatorio) {
        const campos = ['tipoConsumo', 'tipoPadrao', 'geracaoPropria'];
        const camposEndereco = ['rua', 'numero', 'bairro', 'cidade', 'estado', 'cep'];
        camposEndereco.forEach(campo => {
            const el = document.getElementById(campo);
            if (el) el.required = true;
        });
        campos.forEach(campo => {
            const el = document.getElementById(campo);
            if (el) {
                el.required = !!obrigatorio;
                if (!obrigatorio && el.tagName === 'SELECT') el.value = '';
            }
        });
    }

    // === TROCA ENTRE CONSUMO MENSAL E MÉDIA ===
    if (tipoConsumo && consumoMensal && consumoMedia) {
        tipoConsumo.addEventListener('change', function() {
            if (this.value === 'mensal') {
                consumoMensal.classList.remove('hidden');
                consumoMedia.classList.add('hidden');
            } else {
                consumoMensal.classList.add('hidden');
                consumoMedia.classList.remove('hidden');
            }
        });
    }

    // === MOSTRAR/OCULTAR CAMPO DE INJEÇÃO MÉDIA ===
    if (geracaoPropria && injecaoMedia) {
        geracaoPropria.addEventListener('change', function() {
            if (this.value.toLowerCase() === 'sim') {
                injecaoMedia.classList.remove('hidden');
            } else {
                injecaoMedia.classList.add('hidden');
            }
        });
    }

    // === FORMATAÇÕES E BUSCA DE ENDEREÇO ===
    async function buscarEnderecoPorCEP() {
        const cep = document.getElementById('cep').value.replace(/\D/g, '');
        if (cep.length !== 8) return;
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();
            if (!data.erro) {
                document.getElementById('rua').value = data.logradouro || '';
                document.getElementById('bairro').value = data.bairro || '';
                document.getElementById('cidade').value = data.localidade || '';
                document.getElementById('estado').value = data.uf || '';
            } else {
                alert('CEP não encontrado.');
            }
        } catch {
            alert('Erro ao buscar CEP. Tente novamente.');
        }
    }

    function formatarCEP(cep) {
        cep = cep.replace(/\D/g, '');
        if (cep.length > 5) cep = cep.replace(/^(\d{5})(\d)/, '$1-$2');
        return cep.substring(0, 9);
    }
    function formatarDocumento(doc) {
        doc = doc.replace(/\D/g, '');
        if (doc.length <= 11) {
            doc = doc.replace(/(\d{3})(\d)/, '$1.$2');
            doc = doc.replace(/(\d{3})(\d)/, '$1.$2');
            doc = doc.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        } else {
            doc = doc.replace(/^(\d{2})(\d)/, '$1.$2');
            doc = doc.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
            doc = doc.replace(/\.(\d{3})(\d)/, '.$1/$2');
            doc = doc.replace(/(\d{4})(\d)/, '$1-$2');
        }
        return doc;
    }
    function formatarTelefone(tel) {
        tel = tel.replace(/\D/g, '');
        if (tel.length <= 10) {
            tel = tel.replace(/(\d{2})(\d)/, '($1) $2');
            tel = tel.replace(/(\d{4})(\d)/, '$1-$2');
        } else {
            tel = tel.replace(/(\d{2})(\d)/, '($1) $2');
            tel = tel.replace(/(\d{5})(\d)/, '$1-$2');
        }
        return tel;
    }

    const cepInput = document.getElementById('cep');
    if (cepInput) {
        cepInput.addEventListener('blur', buscarEnderecoPorCEP);
        cepInput.addEventListener('input', e => e.target.value = formatarCEP(e.target.value));
    }
    const cpfCnpjInput = document.getElementById('cpfCnpj');
    if (cpfCnpjInput) {
        cpfCnpjInput.addEventListener('input', e => e.target.value = formatarDocumento(e.target.value));
    }
    const contatoInput = document.getElementById('contato');
    if (contatoInput) {
        contatoInput.addEventListener('input', e => e.target.value = formatarTelefone(e.target.value));
    }

    // === UPLOAD E LEITURA DE PDF ===
    if (uploadForm) {
        uploadForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const pdfFile = document.getElementById('pdfFile').files[0];
            if (!pdfFile) return alert('Selecione um PDF!');
            const formData = new FormData();
            formData.append('pdfFile', pdfFile);
            try {
                const response = await fetch('/api/upload-pdf', { method: 'POST', body: formData });
                const result = await response.json();
                if (result.success) {
                    preencherFormulario(result.data);
                    document.getElementById('uploadSection').style.display = 'none';
                    proposalFormPdf.style.display = 'block';
                } else {
                    alert('❌ Erro ao processar PDF: ' + result.message);
                }
            } catch {
                alert('❌ Erro ao conectar com o servidor.');
            }
        });
    }

    function preencherFormulario(dados) {
        const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
        set('rua', dados.rua);
        set('numero', dados.numero);
        set('bairro', dados.bairro);
        set('cidade', dados.cidade);
        set('estado', dados.estado);
        set('cep', dados.cep);
        if (dados.mediaConsumo) {
            tipoConsumo.value = 'media';
            consumoMensal.classList.add('hidden');
            consumoMedia.classList.remove('hidden');
            set('mediaConsumo', dados.mediaConsumo);
        } else {
            tipoConsumo.value = 'mensal';
            consumoMensal.classList.remove('hidden');
            consumoMedia.classList.add('hidden');
            const meses = ['janeiro','fevereiro','marco','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
            meses.forEach(m => set(m, dados[m] || ''));
        }
        set('mediaInjecao', dados.mediaInjecao);
        set('valorKwh', dados.valorKwh || VALOR_KWH_PADRAO);
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
                // === COLETAR TODOS OS CAMPOS ===
                const formData = new FormData(this);
                const data = Object.fromEntries(formData.entries());

                // Campos obrigatórios do server
                const requiredFields = [
                    'nome', 'cpfCnpj', 'numeroInstalacao', 'contato',
                    'tipoPadrao', 'geracaoPropria', 'tipoTensao', 'classe'
                ];

                requiredFields.forEach(f => {
                    data[f] = document.getElementById(f)?.value || '';
                });

                // Monta o endereço completo
                data.endereco = `${document.getElementById('rua')?.value || ''}, ${document.getElementById('numero')?.value || ''}${document.getElementById('complemento')?.value ? ' - ' + document.getElementById('complemento').value : ''}, ${document.getElementById('bairro')?.value || ''}, ${document.getElementById('cidade')?.value || ''} - ${document.getElementById('estado')?.value || ''}, CEP: ${document.getElementById('cep')?.value || ''}`;

                // Valores numéricos
                const numericFields = [
                    'janeiro','fevereiro','marco','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro',
                    'mediaConsumo','mediaInjecao','desconto','valorKwh'
                ];
                numericFields.forEach(f => {
                    data[f] = parseFloat(data[f]) || 0;
                });

                // Recalcula economia
                const dadosCalc = calcularEconomia(data);
                Object.assign(data, dadosCalc);

                // === ENVIO PARA O BACK-END ===
                const response = await fetch('/api/propostas', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                if (!response.ok) {
                    // Trata erros HTTP (400, 500)
                    const err = await response.json();
                    alert('❌ Erro ao enviar proposta: ' + (err.message || 'Erro desconhecido'));
                    return;
                }

                const result = await response.json();

                if (result.success) {
                    alert('✅ Proposta salva com sucesso! ID: ' + result.id);
                    this.reset();
                    resetarCamposDinamicos();
                    const numeroInstalacao = data.numeroInstalacao;
                    window.location.href = `proposta.html?instalacao=${encodeURIComponent(numeroInstalacao)}`;
                } else {
                    alert('❌ Erro ao salvar proposta: ' + result.message);
                }

            } catch (error) {
                console.error('💥 Erro ao enviar proposta:', error);
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
            const total = meses.reduce((sum, mes) => sum + (parseFloat(data[mes]) || 0), 0);
            mediaConsumo = total / 12;
        }
        const mediaInjecao = data.mediaInjecao || 0;
        const desconto = data.desconto / 100;
        const valorKwh = data.valorKwh;

        const valorPagoCemigMedia = mediaConsumo * valorKwh;
        const valorPagoFlexMedia = (mediaConsumo - mediaInjecao) * valorKwh * (1 - desconto);
        const economiaMedia = valorPagoCemigMedia - valorPagoFlexMedia;
        const economiaAnual = economiaMedia * 12;
        const valorPagoCemigAnual = valorPagoCemigMedia * 12;
        const valorPagoFlexAnual = valorPagoFlexMedia * 12;

        return { economiaMedia, economiaAnual, valorPagoFlexMedia, valorPagoFlexAnual, valorPagoCemigMedia, valorPagoCemigAnual };
    }

    function resetarCamposDinamicos() {
        if (secaoBaixaTensao) {
            secaoBaixaTensao.style.display = 'block';
            secaoBaixaTensao.classList.remove('hidden');
        }
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
        btnVoltarPdf.addEventListener('click', function() {
            proposalFormPdf.style.display = 'none';
            document.getElementById('uploadSection').style.display = 'block';
            proposalFormPdf.reset();
            resetarCamposDinamicos();
        });
    }
});
