# 🏘️ Conecta-Bairro

## Plataforma Inteligente de Marketplace para Serviços Locais

![Node.js](https://img.shields.io/badge/Node.js-22.x-green)
![Express](https://img.shields.io/badge/Express.js-Backend-black)
![MySQL](https://img.shields.io/badge/MySQL-Database-blue)
![Status](https://img.shields.io/badge/Status-Completo-success)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

# 📌 Visão Geral

O **Conecta-Bairro** é uma plataforma web full stack desenvolvida como projeto acadêmico de extensão universitária na disciplina **Programação para Web (GPE17M50281)**.

O sistema funciona como um marketplace comunitário de serviços locais, conectando moradores de Águas Claras - DF a profissionais autônomos da região, promovendo:

* fortalecimento da economia local;
* inclusão digital;
* geração de oportunidades;
* centralização de serviços comunitários;
* acessibilidade tecnológica.

---

# 🎯 Objetivos do Projeto

O projeto foi desenvolvido com foco em:

✅ Desenvolvimento Full Stack moderno
✅ Arquitetura cliente-servidor
✅ Integração Frontend + Backend + Banco de Dados
✅ Implementação de API REST
✅ Operações CRUD completas
✅ Responsividade e usabilidade
✅ Persistência de dados com MySQL
✅ Aplicação prática de Engenharia de Software

---

# 🌎 Contexto Social

Águas Claras possui uma das maiores densidades populacionais do Distrito Federal e um forte crescimento urbano, criando grande demanda por serviços locais.

## 📊 Dados da Região

| Indicador             | Valor              |
| --------------------- | ------------------ |
| População             | 141.872 habitantes |
| Densidade demográfica | 14.074 hab/km²     |
| Crescimento anual     | ~8%                |
| Região                | Águas Claras - DF  |

---

# 🚀 Funcionalidades

## 👤 Área do Morador

* 🔎 Busca inteligente de serviços
* 📂 Filtro por categorias
* 📞 Contato direto com profissionais
* 📍 Visualização por bairro
* 🧾 Consulta detalhada de prestadores
* 📱 Interface responsiva

---

## 🛠️ Área do Prestador

* ➕ Cadastro de perfil profissional
* ✏️ Edição de informações
* ❌ Remoção de perfil
* 📢 Divulgação gratuita
* 🏘️ Maior visibilidade local

---

# 🧠 Arquitetura do Sistema

O projeto utiliza arquitetura baseada em:

* Frontend desacoplado
* Backend RESTful
* Persistência relacional
* Estrutura modular organizada

## Fluxo da Aplicação

```text
Frontend (HTML/CSS/JS)
        ↓
Express.js API
        ↓
Node.js Server
        ↓
MySQL Database
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
git clone https://github.com/seu-usuario/conecta-bairro.git
```

```bash
cd conecta-bairro
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

# 🔌 Configuração do MySQL no Node.js

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

O sistema utiliza design moderno com foco em:

* UX/UI minimalista;
* responsividade;
* acessibilidade;
* navegação intuitiva;
* identidade visual elegante.

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

# 🚀 Possíveis Melhorias Futuras

* 🔐 Sistema de autenticação
* ⭐ Avaliações e comentários
* 📲 Integração WhatsApp
* 💳 Pagamentos online
* 📍 Geolocalização
* 📱 Aplicativo mobile
* ☁️ Deploy em nuvem
* 📊 Dashboard administrativo
* 🔔 Sistema de notificações

---

# 📚 Conceitos Aplicados

Este projeto aplica conceitos de:

* Engenharia de Software
* Programação Web
* Banco de Dados Relacional
* APIs REST
* CRUD
* Arquitetura Cliente-Servidor
* Versionamento Git
* Desenvolvimento Full Stack

---

# 👨‍💻 Equipe

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

O Conecta-Bairro demonstra a aplicação prática de tecnologias modernas de desenvolvimento web em uma solução com impacto social real, promovendo integração comunitária e fortalecimento econômico local através da tecnologia.

---

# ⭐ Desenvolvido com foco em tecnologia, impacto social e inovação local.
