require('dotenv').config();
const { Pool } = require('pg');

// --- DEBUG: Verificando se as variáveis estão carregando ---
console.log("--- CONFIGURAÇÃO DO BANCO ---");
if (process.env.DATABASE_URL) {
    console.log("Modo: DATABASE_URL encontrada.");
} else {
    console.log("Modo: Variáveis individuais (Host/User/Pass).");
    console.log("Host:", process.env.DB_HOST);
    console.log("Database:", process.env.DB_NAME);
}
console.log("-------------------------------");

// Configuração Híbrida: Aceita URL completa OU variáveis separadas
const poolConfig = process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false } // Necessário para RDS/Render
      }
    : {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 5432,
        ssl: { rejectUnauthorized: false } // Necessário para RDS
      };

const pool = new Pool(poolConfig);

// Teste de conexão imediato ao iniciar
pool.connect((err, client, release) => {
    if (err) {
        return console.error('❌ CRÍTICO: Não foi possível conectar ao banco:', err.message);
    }
    client.query('SELECT NOW()', (err, result) => {
        release();
        if (err) {
            return console.error('❌ Erro ao executar query de teste:', err.message);
        }
        console.log('✅ CONECTADO AO BANCO COM SUCESSO! Hora do servidor:', result.rows[0].now);
    });
});

