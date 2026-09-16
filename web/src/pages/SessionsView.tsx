import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { Activity, CheckCircle, AlertTriangle, Clock, Eye, X, MapPin, User } from 'lucide-react';

export const SessionsView: React.FC = () => {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const { data: sessionsList = [], isLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: async () => {
      const res = await api.get('/patrol/sessions');
      return res.data;
    },
    refetchInterval: 3000, // Refetch a cada 3s para monitoramento em tempo real
  });

  const { data: sessionDetails, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['sessionDetails', selectedSessionId],
    queryFn: async () => {
      if (!selectedSessionId) return null;
      const res = await api.get(`/patrol/sessions/${selectedSessionId}`);
      return res.data;
    },
    enabled: !!selectedSessionId,
  });

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Monitoramento de Rondas em Tempo Real</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Acompanhe o status de execução das rondas enviadas pelos vigilantes via aplicativo.
          </p>
        </div>
        <div className="flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-xl text-blue-400 text-xs font-bold">
          <Activity className="w-4 h-4 animate-pulse" />
          <span>Ao Vivo (Atualizando a cada 3s)</span>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-500">Carregando histórico de rondas...</div>
      ) : sessionsList.length === 0 ? (
        <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-12 text-center text-slate-500 dark:text-slate-400">
          <Activity className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Nenhuma ronda iniciada ainda</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
            Quando os vigilantes iniciarem e sincronizarem leituras pelo aplicativo mobile, as rondas aparecerão aqui automaticamente.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4">Rota / Rondante</th>
                  <th className="px-6 py-4">Início</th>
                  <th className="px-6 py-4">Término</th>
                  <th className="px-6 py-4">Status da Ronda</th>
                  <th className="px-6 py-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {sessionsList.map((session: any) => (
                  <tr key={session.id} className="hover:bg-slate-100 dark:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-1.5">
                        <MapPin className="w-3.5 h-3.5 text-blue-400" />
                        <span>{session.routeNome || `Rota #${session.routeId.substring(0, 8)}`}</span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-1 mt-0.5">
                        <User className="w-3 h-3 text-slate-500" />
                        <span>{session.userNome || 'Vigilante / Rondante'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                      {new Date(session.startTime).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                      {session.endTime ? new Date(session.endTime).toLocaleString('pt-BR') : 'Em andamento'}
                    </td>
                    <td className="px-6 py-4">
                      {session.status === 'COMPLETED' ? (
                        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>COMPLETA (VÁLIDA)</span>
                        </span>
                      ) : session.status === 'INCOMPLETE' ? (
                        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>INCOMPLETA / INVÁLIDA</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <Clock className="w-3.5 h-3.5 animate-spin" />
                          <span>EM ANDAMENTO</span>
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedSessionId(session.id)}
                        className="inline-flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-blue-400 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border border-slate-300 dark:border-slate-700"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ver Logs</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL DETALHES DE LOGS DA SESSÃO */}
      {selectedSessionId && (
        <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-2xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Logs de Leitura - {sessionDetails?.routeNome || 'Ronda'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Rondante: {sessionDetails?.userNome || 'Vigilante'}</p>
              </div>
              <button
                onClick={() => setSelectedSessionId(null)}
                className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isLoadingDetails ? (
              <div className="py-8 text-center text-slate-500">Buscando leituras...</div>
            ) : !sessionDetails || !sessionDetails.logs || sessionDetails.logs.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400 text-center py-6">Nenhum log registrado para esta sessão ainda.</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {sessionDetails.logs.map((log: any, idx: number) => (
                  <div
                    key={log.id}
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-3.5 flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-400 font-bold text-xs flex items-center justify-center border border-blue-500/20">
                        #{idx + 1}
                      </span>
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                          {log.checkpointNome || `Checkpoint #${log.checkpointOrdem || idx + 1}`}
                        </p>
                        <p className="text-xs text-slate-500 font-mono">
                          Lido em: {new Date(log.scannedAt).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <div>
                      {log.isValidOrder === false ? (
                        <span className="text-[10px] bg-rose-500/10 text-rose-400 px-2 py-1 rounded font-bold border border-rose-500/20">
                          Fora de Ordem
                        </span>
                      ) : (
                        <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-1 rounded font-bold border border-blue-500/20">
                          Ordem Válida
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
