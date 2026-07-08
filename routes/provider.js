const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const { requireRole } = require('../middleware/auth');

const promiseDb = db.promise();

// Todas as rotas deste arquivo exigem usuário logado como PRESTADOR
router.use(requireRole('provider'));

// ============================================
// PERFIL DO PRESTADOR (tabela providers)
// ============================================

// GET /api/provider/profile — dados do perfil + categoria
router.get('/profile', async (req, res) => {
    try {
        const sql = `
            SELECT p.*, c.name AS categoryName
            FROM providers p
            JOIN categories c ON p.categoryId = c.id
            WHERE p.user_id = ?`;
        const [rows] = await promiseDb.query(sql, [req.session.user.id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Perfil não encontrado' });
        }
        res.json(rows[0]);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// PUT /api/provider/profile — atualiza os campos do perfil
router.put('/profile', async (req, res) => {
    const { name, description, phone, email, address, neighborhood, categoryId, isActive } = req.body;

    if (!name || !categoryId) {
        return res.status(400).json({ error: 'Nome e categoria são obrigatórios' });
    }

    try {
        const sql = `
            UPDATE providers
            SET name = ?, description = ?, phone = ?, email = ?,
                address = ?, neighborhood = ?, categoryId = ?, isActive = ?
            WHERE user_id = ?`;
        await promiseDb.query(sql, [
            name,
            description || null,
            phone || null,
            email || null,
            address || null,
            neighborhood || null,
            categoryId,
            isActive ? 1 : 0,
            req.session.user.id
        ]);
        res.json({ message: 'Perfil atualizado' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ============================================
// AVALIAÇÕES RECEBIDAS
// ============================================

// GET /api/provider/reviews — lista as avaliações + média geral
router.get('/reviews', async (req, res) => {
    try {
        const providerId = req.session.user.providerId;

        // Lista das avaliações com o nome de quem avaliou
        const [reviews] = await promiseDb.query(
            `SELECT r.id, r.rating, r.comment, r.createdAt AS created_at,
                    u.name AS clientName
             FROM reviews r
             JOIN users u ON r.client_id = u.id
             WHERE r.provider_id = ?
             ORDER BY r.createdAt DESC`,
            [providerId]
        );

        // Média e total calculados no banco
        const [stats] = await promiseDb.query(
            'SELECT AVG(rating) AS average, COUNT(*) AS total FROM reviews WHERE provider_id = ?',
            [providerId]
        );

        res.json({
            average: stats[0].average ? Number(stats[0].average) : 0,
            total: stats[0].total,
            reviews
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ============================================
// REDES SOCIAIS (tabela social_links)
// ============================================

const SOCIAL_PLATFORMS = ['instagram', 'whatsapp', 'linkedin', 'facebook', 'site'];

// GET /api/provider/social — redes do prestador logado, como objeto { instagram: '', ... }
router.get('/social', async (req, res) => {
    try {
        const [rows] = await promiseDb.query(
            'SELECT platform, url FROM social_links WHERE provider_id = ?',
            [req.session.user.providerId]
        );
        const out = { instagram: '', whatsapp: '', linkedin: '', facebook: '', site: '' };
        rows.forEach(r => { if (r.platform in out) out[r.platform] = r.url; });
        res.json(out);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// PUT /api/provider/social — substitui as redes (apaga e reinsere as não-vazias)
router.put('/social', async (req, res) => {
    const providerId = req.session.user.providerId;
    const conn = promiseDb;
    try {
        await conn.query('START TRANSACTION');
        await conn.query('DELETE FROM social_links WHERE provider_id = ?', [providerId]);

        for (const platform of SOCIAL_PLATFORMS) {
            const url = (req.body[platform] || '').trim();
            if (url) {
                await conn.query(
                    'INSERT INTO social_links (provider_id, platform, url) VALUES (?, ?, ?)',
                    [providerId, platform, url]
                );
            }
        }
        await conn.query('COMMIT');
        res.json({ message: 'Redes atualizadas' });
    } catch (e) {
        await conn.query('ROLLBACK').catch(() => {});
        res.status(500).json({ error: e.message });
    }
});

// ============================================
// CONFIGURAÇÕES DA CONTA (tabela users)
// ============================================

// PUT /api/provider/settings — atualiza nome e email da conta
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

// PUT /api/provider/password — troca a senha (valida a senha atual antes)
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
