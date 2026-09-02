import { Test, TestingModule } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './../src/app.module';

describe('App & Integration Endpoints (e2e)', () => {
  let app: NestFastifyApplication;
  let authToken: string;
  let createdRouteId: string;
  let createdCheckpointId: string;
  let createdCheckpointHash: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /ping (Health Check Público)', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/ping',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body.status).toBe('ok');
  });

  it('POST /auth/login (Autenticação Admin)', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: 'admin@ronda.com',
        senha: 'admin123',
      },
    });

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.payload);
    expect(body).toHaveProperty('access_token');
    expect(body.user.email).toBe('admin@ronda.com');
    authToken = body.access_token;
  });

  it('POST /routes (Criação de Rota E2E)', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/routes',
      headers: {
        authorization: `Bearer ${authToken}`,
      },
      payload: {
        nome: 'Rota Teste E2E',
        descricao: 'Rota criada durante o teste de integração',
        qtdeMinimaCheckpoints: 1,
        isOrdered: true,
      },
    });

    expect(response.statusCode).toBe(201);
    const route = JSON.parse(response.payload);
    expect(route).toHaveProperty('id');
    createdRouteId = route.id;
  });

  it('POST /routes/checkpoints (Criação de Checkpoint E2E)', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/routes/checkpoints',
      headers: {
        authorization: `Bearer ${authToken}`,
      },
      payload: {
        routeId: createdRouteId,
        nome: 'Ponto Guarita E2E',
        latitude: -14.86,
        longitude: -40.84,
        ordem: 1,
      },
    });

    expect(response.statusCode).toBe(201);
    const cp = JSON.parse(response.payload);
    expect(cp).toHaveProperty('id');
    expect(cp).toHaveProperty('qrCodeHash');
    createdCheckpointId = cp.id;
    createdCheckpointHash = cp.qrCodeHash;
  });

  it('GET /routes (Listagem de Rotas Autenticada)', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/routes',
      headers: {
        authorization: `Bearer ${authToken}`,
      },
    });

    expect(response.statusCode).toBe(200);
    const routesList = JSON.parse(response.payload);
    expect(Array.isArray(routesList)).toBe(true);
    expect(routesList.length).toBeGreaterThanOrEqual(1);
  });

  it('POST /patrol/sync (Sincronização Offline Híbrida)', async () => {
    const mockSessionUuid = '123e4567-e89b-12d3-a456-426614174000';
    const response = await app.inject({
      method: 'POST',
      url: '/patrol/sync',
      payload: {
        logs: [
          {
            localId: `e2e_log_1`,
            sessionId: mockSessionUuid,
            checkpointId: createdCheckpointId,
            qrCodeHash: createdCheckpointHash,
            scannedAt: new Date().toISOString(),
          },
        ],
      },
    });

    const body = JSON.parse(response.payload);
    expect(response.statusCode).toBe(201);
    expect(body).toHaveProperty('totalReceived', 1);
    expect(body.processedCount).toBe(1);
    expect(body.sessionsSummary.length).toBeGreaterThanOrEqual(1);
    expect(body.sessionsSummary[0]).toHaveProperty('finalStatus');
  });
});
