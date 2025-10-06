document.addEventListener('DOMContentLoaded', function() {
    const btnManual = document.querySelector('.btn-manual');
    const btnPdf = document.querySelector('.btn-pdf');
    
    if (btnManual) {
        btnManual.addEventListener('click', function() {
            // Redireciona para a página de proposta manual
            window.location.href = 'proposta-manual.html';
        });
    }

    if (btnPdf) {
        btnPdf.addEventListener('click', function() {
            alert('Redirecionando para upload de PDF...');
            // Aqui você pode adicionar a lógica para upload de PDF
        });
    }
});

