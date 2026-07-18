const express = require('express');
const session = require('express-session');
const cors = require('cors'); 
const path = require('path');
const mysql = require('mysql2/promise');

const app = express();
const port = process.env.PORT || 3000;

// Configuração de Conexão Direta com a Aiven/MySQL via URL de Ambiente
const db = mysql.createPool({
    uri: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Middlewares Globais
app.use(express.json());
app.use(express.urlencoded({ extended: true })); 
app.use(express.static(path.join(__dirname, 'public')));

app.set('trust proxy', 1);
app.use(session({
    secret: 'conecta-bairro-secret', 
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: false, 
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24 
    }
}));

app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'Cookie']
}));

// --- ROTAS DA API ---

// 1. Categorias
app.get('/api/categories', async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM categories ORDER BY name');
        res.json(results);
    } catch (err) {
        res.status(500).json([]);
    }
});

// 2. Fornecedores com filtros
app.get('/api/providers', async (req, res) => {
    try {
        const { category, search } = req.query;
        let queryStr = 'SELECT * FROM providers WHERE isActive = 1';
        let queryParams = [];

        if (category && category !== 'Todos' && category !== 'Todas as categorias' && category !== '') {
            queryStr += ' AND category = ?';
            queryParams.push(category);
        }

        if (search && search.trim() !== '') {
            queryStr += ' AND (name LIKE ? OR description LIKE ?)';
            const searchVal = `%${search}%`;
            queryParams.push(searchVal, searchVal);
        }

        queryStr += ' ORDER BY name ASC';
        const [results] = await db.query(queryStr, queryParams);
        res.json(results);
    } catch (err) {
        res.status(500).json([]);
    }
});

