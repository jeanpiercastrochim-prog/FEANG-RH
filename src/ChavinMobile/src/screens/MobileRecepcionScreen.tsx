import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Camera as CameraIcon, ScanLine, Save, CheckCircle2 } from 'lucide-react-native';
import { Camera, CameraView } from 'expo-camera';
import axios from 'axios';
import { enqueueTransaction } from '../services/OfflineSyncService';

const API_URL = Platform.OS === 'web' ? 'https://technical-latina-chastenedly.ngrok-free.dev/api' : 'https://technical-latina-chastenedly.ngrok-free.dev/api';

export default function MobileRecepcionScreen({ navigation }: any) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [step, setStep] = useState<'SCAN_RACK' | 'FORM' | 'PHOTO' | 'SUCCESS'>('SCAN_RACK');
  
  const [rack, setRack] = useState('');
  const [codigo, setCodigo] = useState('');
  const [nombreProducto, setNombreProducto] = useState('');
  const [categoria, setCategoria] = useState('');
  const [unidadMedida, setUnidadMedida] = useState('Unidad');
  const [cantidad, setCantidad] = useState('');
  const [proveedor, setProveedor] = useState('');
  const [documentoRef, setDocumentoRef] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [fotoBase64, setFotoBase64] = useState('');
  
  const [loading, setLoading] = useState(false);
  const cameraRef = useRef<any>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = ({ type, data }: any) => {
    if (step === 'SCAN_RACK') {
      setRack(data);
      setStep('FORM');
    }
  };

  const handleTakePicture = async () => {
    if (cameraRef.current) {
      setLoading(true);
      try {
        const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.5 });
        setFotoBase64(`data:image/jpeg;base64,${photo.base64}`);
        setStep('FORM');
      } catch (error) {
        Alert.alert('Error', 'No se pudo tomar la foto');
      }
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!codigo || !cantidad) {
      Alert.alert('Error', 'Código y cantidad son obligatorios');
      return;
    }
    
    setLoading(true);
    try {
      const payload = {
        ProductoCodigo: codigo,
        NombreProducto: nombreProducto || 'Producto S/N',
        Categoria: categoria || 'General',
        UnidadMedida: unidadMedida || 'Unidad',
        Cantidad: parseInt(cantidad),
        UbicacionRack: rack,
        Proveedor: proveedor,
        Documento: documentoRef || 'MOVIL-REC',
        Responsable: 'Almacenero Móvil',
        MotivoObservacion: observaciones,
        ImagenBase64: fotoBase64 || null
      };
      
      const response = await axios.post(`${API_URL}/almacen/ingreso`, payload);
      if (response.data.success) {
        setStep('SUCCESS');
      } else {
        Alert.alert('Error', response.data.message || 'Error al registrar ingreso');
      }
    } catch (error: any) {
      if (error.message === 'Network Error' || error.code === 'ECONNABORTED' || !error.response) {
        // Offline Mode
        await enqueueTransaction({
          type: 'RECEPCION',
          payload: {
            ProductoCodigo: codigo,
            NombreProducto: nombreProducto || 'Producto S/N',
            Categoria: categoria || 'General',
            UnidadMedida: unidadMedida || 'Unidad',
            Cantidad: parseInt(cantidad),
            UbicacionRack: rack,
            Proveedor: proveedor,
            Documento: documentoRef || 'MOVIL-REC',
            Responsable: 'Almacenero Móvil',
            MotivoObservacion: observaciones,
            ImagenBase64: fotoBase64 || null
          }
        });
        Alert.alert('Modo Offline', 'Sin conexión. El ingreso se guardó localmente y se sincronizará cuando haya internet.');
        setStep('SUCCESS');
      } else {
        Alert.alert('Error', error.response?.data?.message || 'Error de conexión');
      }
    }
    setLoading(false);
  };

  const resetFlow = () => {
    setRack('');
    setCodigo('');
    setNombreProducto('');
    setCategoria('');
    setUnidadMedida('Unidad');
    setCantidad('');
    setProveedor('');
    setDocumentoRef('');
    setObservaciones('');
    setFotoBase64('');
    setStep('SCAN_RACK');
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
        <Text style={styles.headerTitle}>Recepción</Text>
        <View style={{ width: 40 }} />
      </View>

      {step === 'SCAN_RACK' && (
        <View style={styles.cameraContainer}>
          <Text style={styles.stepTitle}>Escanear Rack</Text>
          <Text style={styles.stepDesc}>Apunta la cámara al código QR de la ubicación destino.</Text>
          <View style={styles.cameraFrame}>
            <CameraView 
              style={StyleSheet.absoluteFill} 
              onBarcodeScanned={handleBarCodeScanned}
            />
            <View style={styles.overlay} />
          </View>
        </View>
      )}

      {step === 'PHOTO' && (
        <View style={styles.cameraContainer}>
          <Text style={styles.stepTitle}>Fotografía</Text>
          <Text style={styles.stepDesc}>Toma una foto en vivo del producto.</Text>
          <View style={styles.cameraFrame}>
            <CameraView 
              style={StyleSheet.absoluteFill} 
              ref={cameraRef}
            />
          </View>
          <TouchableOpacity 
            style={[styles.primaryBtn, { marginTop: 20 }]} 
            onPress={handleTakePicture}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Capturar Foto</Text>}
          </TouchableOpacity>
        </View>
      )}

      {step === 'FORM' && (
        <ScrollView style={styles.formContainer} contentContainerStyle={{ paddingBottom: 40 }}>
          <Text style={styles.stepTitle}>Datos del Ingreso</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Rack Destino</Text>
            <View style={styles.readOnlyInput}>
              <Text style={{color: '#94a3b8', fontSize: 16}}>{rack}</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Código de Producto *</Text>
            <TextInput 
              style={styles.input}
              placeholder="Ej. SKU-102"
              placeholderTextColor="#475569"
              value={codigo}
              onChangeText={setCodigo}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre del Producto *</Text>
            <TextInput 
              style={styles.input}
              placeholder="Ej. Casco de Seguridad"
              placeholderTextColor="#475569"
              value={nombreProducto}
              onChangeText={setNombreProducto}
            />
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Categoría</Text>
              <TextInput 
                style={styles.input}
                placeholder="Ej. EPP"
                placeholderTextColor="#475569"
                value={categoria}
                onChangeText={setCategoria}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Unidad</Text>
              <TextInput 
                style={styles.input}
                placeholder="Ej. Unidades"
                placeholderTextColor="#475569"
                value={unidadMedida}
                onChangeText={setUnidadMedida}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Cantidad *</Text>
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
            <Text style={styles.label}>Documento Referencia (Guía/Factura)</Text>
            <TextInput 
              style={styles.input}
              placeholder="Ej. GUI-00123"
              placeholderTextColor="#475569"
              value={documentoRef}
              onChangeText={setDocumentoRef}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Proveedor (Opcional)</Text>
            <TextInput 
              style={styles.input}
              placeholder="Nombre del proveedor"
              placeholderTextColor="#475569"
              value={proveedor}
              onChangeText={setProveedor}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Observaciones (Opcional)</Text>
            <TextInput 
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
              placeholder="Detalles adicionales..."
              placeholderTextColor="#475569"
              multiline
              numberOfLines={3}
              value={observaciones}
              onChangeText={setObservaciones}
            />
          </View>

          <TouchableOpacity 
            style={styles.photoBtn} 
            onPress={() => setStep('PHOTO')}
          >
            <CameraIcon size={24} color={fotoBase64 ? "#10b981" : "#3b82f6"} />
            <Text style={[styles.photoBtnText, fotoBase64 && { color: '#10b981' }]}>
              {fotoBase64 ? 'Foto Adjuntada ✔' : 'Adjuntar Fotografía'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.primaryBtn} 
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Registrar Recepción</Text>}
          </TouchableOpacity>
        </ScrollView>
      )}

      {step === 'SUCCESS' && (
        <View style={styles.successContainer}>
          <CheckCircle2 size={80} color="#10b981" />
          <Text style={styles.successTitle}>¡Recepción Exitosa!</Text>
          <Text style={styles.successDesc}>El producto ha sido ingresado al inventario en la ubicación {rack}.</Text>
          
          <TouchableOpacity style={styles.primaryBtn} onPress={resetFlow}>
            <Text style={styles.btnText}>Recepcionar Nuevo Producto</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: '#334155', marginTop: 10 }]} onPress={() => navigation.goBack()}>
            <Text style={styles.btnText}>Volver al Menú</Text>
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
  
  cameraContainer: { flex: 1, padding: 20, alignItems: 'center' },
  stepTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 10, alignSelf: 'flex-start' },
  stepDesc: { color: '#94a3b8', fontSize: 16, marginBottom: 20, alignSelf: 'flex-start' },
  cameraFrame: { width: '100%', height: 400, borderRadius: 24, overflow: 'hidden', borderWidth: 2, borderColor: '#3b82f6' },
  overlay: { ...StyleSheet.absoluteFillObject, borderWidth: 2, borderColor: 'rgba(59, 130, 246, 0.5)' },
  
  formContainer: { padding: 20, flex: 1 },
  inputGroup: { marginBottom: 20 },
  label: { color: '#94a3b8', marginBottom: 8, fontSize: 14, fontWeight: '600' },
  input: { backgroundColor: '#0f172a', borderRadius: 12, padding: 16, color: '#fff', fontSize: 16, borderWidth: 1, borderColor: '#334155' },
  readOnlyInput: { backgroundColor: '#020617', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#1e293b' },
  
  photoBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.3)', marginBottom: 20, gap: 10 },
  photoBtnText: { color: '#3b82f6', fontSize: 16, fontWeight: 'bold' },
  
  primaryBtn: { backgroundColor: '#10b981', padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 10, width: '100%' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  successContainer: { flex: 1, padding: 20, alignItems: 'center', justifyContent: 'center' },
  successTitle: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginTop: 20, marginBottom: 10 },
  successDesc: { color: '#94a3b8', fontSize: 16, textAlign: 'center', marginBottom: 40, lineHeight: 24 }
});
