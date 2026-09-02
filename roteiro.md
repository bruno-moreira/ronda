Contexto Geral para a IA (AntiGravity):

Você é um Engenheiro de Software Full-Stack nível Sênior, especialista no ecossistema JavaScript/TypeScript. Vamos construir um sistema de ronda de segurança (Patrol System).
O sistema possui um Backend (NestJS + Fastify + PostgreSQL), um Web Admin (React/Next.js) e um App Mobile (Expo/React Native) com funcionamento Offline-First.
Exijo código limpo, tipagem rigorosa (TypeScript), tratamento de erros global, DTOs validados e documentação OpenAPI completa.

Fase 1: Modelagem de Banco de Dados e Setup do Backend
Gere o código inicial do backend em NestJS utilizando o adaptador Fastify.

ORM e Banco: Configure o Prisma ORM para conectar ao PostgreSQL. Crie o schema do Prisma com as seguintes tabelas:

User: (id, nome, email, senha_hash, role [ADMIN, SUPERVISOR, VIGILANTE]).

Route: (id, nome, descricao, qtde_minima_checkpoints, is_ordered).

Checkpoint: (id, route_id, nome, qr_code_hash, latitude, longitude).

PatrolSession: (id, user_id, route_id, start_time, end_time, status [IN_PROGRESS, COMPLETED, INCOMPLETE]).

PatrolLog: (id, session_id, checkpoint_id, scanned_at, is_valid_order, sync_status).

Setup OpenAPI: Configure o @nestjs/swagger no main.ts para expor a documentação na rota /api/docs.

Validação: Configure o ValidationPipe globalmente usando class-validator e class-transformer.

Fase 2: Módulos do Backend e Regra de Negócio
Implemente os módulos principais (Controller, Service, Module, DTOs).

Auth Module: Login com JWT e guards de RBAC (Role-Based Access Control) baseados nas roles do usuário.

Route & Checkpoint Module:

CRUD de rotas e checkpoints.

Endpoint para gerar o hash único que será embutido no QR Code de cada checkpoint.

Patrol Module (O Core):

Endpoint POST /patrol/sync: Recebe um array de PatrolLog gerados offline pelo mobile.

Regra de Negócio: O serviço deve validar se a quantidade de checkpoints lidos atingiu a qtde_minima_checkpoints configurada na rota. Se a rota tiver is_ordered = true, deve validar se a ordem de scanned_at bate com a ordem configurada. Retornar um relatório de sucesso/falha dos itens sincronizados.

Fase 3: Frontend Web (Painel Administrativo)
Gere a estrutura de um painel admin usando React, TailwindCSS e React Query.

Configuração de Rotas: Telas para criar rotas e adicionar checkpoints no mapa.

Geração de QR Code: Crie um componente que receba o qr_code_hash vindo da API e utilize a biblioteca qrcode.react para renderizar o QR code na tela, permitindo que o administrador imprima uma folha com os QR Codes da rota.

Gestão de Acesso: Tela de CRUD de usuários definindo quem é Vigilante (mobile) e quem é Admin (painel).

Fase 4: Mobile Offline-First com Expo
Gere a estrutura do aplicativo móvel usando Expo. O app deve funcionar sem internet no momento da ronda.

Armazenamento Local: Configure o WatermelonDB ou Expo SQLite para armazenar as Rotas e Checkpoints baixados previamente, além de uma tabela de SyncQueue (Fila de Sincronização) para os logs de leitura.

Leitura de QR Code: Utilize expo-camera para ler o QR Code. Ao ler, o app deve:

Registrar no banco local (hora exata da leitura, ID do checkpoint).

Atualizar a UI informando o vigilante de quantos checkpoints faltam.

Mecanismo de Sincronização: Crie um service ou hook utilizando @react-native-community/netinfo. Quando detectar que a internet voltou, o app deve pegar todos os registros pendentes na tabela SyncQueue e enviar para o endpoint POST /patrol/sync. Em caso de sucesso (200 OK), deletar da fila local.