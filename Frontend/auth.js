// Frontend/auth.js

const FlexAuth = {
    token: null,
    // URL base da sua API - Agora é dinâmica!
    // Se estiver rodando no Render, usa a URL do Render. Se não, usa localhost.
    apiBaseUrl: window.location.hostname.includes('onrender.com') 
                  ? `https://${window.location.hostname}` 
                  : 'http://localhost:3000',

    init: function() {
        this.token = localStorage.getItem('flex-token');
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

        if (options.body && !(options.body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
        }

        // --- AQUI ESTÁ A CORREÇÃO ---
        // Garante que não haverá barras duplas na URL final
        const url = `${this.apiBaseUrl}${endpoint}`;

        try {
            const response = await fetch(url, {
                ...options,
                headers: headers
            });

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