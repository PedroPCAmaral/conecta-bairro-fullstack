# conecta-bairro-fullstack
🏘️ Conecta-Bairro FullStack é uma plataforma web de marketplace local desenvolvida com Node.js, Express.js e MySQL. O sistema conecta moradores a prestadores de serviços, permitindo contratação, gerenciamento de pedidos, avaliações, histórico de serviços e integração completa entre frontend, backend e banco de dados.

# 🏘️ Conecta-Bairro

## Plataforma Web de Marketplace para Serviços Locais

![Node.js](https://img.shields.io/badge/Node.js-22.x-green)
![Express](https://img.shields.io/badge/Express.js-Backend-black)
![MySQL](https://img.shields.io/badge/MySQL-Database-blue)
![Status](https://img.shields.io/badge/Status-Em%20Desenvolvimento-success)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

# 📌 Visão Geral

O **Conecta-Bairro** é uma plataforma web full stack desenvolvida como projeto acadêmico de extensão universitária para a disciplina de **Programação para Web (GPE17M50281)**.

O sistema funciona como um marketplace comunitário de serviços locais, conectando moradores de Águas Claras - DF a profissionais autônomos da região, promovendo:

* fortalecimento da economia local;
* inclusão digital;
* divulgação de pequenos profissionais;
* acessibilidade tecnológica;
* centralização de serviços comunitários.

---

# 🎯 Objetivos do Projeto

O projeto foi desenvolvido com foco em:

✅ Desenvolvimento Full Stack
✅ Arquitetura cliente-servidor
✅ Integração Frontend + Backend + Banco de Dados
✅ Implementação de API REST
✅ Operações CRUD completas
✅ Persistência de dados com MySQL
✅ Aplicação prática de Engenharia de Software
✅ Desenvolvimento web responsivo

---

# 🌎 Contexto Social

Águas Claras possui uma das maiores densidades populacionais do Distrito Federal, apresentando grande demanda por serviços locais e profissionais autônomos.

## 📊 Dados da Região

| Indicador             | Valor              |
| --------------------- | ------------------ |
| População             | 141.872 habitantes |
| Densidade demográfica | 14.074 hab/km²     |
| Crescimento anual     | ~8%                |
| Região                | Águas Claras - DF  |

---

# 🚀 Funcionalidades Implementadas

## 👤 Área do Morador

✅ Buscar serviços locais
✅ Filtrar profissionais por categoria
✅ Visualizar detalhes dos prestadores
✅ Consultar informações de contato
✅ Navegação responsiva
✅ Interface intuitiva

---

## 🛠️ Área do Prestador

✅ Cadastro de perfil profissional
✅ Edição de informações
✅ Remoção de perfil
✅ Divulgação gratuita de serviços
✅ Maior visibilidade local

---

# 📦 Funcionalidades em Desenvolvimento

O sistema está em evolução contínua e possui estrutura preparada para futuras funcionalidades:

* painel do consumidor;
* painel do prestador;
* sistema de pedidos;
* histórico de serviços;
* avaliações e comentários;
* autenticação de usuários;
* dashboard administrativo.

---

# 🧠 Arquitetura do Sistema

O projeto utiliza arquitetura baseada em separação de responsabilidades, comunicação cliente-servidor e persistência relacional.

## Fluxo da Aplicação

```text
Frontend (HTML/CSS/JavaScript)
            ↓
API REST Express.js
            ↓
Servidor Node.js
            ↓
Banco de Dados MySQL
```

---

# 🛠️ Stack Tecnológica

| Camada             | Tecnologia         |
| ------------------ | ------------------ |
| Frontend           | HTML5              |
| Estilização        | CSS3               |
| Interatividade     | JavaScript Vanilla |
| Backend            | Node.js            |
| Framework Backend  | Express.js         |
| Banco de Dados     | MySQL              |
| API                | REST               |
| Controle de Versão | Git/GitHub         |

---

# 📁 Estrutura do Projeto

```bash
conecta-bairro/
│
├── public/
│   ├── index.html
│   ├── style.css
│   └── script.js
│
├── routes/
│   └── api.js
│
├── docs/
│   └── SETUP.md
│
├── db.js
├── server.js
├── package.json
├── package-lock.json
├── README.md
└── .gitignore
```

---

# ⚙️ Instalação do Projeto

## 📋 Pré-requisitos

* Node.js v14+
* MySQL 5.7+
* npm

---

## 1️⃣ Clonar Repositório

```bash
git clone https://github.com/seu-usuario/conecta-bairro-fullstack.git
```

```bash
cd conecta-bairro-fullstack
```

---

## 2️⃣ Instalar Dependências

```bash
npm install
```

---

# 🗄️ Configuração do Banco de Dados

## Criar Banco

```sql
CREATE DATABASE conecta_bairro;

USE conecta_bairro;
```

---

## Criar Tabela de Categorias

```sql
CREATE TABLE categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Criar Tabela de Prestadores

```sql
CREATE TABLE providers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  categoryId INT NOT NULL,
  description TEXT,
  phone VARCHAR(20),
  email VARCHAR(320),
  address VARCHAR(255),
  neighborhood VARCHAR(100),
  isActive BOOLEAN DEFAULT 1,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (categoryId) REFERENCES categories(id)
);
```

---

## Inserir Categorias

```sql
INSERT INTO categories (name, description) VALUES
('Elétrica', 'Serviços elétricos'),
('Costura', 'Serviços de costura'),
('Alimentação', 'Serviços alimentícios'),
('Limpeza', 'Serviços de limpeza'),
('Tecnologia', 'Serviços tecnológicos'),
('Hidráulica', 'Serviços hidráulicos'),
('Pintura', 'Serviços de pintura'),
('Carpintaria', 'Serviços de carpintaria');
```

---

# 🔌 Configuração do MySQL

## Arquivo `db.js`

```javascript
const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'conecta_bairro',
    port: 3306
});

db.connect(err => {
    if (err) {
        console.error('Erro ao conectar:', err);
        return;
    }

    console.log('Banco conectado!');
});

module.exports = db;
```

---

# ▶️ Executar Projeto

```bash
npm start
```

---

# 🌐 Acessar Sistema

```text
http://localhost:3000
```

---

# 🔌 API REST

## Categorias

| Método | Endpoint        | Função            |
| ------ | --------------- | ----------------- |
| GET    | /api/categories | Listar categorias |

---

## Prestadores

| Método | Endpoint                     | Função              |
| ------ | ---------------------------- | ------------------- |
| GET    | /api/providers               | Listar prestadores  |
| GET    | /api/providers/:id           | Buscar prestador    |
| GET    | /api/providers/category/:id  | Filtrar categoria   |
| GET    | /api/providers/search/:query | Buscar por nome     |
| POST   | /api/providers               | Criar prestador     |
| PUT    | /api/providers/:id           | Atualizar prestador |
| DELETE | /api/providers/:id           | Remover prestador   |

---

# 🎨 Interface e Design

O sistema utiliza design moderno focado em:

* responsividade;
* usabilidade;
* acessibilidade;
* experiência do usuário;
* navegação intuitiva.

## 🎨 Paleta de Cores

| Cor          | Código  |
| ------------ | ------- |
| Creme Claro  | #F5F1EB |
| Azul Marinho | #1A2F5C |
| Dourado      | #D4AF37 |

---

# 🧪 Testes da API

## Listar Prestadores

```bash
curl http://localhost:3000/api/providers
```

---

## Listar Categorias

```bash
curl http://localhost:3000/api/categories
```

---

# 🚀 Próximas Evoluções

* 🔐 Sistema de autenticação
* ⭐ Sistema de avaliações
* 📦 Sistema de pedidos
* 👤 Painel do cliente
* 🛠️ Painel do prestador
* 📲 Integração com WhatsApp
* 💳 Pagamentos online
* ☁️ Deploy em nuvem
* 📱 Aplicativo mobile

---

# 📚 Conceitos Aplicados

O projeto aplica conceitos de:

* Engenharia de Software
* Programação Web
* Banco de Dados Relacional
* APIs REST
* CRUD
* Arquitetura Cliente-Servidor
* Desenvolvimento Full Stack
* Persistência de Dados

---

# 👨‍💻 Informações Acadêmicas

| Informação | Dados                |
| ---------- | -------------------- |
| Projeto    | Conecta-Bairro       |
| Disciplina | Programação para Web |
| Professor  | Prof. Ranyel Sonner  |
| Tipo       | Projeto de Extensão  |
| Ano        | 2026                 |

---

# 📄 Licença

Projeto desenvolvido para fins acadêmicos.

Licença MIT.

---

# ❤️ Considerações Finais

O Conecta-Bairro demonstra a aplicação prática de tecnologias modernas de desenvolvimento web em uma solução com impacto social, fortalecendo a economia local através da tecnologia e conectando moradores a profissionais da comunidade.

---

# ⭐ Desenvolvido com foco em inovação, acessibilidade e impacto social.
