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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcrypt"));
const drizzle_orm_1 = require("drizzle-orm");
const drizzle_module_1 = require("../drizzle/drizzle.module");
const schema_1 = require("../drizzle/schema");
let AuthService = class AuthService {
    db;
    jwtService;
    constructor(db, jwtService) {
        this.db = db;
        this.jwtService = jwtService;
    }
    async onModuleInit() {
        try {
            const existingUsers = await this.db.select().from(schema_1.users).limit(1);
            if (existingUsers.length === 0) {
                const hash = await bcrypt.hash('admin123', 10);
                await this.db.insert(schema_1.users).values({
                    nome: 'Administrador do Sistema',
                    email: 'admin@ronda.com',
                    senhaHash: hash,
                    role: 'ADMIN',
                });
                console.log('User Admin criado por padrão: admin@ronda.com / admin123');
            }
        }
        catch (e) {
            console.error('Erro ao verificar/criar admin inicial:', e.message);
        }
    }
    async login(loginDto) {
        const { email, senha } = loginDto;
        let userList = [];
        try {
            userList = await this.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.email, email.toLowerCase().trim())).limit(1);
        }
        catch (e) {
            console.error('[AuthService Error] Falha de comunicação com o PostgreSQL:', e.message);
            throw new common_1.InternalServerErrorException('Erro ao acessar o banco de dados PostgreSQL. Certifique-se de que o Postgres está rodando (docker compose up -d) e que o schema foi criado (npm run db:push).');
        }
        if (userList.length === 0) {
            throw new common_1.UnauthorizedException('Credenciais inválidas');
        }
        const user = userList[0];
        const isPasswordValid = await bcrypt.compare(senha, user.senhaHash);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Credenciais inválidas');
        }
        const payload = {
            sub: user.id,
            email: user.email,
            nome: user.nome,
            role: user.role,
        };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                nome: user.nome,
                email: user.email,
                role: user.role,
            },
        };
    }
    async register(registerDto) {
        const { nome, email, senha, role } = registerDto;
        const cleanEmail = email.toLowerCase().trim();
        const existingUsers = await this.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.email, cleanEmail)).limit(1);
        if (existingUsers.length > 0) {
            throw new common_1.ConflictException('E-mail já cadastrado no sistema');
        }
        const senhaHash = await bcrypt.hash(senha, 10);
        const [newUser] = await this.db
            .insert(schema_1.users)
            .values({
            nome,
            email: cleanEmail,
            senhaHash,
            role,
        })
            .returning({
            id: schema_1.users.id,
            nome: schema_1.users.nome,
            email: schema_1.users.email,
            role: schema_1.users.role,
            createdAt: schema_1.users.createdAt,
        });
        return newUser;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(drizzle_module_1.DRIZZLE_DB)),
    __metadata("design:paramtypes", [Object, jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map