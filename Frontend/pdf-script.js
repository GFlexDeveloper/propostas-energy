document.addEventListener('DOMContentLoaded', function() {
    iniciarAnimacaoFormulario();

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
    const VALOR_KWH_PADRAO = 1.19;

    function iniciarAnimacaoFormulario() {
        document.body.classList.remove('loading');
        setTimeout(() => {
            if (secaoBaixaTensao) {
                secaoBaixaTensao.classList.add('hidden');
            }
        }, 100);
    }

    if (tipoTensao && secaoBaixaTensao) {
        tipoTensao.addEventListener('change', function() {
            if (this.value === 'baixa') {
                secaoBaixaTensao.style.display = 'block';
                setTimeout(() => {
                    secaoBaixaTensao.classList.remove('hidden');
                }, 10);
                tornarCamposObrigatorios(true);
            } else {
                secaoBaixaTensao.classList.add('hidden');
                setTimeout(() => {
                    secaoBaixaTensao.style.display = 'none';
                }, 500);
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

    function tornarCamposObrigatorios(obrigatorio) {
        const campos = ['tipoConsumo', 'tipoPadrao', 'geracaoPropria'];
        const camposEndereco = ['rua', 'numero', 'bairro', 'cidade', 'estado', 'cep'];
        camposEndereco.forEach(campo => {
            const element = document.getElementById(campo);
            if (element) element.required = true;
        });
        campos.forEach(campo => {
            const element = document.getElementById(campo);
            if (element) {
                element.required = !!obrigatorio;
                if (!obrigatorio && element.tagName === 'SELECT') element.value = '';
            }
        });
    }

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

    if (uploadForm) {
        uploadForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const pdfFile = document.getElementById('pdfFile').files[0];
            if (!pdfFile) return alert('Selecione um PDF!');

            const formData = new FormData();
            formData.append('pdfFile', pdfFile);

            try {
                const response = await fetch('/api/upload-pdf', {
                    method: 'POST',
                    body: formData
                });
                const result = await response.json();
                if (result.success) {
                    preencherFormulario(result.data);
                    document.getElementById('uploadSection').style.display = 'none';
                    proposalFormPdf.style.display = 'block';
                } else {
                    alert('❌ Erro ao processar PDF: ' + result.message);
                }
            } catch (error) {
                alert('❌ Erro ao conectar com o servidor.');
            }
        });
    }

    function preencherFormulario(dados) {
        document.getElementById('rua').value = dados.rua;
        document.getElementById('numero').value = dados.numero;
        document.getElementById('bairro').value = dados.bairro;
        document.getElementById('cidade').value = dados.cidade;
        document.getElementById('estado').value = dados.estado;
        document.getElementById('cep').value = dados.cep;

        if (dados.mediaConsumo) {
            tipoConsumo.value = 'media';
            consumoMensal.classList.add('hidden');
            consumoMedia.classList.remove('hidden');
            document.getElementById('mediaConsumo').value = dados.mediaConsumo;
        } else {
            tipoConsumo.value = 'mensal';
            consumoMensal.classList.remove('hidden');
            consumoMedia.classList.add('hidden');
            document.getElementById('janeiro').value = dados.janeiro || '';
            document.getElementById('fevereiro').value = dados.fevereiro || '';
            document.getElementById('marco').value = dados.marco || '';
            document.getElementById('abril').value = dados.abril || '';
            document.getElementById('maio').value = dados.maio || '';
            document.getElementById('junho').value = dados.junho || '';
            document.getElementById('julho').value = dados.julho || '';
            document.getElementById('agosto').value = dados.agosto || '';
            document.getElementById('setembro').value = dados.setembro || '';
            document.getElementById('outubro').value = dados.outubro || '';
            document.getElementById('novembro').value = dados.novembro || '';
            document.getElementById('dezembro').value = dados.dezembro || '';
        }

        document.getElementById('mediaInjecao').value = dados.mediaInjecao;
        document.getElementById('valorKwh').value = dados.valorKwh;

        tipoTensao.value = 'baixa'; // Assumindo baixa, ajuste se PDF tiver
        tipoTensao.dispatchEvent(new Event('change'));
    }

    if (proposalFormPdf) {
        proposalFormPdf.addEventListener('submit', async function(e) {
            e.preventDefault();

            const formData = new FormData(this);
            const data = Object.fromEntries(formData.entries());

            data.tipoTensao = tipoTensao.value;
            data.classe = document.getElementById('classe').value;
            data.desconto = parseFloat(data.desconto) || 0;
            data.valorKwh = parseFloat(data.valorKwh) || VALOR_KWH_PADRAO;

            const dadosCalculados = calcularEconomia(data);
            data.economiaMedia = dadosCalculados.economiaMedia;
            data.economiaAnual = dadosCalculados.economiaAnual;
            data.valorPagoFlexMedia = dadosCalculados.valorPagoFlexMedia;
            data.valorPagoFlexAnual = dadosCalculados.valorPagoFlexAnual;
            data.valorPagoCemigMedia = dadosCalculados.valorPagoCemigMedia;
            data.valorPagoCemigAnual = dadosCalculados.valorPagoCemigAnual;

            const numericFields = ['janeiro','fevereiro','marco','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro','mediaConsumo','mediaInjecao','desconto','valorKwh'];
            numericFields.forEach(field => {
                if (data[field]) data[field] = parseFloat(data[field]);
                else data[field] = null;
            });

            const submitBtn = this.querySelector('.btn-enviar');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '⏳ Enviando...';
            submitBtn.disabled = true;

            try {
                const response = await fetch('/api/propostas', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
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
                alert('❌ Erro ao conectar com o servidor.');
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
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
        const distribuidoraInput = document.getElementById('distribuidora');
        if (distribuidoraInput) distribuidoraInput.value = 'CEMIG';
        const classeInput = document.getElementById('classe');
        if (classeInput) classeInput.value = '';
    }

    function calcularEconomia(data) {
        // Lógica completa de cálculo (baseada no seu original truncado — ajuste se preciso)
        let mediaConsumo = data.mediaConsumo || 0;
        if (!mediaConsumo && data.tipoConsumo === 'mensal') {
            const meses = ['janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
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

        return {
            economiaMedia,
            economiaAnual,
            valorPagoFlexMedia,
            valorPagoFlexAnual,
            valorPagoCemigMedia,
            valorPagoCemigAnual
        };
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