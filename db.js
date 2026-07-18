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
// Cria um objeto 'db' que aceita TANTO await/Promises QUANTO os callbacks antigos!
// =========================================================================
const db = {
    // Permite fazer: const [rows] = await db.query('...')
    // E TAMBÉM: db.query('...', (err, results) => { ... })
    query: function(...args) {
        const lastArg = args[args.length - 1];
        // Se o último argumento for uma função, significa que a rota é antiga e usa callback
        if (typeof lastArg === 'function') {
            return pool.query(...args);
        }
        // Se não for função, executa como Promise (async/await)
        return promiseDb.query(...args);
    },

    // Se alguma rota antiga ainda chamar db.promise()
    promise: function() {
        return promiseDb;
    },
    // Suporte a transações manuais via conexão obtida do pool
    beginTransaction: async function() {
        const conn = await getConnection();
        await conn.beginTransaction();
        return conn;
    },
    // Permite obter uma conexão para transações explícitas
    getConnection,
    // Expõe o pool padrão para compatibilidade com callbacks
    pool
};

module.exports = db;
