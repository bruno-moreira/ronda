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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncPatrolLogsDto = exports.SinglePatrolLogDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class SinglePatrolLogDto {
    localId;
    sessionId;
    checkpointId;
    qrCodeHash;
    scannedAt;
}
exports.SinglePatrolLogDto = SinglePatrolLogDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID local do log no mobile ou UUID' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SinglePatrolLogDto.prototype, "localId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID da sessão de ronda' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SinglePatrolLogDto.prototype, "sessionId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID do checkpoint ou null se buscado por qrCodeHash' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SinglePatrolLogDto.prototype, "checkpointId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'a1b2c3d4e5f6...', description: 'Hash do QR Code lido pelo mobile' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SinglePatrolLogDto.prototype, "qrCodeHash", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-08-04T11:30:00.000Z', description: 'Data/hora exata em que o QR Code foi lido offline' }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SinglePatrolLogDto.prototype, "scannedAt", void 0);
class SyncPatrolLogsDto {
    logs;
}
exports.SyncPatrolLogsDto = SyncPatrolLogsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [SinglePatrolLogDto], description: 'Array de registros de leitura efetuados offline' }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => SinglePatrolLogDto),
    __metadata("design:type", Array)
], SyncPatrolLogsDto.prototype, "logs", void 0);
//# sourceMappingURL=sync-patrol-log.dto.js.map