document.addEventListener('DOMContentLoaded', async function() {
    const tableBody = document.getElementById('proposals-table-body');
    const tableStatus = document.getElementById('table-status');

    function formatarData(isoString) {
        if (!isoString) return 'N/A';
        return new Date(isoString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    try {
        // Mostra o status de carregamento
        tableStatus.textContent = 'Carregando propostas...';

        const response = await fetch('https://propostas-energy.onrender.com/api/propostas');
        const result = await response.json();

        if (result.success && result.data.length > 0) {
            // Esconde a mensagem de status e preenche a tabela
            tableStatus.classList.add('hidden');
            tableBody.innerHTML = ''; // Limpa a tabela antes de preencher

            result.data.forEach(proposta => {
                const row = document.createElement('tr');
                row.setAttribute('data-instalacao', proposta.numero_instalacao); // Armazena o nº da instalação
                
                row.innerHTML = `
                    <td>${proposta.id}</td>
                    <td>${proposta.nome || 'N/A'}</td>
                    <td>${proposta.cpf_cnpj || 'N/A'}</td>
                    <td>${formatarData(proposta.data_criacao)}</td>
                    <td>${proposta.classe || 'N/A'}</td>
                `;

                // Adiciona evento de clique para redirecionar para a proposta individual
                row.addEventListener('click', () => {
                    window.location.href = `proposta.html?instalacao=${proposta.numero_instalacao}`;
                });

                tableBody.appendChild(row);
            });

        } else if (result.success && result.data.length === 0) {
            tableStatus.textContent = 'Nenhuma proposta encontrada.';
        } else {
            tableStatus.textContent = `Erro ao buscar propostas: ${result.message}`;
            tableStatus.style.color = 'red';
        }

    } catch (error) {
        console.error('Erro de conexão:', error);
        tableStatus.textContent = 'Erro de conexão com o servidor. Tente novamente mais tarde.';
        tableStatus.style.color = 'red';
    }
});