// Frontend/script.js


FlexAuth.init(); // Protege a página

document.addEventListener('DOMContentLoaded', function() {
    if (window.FlexAuth) {
        window.FlexAuth.init(); 
    } else {
        console.error("Erro: FlexAuth não encontrado. Verifique se o auth.js foi carregado.");
    }
    const cardManual = document.getElementById('card-manual');
    const cardPdf = document.getElementById('card-pdf');
    const cardGeradas = document.getElementById('card-geradas');
    const cardInfo = document.getElementById('card-info');
    const logoutBtn = document.getElementById('logoutBtn');

    if (cardManual) cardManual.addEventListener('click', () => window.location.href = 'proposta-manual.html');
    if (cardPdf) cardPdf.addEventListener('click', () => window.location.href = 'proposta-pdf.html');
    if (cardGeradas) cardGeradas.addEventListener('click', () => window.location.href = 'geradas.html');
    if (cardInfo) cardInfo.addEventListener('click', () => window.location.href = 'projeto.html');
    if (logoutBtn) logoutBtn.addEventListener('click', () => FlexAuth.logout());
});