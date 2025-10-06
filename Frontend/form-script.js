document.addEventListener('DOMContentLoaded', function() {
    // Iniciar animação em cascata
    iniciarAnimacaoFormulario();

    // Elementos do formulário
    const tipoTensao = document.getElementById('tipoTensao');
    const secaoBaixaTensao = document.getElementById('secaoBaixaTensao');
    const tipoConsumo = document.getElementById('tipoConsumo');
    const consumoMensal = document.getElementById('consumoMensal');
    const consumoMedia = document.getElementById('consumoMedia');
    const geracaoPropria = document.getElementById('geracaoPropria');
    const injecaoMedia = document.getElementById('injecaoMedia');
    const btnVoltar = document.getElementById('btnVoltar');
    const proposalForm = document.getElementById('proposalForm');
    const VALOR_KWH_PADRAO = 1.19;

    // Função para iniciar animação em cascata
    function iniciarAnimacaoFormulario() {
        document.body.classList.remove('loading');
        setTimeout(() => {
            if (secaoBaixaTensao) {
                secaoBaixaTensao.classList.add('hidden');
            }
        }, 100);
    }

    // Controlar visibilidade baseado no tipo de tensão
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

    // Função para tornar campos obrigatórios ou opcionais
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

    // Alternar entre consumo mensal e média (baixa tensão)
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

    // Mostrar/ocultar campo de injeção média (baixa tensão)
    if (geracaoPropria && injecaoMedia) {
        geracaoPropria.addEventListener('change', function() {
            if (this.value === 'sim') {
                injecaoMedia.classList.remove('hidden');
            } else {
                injecaoMedia.classList.add('hidden');
            }
        });
    }

    // Voltar para a tela inicial
    if (btnVoltar) {
        btnVoltar.addEventListener('click', function() {
            if (confirm('Deseja voltar para a tela inicial? Os dados não salvos serão perdidos.')) {
                window.location.href = 'index.html';
            }
        });
    }

    // Buscar endereço pelo CEP
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
                alert('CEP não encontrado. Por favor, verifique o CEP informado.');
            }
        } catch (error) {
            alert('Erro ao buscar CEP. Tente novamente.');
        }
    }

    // Formatar CEP
    function formatarCEP(cep) {
        cep = cep.replace(/\D/g, '');
        if (cep.length > 5) cep = cep.replace(/^(\d{5})(\d)/, '$1-$2');
        return cep.substring(0, 9);
    }

    // Formatar CPF/CNPJ
    function formatarDocumento(documento) {
        documento = documento.replace(/\D/g, '');
        if (documento.length <= 11) {
            documento = documento.replace(/(\d{3})(\d)/, '$1.$2');
            documento = documento.replace(/(\d{3})(\d)/, '$1.$2');
            documento = documento.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        } else {
            documento = documento.replace(/^(\d{2})(\d)/, '$1.$2');
            documento = documento.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
            documento = documento.replace(/\.(\d{3})(\d)/, '.$1/$2');
            documento = documento.replace(/(\d{4})(\d)/, '$1-$2');
        }
        return documento;
    }

    // Formatar telefone
    function formatarTelefone(telefone) {
        telefone = telefone.replace(/\D/g, '');
        if (telefone.length <= 10) {
            telefone = telefone.replace(/(\d{2})(\d)/, '($1) $2');
            telefone = telefone.replace(/(\d{4})(\d)/, '$1-$2');
        } else {
            telefone = telefone.replace(/(\d{2})(\d)/, '($1) $2');
            telefone = telefone.replace(/(\d{5})(\d)/, '$1-$2');
        }
        return telefone;
    }

    // Eventos para máscaras e busca de CEP
    const cepInput = document.getElementById('cep');
    if (cepInput) {
        cepInput.addEventListener('blur', buscarEnderecoPorCEP);
        cepInput.addEventListener('input', function(e) {
            e.target.value = formatarCEP(e.target.value);
        });
    }
    const cpfCnpjInput = document.getElementById('cpfCnpj');
    if (cpfCnpjInput) {
        cpfCnpjInput.addEventListener('input', function(e) {
            e.target.value = formatarDocumento(e.target.value);
        });
    }
    const contatoInput = document.getElementById('contato');
    if (contatoInput) {
        contatoInput.addEventListener('input', function(e) {
            e.target.value = formatarTelefone(e.target.value);
        });
    }

    // Função para calcular economia e valores (sem mostrar para o usuário)
    function calcularEconomia(data) {
        const valorKwh = parseFloat(data.valorKwh) || VALOR_KWH_PADRAO;
        const desconto = parseFloat(data.desconto) || 0;
        const tipoConsumoVal = data.tipoConsumo;
        const tipoPadrao = data.tipoPadrao;
        const geracaoPropria = data.geracaoPropria;
        const mediaInjecao = parseFloat(data.mediaInjecao) || 0;

        let economiaMedia = 0;
        let economiaAnual = 0;
        let valorPagoFlexMedia = 0;
        let valorPagoFlexAnual = 0;
        let valorPagoCemigMedia = 0;
        let valorPagoCemigAnual = 0;

        const custoDisponibilidadeKwh = {
            'monofasico': 30,
            'bifasico': 50,
            'trifasico': 100
        };

        if (data.tipoTensao === 'baixa' && tipoPadrao) {
            const custoDispKwh = custoDisponibilidadeKwh[tipoPadrao] || 0;
            const geracao = (geracaoPropria === 'sim') ? mediaInjecao : 0;
            const custoIluminacaoPublica = 20;

            if (tipoConsumoVal === 'mensal') {
                const meses = ['janeiro','fevereiro','marco','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
                let totalEconomia = 0, totalValorPagoFlex = 0, totalValorPagoCemig = 0, mesesPreenchidos = 0;
                meses.forEach(mes => {
                    const consumo = parseFloat(data[mes]) || 0;
                    if (consumo > 0) {
                        const economiaMes = (consumo - custoDispKwh - geracao) * valorKwh * (desconto / 100);
                        const valorPagoFlexMes = (consumo*valorKwh) - Math.max(economiaMes, 0) + (custoDispKwh * valorKwh) + custoIluminacaoPublica;
                        const valorPagoCemigMes = consumo * valorKwh + custoIluminacaoPublica;
                        totalEconomia += Math.max(economiaMes, 0);
                        totalValorPagoFlex += Math.max(valorPagoFlexMes, 0);
                        totalValorPagoCemig += Math.max(valorPagoCemigMes, 0);
                        mesesPreenchidos++;
                    }
                });
                if (mesesPreenchidos > 0) {
                    economiaMedia = totalEconomia / mesesPreenchidos;
                    valorPagoFlexMedia = totalValorPagoFlex / mesesPreenchidos;
                    valorPagoCemigMedia = totalValorPagoCemig / mesesPreenchidos;
                    economiaAnual = totalEconomia;
                    valorPagoFlexAnual = totalValorPagoFlex;
                    valorPagoCemigAnual = totalValorPagoCemig;
                }
            } else if (tipoConsumoVal === 'media') {
                const mediaConsumo = parseFloat(data.mediaConsumo) || 0;
                if (mediaConsumo > 0) {
                    economiaMedia = (mediaConsumo - custoDispKwh - geracao) * valorKwh * (desconto / 100);
                    valorPagoFlexMedia = (mediaConsumo*valorKwh) - Math.max(economiaMedia, 0) + (custoDispKwh * valorKwh) + custoIluminacaoPublica;
                    valorPagoCemigMedia = mediaConsumo * valorKwh;
                    economiaAnual = Math.max(economiaMedia, 0) * 12;
                    valorPagoFlexAnual = valorPagoFlexMedia * 12;
                    valorPagoCemigAnual = valorPagoCemigMedia * 12;
                    economiaMedia = Math.max(economiaMedia, 0);
                    valorPagoFlexMedia = Math.max(valorPagoFlexMedia, 0);
                    valorPagoCemigMedia = Math.max(valorPagoCemigMedia, 0);
                }
            }
        }
        return {
            economiaMedia, economiaAnual, valorPagoFlexMedia, valorPagoFlexAnual, valorPagoCemigMedia, valorPagoCemigAnual
        };
    }

    // Função para validar formulário completo
    function validarFormulario() {
        const camposObrigatorios = [
            'nome', 'cpfCnpj', 'contato', 'classe', 'tipoTensao',
            'rua', 'numero', 'bairro', 'cidade', 'estado', 'cep',
            'numeroInstalacao'
        ];
        const tipoTensaoVal = document.getElementById('tipoTensao').value;
        if (tipoTensaoVal === 'baixa') {
            camposObrigatorios.push('tipoPadrao', 'geracaoPropria');
        }
        const missing = camposObrigatorios.filter(field => {
            const element = document.getElementById(field);
            return !element || !element.value;
        });
        if (missing.length > 0) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            const firstMissing = document.getElementById(missing[0]);
            if (firstMissing) {
                firstMissing.scrollIntoView({ behavior: 'smooth', block: 'center' });
                firstMissing.focus();
            }
            return false;
        }
        return true;
    }

    // Envio do formulário
    if (proposalForm) {
        proposalForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            if (!validarFormulario()) return;

            const formData = new FormData(this);
            const data = Object.fromEntries(formData.entries());

            // Monta endereço completo a partir dos campos
            data.endereco = `${data.rua}, ${data.numero}${data.complemento ? ' - ' + data.complemento : ''}, ${data.bairro}, ${data.cidade} - ${data.estado}, CEP: ${data.cep}`;
            if (!data.valorKwh) data.valorKwh = VALOR_KWH_PADRAO;

            // Calcula economia e valores
            const dadosCalculados = calcularEconomia(data);
            data.economiaMedia = dadosCalculados.economiaMedia;
            data.economiaAnual = dadosCalculados.economiaAnual;
            data.valorPagoFlexMedia = dadosCalculados.valorPagoFlexMedia;
            data.valorPagoFlexAnual = dadosCalculados.valorPagoFlexAnual;
            data.valorPagoCemigMedia = dadosCalculados.valorPagoCemigMedia;
            data.valorPagoCemigAnual = dadosCalculados.valorPagoCemigAnual;

            // Converte campos numéricos
            const numericFields = ['janeiro','fevereiro','marco','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro','mediaConsumo','mediaInjecao','desconto','valorKwh'];
            numericFields.forEach(field => {
                if (data[field]) data[field] = parseFloat(data[field]);
                else data[field] = null;
            });

            // Exibe loading no botão
            const submitBtn = this.querySelector('.btn-enviar');
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
                this.reset();
                resetarCamposDinamicos();
                
                // Adicionar redirecionamento para visualizar a proposta
                const numeroInstalacao = data.numeroInstalacao; // Obtenha do formData ou data
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

    // Função para resetar campos dinâmicos
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
});