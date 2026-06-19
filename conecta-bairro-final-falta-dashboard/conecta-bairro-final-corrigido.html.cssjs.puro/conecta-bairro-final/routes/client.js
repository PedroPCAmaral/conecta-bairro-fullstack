const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const { requireRole } = require('../middleware/auth');

const promiseDb = db.promise();

// Todas as rotas deste arquivo exigem usuário logado como CLIENTE
router.use(requireRole('client'));

// ============================================
// HISTÓRICO DE CONTATOS
// ============================================

// GET /api/client/history — prestadores que o cliente já contatou
router.get('/history', async (req, res) => {
    try {
        const sql = `
            SELECT h.id, h.contacted_at,
                   p.id AS provider_id, p.name AS providerName,
                   p.neighborhood, c.name AS categoryName
            FROM contact_history h
            JOIN providers p  ON h.provider_id = p.id
            JOIN categories c ON p.categoryId = c.id
            WHERE h.client_id = ?
            ORDER BY h.contacted_at DESC`;
        const [rows] = await promiseDb.query(sql, [req.session.user.id]);
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ============================================
// AVALIAÇÕES FEITAS PELO CLIENTE
// ============================================

// GET /api/client/reviews — avaliações que o cliente escreveu
router.get('/reviews', async (req, res) => {
    try {
        const sql = `
            SELECT r.id, r.rating, r.comment, r.created_at,
                   p.id AS provider_id, p.name AS providerName
            FROM reviews r
            JOIN providers p ON r.provider_id = p.id
            WHERE r.client_id = ?
            ORDER BY r.created_at DESC`;
        const [rows] = await promiseDb.query(sql, [req.session.user.id]);
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/client/reviews — cria uma avaliação
router.post('/reviews', async (req, res) => {
    const { provider_id, rating, comment } = req.body;

    if (!provider_id || !rating) {
        return res.status(400).json({ error: 'Prestador e nota são obrigatórios' });
    }
    if (rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'A nota deve ser entre 1 e 5' });
    }

    try {
        const [result] = await promiseDb.query(
            'INSERT INTO reviews (provider_id, client_id, rating, comment) VALUES (?, ?, ?, ?)',
            [provider_id, req.session.user.id, rating, comment || null]
        );
        res.status(201).json({ id: result.insertId, message: 'Avaliação criada' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// PUT /api/client/reviews/:id — edita a própria avaliação
router.put('/reviews/:id', async (req, res) => {
    const { rating, comment } = req.body;
    if (rating && (rating < 1 || rating > 5)) {
        return res.status(400).json({ error: 'A nota deve ser entre 1 e 5' });
    }

    try {
        // Só atualiza se a avaliação pertencer ao cliente logado
        const [result] = await promiseDb.query(
            'UPDATE reviews SET rating = ?, comment = ? WHERE id = ? AND client_id = ?',
            [rating, comment || null, req.params.id, req.session.user.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Avaliação não encontrada' });
        }
        res.json({ message: 'Avaliação atualizada' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// DELETE /api/client/reviews/:id — exclui a própria avaliação
router.delete('/reviews/:id', async (req, res) => {
    try {
        const [result] = await promiseDb.query(
            'DELETE FROM reviews WHERE id = ? AND client_id = ?',
            [req.params.id, req.session.user.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Avaliação não encontrada' });
        }
        res.json({ message: 'Avaliação excluída' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ============================================
// CONFIGURAÇÕES DA CONTA
// ============================================

// PUT /api/client/settings — atualiza nome e email da conta
router.put('/settings', async (req, res) => {
    const { name, email } = req.body;
    if (!name || !email) {
        return res.status(400).json({ error: 'Nome e email são obrigatórios' });
    }

    try {
        await promiseDb.query(
            'UPDATE users SET name = ?, email = ? WHERE id = ?',
            [name, email, req.session.user.id]
        );
        // Mantém a sessão em dia com o novo nome/email
        req.session.user.name = name;
        req.session.user.email = email;
        res.json({ message: 'Dados atualizados' });
    } catch (e) {
        if (e.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Este email já está em uso' });
        }
        res.status(500).json({ error: e.message });
    }
});

// PUT /api/client/password — troca a senha (valida a senha atual antes)
router.put('/password', async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Informe a senha atual e a nova senha' });
    }

    try {
        const [users] = await promiseDb.query(
            'SELECT password_hash FROM users WHERE id = ?',
            [req.session.user.id]
        );
        const ok = await bcrypt.compare(currentPassword, users[0].password_hash);
        if (!ok) {
            return res.status(400).json({ error: 'Senha atual incorreta' });
        }

        const newHash = await bcrypt.hash(newPassword, 10);
        await promiseDb.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, req.session.user.id]);
        res.json({ message: 'Senha atualizada' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
