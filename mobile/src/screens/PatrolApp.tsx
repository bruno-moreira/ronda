import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  initDatabase,
  getCachedRoutes,
  getCachedCheckpoints,
  cacheRoutes,
  getPendingSyncQueue,
  CachedRoute,
  CachedCheckpoint,
} from '../services/db';
import { api, setAuthToken, updateServerUrl, getCurrentServerUrl } from '../services/apiService';
import { flushSyncQueue, startNetworkSyncListener } from '../services/syncEngine';
import { ScannerScreen } from './ScannerScreen';

export const PatrolApp: React.FC = () => {
  // Navigation Screen State ('LOGIN' | 'ROUTES' | 'PATROL')
  const [currentScreen, setCurrentScreen] = useState<'LOGIN' | 'ROUTES' | 'PATROL'>('LOGIN');

  // Auth state
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState('admin@ronda.com');
  const [senha, setSenha] = useState('admin123');
  const [user, setUser] = useState<any>(null);

  // App State
  const [dbReady, setDbReady] = useState(false);
  const [routes, setRoutes] = useState<CachedRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<CachedRoute | null>(null);
  const [routeCheckpoints, setRouteCheckpoints] = useState<CachedCheckpoint[]>([]);

  // Config & Logs Modal State
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [serverUrlInput, setServerUrlInput] = useState(getCurrentServerUrl());
  const [testingConnection, setTestingConnection] = useState(false);

  // Logs Terminal List
  const [syncLogsList, setSyncLogsList] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] Sistema mobile inicializado.`,
  ]);

  // Patrol Session State
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [scannedCheckpoints, setScannedCheckpoints] = useState<string[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const totalCps = routeCheckpoints.length;
  const scannedCount = scannedCheckpoints.length;
  const remainingCount = Math.max(0, totalCps - scannedCount);

  const addLogMessage = (msg: string) => {
    const timeStr = new Date().toLocaleTimeString();
    setSyncLogsList((prev) => [`[${timeStr}] ${msg}`, ...prev.slice(0, 49)]);
  };

  useEffect(() => {
    const setup = async () => {
      await initDatabase();
      setDbReady(true);
      refreshPendingSyncCount();
      const localCached = await getCachedRoutes();
      setRoutes(localCached);
      if (localCached.length > 0) {
        setCurrentScreen('ROUTES');
      }
      addLogMessage('Banco de dados local SQLite inicializado com sucesso.');
    };

    setup();
    const unsubscribe = startNetworkSyncListener();
    return () => unsubscribe();
  }, []);

  const refreshPendingSyncCount = async () => {
    try {
      const pending = await getPendingSyncQueue();
      setPendingSyncCount(pending.length);
    } catch (e) {
      console.warn(e);
    }
  };

  const loadLocalRoutes = async () => {
    const cached = await getCachedRoutes();
    setRoutes(cached);
    return cached;
  };

  const handleSaveServerConfig = () => {
    const updated = updateServerUrl(serverUrlInput);
    setServerUrlInput(updated);
    setShowConfigModal(false);
    addLogMessage(`URL do servidor alterada para: ${updated}`);
    Alert.alert('Servidor Atualizado', `URL do backend definida para:\n${updated}`);
  };

  const handleTestServerConnection = async () => {
    setTestingConnection(true);
    const targetUrl = updateServerUrl(serverUrlInput);
    addLogMessage(`Testando ping em ${targetUrl}/ping...`);
    try {
      const res = await api.get('/ping');
      addLogMessage(`🟢 Conexão OK com ${targetUrl}! (${res.data?.message || '200 OK'})`);
      Alert.alert('Conexão OK! 🟢', `Servidor online e acessível em:\n${targetUrl}`);
    } catch (e: any) {
      addLogMessage(`🔴 Falha de conexão em ${targetUrl}: ${e.message}`);
      Alert.alert('Falha na Conexão 🔴', `Não foi possível conectar ao servidor (${targetUrl}):\n${e.message}`);
    } finally {
      setTestingConnection(false);
    }
  };

  const handleDownloadFreshRoutes = async () => {
    setLoading(true);
    addLogMessage(`Conectando ao backend em ${getCurrentServerUrl()} para atualizar rotas...`);
    try {
      // Tentar login primeiro se não tiver token (auto-login transparente como Vigilante)
      if (!token) {
        const res = await api.post('/auth/login', { 
          email: 'vigilante@ronda.com', 
          senha: 'ronda123' 
        });
        const { access_token, user: loggedUser } = res.data;
        setToken(access_token);
        setUser(loggedUser);
        setAuthToken(access_token);
        addLogMessage(`🟢 Autenticado transparente como ${loggedUser.nome}.`);
      }

      // Baixar rotas e checkpoints do backend e atualizar o SQLite local
      const routesRes = await api.get('/routes');
      await cacheRoutes(routesRes.data);
      const updatedLocal = await loadLocalRoutes();

      let totalCpCount = 0;
      routesRes.data.forEach((r: any) => {
        if (r.checkpoints) totalCpCount += r.checkpoints.length;
      });

      addLogMessage(`🟢 Banco local atualizado com sucesso! ${updatedLocal.length} rotas e ${totalCpCount} checkpoints.`);
      setCurrentScreen('ROUTES');
      Alert.alert(
        'Banco de Dados Atualizado! 📲',
        `Foram baixadas e salvas no banco local offline:\n• ${updatedLocal.length} Rota(s)\n• ${totalCpCount} Checkpoint(s) com QR Code.`
      );
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message;
      addLogMessage(`🔴 Erro ao atualizar banco local: ${errorMsg}`);
      Alert.alert('Erro ao Atualizar Banco', `${errorMsg}\n\nVerifique o IP do servidor em "⚙️ IP Servidor".`);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRoute = async (route: CachedRoute) => {
    setSelectedRoute(route);
    const cps = await getCachedCheckpoints(route.id);
    setRouteCheckpoints(cps);
    addLogMessage(`Rota selecionada: ${route.nome} (${cps.length} checkpoints).`);
  };

  const handleStartPatrol = async () => {
    if (!selectedRoute) return;

    const generateUuid = () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    };

    const sessionId = generateUuid();
    setActiveSessionId(sessionId);
    setScannedCheckpoints([]);
    setCurrentScreen('PATROL');
    addLogMessage(`Ronda iniciada. ID Sessão: ${sessionId}`);
    Alert.alert('Ronda Iniciada', `Ronda para a rota "${selectedRoute.nome}" iniciada com sucesso!`);
  };

  const handleQrScanned = async (cpName: string) => {
    setScannedCheckpoints((prev) => [...prev, cpName]);
    addLogMessage(`Check-in efetuado: ${cpName}`);
    await refreshPendingSyncCount();
  };

  const handleManualSync = async () => {
    setLoading(true);
    addLogMessage(`Iniciando sincronização manual com ${getCurrentServerUrl()}...`);
    await flushSyncQueue();
    await refreshPendingSyncCount();
    setLoading(false);
    addLogMessage(`Processo de sincronização concluído.`);
    Alert.alert('Sincronização', 'Processo de sincronização finalizado.');
  };

  const handleResetToHome = () => {
    setToken(null);
    setUser(null);
    setActiveSessionId(null);
    setSelectedRoute(null);
    setCurrentScreen('LOGIN');
    addLogMessage('Retornou para a tela inicial de Login.');
  };

  if (!dbReady) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.loadingText}>Inicializando Banco de Dados Local...</Text>
      </View>
    );
  }

  if (showScanner && activeSessionId) {
    return (
      <ScannerScreen
        sessionId={activeSessionId}
        checkpoints={routeCheckpoints}
        onScanned={handleQrScanned}
        onClose={() => setShowScanner(false)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* CABEÇALHO SUPERIOR */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backHomeButton} onPress={handleResetToHome}>
            <Text style={styles.backHomeButtonText}>🏠 Login</Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Ronda Vigilante</Text>
            <Text style={styles.headerSubtitle}>
              IP: <Text style={styles.highlight}>{getCurrentServerUrl().replace('http://', '')}</Text>
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.logsBadge} onPress={() => setShowLogsModal(true)}>
            <Text style={styles.logsBadgeText}>📋 Logs</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.configBadge} onPress={() => setShowConfigModal(true)}>
            <Text style={styles.configBadgeText}>⚙️ IP</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.syncBadge} onPress={handleManualSync}>
            <Text style={styles.syncBadgeText}>Fila: {pendingSyncCount} 🔄</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* TELA DE LOGIN / CARGA INICIAL DO BANCO */}
        {currentScreen === 'LOGIN' ? (
          <View style={styles.authContainer}>
            <Text style={styles.brandTitle}>🛡️ Ronda Mobile</Text>
            <Text style={styles.brandSubtitle}>Aplicativo Vigilante Offline-First</Text>

            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>Atualizar Banco do Celular</Text>
                <TouchableOpacity onPress={() => setShowConfigModal(true)}>
                  <Text style={styles.configLink}>⚙️ IP Servidor</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.cardSubtitle}>
                Servidor: <Text style={styles.ipText}>{getCurrentServerUrl()}</Text>
              </Text>

              <TouchableOpacity style={styles.primaryButton} onPress={handleDownloadFreshRoutes} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#020617" />
                ) : (
                  <Text style={styles.primaryButtonText}>📥 Baixar / Atualizar Banco do Celular</Text>
                )}
              </TouchableOpacity>

              {routes.length > 0 && (
                <TouchableOpacity style={styles.secondaryNavButton} onPress={() => setCurrentScreen('ROUTES')}>
                  <Text style={styles.secondaryNavButtonText}>
                    ▶ Entrar sem Atualizar ({routes.length} rotas salvas localmente)
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.configButtonSecondary} onPress={() => setShowLogsModal(true)}>
                <Text style={styles.configButtonSecondaryText}>📋 Ver Logs de Sincronização & Rede</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : currentScreen === 'ROUTES' ? (
          /* SELEÇÃO DE ROTAS */
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Selecione a Rota da Ronda</Text>
              <TouchableOpacity style={styles.resetButtonLink} onPress={handleDownloadFreshRoutes} disabled={loading}>
                <Text style={styles.resetButtonLinkText}>🔄 Atualizar Banco</Text>
              </TouchableOpacity>
            </View>

            {routes.length === 0 ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>Nenhuma rota no banco local</Text>
                <Text style={styles.emptyStateDesc}>
                  Clique no botão abaixo para conectar ao servidor e baixar os dados das rotas para o seu celular.
                </Text>
                <TouchableOpacity style={styles.primaryButton} onPress={handleDownloadFreshRoutes}>
                  <Text style={styles.primaryButtonText}>📥 Baixar Rotas do Servidor</Text>
                </TouchableOpacity>
              </View>
            ) : (
              routes.map((r) => (
                <TouchableOpacity
                  key={r.id}
                  style={[
                    styles.routeCard,
                    selectedRoute?.id === r.id && styles.routeCardSelected,
                  ]}
                  onPress={() => handleSelectRoute(r)}
                >
                  <Text style={styles.routeName}>{r.nome}</Text>
                  <Text style={styles.routeDesc}>{r.descricao || 'Sem descrição'}</Text>
                  <View style={styles.routeBadgeRow}>
                    <Text style={styles.routeBadge}>Mínimo: {r.qtdeMinimaCheckpoints} pts</Text>
                    {r.isOrdered === 1 && <Text style={styles.routeBadgeOrdered}>Ordem Sequencial</Text>}
                  </View>
                </TouchableOpacity>
              ))
            )}

            {selectedRoute && (
              <TouchableOpacity style={styles.startButton} onPress={handleStartPatrol}>
                <Text style={styles.startButtonText}>Iniciar Ronda para "{selectedRoute.nome}"</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          /* PAINEL DE RONDA EM ANDAMENTO */
          <View style={styles.section}>
            <View style={styles.activePatrolHeaderRow}>
              <View>
                <Text style={styles.activePatrolTitle}>Ronda em Andamento</Text>
                <Text style={styles.activePatrolRoute}>{selectedRoute?.nome}</Text>
              </View>
              <TouchableOpacity
                style={styles.cancelPatrolButton}
                onPress={() => {
                  setActiveSessionId(null);
                  setCurrentScreen('ROUTES');
                  Alert.alert('Sessão Pausada', 'Voltou para a tela de seleção de rotas.');
                }}
              >
                <Text style={styles.cancelPatrolButtonText}>◀ Trocar Rota</Text>
              </TouchableOpacity>
            </View>

            {/* CONTADOR DE PROGRESSO DA RONDA */}
            <View style={styles.progressCard}>
              <View style={styles.progressRow}>
                <View style={styles.progressItem}>
                  <Text style={styles.progressNumber}>{scannedCount}</Text>
                  <Text style={styles.progressLabel}>Lidos</Text>
                </View>
                <View style={styles.progressDivider} />
                <View style={styles.progressItem}>
                  <Text style={styles.progressNumberHighlight}>{remainingCount}</Text>
                  <Text style={styles.progressLabelHighlight}>Faltam</Text>
                </View>
                <View style={styles.progressDivider} />
                <View style={styles.progressItem}>
                  <Text style={styles.progressNumber}>{totalCps}</Text>
                  <Text style={styles.progressLabel}>Total</Text>
                </View>
              </View>

              <Text style={styles.progressStatusText}>
                {remainingCount === 0
                  ? '✅ Todos os checkpoints lidos com sucesso!'
                  : `Atenção: Restam ${remainingCount} checkpoint(s) a serem lidos.`}
              </Text>
            </View>

            {/* BOTÃO LEITURA QR CODE */}
            <TouchableOpacity style={styles.scanButton} onPress={() => setShowScanner(true)}>
              <Text style={styles.scanButtonText}>📷 Ler QR Code do Checkpoint</Text>
            </TouchableOpacity>

            {/* LISTA DE LEITURAS EFETUADAS */}
            <View style={styles.logsSection}>
              <Text style={styles.logsTitle}>Leituras Registradas nesta Sessão:</Text>
              {scannedCheckpoints.length === 0 ? (
                <Text style={styles.emptyLogsText}>Nenhum QR Code lido ainda.</Text>
              ) : (
                scannedCheckpoints.map((cp, idx) => (
                  <View key={idx} style={styles.logRow}>
                    <Text style={styles.logIndex}>#{idx + 1}</Text>
                    <Text style={styles.logName}>{cp}</Text>
                    <Text style={styles.logBadge}>Salvo Local</Text>
                  </View>
                ))
              )}
            </View>

            <TouchableOpacity
              style={styles.finishButton}
              onPress={() => {
                setActiveSessionId(null);
                setCurrentScreen('ROUTES');
                flushSyncQueue();
                addLogMessage('Sessão encerrada e enviada para sincronização.');
                Alert.alert('Ronda Finalizada', 'Sessão encerrada. Registros enviados para o servidor.');
              }}
            >
              <Text style={styles.finishButtonText}>Encerrar Ronda & Sincronizar</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* MODAL CONFIGURAÇÃO DE IP DO SERVIDOR */}
      <Modal visible={showConfigModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>⚙️ Configurar Servidor Backend</Text>
            <Text style={styles.modalSubtitle}>
              Digite o endereço IP ou URL completa onde o servidor NestJS está rodando:
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Ex: http://10.107.20.214:3000"
              placeholderTextColor="#64748b"
              value={serverUrlInput}
              onChangeText={setServerUrlInput}
              autoCapitalize="none"
            />

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.testButton}
                onPress={handleTestServerConnection}
                disabled={testingConnection}
              >
                {testingConnection ? (
                  <ActivityIndicator color="#38bdf8" />
                ) : (
                  <Text style={styles.testButtonText}>🧪 Testar Conexão</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.modalFooterRow}>
              <TouchableOpacity style={styles.cancelModalButton} onPress={() => setShowConfigModal(false)}>
                <Text style={styles.cancelModalButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveModalButton} onPress={handleSaveServerConfig}>
                <Text style={styles.saveModalButtonText}>Salvar IP</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL TERMINAL DE LOGS DE SINCRONIZAÇÃO */}
      <Modal visible={showLogsModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>📋 Terminal de Logs & Rede</Text>
              <TouchableOpacity onPress={() => setShowLogsModal(false)}>
                <Text style={styles.closeModalX}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>
              Fila Pendente: <Text style={styles.highlight}>{pendingSyncCount} itens</Text> | Servidor:{' '}
              <Text style={styles.ipText}>{getCurrentServerUrl()}</Text>
            </Text>

            <ScrollView style={styles.terminalContainer}>
              {syncLogsList.map((log, i) => (
                <Text key={i} style={styles.terminalLine}>
                  {log}
                </Text>
              ))}
            </ScrollView>

            <View style={styles.modalFooterRow}>
              <TouchableOpacity style={styles.testButton} onPress={handleManualSync}>
                <Text style={styles.testButtonText}>🔄 Sincronizar Agora</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveModalButton} onPress={() => setShowLogsModal(false)}>
                <Text style={styles.saveModalButtonText}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  center: {
    flex: 1,
    backgroundColor: '#020617',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 12,
    fontSize: 14,
  },
  authContainer: {
    padding: 10,
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#10b981',
    textAlign: 'center',
  },
  brandSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  configLink: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    marginBottom: 16,
  },
  ipText: {
    color: '#10b981',
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#f8fafc',
    fontSize: 14,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#020617',
    fontWeight: 'bold',
    fontSize: 14,
  },
  secondaryNavButton: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  secondaryNavButtonText: {
    color: '#cbd5e1',
    fontWeight: '600',
    fontSize: 12,
  },
  configButtonSecondary: {
    marginTop: 16,
    paddingVertical: 10,
    alignItems: 'center',
  },
  configButtonSecondaryText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#1e293b',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backHomeButton: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  backHomeButtonText: {
    color: '#f8fafc',
    fontSize: 11,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  headerSubtitle: {
    fontSize: 10,
    color: '#64748b',
  },
  highlight: {
    color: '#10b981',
    fontWeight: 'bold',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  logsBadge: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  logsBadgeText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: 'bold',
  },
  configBadge: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  configBadgeText: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: 'bold',
  },
  syncBadge: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  syncBadgeText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
  },
  section: {
    gap: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  resetButtonLink: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  resetButtonLinkText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: 'bold',
  },
  emptyStateCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
  },
  emptyStateTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  emptyStateDesc: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
  },
  routeCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  routeCardSelected: {
    borderColor: '#10b981',
    backgroundColor: '#064e3b22',
  },
  routeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  routeDesc: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
  },
  routeBadgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  routeBadge: {
    fontSize: 11,
    color: '#38bdf8',
    backgroundColor: '#0284c722',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  routeBadgeOrdered: {
    fontSize: 11,
    color: '#10b981',
    backgroundColor: '#05966922',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  startButton: {
    backgroundColor: '#10b981',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  startButtonText: {
    color: '#020617',
    fontWeight: 'bold',
    fontSize: 15,
  },
  activePatrolHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  activePatrolTitle: {
    fontSize: 12,
    color: '#94a3b8',
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  activePatrolRoute: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  cancelPatrolButton: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cancelPatrolButtonText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: 'bold',
  },
  progressCard: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  progressItem: {
    alignItems: 'center',
  },
  progressNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  progressNumberHighlight: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#f43f5e',
  },
  progressLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  progressLabelHighlight: {
    fontSize: 12,
    color: '#fb7185',
    fontWeight: 'bold',
    marginTop: 2,
  },
  progressDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#334155',
  },
  progressStatusText: {
    fontSize: 12,
    color: '#cbd5e1',
    textAlign: 'center',
    marginTop: 16,
    backgroundColor: '#020617',
    padding: 10,
    borderRadius: 10,
  },
  scanButton: {
    backgroundColor: '#0284c7',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  scanButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  logsSection: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  logsTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#94a3b8',
    marginBottom: 8,
  },
  emptyLogsText: {
    color: '#64748b',
    fontSize: 13,
    fontStyle: 'italic',
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#1e293b',
  },
  logIndex: {
    color: '#10b981',
    fontWeight: 'bold',
    width: 24,
  },
  logName: {
    color: '#f8fafc',
    flex: 1,
    fontSize: 14,
  },
  logBadge: {
    color: '#38bdf8',
    fontSize: 10,
    backgroundColor: '#0284c722',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  finishButton: {
    backgroundColor: '#334155',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  finishButtonText: {
    color: '#f8fafc',
    fontWeight: 'bold',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeModalX: {
    color: '#94a3b8',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#f8fafc',
    fontSize: 14,
    marginBottom: 16,
  },
  modalButtonRow: {
    marginBottom: 20,
  },
  testButton: {
    backgroundColor: '#0284c722',
    borderWidth: 1,
    borderColor: '#0284c7',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  testButtonText: {
    color: '#38bdf8',
    fontWeight: 'bold',
    fontSize: 13,
  },
  modalFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
  },
  cancelModalButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  cancelModalButtonText: {
    color: '#94a3b8',
    fontWeight: 'bold',
    fontSize: 13,
  },
  saveModalButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  saveModalButtonText: {
    color: '#020617',
    fontWeight: 'bold',
    fontSize: 13,
  },
  terminalContainer: {
    backgroundColor: '#020617',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 12,
    maxHeight: 220,
    minHeight: 140,
    marginBottom: 8,
  },
  terminalLine: {
    color: '#38bdf8',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 4,
  },
});
