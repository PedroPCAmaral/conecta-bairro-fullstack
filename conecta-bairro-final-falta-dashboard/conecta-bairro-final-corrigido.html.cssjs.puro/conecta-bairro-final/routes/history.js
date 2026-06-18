const express = require('express');
const router = express.Router();
const db = require('../db');

const promiseDb = db.promise();

// ============================================
// REGISTRO DE CONTATO (cliente → prestador)
// ============================================

// POST /api/history — registra que o cliente logado contatou um prestador.
// Obs.: contact_history.client_id é NOT NULL, então o registro exige um cliente na sessão;
// o client_id vem SEMPRE da sessão (nunca do body).
router.post('/', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'client') {
        return res.status(401).json({ error: 'Faça login como cliente para registrar o contato' });
    }

    const { provider_id } = req.body;
    if (!provider_id) {
        return res.status(400).json({ error: 'Prestador é obrigatório' });
    }

    try {
        // Deduplica: se o cliente já contatou esse prestador, só atualiza a data.
        const [existing] = await promiseDb.query(
            'SELECT id FROM contact_history WHERE client_id = ? AND provider_id = ?',
            [req.session.user.id, provider_id]
        );

        if (existing.length > 0) {
            await promiseDb.query(
                'UPDATE contact_history SET contacted_at = NOW() WHERE id = ?',
                [existing[0].id]
            );
            return res.json({ id: existing[0].id, message: 'Contato atualizado' });
        }

        const [result] = await promiseDb.query(
            'INSERT INTO contact_history (client_id, provider_id) VALUES (?, ?)',
            [req.session.user.id, provider_id]
        );
        res.status(201).json({ id: result.insertId, message: 'Contato registrado' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
