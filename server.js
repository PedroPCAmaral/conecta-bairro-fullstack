// --- AUTO-MIGRAÇÃO E POPULAÇÃO MASSIVA DO BANCO ---
async function setupDatabase() {
    try {
        console.log('Validando tabelas no MySQL da Aiven...');
        
        await db.query(`
            CREATE TABLE IF NOT EXISTS categories (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'client',
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS providers (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                category VARCHAR(100) NOT NULL,
                description TEXT,
                phone VARCHAR(20),
                address VARCHAR(255),
                neighborhood VARCHAR(100),
                isActive BOOLEAN DEFAULT 1,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS reviews (
                id INT PRIMARY KEY AUTO_INCREMENT,
                provider_id INT NOT NULL,
                user_id INT,
                client_id INT,
                rating INT NOT NULL,
                comment TEXT,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS social_links (
                id INT PRIMARY KEY AUTO_INCREMENT,
                provider_id INT NOT NULL,
                platform VARCHAR(50) NOT NULL,
                url VARCHAR(255) NOT NULL
            )
        `);

        // 1. Inserir as 10 Categorias
        const [categoriesCount] = await db.query('SELECT COUNT(*) as total FROM categories');
        if (categoriesCount[0].total === 0) {
            await db.query(`
                INSERT INTO categories (name, description) VALUES
                ('Elétrica', 'Serviços elétricos'),
                ('Costura', 'Serviços de costura'),
                ('Alimentação', 'Serviços alimentícios'),
                ('Limpeza', 'Serviços de limpeza'),
                ('Tecnologia', 'Serviços tecnológicos'),
                ('Hidráulica', 'Serviços hidráulicos'),
                ('Pintura', 'Serviços de pintura'),
                ('Carpintaria', 'Serviços de carpintaria'),
                ('Jardinagem', 'Serviços de jardinagem'),
                ('Mecânica', 'Serviços mecânicos')
            `);
            console.log('✓ 10 Categorias cadastradas.');
        }

        const pass = 'senha_criptografada_exemplo';
        const bairros = ['Centro', 'Bairro Novo', 'Vila Maria', 'Jardins', 'Bairro Alto', 'Vila Nova', 'Planalto', 'Alvorada'];
        const cats = ['Elétrica', 'Costura', 'Alimentação', 'Limpeza', 'Tecnologia', 'Hidráulica', 'Pintura', 'Carpintaria', 'Jardinagem', 'Mecânica'];

        // 2. Inserir 100 Clientes se a tabela estiver vazia
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
                const nomeComp = `${nomesClientes[i-1]} Silva`;
                const emailComp = `cliente${i}@conecta.com`;
                await db.query('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, "client")', [nomeComp, emailComp, pass]);
            }
            console.log('✓ 100 Clientes de teste criados.');
        }

        // 3. Inserir 100 Fornecedores distribuídos igualmente pelas 10 categorias
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
                const catAtual = cats[(i - 1) % 10]; // Garante 10 fornecedores para cada uma das 10 categorias
                const nomeComp = `Prestador ${nomesProvs[i-1]}`;
                const emailComp = `fornecedor${i}@conecta.com`;
                const desc = `Especialista em ${catAtual}. Serviços profissionais rápidos, limpos e com garantia de satisfação no bairro.`;
                const fone = `1198888${String(1000 + i)}`;
                const rua = `Rua Número ${i}, nº ${10 + i}`;
                const bairro = bairros[i % bairros.length];

                await db.query(
                    'INSERT INTO providers (name, email, password, category, description, phone, address, neighborhood) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                    [nomeComp, emailComp, pass, catAtual, desc, fone, rua, bairro]
                );
            }
            console.log('✓ 100 Fornecedores (10 por categoria) criados.');
        }

        // 4. Inserir 100 Comentários/Avaliações vinculando Clientes aos Fornecedores
        // Regra solicitada: 90% Ótimos/Bons (Notas 4 e 5), 10% Médios/Ruins (Notas 1 a 3, garantindo nota 1)
        const [revsCount] = await db.query('SELECT COUNT(*) as total FROM reviews');
        if (revsCount[0].total === 0) {
            const bonsComentarios = [
                "Excelente profissional, super recomendo!", "Serviço perfeito, muito rápido.", 
                "Preço justo e atendimento impecável.", "Fiquei muito satisfeito com o resultado.", 
                "Muito pontual e organizado.", "Trabalho limpo e bem executado.", 
                "Muito educado e resolveu meu problema rápido.", "Melhor da região sem dúvidas.", 
                "O serviço superou minhas expectativas.", "Voltarei a contratar com certeza!"
            ];

            const ruinsComentarios = [
                "Infelizmente atrasou muito e o serviço ficou incompleto.",
                "Não gostei do acabamento. Deixou muita sujeira.",
                "Achei o preço muito abusivo para o que foi feito.",
                "Péssimo atendimento, não recomendo a ninguém.",
                "Cobrou caro e parou de responder minhas mensagens.",
                "O serviço quebrou no dia seguinte. Nota zero."
            ];

            for (let i = 1; i <= 100; i++) {
                let nota, comentario;
                
                // 10% do total (quando o resto da divisão por 10 é 0) gera nota ruim/média
                if (i % 10 === 0) {
                    nota = (i === 10 || i === 50) ? 1 : Math.floor(Math.random() * 2) + 2; // Garante nota 1 em alguns registros
                    comentario = ruinsComentarios[i % ruinsComentarios.length];
                } else {
                    // 90% das notas são ótimas (4 ou 5)
                    nota = Math.floor(Math.random() * 2) + 4;
                    comentario = bonsComentarios[i % bonsComentarios.length];
                }

                await db.query(
                    'INSERT INTO reviews (provider_id, client_id, rating, comment) VALUES (?, ?, ?, ?)',
                    [i, i, nota, comentario]
                );
            }
            console.log('✓ 100 Avaliações distribuídas cadastradas (90% boas / 10% críticas).');
        }

        console.log('✓ Banco de dados totalmente estruturado e alimentado!');
    } catch (err) {
        console.error('⚠️ Erro ao estruturar os dados automatizados:', err.message);
    }
}
