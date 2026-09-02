import { Test, TestingModule } from '@nestjs/testing';
import { RoutesCheckpointsService } from './routes-checkpoints.service';
import { DRIZZLE_DB } from '../drizzle/drizzle.module';
import { NotFoundException } from '@nestjs/common';

describe('RoutesCheckpointsService (Gestão de Rotas & Checkpoints)', () => {
  let service: RoutesCheckpointsService;
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
        RoutesCheckpointsService,
        {
          provide: DRIZZLE_DB,
          useValue: mockDb,
        },
      ],
    }).compile();

    service = module.get<RoutesCheckpointsService>(RoutesCheckpointsService);
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('createRoute', () => {
    it('deve criar uma nova rota com dados válidos', async () => {
      const mockDto = {
        nome: 'Rota Perímetro Leste',
        descricao: 'Ronda dos portões',
        qtdeMinimaCheckpoints: 4,
        isOrdered: true,
      };

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([{ id: 'route-new', ...mockDto }]),
        }),
      });

      const result = await service.createRoute(mockDto);
      expect(result.id).toBe('route-new');
      expect(result.qtdeMinimaCheckpoints).toBe(4);
    });
  });

  describe('createCheckpoint', () => {
    it('deve gerar hash de QR Code automaticamente ao criar checkpoint', async () => {
      const mockRoute = { id: 'route-1', nome: 'Rota 1' };
      const mockCpDto = {
        routeId: 'route-1',
        nome: 'Guarita 1',
        latitude: -23.55,
        longitude: -46.63,
        ordem: 1,
      };

      // Mock findRouteById
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockRoute]),
            orderBy: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockImplementation((val) => ({
          returning: jest.fn().mockResolvedValue([{ id: 'cp-new', ...val }]),
        })),
      });

      const result = await service.createCheckpoint(mockCpDto);
      expect(result).toHaveProperty('qrCodeHash');
      expect(result.qrCodeHash).toBeDefined();
      expect(result.qrCodeHash.length).toBeGreaterThan(10);
    });
  });
});
