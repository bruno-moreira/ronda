import { PGlite } from '@electric-sql/pglite';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';
import * as schema from './drizzle/schema';

async function listCheckpoints() {
  const pglite = new PGlite('./pgdata');
  const db = drizzlePglite(pglite, { schema });

  const cpList = await db.select().from(schema.checkpoints);
  console.log('\n--- LISTA DE CHECKPOINTS NO BANCO DE DADOS ---');
  cpList.forEach((cp: any, i: number) => {
    console.log(`#${i + 1} ID: ${cp.id} | Nome: ${cp.nome} | Hash Oficial: "${cp.qrCodeHash}" | RotaID: ${cp.routeId}`);
  });
  console.log('-----------------------------------------------\n');
  process.exit(0);
}

listCheckpoints();
