"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.patrolLogsRelations = exports.patrolSessionsRelations = exports.checkpointsRelations = exports.routesRelations = exports.usersRelations = exports.patrolLogs = exports.patrolSessions = exports.checkpoints = exports.routes = exports.users = exports.patrolStatusEnum = exports.roleEnum = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
exports.roleEnum = (0, pg_core_1.pgEnum)('user_role', ['ADMIN', 'SUPERVISOR', 'VIGILANTE']);
exports.patrolStatusEnum = (0, pg_core_1.pgEnum)('patrol_status', ['IN_PROGRESS', 'COMPLETED', 'INCOMPLETE']);
exports.users = (0, pg_core_1.pgTable)('users', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    nome: (0, pg_core_1.varchar)('nome', { length: 255 }).notNull(),
    email: (0, pg_core_1.varchar)('email', { length: 255 }).notNull().unique(),
    senhaHash: (0, pg_core_1.varchar)('senha_hash', { length: 255 }).notNull(),
    role: (0, exports.roleEnum)('role').default('VIGILANTE').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
});
exports.routes = (0, pg_core_1.pgTable)('routes', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    nome: (0, pg_core_1.varchar)('nome', { length: 255 }).notNull(),
    descricao: (0, pg_core_1.text)('descricao'),
    qtdeMinimaCheckpoints: (0, pg_core_1.integer)('qtde_minima_checkpoints').notNull().default(1),
    isOrdered: (0, pg_core_1.boolean)('is_ordered').notNull().default(false),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
});
exports.checkpoints = (0, pg_core_1.pgTable)('checkpoints', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    routeId: (0, pg_core_1.uuid)('route_id').references(() => exports.routes.id, { onDelete: 'cascade' }).notNull(),
    nome: (0, pg_core_1.varchar)('nome', { length: 255 }).notNull(),
    qrCodeHash: (0, pg_core_1.varchar)('qr_code_hash', { length: 255 }).notNull().unique(),
    latitude: (0, pg_core_1.doublePrecision)('latitude').notNull(),
    longitude: (0, pg_core_1.doublePrecision)('longitude').notNull(),
    ordem: (0, pg_core_1.integer)('ordem').notNull().default(0),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
});
exports.patrolSessions = (0, pg_core_1.pgTable)('patrol_sessions', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    userId: (0, pg_core_1.uuid)('user_id').references(() => exports.users.id, { onDelete: 'cascade' }).notNull(),
    routeId: (0, pg_core_1.uuid)('route_id').references(() => exports.routes.id, { onDelete: 'cascade' }).notNull(),
    startTime: (0, pg_core_1.timestamp)('start_time').defaultNow().notNull(),
    endTime: (0, pg_core_1.timestamp)('end_time'),
    status: (0, exports.patrolStatusEnum)('status').default('IN_PROGRESS').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
});
exports.patrolLogs = (0, pg_core_1.pgTable)('patrol_logs', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    sessionId: (0, pg_core_1.uuid)('session_id').references(() => exports.patrolSessions.id, { onDelete: 'cascade' }).notNull(),
    checkpointId: (0, pg_core_1.uuid)('checkpoint_id').references(() => exports.checkpoints.id, { onDelete: 'cascade' }).notNull(),
    scannedAt: (0, pg_core_1.timestamp)('scanned_at').notNull(),
    isValidOrder: (0, pg_core_1.boolean)('is_valid_order'),
    syncStatus: (0, pg_core_1.varchar)('sync_status', { length: 50 }).default('SYNCED').notNull(),
});
exports.usersRelations = (0, drizzle_orm_1.relations)(exports.users, ({ many }) => ({
    sessions: many(exports.patrolSessions),
}));
exports.routesRelations = (0, drizzle_orm_1.relations)(exports.routes, ({ many }) => ({
    checkpoints: many(exports.checkpoints),
    sessions: many(exports.patrolSessions),
}));
exports.checkpointsRelations = (0, drizzle_orm_1.relations)(exports.checkpoints, ({ one, many }) => ({
    route: one(exports.routes, {
        fields: [exports.checkpoints.routeId],
        references: [exports.routes.id],
    }),
    logs: many(exports.patrolLogs),
}));
exports.patrolSessionsRelations = (0, drizzle_orm_1.relations)(exports.patrolSessions, ({ one, many }) => ({
    user: one(exports.users, {
        fields: [exports.patrolSessions.userId],
        references: [exports.users.id],
    }),
    route: one(exports.routes, {
        fields: [exports.patrolSessions.routeId],
        references: [exports.routes.id],
    }),
    logs: many(exports.patrolLogs),
}));
exports.patrolLogsRelations = (0, drizzle_orm_1.relations)(exports.patrolLogs, ({ one }) => ({
    session: one(exports.patrolSessions, {
        fields: [exports.patrolLogs.sessionId],
        references: [exports.patrolSessions.id],
    }),
    checkpoint: one(exports.checkpoints, {
        fields: [exports.patrolLogs.checkpointId],
        references: [exports.checkpoints.id],
    }),
}));
//# sourceMappingURL=schema.js.map