import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, asc } from 'drizzle-orm';
import { randomBytes, createHash } from 'crypto';
import { DRIZZLE_DB } from '../drizzle/drizzle.module';
import { routes, checkpoints } from '../drizzle/schema';
import { CreateRouteDto } from './dto/create-route.dto';
import { CreateCheckpointDto } from './dto/create-checkpoint.dto';

@Injectable()
export class RoutesCheckpointsService {
  constructor(@Inject(DRIZZLE_DB) private db: any) {}

  // Rotas
  async createRoute(dto: CreateRouteDto) {
    const [newRoute] = await this.db
      .insert(routes)
      .values({
        nome: dto.nome,
        descricao: dto.descricao,
        qtdeMinimaCheckpoints: dto.qtdeMinimaCheckpoints,
        isOrdered: dto.isOrdered,
      })
      .returning();
    return newRoute;
  }

  async findAllRoutes() {
    const allRoutes = await this.db.select().from(routes);
    const routesWithCheckpoints = await Promise.all(
      allRoutes.map(async (route: any) => {
        const routeCheckpoints = await this.db
          .select()
          .from(checkpoints)
          .where(eq(checkpoints.routeId, route.id))
          .orderBy(asc(checkpoints.ordem));
        return { ...route, checkpoints: routeCheckpoints };
      }),
    );
    return routesWithCheckpoints;
  }

  async findRouteById(id: string) {
    const found = await this.db.select().from(routes).where(eq(routes.id, id)).limit(1);
    if (found.length === 0) {
      throw new NotFoundException('Rota não encontrada');
    }
    const routeCheckpoints = await this.db
      .select()
      .from(checkpoints)
      .where(eq(checkpoints.routeId, id))
      .orderBy(asc(checkpoints.ordem));

    return { ...found[0], checkpoints: routeCheckpoints };
  }

  async deleteRoute(id: string) {
    await this.findRouteById(id);
    await this.db.delete(routes).where(eq(routes.id, id));
    return { message: 'Rota e checkpoints associados removidos' };
  }

  // Checkpoints
  async createCheckpoint(dto: CreateCheckpointDto) {
    // Validar rota
    await this.findRouteById(dto.routeId);

    const qrCodeHash = this.generateQrHash(dto.routeId, dto.nome);

    const [newCp] = await this.db
      .insert(checkpoints)
      .values({
        routeId: dto.routeId,
        nome: dto.nome,
        qrCodeHash,
        latitude: dto.latitude,
        longitude: dto.longitude,
        ordem: dto.ordem ?? 0,
      })
      .returning();

    return newCp;
  }

  async regenerateQrCodeHash(checkpointId: string) {
    const cp = await this.db.select().from(checkpoints).where(eq(checkpoints.id, checkpointId)).limit(1);
    if (cp.length === 0) {
      throw new NotFoundException('Checkpoint não encontrado');
    }
    const newHash = this.generateQrHash(cp[0].routeId, cp[0].nome);
    const [updated] = await this.db
      .update(checkpoints)
      .set({ qrCodeHash: newHash })
      .where(eq(checkpoints.id, checkpointId))
      .returning();
    return updated;
  }

  async deleteCheckpoint(id: string) {
    await this.db.delete(checkpoints).where(eq(checkpoints.id, id));
    return { message: 'Checkpoint removido com sucesso' };
  }

  private generateQrHash(routeId: string, nome: string): string {
    const randomSeed = randomBytes(16).toString('hex');
    return createHash('sha256')
      .update(`RONDA:${routeId}:${nome}:${randomSeed}:${Date.now()}`)
      .digest('hex');
  }
}
