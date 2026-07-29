import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, ScanLine, Play, Square, CheckCircle, Package } from 'lucide-react-native';
import { Camera, CameraView } from 'expo-camera';
import axios from 'axios';

const API_URL = Platform.OS === 'web' ? 'https://92d153bb9af283.lhr.life/api' : 'https://92d153bb9af283.lhr.life/api';

export default function MobileAuditoriaScreen({ navigation }: any) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [step, setStep] = useState<'SCAN_RACK' | 'SCANNING_ITEMS' | 'RESULTS'>('SCAN_RACK');
  const [rack, setRack] = useState('');
  const [scannedItems, setScannedItems] = useState<{sku: string, qty: number}[]>([]);
  const [loading, setLoading] = useState(false);
  const [discrepancias, setDiscrepancias] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = ({ type, data }: any) => {
    if (step === 'SCAN_RACK') {
      let rackCode = data;
      try {
        if (data.startsWith('{')) rackCode = JSON.parse(data).rack || data;
        else if (data.startsWith('RACK-')) rackCode = data.replace('RACK-', '');
      } catch(e) {}
      setRack(rackCode);
      setStep('SCANNING_ITEMS');
    } else if (step === 'SCANNING_ITEMS') {
      let sku = data;
      try {
        if (data.startsWith('{')) sku = JSON.parse(data).sku || data;
      } catch(e) {}

      setScannedItems(prev => {
        const exists = prev.find(i => i.sku === sku);
        if (exists) {
          return prev.map(i => i.sku === sku ? { ...i, qty: i.qty + 1 } : i);
        }
        return [...prev, { sku, qty: 1 }];
      });
    }
  };

  const handleFinishAudit = async () => {
    if (scannedItems.length === 0) {
      Alert.alert('Aviso', 'No se ha escaneado ningún producto.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        Rack: rack,
        Auditor: 'Auditor Móvil',
        Items: scannedItems.map(i => ({ ProductoCodigo: i.sku, CantidadEscaneada: i.qty }))
      };

      const res = await axios.post(`${API_URL}/almacen/auditoria`, payload);
      if (res.data.success) {
        setDiscrepancias(res.data.discrepancias);
        setStep('RESULTS');
      }
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Error de conexión.');
    }
    setLoading(false);
  };

  if (hasPermission === null) return <View />;
  if (hasPermission === false) return <Text>Sin acceso a cámara</Text>;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#0f172a', '#020617']} style={StyleSheet.absoluteFill} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Auditoría Ciega</Text>
        <View style={{ width: 40 }} />
      </View>

      {step === 'SCAN_RACK' && (
        <View style={styles.cameraContainer}>
          <Text style={styles.cameraInstructions}>Paso 1: Escanea el RACK a auditar</Text>
          <View style={styles.cameraFrame}>
            <CameraView style={StyleSheet.absoluteFill} onBarcodeScanned={handleBarCodeScanned} />
            <View style={styles.overlayCenter}>
              <ScanLine size={150} color="rgba(255,255,255,0.4)" />
            </View>
          </View>
        </View>
      )}

      {step === 'SCANNING_ITEMS' && (
        <View style={{ flex: 1 }}>
          <View style={styles.scanHeader}>
            <Text style={styles.rackLabel}>Auditando Rack: <Text style={{ color: '#3b82f6' }}>{rack}</Text></Text>
            <Text style={styles.itemCount}>Total Items: {scannedItems.reduce((acc, curr) => acc + curr.qty, 0)}</Text>
          </View>

          <View style={styles.miniCamera}>
            <CameraView style={StyleSheet.absoluteFill} onBarcodeScanned={handleBarCodeScanned} />
          </View>
          
          <FlatList 
            data={scannedItems}
            keyExtractor={item => item.sku}
            contentContainerStyle={{ padding: 20 }}
            renderItem={({ item }) => (
              <View style={styles.scanRow}>
                <Package size={24} color="#94a3b8" />
                <Text style={styles.scanSku}>{item.sku}</Text>
                <View style={styles.qtyBadge}><Text style={styles.qtyText}>x{item.qty}</Text></View>
              </View>
            )}
          />

          <View style={styles.bottomBar}>
            <TouchableOpacity style={styles.finishBtn} onPress={handleFinishAudit} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <><Square size={20} color="#fff" /><Text style={styles.finishBtnText}>Finalizar Auditoría</Text></>}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {step === 'RESULTS' && (
        <View style={styles.resultsContainer}>
          {discrepancias.length === 0 ? (
            <View style={styles.perfectMatch}>
              <CheckCircle size={80} color="#10b981" />
              <Text style={styles.perfectTitle}>¡Auditoría Perfecta!</Text>
              <Text style={styles.perfectDesc}>El conteo físico coincide exactamente con el sistema.</Text>
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              <Text style={styles.errorTitle}>Discrepancias Encontradas</Text>
              <FlatList 
                data={discrepancias}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                  <View style={styles.errorCard}>
                    <Text style={styles.errorSku}>{item.productoCodigo}</Text>
                    <Text style={styles.errorName}>{item.nombre}</Text>
                    <View style={styles.errorStats}>
                      <Text style={styles.stat}>Sistema: {item.esperado}</Text>
                      <Text style={styles.stat}>Físico: {item.encontrado}</Text>
                    </View>
                    {item.faltante > 0 && <Text style={styles.faltanteBadge}>Faltan {item.faltante}</Text>}
                    {item.sobrante > 0 && <Text style={styles.sobranteBadge}>Sobran {item.sobrante}</Text>}
                  </View>
                )}
              />
            </View>
          )}

          <TouchableOpacity style={styles.newAuditBtn} onPress={() => { setStep('SCAN_RACK'); setScannedItems([]); setDiscrepancias([]); setRack(''); }}>
            <Text style={styles.newAuditText}>Nueva Auditoría</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, justifyContent: 'space-between' },
  backBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  
  cameraContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cameraInstructions: { color: '#94a3b8', fontSize: 18, marginBottom: 20, fontWeight: 'bold' },
  cameraFrame: { width: 300, height: 300, borderRadius: 24, overflow: 'hidden', borderWidth: 2, borderColor: '#334155' },
  overlayCenter: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  
  scanHeader: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a' },
  rackLabel: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  itemCount: { color: '#10b981', fontSize: 16, fontWeight: 'bold' },
  
  miniCamera: { height: 150, marginHorizontal: 20, borderRadius: 16, overflow: 'hidden', marginBottom: 10 },
  scanRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', padding: 15, borderRadius: 12, marginBottom: 10 },
  scanSku: { flex: 1, color: '#f8fafc', fontSize: 16, marginLeft: 10, fontWeight: 'bold' },
  qtyBadge: { backgroundColor: '#3b82f6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  qtyText: { color: '#fff', fontWeight: 'bold' },
  
  bottomBar: { padding: 20, backgroundColor: '#0f172a' },
  finishBtn: { backgroundColor: '#ef4444', padding: 16, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  finishBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  resultsContainer: { flex: 1, padding: 20 },
  perfectMatch: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  perfectTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginTop: 20 },
  perfectDesc: { color: '#94a3b8', fontSize: 16, marginTop: 10, textAlign: 'center' },
  
  errorTitle: { color: '#ef4444', fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  errorCard: { backgroundColor: '#1e293b', padding: 20, borderRadius: 16, marginBottom: 15 },
  errorSku: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  errorName: { color: '#94a3b8', fontSize: 14, marginBottom: 10 },
  errorStats: { flexDirection: 'row', gap: 20, marginBottom: 10 },
  stat: { color: '#cbd5e1', fontSize: 14, fontWeight: 'bold' },
  faltanteBadge: { backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: 8, borderRadius: 8, fontWeight: 'bold', textAlign: 'center' },
  sobranteBadge: { backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', padding: 8, borderRadius: 8, fontWeight: 'bold', textAlign: 'center' },
  
  newAuditBtn: { backgroundColor: '#3b82f6', padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 20 },
  newAuditText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
