"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatrolService = void 0;
const common_1 = require("@nestjs/common");
const drizzle_orm_1 = require("drizzle-orm");
const crypto_1 = require("crypto");
const drizzle_module_1 = require("../drizzle/drizzle.module");
const schema_1 = require("../drizzle/schema");
const isUUID = (str) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);
const toValidUuid = (str) => {
    if (!str)
        return (0, crypto_1.randomUUID)();
    if (isUUID(str))
        return str;
    const hash = (0, crypto_1.createHash)('md5').update(str).digest('hex');
    return `${hash.substring(0, 8)}-${hash.substring(8, 12)}-4${hash.substring(13, 16)}-a${hash.substring(17, 20)}-${hash.substring(20, 32)}`;
};
let PatrolService = class PatrolService {
    db;
    constructor(db) {
        this.db = db;
    }
    async startSession(userId, dto) {
        const validUserId = toValidUuid(userId);
        const validRouteId = toValidUuid(dto.routeId);
        const routeList = await this.db.select().from(schema_1.routes).where((0, drizzle_orm_1.eq)(schema_1.routes.id, validRouteId)).limit(1);
        if (routeList.length === 0) {
            throw new common_1.NotFoundException('Rota não encontrada');
        }
        const [session] = await this.db
            .insert(schema_1.patrolSessions)
            .values({
            userId: validUserId,
            routeId: validRouteId,
            startTime: new Date(),
            status: 'IN_PROGRESS',
        })
            .returning();
        return session;
    }
    async getActiveSessions(userId) {
        const sessionList = await this.db
            .select({
            id: schema_1.patrolSessions.id,
            userId: schema_1.patrolSessions.userId,
            routeId: schema_1.patrolSessions.routeId,
            startTime: schema_1.patrolSessions.startTime,
            endTime: schema_1.patrolSessions.endTime,
            status: schema_1.patrolSessions.status,
            routeNome: schema_1.routes.nome,
            userNome: schema_1.users.nome,
            userEmail: schema_1.users.email,
        })
            .from(schema_1.patrolSessions)
            .leftJoin(schema_1.routes, (0, drizzle_orm_1.eq)(schema_1.patrolSessions.routeId, schema_1.routes.id))
            .leftJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.patrolSessions.userId, schema_1.users.id))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.patrolSessions.startTime));
        if (userId && isUUID(userId)) {
            return sessionList.filter((s) => s.userId === userId);
        }
        return sessionList;
    }
    async getSessionDetails(id) {
        const validSessionId = toValidUuid(id);
        const sessionList = await this.db
            .select({
            id: schema_1.patrolSessions.id,
            userId: schema_1.patrolSessions.userId,
            routeId: schema_1.patrolSessions.routeId,
            startTime: schema_1.patrolSessions.startTime,
            endTime: schema_1.patrolSessions.endTime,
            status: schema_1.patrolSessions.status,
            routeNome: schema_1.routes.nome,
            userNome: schema_1.users.nome,
        })
            .from(schema_1.patrolSessions)
            .leftJoin(schema_1.routes, (0, drizzle_orm_1.eq)(schema_1.patrolSessions.routeId, schema_1.routes.id))
            .leftJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.patrolSessions.userId, schema_1.users.id))
            .where((0, drizzle_orm_1.eq)(schema_1.patrolSessions.id, validSessionId))
            .limit(1);
        if (sessionList.length === 0) {
            throw new common_1.NotFoundException('Sessão de ronda não encontrada');
        }
        const session = sessionList[0];
        const logsList = await this.db
            .select({
            id: schema_1.patrolLogs.id,
            sessionId: schema_1.patrolLogs.sessionId,
            checkpointId: schema_1.patrolLogs.checkpointId,
            scannedAt: schema_1.patrolLogs.scannedAt,
            isValidOrder: schema_1.patrolLogs.isValidOrder,
            checkpointNome: schema_1.checkpoints.nome,
            checkpointOrdem: schema_1.checkpoints.ordem,
        })
            .from(schema_1.patrolLogs)
            .leftJoin(schema_1.checkpoints, (0, drizzle_orm_1.eq)(schema_1.patrolLogs.checkpointId, schema_1.checkpoints.id))
            .where((0, drizzle_orm_1.eq)(schema_1.patrolLogs.sessionId, validSessionId))
            .orderBy((0, drizzle_orm_1.asc)(schema_1.patrolLogs.scannedAt));
        return { ...session, logs: logsList };
    }
    async getPatrolReport(filters) {
        const logsList = await this.db
            .select({
            logId: schema_1.patrolLogs.id,
            scannedAt: schema_1.patrolLogs.scannedAt,
            isValidOrder: schema_1.patrolLogs.isValidOrder,
            checkpointId: schema_1.patrolLogs.checkpointId,
            checkpointNome: schema_1.checkpoints.nome,
            checkpointOrdem: schema_1.checkpoints.ordem,
            routeId: schema_1.routes.id,
            routeNome: schema_1.routes.nome,
            userId: schema_1.users.id,
            userNome: schema_1.users.nome,
            userEmail: schema_1.users.email,
            sessionId: schema_1.patrolSessions.id,
        })
            .from(schema_1.patrolLogs)
            .leftJoin(schema_1.checkpoints, (0, drizzle_orm_1.eq)(schema_1.patrolLogs.checkpointId, schema_1.checkpoints.id))
            .leftJoin(schema_1.patrolSessions, (0, drizzle_orm_1.eq)(schema_1.patrolLogs.sessionId, schema_1.patrolSessions.id))
            .leftJoin(schema_1.routes, (0, drizzle_orm_1.eq)(schema_1.patrolSessions.routeId, schema_1.routes.id))
            .leftJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.patrolSessions.userId, schema_1.users.id))
            .orderBy((0, drizzle_orm_1.asc)(schema_1.patrolLogs.scannedAt));
        let result = logsList;
        if (filters.startDate) {
            const start = new Date(filters.startDate);
            result = result.filter((item) => new Date(item.scannedAt) >= start);
        }
        if (filters.endDate) {
            const end = new Date(filters.endDate);
            result = result.filter((item) => new Date(item.scannedAt) <= end);
        }
        if (filters.routeId) {
            const validRouteId = toValidUuid(filters.routeId);
            result = result.filter((item) => item.routeId === validRouteId || item.routeId === filters.routeId);
        }
        if (filters.userId) {
            const validUserId = toValidUuid(filters.userId);
            result = result.filter((item) => item.userId === validUserId || item.userId === filters.userId);
        }
        return result;
    }
    async syncPatrolLogs(dto) {
        const report = {
            totalReceived: dto.logs.length,
            processedCount: 0,
            errors: [],
            affectedSessions: [],
        };
        const sessionIdsToEvaluate = new Set();
        for (const logItem of dto.logs) {
            try {
                let cpId = logItem.checkpointId;
                let routeIdForCp = null;
                const targetSessionUuid = toValidUuid(logItem.sessionId);
                if (cpId) {
                    const validCpUuid = toValidUuid(cpId);
                    const cpList = await this.db.select().from(schema_1.checkpoints).where((0, drizzle_orm_1.eq)(schema_1.checkpoints.id, validCpUuid)).limit(1);
                    if (cpList.length > 0) {
                        cpId = cpList[0].id;
                        routeIdForCp = cpList[0].routeId;
                    }
                    else {
                        cpId = undefined;
                    }
                }
                if (!cpId && logItem.qrCodeHash) {
                    const cpList = await this.db
                        .select()
                        .from(schema_1.checkpoints)
                        .where((0, drizzle_orm_1.eq)(schema_1.checkpoints.qrCodeHash, logItem.qrCodeHash))
                        .limit(1);
                    if (cpList.length > 0) {
                        cpId = cpList[0].id;
                        routeIdForCp = cpList[0].routeId;
                    }
                }
                if (!cpId && logItem.qrCodeHash) {
                    const allCps = await this.db.select().from(schema_1.checkpoints);
                    const matchedByName = allCps.find((c) => c.nome.toLowerCase().trim() === logItem.qrCodeHash?.toLowerCase().trim());
                    if (matchedByName) {
                        cpId = matchedByName.id;
                        routeIdForCp = matchedByName.routeId;
                    }
                }
                if (!cpId) {
                    const defaultCps = await this.db.select().from(schema_1.checkpoints).limit(1);
                    if (defaultCps.length > 0) {
                        cpId = defaultCps[0].id;
                        routeIdForCp = defaultCps[0].routeId;
                    }
                }
                const existingSession = await this.db
                    .select()
                    .from(schema_1.patrolSessions)
                    .where((0, drizzle_orm_1.eq)(schema_1.patrolSessions.id, targetSessionUuid))
                    .limit(1);
                if (existingSession.length === 0) {
                    let defaultUsers = await this.db.select().from(schema_1.users).limit(1);
                    if (defaultUsers.length === 0) {
                        const [newUser] = await this.db
                            .insert(schema_1.users)
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
                    const defaultRoutes = await this.db.select().from(schema_1.routes).limit(1);
                    const targetRouteId = routeIdForCp || (defaultRoutes.length > 0 ? defaultRoutes[0].id : null);
                    if (defaultUserId && targetRouteId) {
                        await this.db.insert(schema_1.patrolSessions).values({
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
                await this.db.insert(schema_1.patrolLogs).values({
                    sessionId: targetSessionUuid,
                    checkpointId: cpId,
                    scannedAt: new Date(logItem.scannedAt),
                    syncStatus: 'SYNCED',
                });
                report.processedCount++;
            }
            catch (err) {
                report.errors.push({
                    localId: logItem.localId,
                    error: err.message || 'Erro ao processar o item de log',
                });
            }
        }
        const sessionsSummary = [];
        for (const sessionId of sessionIdsToEvaluate) {
            const summary = await this.evaluateAndFinalizeSession(sessionId);
            sessionsSummary.push(summary);
        }
        return {
            ...report,
            sessionsSummary,
        };
    }
    async evaluateAndFinalizeSession(sessionId) {
        const validSessionUuid = toValidUuid(sessionId);
        const sessionList = await this.db
            .select()
            .from(schema_1.patrolSessions)
            .where((0, drizzle_orm_1.eq)(schema_1.patrolSessions.id, validSessionUuid))
            .limit(1);
        if (sessionList.length === 0) {
            return { sessionId: validSessionUuid, status: 'NOT_FOUND' };
        }
        const session = sessionList[0];
        const routeList = await this.db
            .select()
            .from(schema_1.routes)
            .where((0, drizzle_orm_1.eq)(schema_1.routes.id, session.routeId))
            .limit(1);
        if (routeList.length === 0) {
            return { sessionId: validSessionUuid, status: 'ROUTE_NOT_FOUND' };
        }
        const route = routeList[0];
        const routeCheckpoints = await this.db
            .select()
            .from(schema_1.checkpoints)
            .where((0, drizzle_orm_1.eq)(schema_1.checkpoints.routeId, route.id))
            .orderBy((0, drizzle_orm_1.asc)(schema_1.checkpoints.ordem));
        const logs = await this.db
            .select()
            .from(schema_1.patrolLogs)
            .where((0, drizzle_orm_1.eq)(schema_1.patrolLogs.sessionId, validSessionUuid))
            .orderBy((0, drizzle_orm_1.asc)(schema_1.patrolLogs.scannedAt));
        const scannedCpIds = new Set(logs.map((l) => l.checkpointId));
        const totalDistinctScanned = scannedCpIds.size;
        let isOrderValid = true;
        if (route.isOrdered) {
            const orderMap = new Map();
            routeCheckpoints.forEach((cp) => orderMap.set(cp.id, cp.ordem));
            let lastOrder = -1;
            for (const log of logs) {
                const expectedOrder = orderMap.get(log.checkpointId) ?? -1;
                if (expectedOrder < lastOrder) {
                    isOrderValid = false;
                    await this.db
                        .update(schema_1.patrolLogs)
                        .set({ isValidOrder: false })
                        .where((0, drizzle_orm_1.eq)(schema_1.patrolLogs.id, log.id));
                }
                else {
                    await this.db
                        .update(schema_1.patrolLogs)
                        .set({ isValidOrder: true })
                        .where((0, drizzle_orm_1.eq)(schema_1.patrolLogs.id, log.id));
                    lastOrder = expectedOrder;
                }
            }
        }
        const isMinCountReached = totalDistinctScanned >= route.qtdeMinimaCheckpoints;
        const finalStatus = isMinCountReached && isOrderValid ? 'COMPLETED' : 'INCOMPLETE';
        await this.db
            .update(schema_1.patrolSessions)
            .set({
            endTime: new Date(),
            status: finalStatus,
        })
            .where((0, drizzle_orm_1.eq)(schema_1.patrolSessions.id, validSessionUuid));
        return {
            sessionId: validSessionUuid,
            totalDistinctScanned,
            qtdeMinimaCheckpoints: route.qtdeMinimaCheckpoints,
            isOrdered: route.isOrdered,
            isOrderValid,
            finalStatus,
        };
    }
};
exports.PatrolService = PatrolService;
exports.PatrolService = PatrolService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(drizzle_module_1.DRIZZLE_DB)),
    __metadata("design:paramtypes", [Object])
], PatrolService);
//# sourceMappingURL=patrol.service.js.map