const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');

// Interface de Promise sobre a MESMA conexão do db.js (não quebra o api.js em callback)
const promiseDb = db.promise();

// ============================================
// AUTENTICAÇÃO
// ============================================

// POST /auth/register — cria a conta de usuário (e o perfil de prestador, se for o caso)
router.post('/register', async (req, res) => {
    const { name, email, password, role } = req.body;

    // Validação básica
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
    }
    if (role !== 'client' && role !== 'provider') {
        return res.status(400).json({ error: 'Tipo de conta inválido' });
    }

    try {
        // Hash da senha antes de salvar
        const passwordHash = await bcrypt.hash(password, 10);

        if (role === 'provider') {
            // Prestador precisa também de um registro em providers (name + categoryId obrigatórios)
            const { categoryId, description, phone, address, neighborhood } = req.body;
            if (!categoryId) {
                return res.status(400).json({ error: 'Categoria é obrigatória para prestador' });
            }

            // Usa transação: ou cria user E provider, ou nada
            const conn = await db.beginTransaction();
            try {
                const [userResult] = await conn.query(
                    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
                    [name, email, passwordHash, 'provider']
                );
                const userId = userResult.insertId;

                // O email da conta também é usado como contato do prestador
                await conn.query(
                    `INSERT INTO providers
                        (user_id, name, categoryId, description, phone, email, address, neighborhood, isActive)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
                    [userId, name, categoryId, description || null, phone || null, email, address || null, neighborhood || null]
                );

                await conn.commit();
                return res.status(201).json({ id: userId, name, role: 'provider' });
            } catch (txErr) {
                try { await conn.rollback(); } catch (_) {}
                throw txErr;
            } finally {
                conn.release();
            }
        }

        // Cliente: só a conta em users
        const [result] = await promiseDb.query(
            'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
            [name, email, passwordHash, 'client']
        );
        return res.status(201).json({ id: result.insertId, name, role: 'client' });
    } catch (e) {
        // Email duplicado (UNIQUE) → 409
        if (e.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Este email já está cadastrado' });
        }
        return res.status(500).json({ error: e.message });
    }
});

// POST /auth/login — valida credenciais e cria a sessão
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    try {
        const [users] = await promiseDb.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ error: 'Email ou senha inválidos' });
        }

        const user = users[0];
        const ok = await bcrypt.compare(password, user.password_hash);
        if (!ok) {
            return res.status(401).json({ error: 'Email ou senha inválidos' });
        }

        // Dados guardados na sessão
        const sessionUser = { id: user.id, name: user.name, email: user.email, role: user.role };

        // Se for prestador, guarda também o providers.id para facilitar as queries
        if (user.role === 'provider') {
            const [providers] = await promiseDb.query(
                'SELECT id FROM providers WHERE user_id = ?',
                [user.id]
            );
            if (providers.length > 0) {
                sessionUser.providerId = providers[0].id;
            }
        }

        req.session.user = sessionUser;
        req.session.save(err => {
            if (err) {
                console.error('Erro ao salvar sessão:', err);
                return res.status(500).json({ error: 'Erro ao criar sessão' });
            }
            res.json({ name: user.name, role: user.role });
        });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
});

// POST /auth/logout — destrói a sessão
router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).json({ error: 'Erro ao sair' });
        res.clearCookie('connect.sid');
        res.json({ message: 'Sessão encerrada' });
    });
});

// GET /auth/me — retorna o usuário da sessão (usado pelo front para saber se está logado)
router.get('/me', (req, res) => {
    return res.json(req.session.user || null);
});

module.exports = router;
