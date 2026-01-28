window.FlexAuth = {
    token: null,
     apiBaseUrl: 'https://api.flexgrupo.com.br', 

    init: function() {
        this.token = localStorage.getItem('flex-token');
             const isLoginPage = window.location.pathname.includes('login.html');
        
        if (!this.token && !isLoginPage) {
            console.warn("Sem token, redirecionando para login...");
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

        const safeEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        const url = `${this.apiBaseUrl}${safeEndpoint}`;

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