// 3. Fornecedor específico
app.get('/api/providers/:id', async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM providers WHERE id = ?', [req.params.id]);
        if (!results.length) return res.status(404).json({ error: 'Não encontrado' });
        res.json(results[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. Reviews do fornecedor
app.get('/api/providers/:id/reviews', async (req, res) => {
    try {
        const queryStr = `
            SELECT r.id, r.rating, r.comment, r.createdAt, IFNULL(u.name, 'Cliente Conecta') AS clientName
            FROM reviews r LEFT JOIN users u ON r.client_id = u.id
            WHERE r.provider_id = ? ORDER BY r.createdAt DESC
        `;
        const [reviews] = await db.query(queryStr, [req.params.id]);
        const [stats] = await db.query('SELECT AVG(rating) AS average, COUNT(*) AS total FROM reviews WHERE provider_id = ?', [req.params.id]);

        res.json({
            average: stats[0]?.average ? Number(stats[0].average) : 0,
            total: stats[0]?.total || 0,
            reviews
        });
    } catch (err) {
        res.json({ average: 0, total: 0, reviews: [] });
    }
});

// SPA Fallback
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- POPULAÇÃO AUTOMÁTICA ---
async function setupDatabase() {
    try {
        console.log('Validando tabelas no MySQL da Aiven...');
        
        await db.query(`CREATE TABLE IF NOT EXISTS categories (id INT PRIMARY KEY AUTO_INCREMENT, name VARCHAR(100) NOT NULL, description TEXT, createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
        await db.query(`CREATE TABLE IF NOT EXISTS users (id INT PRIMARY KEY AUTO_INCREMENT, name VARCHAR(255) NOT NULL, email VARCHAR(255) NOT NULL UNIQUE, password VARCHAR(255) NOT NULL, role VARCHAR(50) DEFAULT 'client', createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
        await db.query(`CREATE TABLE IF NOT EXISTS providers (id INT PRIMARY KEY AUTO_INCREMENT, name VARCHAR(255) NOT NULL, email VARCHAR(255) NOT NULL UNIQUE, password VARCHAR(255) NOT NULL, category VARCHAR(100) NOT NULL, description TEXT, phone VARCHAR(20), address VARCHAR(255), neighborhood VARCHAR(100), isActive BOOLEAN DEFAULT 1, createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
        await db.query(`CREATE TABLE IF NOT EXISTS reviews (id INT PRIMARY KEY AUTO_INCREMENT, provider_id INT NOT NULL, user_id INT, client_id INT, rating INT NOT NULL, comment TEXT, createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);

        // 1. Categorias
        const [categoriesCount] = await db.query('SELECT COUNT(*) as total FROM categories');
        if (categoriesCount[0].total === 0) {
            await db.query(`
                INSERT INTO categories (name, description) VALUES
                ('Elétrica', 'Serviços elétricos'), ('Costura', 'Serviços de costura'),
                ('Alimentação', 'Serviços alimentícios'), ('Limpeza', 'Serviços de limpeza'),
                ('Tecnologia', 'Serviços tecnológicos'), ('Hidráulica', 'Serviços hidráulicos'),
                ('Pintura', 'Serviços de pintura'), ('Carpintaria', 'Serviços de carpintaria'),
                ('Jardinagem', 'Serviços de jardinagem'), ('Mecânica', 'Serviços mecânicos')
            `);
            console.log('✓ 10 Categorias cadastradas.');
        }

        const pass = 'senha_criptografada_exemplo';
        const bairros = ['Centro', 'Bairro Novo', 'Vila Maria', 'Jardins', 'Bairro Alto', 'Vila Nova', 'Planalto', 'Alvorada'];
        const cats = ['Elétrica', 'Costura', 'Alimentação', 'Limpeza', 'Tecnologia', 'Hidráulica', 'Pintura', 'Carpintaria', 'Jardinagem', 'Mecânica'];

        // 2. 100 Clientes
        const [usersCount] = await db.query('SELECT COUNT(*) as total FROM users');
        if (usersCount[0].total === 0) {
            const nomesClientes = [
                'Lucas', 'Gabriel', 'Matheus', 'Guilherme', 'Gustavo', 'Felipe', 'Rafael', 'Daniel', 'Marcelo', 'Rodrigo',
                'Ricardo', 'Fernando', 'Thiago', 'Alexandre', 'Leonardo', 'Bruno', 'Eduardo', 'Diego', 'Danilo', 'Vitor',
                'Marcos', 'André', 'Fabio', 'Roberto', 'Julio', 'Renato', 'Samuel', 'Igor', 'Murilo', 'Otavio',
                'Ana', 'Maria', 'Julia', 'Beatriz', 'Larissa', 'Amanda', 'Leticia', 'Camila', 'Bruna', 'Jessica',
                'Barbara', 'Carla', 'Fernanda', 'Gabriela', 'Isabela', 'Mariana', 'Aline', 'Patricia', 'Vanessa', 'Juliana',
                'Priscila', 'Renata', 'Sabrina', 'Tatiane', 'Bianca', 'Carolina', 'Debora', 'Elaine', 'Flavia', 'Giovana',
                'Heloisa', 'Ingrid', 'Jaqueline', 'Karen', 'Karina', 'Livia', 'Lorena', 'Luana', 'Luiza', 'Maysa',
                'Milena', 'Monique', 'Natalia', 'Nicole', 'Paloma', 'Paola', 'Rafaela', 'Rebeca', 'Sara', 'Stefany',
                'Thais', 'Valeria', 'Vivian', 'Yasmim', 'Adriana', 'Alessandra', 'Clara', 'Denise', 'Elena', 'Ester',
                'Fabiana', 'Glaucia', 'Iris', 'Joana', 'Marta', 'Miriam', 'Olga', 'Paula', 'Regina', 'Sandra'
            ];
            for (let i = 1; i <= 100; i++) {
                await db.query('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, "client")', [`${nomesClientes[i-1]} Silva`, `cliente${i}@conecta.com`, pass]);
            }
            console.log('✓ 100 Clientes criados.');
        }

        // 3. 100 Fornecedores
        const [provsCount] = await db.query('SELECT COUNT(*) as total FROM providers');
        if (provsCount[0].total === 0) {
            const nomesProvs = [
                'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes',
                'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida', 'Lopes', 'Soares', 'Fernandes', 'Vieira', 'Barbosa',
                'Rocha', 'Dias', 'Nascimento', 'Andrade', 'Moreira', 'Nunes', 'Marques', 'Machado', 'Mendes', 'Freitas',
                'Cardoso', 'Ramos', 'Santana', 'Teixeira', 'Castro', 'Melo', 'Moraes', 'Carmo', 'Sales', 'Campos',
                'Pinto', 'Rios', 'Borges', 'Rezende', 'Motta', 'Guerra', 'Bueno', 'Paes', 'Braga', 'Fonseca',
                'Viana', 'Toledo', 'Assis', 'Cunha', 'Siqueira', 'Camargo', 'Batista', 'Miranda', 'Guimarães', 'Antunes',
                'Carneiro', 'Leal', 'Azevedo', 'Padilha', 'Pires', 'Dantas', 'Macedo', 'Caldeira', 'Farias', 'Menezes',
                'Galdino', 'Barros', 'Arruda', 'Giron', 'Fontes', 'Nogueira', 'Muniz', 'Lira', 'Valente', 'Meireles',
                'Santiago', 'Xavier', 'Prado', 'Quintana', 'Cavalcanti', 'Maldonado', 'Vargas', 'Cardoso', 'Ortega', 'Arantes',
                'Veloso', 'Bicalho', 'Mendonça', 'Tavares', 'Arraes', 'Pacheco', 'Luz', 'Galvão', 'Amaral', 'Peixoto'
            ];
            for (let i = 1; i <= 100; i++) {
                const catAtual = cats[(i - 1) % 10];
                await db.query(
                    'INSERT INTO providers (name, email, password, category, description, phone, address, neighborhood) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                    [`Prestador ${nomesProvs[i-1]}`, `fornecedor${i}@conecta.com`, pass, catAtual, `Especialista em ${catAtual}.`, `1198888${1000 + i}`, `Rua ${i}`, bairros[i % bairros.length]]
                );
            }
            console.log('✓ 100 Fornecedores criados.');
        }

        // 4. 100 Avaliações (90% boas, 10% médias/críticas)
        const [revsCount] = await db.query('SELECT COUNT(*) as total FROM reviews');
        if (revsCount[0].total === 0) {
            const boas = ["Excelente!", "Serviço perfeito.", "Preço justo.", "Muito pontual.", "Trabalho limpo."];
            const ruins = ["Atrasou e ficou incompleto.", "Não gostei do acabamento.", "Nota zero."];

            for (let i = 1; i <= 100; i++) {
                let nota, comentario;
                if (i % 10 === 0) {
                    nota = (i === 10 || i === 50) ? 1 : 2;
                    comentario = ruins[i % ruins.length];
                } else {
                    nota = Math.floor(Math.random() * 2) + 4;
                    comentario = boas[i % boas.length];
                }
                await db.query('INSERT INTO reviews (provider_id, client_id, rating, comment) VALUES (?, ?, ?, ?)', [i, i, nota, comentario]);
            }
            console.log('✓ 100 Avaliações cadastradas.');
        }
        console.log('✓ Banco de dados alimentado com sucesso!');
    } catch (err) {
        console.error('⚠️ Erro ao estruturar banco:', err.message);
    }
}

// Inicialização
app.listen(port, async () => {
    console.log(`Servidor rodando na porta ${port}`);
    await setupDatabase();
});
