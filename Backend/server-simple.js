// server-simple.js - Backend simplificado sem banco de dados
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('../frontend'));

// Arquivo para salvar os dados
const dataFile = path.join(__dirname, 'propostas.json');

// Função para ler propostas do arquivo
function readPropostas() {
  try {
    if (fs.existsSync(dataFile)) {
      const data = fs.readFileSync(dataFile, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Erro ao ler arquivo:', error);
  }
  return [];
}

// Função para salvar propostas no arquivo
function savePropostas(propostas) {
  try {
    fs.writeFileSync(dataFile, JSON.stringify(propostas, null, 2));
    return true;
  } catch (error) {
    console.error('Erro ao salvar arquivo:', error);
    return false;
  }
}

// Rota para receber propostas
app.post('/api/propostas', (req, res) => {
  try {
    const proposta = req.body;
    console.log('Recebendo proposta:', proposta);
    
    // Validar campos obrigatórios
    const required = ['nome', 'cpfCnpj', 'endereco', 'numeroInstalacao', 'contato', 'tipoPadrao', 'geracaoPropria'];
    const missing = required.filter(field => !proposta[field]);
    
    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Campos obrigatórios faltando: ${missing.join(', ')}`
      });
    }
    
    // Ler propostas existentes
    const propostas = readPropostas();
    
    // Adicionar nova proposta
    const novaProposta = {
      id: propostas.length + 1,
      ...proposta,
      dataCriacao: new Date().toISOString()
    };
    
    propostas.push(novaProposta);
    
    // Salvar no arquivo
    const saved = savePropostas(propostas);
    
    if (saved) {
      res.json({
        success: true,
        message: 'Proposta salva com sucesso!',
        id: novaProposta.id
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Erro ao salvar proposta no arquivo'
      });
    }
  } catch (error) {
    console.error('Erro na rota /api/propostas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Rota para listar propostas
app.get('/api/propostas', (req, res) => {
  try {
    const propostas = readPropostas();
    res.json({
      success: true,
      data: propostas
    });
  } catch (error) {
    console.error('Erro ao listar propostas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar propostas'
    });
  }
});

// Rota de saúde do servidor
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Servidor está funcionando!',
    timestamp: new Date().toISOString(),
    dataFile: dataFile
  });
});

// Rota para servir o frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor simplificado rodando na porta ${PORT}`);
  console.log(`📊 Acesse: http://localhost:${PORT}`);
  console.log(`💾 Dados salvos em: ${dataFile}`);
  console.log(`✅ API Health: http://localhost:${PORT}/api/health`);
});