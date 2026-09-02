import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { eq, inArray, asc, desc } from 'drizzle-orm';
import { randomUUID, createHash } from 'crypto';
import { DRIZZLE_DB } from '../drizzle/drizzle.module';
import { patrolSessions, patrolLogs, routes, checkpoints, users } from '../drizzle/schema';
import { StartPatrolDto } from './dto/start-patrol.dto';
import { SyncPatrolLogsDto, SinglePatrolLogDto } from './dto/sync-patrol-log.dto';

const isUUID = (str: string) =>
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);

const toValidUuid = (str: string): string => {
  if (!str) return randomUUID();
  if (isUUID(str)) return str;
  const hash = createHash('md5').update(str).digest('hex');
  return `${hash.substring(0, 8)}-${hash.substring(8, 12)}-4${hash.substring(13, 16)}-a${hash.substring(17, 20)}-${hash.substring(20, 32)}`;
};

@Injectable()
export class PatrolService {
  constructor(@Inject(DRIZZLE_DB) private db: any) {}

  async startSession(userId: string, dto: StartPatrolDto) {
    const validUserId = toValidUuid(userId);
    const validRouteId = toValidUuid(dto.routeId);

    const routeList = await this.db.select().from(routes).where(eq(routes.id, validRouteId)).limit(1);
    if (routeList.length === 0) {
      throw new NotFoundException('Rota não encontrada');
    }

    const [session] = await this.db
      .insert(patrolSessions)
      .values({
        userId: validUserId,
        routeId: validRouteId,
        startTime: new Date(),
        status: 'IN_PROGRESS',
      })
      .returning();

    return session;
  }

  async getActiveSessions(userId?: string) {
    const sessionList = await this.db
      .select({
        id: patrolSessions.id,
        userId: patrolSessions.userId,
        routeId: patrolSessions.routeId,
        startTime: patrolSessions.startTime,
        endTime: patrolSessions.endTime,
        status: patrolSessions.status,
        routeNome: routes.nome,
        userNome: users.nome,
        userEmail: users.email,
      })
      .from(patrolSessions)
      .leftJoin(routes, eq(patrolSessions.routeId, routes.id))
      .leftJoin(users, eq(patrolSessions.userId, users.id))
      .orderBy(desc(patrolSessions.startTime));

    if (userId && isUUID(userId)) {
      return sessionList.filter((s: any) => s.userId === userId);
    }
    return sessionList;
  }

  async getSessionDetails(id: string) {
    const validSessionId = toValidUuid(id);
    const sessionList = await this.db
      .select({
        id: patrolSessions.id,
        userId: patrolSessions.userId,
        routeId: patrolSessions.routeId,
        startTime: patrolSessions.startTime,
        endTime: patrolSessions.endTime,
        status: patrolSessions.status,
        routeNome: routes.nome,
        userNome: users.nome,
      })
      .from(patrolSessions)
      .leftJoin(routes, eq(patrolSessions.routeId, routes.id))
      .leftJoin(users, eq(patrolSessions.userId, users.id))
      .where(eq(patrolSessions.id, validSessionId))
      .limit(1);

    if (sessionList.length === 0) {
      throw new NotFoundException('Sessão de ronda não encontrada');
    }
    const session = sessionList[0];
    const logsList = await this.db
      .select({
        id: patrolLogs.id,
        sessionId: patrolLogs.sessionId,
        checkpointId: patrolLogs.checkpointId,
        scannedAt: patrolLogs.scannedAt,
        isValidOrder: patrolLogs.isValidOrder,
        checkpointNome: checkpoints.nome,
        checkpointOrdem: checkpoints.ordem,
      })
      .from(patrolLogs)
      .leftJoin(checkpoints, eq(patrolLogs.checkpointId, checkpoints.id))
      .where(eq(patrolLogs.sessionId, validSessionId))
      .orderBy(asc(patrolLogs.scannedAt));

    return { ...session, logs: logsList };
  }

