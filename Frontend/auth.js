// Frontend/auth.js

const FlexAuth = {
    token: null,
    // URL do seu Backend no Render
    apiBaseUrl: 'https://api.flexgrupo.com.br/', 

    init: function() {
        this.token = localStorage.getItem('flex-token');
        // Se não tiver token e não estiver na tela de login, manda pro login
        if (!this.token && !window.location.pathname.endsWith('login.html')) {
            window.location.href = 'login.html';
        }
    },

    logout: function() {
        localStorage.removeItem('flex-token');
        window.location.href = 'login.html';
    },

    fetchWithAuth: async function(endpoint, options = {}) {
        if (!this.token) {
            console.error('Nenhum token encontrado, redirecionando para login.');
            this.logout();
            throw new Error('Usuário não autenticado.');
        }

        const headers = {
            'Authorization': `Bearer ${this.token}`,
            ...options.headers
        };

        // Se tiver corpo e não for arquivo (FormData), define como JSON
        if (options.body && !(options.body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
        }

        // Monta a URL completa (Render + Endpoint)
        const url = `${this.apiBaseUrl}${endpoint}`;

        try {
            const response = await fetch(url, {
                ...options,
                headers: headers
            });

            // Se o token expirou ou é inválido (401/403)
            if (response.status === 401 || response.status === 403) {
                alert('Sua sessão expirou. Por favor, faça o login novamente.');
                this.logout();
                throw new Error('Token inválido ou expirado.');
            }
            
            return response;

        } catch (error) {
            console.error(`Erro na chamada da API para ${url}:`, error);
            throw error;
        }
    }
};