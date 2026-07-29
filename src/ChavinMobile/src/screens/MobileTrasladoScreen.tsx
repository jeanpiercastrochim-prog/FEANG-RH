import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, Platform, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, ScanLine, Package, MapPin, CheckCircle2, ArrowRight } from 'lucide-react-native';
import { Camera, CameraView } from 'expo-camera';
import axios from 'axios';

const API_URL = Platform.OS === 'web' ? 'https://technical-latina-chastenedly.ngrok-free.dev/api' : 'https://technical-latina-chastenedly.ngrok-free.dev/api';

export default function MobileTrasladoScreen({ navigation }: any) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  
  // SCAN_PRODUCT -> SCAN_RACK -> INPUT -> SUCCESS
  const [step, setStep] = useState<'SCAN_PRODUCT' | 'SCAN_RACK' | 'INPUT' | 'SUCCESS'>('SCAN_PRODUCT');
  
  const [scannedProduct, setScannedProduct] = useState<any>(null);
  const [targetRack, setTargetRack] = useState<string>('');
  const [cantidad, setCantidad] = useState('');
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = ({ type, data }: any) => {
    if (step === 'SCAN_PRODUCT') {
      try {
        let parsed = data;
        if (data.startsWith('{')) parsed = JSON.parse(data);
        
        const sku = parsed.sku || parsed;
        setScannedProduct({ sku, raw: data });
        setStep('SCAN_RACK');
      } catch (e) {
        setScannedProduct({ sku: data, raw: data });
        setStep('SCAN_RACK');
      }
    } else if (step === 'SCAN_RACK') {
      // Assuming rack format is RACK-R1-A or R1-A or JSON
      let rackCode = data;
      try {
        if (data.startsWith('{')) rackCode = JSON.parse(data).rack || data;
        else if (data.startsWith('RACK-')) rackCode = data.replace('RACK-', '');
      } catch(e) {}
      
      setTargetRack(rackCode);
      setStep('INPUT');
    }
  };

  const handleTraslado = async () => {
    if (!cantidad) {
      Alert.alert('Error', 'Debe ingresar una cantidad a trasladar.');
      return;
    }
    
    setLoading(true);
    try {
      const payload = {
        ProductoCodigo: scannedProduct.sku,
        Cantidad: parseInt(cantidad),
        NuevoRack: targetRack,
        Responsable: 'Almacenero Móvil'
      };
      
      const response = await axios.post(`${API_URL}/almacen/traslado`, payload);
      if (response.data.success) {
        setStep('SUCCESS');
      } else {
        Alert.alert('Error', response.data.message || 'Error al realizar el traslado.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Error de conexión con el servidor.');
    }
    setLoading(false);
  };

  const resetFlow = () => {
    setScannedProduct(null);
    setTargetRack('');
    setCantidad('');
    setStep('SCAN_PRODUCT');
  };

  if (hasPermission === null) return <View />;
  if (hasPermission === false) return <Text>Sin acceso a la cámara</Text>;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#0f172a', '#020617']} style={StyleSheet.absoluteFill} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reubicación</Text>
        <View style={{ width: 40 }} />
      </View>

      {step === 'SCAN_PRODUCT' && (
        <View style={styles.cameraContainer}>
          <Text style={styles.cameraInstructions}>Paso 1: Escanea el PRODUCTO a reubicar</Text>
          <View style={styles.cameraFrame}>
            <CameraView 
              style={StyleSheet.absoluteFill}
              onBarcodeScanned={handleBarCodeScanned}
              barcodeScannerSettings={{ barcodeTypes: ['qr', 'code128', 'ean13'] }}
            />
            <View style={styles.overlayCenter}>
              <ScanLine size={200} color="rgba(255,255,255,0.4)" strokeWidth={1} />
            </View>
          </View>
        </View>
      )}

      {step === 'SCAN_RACK' && (
        <View style={styles.cameraContainer}>
          <Text style={styles.cameraInstructions}>Paso 2: Escanea el RACK de DESTINO</Text>
          <View style={styles.cameraFrame}>
            <CameraView 
              style={StyleSheet.absoluteFill}
              onBarcodeScanned={handleBarCodeScanned}
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            />
            <View style={styles.overlayCenter}>
              <MapPin size={200} color="rgba(255,255,255,0.4)" strokeWidth={1} />
            </View>
          </View>
        </View>
      )}

      {step === 'INPUT' && (
        <View style={styles.inputContainer}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Resumen de Traslado</Text>
            
            <View style={styles.summaryRow}>
              <Package size={24} color="#3b82f6" />
              <Text style={styles.summaryText}>Producto: <Text style={styles.bold}>{scannedProduct.sku}</Text></Text>
            </View>
            
            <View style={styles.summaryRow}>
              <ArrowRight size={24} color="#64748b" />
            </View>

            <View style={styles.summaryRow}>
              <MapPin size={24} color="#10b981" />
              <Text style={styles.summaryText}>Destino: <Text style={styles.bold}>{targetRack}</Text></Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Cantidad a Mover</Text>
              <TextInput 
                style={styles.input}
                placeholder="Ej. 10"
                keyboardType="numeric"
                value={cantidad}
                onChangeText={setCantidad}
              />
            </View>

            <View style={styles.btnRow}>
              <TouchableOpacity style={[styles.btn, styles.btnCancel]} onPress={resetFlow}>
                <Text style={styles.btnTextCancel}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={handleTraslado} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnTextPrimary}>Confirmar Traslado</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {step === 'SUCCESS' && (
        <View style={styles.successContainer}>
          <CheckCircle2 size={80} color="#10b981" />
          <Text style={styles.successTitle}>¡Traslado Exitoso!</Text>
          <Text style={styles.successDesc}>Los productos han sido reubicados correctamente en el almacén.</Text>
          
          <TouchableOpacity style={styles.newActionBtn} onPress={resetFlow}>
            <Text style={styles.newActionText}>Realizar otro traslado</Text>
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
  cameraInstructions: { color: '#94a3b8', fontSize: 16, marginBottom: 20, fontWeight: 'bold' },
  cameraFrame: { width: 300, height: 400, borderRadius: 24, overflow: 'hidden', borderWidth: 2, borderColor: '#334155' },
  overlayCenter: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  
  inputContainer: { flex: 1, padding: 20, justifyContent: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 24, padding: 24 },
  cardTitle: { fontSize: 20, fontWeight: 'bold', color: '#0f172a', marginBottom: 20, textAlign: 'center' },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 8 },
  summaryText: { fontSize: 16, color: '#475569' },
  bold: { fontWeight: '900', color: '#0f172a' },
  
  inputGroup: { marginTop: 20, marginBottom: 30 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#64748b', marginBottom: 8 },
  input: { backgroundColor: '#f1f5f9', borderRadius: 12, padding: 16, fontSize: 18, color: '#0f172a', fontWeight: 'bold' },
  
  btnRow: { flexDirection: 'row', gap: 10 },
  btn: { flex: 1, padding: 16, borderRadius: 16, alignItems: 'center' },
  btnCancel: { backgroundColor: '#e2e8f0' },
  btnPrimary: { backgroundColor: '#3b82f6' },
  btnTextCancel: { color: '#475569', fontWeight: 'bold', fontSize: 16 },
  btnTextPrimary: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  successTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginTop: 20 },
  successDesc: { color: '#94a3b8', textAlign: 'center', marginTop: 10, fontSize: 16 },
  newActionBtn: { backgroundColor: '#3b82f6', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 12, marginTop: 40 },
  newActionText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
