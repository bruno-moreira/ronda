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
- **Deploy/Infraestrutura**: Docker, Docker Compose, Nginx (Proxy Reverso).

---

## 🌐 Arquitetura do Proxy Reverso (Nginx)

Inspirado na arquitetura do sistema **Netmap Industrial**, este projeto utiliza o **Nginx** como Proxy Reverso para orquestrar o tráfego do sistema. Essa abordagem resolve nativamente os temidos bloqueios de CORS (Cross-Origin Resource Sharing) e simplifica o deploy.

**Como funciona:**
1. **Ponto de Entrada Único**: Todo o acesso ao sistema (Web e Mobile) passa pela porta `8080` (configurada via Docker) que é gerida pelo Nginx.
2. **Distribuição de Rotas**:
   - Requisições para `/` servem os arquivos estáticos compilados do Painel Web (React).
   - Requisições para `/api/*` são interceptadas pelo Nginx e encaminhadas internamente para o Backend (NestJS) rodando de forma blindada na porta `3000` (não exposta ao host).
3. **Vantagens**:
   - O navegador enxerga o Frontend e o Backend como sendo **o mesmo domínio e porta**, não disparando bloqueios de segurança (CORS).
   - O container da API fica isolado, permitindo que a infraestrutura se escale e garantindo maior segurança.

> [!TIP]
> **Como alterar a porta principal do sistema (Nginx)?**
> Se você já possuir outra aplicação rodando na porta `8080` no seu servidor, basta abrir o arquivo `docker-compose.yml`, localizar o serviço `web` e alterar o mapeamento de portas. 
> Exemplo para mudar para a porta 9090: mude de `8080:80` para `9090:80`. Todo o restante do sistema (backend, banco) continuará abstraído sem precisar de nenhuma outra alteração!

---

## 📋 Pré-requisitos

Antes de iniciar, certifique-se de ter instalado em sua máquina:
- **Node.js** (versão 18 ou superior) - Para desenvolvimento local.
- **Docker & Docker Compose** - Obrigatório para rodar a arquitetura completa com Nginx de forma simplificada.

---

## 🏁 Guia de Execução e Deploy

O sistema agora conta com um ambiente de deploy completo via Docker Compose, empacotando o Frontend (Nginx), Backend (NestJS) e Banco de Dados (PostgreSQL) para evitar problemas de CORS e simular um ambiente de produção idêntico ao Netmap Industrial.

### 1️⃣ Inicializando a Infraestrutura (Backend + Web)

Abra um terminal na raiz do projeto (onde está o `docker-compose.yml`) e execute:

```bash
docker compose up --build -d
```

Este comando irá baixar as dependências, construir e iniciar:
1. **Banco de Dados**: PostgreSQL na porta `5433` (externa).
2. **Backend (API)**: Comunicação estritamente interna com o Docker.
3. **Frontend + Proxy Reverso (Nginx)**: Servindo a interface Web e roteando a API (evitando CORS). Disponível na porta `8080`.

- **Painel Web (React)**: Acesse `http://localhost:8080` (ou o IP local: `http://<SEU_IP>:8080`).
- **Documentação da API (Swagger)**: Acesse `http://localhost:8080/api/docs`.

---

### 2️⃣ Utilizando o Modo Vigilante (Mobile)

Para os vigilantes que estarão em campo lendo os QR Codes, há **duas opções** disponíveis. Recomendamos fortemente a **Opção A (PWA)** por dispensar a instalação de APKs.

#### Opção A: Scanner Web PWA (Recomendado)
Acesse a URL especial de rondas diretamente do navegador do tablet ou celular:
- **URL**: `https://<SEU_IP>:8443/rondas` (Exemplo: `https://192.168.1.175:8443/rondas`)
- Esse modo se auto-conecta usando a rede do **Nginx** automaticamente, garantindo isolamento total do painel de administrador.
- É possível instalar na tela inicial (Add to Home Screen) como se fosse um app nativo.

#### Opção B: Aplicativo Nativo (Expo / React Native)
O App mobile também pode ser rodado localmente e instalado.
Abra um novo terminal e navegue até a pasta `mobile`:

```bash
cd mobile
npm install
npx expo start
```
- Para testar em um **dispositivo móvel físico**:
  1. Instale o app **Expo Go** em seu celular.
  2. Escaneie o QR Code exibido no terminal.
  3. **Configuração de Acesso via Nginx**: No app (na tela de Login), clique no ícone de engrenagem `⚙️` e ajuste o **IP do Servidor** para apontar para o proxy Nginx (porta `8080` com sufixo `/api`).
     👉 **Exemplo: `http://<IP_DA_SUA_MAQUINA>:8080/api`**
  4. Salve e faça login com as credenciais do Vigilante.


---

## 🔑 Credenciais Padrão de Acesso

O sistema cria automaticamente usuários iniciais no primeiro arranque do banco de dados:

### Administrador (Acesso Completo)
- **E-mail**: `admin@ronda.com`
- **Senha**: `admin123`
- **Perfil**: `ADMIN`

### Vigilante (Acesso Restrito / PWA Scanner)
- **E-mail**: `vigilante@ronda.com`
- **Senha**: `ronda123`
- **Perfil**: `VIGILANTE`

---

## 🧪 Desenvolvimento e Testes

Caso deseje desenvolver ou debugar os módulos de forma individual fora do Docker:
- **Backend**: Em `backend/`, rode `npm run start:dev` (A API subirá na porta 3000 localmente).
- **Frontend**: Em `web/`, rode `npm run dev` (O painel subirá na porta 5173).
- **Testes (Backend)**: Em `backend/`, rode `npm run test` (Testes unitários) ou `npm run test:e2e` (Integração).

---

## 📁 Estrutura de Pastas (Deploy)

```
Ronda/
├── backend/                  # API REST (NestJS) + Dockerfile Backend
├── web/                      # Painel Admin (React) + nginx.conf + Dockerfile Web
├── mobile/                   # App Vigilante (Expo + React Native)
├── docker-compose.yml        # Orquestrador de Containers (Nginx, API, DB)
├── relatorio.pdf             # Modelo de referência
└── README.md                 # Esta documentação
```
