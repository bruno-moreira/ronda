import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { api } from '../services/api';
import { getPendingSyncQueue, saveToSyncQueue, flushSyncQueue } from '../services/syncEngine';
import { Camera, Map, CheckCircle2, RotateCw, AlertTriangle } from 'lucide-react';

interface Route {
  id: string;
  nome: string;
  qtdeMinimaCheckpoints: number;
  checkpoints: { id: string; nome: string; qrCodeHash: string }[];
}

export const ScannerPatrolView: React.FC = () => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  const [scannedCheckpoints, setScannedCheckpoints] = useState<string[]>([]);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    loadRoutes();
    updatePendingCount();
  }, []);

  const loadRoutes = async () => {
    try {
      const res = await api.get('/routes');
      setRoutes(res.data);
    } catch (err: any) {
      setErrorMsg('Falha ao carregar rotas. Verifique a conexão.');
    }
  };

  const updatePendingCount = () => {
    setPendingSyncCount(getPendingSyncQueue().length);
  };

  const handleStartSession = (route: Route) => {
    setSelectedRoute(route);
    setSessionId(crypto.randomUUID());
    setScannedCheckpoints([]);
    setErrorMsg('');
  };

  const handleEndSession = () => {
    stopScanner();
    setSessionId(null);
    setSelectedRoute(null);
    handleSync(); // Tenta sincronizar ao encerrar
  };

  const handleSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    const result = await flushSyncQueue();
    if (!result.success) {
      setErrorMsg(result.message);
    } else {
      setErrorMsg('');
      alert(result.message);
    }
    updatePendingCount();
    setIsSyncing(false);
  };

  const startScanner = async () => {
    if (scannerRef.current) return;
    
    // Antes de renderizar o scanner da lib, vamos testar se o navegador permite acesso à câmera
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const cameras = await Html5Qrcode.getCameras();
      if (!cameras || cameras.length === 0) {
        setErrorMsg('Nenhuma câmera encontrada no dispositivo.');
      }
    } catch (err: any) {
      console.error('Erro de permissão da câmera:', err);
      setErrorMsg(
        'Acesso à câmera bloqueado! Como este é um IP local, o navegador pode bloquear a câmera por segurança. ' +
        'DICA: No Chrome, acesse "chrome://flags/#unsafely-treat-insecure-origin-as-secure", adicione ' +
        `"${window.location.origin}" e mude para "Enabled", depois reinicie o navegador.`
      );
    }
    
    // Pequeno atraso para garantir que a div "qr-reader" renderizou
    setTimeout(() => {
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );
      
      scannerRef.current = scanner;
      
      scanner.render(
        (decodedText) => {
          onQrScanned(decodedText);
          // Opcional: pausar ou continuar o scanner após a leitura
        },
        (_error) => {
          // ignora erros de frame vazio
        }
      );
    }, 100);
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      try {
        scannerRef.current.clear();
      } catch (e) {}
      scannerRef.current = null;
    }
  };

  // Re-iniciar scanner quando abrir a câmera
  useEffect(() => {
    if (sessionId) {
      startScanner();
    } else {
      stopScanner();
    }
    return () => stopScanner();
  }, [sessionId]);

  const onQrScanned = (hash: string) => {
    if (!sessionId) return;
    
    // Procura o checkpoint na rota selecionada
    const cp = selectedRoute?.checkpoints.find(c => c.qrCodeHash === hash);
    
    // Salva na fila offline
    saveToSyncQueue({
      id: crypto.randomUUID(),
      sessionId,
      qrCodeHash: hash,
      checkpointId: cp?.id,
      scannedAt: new Date().toISOString()
    });

    setScannedCheckpoints(prev => [...prev, cp?.nome || 'Ponto Desconhecido']);
    updatePendingCount();
    
    alert(`Leitura Confirmada: ${cp?.nome || 'Ponto Desconhecido'}\n(Salvo no modo Offline)`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Camera className="w-6 h-6 text-blue-500" />
            Scanner de Ronda
          </h1>
          <p className="text-slate-400 mt-1">Realize a leitura de checkpoints (Modo PWA Offline)</p>
        </div>
        
        <button
          onClick={handleSync}
          disabled={isSyncing || pendingSyncCount === 0}
          className="bg-slate-800 hover:bg-slate-700 text-sky-400 px-4 py-2 rounded-xl flex items-center gap-2 border border-slate-700 disabled:opacity-50"
        >
          <RotateCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          Sincronizar Pendentes ({pendingSyncCount})
        </button>
      </div>

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm">{errorMsg}</p>
        </div>
      )}

      {!sessionId ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <Map className="w-5 h-5 text-indigo-400" />
            Selecione a Rota para Iniciar
          </h2>
          {routes.length === 0 ? (
            <p className="text-slate-400">Nenhuma rota disponível.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {routes.map(route => (
                <div key={route.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 hover:border-blue-500/50 transition-colors">
                  <h3 className="font-bold text-slate-200">{route.nome}</h3>
                  <p className="text-xs text-slate-400 mt-1 mb-4">Min. {route.qtdeMinimaCheckpoints} pontos</p>
                  <button
                    onClick={() => handleStartSession(route)}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-slate-950 font-semibold py-2 rounded-lg"
                  >
                    Iniciar Ronda
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center">
            <h2 className="text-lg font-semibold text-slate-200 mb-4 w-full text-center">Câmera Ativa</h2>
            
            <div id="qr-reader" className="w-full max-w-lg mx-auto overflow-hidden rounded-xl bg-black border border-slate-700 shadow-xl"></div>
            
            <button
              onClick={handleEndSession}
              className="mt-8 bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 px-6 py-3 rounded-lg font-bold w-full max-w-lg mx-auto transition-colors"
            >
              Encerrar Ronda e Sincronizar
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-blue-400" />
              Pontos Lidos ({scannedCheckpoints.length} de {selectedRoute?.checkpoints.length || 0})
            </h2>
            {scannedCheckpoints.length === 0 ? (
              <p className="text-slate-500 text-sm italic">Nenhum ponto lido nesta sessão.</p>
            ) : (
              <ul className="space-y-2">
                {scannedCheckpoints.map((cp, idx) => (
                  <li key={idx} className="bg-slate-800 px-4 py-3 rounded-lg flex items-center justify-between border border-slate-700">
                    <span className="text-slate-300 font-medium">{cp}</span>
                    <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">Salvo</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
