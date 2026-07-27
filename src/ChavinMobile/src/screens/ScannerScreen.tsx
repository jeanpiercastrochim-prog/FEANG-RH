import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Camera as CameraIcon, Image as ImageIcon, BrainCircuit, ScanText } from 'lucide-react-native';
import axios from 'axios';

const API_URL = Platform.OS === 'web' ? 'http://localhost:5051/api' : 'http://10.0.2.2:5051/api';

export default function ScannerScreen({ navigation, route }: any) {
  const employee = route.params?.employee;
  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);
  
  const cameraRef = useRef<any>(null);
  const [step, setStep] = useState<'FRONT' | 'BACK'>('FRONT');
  const [frontImage, setFrontImage] = useState<string | null>(null);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.permissionText}>Necesitamos permiso para usar la cámara para escanear tu DNI.</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.button}>
          <Text style={styles.buttonText}>Dar Permiso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const submitOcr = async (frontUri: string, backUri: string) => {
    setLoading(true);
    try {
      const formData = new FormData();
      
      if (Platform.OS === 'web') {
        const frontResponse = await fetch(frontUri);
        const frontBlob = await frontResponse.blob();
        formData.append('frontImage', frontBlob, 'front.jpg');
        
        const backResponse = await fetch(backUri);
        const backBlob = await backResponse.blob();
        formData.append('backImage', backBlob, 'back.jpg');
      } else {
        // @ts-ignore
        formData.append('frontImage', { uri: frontUri, name: 'front.jpg', type: 'image/jpeg' });
        // @ts-ignore
        formData.append('backImage', { uri: backUri, name: 'back.jpg', type: 'image/jpeg' });
      }
      
      formData.append('mode', 'Local');

      const response = await axios.post(`${API_URL}/Ocr/extract`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        navigation.navigate('Confirmation', { extractedData: response.data.data, employee });
      } else {
        if (Platform.OS === 'web') window.alert(response.data.errorMessage || 'Error extraíndo datos.');
        else Alert.alert('Error', response.data.errorMessage || 'Error extraíndo datos.');
        setStep('FRONT');
      }
    } catch (error) {
      console.error(error);
      if (Platform.OS === 'web') window.alert('Error de conexión con el OCR.');
      else Alert.alert('Error', 'Error de conexión con el OCR.');
      setStep('FRONT');
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelected = (uri: string) => {
    if (step === 'FRONT') {
      setFrontImage(uri);
      setStep('BACK');
    } else {
      submitOcr(frontImage!, uri);
    }
  };

  const handleTakePic = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      handleImageSelected(photo.uri);
    }
  };

  const handleUploadPic = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      handleImageSelected(result.assets[0].uri);
    }
  };

  return (
    <SafeAreaView style={styles.cameraContainer}>
      <CameraView style={{ flex: 1 }} facing="back" ref={cameraRef}>
        <View style={styles.overlay}>
          <View style={styles.topBadgeContainer}>
            <View style={[styles.topBadge, step === 'BACK' && { backgroundColor: 'rgba(59, 130, 246, 0.9)' }]}>
              <Text style={styles.topBadgeText}>
                {step === 'FRONT' ? 'PASO 1 DE 2: FRENTE' : 'PASO 2 DE 2: REVERSO'}
              </Text>
            </View>
          </View>

          <View style={styles.guideContainer}>
            <View style={[styles.dniFrame, step === 'BACK' && { borderColor: '#3b82f6' }]} />
            <Text style={styles.guideText}>
              {step === 'FRONT' 
                ? 'Alinea la parte delantera de tu DNI aquí' 
                : 'Ahora voltea tu DNI y alinea el reverso'}
            </Text>
          </View>

          <View style={styles.controlsContainer}>
            <View style={styles.buttonsRow}>
              <TouchableOpacity onPress={handleTakePic} style={styles.actionBtn}>
                <View style={[styles.iconCircle, step === 'BACK' && { borderColor: '#3b82f6' }]}>
                  <CameraIcon color="#ffffff" size={24} />
                </View>
                <Text style={styles.actionText}>Tomar foto</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleUploadPic} style={styles.actionBtn}>
                <View style={[styles.iconCircle, { borderColor: '#8b5cf6' }]}>
                  <View style={[styles.innerIconCircle, { backgroundColor: '#8b5cf6' }]}>
                    <ImageIcon color="#ffffff" size={24} />
                  </View>
                </View>
                <Text style={styles.actionText}>Subir foto</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {loading && (
            <View style={styles.loadingOverlay}>
               <View style={styles.loadingCard}>
                 <BrainCircuit color="#10b981" size={48} style={{ marginBottom: 16 }} />
                 <Text style={styles.loadingTitle}>Extrayendo Datos</Text>
                 <Text style={styles.loadingSubtitle}>Procesando tu documento de forma segura con reconocimiento óptico...</Text>
                 <ActivityIndicator size="large" color="#10b981" style={{ marginTop: 24 }} />
               </View>
            </View>
          )}
        </View>
      </CameraView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  permissionText: {
    fontSize: 16,
    color: '#064e3b',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#10b981',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'space-between',
  },
  guideContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dniFrame: {
    width: '90%',
    height: 250,
    borderWidth: 3,
    borderColor: '#10b981',
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  guideText: {
    color: '#ffffff',
    marginTop: 30,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  controlsContainer: {
    height: 140,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 20,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '100%',
    paddingHorizontal: 20,
  },
  actionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  innerIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  topBadgeContainer: {
    position: 'absolute',
    top: 40,
    width: '100%',
    alignItems: 'center',
    zIndex: 10,
  },
  topBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  topBadgeText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  loadingCard: {
    backgroundColor: '#0f172a',
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
    width: '85%',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  loadingTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  loadingSubtitle: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
