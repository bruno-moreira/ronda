import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { QRCodePrintSheet } from '../components/QRCodePrintSheet';
import { Plus, MapPin, QrCode, Trash2, RefreshCw, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';

export const RoutesView: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedRouteForPrint, setSelectedRouteForPrint] = useState<any | null>(null);
  const [showAddRouteModal, setShowAddRouteModal] = useState(false);
  const [addingCpRouteId, setAddingCpRouteId] = useState<string | null>(null);

  // Form de Nova Rota
  const [nomeRota, setNomeRota] = useState('');
  const [descricaoRota, setDescricaoRota] = useState('');
  const [qtdeMin, setQtdeMin] = useState(3);
  const [isOrdered, setIsOrdered] = useState(true);

  // Form de Novo Checkpoint
  const [nomeCp, setNomeCp] = useState('');
  const [latCp, setLatCp] = useState(-23.55052);
  const [lngCp, setLngCp] = useState(-46.633308);
  const [ordemCp, setOrdemCp] = useState(1);

  // Query das Rotas
  const { data: routesList = [], isLoading } = useQuery({
    queryKey: ['routes'],
    queryFn: async () => {
      const res = await api.get('/routes');
      return res.data;
    },
  });

  // Mutations
  const createRouteMutation = useMutation({
    mutationFn: async () => {
      await api.post('/routes', {
        nome: nomeRota,
        descricao: descricaoRota,
        qtdeMinimaCheckpoints: Number(qtdeMin),
        isOrdered,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      setShowAddRouteModal(false);
      setNomeRota('');
      setDescricaoRota('');
    },
  });

  const createCpMutation = useMutation({
    mutationFn: async () => {
      await api.post('/routes/checkpoints', {
        routeId: addingCpRouteId,
        nome: nomeCp,
        latitude: Number(latCp),
        longitude: Number(lngCp),
        ordem: Number(ordemCp),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      setAddingCpRouteId(null);
      setNomeCp('');
    },
  });

  const deleteRouteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/routes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
    },
  });

  const deleteCpMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/routes/checkpoints/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
    },
  });

  const regenHashMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/routes/checkpoints/${id}/qr-code-hash`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Gestão de Rotas & Checkpoints</h2>
          <p className="text-sm text-slate-400">
            Cadastre rotas de vigilância, defina ordens e gere folhas com QR Codes para fixação.
          </p>
        </div>
        <button
          onClick={() => setShowAddRouteModal(true)}
          className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20 text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Rota</span>
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-500">Carregando rotas...</div>
      ) : routesList.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-12 text-center text-slate-400">
          <Layers className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-200">Nenhuma rota cadastrada</h3>
          <p className="text-sm text-slate-400 max-w-sm mx-auto mt-1">
            Clique no botão acima para cadastrar a primeira rota de ronda do seu sistema.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {routesList.map((route: any) => (
            <div
              key={route.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-bold text-slate-100">{route.nome}</h3>
                    {route.isOrdered ? (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Ordem Obrigatória</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Livre Escolha</span>
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400 mt-1">
                    {route.descricao || 'Sem descrição cadastrada'}
                  </p>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-slate-400">
                    <span>
                      Mínimo de Checkpoints: <strong className="text-slate-200">{route.qtdeMinimaCheckpoints}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Total de Pontos: <strong className="text-emerald-400">{route.checkpoints?.length || 0}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setSelectedRouteForPrint(route)}
                    className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition-all"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Folha QR Code</span>
                  </button>

                  <button
                    onClick={() => {
                      setAddingCpRouteId(route.id);
                      setOrdemCp((route.checkpoints?.length || 0) + 1);
                    }}
                    className="flex items-center space-x-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-3.5 py-2 rounded-xl text-xs font-bold transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Checkpoint</span>
                  </button>

                  <button
                    onClick={() => deleteRouteMutation.mutate(route.id)}
                    className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                    title="Excluir Rota"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* LISTA DE CHECKPOINTS DA ROTA */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Checkpoints Cadastrados
                </h4>
                {(!route.checkpoints || route.checkpoints.length === 0) ? (
                  <p className="text-xs text-slate-500 italic py-2">
                    Nenhum checkpoint adicionado a esta rota ainda.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {route.checkpoints.map((cp: any, idx: number) => (
                      <div
                        key={cp.id}
                        className="bg-slate-950 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold text-xs flex items-center justify-center border border-emerald-500/20">
                              #{cp.ordem ?? idx + 1}
                            </span>
                            <h5 className="font-semibold text-sm text-slate-200">{cp.nome}</h5>
                          </div>
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => regenHashMutation.mutate(cp.id)}
                              className="p-1 text-slate-500 hover:text-emerald-400 transition-colors"
                              title="Regerar Hash de QR Code"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteCpMutation.mutate(cp.id)}
                              className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                              title="Excluir Checkpoint"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between text-xs text-slate-400 font-mono">
                          <span className="flex items-center space-x-1">
                            <MapPin className="w-3 h-3 text-slate-500" />
                            <span>{cp.latitude.toFixed(4)}, {cp.longitude.toFixed(4)}</span>
                          </span>
                          <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded text-slate-400 border border-slate-800">
                            QR Hash OK
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL NOVA ROTA */}
      {showAddRouteModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-100">Cadastrar Nova Rota</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Nome da Rota</label>
                <input
                  type="text"
                  value={nomeRota}
                  onChange={(e) => setNomeRota(e.target.value)}
                  placeholder="Ex: Ronda Galpão Principal"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Descrição</label>
                <textarea
                  value={descricaoRota}
                  onChange={(e) => setDescricaoRota(e.target.value)}
                  placeholder="Detalhes da rota..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Qtde Mín. Checkpoints</label>
                  <input
                    type="number"
                    min={1}
                    value={qtdeMin}
                    onChange={(e) => setQtdeMin(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center space-x-2 text-xs font-medium text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isOrdered}
                      onChange={(e) => setIsOrdered(e.target.checked)}
                      className="rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-0"
                    />
                    <span>Ordem Sequencial?</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowAddRouteModal(false)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:bg-slate-800 text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                onClick={() => createRouteMutation.mutate()}
                disabled={!nomeRota}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold disabled:opacity-50"
              >
                Salvar Rota
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ADICIONAR CHECKPOINT */}
      {addingCpRouteId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-100">Adicionar Checkpoint à Rota</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Nome do Ponto</label>
                <input
                  type="text"
                  value={nomeCp}
                  onChange={(e) => setNomeCp(e.target.value)}
                  placeholder="Ex: Portão B2"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Ordem</label>
                  <input
                    type="number"
                    value={ordemCp}
                    onChange={(e) => setOrdemCp(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={latCp}
                    onChange={(e) => setLatCp(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={lngCp}
                    onChange={(e) => setLngCp(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setAddingCpRouteId(null)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:bg-slate-800 text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                onClick={() => createCpMutation.mutate()}
                disabled={!nomeCp}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold disabled:opacity-50"
              >
                Gerar Hash & Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOLHA DE IMPRESSÃO DE QR CODES */}
      {selectedRouteForPrint && (
        <QRCodePrintSheet
          route={selectedRouteForPrint}
          onClose={() => setSelectedRouteForPrint(null)}
        />
      )}
    </div>
  );
};
