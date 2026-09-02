import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { Printer, FileText, Calendar, User, MapPin, Building2 } from 'lucide-react';

export const ReportsView: React.FC = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');

  // Título e Endereço da Empresa (Personalizáveis)
  const [companyName, setCompanyName] = useState('Dass Unidade VDCO');
  const [companyAddress, setCompanyAddress] = useState('Av Ayrton Senna, Vitoria da Conquista - BA - 45000000');

  // Buscar Rotas para o Filtro
  const { data: routesList = [] } = useQuery({
    queryKey: ['routes'],
    queryFn: async () => {
      const res = await api.get('/routes');
      return res.data;
    },
  });

  // Buscar Usuários para o Filtro
  const { data: usersList = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get('/users');
      return res.data;
    },
  });

  // Buscar Dados do Relatório
  const { data: reportLogs = [], isLoading } = useQuery({
    queryKey: ['reports', startDate, endDate, selectedRouteId, selectedUserId],
    queryFn: async () => {
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (selectedRouteId) params.routeId = selectedRouteId;
      if (selectedUserId) params.userId = selectedUserId;

      const res = await api.get('/patrol/reports', { params });
      return res.data;
    },
  });

  const handlePrint = () => {
    window.print();
  };

  const selectedRouteObj = routesList.find((r: any) => r.id === selectedRouteId);
  const selectedUserObj = usersList.find((u: any) => u.id === selectedUserId);

  const formattedPeriod = `${startDate ? new Date(startDate).toLocaleDateString('pt-BR') : '01/01/2026'} 00:00 - ${
    endDate ? new Date(endDate).toLocaleDateString('pt-BR') : '31/12/2026'
  } 23:59`;

  const printedAtDate = new Date().toLocaleString('pt-BR');

  return (
    <div className="space-y-6">
      {/* PAINEL DE FILTROS E AÇÕES (NÃO APARECE NA IMPRESSÃO) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
              <FileText className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100">Gerador de Relatório Coletas</h2>
              <p className="text-sm text-slate-400">
                Filtre as coletas por período, rota e rondante para gerar o documento oficial de impressão.
              </p>
            </div>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20 text-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir / Exportar PDF</span>
          </button>
        </div>

        {/* CONTROLES DE CABEÇALHO E FILTROS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 pt-2">
          <div className="lg:col-span-2">
            <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center space-x-1">
              <Building2 className="w-3.5 h-3.5" />
              <span>Nome da Unidade / Empresa</span>
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="lg:col-span-2">
            <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center space-x-1">
              <Building2 className="w-3.5 h-3.5" />
              <span>Endereço / Localização</span>
            </label>
            <input
              type="text"
              value={companyAddress}
              onChange={(e) => setCompanyAddress(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Data Inicial</span>
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Data Final</span>
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="lg:col-span-3">
            <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5" />
              <span>Rota / Roteiro</span>
            </label>
            <select
              value={selectedRouteId}
              onChange={(e) => setSelectedRouteId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 text-xs focus:border-emerald-500 focus:outline-none"
            >
              <option value="">Todas as Rotas</option>
              {routesList.map((r: any) => (
                <option key={r.id} value={r.id}>
                  {r.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-3">
            <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center space-x-1">
              <User className="w-3.5 h-3.5" />
              <span>Rondante / Vigilante</span>
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 text-xs focus:border-emerald-500 focus:outline-none"
            >
              <option value="">Todos os Rondantes</option>
              {usersList.map((u: any) => (
                <option key={u.id} value={u.id}>
                  {u.nome} ({u.role})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ÁREA OFICIAL DO RELATÓRIO (FORMATADA PARA IMPRESSÃO EM A4) */}
      <div
        id="printable-report-sheet"
        className="bg-white text-slate-900 rounded-2xl p-8 max-w-4xl mx-auto shadow-2xl border border-slate-200"
      >
        {/* CABEÇALHO DO RELATÓRIO */}
        <div className="flex justify-between items-start border-b border-slate-900 pb-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{companyName}</h1>
            <h2 className="text-lg font-bold italic text-slate-800 mt-2">Relatório Coletas</h2>
          </div>
          <div className="text-right text-xs text-slate-700">
            <p>{companyAddress}</p>
          </div>
        </div>

        {/* METADADOS DO FILTRO */}
        <div className="space-y-1.5 text-xs text-slate-800 font-medium mb-6">
          <div className="flex">
            <span className="w-28 font-bold text-slate-900">Período:</span>
            <span>{formattedPeriod}</span>
          </div>
          <div className="flex">
            <span className="w-28 font-bold text-slate-900">Pen:</span>
            <span>{selectedRouteObj ? selectedRouteObj.nome : 'Portaria'}</span>
          </div>
          <div className="flex">
            <span className="w-28 font-bold text-slate-900">Roteiros:</span>
            <span>{selectedRouteObj ? selectedRouteObj.nome : 'Portaria'}</span>
          </div>
          <div className="border-t border-slate-300 my-2 pt-2 flex justify-between">
            <div>
              <span className="font-bold text-slate-900">Data da coleta:</span>
              <p className="font-bold text-slate-900 text-sm mt-0.5">{printedAtDate}</p>
            </div>
            <div>
              <span className="font-bold text-slate-900">Rondante:</span>
              <p className="font-bold text-slate-900 text-sm mt-0.5">
                {selectedUserObj ? selectedUserObj.nome : 'Portaria'}
              </p>
            </div>
          </div>
        </div>

        {/* TABELA DE COLETAS */}
        <div className="border-t border-slate-900 pt-2">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-400 italic">
                <th className="py-1.5 font-semibold text-slate-900 w-1/2">Data de contato</th>
                <th className="py-1.5 font-semibold text-slate-900 w-1/2">Descrição</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={2} className="py-4 text-center text-slate-500 italic">
                    Carregando dados das coletas...
                  </td>
                </tr>
              ) : reportLogs.length === 0 ? (
                <tr>
                  <td colSpan={2} className="py-4 text-center text-slate-500 italic">
                    Nenhuma coleta registrada para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                reportLogs.map((log: any, idx: number) => (
                  <tr key={log.logId || idx} className="hover:bg-slate-50">
                    <td className="py-1 text-slate-900">
                      {new Date(log.scannedAt).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-1 text-slate-900">
                      {log.checkpointNome || `Ponto #${log.checkpointOrdem || idx + 1}`}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* RODAPÉ DA PÁGINA */}
        <div className="border-t border-slate-300 mt-8 pt-3 flex justify-between items-center text-[10px] text-slate-500 font-sans">
          <span>1 de 1</span>
          <span>Impresso em {printedAtDate}</span>
        </div>
      </div>
    </div>
  );
};
