// Frontend/geradas-script.js

FlexAuth.init(); // Protege a página

document.addEventListener('DOMContentLoaded', async function() {
    const tableBody = document.getElementById('proposals-table-body');
    const tableStatus = document.getElementById('table-status');

    function formatarData(isoString) {
        if (!isoString) return 'N/A';
        return new Date(isoString).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }

    try {
        tableStatus.textContent = 'Carregando propostas...';
        
        const response = await FlexAuth.fetchWithAuth('/api/propostas');
        const result = await response.json();

        if (result.success && Array.isArray(result.data) && result.data.length > 0) {
            tableStatus.style.display = 'none';
            tableBody.innerHTML = ''; 

            result.data.forEach(proposta => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${proposta.id}</td>
                    <td>${proposta.nome || 'N/A'}</td>
                    <td>${proposta.cpf_cnpj || 'N/A'}</td>
                    <td>${formatarData(proposta.data_criacao)}</td>
                    <td>${proposta.classe || 'N/A'}</td>
                `;
                row.addEventListener('click', () => {
                    window.location.href = `proposta.html?instalacao=${proposta.numero_instalacao}`;
                });
                tableBody.appendChild(row);
            });
        } else {
            tableStatus.textContent = 'Nenhuma proposta encontrada.';
        }
    } catch (error) {
        console.error('Erro:', error);
        tableStatus.textContent = `Erro ao carregar propostas: ${error.message}`;
        tableStatus.style.color = 'red';
    }
});