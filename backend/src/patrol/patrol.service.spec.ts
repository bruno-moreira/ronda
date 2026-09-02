import { Test, TestingModule } from '@nestjs/testing';
import { PatrolService } from './patrol.service';
import { DRIZZLE_DB } from '../drizzle/drizzle.module';
import { NotFoundException } from '@nestjs/common';

describe('PatrolService (Regras de Negócio de Ronda)', () => {
  let service: PatrolService;
  let mockDb: any;

  beforeEach(async () => {
    mockDb = {
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatrolService,
        {
          provide: DRIZZLE_DB,
          useValue: mockDb,
        },
      ],
    }).compile();

    service = module.get<PatrolService>(PatrolService);
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('startSession', () => {
    it('deve lançar NotFoundException se a rota não existir', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(
        service.startSession('user-1', { routeId: 'invalid-route-id' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve criar uma sessão de ronda com status IN_PROGRESS', async () => {
      const mockRoute = { id: 'route-1', nome: 'Rota Teste' };
      const mockSession = {
        id: 'session-1',
        userId: 'user-1',
        routeId: 'route-1',
        status: 'IN_PROGRESS',
      };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockRoute]),
          }),
        }),
      });

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockSession]),
        }),
      });

      const result = await service.startSession('user-1', { routeId: 'route-1' });
      expect(result.status).toBe('IN_PROGRESS');
      expect(result.id).toBe('session-1');
    });
  });

  describe('syncPatrolLogs (Validação Offline & Regras de Negócio)', () => {
    it('deve marcar a sessão como COMPLETED quando atinge o número mínimo de checkpoints em rota sem ordem', async () => {
      const mockLogDto = {
        logs: [
          {
            localId: 'log-1',
            sessionId: 'session-1',
            checkpointId: 'cp-1',
            scannedAt: '2026-08-04T10:00:00.000Z',
          },
          {
            localId: 'log-2',
            sessionId: 'session-1',
            checkpointId: 'cp-2',
            scannedAt: '2026-08-04T10:05:00.000Z',
          },
        ],
      };

      const mockSession = { id: 'session-1', routeId: 'route-1' };
      const mockRoute = { id: 'route-1', qtdeMinimaCheckpoints: 2, isOrdered: false };
      const mockCheckpoints = [
        { id: 'cp-1', ordem: 1 },
        { id: 'cp-2', ordem: 2 },
      ];
      const mockLogs = [
        { id: 'l1', sessionId: 'session-1', checkpointId: 'cp-1', scannedAt: new Date('2026-08-04T10:00:00.000Z') },
        { id: 'l2', sessionId: 'session-1', checkpointId: 'cp-2', scannedAt: new Date('2026-08-04T10:05:00.000Z') },
      ];

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockResolvedValue(true),
      });

      let callCount = 0;
      let orderByCount = 0;
      mockDb.select.mockImplementation(() => ({
        from: () => ({
          where: () => ({
            limit: () => {
              callCount++;
              if (callCount === 1) return Promise.resolve([mockSession]);
              return Promise.resolve([mockRoute]);
            },
            orderBy: () => {
              orderByCount++;
              if (orderByCount === 1) return Promise.resolve(mockCheckpoints);
              return Promise.resolve(mockLogs);
            },
          }),
        }),
      }));

      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(true),
        }),
      });

      const report = await service.syncPatrolLogs(mockLogDto);
      expect(report.totalReceived).toBe(2);
      expect(report.processedCount).toBe(2);
      expect(report.sessionsSummary.length).toBe(1);
      expect(report.sessionsSummary[0].finalStatus).toBe('COMPLETED');
    });

    it('deve marcar a sessão como INCOMPLETE se os pontos forem lidos fora de ordem em rota sequencial (isOrdered = true)', async () => {
      const mockLogDto = {
        logs: [
          {
            localId: 'log-1',
            sessionId: 'session-2',
            checkpointId: 'cp-2', // Lido antes do cp-1!
            scannedAt: '2026-08-04T10:00:00.000Z',
          },
          {
            localId: 'log-2',
            sessionId: 'session-2',
            checkpointId: 'cp-1',
            scannedAt: '2026-08-04T10:05:00.000Z',
          },
        ],
      };

      const mockSession = { id: 'session-2', routeId: 'route-ordered' };
      const mockRoute = { id: 'route-ordered', qtdeMinimaCheckpoints: 2, isOrdered: true };
      const mockCheckpoints = [
        { id: 'cp-1', ordem: 1 },
        { id: 'cp-2', ordem: 2 },
      ];
      const mockLogs = [
        { id: 'l1', sessionId: 'session-2', checkpointId: 'cp-2', scannedAt: new Date('2026-08-04T10:00:00.000Z') },
        { id: 'l2', sessionId: 'session-2', checkpointId: 'cp-1', scannedAt: new Date('2026-08-04T10:05:00.000Z') },
      ];

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockResolvedValue(true),
      });

      let callCount = 0;
      let orderByCount = 0;

      mockDb.select.mockImplementation(() => ({
        from: () => ({
          where: () => ({
            limit: () => {
              callCount++;
              if (callCount === 1) return Promise.resolve([mockSession]);
              return Promise.resolve([mockRoute]);
            },
            orderBy: () => {
              orderByCount++;
              if (orderByCount === 1) return Promise.resolve(mockCheckpoints);
              return Promise.resolve(mockLogs);
            },
          }),
        }),
      }));

      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(true),
        }),
      });

      const report = await service.syncPatrolLogs(mockLogDto);
      expect(report.sessionsSummary[0].isOrderValid).toBe(false);
      expect(report.sessionsSummary[0].finalStatus).toBe('INCOMPLETE');
    });
  });
});