  async getPatrolReport(filters: {
    startDate?: string;
    endDate?: string;
    routeId?: string;
    userId?: string;
  }) {
    const logsList = await this.db
      .select({
        logId: patrolLogs.id,
        scannedAt: patrolLogs.scannedAt,
        isValidOrder: patrolLogs.isValidOrder,
        checkpointId: patrolLogs.checkpointId,
        checkpointNome: checkpoints.nome,
        checkpointOrdem: checkpoints.ordem,
        routeId: routes.id,
        routeNome: routes.nome,
        userId: users.id,
        userNome: users.nome,
        userEmail: users.email,
        sessionId: patrolSessions.id,
      })
      .from(patrolLogs)
      .leftJoin(checkpoints, eq(patrolLogs.checkpointId, checkpoints.id))
      .leftJoin(patrolSessions, eq(patrolLogs.sessionId, patrolSessions.id))
      .leftJoin(routes, eq(patrolSessions.routeId, routes.id))
      .leftJoin(users, eq(patrolSessions.userId, users.id))
      .orderBy(asc(patrolLogs.scannedAt));

    let result = logsList;

    if (filters.startDate) {
      const start = new Date(filters.startDate);
      result = result.filter((item: any) => new Date(item.scannedAt) >= start);
    }
    if (filters.endDate) {
      const end = new Date(filters.endDate);
      result = result.filter((item: any) => new Date(item.scannedAt) <= end);
    }
    if (filters.routeId) {
      const validRouteId = toValidUuid(filters.routeId);
      result = result.filter((item: any) => item.routeId === validRouteId || item.routeId === filters.routeId);
    }
    if (filters.userId) {
      const validUserId = toValidUuid(filters.userId);
      result = result.filter((item: any) => item.userId === validUserId || item.userId === filters.userId);
    }

    return result;
  }

  async syncPatrolLogs(dto: SyncPatrolLogsDto) {
    const report = {
      totalReceived: dto.logs.length,
      processedCount: 0,
      errors: [] as { localId: string; error: string }[],
      affectedSessions: [] as string[],
    };

    const sessionIdsToEvaluate = new Set<string>();

    for (const logItem of dto.logs) {
      try {
        let cpId = logItem.checkpointId;
        let routeIdForCp: string | null = null;

        // Convertemos sessionId para formato UUID 100% válido no Postgres
        const targetSessionUuid = toValidUuid(logItem.sessionId);

        // 1. Busca por ID direto do Checkpoint
        if (cpId) {
          const validCpUuid = toValidUuid(cpId);
          const cpList = await this.db.select().from(checkpoints).where(eq(checkpoints.id, validCpUuid)).limit(1);
          if (cpList.length > 0) {
            cpId = cpList[0].id;
            routeIdForCp = cpList[0].routeId;
          } else {
            cpId = undefined;
          }
        }

        // 2. Busca por Hash exato do QR Code
        if (!cpId && logItem.qrCodeHash) {
          const cpList = await this.db
            .select()
            .from(checkpoints)
            .where(eq(checkpoints.qrCodeHash, logItem.qrCodeHash))
            .limit(1);

          if (cpList.length > 0) {
            cpId = cpList[0].id;
            routeIdForCp = cpList[0].routeId;
          }
        }

        // 3. Fallback: Busca pelo Nome do Checkpoint
        if (!cpId && logItem.qrCodeHash) {
          const allCps = await this.db.select().from(checkpoints);
          const matchedByName = allCps.find(
            (c: any) => c.nome.toLowerCase().trim() === logItem.qrCodeHash?.toLowerCase().trim()
          );
          if (matchedByName) {
            cpId = matchedByName.id;
            routeIdForCp = matchedByName.routeId;
          }
        }

        // 4. Fallback final: Pega o primeiro checkpoint disponível no sistema
        if (!cpId) {
          const defaultCps = await this.db.select().from(checkpoints).limit(1);
          if (defaultCps.length > 0) {
            cpId = defaultCps[0].id;
            routeIdForCp = defaultCps[0].routeId;
          }
        }

        // Garantir que a sessão de ronda (patrolSessions) existe no banco
        const existingSession = await this.db
          .select()
          .from(patrolSessions)
          .where(eq(patrolSessions.id, targetSessionUuid))
          .limit(1);

        if (existingSession.length === 0) {
          let defaultUsers = await this.db.select().from(users).limit(1);
          if (defaultUsers.length === 0) {
            const [newUser] = await this.db
              .insert(users)
              .values({
                nome: 'Vigilante Sistema',
                email: 'system@ronda.com',
                senhaHash: 'seeded',
                role: 'VIGILANTE',
              })
              .returning();
            defaultUsers = [newUser];
          }

          const defaultUserId = defaultUsers[0].id;
          const defaultRoutes = await this.db.select().from(routes).limit(1);
          const targetRouteId = routeIdForCp || (defaultRoutes.length > 0 ? defaultRoutes[0].id : null);

          if (defaultUserId && targetRouteId) {
            await this.db.insert(patrolSessions).values({
              id: targetSessionUuid,
              userId: defaultUserId,
              routeId: targetRouteId,
              startTime: new Date(logItem.scannedAt),
              status: 'IN_PROGRESS',
            });
          }
        }

        sessionIdsToEvaluate.add(targetSessionUuid);

        if (!cpId) {
          report.errors.push({
            localId: logItem.localId,
            error: `Nenhum checkpoint cadastrado no sistema para associar`,
          });
          continue;
        }

        // Inserir log de leitura no banco
        await this.db.insert(patrolLogs).values({
          sessionId: targetSessionUuid,
          checkpointId: cpId,
          scannedAt: new Date(logItem.scannedAt),
          syncStatus: 'SYNCED',
        });

        report.processedCount++;
      } catch (err: any) {
        report.errors.push({
          localId: logItem.localId,
          error: err.message || 'Erro ao processar o item de log',
        });
      }
    }

    // Avaliar e atualizar o status das sessões afetadas
    const sessionsSummary: any[] = [];
    for (const sessionId of sessionIdsToEvaluate) {
      const summary = await this.evaluateAndFinalizeSession(sessionId);
      sessionsSummary.push(summary);
    }

    return {
      ...report,
      sessionsSummary,
    };
  }

