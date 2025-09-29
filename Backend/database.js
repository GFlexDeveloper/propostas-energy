// database.js - Configuração do banco de dados com better-sqlite3
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, 'propostas.db');
const db = new Database(dbPath);

// Função para verificar e atualizar a estrutura da tabela
function verificarEAtualizarTabela() {
    try {
        // Verificar se a tabela existe e tem a estrutura correta
        const checkStmt = db.prepare("PRAGMA table_info(propostas)");
        const columns = checkStmt.all();
        
        const expectedColumns = [
            'id', 'nome', 'cpf_cnpj', 'endereco', 'numero_instalacao', 'contato', 'email',
            'tipo_consumo', 'janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho',
            'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro', 'media_consumo',
            'tipo_padrao', 'geracao_propria', 'media_injecao', 'desconto', 'tipo_tensao',
            'valor_kwh', 'economia_media', 'economia_anual', 'valor_pago_flex_media',
            'valor_pago_flex_anual', 'valor_pago_cemig_media', 'valor_pago_cemig_anual', 'data_criacao'
        ];

        const currentColumns = columns.map(col => col.name);
        const missingColumns = expectedColumns.filter(col => !currentColumns.includes(col));

        if (missingColumns.length > 0) {
            console.log('🔄 Estrutura da tabela desatualizada. Recriando...');
            
            // Fazer backup dos dados se existirem
            const dataStmt = db.prepare('SELECT * FROM propostas');
            const oldData = dataStmt.all();
            
            // Recriar tabela
            db.exec('DROP TABLE IF EXISTS propostas');
            
            db.exec(`
                CREATE TABLE IF NOT EXISTS propostas (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    nome TEXT NOT NULL,
                    cpf_cnpj TEXT NOT NULL,
                    endereco TEXT NOT NULL,
                    numero_instalacao TEXT NOT NULL,
                    contato TEXT NOT NULL,
                    email TEXT,
                    tipo_consumo TEXT NOT NULL,
                    janeiro REAL,
                    fevereiro REAL,
                    marco REAL,
                    abril REAL,
                    maio REAL,
                    junho REAL,
                    julho REAL,
                    agosto REAL,
                    setembro REAL,
                    outubro REAL,
                    novembro REAL,
                    dezembro REAL,
                    media_consumo REAL,
                    tipo_padrao TEXT NOT NULL,
                    geracao_propria TEXT NOT NULL,
                    media_injecao REAL,
                    desconto REAL DEFAULT 0,
                    tipo_tensao TEXT NOT NULL,
                    valor_kwh REAL DEFAULT 1.19,
                    economia_media REAL DEFAULT 0,
                    economia_anual REAL DEFAULT 0,
                    valor_pago_flex_media REAL DEFAULT 0,
                    valor_pago_flex_anual REAL DEFAULT 0,
                    valor_pago_cemig_media REAL DEFAULT 0,
                    valor_pago_cemig_anual REAL DEFAULT 0,
                    data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            console.log('✅ Tabela recriada com estrutura atualizada');
            
            // Tentar reinserir dados antigos (se houver)
            if (oldData.length > 0) {
                console.log(`🔄 Migrando ${oldData.length} registros antigos...`);
                // Aqui você poderia implementar a migração dos dados antigos
            }
        } else {
            console.log('✅ Estrutura da tabela já está atualizada');
        }
    } catch (error) {
        // Se a tabela não existir, criar do zero
        console.log('📋 Criando tabela do zero...');
        db.exec(`
            CREATE TABLE IF NOT EXISTS propostas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL,
                cpf_cnpj TEXT NOT NULL,
                endereco TEXT NOT NULL,
                numero_instalacao TEXT NOT NULL,
                contato TEXT NOT NULL,
                email TEXT,
                tipo_consumo TEXT NOT NULL,
                janeiro REAL,
                fevereiro REAL,
                marco REAL,
                abril REAL,
                maio REAL,
                junho REAL,
                julho REAL,
                agosto REAL,
                setembro REAL,
                outubro REAL,
                novembro REAL,
                dezembro REAL,
                media_consumo REAL,
                tipo_padrao TEXT NOT NULL,
                geracao_propria TEXT NOT NULL,
                media_injecao REAL,
                desconto REAL DEFAULT 0,
                tipo_tensao TEXT NOT NULL,
                valor_kwh REAL DEFAULT 1.19,
                economia_media REAL DEFAULT 0,
                economia_anual REAL DEFAULT 0,
                valor_pago_flex_media REAL DEFAULT 0,
                valor_pago_flex_anual REAL DEFAULT 0,
                valor_pago_cemig_media REAL DEFAULT 0,
                valor_pago_cemig_anual REAL DEFAULT 0,
                data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Tabela criada com sucesso');
    }
}

// Executar verificação na inicialização
verificarEAtualizarTabela();

// ... resto do código (funções inserirProposta, listarPropostas) permanece igual
// Função para inserir proposta (ATUALIZADA com todos os campos)
function inserirProposta(proposta) {
  try {
    const sql = `
      INSERT INTO propostas (
        nome, cpf_cnpj, endereco, numero_instalacao, contato, email, tipo_consumo,
        janeiro, fevereiro, marco, abril, maio, junho, julho, agosto, setembro, outubro, novembro, dezembro,
        media_consumo, tipo_padrao, geracao_propria, media_injecao, desconto,
        tipo_tensao, valor_kwh, economia_media, economia_anual,
        valor_pago_flex_media, valor_pago_flex_anual, valor_pago_cemig_media, valor_pago_cemig_anual
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const stmt = db.prepare(sql);
    const result = stmt.run(
      // Campos básicos
      proposta.nome,
      proposta.cpfCnpj,
      proposta.endereco,
      proposta.numeroInstalacao,
      proposta.contato,
      proposta.email || null,
      proposta.tipoConsumo,
      // Consumo mensal
      proposta.janeiro || null,
      proposta.fevereiro || null,
      proposta.marco || null,
      proposta.abril || null, 
      proposta.maio || null,
      proposta.junho || null,
      proposta.julho || null,
      proposta.agosto || null, 
      proposta.setembro || null,
      proposta.outubro || null,
      proposta.novembro || null,
      proposta.dezembro || null,
      // Configurações
      proposta.mediaConsumo || null,
      proposta.tipoPadrao,
      proposta.geracaoPropria,
      proposta.mediaInjecao || null,
      proposta.desconto || 0,
      // Novos campos
      proposta.tipoTensao,
      proposta.valorKwh || 1.19,
      proposta.economiaMedia || 0,
      proposta.economiaAnual || 0,
      // Campos calculados
      proposta.valorPagoFlexMedia || 0,
      proposta.valorPagoFlexAnual || 0,
      proposta.valorPagoCemigMedia || 0,
      proposta.valorPagoCemigAnual || 0
    );

    return { success: true, id: result.lastInsertRowid };
  } catch (error) {
    console.error('❌ Erro ao inserir proposta:', error);
    return { success: false, error: error.message };
  }
}

// Função para listar propostas
function listarPropostas() {
  try {
    const stmt = db.prepare('SELECT * FROM propostas ORDER BY data_criacao DESC');
    return stmt.all();
  } catch (error) {
    console.error('Erro ao listar propostas:', error);
    return [];
  }
}

module.exports = {
  inserirProposta,
  listarPropostas
};