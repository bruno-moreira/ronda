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
Object.defineProperty(exports, "__esModule", { value: true });
const pglite_1 = require("@electric-sql/pglite");
const pglite_2 = require("drizzle-orm/pglite");
const schema = __importStar(require("./drizzle/schema"));
async function listCheckpoints() {
    const pglite = new pglite_1.PGlite('./pgdata');
    const db = (0, pglite_2.drizzle)(pglite, { schema });
    const cpList = await db.select().from(schema.checkpoints);
    console.log('\n--- LISTA DE CHECKPOINTS NO BANCO DE DADOS ---');
    cpList.forEach((cp, i) => {
        console.log(`#${i + 1} ID: ${cp.id} | Nome: ${cp.nome} | Hash Oficial: "${cp.qrCodeHash}" | RotaID: ${cp.routeId}`);
    });
    console.log('-----------------------------------------------\n');
    process.exit(0);
}
listCheckpoints();
//# sourceMappingURL=check-db.js.map