document.addEventListener('DOMContentLoaded', function() {
    const btnManual = document.querySelector('.btn-manual');
    const btnPdf = document.querySelector('.btn-pdf');
    
    if (btnManual) {
        btnManual.addEventListener('click', function() {
            window.location.href = 'proposta-manual.html';
        });
    }

    if (btnPdf) {
        btnPdf.addEventListener('click', function() {
            window.location.href = 'proposta-pdf.html';
        });
    }
});

