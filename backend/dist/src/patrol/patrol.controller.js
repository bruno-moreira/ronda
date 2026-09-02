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
exports.PatrolController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const patrol_service_1 = require("./patrol.service");
const start_patrol_dto_1 = require("./dto/start-patrol.dto");
const sync_patrol_log_dto_1 = require("./dto/sync-patrol-log.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let PatrolController = class PatrolController {
    patrolService;
    constructor(patrolService) {
        this.patrolService = patrolService;
    }
    startSession(req, dto) {
        return this.patrolService.startSession(req.user.userId, dto);
    }
    getSessions(req) {
        const userId = req.user.role === 'VIGILANTE' ? req.user.userId : undefined;
        return this.patrolService.getActiveSessions(userId);
    }
    getSessionDetails(id) {
        return this.patrolService.getSessionDetails(id);
    }
    getReport(req, body) {
        const query = req.query || {};
        return this.patrolService.getPatrolReport({
            startDate: query.startDate,
            endDate: query.endDate,
            routeId: query.routeId,
            userId: query.userId,
        });
    }
    syncLogs(dto) {
        return this.patrolService.syncPatrolLogs(dto);
    }
};
exports.PatrolController = PatrolController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Post)('start'),
    (0, swagger_1.ApiOperation)({ summary: 'Inicia uma nova sessão de ronda para o usuário autenticado' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, start_patrol_dto_1.StartPatrolDto]),
    __metadata("design:returntype", void 0)
], PatrolController.prototype, "startSession", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Get)('sessions'),
    (0, swagger_1.ApiOperation)({ summary: 'Lista sessões de ronda' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PatrolController.prototype, "getSessions", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Get)('sessions/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtém detalhes de uma sessão de ronda por ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PatrolController.prototype, "getSessionDetails", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Get)('reports'),
    (0, swagger_1.ApiOperation)({ summary: 'Gera dados para o Relatório Coletas (Filtros: período, rota, rondante)' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], PatrolController.prototype, "getReport", null);
__decorate([
    (0, common_1.Post)('sync'),
    (0, swagger_1.ApiOperation)({
        summary: 'Core: Recebe array de PatrolLog gerados offline pelo mobile e valida a ronda (Acesso Livre para Dispositivos de Campo)',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Relatório detalhado do resultado do sync e encerramento/validação de sessões',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [sync_patrol_log_dto_1.SyncPatrolLogsDto]),
    __metadata("design:returntype", void 0)
], PatrolController.prototype, "syncLogs", null);
exports.PatrolController = PatrolController = __decorate([
    (0, swagger_1.ApiTags)('Patrol Core'),
    (0, common_1.Controller)('patrol'),
    __metadata("design:paramtypes", [patrol_service_1.PatrolService])
], PatrolController);
//# sourceMappingURL=patrol.controller.js.map