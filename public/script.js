document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    loadServices();
    setupEventListeners();
});

const API_URL = '/api';
let allProviders = [];
let allCategories = []; // Guardará as categorias carregadas do banco
let detailIsClient = false; // se o visitante atual está logado como cliente (no detalhe)

// Ícones/rótulos das redes (emoji, sem lib externa — combina com o resto do site)
const SOCIAL_META = {
    instagram: { label: 'Instagram', icon: '📷' },
    whatsapp:  { label: 'WhatsApp',  icon: '💬' },
    linkedin:  { label: 'LinkedIn',  icon: '💼' },
    facebook:  { label: 'Facebook',  icon: '📘' },
    site:      { label: 'Site',      icon: '🌐' }
};

// --- Helpers ---
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

function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
    } else {
        fallbackCopy(text);
    }
}

function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
}

function navigateTo(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const targetPage = document.getElementById(page + '-page');
    if (targetPage) {
        targetPage.classList.add('active');
        window.scrollTo(0, 0);
    }
}

// 2. Carrega as categorias do banco e salva na memória global
async function loadCategories() {
    try {
        const select = document.getElementById('category-filter');
        select.innerHTML = '<option value="">Todas as categorias</option>';

        const response = await fetch(`${API_URL}/categories`);
        allCategories = await response.json(); // Salva globalmente
        
        allCategories.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat.id;
            opt.textContent = cat.name;
            select.appendChild(opt);
        });
        
        // Recarrega os serviços caso eles tenham carregado antes das categorias
        if (allProviders.length > 0) {
            displayServices(allProviders);
        }
    } catch (e) {
        console.error("Erro ao carregar categorias:", e);
    }
}

async function loadServices() {
    try {
        const response = await fetch(`${API_URL}/providers`);
        allProviders = await response.json();
        displayServices(allProviders);
    } catch (e) { console.error(e); }
}

// SOLUÇÃO DEFINITIVA: Traduz dinamicamente o ID da categoria no nome real
function displayServices(providers) {
    const list = document.getElementById('services-list');
    list.innerHTML = '';
    
    providers.forEach(p => {
        // Encontra o ID correto enviado pelo banco de dados
        const idDaCategoria = p.categoryId || p.category_id;
        
        // Procura na lista global o nome correspondente a este ID
        const categoriaEncontrada = allCategories.find(c => c.id == idDaCategoria);
        
        // Define o nome dinâmico ou usa fallbacks do banco, por último 'Outros'
        const currentCategory = categoriaEncontrada ? categoriaEncontrada.name : (p.categoryName || p.category_name || p.category || 'Outros');

        const card = document.createElement('div');
        card.className = 'service-card';
        card.onclick = () => showServiceDetail(p.id);
        card.innerHTML = `
            <span class="service-category">${escapeHtml(currentCategory)}</span>
            <h3>${escapeHtml(p.name)}</h3>
            <p class="service-description">${escapeHtml(p.description || 'Sem descrição')}</p>
            <div class="service-contact">
                ${p.phone ? `<span>📱 ${escapeHtml(p.phone)}</span>` : ''}
                ${p.email ? `<span>📧 ${escapeHtml(p.email)}</span>` : ''}
            </div>
        `;
        list.appendChild(card);
    });
}

async function showServiceDetail(id) {
    try {
        const [pRes, socialRes, revRes, meRes] = await Promise.all([
            fetch(`${API_URL}/providers/${id}`),
            fetch(`${API_URL}/providers/${id}/social`),
            fetch(`${API_URL}/providers/${id}/reviews`),
            fetch('/auth/me', { credentials: 'include' })
        ]);

        if (!pRes.ok) {
            throw new Error('Não foi possível carregar o prestador.');
        }

        const p = await pRes.json();
        const social = socialRes.ok ? await socialRes.json() : [];
        let reviewsData = revRes.ok ? await revRes.json() : { average: 0, total: 0, reviews: [] };

        function normalizeReview(r) {
            return {
                id: r.id || r.ID || null,
                rating: Number(r.rating ?? r.Rating ?? r.rate ?? 0),
                comment: r.comment ?? r.Comment ?? '',
                clientName: r.clientName ?? r.client_name ?? r.name ?? 'Cliente Conecta',
                created_at: r.created_at ?? r.createdAt ?? null
            };
        }

        if (!reviewsData) reviewsData = { average: 0, total: 0, reviews: [] };
        if (Array.isArray(reviewsData)) {
            const arr = reviewsData.map(normalizeReview);
            reviewsData = { average: 0, total: arr.length, reviews: arr };
        } else if (reviewsData.reviews && Array.isArray(reviewsData.reviews)) {
            reviewsData.reviews = reviewsData.reviews.map(normalizeReview);
            reviewsData.average = Number(reviewsData.average ?? 0);
            reviewsData.total = typeof reviewsData.total === 'number' ? reviewsData.total : reviewsData.reviews.length;
        } else {
            reviewsData = { average: 0, total: 0, reviews: [] };
        }
        
        let me = null;
        if (meRes.ok) {
            const contentType = meRes.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
                try { me = await meRes.json(); } catch (e) { me = null; }
            }
        }
        detailIsClient = !!(me && me.role === 'client');

        const detail = document.getElementById('service-detail');
        detail.innerHTML = renderDetail(p, social, reviewsData);
        attachDetailHandlers(p.id);
        navigateTo('detail');
    } catch (e) { console.error(e); alert('Erro ao carregar'); }
}

