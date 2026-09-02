import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, LogOut, MapPin, Users, Activity, FileText } from 'lucide-react';

interface NavbarProps {
  currentTab: 'routes' | 'users' | 'sessions' | 'reports';
  setCurrentTab: (tab: 'routes' | 'users' | 'sessions' | 'reports') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab }) => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20">
              <Shield className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                Ronda Security
              </h1>
              <p className="text-xs text-slate-400">Painel Administrativo</p>
            </div>
          </div>

          <nav className="flex space-x-2">
            <button
              onClick={() => setCurrentTab('routes')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'routes'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Rotas & QR Codes</span>
            </button>

            <button
              onClick={() => setCurrentTab('sessions')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'sessions'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Monitoramento</span>
            </button>

            <button
              onClick={() => setCurrentTab('reports')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'reports'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Relatório Coletas</span>
            </button>

            {user?.role === 'ADMIN' && (
              <button
                onClick={() => setCurrentTab('users')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentTab === 'users'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Gestão de Usuários</span>
              </button>
            )}
          </nav>

          <div className="flex items-center space-x-4">
            <div className="text-right text-xs hidden sm:block">
              <p className="font-semibold text-slate-200">{user?.nome}</p>
              <span className="inline-block px-2 py-0.5 mt-0.5 rounded text-[10px] uppercase font-bold bg-slate-800 text-emerald-400 border border-slate-700">
                {user?.role}
              </span>
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
