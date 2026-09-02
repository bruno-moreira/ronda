import NetInfo from '@react-native-community/netinfo';
import { getPendingSyncQueue, deleteFromSyncQueue } from './db';
import { api, getCurrentServerUrl } from './apiService';

let isSyncing = false;

export const flushSyncQueue = async () => {
  if (isSyncing) return;
  try {
    isSyncing = true;
    const pendingLogs = await getPendingSyncQueue();
    if (pendingLogs.length === 0) {
      console.log('[SyncEngine] Fila de sincronização vazia. Nenhum item pendente.');
      return;
    }

    console.log(`[SyncEngine] Enviando ${pendingLogs.length} registro(s) pendente(s) para o servidor local (${getCurrentServerUrl()})...`);

    const payload = {
      logs: pendingLogs.map((item) => {
        const logObj: any = {
          localId: item.id,
          sessionId: item.sessionId,
          scannedAt: item.scannedAt,
        };
        if (item.checkpointId) {
          logObj.checkpointId = item.checkpointId;
        }
        if (item.qrCodeHash) {
          logObj.qrCodeHash = item.qrCodeHash;
        }
        return logObj;
      }),
    };

    const res = await api.post('/patrol/sync', payload);

    if (res.status === 200 || res.status === 201) {
      console.log('[SyncEngine] Sincronização com o servidor local concluída com sucesso:', res.data);

      // Deletar da fila local apenas os itens sincronizados
      const syncedIds = pendingLogs.map((item) => item.id);
      await deleteFromSyncQueue(syncedIds);
    }
  } catch (error: any) {
    const errorMsg = error.response?.data?.message || error.message;
    console.warn(`[SyncEngine] Falha ao sincronizar com o servidor local (${getCurrentServerUrl()}):`, errorMsg);
  } finally {
    isSyncing = false;
  }
};

export const startNetworkSyncListener = () => {
  return NetInfo.addEventListener((state) => {
    // Para redes locais/intranet, basta estar conectado à rede Wi-Fi/LAN (não exige internet WAN externa)
    if (state.isConnected !== false) {
      console.log('[SyncEngine] Conexão com a rede local detectada. Disparando sincronização...');
      flushSyncQueue();
    }
  });
};
