import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Platform, Alert, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { CheckCircle, Info, Eraser, PenTool } from 'lucide-react-native';
import SignatureScreenCanvas from 'react-native-signature-canvas';
import axios from 'axios';
import * as LocalAuthentication from 'expo-local-authentication';
import WebSignature from '../components/WebSignature';

const API_URL = Platform.OS === 'web' ? 'http://localhost:5050/api' : 'http://127.0.0.1:5050/api';

export default function SignatureScreen({ route, navigation }: any) {
  const { formData, employee } = route.params || {};
  const ref = useRef<any>(null);
  
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOK = async (signatureBase64: string) => {
    setIsSubmitting(true);
    try {
      let isBiometricValidated = false;

      // 1. Intentar validación biométrica en dispositivos móviles reales (no web)
      if (Platform.OS !== 'web') {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();

        if (hasHardware && isEnrolled) {
          const authResult = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Verifica tu identidad para firmar el contrato',
            cancelLabel: 'Cancelar',
            disableDeviceFallback: false,
          });

          if (!authResult.success) {
            Alert.alert('Autenticación cancelada', 'Debes verificar tu identidad para poder firmar.');
            setIsSubmitting(false);
            return;
          }
          
          isBiometricValidated = true;
        } else {
          // Dispositivo sin biometría o no configurada: podemos decidir dejarlo pasar con un warning
          // o pedir un PIN de respaldo. Por ahora asumimos false.
          Alert.alert('Aviso', 'No se detectó configuración biométrica. El contrato se firmará sin validación de hardware.');
        }
      }

      // 2. Enviar el contrato al servidor
      await axios.post(`${API_URL}/Process/submit-mobile`, {
        ...formData,
        signatureBase64,
        isBiometricValidated // Adjuntamos el flag al payload
      });
      
      setShowSuccess(true);
    } catch (error) {
      console.error(error);
      if (Platform.OS === 'web') window.alert('Hubo un problema enviando los datos.');
      else Alert.alert('Error', 'Hubo un problema enviando los datos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClear = () => {
    ref.current?.clearSignature();
  };

  const handleConfirm = () => {
    ref.current?.readSignature();
  };

  const finishProcess = () => {
    setShowSuccess(false);
    if (employee) {
      navigation.navigate('Home', { employee });
    } else {
      navigation.navigate('Login');
    }
  };

  const style = `
    .m-signature-pad {
      box-shadow: none; border: none;
    }
    .m-signature-pad--body {
      border: none;
    }
    .m-signature-pad--footer {
      display: none;
    }
    body,html {
      width: 100%; height: 100%; margin: 0; padding: 0;
    }
  `;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#0f172a', '#020617']} style={StyleSheet.absoluteFill} />
      
      <View style={styles.header}>
        <Text style={styles.step}>PASO 6 DE 6</Text>
        <Text style={styles.title}>Firma Digital</Text>
        <Text style={styles.subtitle}>Dibuja tu firma. Esta se adjuntará a tu expediente digital.</Text>
      </View>

      <View style={styles.canvasContainer}>
        <View style={styles.canvasHeader}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <PenTool size={18} color="#3b82f6" style={{marginRight: 8}} />
            <Text style={{color: '#fff', fontWeight: '600'}}>Dibuja tu firma aquí</Text>
          </View>
          <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
            <Eraser size={14} color="#ef4444" />
            <Text style={{color: '#ef4444', fontSize: 12, marginLeft: 4, fontWeight: '600'}}>Limpiar</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.canvasWrapper}>
          {Platform.OS === 'web' ? (
            <WebSignature ref={ref} onOK={handleOK} />
          ) : (
            <SignatureScreenCanvas
              ref={ref}
              onOK={handleOK}
              webStyle={style}
              autoClear={false}
              descriptionText="Firma"
            />
          )}
          <View style={styles.linePlaceholder}>
             <View style={styles.line} />
             <Text style={styles.lineText}>Firma aquí</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.button, isSubmitting && { opacity: 0.7 }]} 
          onPress={handleConfirm}
          disabled={isSubmitting}
        >
          <LinearGradient
            colors={['#3b82f6', '#2563eb']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientButton}
          >
            <Text style={styles.buttonText}>
              {isSubmitting ? 'ENVIANDO...' : 'GUARDAR Y FINALIZAR'}
            </Text>
            {!isSubmitting && <CheckCircle color="#ffffff" size={20} />}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* SUCCESS MODAL */}
      <Modal visible={showSuccess} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <LinearGradient colors={['#1e293b', '#0f172a']} style={styles.modalContent}>
            <View style={styles.iconContainer}>
              <CheckCircle size={40} color="#22c55e" />
            </View>
            <Text style={styles.modalTitle}>¡Proceso Completado!</Text>
            <Text style={styles.modalText}>
              Tus datos, documentos y firma han sido enviados exitosamente a Recursos Humanos.
            </Text>
            <View style={styles.infoBox}>
              <Info size={20} color="#60a5fa" />
              <Text style={styles.infoText}>
                Acérquese al personal de RR.HH. para la verificación e impresión de su contrato oficial.
              </Text>
            </View>
            <TouchableOpacity style={styles.modalButton} onPress={finishProcess}>
              <Text style={styles.modalButtonText}>Entendido</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  header: {
    padding: 24,
  },
  step: {
    color: '#3b82f6',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#94a3b8',
    marginBottom: 16,
    lineHeight: 22,
  },
  canvasContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  canvasHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  canvasWrapper: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#3b82f6',
    position: 'relative',
  },
  linePlaceholder: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    width: '100%',
    alignItems: 'center',
    pointerEvents: 'none',
    opacity: 0.5,
  },
  line: {
    width: '80%',
    height: 1,
    backgroundColor: '#94a3b8',
  },
  lineText: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  footer: {
    padding: 24,
  },
  button: {
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 8 },
      android: { elevation: 4 },
      web: { boxShadow: '0px 6px 16px rgba(59, 130, 246, 0.3)' as any }
    }),
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    marginRight: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  modalText: {
    fontSize: 15,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    padding: 16,
    borderRadius: 16,
    gap: 12,
    marginBottom: 32,
  },
  infoText: {
    flex: 1,
    color: '#bfdbfe',
    fontSize: 14,
    lineHeight: 20,
  },
  modalButton: {
    backgroundColor: '#3b82f6',
    width: '100%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  }
});
