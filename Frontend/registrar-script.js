document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const nome = document.getElementById('nome').value;
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    const btn = this.querySelector('.btn-enviar');
    const originalText = btn.innerHTML;

    btn.innerHTML = 'Registrando...';
    btn.disabled = true;

    try {
        // --- CORREÇÃO AQUI: URL DO RENDER ---
        const response = await fetch('https://propostas-energy.onrender.com/api/usuarios/registrar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, email, senha, cargo: 'Vendedor' })
        });
        const result = await response.json();

        if (result.success) {
            alert('Usuário registrado com sucesso! Você será redirecionado para o login.');
            window.location.href = 'login.html';
        } else {
            alert('Erro: ' + result.message);
        }
    } catch (error) {
        console.error(error); // Ajuda a debugar
        alert('Erro de conexão. Verifique se o servidor está rodando.');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
});