import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, TextInput, Platform, ScrollView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { insertSyncQueue, findCheckpointByHash, CachedCheckpoint } from '../services/db';

interface ScannerScreenProps {
  sessionId: string;
  checkpoints?: CachedCheckpoint[];
  onScanned: (cpName: string) => void;
  onClose: () => void;
}

export const ScannerScreen: React.FC<ScannerScreenProps> = ({ sessionId, checkpoints = [], onScanned, onClose }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(true);
  const [manualHash, setManualHash] = useState('');

  const processQrHash = async (hashValue: string, specificName?: string, specificId?: string) => {
    if (!hashValue.trim()) return;
    try {
      console.log('QR Code Lido / Inserido:', hashValue);

      let cpName = specificName || 'Checkpoint Desconhecido';
      let cpId: string | undefined = specificId;

      if (!cpId) {
        const checkpoint = await findCheckpointByHash(hashValue.trim());
        if (checkpoint) {
          cpName = checkpoint.nome;
          cpId = checkpoint.id;
        }
      }

      // Salvar na fila local offline
      await insertSyncQueue(sessionId, cpId, hashValue.trim());

      Alert.alert(
        'Leitura Registrada! 📍',
        `Checkpoint: ${cpName}\nHash: ${hashValue.substring(0, 16)}...\nRegistrado no banco local offline.`,
        [
          {
            text: 'OK',
            onPress: () => {
              onScanned(cpName);
              onClose();
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Erro ao Registrar', err.message);
    }
  };

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (!isScanning) return;
    setIsScanning(false);
    await processQrHash(data);
  };

  // Se for ambiente Web ou sem permissão de câmera nativa
  if (Platform.OS === 'web' || (permission && !permission.granted)) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.title}>📷 Leitor de QR Code (Simulador / Web)</Text>
        <Text style={styles.message}>
          {Platform.OS === 'web'
            ? 'Selecione abaixo um dos checkpoints da rota para simular a leitura do QR Code:'
            : 'É necessária permissão de câmera para ler o QR Code diretamente.'}
        </Text>

        {/* BOTOES RAPIDOS DOS CHECKPOINTS DA ROTA */}
        {checkpoints.length > 0 && (
          <View style={styles.quickCpSection}>
            <Text style={styles.quickCpTitle}>Checkpoints Oficiais da Rota:</Text>
            <ScrollView style={styles.quickCpScroll}>
              {checkpoints.map((cp) => (
                <TouchableOpacity
                  key={cp.id}
                  style={styles.quickCpButton}
                  onPress={() => processQrHash(cp.qrCodeHash || cp.id, cp.nome, cp.id)}
                >
                  <Text style={styles.quickCpButtonText}>📍 Ler: {cp.nome}</Text>
                  <Text style={styles.quickCpSubText}>Hash: {cp.qrCodeHash.substring(0, 14)}...</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <TextInput
          style={styles.manualInput}
          placeholder="Ou digite manualmente qualquer texto/hash de teste"
          placeholderTextColor="#64748b"
          value={manualHash}
          onChangeText={setManualHash}
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={styles.button}
          onPress={() => processQrHash(manualHash)}
          disabled={!manualHash.trim()}
        >
          <Text style={styles.buttonText}>Simular Leitura Personalizada</Text>
        </TouchableOpacity>

        {permission && !permission.granted && (
          <TouchableOpacity style={styles.secondaryButton} onPress={requestPermission}>
            <Text style={styles.secondaryButtonText}>Solicitar Permissão de Câmera</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.closeButtonManual} onPress={onClose}>
          <Text style={styles.closeButtonText}>Cancelar / Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        onBarcodeScanned={isScanning ? handleBarcodeScanned : undefined}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      />
      <View style={styles.overlay} pointerEvents="box-none">
        <View style={styles.scanTarget} />
        <Text style={styles.instructionText}>Aponte a câmera para o QR Code do Checkpoint</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Cancelar / Voltar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    color: '#10b981',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  message: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
  },
  quickCpSection: {
    width: '100%',
    marginBottom: 16,
    maxHeight: 180,
  },
  quickCpTitle: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  quickCpScroll: {
    width: '100%',
  },
  quickCpButton: {
    backgroundColor: '#10b98122',
    borderWidth: 1,
    borderColor: '#10b981',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quickCpButtonText: {
    color: '#10b981',
    fontWeight: 'bold',
    fontSize: 13,
  },
  quickCpSubText: {
    color: '#64748b',
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  manualInput: {
    width: '100%',
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#f8fafc',
    fontSize: 13,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#0284c7',
    width: '100%',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  secondaryButton: {
    marginTop: 10,
    paddingVertical: 8,
  },
  secondaryButtonText: {
    color: '#38bdf8',
    fontSize: 13,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(2, 6, 23, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  scanTarget: {
    width: 250,
    height: 250,
    borderWidth: 3,
    borderColor: '#10b981',
    borderRadius: 24,
    backgroundColor: 'transparent',
  },
  instructionText: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 24,
    textAlign: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  closeButton: {
    marginTop: 32,
    backgroundColor: '#334155',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  closeButtonManual: {
    marginTop: 16,
    backgroundColor: '#334155',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#f8fafc',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
