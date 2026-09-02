"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DrizzleModule = exports.DRIZZLE_DB = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const postgres_js_1 = require("drizzle-orm/postgres-js");
const pglite_1 = require("drizzle-orm/pglite");
const pglite_2 = require("@electric-sql/pglite");
const postgres_1 = __importDefault(require("postgres"));
const schema = __importStar(require("./schema"));
exports.DRIZZLE_DB = 'DRIZZLE_DB';
let DrizzleModule = class DrizzleModule {
};
exports.DrizzleModule = DrizzleModule;
exports.DrizzleModule = DrizzleModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        providers: [
            {
                provide: exports.DRIZZLE_DB,
                inject: [config_1.ConfigService],
                useFactory: async (configService) => {
                    const connectionString = configService.get('DATABASE_URL') ||
                        'postgres://ronda:rondapassword@localhost:5433/ronda_db';
                    try {
                        const client = (0, postgres_1.default)(connectionString, { connect_timeout: 2, max: 10 });
                        await client `SELECT 1`;
                        console.log('[DrizzleModule] Conectado com sucesso ao banco PostgreSQL via postgres.js');
                        return (0, postgres_js_1.drizzle)(client, { schema });
                    }
                    catch (e) {
                        console.warn(`[DrizzleModule] Não foi possível conectar ao PostgreSQL externo (${e.message}). Inicializando banco embutido PGlite (Zero-Config) em ./pgdata ...`);
                        const pglite = new pglite_2.PGlite('./pgdata');
                        await pglite.exec(`
            DO $$ BEGIN
              CREATE TYPE user_role AS ENUM ('ADMIN', 'SUPERVISOR', 'VIGILANTE');
            EXCEPTION WHEN duplicate_object THEN null; END $$;

            DO $$ BEGIN
              CREATE TYPE patrol_status AS ENUM ('IN_PROGRESS', 'COMPLETED', 'INCOMPLETE');
            EXCEPTION WHEN duplicate_object THEN null; END $$;

            CREATE TABLE IF NOT EXISTS users (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              nome VARCHAR(255) NOT NULL,
              email VARCHAR(255) NOT NULL UNIQUE,
              senha_hash VARCHAR(255) NOT NULL,
              role user_role NOT NULL DEFAULT 'VIGILANTE',
              created_at TIMESTAMP NOT NULL DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS routes (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              nome VARCHAR(255) NOT NULL,
              descricao TEXT,
              qtde_minima_checkpoints INTEGER NOT NULL DEFAULT 1,
              is_ordered BOOLEAN NOT NULL DEFAULT FALSE,
              created_at TIMESTAMP NOT NULL DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS checkpoints (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
              nome VARCHAR(255) NOT NULL,
              qr_code_hash VARCHAR(255) NOT NULL UNIQUE,
              latitude DOUBLE PRECISION NOT NULL,
              longitude DOUBLE PRECISION NOT NULL,
              ordem INTEGER NOT NULL DEFAULT 0,
              created_at TIMESTAMP NOT NULL DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS patrol_sessions (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
              route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
              start_time TIMESTAMP NOT NULL DEFAULT NOW(),
              end_time TIMESTAMP,
              status patrol_status NOT NULL DEFAULT 'IN_PROGRESS',
              created_at TIMESTAMP NOT NULL DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS patrol_logs (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              session_id UUID NOT NULL REFERENCES patrol_sessions(id) ON DELETE CASCADE,
              checkpoint_id UUID NOT NULL REFERENCES checkpoints(id) ON DELETE CASCADE,
              scanned_at TIMESTAMP NOT NULL,
              is_valid_order BOOLEAN,
              sync_status VARCHAR(50) NOT NULL DEFAULT 'SYNCED'
            );
          `);
                        console.log('[DrizzleModule] Banco embutido PGlite (Zero-Config) pronto com todas as tabelas!');
                        return (0, pglite_1.drizzle)(pglite, { schema });
                    }
                },
            },
        ],
        exports: [exports.DRIZZLE_DB],
    })
], DrizzleModule);
//# sourceMappingURL=drizzle.module.js.map