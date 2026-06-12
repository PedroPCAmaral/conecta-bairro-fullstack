const express = require('express');
const app = express();
const port = 3000;
const path = require('path');

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Banco de dados
const db = require('./db');

// Rotas
const apiRoutes = require('./routes/api');
app.use('/api/providers', apiRoutes);
app.use('/api/categories', apiRoutes);

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
