const db = require('../db');

async function main() {
  const term = process.argv[2] || 'aguaviva';
  const promiseDb = db.promise();
  try {
    const like = `%${term.toLowerCase()}%`;
    const [providers] = await promiseDb.query(
      'SELECT id, name, email FROM providers WHERE LOWER(name) LIKE ? OR LOWER(email) LIKE ? LIMIT 10',
      [like, like]
    );

    if (!providers || providers.length === 0) {
      console.log('Nenhum prestador encontrado para termo:', term);
      return process.exit(0);
    }

    console.log('Prestadores encontrados:');
    providers.forEach(p => console.log(`- id=${p.id} name=${p.name} email=${p.email}`));

    for (const p of providers) {
      const [reviews] = await promiseDb.query(
        `SELECT r.id, r.rating, r.comment, r.createdAt AS created_at, r.createdAt, r.client_id, r.provider_id, u.name AS clientName, u.email AS clientEmail
         FROM reviews r
         LEFT JOIN users u ON r.client_id = u.id
         WHERE r.provider_id = ?
         ORDER BY r.createdAt DESC`,
        [p.id]
      );

      console.log(`\nAvaliações para provider id=${p.id} (${p.name}):`);
      if (!reviews || reviews.length === 0) {
        console.log('  (nenhuma)');
      } else {
        console.log(JSON.stringify(reviews, null, 2));
      }
    }
    process.exit(0);
  } catch (e) {
    console.error('Erro ao consultar avaliações:', e.message || e);
    process.exit(1);
  }
}

main();
