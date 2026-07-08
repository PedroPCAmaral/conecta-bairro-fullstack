// ============================================
// dashboard.js — área "Minha Conta" (abas por tipo de usuário)
// ============================================
// Carrega a sessão (/auth/me). Sem login → volta para login.html.
// Cliente: Histórico / Minhas Avaliações / Configurações.
// Prestador: Meu Perfil / Avaliações Recebidas / Configurações.

// ---------- Helpers ----------
function el(id) { return document.getElementById(id); }

function escapeHtml(s) {
    return (s == null ? '' : String(s)).replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

function stars(n) {
    n = Math.max(0, Math.min(5, Math.round(n || 0)));
    return '★'.repeat(n) + '☆'.repeat(5 - n);
}

function fmtDate(s) {
    if (!s) return '';
    const d = new Date(s);
    return isNaN(d) ? '' : d.toLocaleDateString('pt-BR');
}

function feedback(id, msg, type) {
    const f = el(id);
    if (!f) return;
    f.className = 'feedback ' + type;
    f.textContent = msg;
}

// fetch sempre com cookie de sessão
function api(url, options) {
    return fetch(url, Object.assign({ credentials: 'include' }, options || {}));
}

// ---------- Framework de abas ----------
let loaders = {};
let loaded = {};

function setupTabs(tabs) {
    const tabsEl = el('tabs');
    const panelsEl = el('panels');
    tabsEl.innerHTML = '';
    panelsEl.innerHTML = '';
    loaders = {};
    loaded = {};

    tabs.forEach(t => {
        const btn = document.createElement('button');
        btn.className = 'tab-btn';
        btn.textContent = t.label;
        btn.dataset.tab = t.key;
        btn.addEventListener('click', () => activateTab(t.key));
        tabsEl.appendChild(btn);

        const panel = document.createElement('div');
        panel.className = 'tab-panel';
        panel.id = 'tab-' + t.key;
        panelsEl.appendChild(panel);

        loaders[t.key] = t.load;
    });

    if (tabs.length) activateTab(tabs[0].key);
}

function activateTab(key) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === key));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === 'tab-' + key));
    // Carrega os dados só na primeira vez que a aba é aberta
    if (!loaded[key]) {
        loaded[key] = true;
        if (loaders[key]) loaders[key]();
    }
}

// ============================================
// ABAS DO CLIENTE
// ============================================

// --- Histórico ---
async function loadHistory() {
    const panel = el('tab-history');
    panel.innerHTML = '<p class="muted">Carregando...</p>';
    try {
        const res = await api('/api/client/history');
        const rows = await res.json();
        const intro = '<p class="muted" style="margin-bottom:16px;">Prestadores que você contatou (clicou em um contato no perfil).</p>';
        if (!rows.length) {
            panel.innerHTML = intro + '<p class="empty-state">Você ainda não contatou nenhum prestador.</p>';
            return;
        }
        panel.innerHTML = intro + rows.map(h => `
            <div class="card">
                <h4>${escapeHtml(h.providerName)}</h4>
                <div class="card-meta">${escapeHtml(h.categoryName)} · ${escapeHtml(h.neighborhood || 'Bairro não informado')}</div>
                <div class="muted">Contatado em ${fmtDate(h.contacted_at)}</div>
                <div class="card-actions">
                    <a href="index.html" class="btn btn-secondary btn-sm">Ver no site</a>
                </div>
            </div>
        `).join('');
    } catch (e) {
        panel.innerHTML = '<p class="empty-state">Erro ao carregar o histórico.</p>';
    }
}

// --- Minhas Avaliações ---
let clientReviewsData = [];

async function loadClientReviews() {
    const panel = el('tab-reviews');
    panel.innerHTML = '<p class="muted">Carregando...</p>';
    try {
        const res = await api('/api/client/reviews');
        clientReviewsData = await res.json();
        if (!clientReviewsData.length) {
            panel.innerHTML = '<p class="empty-state">Você ainda não escreveu avaliações.</p>';
            return;
        }
        panel.innerHTML = clientReviewsData.map(reviewCard).join('');
    } catch (e) {
        panel.innerHTML = '<p class="empty-state">Erro ao carregar suas avaliações.</p>';
    }
}

