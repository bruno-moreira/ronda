import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { UserPlus, Shield, Smartphone, Trash2, Mail, UserCheck } from 'lucide-react';

export const UsersView: React.FC = () => {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'SUPERVISOR' | 'VIGILANTE'>('VIGILANTE');

  const { data: usersList = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get('/users');
      return res.data;
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async () => {
      await api.post('/users', { nome, email, senha, role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowModal(false);
      setNome('');
      setEmail('');
      setSenha('');
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Gestão de Usuários e Permissões</h2>
          <p className="text-sm text-slate-400">
            Cadastre vigilantes para uso no aplicativo móvel e administradores/supervisores para o painel.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-500/20 text-sm"
        >
          <UserPlus className="w-4 h-4" />
          <span>Cadastrar Usuário</span>
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-500">Carregando usuários...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {usersList.map((usr: any) => (
            <div
              key={usr.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-start justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-blue-400 font-bold">
                    {usr.nome.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-100 text-sm">{usr.nome}</h3>
                    <div className="flex items-center space-x-1 text-slate-400 text-xs">
                      <Mail className="w-3 h-3" />
                      <span>{usr.email}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  {usr.role === 'VIGILANTE' ? (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      <Smartphone className="w-3 h-3" />
                      <span>Vigilante (App Mobile)</span>
                    </span>
                  ) : usr.role === 'ADMIN' ? (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      <Shield className="w-3 h-3" />
                      <span>Administrador</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <UserCheck className="w-3 h-3" />
                      <span>Supervisor</span>
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => deleteUserMutation.mutate(usr.id)}
                className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                title="Remover Usuário"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-100">Novo Usuário</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Nome Completo</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Carlos Vigilante"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="carlos@ronda.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Senha</label>
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Perfil / Função</label>
                <select
                  value={role}
                  onChange={(e: any) => setRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="VIGILANTE">Vigilante (Acesso App Mobile)</option>
                  <option value="SUPERVISOR">Supervisor (Visualiza Painel)</option>
                  <option value="ADMIN">Administrador (Acesso Total)</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:bg-slate-800 text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                onClick={() => createUserMutation.mutate()}
                disabled={!nome || !email || !senha}
                className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-950 text-xs font-bold disabled:opacity-50"
              >
                Cadastrar Usuário
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
