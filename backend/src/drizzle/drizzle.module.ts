import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle as drizzlePostgres } from 'drizzle-orm/postgres-js';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';
import { PGlite } from '@electric-sql/pglite';
import postgres from 'postgres';
import * as schema from './schema';

export const DRIZZLE_DB = 'DRIZZLE_DB';

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE_DB,
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const connectionString =
          configService.get<string>('DATABASE_URL') ||
          'postgres://ronda:rondapassword@localhost:5433/ronda_db';

        // Tentar conexão com o PostgreSQL externo primeiro
        try {
          const client = postgres(connectionString, { connect_timeout: 2, max: 10 });
          // Testar conexão simples
          await client`SELECT 1`;
          console.log('[DrizzleModule] Conectado com sucesso ao banco PostgreSQL via postgres.js');
          return drizzlePostgres(client, { schema });
        } catch (e: any) {
          console.warn(
            `[DrizzleModule] Não foi possível conectar ao PostgreSQL externo (${e.message}). Inicializando banco embutido PGlite (Zero-Config) em ./pgdata ...`,
          );

          const pglite = new PGlite('./pgdata');

          // Criar tabelas e enums automaticamente no PGlite
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
          return drizzlePglite(pglite, { schema });
        }
      },
    },
  ],
  exports: [DRIZZLE_DB],
})
export class DrizzleModule {}