async function initDb() {
    const usuariosTable = `
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nome TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        senha TEXT NOT NULL,
        cargo TEXT DEFAULT 'Vendedor',
        data_criacao TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const propostasTable = `
      CREATE TABLE IF NOT EXISTS propostas (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER REFERENCES usuarios(id),
        nome TEXT NOT NULL,
        cpf_cnpj TEXT NOT NULL,
        endereco TEXT NOT NULL,
        numero_instalacao TEXT NOT NULL,
        contato TEXT NOT NULL,
        email TEXT,
        tipo_consumo TEXT NOT NULL,
        janeiro REAL, fevereiro REAL, marco REAL, abril REAL, maio REAL, junho REAL,
        julho REAL, agosto REAL, setembro REAL, outubro REAL, novembro REAL, dezembro REAL,
        media_consumo REAL,
        tipo_padrao TEXT NOT NULL,
        geracao_propria TEXT NOT NULL,
        media_injecao REAL,
        desconto REAL DEFAULT 0,
        tipo_tensao TEXT NOT NULL,
        classe TEXT NOT NULL,
        valor_kwh REAL DEFAULT 1.19,
        economia_media REAL DEFAULT 0,
        economia_anual REAL DEFAULT 0,
        valor_pago_flex_media REAL DEFAULT 0,
        valor_pago_flex_anual REAL DEFAULT 0,
        valor_pago_cemig_media REAL DEFAULT 0,
        valor_pago_cemig_anual REAL DEFAULT 0,
        data_criacao TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `;

    try {
        const client = await pool.connect();
        await client.query(usuariosTable);
        await client.query(propostasTable);
        client.release();
        console.log('✅ Tabelas verificadas/criadas com sucesso.');
    } catch (error) {
        console.error('❌ Erro ao inicializar tabelas:', error);
        // Não damos exit(1) aqui para não derrubar o servidor em caso de erro temporário de rede,
        // mas em produção, talvez você queira manter o process.exit(1).
    }
}


async function inserirProposta(proposta, usuarioId) {
    // 1. Cálculos de apoio (Valores padrão caso venham vazios)
    const tarifa = parseFloat(proposta.tarifa || proposta.valorKwh || 1.19);
    const consumo = parseFloat(proposta.mediaConsumo || 0);
    const descontoPercentual = parseFloat(proposta.desconto || 0) / 100;
    const custoIluminacao = 20;

    // 2. Lógica de economia (Mantendo a consistência com o front)
    const economiaMedia = consumo * tarifa * descontoPercentual;
    const valorPagoCemigMedia = (consumo * tarifa) + custoIluminacao;
    const valorPagoFlexMedia = valorPagoCemigMedia - economiaMedia;

    const sql = `
      INSERT INTO propostas (
        usuario_id, nome, cpf_cnpj, endereco, numero_instalacao, contato, email, tipo_consumo,
        janeiro, fevereiro, marco, abril, maio, junho, julho, agosto, setembro, outubro, novembro, dezembro,
        media_consumo, tipo_padrao, geracao_propria, media_injecao, desconto,
        tipo_tensao, valor_kwh, economia_media, economia_anual,
        valor_pago_flex_media, valor_pago_flex_anual, valor_pago_cemig_media, valor_pago_cemig_anual, classe
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, 
        $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, 
        $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34
      ) RETURNING id`;
    
    // Consolidação do endereço para o banco
    const enderecoCompleto = `${proposta.logradouro || proposta.rua || ''}, ${proposta.numero || ''} ${proposta.complemento || ''}, ${proposta.bairro || ''}, ${proposta.cidade || ''} - ${proposta.uf || proposta.estado || ''}`;

    const values = [
      usuarioId,
      proposta.nome,
      proposta.cpfCnpj || proposta.cnpj || proposta.cpf,
      enderecoCompleto,
      proposta.uc || proposta.numeroInstalacao,
      proposta.telefone || proposta.contato,
      proposta.email,
      proposta.tipoConsumo || 'media',
      // Meses
      parseFloat(proposta.janeiro || 0), parseFloat(proposta.fevereiro || 0), parseFloat(proposta.marco || 0),
      parseFloat(proposta.abril || 0), parseFloat(proposta.maio || 0), parseFloat(proposta.junho || 0),
      parseFloat(proposta.julho || 0), parseFloat(proposta.agosto || 0), parseFloat(proposta.setembro || 0),
      parseFloat(proposta.outubro || 0), parseFloat(proposta.novembro || 0), parseFloat(proposta.dezembro || 0),
      consumo,
      proposta.fase || proposta.tipoPadrao || 'Trifásico',
      proposta.geracaoPropria || 'nao',
      parseFloat(proposta.mediaInjecao || 0),
      parseFloat(proposta.desconto || 0),
      proposta.tipoTensao || 'Baixa Tensao',
      tarifa,
      // Resultados Calculados
      economiaMedia,
      economiaMedia * 12,
      valorPagoFlexMedia,
      valorPagoFlexMedia * 12,
      valorPagoCemigMedia,
      valorPagoCemigMedia * 12,
      proposta.categoria || proposta.classe || 'Comercial'
    ];

    try {
        const result = await pool.query(sql, values);
        return { success: true, id: result.rows[0].id };
    } catch (error) {
        console.error('❌ Erro no banco:', error.message);
        return { success: false, error: error.message };
    }
}

async function listarPropostas(usuarioId, isAdmin) {
    try {
        let query = 'SELECT * FROM propostas';
        let values = [];

        if (!isAdmin) {
            query += ' WHERE usuario_id = $1';
            values.push(usuarioId);
        }

        query += ' ORDER BY data_criacao DESC';

        const result = await pool.query(query, values);
        return { success: true, data: result.rows };
    } catch (error) {
        console.error('Erro ao listar propostas:', error);
        return { success: false, error: error.message, data: [] };
    }
}

async function registrarUsuario(nome, email, hash, cargo) {
    const sql = 'INSERT INTO usuarios (nome, email, senha, cargo) VALUES ($1, $2, $3, $4) RETURNING id';
    const result = await pool.query(sql, [nome, email, hash, cargo || 'Vendedor']);
    return result.rows[0];
}

async function buscarUsuarioPorEmail(email) {
    const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    return result.rows[0];
}

async function buscarPropostaPorInstalacao(numeroInstalacao) {
    const result = await pool.query('SELECT * FROM propostas WHERE numero_instalacao = $1', [numeroInstalacao]);
    return result.rows[0]; 
}

async function getEstatisticas() {
    try {
        const totalQuery = pool.query('SELECT COUNT(*) as total FROM propostas');
        const tipoQuery = pool.query('SELECT tipo_padrao, COUNT(*) as count FROM propostas GROUP BY tipo_padrao');
        
        const [totalRes, tipoRes] = await Promise.all([totalQuery, tipoQuery]);

        return {
            totalPropostas: totalRes.rows[0].total,
            porTipoPadrao: tipoRes.rows.reduce((acc, row) => ({...acc, [row.tipo_padrao]: row.count}), {})
        };
    } catch (error) {
        console.error("Erro ao obter estatisticas", error);
        return { totalPropostas: 0, porTipoPadrao: {} };
    }
}

async function getHealthCheckData() {
    try {
        const result = await pool.query('SELECT COUNT(*) as total FROM propostas');
        return { totalPropostas: result.rows[0].total };
    } catch (error) {
        return { totalPropostas: 'Erro DB' };
    }
}

module.exports = {
    initDb,
    inserirProposta,
    listarPropostas,
    registrarUsuario,
    buscarUsuarioPorEmail,
    buscarPropostaPorInstalacao,
    getEstatisticas,
    getHealthCheckData
};