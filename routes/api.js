const express = require('express');
const router = express.Router();
const db = require('../db');

// ============================================
// CATEGORIAS
// ============================================

// GET - Listar todas as categorias
router.get('/categories', (req, res) => {
    const sql = 'SELECT * FROM categories';
    db.query(sql, (err, results) => {
        if(err) return res.status(500).json({error: err.message});
        res.json(results);
    });
});

// ============================================
// PRESTADORES
// ============================================

// GET - Listar todos os prestadores
router.get('/', (req, res) => {
    // CORREÇÃO: Usa COALESCE para testar se a coluna no banco se chama 'title' ou 'name' e preencher o front-end corretamente
    const sql = `
        SELECT p.*, 
               COALESCE(c.title, c.name) AS categoryName, 
               COALESCE(c.title, c.name) AS category_name 
        FROM providers p 
        LEFT JOIN categories c ON p.categoryId = c.id 
        WHERE p.isActive = 1
    `;
    db.query(sql, (err, results) => {
        if(err) return res.status(500).json({error: err.message});
        res.json(results);
    });
});

// GET - Buscar prestador por ID
router.get('/:id', (req, res) => {
    const sql = `
        SELECT p.*, 
               COALESCE(c.title, c.name) AS categoryName, 
               COALESCE(c.title, c.name) AS category_name 
        FROM providers p 
        LEFT JOIN categories c ON p.categoryId = c.id 
        WHERE p.id = ?
    `;
    db.query(sql, [req.params.id], (err, results) => {
        if(err) return res.status(500).json({error: err.message});
        if(results.length === 0) return res.status(404).json({error: 'Prestador não encontrado'});
        res.json(results[0]);
    });
});

// GET - Redes sociais de um prestador (público, para a página de detalhe)
router.get('/:id/social', (req, res) => {
    const sql = 'SELECT platform, url FROM social_links WHERE provider_id = ?';
    db.query(sql, [req.params.id], (err, results) => {
        if(err) return res.status(500).json({error: err.message});
        res.json(results);
    });
});

// GET - Avaliações + média de um prestador (público, para a página de detalhe)
router.get('/:id/reviews', async (req, res) => {
    const providerId = req.params.id;
    const listSql = `SELECT r.id, r.rating, r.comment, r.createdAt AS created_at, u.name AS clientName
                     FROM reviews r
                     LEFT JOIN users u ON r.client_id = u.id
                     WHERE r.provider_id = ?
                     ORDER BY r.createdAt DESC`;
    const statSql = 'SELECT AVG(rating) AS average, COUNT(*) AS total FROM reviews WHERE provider_id = ?';

    try {
        const promiseDb = db.promise();
        const [reviews] = await promiseDb.query(listSql, [providerId]);
        const [stats] = await promiseDb.query(statSql, [providerId]);

        const norm = (reviews || []).map(r => ({
            id: r.id,
            rating: Number(r.rating || 0),
            comment: r.comment || '',
            clientName: r.clientName || r.client_name || 'Cliente Conecta',
            created_at: r.created_at || r.createdAt || null
        }));

        res.json({
            average: stats && stats[0] && stats[0].average ? Number(stats[0].average) : 0,
            total: stats && stats[0] ? stats[0].total : (norm.length || 0),
            reviews: norm
        });
    } catch (err) {
        console.error(`Erro em GET /api/providers/${providerId}/reviews:`, err);
        if (process.env.NODE_ENV === 'production') {
            res.status(500).json({ error: 'Erro ao buscar avaliações' });
        } else {
            res.status(500).json({ error: err.message, stack: err.stack });
        }
    }
});

// GET - Filtrar por categoria
router.get('/category/:categoryId', (req, res) => {
    const sql = `
        SELECT p.*, 
               COALESCE(c.title, c.name) AS categoryName, 
               COALESCE(c.title, c.name) AS category_name 
        FROM providers p 
        LEFT JOIN categories c ON p.categoryId = c.id 
        WHERE p.categoryId = ? AND p.isActive = 1
    `;
    db.query(sql, [req.params.categoryId], (err, results) => {
        if(err) return res.status(500).json({error: err.message});
        res.json(results);
    });
});

// GET - Buscar por nome
router.get('/search/:query', (req, res) => {
    const query = `%${req.params.query}%`;
    const sql = `
        SELECT p.*, 
               COALESCE(c.title, c.name) AS categoryName, 
               COALESCE(c.title, c.name) AS category_name 
        FROM providers p 
        LEFT JOIN categories c ON p.categoryId = c.id 
        WHERE (p.name LIKE ? OR p.description LIKE ?) AND p.isActive = 1
    `;
    db.query(sql, [query, query], (err, results) => {
        if(err) return res.status(500).json({error: err.message});
        res.json(results);
    });
});

// POST - Criar novo prestador
router.post('/', (req, res) => {
    const {name, categoryId, description, phone, email, address, neighborhood} = req.body;
    
    if(!name || !categoryId) {
        return res.status(400).json({error: 'Nome e categoria são obrigatórios'});
    }
    
    const sql = 'INSERT INTO providers (name, categoryId, description, phone, email, address, neighborhood, isActive) VALUES (?, ?, ?, ?, ?, ?, ?, 1)';
    db.query(sql, [name, categoryId, description, phone, email, address, neighborhood], (err, results) => {
        if(err) return res.status(500).json({error: err.message});
        res.status(201).json({id: results.insertId, message: 'Prestador criado com sucesso'});
    });
});

// PUT - Atualizar prestador
router.put('/:id', (req, res) => {
    const {name, categoryId, description, phone, email, address, neighborhood} = req.body;
    const sql = 'UPDATE providers SET name=?, categoryId=?, description=?, phone=?, email=?, address=?, neighborhood=? WHERE id=?';
    db.query(sql, [name, categoryId, description, phone, email, address, neighborhood, req.params.id], (err) => {
        if(err) return res.status(500).json({error: err.message});
        res.json({message: 'Prestador atualizado com sucesso'});
    });
});

// DELETE - Deletar prestador
router.delete('/:id', (req, res) => {
    const sql = 'UPDATE providers SET isActive=0 WHERE id=?';
    db.query(sql, [req.params.id], (err) => {
        if(err) return res.status(500).json({error: err.message});
        res.json({message: 'Prestador deletado com sucesso'});
    });
});

module.exports = router;