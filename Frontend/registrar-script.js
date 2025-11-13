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
        // A URL da API, igual à usada no login.html
        // Esta rota /api/usuarios/registrar já existe no seu server.js
        const response = await fetch('http://localhost:3000/api/usuarios/registrar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, email, senha, cargo: 'Vendedor' }) // 'cargo' é opcional, mas podemos definir um padrão
        });
        const result = await response.json();

        if (result.success) {
            alert('Usuário registrado com sucesso! Você será redirecionado para o login.');
            window.location.href = 'login.html';
        } else {
            alert('Erro: ' + result.message);
        }
    } catch (error) {
        alert('Erro de conexão. Verifique se o servidor está rodando.');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
});