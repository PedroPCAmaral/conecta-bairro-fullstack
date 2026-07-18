const express = require('express');
const session = require('express-session');
const cors = require('cors'); 
const path = require('path');
const app = express();
const DEFAULT_PORT = 3000;
const requestedPort = parseInt(process.env.PORT, 10) || DEFAULT_PORT;
// Garante que o limite de portas acompanhe dinamicamente a porta exigida pelo Render
const MAX_PORT = requestedPort + 10;

// Importar conexão do banco de dados (que está exportando o pool multi-formato)
const db = require('./db');

// =========================================================================
// 🛡️ CORREÇÃO CRÍTICA: Proteção contra o erro de Transação (beginTransaction)
// =========================================================================
if (db && !db.beginTransaction) {
    db.beginTransaction = function(callback) {
        if (typeof callback === 'function') {
            return db.query('START TRANSACTION', callback);
        }
        return new Promise((resolve, reject) => {
            db.query('START TRANSACTION').then(() => resolve()).catch(reject);
        });
    };
    
    db.commit = function(callback) {
        if (typeof callback === 'function') return db.query('COMMIT', callback);
        return new Promise((resolve, reject) => {
            db.query('COMMIT').then(() => resolve()).catch(reject);
        });
    };

    db.rollback = function(callback) {
        if (typeof callback === 'function') return db.query('ROLLBACK', callback);
        return new Promise((resolve, reject) => {
            db.query('ROLLBACK').then(() => resolve()).catch(reject);
        });
    };
}
// =========================================================================

// Middlewares Globais
app.use(express.json());
app.use(express.urlencoded({ extended: true })); 
app.use(express.static(path.join(__dirname, 'public')));

// Configuração da Sessão (ANTES DO CORS)
app.set('trust proxy', 1);
app.use(session({
    secret: 'conecta-bairro-secret', 
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: false, 
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24 
    }
}));

// CORS com suporte a credenciais (DEPOIS da sessão)
app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'Cookie']
}));

// --- CENTRALIZAÇÃO ABSOLUTA DAS ROTAS DA API ---

// 1. ROTA DE REVIEWS (Aceita qualquer formato vindo do front)
app.get([
    '/api/providers/:id/reviews', 
    '/api/providers::id/reviews',
    '*/providers:id/reviews',
    '*/providers/:id/reviews'
], async (req, res) => {
    let providerId = req.params.id || req.params['0'];
    if (providerId && typeof providerId === 'string') {
        providerId = providerId.replace(/[^0-9]/g, ''); // Deixa APENAS números
    }

    const queryStr = `
        SELECT 
            r.id, r.rating, r.comment, r.createdAt AS created_at,
            IFNULL(u.name, 'Cliente Conecta') AS clientName
        FROM reviews r
        LEFT JOIN users u ON (r.user_id = u.id OR r.client_id = u.id)
        WHERE r.provider_id = ?
        ORDER BY r.createdAt DESC
    `;

    // Emergency mock (apenas quando FORCE_MOCK_REVIEWS=1):
    if (process.env.FORCE_MOCK_REVIEWS === '1') {
        const now = new Date().toISOString();
        return res.json({
            average: 5,
            total: 1,
            reviews: [{ id: 1, rating: 5, comment: 'Avaliação de teste (mock)', clientName: 'Cliente Teste', created_at: now }]
        });
    }

    try {
        const [reviews] = await db.query(queryStr, [providerId]);

        const statSql = 'SELECT AVG(rating) AS average, COUNT(*) AS total FROM reviews WHERE provider_id = ?';
        const [stats] = await db.query(statSql, [providerId]);

        res.json({
            average: stats && stats[0] && stats[0].average ? Number(stats[0].average) : 0,
            total: stats && stats[0] ? stats[0].total : 0,
            reviews
        });
    } catch (err) {
        console.error('Erro ao buscar reviews:', err.message);
        res.status(500).json({ average: 0, total: 0, reviews: [] });
    }
});

