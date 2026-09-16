# Roteiro de Arquitetura Base (Boilerplate)

Este roteiro serve como uma planta-baixa (blueprint) para a construção de futuras aplicações modernas, offline-first e escaláveis, abstraindo as regras de negócio. 

A arquitetura descrita aqui foi validada para ser altamente performática, focada em UX (temas dinâmicos) e com deploy facilitado de 1 clique.

---

## 1. Estrutura do Monorepo

O projeto deve ser dividido em três pastas principais na raiz, separando claramente as responsabilidades:

```text
/meu-novo-projeto
├── /backend      # API e Regras de Negócio (NestJS)
├── /web          # Painel Administrativo / Frontend (React + Vite)
├── /mobile       # Aplicativo Offline-first (Expo / React Native)
├── docker-compose.yml
└── Makefile / deploy.sh
```

---

## 2. Stack Tecnológica Base

### 2.1 Backend (API REST)
- **Framework**: NestJS (TypeScript). Arquitetura modular, injeção de dependências e escalabilidade.
- **Banco de Dados**: PostgreSQL.
- **ORM**: Drizzle ORM (tipagem forte, rápido e sem overhead de models pesados).
- **Autenticação**: JWT (JSON Web Tokens) puro e simples com `Passport`.
- **Validação**: `class-validator` e `class-transformer` em DTOs.

### 2.2 Frontend Web (Painel Admin)
- **Core**: React 19 + Vite (Rápido HMR e build otimizado).
- **Estilização**: Tailwind CSS v4.
  - *Dica UI*: Configurar `@custom-variant dark` no `index.css` para controle manual do tema Claro/Escuro através do `localStorage`.
- **Gerenciamento de Estado de Rede**: `@tanstack/react-query` (Para requisições, cache e re-fetch automático).
- **Gerenciamento de Estado Local**: Context API padrão do React (`AuthContext`, `ThemeContext`).
- **Ícones**: `lucide-react`.

### 2.3 Mobile (Offline-First App)
- **Core**: Expo (React Native).
- **Armazenamento Offline**: `expo-sqlite` para armazenar grandes volumes de dados de operação.
- **Persistência de Configurações**: `@react-native-async-storage/async-storage` (ex: IPs do servidor, tokens).
- **Sincronização Híbrida**: Um motor de sincronização (`syncEngine.ts`) que funciona em background, enfileirando requisições locais (SQLite) e descarregando na API (Axios) quando há conexão.

---

## 3. Padrões Essenciais de Desenvolvimento

### 3.1 Design Premium e Responsivo (Web)
- Sempre utilizar uma abordagem dupla de cores (`Light Mode` vs `Dark Mode`).
- **Paleta Neutra**: Usar a escala `slate` para fundos. (`bg-slate-50` para claro, `bg-slate-950` para escuro).
- **Botões e Detalhes**: Manter uma cor primária forte (ex: `blue-500` ou `indigo-500`).
- **Evitar FOUC (Flash of Unstyled Content)**: Inserir um script inline no `<head>` do `index.html` que leia o `localStorage` e aplique a classe `.dark` antes da renderização do DOM.

### 3.2 Offline-First (Mobile)
1. **Nunca dependa da nuvem para o usuário operar**.
2. No primeiro login, baixe a carga inteira de trabalho necessária para o celular (`Local Database`).
3. Todas as ações do usuário salvam localmente primeiro, garantindo que o App nunca mostre telas de "Carregando" na rua.
4. Tente enviar silenciosamente para o backend via background tasks. Se falhar, guarde na fila de sincronização.

---

## 4. Infraestrutura e Deploy Automático

A complexidade de servidores deve ser escondida do desenvolvedor e do cliente.

### 4.1 Proxy Reverso Inteligente (Nginx)
Para evitar problemas de **CORS** e simplificar o roteamento, o frontend e o backend não devem ser expostos separadamente.
- O Frontend compila os arquivos estáticos (HTML/JS/CSS).
- O Nginx serve esses arquivos na rota `/` na porta `8080`.
- O mesmo Nginx intercepta qualquer requisição para a rota `/api/` e redireciona (proxy pass) para o container do Backend.

### 4.2 Script de 1-Clique (Makefile)
Toda aplicação deve ter um `deploy.sh` protegido por um `Makefile`:
```makefile
deploy:
	docker compose down
	docker system prune -f
	docker compose build --no-cache
	docker compose up -d
```
Assim, qualquer atualização no servidor de produção se resume a digitar: `make deploy`.