function renderDetail(p, social, reviewsData) {
    const chips = [];
    if (p.phone) chips.push(chipHtml('📱', 'Telefone', p.phone));
    if (p.email) chips.push(chipHtml('📧', 'Email', p.email));
    social.forEach(s => {
        const meta = SOCIAL_META[s.platform] || { label: s.platform, icon: '🔗' };
        chips.push(chipHtml(meta.icon, meta.label, s.url, s.platform));
    });

    const idDaCategoria = p.categoryId || p.category_id;
    const categoriaEncontrada = allCategories.find(c => c.id == idDaCategoria);
    const detailCategory = categoriaEncontrada ? categoriaEncontrada.name : (p.categoryName || p.category_name || p.category || 'Outros');

    return `
        <h2>${escapeHtml(p.name)}</h2>
        <span class="service-category">${escapeHtml(detailCategory)}</span>
        <p class="service-description">${escapeHtml(p.description || 'Sem descrição')}</p>

        <div class="detail-info">
            <div class="detail-item"><label>Categoria</label><p>${escapeHtml(detailCategory)}</p></div>
            ${p.address ? `<div class="detail-item"><label>Endereço</label><p>${escapeHtml(p.address)}</p></div>` : ''}
            ${p.neighborhood ? `<div class="detail-item"><label>Bairro</label><p>${escapeHtml(p.neighborhood)}</p></div>` : ''}
        </div>

        ${chips.length ? `
        <h3 class="detail-section-title">Contatos</h3>
        <p class="detail-hint">Clique para copiar.</p>
        <div class="contact-chips">${chips.join('')}</div>` : ''}

        ${renderReviews(reviewsData)}
    `;
}

function chipHtml(icon, label, value, platform) {
    const cls = platform ? ` chip-${platform}` : '';
    return `<button type="button" class="copy-chip${cls}" data-copy="${escapeHtml(value)}">
                <span class="chip-icon">${icon}</span>
                <span class="chip-text"><strong>${escapeHtml(label)}</strong><span>${escapeHtml(value)}</span></span>
                <span class="chip-status">copiar</span>
            </button>`;
}

function renderReviews(data) {
    const avg = Number(data.average || 0);

    const listHtml = (!data.reviews || !data.reviews.length)
        ? '<p class="detail-hint">Ainda não há avaliações. Seja o primeiro!</p>'
        : data.reviews.map(r => `
            <div class="card">
                <h4>${escapeHtml(r.clientName)}</h4>
                <div class="card-meta">${fmtDate(r.created_at)}</div>
                <div class="stars">${stars(r.rating)}</div>
                <p>${escapeHtml(r.comment || '')}</p>
            </div>`).join('');

    const formHtml = detailIsClient ? `
        <form id="detail-review-form" class="review-form">
            <h4>Deixe sua avaliação</h4>
            <div class="form-group">
                <label>Nota</label>
                <select id="dr-rating">
                    <option value="5">5 estrelas</option>
                    <option value="4">4 estrelas</option>
                    <option value="3">3 estrelas</option>
                    <option value="2">2 estrelas</option>
                    <option value="1">1 estrela</option>
                </select>
            </div>
            <div class="form-group">
                <label>Comentário</label>
                <textarea id="dr-comment" placeholder="Conte como foi o serviço..."></textarea>
            </div>
            <div id="dr-feedback" class="feedback"></div>
            <div class="form-buttons"><button type="submit" class="btn btn-primary">Enviar avaliação</button></div>
        </form>`
        : `<p class="detail-hint">Para avaliar, <a href="login.html" style="color:var(--primary); font-weight:600;">entre como cliente</a>.</p>`;

    return `
        <h3 class="detail-section-title">Avaliações</h3>
        <div class="rating-summary">
            <div class="average">${avg.toFixed(1)}</div>
            <div>
                <div class="stars">${stars(avg)}</div>
                <div class="muted">${(data.total ?? 0)} avaliação(ões)</div>
            </div>
        </div>
        <div class="review-list">${listHtml}</div>
        ${formHtml}
    `;
}

function attachDetailHandlers(providerId) {
    document.querySelectorAll('#service-detail .copy-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            copyText(chip.getAttribute('data-copy'));

            const status = chip.querySelector('.chip-status');
            if (status) {
                status.textContent = 'copiado!';
                chip.classList.add('copied');
                setTimeout(() => { status.textContent = 'copiar'; chip.classList.remove('copied'); }, 1500);
            }

            if (detailIsClient) {
                fetch('/api/history', {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ provider_id: providerId })
                }).catch(() => {});
            }
        });
    });

    const form = document.getElementById('detail-review-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fb = document.getElementById('dr-feedback');
            fb.className = 'feedback';
            const rating = Number(document.getElementById('dr-rating').value);
            const comment = document.getElementById('dr-comment').value;
            try {
                const res = await fetch('/api/client/reviews', {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ provider_id: providerId, rating, comment })
                });
                const d = await res.json();
                if (res.ok) {
                    showServiceDetail(providerId);
                } else {
                    fb.className = 'feedback error';
                    fb.textContent = d.error || 'Erro ao enviar avaliação';
                }
            } catch (err) {
                fb.className = 'feedback error';
                fb.textContent = 'Erro de conexão';
            }
        });
    }
}

function setupEventListeners() {
    document.getElementById('search-input').addEventListener('input', filterServices);
    document.getElementById('category-filter').addEventListener('change', filterServices);
}

function filterServices() {
    const query = document.getElementById('search-input').value.toLowerCase();
    const catId = document.getElementById('category-filter').value;
    let filtered = allProviders;
    if (query) {
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query)
        );
    }
    if (catId) {
        filtered = filtered.filter(p => p.categoryId == catId || p.category_id == catId);
    }
    displayServices(filtered);
}