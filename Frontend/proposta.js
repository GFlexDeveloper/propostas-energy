// Frontend/proposta.js

FlexAuth.init(); // Protege a página

function getNumeroInstalacao() {
    return new URLSearchParams(window.location.search).get('instalacao');
}

function formatarMoeda(valor) {
    return (Number(valor) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function preencherCampo(id, valor, formatador) {
    const elemento = document.getElementById(id);
    if (elemento) {
        if (id === 'consumo-medio' && (!valor || valor == 0)) {
            elemento.textContent = 'N/A';
            return;
        }
        elemento.textContent = formatador ? formatador(valor) : (valor || 'N/A');
    }
}

async function buscarEExibirProposta(numeroInstalacao) {
    const loadingDiv = document.getElementById('loading');
    const proposalDiv = document.getElementById('proposal-content');

    try {
        const response = await FlexAuth.fetchWithAuth(`/api/propostas/instalacao/${numeroInstalacao}`);
        
        if (!response.ok) {
            throw new Error(`Proposta não encontrada (status: ${response.status})`);
        }

        const result = await response.json();

        if (result.success && result.data) {
            const proposta = result.data;
            
            preencherCampo('proposta-id', proposta.id);
            preencherCampo('proposta-data', new Date(proposta.data_criacao).toLocaleDateString('pt-BR'));
            preencherCampo('cliente-nome', proposta.nome);
            preencherCampo('cliente-documento', proposta.cpf_cnpj);
            preencherCampo('cliente-endereco', proposta.endereco);
            preencherCampo('cliente-instalacao', proposta.numero_instalacao);
            
            // IMPORTANTE: Preenche o campo oculto para o envio do Zap
            preencherCampo('cliente-contato', proposta.contato);

            preencherCampo('fatura-cemig', proposta.valor_pago_cemig_media, formatarMoeda);
            preencherCampo('consumo-medio', proposta.media_consumo);
            preencherCampo('desconto', `${proposta.desconto || 0}%`);
            preencherCampo('fatura-flex', proposta.valor_pago_flex_media, formatarMoeda);
            preencherCampo('economia-mensal', proposta.economia_media, formatarMoeda);
            preencherCampo('economia-anual', proposta.economia_anual, formatarMoeda);
            
            preencherCampo('tabela-cemig-mensal', proposta.valor_pago_cemig_media, formatarMoeda);
            preencherCampo('tabela-cemig-anual', proposta.valor_pago_cemig_anual, formatarMoeda);
            preencherCampo('tabela-flex-mensal', proposta.valor_pago_flex_media, formatarMoeda);
            preencherCampo('tabela-flex-anual', proposta.valor_pago_flex_anual, formatarMoeda);
            preencherCampo('tabela-economia-mensal', proposta.economia_media, formatarMoeda);
            preencherCampo('tabela-economia-anual', proposta.economia_anual, formatarMoeda);

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

// Inicialização
const numeroInstalacao = getNumeroInstalacao();
if (!numeroInstalacao) {
    document.getElementById('loading').textContent = 'Erro: Número de instalação não informado na URL.';
} else {
    buscarEExibirProposta(numeroInstalacao);
}

// --- LÓGICA DE BOTÕES (PDF e WHATSAPP) ---
document.addEventListener('DOMContentLoaded', () => {
    
    const getPdfOptions = () => ({
        margin: [5, 5, 5, 5],
        filename: `Proposta_Flex_${getNumeroInstalacao() || 'Energy'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    });

    // 1. Baixar PDF
    const btnDownload = document.getElementById('btn-download-pdf');
    if (btnDownload) {
        btnDownload.addEventListener('click', () => {
            const element = document.getElementById('proposal-content');
            const originalText = btnDownload.innerHTML;
            
            btnDownload.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gerando...';
            btnDownload.disabled = true;

            html2pdf().set(getPdfOptions()).from(element).save().then(() => {
                btnDownload.innerHTML = originalText;
                btnDownload.disabled = false;
            }).catch(err => {
                console.error(err);
                alert('Erro ao gerar PDF');
                btnDownload.innerHTML = originalText;
                btnDownload.disabled = false;
            });
        });
    }

    // 2. Enviar WhatsApp
    const btnZap = document.getElementById('btn-whatsapp');
    if (btnZap) {
        btnZap.addEventListener('click', async () => {
            const element = document.getElementById('proposal-content');
            
            const originalText = btnZap.innerHTML;
            btnZap.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Processando...';
            btnZap.disabled = true;

            try {
                // Gera o PDF
                const pdfBlob = await html2pdf().set(getPdfOptions()).from(element).output('blob');

                // Pega o telefone (tenta do campo oculto, senão prompt)
                let phone = document.getElementById('cliente-contato')?.textContent || ''; 
                if (!phone) {
                   phone = prompt("Número do WhatsApp (apenas números, com DDD):");
                }
                
                if (!phone) throw new Error("Telefone não informado.");

                // Formata telefone para 5537...
                phone = phone.replace(/\D/g, '');
                if (phone.length <= 11) phone = '55' + phone;

                const nomeCliente = document.getElementById('cliente-nome')?.textContent || 'Cliente';
                const msg = `Olá ${nomeCliente}, segue sua proposta oficial da Flex Energy!`;

                const formData = new FormData();
                formData.append('pdfFile', pdfBlob, `Proposta.pdf`);
                formData.append('phone', phone);
                formData.append('message', msg);
                formData.append('fileName', `Proposta_FlexEnergy.pdf`);

                const response = await FlexAuth.fetchWithAuth('/api/enviar-whatsapp', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();

                if (result.success) {
                    alert('✅ Proposta enviada com sucesso!');
                } else {
                    throw new Error(result.message || 'Erro ao enviar.');
                }

            } catch (err) {
                console.error(err);
                alert('❌ Erro: ' + err.message);
            } finally {
                btnZap.innerHTML = originalText;
                btnZap.disabled = false;
            }
        });
    }
});