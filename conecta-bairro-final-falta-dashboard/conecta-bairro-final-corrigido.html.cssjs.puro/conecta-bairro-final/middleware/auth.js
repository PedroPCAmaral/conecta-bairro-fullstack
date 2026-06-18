// ============================================
// MIDDLEWARE DE AUTENTICAÇÃO
// ============================================
// Reutilizado pelas rotas de cliente e prestador para proteger os dados privados.

// requireAuth — apenas verifica se há um usuário logado na sessão
function requireAuth(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Não autenticado' });
    }
    next();
}

// requireRole — verifica se o usuário logado tem a role exigida (ex.: 'client' ou 'provider')
function requireRole(role) {
    return (req, res, next) => {
        if (!req.session.user) {
            return res.status(401).json({ error: 'Não autenticado' });
        }
        if (req.session.user.role !== role) {
            return res.status(403).json({ error: 'Acesso negado' });
        }
        next();
    };
}

module.exports = { requireAuth, requireRole };
