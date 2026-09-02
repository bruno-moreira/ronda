import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';

export interface CachedRoute {
  id: string;
  nome: string;
  descricao?: string;
  qtdeMinimaCheckpoints: number;
  isOrdered: number; // 0 or 1
}

export interface CachedCheckpoint {
  id: string;
  routeId: string;
  nome: string;
  qrCodeHash: string;
  latitude: number;
  longitude: number;
  ordem: number;
}

export interface SyncQueueItem {
  id: string;
  sessionId: string;
  checkpointId?: string;
  qrCodeHash?: string;
  scannedAt: string;
}

let dbInstance: SQLite.SQLiteDatabase | null = null;
let useMemoryFallback = Platform.OS === 'web';

// Armazenamento em memória para ambiente Web ou caso SQLite nativo falhe
let memoryRoutes: CachedRoute[] = [];
let memoryCheckpoints: CachedCheckpoint[] = [];
let memorySyncQueue: SyncQueueItem[] = [];

export const getDB = async () => {
  if (useMemoryFallback) return null;
  if (!dbInstance) {
    try {
      dbInstance = await SQLite.openDatabaseAsync('ronda_offline.db');
    } catch (e) {
      console.warn('[DB] SQLite nativo não disponível, usando fallback em memória:', e);
      useMemoryFallback = true;
      return null;
    }
  }
  return dbInstance;
};

export const initDatabase = async () => {
  try {
    const db = await getDB();
    if (db) {
      await db.execAsync(`
        PRAGMA journal_mode = WAL;

        CREATE TABLE IF NOT EXISTS cached_routes (
          id TEXT PRIMARY KEY NOT NULL,
          nome TEXT NOT NULL,
          descricao TEXT,
          qtdeMinimaCheckpoints INTEGER NOT NULL,
          isOrdered INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS cached_checkpoints (
          id TEXT PRIMARY KEY NOT NULL,
          routeId TEXT NOT NULL,
          nome TEXT NOT NULL,
          qrCodeHash TEXT NOT NULL,
          latitude REAL NOT NULL,
          longitude REAL NOT NULL,
          ordem INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS sync_queue (
          id TEXT PRIMARY KEY NOT NULL,
          sessionId TEXT NOT NULL,
          checkpointId TEXT,
          qrCodeHash TEXT,
          scannedAt TEXT NOT NULL
        );
      `);
      console.log('[DB] SQLite nativo inicializado com sucesso.');
    } else {
      console.log('[DB] Usando armazenamento local em memória (Modo Web/Fallback).');
    }
  } catch (err) {
    console.warn('[DB] Erro ao inicializar SQLite nativo, alternando para memória:', err);
    useMemoryFallback = true;
  }
};

export const cacheRoutes = async (routes: any[]) => {
  try {
    const db = await getDB();
    if (db && !useMemoryFallback) {
      await db.execAsync('DELETE FROM cached_routes; DELETE FROM cached_checkpoints;');
      for (const r of routes) {
        await db.runAsync(
          `INSERT INTO cached_routes (id, nome, descricao, qtdeMinimaCheckpoints, isOrdered) VALUES (?, ?, ?, ?, ?);`,
          [r.id, r.nome, r.descricao || '', r.qtdeMinimaCheckpoints, r.isOrdered ? 1 : 0]
        );

        if (r.checkpoints && Array.isArray(r.checkpoints)) {
          for (const cp of r.checkpoints) {
            await db.runAsync(
              `INSERT INTO cached_checkpoints (id, routeId, nome, qrCodeHash, latitude, longitude, ordem) VALUES (?, ?, ?, ?, ?, ?, ?);`,
              [cp.id, cp.routeId, cp.nome, cp.qrCodeHash, cp.latitude, cp.longitude, cp.ordem ?? 0]
            );
          }
        }
      }
      return;
    }
  } catch (err) {
    console.warn('[DB] Erro no cache SQLite, salvando em memória:', err);
    useMemoryFallback = true;
  }

  // Memory Fallback
  memoryRoutes = routes.map((r) => ({
    id: r.id,
    nome: r.nome,
    descricao: r.descricao || '',
    qtdeMinimaCheckpoints: r.qtdeMinimaCheckpoints,
    isOrdered: r.isOrdered ? 1 : 0,
  }));

  memoryCheckpoints = [];
  routes.forEach((r) => {
    if (r.checkpoints && Array.isArray(r.checkpoints)) {
      r.checkpoints.forEach((cp: any) => {
        memoryCheckpoints.push({
          id: cp.id,
          routeId: cp.routeId,
          nome: cp.nome,
          qrCodeHash: cp.qrCodeHash,
          latitude: cp.latitude,
          longitude: cp.longitude,
          ordem: cp.ordem ?? 0,
        });
      });
    }
  });
};

