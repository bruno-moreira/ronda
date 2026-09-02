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
exports.RoutesCheckpointsService = void 0;
const common_1 = require("@nestjs/common");
const drizzle_orm_1 = require("drizzle-orm");
const crypto_1 = require("crypto");
const drizzle_module_1 = require("../drizzle/drizzle.module");
const schema_1 = require("../drizzle/schema");
let RoutesCheckpointsService = class RoutesCheckpointsService {
    db;
    constructor(db) {
        this.db = db;
    }
    async createRoute(dto) {
        const [newRoute] = await this.db
            .insert(schema_1.routes)
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
        const allRoutes = await this.db.select().from(schema_1.routes);
        const routesWithCheckpoints = await Promise.all(allRoutes.map(async (route) => {
            const routeCheckpoints = await this.db
                .select()
                .from(schema_1.checkpoints)
                .where((0, drizzle_orm_1.eq)(schema_1.checkpoints.routeId, route.id))
                .orderBy((0, drizzle_orm_1.asc)(schema_1.checkpoints.ordem));
            return { ...route, checkpoints: routeCheckpoints };
        }));
        return routesWithCheckpoints;
    }
    async findRouteById(id) {
        const found = await this.db.select().from(schema_1.routes).where((0, drizzle_orm_1.eq)(schema_1.routes.id, id)).limit(1);
        if (found.length === 0) {
            throw new common_1.NotFoundException('Rota não encontrada');
        }
        const routeCheckpoints = await this.db
            .select()
            .from(schema_1.checkpoints)
            .where((0, drizzle_orm_1.eq)(schema_1.checkpoints.routeId, id))
            .orderBy((0, drizzle_orm_1.asc)(schema_1.checkpoints.ordem));
        return { ...found[0], checkpoints: routeCheckpoints };
    }
    async deleteRoute(id) {
        await this.findRouteById(id);
        await this.db.delete(schema_1.routes).where((0, drizzle_orm_1.eq)(schema_1.routes.id, id));
        return { message: 'Rota e checkpoints associados removidos' };
    }
    async createCheckpoint(dto) {
        await this.findRouteById(dto.routeId);
        const qrCodeHash = this.generateQrHash(dto.routeId, dto.nome);
        const [newCp] = await this.db
            .insert(schema_1.checkpoints)
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
    async regenerateQrCodeHash(checkpointId) {
        const cp = await this.db.select().from(schema_1.checkpoints).where((0, drizzle_orm_1.eq)(schema_1.checkpoints.id, checkpointId)).limit(1);
        if (cp.length === 0) {
            throw new common_1.NotFoundException('Checkpoint não encontrado');
        }
        const newHash = this.generateQrHash(cp[0].routeId, cp[0].nome);
        const [updated] = await this.db
            .update(schema_1.checkpoints)
            .set({ qrCodeHash: newHash })
            .where((0, drizzle_orm_1.eq)(schema_1.checkpoints.id, checkpointId))
            .returning();
        return updated;
    }
    async deleteCheckpoint(id) {
        await this.db.delete(schema_1.checkpoints).where((0, drizzle_orm_1.eq)(schema_1.checkpoints.id, id));
        return { message: 'Checkpoint removido com sucesso' };
    }
    generateQrHash(routeId, nome) {
        const randomSeed = (0, crypto_1.randomBytes)(16).toString('hex');
        return (0, crypto_1.createHash)('sha256')
            .update(`RONDA:${routeId}:${nome}:${randomSeed}:${Date.now()}`)
            .digest('hex');
    }
};
exports.RoutesCheckpointsService = RoutesCheckpointsService;
exports.RoutesCheckpointsService = RoutesCheckpointsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(drizzle_module_1.DRIZZLE_DB)),
    __metadata("design:paramtypes", [Object])
], RoutesCheckpointsService);
//# sourceMappingURL=routes-checkpoints.service.js.map