/**
 * Servidor Local da Academia
 * Expõe API REST para sincronização de dados entre desktop e dispositivos móveis
 * 
 * Para executar: node server/gym-server.js
 * Ou: npm run server (se configurado no package.json)
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0'; // Aceitar conexões de qualquer IP na rede local

// Middleware
app.use(cors());
app.use(express.json());

// Caminho para o banco de dados IndexedDB (convertido para JSON)
// Em produção, você pode usar uma biblioteca como Dexie.js para ler IndexedDB
const DB_PATH = path.join(__dirname, '../data/gym-db.json');

/**
 * Carrega o banco de dados do arquivo JSON
 */
async function loadDatabase() {
    try {
        const data = await fs.readFile(DB_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        // Se o arquivo não existir, criar estrutura vazia
        return {
            users: [],
            lastUpdated: new Date().toISOString()
        };
    }
}

/**
 * Salva o banco de dados no arquivo JSON
 */
async function saveDatabase(db) {
    try {
        await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
        db.lastUpdated = new Date().toISOString();
        await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
        return true;
    } catch (error) {
        console.error('Erro ao salvar banco de dados:', error);
        return false;
    }
}

/**
 * Encontra um usuário no banco de dados
 */
async function findUser(username) {
    const db = await loadDatabase();
    return db.users.find(u => u.username === username);
}

/**
 * Atualiza um usuário no banco de dados
 */
async function updateUserInDB(username, updates) {
    const db = await loadDatabase();
    const userIndex = db.users.findIndex(u => u.username === username);
    
    if (userIndex === -1) {
        return null;
    }
    
    db.users[userIndex] = {
        ...db.users[userIndex],
        ...updates,
        updatedAt: new Date().toISOString()
    };
    
    await saveDatabase(db);
    return db.users[userIndex];
}

// ==================== ROTAS ====================

/**
 * Health check
 */
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        server: 'FitCoach.IA Gym Server'
    });
});

/**
 * Obter status de bloqueio de um aluno
 * GET /api/students/:username/status
 */
app.get('/api/students/:username/status', async (req, res) => {
    try {
        const { username } = req.params;
        const user = await findUser(username);
        
        if (!user) {
            return res.status(404).json({
                error: 'Aluno não encontrado'
            });
        }
        
        res.json({
            accessBlocked: user.accessBlocked || false,
            blockedAt: user.blockedAt,
            blockedBy: user.blockedBy,
            blockedReason: user.blockedReason,
        });
    } catch (error) {
        console.error('Erro ao obter status:', error);
        res.status(500).json({
            error: 'Erro interno do servidor'
        });
    }
});

/**
 * Obter dados completos de um aluno
 * GET /api/students/:username
 */
app.get('/api/students/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const user = await findUser(username);
        
        if (!user) {
            return res.status(404).json({
                error: 'Aluno não encontrado'
            });
        }
        
        // Remover dados sensíveis antes de enviar
        const { password, ...safeUser } = user;
        res.json(safeUser);
    } catch (error) {
        console.error('Erro ao obter aluno:', error);
        res.status(500).json({
            error: 'Erro interno do servidor'
        });
    }
});

/**
 * Listar todos os alunos bloqueados
 * GET /api/students/blocked
 */
app.get('/api/students/blocked', async (req, res) => {
    try {
        const db = await loadDatabase();
        const blockedStudents = db.users
            .filter(u => u.gymRole === 'student' && u.accessBlocked === true)
            .map(({ password, ...user }) => user); // Remover senhas
        
        res.json({
            count: blockedStudents.length,
            students: blockedStudents
        });
    } catch (error) {
        console.error('Erro ao listar alunos bloqueados:', error);
        res.status(500).json({
            error: 'Erro interno do servidor'
        });
    }
});

/**
 * Obter informações do servidor
 * GET /api/info
 */
app.get('/api/info', (req, res) => {
    const networkInterfaces = require('os').networkInterfaces();
    const addresses = [];
    
    for (const name of Object.keys(networkInterfaces)) {
        for (const iface of networkInterfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                addresses.push(iface.address);
            }
        }
    }
    
    res.json({
        server: 'FitCoach.IA Gym Server',
        version: '1.0.0',
        port: PORT,
        localAddresses: addresses,
        accessUrl: addresses.length > 0 
            ? `http://${addresses[0]}:${PORT}`
            : `http://localhost:${PORT}`,
        timestamp: new Date().toISOString()
    });
});

// ==================== INICIALIZAÇÃO ====================

app.listen(PORT, HOST, () => {
    console.log('='.repeat(60));
    console.log('🏋️  FitCoach.IA - Servidor da Academia');
    console.log('='.repeat(60));
    console.log(`📡 Servidor rodando em: http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
    console.log(`🌐 Acessível na rede local`);
    console.log('');
    console.log('Endpoints disponíveis:');
    console.log(`  GET  /api/health - Health check`);
    console.log(`  GET  /api/info - Informações do servidor`);
    console.log(`  GET  /api/students/:username/status - Status de bloqueio`);
    console.log(`  GET  /api/students/:username - Dados do aluno`);
    console.log(`  GET  /api/students/blocked - Lista de alunos bloqueados`);
    console.log('');
    console.log('Para conectar dispositivos móveis, use:');
    const networkInterfaces = require('os').networkInterfaces();
    for (const name of Object.keys(networkInterfaces)) {
        for (const iface of networkInterfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                console.log(`  http://${iface.address}:${PORT}`);
            }
        }
    }
    console.log('='.repeat(60));
});

// Tratamento de erros
process.on('uncaughtException', (error) => {
    console.error('Erro não capturado:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Promise rejeitada não tratada:', reason);
});

