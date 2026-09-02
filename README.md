# 🛡️ Ronda Security — Sistema Integrado de Controle e Monitoramento de Rondas

O **Ronda Security** é um sistema completo e robusto para gestão, execução e monitoramento em tempo real de rondas patrimoniais de segurança. O sistema é composto por um **Backend NestJS (API REST)**, um **Painel Web Administrador (React + Vite)** e um **Aplicativo Mobile para Vigilantes (Expo + React Native)** com suporte nativo a operações **100% Offline**.

---

## 🚀 Funcionalidades Principais

### 🏢 1. Painel Web Administrador (`/web`)
- **📊 Monitoramento em Tempo Real**: Acompanhamento ao vivo das rondas em andamento com atualização automática a cada 3 segundos, exibindo nome do vigilante, rota, progresso e logs detalhados.
- **📄 Relatório Coletas (Layout A4 / PDF)**: Geração de relatórios com os mesmos padrões de layout oficial, filtros por período, rota e vigilante, e suporte a exportação em PDF e impressão A4.
- **🗺️ Gestão de Rotas e Checkpoints**: Cadastro de rotas (sequenciais ou livres), definição de quantidade mínima de pontos e geração automática de QR Codes (hashes SHA-256).
- **👥 Gestão de Usuários (RBAC)**: Cadastro e controle de perfis de acesso (`ADMIN`, `SUPERVISOR`, `VIGILANTE`).

### 📱 2. Aplicativo Mobile Vigilante (`/mobile`)
- **📶 Operação Offline-First**: Funciona sem sinal de internet ou Wi-Fi. As leituras são gravadas em banco **SQLite local** e sincronizadas automaticamente quando a conexão é restabelecida.
- **📷 Scanner de QR Code**: Leitura instantânea de pontos com suporte a botões de atalho para testes rápidos.
- **🔄 Atualização de Banco Local**: Sincronização e download das rotas e pontos de controle cadastrados no servidor.
- **⚙️ Configuração de IP Dinâmico**: Permite ajustar e testar a URL/IP do servidor backend via modal de configurações diretamente pelo aplicativo.
- **📋 Terminal de Logs & Rede**: Visualizador interno de logs HTTP e fila de sincronização para depuração em campo.

### ⚙️ 3. Backend REST API (`/backend`)
- **💾 Conexão Híbrida Postgres + PGlite**: Suporte dual a **PostgreSQL 16 (Docker)** com fallback automático transparente para banco embutido **PGlite (Zero-Config)** caso o Docker esteja offline.
- **🛡️ Autenticação JWT & RBAC**: Rotas protegidas por tokens JWT e validação de perfil de acesso.
- **🩺 Endpoint de Health Check Público (`/ping`)**: Para testes de conectividade de rede sem autenticação.
- **📚 Documentação OpenAPI / Swagger**: Acessível via `/api/docs`.

---

## 🛠️ Tecnologias Utilizadas

- **Backend**: NestJS, Fastify, Drizzle ORM, PostgreSQL, PGlite, JWT, Bcrypt, Jest, Supertest.
- **Frontend Web**: React 18, Vite, TypeScript, TailwindCSS, React Query, Lucide Icons, Axios.
- **Mobile**: Expo SDK 57, React Native, TypeScript, Expo SQLite, Expo Camera, NetInfo.

---

## 📋 Pré-requisitos

Antes de iniciar, certifique-se de ter instalado em sua máquina:
- **Node.js** (versão 18 ou superior)
- **npm** ou **yarn**
- **Docker & Docker Compose** (Opcional, pois o backend possui fallback PGlite zero-config)

---

## 🏁 Guia de Execução pela Primeira Vez

Siga os passos abaixo para rodar o sistema completo pela primeira vez.

### 1️⃣ Passo 1: Subir o Banco de Dados (Opcional)
Se desejar utilizar o PostgreSQL oficial no Docker:
```bash
docker compose up -d
```
> *Nota: Se você não tiver o Docker instalado, o backend inicializará automaticamente um banco PostgreSQL embutido (PGlite) na pasta `backend/pgdata`.*

---

### 2️⃣ Passo 2: Executar o Backend API
Abra um terminal e navegue até a pasta `backend`:

```bash
cd backend

# Instalar dependências (caso não tenha instalado)
npm install

# Subir as tabelas do banco de dados
npm run db:push

# Iniciar o servidor backend em modo de desenvolvimento
npm run start:dev
```
- A API estará disponível em: `http://localhost:3000` ou `http://<SEU_IP_LOCAL>:3000`
- Documentação Swagger: `http://localhost:3000/api/docs`

---

### 3️⃣ Passo 3: Executar o Painel Web Administrador
Abra um novo terminal e navegue até a pasta `web`:

```bash
cd web

# Instalar dependências
npm install

# Iniciar a aplicação Web
npm run dev
```
- O Painel Web estará disponível em: `http://localhost:5173`

---

### 4️⃣ Passo 4: Executar o Aplicativo Mobile
Abra um terceiro terminal e navegue até a pasta `mobile`:

```bash
cd mobile

# Instalar dependências
npm install

# Executar o app no navegador (Expo Web)
npx expo start --web
```
- Para testar em um **dispositivo móvel físico**:
  1. Instale o app **Expo Go** em seu celular.
  2. Execute `npx expo start` e escaneie o QR Code exibido no terminal.
  3. No app, clique no ícone de engrenagem `⚙️` na tela de login e ajuste o IP do Servidor para o IP da sua máquina na rede local (ex: `http://10.107.20.214:3000`).

---

## 🔑 Credenciais Padrão de Acesso

O sistema cria automaticamente um usuário Administrador inicial no primeiro arranque:

- **E-mail**: `admin@ronda.com`
- **Senha**: `admin123`
- **Perfil**: `ADMIN`

---

## 🧪 Executando os Testes Automatizados

O sistema conta com suítes completas de testes unitários e de integração E2E:

```bash
cd backend

# Executar Testes Unitários
npm run test

# Executar Testes de Integração E2E
npm run test:e2e
```

---

## 📁 Estrutura de Pastas

```
Ronda/
├── backend/                  # Servidor NestJS API REST
│   ├── src/                  # Código fonte (Auth, Patrol, Routes, Users, Drizzle)
│   ├── test/                 # Testes de Integração E2E
│   └── drizzle.config.ts     # Configurações do Drizzle ORM
├── web/                      # Painel Administrador React + Vite
│   ├── src/                  # Páginas (SessionsView, ReportsView, RoutesView, UsersView)
│   └── public/               # Recursos estáticos
├── mobile/                   # App Vigilante Expo + React Native
│   ├── src/                  # Componentes, Telas (PatrolApp, ScannerScreen), Serviços
│   └── app.json              # Configuração do Expo SDK
├── docker-compose.yml        # Container PostgreSQL 16
├── relatorio.pdf             # Modelo de referência do Relatório Coletas
└── README.md                 # Documentação do projeto
```
