const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    ssl: {
        ca: fs.readFileSync(path.join(__dirname, 'ca.pem'))
    },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Testando a conexão inicial no Pool
pool.getConnection((err, connection) => {
    if (err) {
        console.error('\n✗ Erro ao conectar ao banco de dados MySQL:');
        console.error(err.message);
        process.exit(1);
    }
    console.log('✓ Conectado ao banco de dados MySQL (Pool Ativo)');
    connection.release();
});

// Criamos a instância de Promise padrão
const promiseDb = pool.promise();

// Retorna uma conexão com suporte a transações
async function getConnection() {
    return promiseDb.getConnection();
}

// =========================================================================
// 🛡️ SUPER BLINDAGEM MULTI-FORMATO
// =========================================================================
const db = {
    query: function(...args) {
        const lastArg = args[args.length - 1];
        if (typeof lastArg === 'function') {
            return pool.query(...args);
        }
        return promiseDb.query(...args);
    },
    promise: function() {
        return promiseDb;
    },
    beginTransaction: async function() {
        const conn = await getConnection();
        await conn.beginTransaction();
        return conn;
    },
    getConnection,
    pool
};

// =========================================================================
// 🏗️ CRIAÇÃO AUTOMÁTICA DAS TABELAS (roda uma vez quando o servidor sobe)
// =========================================================================
async function initTables() {
    try {
        await promiseDb.query(`
            CREATE TABLE IF NOT EXISTS categories (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await promiseDb.query(`
            CREATE TABLE IF NOT EXISTS providers (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(255) NOT NULL,
                category VARCHAR(100),
                description TEXT,
                phone VARCHAR(20),
                email VARCHAR(320),
                address VARCHAR(255),
                neighborhood VARCHAR(100),
                isActive BOOLEAN DEFAULT 1,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        await promiseDb.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(255),
                email VARCHAR(320) UNIQUE,
                password VARCHAR(255),
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await promiseDb.query(`
            CREATE TABLE IF NOT EXISTS reviews (
                id INT PRIMARY KEY AUTO_INCREMENT,
                provider_id INT NOT NULL,
                user_id INT,
                client_id INT,
                rating INT NOT NULL,
                comment TEXT,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE
            )
        `);

        await promiseDb.query(`
            CREATE TABLE IF NOT EXISTS social_links (
                id INT PRIMARY KEY AUTO_INCREMENT,
                provider_id INT NOT NULL,
                platform VARCHAR(50),
                url VARCHAR(500),
                FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE
            )
        `);

        const [rows] = await promiseDb.query('SELECT COUNT(*) as total FROM categories');
        if (rows[0].total === 0) {
            await promiseDb.query(`
                INSERT INTO categories (name, description) VALUES
                ('Elétrica', 'Serviços elétricos'),
                ('Costura', 'Serviços de costura'),
                ('Alimentação', 'Serviços alimentícios'),
                ('Limpeza', 'Serviços de limpeza'),
                ('Tecnologia', 'Serviços tecnológicos'),
                ('Hidráulica', 'Serviços hidráulicos'),
                ('Pintura', 'Serviços de pintura'),
                ('Carpintaria', 'Serviços de carpintaria')
            `);
            console.log('✓ Categorias iniciais inseridas');
        }

        console.log('✓ Tabelas verificadas/criadas com sucesso');
    } catch (err) {
        console.error('✗ Erro ao criar tabelas:', err.message);
    }
}

initTables();

module.exports = db;
