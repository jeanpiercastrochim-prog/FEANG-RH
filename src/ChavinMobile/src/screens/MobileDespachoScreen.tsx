import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, Platform, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, ScanLine, Package, MapPin, CheckCircle2, PenTool } from 'lucide-react-native';
import { Camera, CameraView } from 'expo-camera';
import SignatureScreenCanvas from 'react-native-signature-canvas';
import axios from 'axios';
import { enqueueTransaction } from '../services/OfflineSyncService';

const API_URL = Platform.OS === 'web' ? 'https://technical-latina-chastenedly.ngrok-free.dev/api' : 'https://technical-latina-chastenedly.ngrok-free.dev/api';

export default function MobileDespachoScreen({ navigation }: any) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [step, setStep] = useState<'SCAN' | 'SUCCESS'>('SCAN');
  
  const [scannedProduct, setScannedProduct] = useState<any>(null);
  const [cantidad, setCantidad] = useState('');
  const [solicitante, setSolicitante] = useState('');
  const [area, setArea] = useState('');
  const [turno, setTurno] = useState('Día');
  const [planta, setPlanta] = useState('');
  const [equipoLinea, setEquipoLinea] = useState('');
  const [observacion, setObservacion] = useState('');
  const [firmaBase64, setFirmaBase64] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [showSignature, setShowSignature] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = ({ type, data }: any) => {
    if (!modalVisible && step === 'SCAN') {
      try {
        // Expected format from Etiqueta QR: {"sku":"123", "ubicacion":"R-1"}
        const parsed = JSON.parse(data);
        if (parsed.sku) {
          setScannedProduct(parsed);
          setModalVisible(true);
        } else {
          Alert.alert('Error', 'El código QR no es un formato válido de producto.');
        }
      } catch (e) {
        // Si no es JSON, asumimos que el texto directo es el SKU
        setScannedProduct({ sku: data, ubicacion: 'Desconocida' });
        setModalVisible(true);
      }
    }
  };

  const handleDespachar = async (firmaUrlBase64?: string) => {
    if (!cantidad) {
      Alert.alert('Error', 'Debe ingresar una cantidad a despachar.');
      return;
    }
    
    setLoading(true);
    try {
      const payload = {
        ProductoCodigo: scannedProduct.sku,
        Cantidad: parseInt(cantidad),
        Documento: 'MOVIL-DESPACHO',
        Responsable: 'Almacenero Móvil',
        NombreSolicitante: solicitante || 'Anónimo',
        AreaSolicitante: area || 'General',
        CargoSolicitante: 'Operario',
        Turno: turno,
        MotivoObservacion: observacion,
        FirmaBase64: firmaUrlBase64 || firmaBase64 || null
      };
      
      const response = await axios.post(`${API_URL}/almacen/despacho`, payload);
      if (response.data.success) {
        setModalVisible(false);
        setShowSignature(false);
        setStep('SUCCESS');
      } else {
        Alert.alert('Error', response.data.message || 'Error al despachar el producto.');
      }
    } catch (error: any) {
      if (error.message === 'Network Error' || error.code === 'ECONNABORTED' || !error.response) {
        await enqueueTransaction({
          type: 'DESPACHO',
          payload: {
            ProductoCodigo: scannedProduct.sku,
            Cantidad: parseInt(cantidad),
            Documento: 'MOVIL-DESPACHO',
            Responsable: 'Almacenero Móvil',
            NombreSolicitante: solicitante || 'Anónimo',
            AreaSolicitante: area || 'General',
            CargoSolicitante: 'Operario',
            Turno: turno,
            MotivoObservacion: observacion,
            FirmaBase64: firmaUrlBase64 || firmaBase64 || null
          }
        });
        Alert.alert('Modo Offline', 'Sin conexión. El despacho se guardó localmente y se sincronizará luego.');
        setModalVisible(false);
        setShowSignature(false);
        setStep('SUCCESS');
      } else {
        Alert.alert('Error', error.response?.data?.message || 'Error de conexión con el servidor.');
      }
    }
    setLoading(false);
  };

  const handleSignature = (signature: string) => {
    setFirmaBase64(signature);
    handleDespachar(signature);
  };

  const resetFlow = () => {
    setScannedProduct(null);
    setCantidad('');
    setSolicitante('');
    setArea('');
    setTurno('Día');
    setPlanta('');
    setEquipoLinea('');
    setObservacion('');
    setFirmaBase64(null);
    setStep('SCAN');
  };

  if (hasPermission === null) return <View style={styles.container} />;
  if (hasPermission === false) return <View style={styles.container}><Text style={{color:'white'}}>No access to camera</Text></View>;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#0f172a', '#020617']} style={StyleSheet.absoluteFill} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Despacho</Text>
        <View style={{ width: 40 }} />
      </View>

      {step === 'SCAN' && (
        <View style={styles.cameraContainer}>
          <Text style={styles.stepTitle}>Escanear Producto</Text>
          <Text style={styles.stepDesc}>Apunta la cámara al código QR de la etiqueta del producto que deseas despachar.</Text>
          <View style={styles.cameraFrame}>
            <CameraView 
              style={StyleSheet.absoluteFill} 
              onBarcodeScanned={handleBarCodeScanned}
            />
            <View style={styles.overlay} />
          </View>
        </View>
      )}

      {step === 'SUCCESS' && (
        <View style={styles.successContainer}>
          <CheckCircle2 size={80} color="#3b82f6" />
          <Text style={styles.successTitle}>¡Despacho Exitoso!</Text>
          <Text style={styles.successDesc}>El producto ha sido despachado y el inventario actualizado.</Text>
          
          <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: '#3b82f6' }]} onPress={resetFlow}>
            <Text style={styles.btnText}>Despachar Otro Producto</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: '#334155', marginTop: 10 }]} onPress={() => navigation.goBack()}>
            <Text style={styles.btnText}>Volver al Menú</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Modal / Bottom Sheet para Confirmar Despacho */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Confirmar Despacho</Text>
            
            {!showSignature ? (
              <>
                {scannedProduct && (
                  <View style={styles.productCard}>
                    <View style={styles.productInfoRow}>
                      <Package size={20} color="#3b82f6" />
                      <Text style={styles.productInfoLabel}>SKU: </Text>
                      <Text style={styles.productInfoValue}>{scannedProduct.sku}</Text>
                    </View>
                    <View style={styles.productInfoRow}>
                      <MapPin size={20} color="#10b981" />
                      <Text style={styles.productInfoLabel}>Ubicación: </Text>
                      <Text style={styles.productInfoValue}>{scannedProduct.ubicacion || 'N/A'}</Text>
                    </View>
                  </View>
                )}
                     <View style={styles.formContainer}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Cantidad a Despachar *</Text>
                    <TextInput 
                      style={styles.input}
                      placeholder="0"
                      placeholderTextColor="#475569"
                      keyboardType="numeric"
                      value={cantidad}
                      onChangeText={setCantidad}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Turno *</Text>
                    <TextInput 
                      style={styles.input}
                      placeholder="Ej. Día, Tarde, Noche"
                      placeholderTextColor="#475569"
                      value={turno}
                      onChangeText={setTurno}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Área *</Text>
                    <TextInput 
                      style={styles.input}
                      placeholder="Ej. Mantenimiento"
                      placeholderTextColor="#475569"
                      value={area}
                      onChangeText={setArea}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Nombre quien Recibe *</Text>
                    <TextInput 
                      style={styles.input}
                      placeholder="Ej. Juan Perez"
                      placeholderTextColor="#475569"
                      value={solicitante}
                      onChangeText={setSolicitante}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Planta (Opcional)</Text>
                    <TextInput 
                      style={styles.input}
                      placeholderTextColor="#475569"
                      value={planta}
                      onChangeText={setPlanta}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Equipo/Línea (Opcional)</Text>
                    <TextInput 
                      style={styles.input}
                      placeholderTextColor="#475569"
                      value={equipoLinea}
                      onChangeText={setEquipoLinea}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Observaciones (Opcional)</Text>
                    <TextInput 
                      style={[styles.input, { height: 60, textAlignVertical: 'top' }]}
                      placeholder="Notas adicionales..."
                      placeholderTextColor="#475569"
                      multiline
                      value={observacion}
                      onChangeText={setObservacion}
                    />
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 20, marginBottom: 40 }}>
                  <TouchableOpacity 
                    style={[styles.primaryBtn, { flex: 1, backgroundColor: '#e2e8f0' }]} 
                    onPress={() => {
                      setModalVisible(false);
                      setScannedProduct(null);
                    }}
                    disabled={loading}
                  >
                    <Text style={[styles.btnText, { color: '#475569' }]}>Cancelar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.primaryBtn, { flex: 1, backgroundColor: '#3b82f6', flexDirection: 'row', gap: 10 }]} 
                    onPress={() => {
                      if (!cantidad) {
                        Alert.alert('Error', 'Debe ingresar una cantidad.');
                        return;
                      }
                      setShowSignature(true);
                    }}
                    disabled={loading}
                  >
                    <PenTool size={20} color="#fff" />
                    <Text style={styles.btnText}>Firmar y Despachar</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={{ height: 350 }}>
                <Text style={{ marginBottom: 10, color: '#64748b' }}>Firma del solicitante ({solicitante || 'Anónimo'}):</Text>
                {Platform.OS === 'web' ? (
                   <View style={{ flex: 1, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', borderRadius: 12 }}>
                     <Text>Firma digital no soportada en Web.</Text>
                     <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: '#10b981', marginTop: 20 }]} onPress={() => handleDespachar()}>
                       <Text style={styles.btnText}>Continuar sin firma</Text>
                     </TouchableOpacity>
                   </View>
                ) : (
                  <SignatureScreenCanvas
                    onOK={handleSignature}
                    onEmpty={() => Alert.alert('Error', 'La firma no puede estar vacía')}
                    descriptionText="Firma"
                    clearText="Limpiar"
                    confirmText="Guardar y Despachar"
                    webStyle={`.m-signature-pad {box-shadow: none; border-radius: 12px; border: 1px solid #e2e8f0;} 
                               .m-signature-pad--footer {display: flex; justify-content: space-between;}`}
                  />
                )}
                <TouchableOpacity 
                  style={[styles.primaryBtn, { backgroundColor: '#e2e8f0', marginTop: 10 }]} 
                  onPress={() => setShowSignature(false)}
                >
                  <Text style={[styles.btnText, { color: '#475569' }]}>Atrás</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, justifyContent: 'space-between' },
  backBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  
  cameraContainer: { flex: 1, padding: 20, alignItems: 'center' },
  stepTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 10, alignSelf: 'flex-start' },
  stepDesc: { color: '#94a3b8', fontSize: 16, marginBottom: 20, alignSelf: 'flex-start' },
  cameraFrame: { width: '100%', height: 400, borderRadius: 24, overflow: 'hidden', borderWidth: 2, borderColor: '#3b82f6' },
  overlay: { ...StyleSheet.absoluteFillObject, borderWidth: 2, borderColor: 'rgba(59, 130, 246, 0.5)' },
  
  successContainer: { flex: 1, padding: 20, alignItems: 'center', justifyContent: 'center' },
  successTitle: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginTop: 20, marginBottom: 10 },
  successDesc: { color: '#94a3b8', fontSize: 16, textAlign: 'center', marginBottom: 40, lineHeight: 24 },
  
  primaryBtn: { padding: 16, borderRadius: 16, alignItems: 'center', width: '100%' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, minHeight: '50%' },
  modalHandle: { width: 40, height: 5, backgroundColor: '#cbd5e1', borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#0f172a', marginBottom: 20 },
  
  productCard: { backgroundColor: '#f1f5f9', padding: 15, borderRadius: 12, marginBottom: 20 },
  productInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  productInfoLabel: { fontSize: 16, color: '#64748b', marginLeft: 8, fontWeight: '600' },
  productInfoValue: { fontSize: 16, color: '#0f172a', fontWeight: 'bold' },
  
  inputGroup: { marginBottom: 15 },
  label: { color: '#475569', marginBottom: 8, fontSize: 14, fontWeight: '600' },
  input: { backgroundColor: '#f8fafc', borderRadius: 12, padding: 14, color: '#0f172a', fontSize: 16, borderWidth: 1, borderColor: '#e2e8f0' },
});
