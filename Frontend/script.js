document.addEventListener('DOMContentLoaded', function() {
    // Seleciona os cards pelos seus IDs
    const cardManual = document.getElementById('card-manual');
    const cardPdf = document.getElementById('card-pdf');
    const cardGeradas = document.getElementById('card-geradas');
    const cardInfo = document.getElementById('card-info');

    // Adiciona o evento de clique para cada card
    if (cardManual) {
        cardManual.addEventListener('click', () => {
            window.location.href = 'proposta-manual.html';
        });
    }

    if (cardPdf) {
        cardPdf.addEventListener('click', () => {
            window.location.href = 'proposta-pdf.html';
        });
    }

    if (cardGeradas) {
        cardGeradas.addEventListener('click', () => {
            window.location.href = 'geradas.html';
        });
    }

    if (cardInfo) {
        cardInfo.addEventListener('click', () => {
            window.location.href = 'projeto.html';
        });
    }
});