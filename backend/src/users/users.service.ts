import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import { DRIZZLE_DB } from '../drizzle/drizzle.module';
import { users } from '../drizzle/schema';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(@Inject(DRIZZLE_DB) private db: any) {}

  async findAll() {
    return this.db
      .select({
        id: users.id,
        nome: users.nome,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users);
  }

  async findOne(id: string) {
    const userList = await this.db
      .select({
        id: users.id,
        nome: users.nome,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (userList.length === 0) {
      throw new NotFoundException('Usuário não encontrado');
    }
    return userList[0];
  }

  async create(dto: CreateUserDto) {
    const cleanEmail = dto.email.toLowerCase().trim();
    const existing = await this.db.select().from(users).where(eq(users.email, cleanEmail)).limit(1);
    if (existing.length > 0) {
      throw new ConflictException('E-mail já está em uso');
    }

    const senhaHash = await bcrypt.hash(dto.senha, 10);
    const [newUser] = await this.db
      .insert(users)
      .values({
        nome: dto.nome,
        email: cleanEmail,
        senhaHash,
        role: dto.role,
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

  async remove(id: string) {
    await this.findOne(id);
    await this.db.delete(users).where(eq(users.id, id));
    return { message: 'Usuário removido com sucesso' };
  }
}