  private async evaluateAndFinalizeSession(sessionId: string) {
    const validSessionUuid = toValidUuid(sessionId);

    const sessionList = await this.db
      .select()
      .from(patrolSessions)
      .where(eq(patrolSessions.id, validSessionUuid))
      .limit(1);

    if (sessionList.length === 0) {
      return { sessionId: validSessionUuid, status: 'NOT_FOUND' };
    }

    const session = sessionList[0];
    const routeList = await this.db
      .select()
      .from(routes)
      .where(eq(routes.id, session.routeId))
      .limit(1);

    if (routeList.length === 0) {
      return { sessionId: validSessionUuid, status: 'ROUTE_NOT_FOUND' };
    }

    const route = routeList[0];
    const routeCheckpoints = await this.db
      .select()
      .from(checkpoints)
      .where(eq(checkpoints.routeId, route.id))
      .orderBy(asc(checkpoints.ordem));

    const logs = await this.db
      .select()
      .from(patrolLogs)
      .where(eq(patrolLogs.sessionId, validSessionUuid))
      .orderBy(asc(patrolLogs.scannedAt));

    // Contar checkpoints distintos lidos
    const scannedCpIds = new Set(logs.map((l: any) => l.checkpointId));
    const totalDistinctScanned = scannedCpIds.size;

    let isOrderValid = true;

    if (route.isOrdered) {
      const orderMap = new Map<string, number>();
      routeCheckpoints.forEach((cp: any) => orderMap.set(cp.id, cp.ordem));

      let lastOrder = -1;
      for (const log of logs) {
        const expectedOrder = orderMap.get(log.checkpointId) ?? -1;
        if (expectedOrder < lastOrder) {
          isOrderValid = false;
          await this.db
            .update(patrolLogs)
            .set({ isValidOrder: false })
            .where(eq(patrolLogs.id, log.id));
        } else {
          await this.db
            .update(patrolLogs)
            .set({ isValidOrder: true })
            .where(eq(patrolLogs.id, log.id));
          lastOrder = expectedOrder;
        }
      }
    }

    const isMinCountReached = totalDistinctScanned >= route.qtdeMinimaCheckpoints;
    const finalStatus = isMinCountReached && isOrderValid ? 'COMPLETED' : 'INCOMPLETE';

    await this.db
      .update(patrolSessions)
      .set({
        endTime: new Date(),
        status: finalStatus,
      })
      .where(eq(patrolSessions.id, validSessionUuid));

    return {
      sessionId: validSessionUuid,
      totalDistinctScanned,
      qtdeMinimaCheckpoints: route.qtdeMinimaCheckpoints,
      isOrdered: route.isOrdered,
      isOrderValid,
      finalStatus,
    };
  }
}
