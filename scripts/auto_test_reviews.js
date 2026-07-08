const db = require('../db');

(async () => {
  try {
    const promiseDb = db.promise();

    // Pega um prestador disponível
    const [providers] = await promiseDb.query('SELECT id FROM providers LIMIT 1');
    if (!providers || providers.length === 0) {
      console.log('Nenhum prestador encontrado no banco.');
      return process.exit(1);
    }
    const providerId = providers[0].id;

    // Garante existir um cliente (cria se necessário)
    const [clients] = await promiseDb.query("SELECT id FROM users WHERE role = 'client' LIMIT 1");
    let clientId;
    if (clients && clients.length > 0) {
      clientId = clients[0].id;
    } else {
      const [r] = await promiseDb.query("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'client')", ['Auto Tester', 'autotest+' + Date.now() + '@example.com', '']);
      clientId = r.insertId;
      console.log('Criado cliente de teste id', clientId);
    }

    // Insere avaliação
    const rating = 5;
    const comment = 'Avaliação inserida automaticamente para teste';
    const [ins] = await promiseDb.query('INSERT INTO reviews (provider_id, client_id, rating, comment) VALUES (?, ?, ?, ?)', [providerId, clientId, rating, comment]);
    console.log('Avaliação inserida id', ins.insertId, 'provider', providerId);

    // Lê as últimas avaliações para confirmar
    const [reviews] = await promiseDb.query(
      `SELECT r.id, r.rating, r.comment, r.createdAt AS created_at, u.name AS clientName
       FROM reviews r
       LEFT JOIN users u ON r.client_id = u.id
       WHERE r.provider_id = ?
       ORDER BY r.createdAt DESC
       LIMIT 5`,
      [providerId]
    );

    console.log('Últimas avaliações (mostrando até 5):');
    console.log(JSON.stringify(reviews, null, 2));
    process.exit(0);
  } catch (e) {
    console.error('Erro no script:', e.message || e);
    process.exit(1);
  }
})();
