// form-script.js - Funcionalidades específicas do formulário

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

    // Constante do valor do kWh
    const VALOR_KWH_PADRAO = 1.19;

    // Função para iniciar animação em cascata
    function iniciarAnimacaoFormulario() {
        // Remover classe de loading do body
        document.body.classList.remove('loading');
        
        // Inicialmente esconder a seção de baixa tensão
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
                // Animação para mostrar a seção
                secaoBaixaTensao.style.display = 'block';
                setTimeout(() => {
                    secaoBaixaTensao.classList.remove('hidden');
                }, 10);
                
                // Tornar campos obrigatórios para baixa tensão
                tornarCamposObrigatorios(true);
            } else {
                // Animação para esconder a seção
                secaoBaixaTensao.classList.add('hidden');
                setTimeout(() => {
                    secaoBaixaTensao.style.display = 'none';
                }, 500);
                
                // Tornar campos opcionais para média tensão
                tornarCamposObrigatorios(false);
            }
        });

        // Inicializar estado correto
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
        
        // Campos de endereço sempre obrigatórios
        const camposEndereco = ['rua', 'numero', 'bairro', 'cidade', 'estado', 'cep'];
        camposEndereco.forEach(campo => {
            const element = document.getElementById(campo);
            if (element) {
                element.required = true;
            }
        });
        
        campos.forEach(campo => {
            const element = document.getElementById(campo);
            if (element) {
                if (obrigatorio) {
                    element.required = true;
                } else {
                    element.required = false;
                    // Limpar valores se não for obrigatório
                    if (element.tagName === 'SELECT') {
                        element.value = '';
                    }
                }
            }
        });
    }

    // Alternar entre consumo mensal e média (apenas para baixa tensão)
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
    
    // Mostrar/ocultar campo de injeção média (apenas para baixa tensão)
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

    // NOVAS FUNÇÕES PARA OS CAMPOS ADICIONAIS

    // Buscar endereço pelo CEP
    async function buscarEnderecoPorCEP() {
        const cep = document.getElementById('cep').value.replace(/\D/g, '');
        
        if (cep.length !== 8) {
            return;
        }

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
            console.error('Erro ao buscar CEP:', error);
            alert('Erro ao buscar CEP. Tente novamente.');
        }
    }

    // Formatar CEP
    function formatarCEP(cep) {
        cep = cep.replace(/\D/g, '');
        if (cep.length > 5) {
            cep = cep.replace(/^(\d{5})(\d)/, '$1-$2');
        }
        return cep.substring(0, 9);
    }

    // Formatar CPF/CNPJ
    function formatarDocumento(documento) {
        documento = documento.replace(/\D/g, '');
        
        if (documento.length <= 11) {
            // Formatar como CPF
            documento = documento.replace(/(\d{3})(\d)/, '$1.$2');
            documento = documento.replace(/(\d{3})(\d)/, '$1.$2');
            documento = documento.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        } else {
            // Formatar como CNPJ
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

    // NOVOS EVENT LISTENERS PARA OS CAMPOS ADICIONAIS
    
    // Buscar endereço quando CEP perder o foco
    const cepInput = document.getElementById('cep');
    if (cepInput) {
        cepInput.addEventListener('blur', buscarEnderecoPorCEP);
        
        cepInput.addEventListener('input', function(e) {
            e.target.value = formatarCEP(e.target.value);
        });
    }
    
    // Formatar CPF/CNPJ em tempo real
    const cpfCnpjInput = document.getElementById('cpfCnpj');
    if (cpfCnpjInput) {
        cpfCnpjInput.addEventListener('input', function(e) {
            e.target.value = formatarDocumento(e.target.value);
        });
    }
    
    // Formatar telefone em tempo real
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

        // Custo de disponibilidade por tipo de padrão (em kWh)
        const custoDisponibilidadeKwh = {
            'monofasico': 30,
            'bifasico': 50,
            'trifasico': 100
        };

        // Só calcular se for baixa tensão e tiver dados de consumo
        if (data.tipoTensao === 'baixa' && tipoPadrao) {
            const custoDispKwh = custoDisponibilidadeKwh[tipoPadrao] || 0;
            const geracao = (geracaoPropria === 'sim') ? mediaInjecao : 0;
            const custoIluminacaoPublica = 20; // Valor fixo

            if (tipoConsumoVal === 'mensal') {
                // Calcular baseado nos valores mensais
                const meses = ['janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho', 
                              'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
                
                let totalEconomia = 0;
                let totalValorPagoFlex = 0;
                let totalValorPagoCemig = 0;
                let totalConsumo = 0;
                let mesesPreenchidos = 0;

                meses.forEach(mes => {
                    const consumo = parseFloat(data[mes]) || 0;
                    if (consumo > 0) {
                        // Cálculo da economia mensal
                        const economiaMes = (consumo - custoDispKwh - geracao) * valorKwh * (desconto / 100);
                        
                        // Cálculo do valor pago à Flex Energy
                        const valorPagoFlexMes = (consumo*valorKwh) - Math.max(economiaMes, 0) + (custoDispKwh * valorKwh) + custoIluminacaoPublica;
                        
                        // Cálculo do valor pago à CEMIG
                        const valorPagoCemigMes = consumo * valorKwh + custoIluminacaoPublica;
                        
                        // Acumular totais
                        totalEconomia += Math.max(economiaMes, 0); // Não permitir valores negativos
                        totalValorPagoFlex += Math.max(valorPagoFlexMes, 0);
                        totalValorPagoCemig += Math.max(valorPagoCemigMes, 0);
                        totalConsumo += consumo;
                        mesesPreenchidos++;
                    }
                });

                if (mesesPreenchidos > 0) {
                    // Valores médios mensais
                    economiaMedia = totalEconomia / mesesPreenchidos;
                    valorPagoFlexMedia = totalValorPagoFlex / mesesPreenchidos;
                    valorPagoCemigMedia = totalValorPagoCemig / mesesPreenchidos;
                    
                    // Valores anuais
                    economiaAnual = totalEconomia;
                    valorPagoFlexAnual = totalValorPagoFlex;
                    valorPagoCemigAnual = totalValorPagoCemig;
                }

            } else if (tipoConsumoVal === 'media') {
                // Calcular baseado na média mensal
                const mediaConsumo = parseFloat(data.mediaConsumo) || 0;
                if (mediaConsumo > 0) {
                    // Cálculo da economia mensal
                    economiaMedia = (mediaConsumo - custoDispKwh - geracao) * valorKwh * (desconto / 100);
                    
                    // Cálculo do valor pago à Flex Energy mensal
                    valorPagoFlexMedia = (mediaConsumo*valorKwh) - Math.max(economiaMedia, 0) + (custoDispKwh * valorKwh) + custoIluminacaoPublica;
                    
                    // Cálculo do valor pago à CEMIG mensal
                    valorPagoCemigMedia = mediaConsumo * valorKwh;
                    
                    // Valores anuais
                    economiaAnual = Math.max(economiaMedia, 0) * 12;
                    valorPagoFlexAnual = valorPagoFlexMedia * 12;
                    valorPagoCemigAnual = valorPagoCemigMedia * 12;
                    
                    // Não permitir valores negativos
                    economiaMedia = Math.max(economiaMedia, 0);
                    valorPagoFlexMedia = Math.max(valorPagoFlexMedia, 0);
                    valorPagoCemigMedia = Math.max(valorPagoCemigMedia, 0);
                }
            }
        }

        return {
            economiaMedia: economiaMedia,
            economiaAnual: economiaAnual,
            valorPagoFlexMedia: valorPagoFlexMedia,
            valorPagoFlexAnual: valorPagoFlexAnual,
            valorPagoCemigMedia: valorPagoCemigMedia,
            valorPagoCemigAnual: valorPagoCemigAnual
        };
    }

    // Função para validar formulário completo
    function validarFormulario() {
        const camposObrigatorios = [
            'nome', 'cpfCnpj', 'contato', 'classe', 'tipoTensao',
            'rua', 'numero', 'bairro', 'cidade', 'estado', 'cep',
            'numeroInstalacao'
        ];

        // Se for baixa tensão, validar campos adicionais
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
            
            // Rolagem para o primeiro campo faltante
            const firstMissing = document.getElementById(missing[0]);
            if (firstMissing) {
                firstMissing.scrollIntoView({ behavior: 'smooth', block: 'center' });
                firstMissing.focus();
            }
            
            return false;
        }

        return true;
    }

    // Enviar formulário
    if (proposalForm) {
        proposalForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Validações básicas
            if (!validarFormulario()) {
                return;
            }

            // Coletar todos os dados do formulário
            const formData = new FormData(this);
            const data = Object.fromEntries(formData.entries());

            // Calcular economia e valores (mas não mostrar para o usuário)
            const dadosCalculados = calcularEconomia(data);
            
            // Adicionar todos os dados calculados ao objeto data
            data.economiaMedia = dadosCalculados.economiaMedia;
            data.economiaAnual = dadosCalculados.economiaAnual;
            data.valorPagoFlexMedia = dadosCalculados.valorPagoFlexMedia;
            data.valorPagoFlexAnual = dadosCalculados.valorPagoFlexAnual;
            data.valorPagoCemigMedia = dadosCalculados.valorPagoCemigMedia;
            data.valorPagoCemigAnual = dadosCalculados.valorPagoCemigAnual;
            data.valorKwh = parseFloat(data.valorKwh) || VALOR_KWH_PADRAO;

            // Converter valores numéricos
            const numericFields = ['janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho', 
                                  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
                                  'mediaConsumo', 'mediaInjecao', 'desconto'];
            
            numericFields.forEach(field => {
                if (data[field]) {
                    data[field] = parseFloat(data[field]);
                } else {
                    data[field] = null; // Garantir que campos vazios sejam null
                }
            });

            // Mostrar loading
            const submitBtn = this.querySelector('.btn-enviar');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '⏳ Enviando...';
            submitBtn.disabled = true;

            try {
                const response = await fetch('http://localhost:3000/api/propostas', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (result.success) {
                    alert('✅ Proposta salva com sucesso! ID: ' + result.id);
                    // Limpar formulário
                    this.reset();
                    // Resetar campos dinâmicos
                    resetarCamposDinamicos();
                } else {
                    alert('❌ Erro ao salvar proposta: ' + result.message);
                }
            } catch (error) {
                console.error('Erro:', error);
                alert('❌ Erro ao conectar com o servidor. Verifique se o backend está rodando.');
            } finally {
                // Restaurar botão
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    // Função para resetar campos dinâmicos
    function resetarCamposDinamicos() {
        // Mostrar seção de baixa tensão por padrão
        if (secaoBaixaTensao) {
            secaoBaixaTensao.style.display = 'block';
            secaoBaixaTensao.classList.remove('hidden');
        }
        // Resetar tipo de consumo para mensal
        if (tipoConsumo) tipoConsumo.value = 'mensal';
        if (consumoMensal) consumoMensal.classList.remove('hidden');
        if (consumoMedia) consumoMedia.classList.add('hidden');
        if (injecaoMedia) injecaoMedia.classList.add('hidden');
        // Resetar valor do kWh
        const valorKwhInput = document.getElementById('valorKwh');
        if (valorKwhInput) valorKwhInput.value = VALOR_KWH_PADRAO;
        // Resetar tipo de tensão
        if (tipoTensao) tipoTensao.value = '';
        // Resetar distribuidora para CEMIG
        const distribuidoraInput = document.getElementById('distribuidora');
        if (distribuidoraInput) distribuidoraInput.value = 'CEMIG';
        // Resetar classe
        const classeInput = document.getElementById('classe');
        if (classeInput) classeInput.value = '';
    }
});