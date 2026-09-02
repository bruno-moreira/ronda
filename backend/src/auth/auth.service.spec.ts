import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { DRIZZLE_DB } from '../drizzle/drizzle.module';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService (Autenticação e RBAC)', () => {
  let service: AuthService;
  let mockDb: any;
  let mockJwtService: any;

  beforeEach(async () => {
    mockDb = {
      select: jest.fn(),
      insert: jest.fn(),
    };

    mockJwtService = {
      sign: jest.fn().mockReturnValue('mocked_jwt_token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: DRIZZLE_DB,
          useValue: mockDb,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('deve lançar UnauthorizedException se e-mail não for encontrado', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(
        service.login({ email: 'inexistente@ronda.com', senha: '123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('deve efetuar login e retornar access_token quando as credenciais forem válidas', async () => {
      const passwordHash = await bcrypt.hash('senha123', 10);
      const mockUser = {
        id: 'user-id-1',
        nome: 'Guarda Silva',
        email: 'guarda@ronda.com',
        senhaHash: passwordHash,
        role: 'VIGILANTE',
      };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockUser]),
          }),
        }),
      });

      const result = await service.login({ email: 'guarda@ronda.com', senha: 'senha123' });
      expect(result).toHaveProperty('access_token');
      expect(result.access_token).toBe('mocked_jwt_token');
      expect(result.user.email).toBe('guarda@ronda.com');
      expect(result.user.role).toBe('VIGILANTE');
    });
  });

  describe('register', () => {
    it('deve lançar ConflictException se o e-mail já estiver cadastrado', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ id: 'existing' }]),
          }),
        }),
      });

      await expect(
        service.register({
          nome: 'Test',
          email: 'duplicate@ronda.com',
          senha: '123',
          role: 'VIGILANTE',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });
});