// 2. ROTA DE UM PRESTADOR ESPECÍFICO (Totalmente aberta e limpando strings do front)
app.get([
    '/api/providers/:id', 
    '/api/providers::id',
    '*/providers:id',
    '*/providers/:id',
    '/providers/:id'
], async (req, res) => {
    let providerId = req.params.id || req.params['0'];
    
    if (providerId && typeof providerId === 'string') {
        providerId = providerId.replace(/[^0-9]/g, ''); 
    }

    if (!providerId) {
        return res.status(400).json({ error: 'ID inválido' });
    }

    try {
        const [results] = await db.query('SELECT * FROM providers WHERE id = ?', [providerId]);
        if (!results || results.length === 0) {
            return res.status(404).json({ error: 'Prestador não encontrado' });
        }
        res.json(results[0]);
    } catch (err) {
        console.error('Erro ao buscar prestador específico:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// 3. LISTA GERAL DE FORNECEDORES E FILTROS
app.get(['/api/providers', 'api/providers'], async (req, res) => {
    try {
        const { category, search } = req.query;
        let queryStr = 'SELECT * FROM providers WHERE 1=1';
        let queryParams = [];

        if (category && category !== 'Todos' && category !== 'Todas as categorias' && category !== '') {
            queryStr += ' AND category = ?';
            queryParams.push(category);
        }

        if (search && search.trim() !== '') {
            queryStr += ' AND (name LIKE ? OR description LIKE ?)';
            const searchVal = `%${search}%`;
            queryParams.push(searchVal, searchVal);
        }

        queryStr += ' ORDER BY name ASC';

        const [results] = await db.query(queryStr, queryParams);
        res.json(results);
    } catch (err) {
        console.error('Erro ao listar fornecedores:', err.message);
        res.status(500).json([]);
    }
});

// 4. LISTA DE CATEGORIAS
app.get(['/api/categories', 'api/categories'], async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM categories ORDER BY name');
        res.json(results);
    } catch (err) {
        console.error('Erro ao buscar categorias:', err.message);
        res.status(500).json([]);
    }
});

// 5. REDES SOCIAIS DO PRESTADOR
app.get([
    '/api/providers/:id/social',
    'api/providers/:id/social',
    '*/providers/:id/social',
    '*/providers/:id/social'
], async (req, res) => {
    let providerId = req.params.id || req.params['0'];
    if (providerId && typeof providerId === 'string') {
        providerId = providerId.replace(/[^0-9]/g, '');
    }
    if (!providerId) {
        return res.status(400).json({ error: 'ID inválido' });
    }

    try {
        const [results] = await db.query(
            'SELECT platform, url FROM social_links WHERE provider_id = ?',
            [providerId]
        );
        res.json(results);
    } catch (err) {
        console.error('Erro ao buscar redes sociais:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// --- ROTEADORES SECUNDÁRIOS ---
app.use('/auth', require('./routes/auth'));
app.use('/api/client', require('./routes/client'));
app.use('/api/provider', require('./routes/provider'));
app.use('/api/history', require('./routes/history'));

// Rota de depuração para inserir reviews rapidamente (SÓ em desenvolvimento)
if (process.env.NODE_ENV !== 'production' && process.env.ALLOW_DEBUG_ROUTES === '1') {
    app.post('/api/debug/reviews', express.json(), async (req, res) => {
        const { provider_id, client_id, rating, comment } = req.body;
        if (!provider_id || !client_id || !rating) return res.status(400).json({ error: 'provider_id, client_id e rating obrigatórios' });
        if (rating < 1 || rating > 5) return res.status(400).json({ error: 'rating deve ser entre 1 e 5' });
        try {
            const [result] = await db.query('INSERT INTO reviews (provider_id, client_id, rating, comment) VALUES (?, ?, ?, ?)', [provider_id, client_id, rating, comment || null]);
            console.log(`DEBUG: review inserida id=${result.insertId} provider=${provider_id} client=${client_id} rating=${rating}`);
            res.status(201).json({ id: result.insertId, message: 'Review inserida (debug)' });
        } catch (e) {
            console.error('Erro debug insert review:', e.message || e);
            res.status(500).json({ error: e.message });
        }
    });
}

// --- ROTA FRONTEND SPA (Sempre por último!) ---
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar servidor com fallback de porta
function tryListen(portToTry) {
    return new Promise((resolve, reject) => {
        const server = app.listen(portToTry, () => resolve({ server, port: portToTry }));
        server.on('error', reject);
    });
}

(async () => {
    for (let p = requestedPort; p <= MAX_PORT; p++) {
        try {
            const { port: activePort } = await tryListen(p);
            console.log(`\n✓ Conecta-Bairro rodando em http://localhost:${activePort}`);
            console.log('✓ Servidor inicializado com sucesso');
            console.log('✓ Pressione Ctrl+C para parar o processo\n');
            return;
        } catch (err) {
            if (err.code === 'EADDRINUSE') {
                console.warn(`Porta ${p} ocupada, tentando próxima...`);
                continue;
            }
            console.error(err);
            process.exit(1);
        }
    }
    console.error(`Não foi possível iniciar: portas ${requestedPort}-${MAX_PORT} estão ocupadas.`);
    process.exit(1);
})();
