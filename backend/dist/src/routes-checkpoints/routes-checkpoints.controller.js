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
exports.RoutesCheckpointsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const routes_checkpoints_service_1 = require("./routes-checkpoints.service");
const create_route_dto_1 = require("./dto/create-route.dto");
const create_checkpoint_dto_1 = require("./dto/create-checkpoint.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
let RoutesCheckpointsController = class RoutesCheckpointsController {
    service;
    constructor(service) {
        this.service = service;
    }
    findAllRoutes() {
        return this.service.findAllRoutes();
    }
    findRouteById(id) {
        return this.service.findRouteById(id);
    }
    createRoute(dto) {
        return this.service.createRoute(dto);
    }
    deleteRoute(id) {
        return this.service.deleteRoute(id);
    }
    createCheckpoint(dto) {
        return this.service.createCheckpoint(dto);
    }
    regenerateQrHash(id) {
        return this.service.regenerateQrCodeHash(id);
    }
    deleteCheckpoint(id) {
        return this.service.deleteCheckpoint(id);
    }
};
exports.RoutesCheckpointsController = RoutesCheckpointsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Lista todas as rotas com seus checkpoints' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], RoutesCheckpointsController.prototype, "findAllRoutes", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtém rota por ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RoutesCheckpointsController.prototype, "findRouteById", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPERVISOR'),
    (0, swagger_1.ApiOperation)({ summary: 'Cria nova rota' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_route_dto_1.CreateRouteDto]),
    __metadata("design:returntype", void 0)
], RoutesCheckpointsController.prototype, "createRoute", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPERVISOR'),
    (0, swagger_1.ApiOperation)({ summary: 'Remove rota' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RoutesCheckpointsController.prototype, "deleteRoute", null);
__decorate([
    (0, common_1.Post)('checkpoints'),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPERVISOR'),
    (0, swagger_1.ApiOperation)({ summary: 'Adiciona checkpoint a uma rota e gera o hash único de QR Code' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_checkpoint_dto_1.CreateCheckpointDto]),
    __metadata("design:returntype", void 0)
], RoutesCheckpointsController.prototype, "createCheckpoint", null);
__decorate([
    (0, common_1.Patch)('checkpoints/:id/qr-code-hash'),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPERVISOR'),
    (0, swagger_1.ApiOperation)({ summary: 'Regera o hash único do QR Code para um checkpoint' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RoutesCheckpointsController.prototype, "regenerateQrHash", null);
__decorate([
    (0, common_1.Delete)('checkpoints/:id'),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPERVISOR'),
    (0, swagger_1.ApiOperation)({ summary: 'Remove checkpoint' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RoutesCheckpointsController.prototype, "deleteCheckpoint", null);
exports.RoutesCheckpointsController = RoutesCheckpointsController = __decorate([
    (0, swagger_1.ApiTags)('Routes & Checkpoints'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('routes'),
    __metadata("design:paramtypes", [routes_checkpoints_service_1.RoutesCheckpointsService])
], RoutesCheckpointsController);
//# sourceMappingURL=routes-checkpoints.controller.js.map