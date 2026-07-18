const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');

const caPath = path.join(__dirname, 'ca.pem');

// Configuração do SSL forçada para a nuvem
let sslConfig = {
    rejectUnauthorized: false
};

// Se o arquivo ca.pem existir, injeta o certificado explicitamente
if (fs.existsSync(caPath)) {
    sslConfig.ca = fs.readFileSync(caPath);
}

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 20002,
    ssl: sslConfig,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Testando a conexão inicial no Pool
pool.getConnection((err, connection) => {
    if (err) {
        console.error('\n✗ Erro ao conectar ao banco de dados MySQL:');
        console.error(err.message);
    } else {
        console.log('✓ Conectado ao banco de dados MySQL (Pool Ativo com SSL)');
        connection.release();
    }
});

// Criamos a instância de Promise padrão
const promiseDb = pool.promise();

// Retorna uma conexão com suporte a transações
async function getConnection() {
    return promiseDb.getConnection();
}

// =========================================================================
// 🛡️ SUPER BLINDAGEM MULTI-FORMATO
// Cria um objeto 'db' que aceita TANTO await/Promises QUANTO os callbacks antigos!
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

module.exports = db;
