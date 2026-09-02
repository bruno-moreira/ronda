import { Injectable, Inject, UnauthorizedException, ConflictException, InternalServerErrorException, OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { DRIZZLE_DB } from '../drizzle/drizzle.module';
import { users } from '../drizzle/schema';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    @Inject(DRIZZLE_DB) private db: any,
    private jwtService: JwtService,
  ) {}

  async onModuleInit() {
    // Seed admin inicial se o banco estiver vazio
    try {
      const existingUsers = await this.db.select().from(users).limit(1);
      if (existingUsers.length === 0) {
        const hash = await bcrypt.hash('admin123', 10);
        await this.db.insert(users).values({
          nome: 'Administrador do Sistema',
          email: 'admin@ronda.com',
          senhaHash: hash,
          role: 'ADMIN',
        });
        console.log('User Admin criado por padrão: admin@ronda.com / admin123');
      }
    } catch (e) {
      console.error('Erro ao verificar/criar admin inicial:', e.message);
    }
  }

  async login(loginDto: LoginDto) {
    const { email, senha } = loginDto;
    let userList: any[] = [];
    try {
      userList = await this.db.select().from(users).where(eq(users.email, email.toLowerCase().trim())).limit(1);
    } catch (e: any) {
      console.error('[AuthService Error] Falha de comunicação com o PostgreSQL:', e.message);
      throw new InternalServerErrorException(
        'Erro ao acessar o banco de dados PostgreSQL. Certifique-se de que o Postgres está rodando (docker compose up -d) e que o schema foi criado (npm run db:push).',
      );
    }

    if (userList.length === 0) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const user = userList[0];
    const isPasswordValid = await bcrypt.compare(senha, user.senhaHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      nome: user.nome,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    const { nome, email, senha, role } = registerDto;
    const cleanEmail = email.toLowerCase().trim();

    const existingUsers = await this.db.select().from(users).where(eq(users.email, cleanEmail)).limit(1);
    if (existingUsers.length > 0) {
      throw new ConflictException('E-mail já cadastrado no sistema');
    }

    const senhaHash = await bcrypt.hash(senha, 10);
    const [newUser] = await this.db
      .insert(users)
      .values({
        nome,
        email: cleanEmail,
        senhaHash,
        role,
      })
      .returning({
        id: users.id,
        nome: users.nome,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      });

    return newUser;
  }
}
