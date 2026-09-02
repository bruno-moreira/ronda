import { pgTable, uuid, varchar, text, integer, boolean, timestamp, doublePrecision, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const roleEnum = pgEnum('user_role', ['ADMIN', 'SUPERVISOR', 'VIGILANTE']);
export const patrolStatusEnum = pgEnum('patrol_status', ['IN_PROGRESS', 'COMPLETED', 'INCOMPLETE']);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  nome: varchar('nome', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  senhaHash: varchar('senha_hash', { length: 255 }).notNull(),
  role: roleEnum('role').default('VIGILANTE').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const routes = pgTable('routes', {
  id: uuid('id').defaultRandom().primaryKey(),
  nome: varchar('nome', { length: 255 }).notNull(),
  descricao: text('descricao'),
  qtdeMinimaCheckpoints: integer('qtde_minima_checkpoints').notNull().default(1),
  isOrdered: boolean('is_ordered').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const checkpoints = pgTable('checkpoints', {
  id: uuid('id').defaultRandom().primaryKey(),
  routeId: uuid('route_id').references(() => routes.id, { onDelete: 'cascade' }).notNull(),
  nome: varchar('nome', { length: 255 }).notNull(),
  qrCodeHash: varchar('qr_code_hash', { length: 255 }).notNull().unique(),
  latitude: doublePrecision('latitude').notNull(),
  longitude: doublePrecision('longitude').notNull(),
  ordem: integer('ordem').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const patrolSessions = pgTable('patrol_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  routeId: uuid('route_id').references(() => routes.id, { onDelete: 'cascade' }).notNull(),
  startTime: timestamp('start_time').defaultNow().notNull(),
  endTime: timestamp('end_time'),
  status: patrolStatusEnum('status').default('IN_PROGRESS').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const patrolLogs = pgTable('patrol_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id').references(() => patrolSessions.id, { onDelete: 'cascade' }).notNull(),
  checkpointId: uuid('checkpoint_id').references(() => checkpoints.id, { onDelete: 'cascade' }).notNull(),
  scannedAt: timestamp('scanned_at').notNull(),
  isValidOrder: boolean('is_valid_order'),
  syncStatus: varchar('sync_status', { length: 50 }).default('SYNCED').notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(patrolSessions),
}));

export const routesRelations = relations(routes, ({ many }) => ({
  checkpoints: many(checkpoints),
  sessions: many(patrolSessions),
}));

export const checkpointsRelations = relations(checkpoints, ({ one, many }) => ({
  route: one(routes, {
    fields: [checkpoints.routeId],
    references: [routes.id],
  }),
  logs: many(patrolLogs),
}));

export const patrolSessionsRelations = relations(patrolSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [patrolSessions.userId],
    references: [users.id],
  }),
  route: one(routes, {
    fields: [patrolSessions.routeId],
    references: [routes.id],
  }),
  logs: many(patrolLogs),
}));

export const patrolLogsRelations = relations(patrolLogs, ({ one }) => ({
  session: one(patrolSessions, {
    fields: [patrolLogs.sessionId],
    references: [patrolSessions.id],
  }),
  checkpoint: one(checkpoints, {
    fields: [patrolLogs.checkpointId],
    references: [checkpoints.id],
  }),
}));
