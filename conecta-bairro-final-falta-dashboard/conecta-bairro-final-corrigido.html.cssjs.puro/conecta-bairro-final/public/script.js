document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    loadServices();
    setupEventListeners();
});

const API_URL = '/api';
let allProviders = [];

// 1. Array com as categorias que você solicitou + as anteriores inclusas
const allCategories = [
    { id: 1, name: "Alimentação" },
    { id: 2, name: "Carpintaria" },
    { id: 3, name: "Costura" },
    { id: 4, name: "Elétrica" },
    { id: 5, name: "Hidráulica" },
    { id: 6, name: "Limpeza" },
    { id: 7, name: "Pintura" },
    { id: 8, name: "Tecnologia" },
    { id: 9, name: "Assistência Técnica" },
    { id: 10, name: "Aulas / Reforço Escolar" },
    { id: 11, name: "Beleza e Estética" },
    { id: 12, name: "Reformas e Reparos" },
    { id: 13, name: "Pet Sitter / Passeador" },
    { id: 14, name: "Saúde e Bem-estar" }
];

function navigateTo(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const targetPage = document.getElementById(page + '-page');
    if (targetPage) {
        targetPage.classList.add('active');
        window.scrollTo(0, 0);
        if (page === 'dashboard') loadDashboard();
    }
}

// 2. Carrega as categorias locais no select de filtro da página de serviços
function loadCategories() {
    try {
        const select = document.getElementById('category-filter');
        // Limpa opções antigas deixando apenas a primeira
        select.innerHTML = '<option value="">Todas as categorias</option>';
        
        allCategories.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat.id;
            opt.textContent = cat.name;
            select.appendChild(opt);
        });
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

function displayServices(providers) {
    const list = document.getElementById('services-list');
    list.innerHTML = '';
    providers.forEach(p => {
        const card = document.createElement('div');
        card.className = 'service-card';
        card.onclick = () => showServiceDetail(p.id);
        card.innerHTML = `
            <span class="service-category">${p.categoryName || 'Outros'}</span>
            <h3>${p.name}</h3>
            <p class="service-description">${p.description || 'Sem descrição'}</p>
            <div class="service-contact">
                ${p.phone ? `<span>📱 ${p.phone}</span>` : ''}
                ${p.email ? `<span>📧 ${p.email}</span>` : ''}
            </div>
        `;
        list.appendChild(card);
    });
}

async function showServiceDetail(id) {
    try {
        const response = await fetch(`${API_URL}/providers/${id}`);
        const p = await response.json();
        const detail = document.getElementById('service-detail');
        detail.innerHTML = `
            <h2>${p.name}</h2>
            <span class="service-category">${p.categoryName || 'Outros'}</span>
            <div class="detail-info">
                <div class="detail-item"><label>Categoria</label><p>${p.categoryName || 'Não informada'}</p></div>
                ${p.phone ? `<div class="detail-item"><label>Telefone</label><p><a href="tel:${p.phone}">${p.phone}</a></p></div>` : ''}
                ${p.email ? `<div class="detail-item"><label>Email</label><p><a href="mailto:${p.email}">${p.email}</a></p></div>` : ''}
                ${p.address ? `<div class="detail-item"><label>Endereço</label><p>${p.address}</p></div>` : ''}
                ${p.neighborhood ? `<div class="detail-item"><label>Bairro</label><p>${p.neighborhood}</p></div>` : ''}
            </div>
            <div class="detail-buttons">
                ${p.phone ? `<a href="tel:${p.phone}" class="btn btn-primary">Ligar</a>` : ''}
                ${p.email ? `<a href="mailto:${p.email}" class="btn btn-primary">Enviar Email</a>` : ''}
            </div>
        `;
        navigateTo('detail');
    } catch (e) { console.error(e); alert('Erro ao carregar'); }
}

// 3. Monta a dashboard e injeta as novas categorias no select do formulário
function loadDashboard() {
    const dash = document.getElementById('dashboard-content');
    dash.innerHTML = `
        <div style="max-width: 600px;">
            <h3>Cadastro de Prestador</h3>
            <form id="provider-form">
                <div class="form-group">
                    <label>Nome *</label>
                    <input type="text" id="provider-name" required>
                </div>
                <div class="form-group">
                    <label>Categoria *</label>
                    <select id="provider-category" required>
                        <option value="">Selecione</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Descrição</label>
                    <textarea id="provider-description"></textarea>
                </div>
                <div class="form-group">
                    <label>Telefone</label>
                    <input type="tel" id="provider-phone">
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="provider-email">
                </div>
                <div class="form-group">
                    <label>Endereço</label>
                    <input type="text" id="provider-address">
                </div>
                <div class="form-group">
                    <label>Bairro</label>
                    <input type="text" id="provider-neighborhood">
                </div>
                <div class="form-buttons">
                    <button type="submit" class="btn btn-primary">Salvar</button>
                    <button type="button" class="btn btn-secondary" onclick="navigateTo('home')">Cancelar</button>
                </div>
            </form>
        </div>
    `;

    const sel = document.getElementById('provider-category');
    allCategories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.id;
        opt.textContent = cat.name;
        sel.appendChild(opt);
    });

    document.getElementById('provider-form').addEventListener('submit', handleProviderSubmit);
}

async function handleProviderSubmit(e) {
    e.preventDefault();
    const data = {
        name: document.getElementById('provider-name').value,
        categoryId: document.getElementById('provider-category').value,
        description: document.getElementById('provider-description').value,
        phone: document.getElementById('provider-phone').value,
        email: document.getElementById('provider-email').value,
        address: document.getElementById('provider-address').value,
        neighborhood: document.getElementById('provider-neighborhood').value
    };
    try {
        const response = await fetch(`${API_URL}/providers`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        if (response.ok) {
            alert('✓ Perfil criado!');
            loadServices();
            navigateTo('services');
        } else {
            alert('✗ Erro ao criar');
        }
    } catch (e) { console.error(e); alert('✗ Erro'); }
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
        filtered = filtered.filter(p => p.categoryId == catId);
    }
    displayServices(filtered);
}