function reviewCard(r) {
    return `
        <div class="card" id="review-${r.id}">
            <h4>${escapeHtml(r.providerName)}</h4>
            <div class="card-meta">${fmtDate(r.created_at)}</div>
            <div class="stars">${stars(r.rating)}</div>
            <p>${escapeHtml(r.comment || '')}</p>
            <div class="card-actions">
                <button class="btn btn-secondary btn-sm" onclick="editReview(${r.id})">Editar</button>
                <button class="btn btn-secondary btn-sm" onclick="deleteReview(${r.id})">Excluir</button>
            </div>
        </div>`;
}

// Abre a edição inline da avaliação
function editReview(id) {
    const r = clientReviewsData.find(x => x.id === id);
    if (!r) return;
    const card = el('review-' + id);
    card.innerHTML = `
        <h4>${escapeHtml(r.providerName)}</h4>
        <div class="form-group">
            <label>Nota</label>
            <select id="edit-rating-${id}">
                ${[5, 4, 3, 2, 1].map(n => `<option value="${n}" ${n === r.rating ? 'selected' : ''}>${n} estrela(s)</option>`).join('')}
            </select>
        </div>
        <div class="form-group">
            <label>Comentário</label>
            <textarea id="edit-comment-${id}">${escapeHtml(r.comment || '')}</textarea>
        </div>
        <div id="edit-feedback-${id}" class="feedback"></div>
        <div class="card-actions">
            <button class="btn btn-primary btn-sm" onclick="saveReview(${id})">Salvar</button>
            <button class="btn btn-secondary btn-sm" onclick="loadClientReviews()">Cancelar</button>
        </div>`;
}

async function saveReview(id) {
    const rating = el('edit-rating-' + id).value;
    const comment = el('edit-comment-' + id).value;
    try {
        const res = await api('/api/client/reviews/' + id, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rating: Number(rating), comment })
        });
        if (res.ok) {
            loadClientReviews();
        } else {
            const d = await res.json();
            feedback('edit-feedback-' + id, d.error || 'Erro ao salvar', 'error');
        }
    } catch (e) {
        feedback('edit-feedback-' + id, 'Erro de conexão', 'error');
    }
}

async function deleteReview(id) {
    if (!confirm('Tem certeza que deseja excluir esta avaliação?')) return;
    try {
        const res = await api('/api/client/reviews/' + id, { method: 'DELETE' });
        if (res.ok) loadClientReviews();
    } catch (e) {
        // silencioso
    }
}

// ============================================
// ABAS DO PRESTADOR
// ============================================

