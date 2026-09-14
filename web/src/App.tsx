import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LoginView } from './pages/LoginView';
import { RoutesView } from './pages/RoutesView';
import { UsersView } from './pages/UsersView';
import { SessionsView } from './pages/SessionsView';
import { ReportsView } from './pages/ReportsView';
import { ScannerPatrolView } from './pages/ScannerPatrolView';

const queryClient = new QueryClient();

const MainContent: React.FC = () => {
  const { user, isLoading, login } = useAuth();
  const [currentTab, setCurrentTab] = useState<'routes' | 'users' | 'sessions' | 'reports' | 'scanner'>('routes');
  const [isAutoLogging, setIsAutoLogging] = useState(false);

  useEffect(() => {
    if (!user && window.location.pathname === '/rondas' && !isLoading && !isAutoLogging) {
      setIsAutoLogging(true);
      login('vigilante@ronda.com', 'ronda123')
        .catch(err => console.error('Erro auto-login vigilante:', err))
        .finally(() => setIsAutoLogging(false));
    }
  }, [user, isLoading, login]);

  if (isLoading || isAutoLogging) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mb-4"></div>
        <p>Acessando sistema...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  // Se o usuário for VIGILANTE, ele deve ver apenas a tela de scanner
  if (user.role === 'VIGILANTE') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <Navbar currentTab="scanner" setCurrentTab={() => {}} />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ScannerPatrolView />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar currentTab={currentTab} setCurrentTab={setCurrentTab} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentTab === 'routes' && <RoutesView />}
        {currentTab === 'scanner' && <ScannerPatrolView />}
        {currentTab === 'sessions' && <SessionsView />}
        {currentTab === 'reports' && <ReportsView />}
        {currentTab === 'users' && user.role === 'ADMIN' && <UsersView />}
      </main>
    </div>
  );
};

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MainContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
