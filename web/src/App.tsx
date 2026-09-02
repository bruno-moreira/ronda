import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LoginView } from './pages/LoginView';
import { RoutesView } from './pages/RoutesView';
import { UsersView } from './pages/UsersView';
import { SessionsView } from './pages/SessionsView';
import { ReportsView } from './pages/ReportsView';

const queryClient = new QueryClient();

const MainContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<'routes' | 'users' | 'sessions' | 'reports'>('routes');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        Carregando sistema...
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar currentTab={currentTab} setCurrentTab={setCurrentTab} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentTab === 'routes' && <RoutesView />}
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