export const getCachedRoutes = async (): Promise<CachedRoute[]> => {
  try {
    const db = await getDB();
    if (db && !useMemoryFallback) {
      return await db.getAllAsync<CachedRoute>('SELECT * FROM cached_routes;');
    }
  } catch (e) {
    useMemoryFallback = true;
  }
  return memoryRoutes;
};

export const getCachedCheckpoints = async (routeId: string): Promise<CachedCheckpoint[]> => {
  try {
    const db = await getDB();
    if (db && !useMemoryFallback) {
      return await db.getAllAsync<CachedCheckpoint>(
        'SELECT * FROM cached_checkpoints WHERE routeId = ? ORDER BY ordem ASC;',
        [routeId]
      );
    }
  } catch (e) {
    useMemoryFallback = true;
  }
  return memoryCheckpoints.filter((cp) => cp.routeId === routeId).sort((a, b) => a.ordem - b.ordem);
};

export const findCheckpointByHash = async (hash: string): Promise<CachedCheckpoint | null> => {
  try {
    const db = await getDB();
    if (db && !useMemoryFallback) {
      const result = await db.getFirstAsync<CachedCheckpoint>(
        'SELECT * FROM cached_checkpoints WHERE qrCodeHash = ?;',
        [hash]
      );
      return result || null;
    }
  } catch (e) {
    useMemoryFallback = true;
  }
  return memoryCheckpoints.find((cp) => cp.qrCodeHash === hash) || null;
};

export const insertSyncQueue = async (
  sessionId: string,
  checkpointId?: string,
  qrCodeHash?: string
) => {
  const id = `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const scannedAt = new Date().toISOString();
  const newItem: SyncQueueItem = { id, sessionId, checkpointId, qrCodeHash, scannedAt };

  try {
    const db = await getDB();
    if (db && !useMemoryFallback) {
      await db.runAsync(
        `INSERT INTO sync_queue (id, sessionId, checkpointId, qrCodeHash, scannedAt) VALUES (?, ?, ?, ?, ?);`,
        [id, sessionId, checkpointId || null, qrCodeHash || null, scannedAt]
      );
      return newItem;
    }
  } catch (e) {
    useMemoryFallback = true;
  }

  memorySyncQueue.push(newItem);
  return newItem;
};

export const getPendingSyncQueue = async (): Promise<SyncQueueItem[]> => {
  try {
    const db = await getDB();
    if (db && !useMemoryFallback) {
      return await db.getAllAsync<SyncQueueItem>('SELECT * FROM sync_queue;');
    }
  } catch (e) {
    useMemoryFallback = true;
  }
  return memorySyncQueue;
};

export const deleteFromSyncQueue = async (ids: string[]) => {
  if (ids.length === 0) return;
  try {
    const db = await getDB();
    if (db && !useMemoryFallback) {
      const placeholders = ids.map(() => '?').join(',');
      await db.runAsync(`DELETE FROM sync_queue WHERE id IN (${placeholders});`, ids);
      return;
    }
  } catch (e) {
    useMemoryFallback = true;
  }
  memorySyncQueue = memorySyncQueue.filter((item) => !ids.includes(item.id));
};