// --- Meu Perfil ---
async function loadProfile() {
    const panel = el('tab-profile');
    panel.innerHTML = '<p class="muted">Carregando...</p>';
    try {
        const [profRes, catRes] = await Promise.all([
            api('/api/provider/profile'),
            fetch('/api/categories')
        ]);
        const p = await profRes.json();
        const cats = await catRes.json();
        panel.innerHTML = `
            <div class="panel-form">
                <h3>Meu Perfil</h3>
                <form id="profile-form">
                    <div class="form-group"><label>Nome *</label><input type="text" id="p-name" value="${escapeHtml(p.name)}" required></div>
                    <div class="form-group"><label>Categoria *</label>
                        <select id="p-category" required>
                            ${cats.map(c => `<option value="${c.id}" ${c.id === p.categoryId ? 'selected' : ''}>${escapeHtml(c.name)}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group"><label>Descrição</label><textarea id="p-description">${escapeHtml(p.description || '')}</textarea></div>
                    <div class="form-group"><label>Telefone</label><input type="tel" id="p-phone" value="${escapeHtml(p.phone || '')}"></div>
                    <div class="form-group"><label>Email de contato</label><input type="email" id="p-email" value="${escapeHtml(p.email || '')}"></div>
                    <div class="form-group"><label>Endereço</label><input type="text" id="p-address" value="${escapeHtml(p.address || '')}"></div>
                    <div class="form-group"><label>Bairro</label><input type="text" id="p-neighborhood" value="${escapeHtml(p.neighborhood || '')}"></div>
                    <div class="form-group">
                        <label style="font-weight:500;"><input type="checkbox" id="p-active" ${p.isActive ? 'checked' : ''}> Perfil público (aparece nas buscas)</label>
                    </div>
                    <div id="profile-feedback" class="feedback"></div>
                    <div class="form-buttons"><button type="submit" class="btn btn-primary">Salvar perfil</button></div>
                </form>
            </div>`;
        el('profile-form').addEventListener('submit', saveProfile);
    } catch (e) {
        panel.innerHTML = '<p class="empty-state">Erro ao carregar o perfil.</p>';
    }
}

async function saveProfile(e) {
    e.preventDefault();
    const data = {
        name: el('p-name').value,
        categoryId: el('p-category').value,
        description: el('p-description').value,
        phone: el('p-phone').value,
        email: el('p-email').value,
        address: el('p-address').value,
        neighborhood: el('p-neighborhood').value,
        isActive: el('p-active').checked
    };
    try {
        const res = await api('/api/provider/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const d = await res.json();
        feedback('profile-feedback', res.ok ? '✓ Perfil atualizado' : (d.error || 'Erro'), res.ok ? 'success' : 'error');
    } catch (e) {
        feedback('profile-feedback', 'Erro de conexão', 'error');
    }
}

// --- Redes Sociais ---
async function loadSocial() {
    const panel = el('tab-social');
    panel.innerHTML = '<p class="muted">Carregando...</p>';
    try {
        const res = await api('/api/provider/social');
        const s = await res.json();
        panel.innerHTML = `
            <div class="panel-form">
                <h3>Minhas Redes</h3>
                <p class="muted" style="margin-bottom:16px;">Preencha as que você usa. Elas aparecem no seu perfil público para o cliente copiar e entrar em contato.</p>
                <form id="social-form">
                    <div class="form-group"><label>Instagram</label><input type="text" id="s-instagram" value="${escapeHtml(s.instagram)}" placeholder="https://instagram.com/seuperfil"></div>
                    <div class="form-group"><label>WhatsApp</label><input type="text" id="s-whatsapp" value="${escapeHtml(s.whatsapp)}" placeholder="Só números com DDD, ex: 61999998888"></div>
                    <div class="form-group"><label>LinkedIn</label><input type="text" id="s-linkedin" value="${escapeHtml(s.linkedin)}" placeholder="https://linkedin.com/in/seuperfil"></div>
                    <div class="form-group"><label>Facebook</label><input type="text" id="s-facebook" value="${escapeHtml(s.facebook)}" placeholder="https://facebook.com/seuperfil"></div>
                    <div class="form-group"><label>Site / Outro</label><input type="text" id="s-site" value="${escapeHtml(s.site)}" placeholder="https://seusite.com.br"></div>
                    <div id="social-feedback" class="feedback"></div>
                    <div class="form-buttons"><button type="submit" class="btn btn-primary">Salvar redes</button></div>
                </form>
            </div>`;
        el('social-form').addEventListener('submit', saveSocial);
    } catch (e) {
        panel.innerHTML = '<p class="empty-state">Erro ao carregar as redes.</p>';
    }
}

async function saveSocial(e) {
    e.preventDefault();
    const data = {
        instagram: el('s-instagram').value,
        whatsapp: el('s-whatsapp').value,
        linkedin: el('s-linkedin').value,
        facebook: el('s-facebook').value,
        site: el('s-site').value
    };
    try {
        const res = await api('/api/provider/social', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const d = await res.json();
        feedback('social-feedback', res.ok ? '✓ Redes atualizadas' : (d.error || 'Erro'), res.ok ? 'success' : 'error');
    } catch (e) {
        feedback('social-feedback', 'Erro de conexão', 'error');
    }
}

// --- Avaliações Recebidas ---
async function loadProviderReviews() {
    const panel = el('tab-previews');
    panel.innerHTML = '<p class="muted">Carregando...</p>';
    try {
        const res = await api('/api/provider/reviews');
        const data = await res.json();
        const avg = Number(data.average || 0);

        let html = `
            <div class="rating-summary">
                <div class="average">${avg.toFixed(1)}</div>
                <div>
                    <div class="stars">${stars(avg)}</div>
                    <div class="muted">${data.total} avaliação(ões)</div>
                </div>
            </div>`;

        if (!data.reviews.length) {
            html += '<p class="empty-state">Você ainda não recebeu avaliações.</p>';
        } else {
            html += data.reviews.map(r => `
                <div class="card">
                    <h4>${escapeHtml(r.clientName)}</h4>
                    <div class="card-meta">${fmtDate(r.created_at)}</div>
                    <div class="stars">${stars(r.rating)}</div>
                    <p>${escapeHtml(r.comment || '')}</p>
                </div>`).join('');
        }
        panel.innerHTML = html;
    } catch (e) {
        panel.innerHTML = '<p class="empty-state">Erro ao carregar as avaliações.</p>';
    }
}

// ============================================
// CONFIGURAÇÕES (compartilhado: cliente e prestador têm o mesmo formato)
// ============================================
function renderSettings(me, base) {
    el('tab-settings').innerHTML = `
        <div class="panel-form">
            <h3>Dados da conta</h3>
            <form id="settings-form">
                <div class="form-group"><label>Nome *</label><input type="text" id="set-name" value="${escapeHtml(me.name)}" required></div>
                <div class="form-group"><label>Email *</label><input type="email" id="set-email" value="${escapeHtml(me.email || '')}" required></div>
                <div id="settings-feedback" class="feedback"></div>
                <div class="form-buttons"><button type="submit" class="btn btn-primary">Salvar dados</button></div>
            </form>

            <hr class="divider-line">

            <h3>Trocar senha</h3>
            <form id="password-form">
                <div class="form-group"><label>Senha atual *</label><input type="password" id="cur-password" required></div>
                <div class="form-group"><label>Nova senha *</label><input type="password" id="new-password" required minlength="6"></div>
                <div class="form-group"><label>Confirmar nova senha *</label><input type="password" id="new-password2" required minlength="6"></div>
                <div id="password-feedback" class="feedback"></div>
                <div class="form-buttons"><button type="submit" class="btn btn-primary">Trocar senha</button></div>
            </form>
        </div>`;

    // Salvar nome/email
    el('settings-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const res = await api(base + '/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: el('set-name').value, email: el('set-email').value })
            });
            const d = await res.json();
            feedback('settings-feedback', res.ok ? '✓ Dados atualizados' : (d.error || 'Erro'), res.ok ? 'success' : 'error');
            if (res.ok) refreshNavbar(); // atualiza o "Olá, nome" na navbar
        } catch (e) {
            feedback('settings-feedback', 'Erro de conexão', 'error');
        }
    });

    // Trocar senha
    el('password-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        if (el('new-password').value !== el('new-password2').value) {
            return feedback('password-feedback', 'As senhas não conferem', 'error');
        }
        try {
            const res = await api(base + '/password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword: el('cur-password').value,
                    newPassword: el('new-password').value
                })
            });
            const d = await res.json();
            feedback('password-feedback', res.ok ? '✓ Senha atualizada' : (d.error || 'Erro'), res.ok ? 'success' : 'error');
            if (res.ok) {
                el('cur-password').value = '';
                el('new-password').value = '';
                el('new-password2').value = '';
            }
        } catch (e) {
            feedback('password-feedback', 'Erro de conexão', 'error');
        }
    });
}

// ============================================
// INICIALIZAÇÃO
// ============================================
async function initDashboard() {
    let me;
    try {
        const res = await fetch('/auth/me', { credentials: 'include' });
        if (!res.ok) { window.location.href = 'login.html'; return; }
        me = await res.json();
    } catch (e) {
        window.location.href = 'login.html';
        return;
    }

    el('role-label').textContent = me.role === 'provider' ? 'Conta de Prestador' : 'Conta de Cliente';

    if (me.role === 'client') {
        setupTabs([
            { key: 'history', label: 'Contatos', load: loadHistory },
            { key: 'reviews', label: 'Minhas Avaliações', load: loadClientReviews },
            { key: 'settings', label: 'Configurações', load: () => renderSettings(me, '/api/client') }
        ]);
    } else {
        setupTabs([
            { key: 'profile', label: 'Meu Perfil', load: loadProfile },
            { key: 'social', label: 'Redes', load: loadSocial },
            { key: 'previews', label: 'Avaliações Recebidas', load: loadProviderReviews },
            { key: 'settings', label: 'Configurações', load: () => renderSettings(me, '/api/provider') }
        ]);
    }
}

document.addEventListener('DOMContentLoaded', initDashboard);
