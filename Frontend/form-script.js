// form-script.js - Funcionalidades específicas do formulário

document.addEventListener('DOMContentLoaded', function() {
    // Alternar entre consumo mensal e média
    const tipoConsumo = document.getElementById('tipoConsumo');
    const consumoMensal = document.getElementById('consumoMensal');
    const consumoMedia = document.getElementById('consumoMedia');
    
    tipoConsumo.addEventListener('change', function() {
        if (this.value === 'mensal') {
            consumoMensal.classList.remove('hidden');
            consumoMedia.classList.add('hidden');
        } else {
            consumoMensal.classList.add('hidden');
            consumoMedia.classList.remove('hidden');
        }
    });
    
    // Mostrar/ocultar campo de injeção média
    const geracaoPropria = document.getElementById('geracaoPropria');
    const injecaoMedia = document.getElementById('injecaoMedia');
    
    geracaoPropria.addEventListener('change', function() {
        if (this.value === 'sim') {
            injecaoMedia.classList.remove('hidden');
        } else {
            injecaoMedia.classList.add('hidden');
        }
    });
    
    // Voltar para a tela inicial
    document.getElementById('btnVoltar').addEventListener('click', function() {
        if (confirm('Deseja voltar para a tela inicial? Os dados não salvos serão perdidos.')) {
            window.location.href = 'index.html';
        }
    });
    
    // Enviar formulário
    document.getElementById('proposalForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Validações básicas
        const nome = document.getElementById('nome').value;
        const cpfCnpj = document.getElementById('cpfCnpj').value;
        const endereco = document.getElementById('endereco').value;
        const numeroInstalacao = document.getElementById('numeroInstalacao').value;
        const contato = document.getElementById('contato').value;
        const tipoPadrao = document.getElementById('tipoPadrao').value;
        const geracaoPropriaVal = document.getElementById('geracaoPropria').value;
        
        if (!nome || !cpfCnpj || !endereco || !numeroInstalacao || !contato || !tipoPadrao || !geracaoPropriaVal) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }
        
        // Aqui você pode adicionar a lógica para enviar os dados
        alert('Proposta enviada com sucesso!');
        // this.submit(); // Descomente quando tiver um backend para processar
    });
});