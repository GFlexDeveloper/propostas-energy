// Função para extrair o parâmetro "instalacao" da URL
function getNumeroInstalacao() {
  const params = new URLSearchParams(window.location.search);
  return params.get('instalacao');
}

// Função para buscar os dados da instalação no backend
function buscarProposta(numeroInstalacao) {
  fetch(`https://propostas-energy.onrender.com/api/propostas/instalacao/${numeroInstalacao}`)
    .then(response => {
      if (!response.ok) throw new Error('Instalação não encontrada');
      return response.json();
    })
    .then(result => {
      if (result.success && result.data) {
        const proposta = result.data;
        document.getElementById('proposta').innerHTML = `
          <h2>Proposta para instalação ${proposta.numero_instalacao}</h2>
          <p><strong>Nome:</strong> ${proposta.nome}</p>
          <p><strong>CPF/CNPJ:</strong> ${proposta.cpf_cnpj}</p>
          <p><strong>Endereço:</strong> ${proposta.endereco}</p>
          <p><strong>Contato:</strong> ${proposta.contato}</p>
          <p><strong>Consumo médio:</strong> ${proposta.media_consumo} kWh</p>
          <p><strong>Tipo de padrão:</strong> ${proposta.tipo_padrao}</p>
          <p><strong>Tipo de tensão:</strong> ${proposta.tipo_tensao}</p>
          <p><strong>Geração própria:</strong> ${proposta.geracao_propria}</p>
          <p><strong>Desconto:</strong> R$ ${proposta.desconto?.toFixed(2)}</p>
          <p><strong>Economia anual:</strong> R$ ${proposta.economia_anual?.toFixed(2)}</p>
        `;
      } else {
        document.getElementById('proposta').innerHTML = `<p class="erro">Instalação não encontrada.</p>`;
      }
    })
    .catch(err => {
      document.getElementById('proposta').innerHTML = `<p class="erro">${err.message}</p>`;
    });
}

// Inicialização ao carregar a página
window.onload = function() {
  const numeroInstalacao = getNumeroInstalacao();
  if (!numeroInstalacao) {
    document.getElementById('proposta').innerHTML = '<p class="erro">Número de instalação não informado na URL.</p>';
    return;
  }
  buscarProposta(numeroInstalacao);
};