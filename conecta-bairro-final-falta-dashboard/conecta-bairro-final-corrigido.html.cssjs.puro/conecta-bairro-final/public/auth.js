// ============================================
// auth.js — sessão na navbar (compartilhado entre as páginas)
// ============================================
// Mostra "Entrar/Cadastrar" para visitante e "Olá, nome / Minha Conta / Sair" para logado.
// Itens com classe .nav-guest aparecem deslogado; .nav-user aparecem logado.

async function refreshNavbar() {
    let user = null;
    try {
        const res = await fetch('/auth/me', { credentials: 'include' });
        if (res.ok) user = await res.json();
    } catch (e) {
        // sem conexão: trata como visitante
    }

    document.querySelectorAll('.nav-guest').forEach(el => {
        el.style.display = user ? 'none' : '';
    });
    document.querySelectorAll('.nav-user').forEach(el => {
        el.style.display = user ? '' : 'none';
    });

    if (user) {
        const nameEl = document.getElementById('nav-username');
        if (nameEl) nameEl.textContent = 'Olá, ' + user.name;
    }
    return user;
}

// Encerra a sessão e volta para a home
async function logout() {
    try {
        await fetch('/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (e) { /* ignora */ }
    window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', refreshNavbar);
