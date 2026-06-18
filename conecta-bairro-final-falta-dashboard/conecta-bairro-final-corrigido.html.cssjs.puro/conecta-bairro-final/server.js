const express = require('express');
const session = require('express-session');
const app = express();
const port = 3000;
const path = require('path');

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Sessão de login (precisa vir ANTES das rotas que usam req.session)
app.use(session({
    secret: 'conecta-bairro-secret', // suficiente para projeto universitário
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 // 1 dia
    }
}));

// Banco de dados
const db = require('./db');

// Rotas públicas (site)
const apiRoutes = require('./routes/api');
app.use('/api/providers', apiRoutes);

// /api/categories deve listar as CATEGORIAS.
// (Não montar apiRoutes aqui: a rota '/' dele lista prestadores, o que fazia
//  /api/categories devolver prestadores em vez de categorias.)
app.get('/api/categories', (req, res) => {
    db.query('SELECT * FROM categories ORDER BY name', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Rotas de autenticação e área logada
app.use('/auth', require('./routes/auth'));
app.use('/api/client', require('./routes/client'));
app.use('/api/provider', require('./routes/provider'));
app.use('/api/history', require('./routes/history'));

// Rota principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar servidor
app.listen(port, () => {
    console.log(`\n✓ Conecta-Bairro rodando em http://localhost:${port}`);
    console.log('✓ Banco de dados conectado');
    console.log('✓ Pressione Ctrl+C para parar\n');
});
