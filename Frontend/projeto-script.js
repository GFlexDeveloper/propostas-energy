document.addEventListener('DOMContentLoaded', () => {
    const animatedElements = document.querySelectorAll('.hidden-anim');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
            }
        });
    }, {
        threshold: 0.1 // Ativa quando 10% do elemento estiver visível
    });

    animatedElements.forEach(el => observer.observe(el));
});