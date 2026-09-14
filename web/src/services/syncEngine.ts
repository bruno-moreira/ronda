import { api } from './api';

export interface PendingLog {
  id: string; // uuid
  sessionId: string;
  checkpointId?: string;
  qrCodeHash?: string;
  scannedAt: string;
}

const SYNC_QUEUE_KEY = 'ronda_sync_queue';

export const getPendingSyncQueue = (): PendingLog[] => {
  const data = localStorage.getItem(SYNC_QUEUE_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
};

export const saveToSyncQueue = (log: PendingLog) => {
  const currentQueue = getPendingSyncQueue();
  currentQueue.push(log);
  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(currentQueue));
};

export const removeFromSyncQueue = (ids: string[]) => {
  const currentQueue = getPendingSyncQueue();
  const newQueue = currentQueue.filter((log) => !ids.includes(log.id));
  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(newQueue));
};

export const flushSyncQueue = async () => {
  const pendingLogs = getPendingSyncQueue();
  if (pendingLogs.length === 0) return { success: true, message: 'Fila vazia.' };

  try {
    const payload = {
      logs: pendingLogs.map((item) => {
        const logObj: any = {
          localId: item.id,
          sessionId: item.sessionId,
          scannedAt: item.scannedAt,
        };
        if (item.checkpointId) logObj.checkpointId = item.checkpointId;
        if (item.qrCodeHash) logObj.qrCodeHash = item.qrCodeHash;
        return logObj;
      }),
    };

    const res = await api.post('/patrol/sync', payload);

    if (res.status === 200 || res.status === 201) {
      const syncedIds = pendingLogs.map((item) => item.id);
      removeFromSyncQueue(syncedIds);
      return { success: true, message: `Sincronizados ${syncedIds.length} registros com sucesso!` };
    }
    throw new Error('Falha na resposta do servidor.');
  } catch (error: any) {
    const errorMsg = error.response?.data?.message || error.message;
    return { success: false, message: `Erro na sincronização: ${errorMsg}` };
  }
};
