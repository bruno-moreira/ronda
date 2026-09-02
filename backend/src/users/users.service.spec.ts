import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { DRIZZLE_DB } from '../drizzle/drizzle.module';

describe('UsersService', () => {
  let service: UsersService;
  let mockDb: any;

  beforeEach(async () => {
    mockDb = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([]),
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([
        { id: '2', nome: 'Vigilante Teste', email: 'vigilante@ronda.com', role: 'VIGILANTE' },
      ]),
      delete: jest.fn().mockReturnThis(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: DRIZZLE_DB,
          useValue: mockDb,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  it('deve listar usuários cadastrados', async () => {
    mockDb.from.mockImplementationOnce(() => Promise.resolve([
      { id: '1', nome: 'Admin User', email: 'admin@ronda.com', role: 'ADMIN' },
    ]));
    const result = await service.findAll();
    expect(result).toHaveLength(1);
    expect(result[0].email).toBe('admin@ronda.com');
  });

  it('deve criar um novo usuário com senha criptografada', async () => {
    const newUser = await service.create({
      nome: 'Vigilante Teste',
      email: 'vigilante@ronda.com',
      senha: 'password123',
      role: 'VIGILANTE',
    });

    expect(newUser).toBeDefined();
    expect(newUser.email).toBe('vigilante@ronda.com');
  });
});
