"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoutesCheckpointsModule = void 0;
const common_1 = require("@nestjs/common");
const routes_checkpoints_service_1 = require("./routes-checkpoints.service");
const routes_checkpoints_controller_1 = require("./routes-checkpoints.controller");
let RoutesCheckpointsModule = class RoutesCheckpointsModule {
};
exports.RoutesCheckpointsModule = RoutesCheckpointsModule;
exports.RoutesCheckpointsModule = RoutesCheckpointsModule = __decorate([
    (0, common_1.Module)({
        controllers: [routes_checkpoints_controller_1.RoutesCheckpointsController],
        providers: [routes_checkpoints_service_1.RoutesCheckpointsService],
        exports: [routes_checkpoints_service_1.RoutesCheckpointsService],
    })
], RoutesCheckpointsModule);
//# sourceMappingURL=routes-checkpoints.module.js.map