import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Platform, Alert, TouchableOpacity, Modal, TextInput, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { CheckCircle, Eraser, PenTool, Camera, Upload, ArrowRight, ArrowLeft } from 'lucide-react-native';
import SignatureScreenCanvas from 'react-native-signature-canvas';
import axios from 'axios';
import * as LocalAuthentication from 'expo-local-authentication';
import * as ImagePicker from 'expo-image-picker';
import WebSignature from '../components/WebSignature';

const API_URL = Platform.OS === 'web' ? 'http://localhost:5051/api' : 'http://10.0.2.2:5051/api';

const AFPS = [
  { id: 1, name: 'AFP Integra' },
  { id: 2, name: 'AFP Prima' },
  { id: 3, name: 'AFP Profuturo' },
  { id: 4, name: 'AFP Habitat' },
  { id: 5, name: 'ONP' },
  { id: 6, name: 'Ninguno' },
];

export default function SignatureScreen({ route, navigation }: any) {
  const { formData: initialFormData, employee } = route.params || {};
  const ref = useRef<any>(null);
  
  const [step, setStep] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Extra Form State
  const [extraData, setExtraData] = useState({
    Telefono: employee?.telefono || '',
    CorreoPersonal: employee?.correoPersonal || '',
    ContactoEmergencia: employee?.contactoEmergencia || '',
    Parentesco: employee?.parentesco || '',
    TelefonoEmergencia: employee?.telefonoEmergencia || '',
    AFPId: employee?.afpId || null,
  });

  const [signatureMethod, setSignatureMethod] = useState<'canvas' | 'photo' | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const handleNextStep = () => {
    if (step === 1) {
      if (!extraData.Telefono || !extraData.CorreoPersonal || !extraData.ContactoEmergencia || !extraData.Parentesco || !extraData.TelefonoEmergencia || !extraData.AFPId) {
        Alert.alert('Datos Incompletos', 'Por favor, completa todos los campos obligatorios antes de continuar.');
        return;
      }
      setStep(2);
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permiso denegado', 'Necesitas permitir el acceso a la cámara para tomar una foto.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setPhotoUri(`data:image/jpeg;base64,${result.assets[0].base64}`);
      setStep(3);
      setSignatureMethod('photo');
    }
  };

  const selectCanvas = () => {
    setSignatureMethod('canvas');
    setStep(3);
  };

  const processSubmission = async (signatureBase64: string) => {
    setIsSubmitting(true);
    try {
      let isBiometricValidated = false;

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
          Alert.alert('Seguridad Requerida', 'Por seguridad, es obligatorio configurar tu huella dactilar o PIN biométrico en este dispositivo para poder firmar contratos.');
          setIsSubmitting(false);
          return;
        }
      }

      await axios.post(`${API_URL}/Process/submit-mobile`, {
        ...initialFormData,
        signatureBase64,
        isBiometricValidated,
        Telefono: extraData.Telefono,
        CorreoPersonal: extraData.CorreoPersonal,
        ContactoEmergencia: extraData.ContactoEmergencia,
        Parentesco: extraData.Parentesco,
        TelefonoEmergencia: extraData.TelefonoEmergencia,
        AFPId: extraData.AFPId === 6 ? null : extraData.AFPId
      });
      
      setShowSuccess(true);
    } catch (error: any) {
      console.error(error);
      let errorMsg = 'Hubo un problema enviando los datos.';
      if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      }
      console.error("Detalle del error:", error.response?.data || error.message);
      if (Platform.OS === 'web') window.alert('Error del Servidor: ' + errorMsg);
      else Alert.alert('Error del Servidor', errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCanvasOK = (signatureBase64: string) => {
    processSubmission(signatureBase64);
  };

  const handlePhotoOK = () => {
    if (photoUri) {
      processSubmission(photoUri);
    }
  };

  const handleClear = () => {
    ref.current?.clearSignature();
  };

  const handleConfirm = () => {
    if (signatureMethod === 'canvas') {
      ref.current?.readSignature();
    } else {
      handlePhotoOK();
    }
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
    .m-signature-pad { box-shadow: none; border: none; }
    .m-signature-pad--body { border: none; }
    .m-signature-pad--footer { display: none; }
    body,html { width: 100%; height: 100%; margin: 0; padding: 0; }
  `;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#0f172a', '#020617']} style={StyleSheet.absoluteFill} />
      
      <View style={styles.header}>
        {step > 1 && (
          <TouchableOpacity style={styles.backBtn} onPress={() => setStep(step - 1)}>
            <ArrowLeft size={20} color="#3b82f6" />
            <Text style={styles.backText}>Volver</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.step}>PASO {step} DE 3</Text>
        <Text style={styles.title}>
          {step === 1 ? 'Datos de Contacto' : step === 2 ? 'Método de Firma' : 'Firma de Contrato'}
        </Text>
        <Text style={styles.subtitle}>
          {step === 1 ? 'Completa estos datos obligatorios antes de firmar.' : 
           step === 2 ? 'Elige cómo prefieres registrar tu firma.' : 
           'Al guardar, se validará tu identidad mediante biometría.'}
        </Text>
      </View>

      <ScrollView style={{flex: 1}} contentContainerStyle={styles.scrollContent}>
        {step === 1 && (
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Celular *</Text>
              <TextInput style={styles.input} placeholder="987654321" placeholderTextColor="#64748b" keyboardType="phone-pad" value={extraData.Telefono} onChangeText={(v) => setExtraData({...extraData, Telefono: v})} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Correo Personal *</Text>
              <TextInput style={styles.input} placeholder="juan@email.com" placeholderTextColor="#64748b" keyboardType="email-address" autoCapitalize="none" value={extraData.CorreoPersonal} onChangeText={(v) => setExtraData({...extraData, CorreoPersonal: v})} />
            </View>
            
            <Text style={styles.sectionTitle}>En Caso de Emergencia</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombre del Contacto *</Text>
              <TextInput style={styles.input} placeholder="Maria Perez" placeholderTextColor="#64748b" value={extraData.ContactoEmergencia} onChangeText={(v) => setExtraData({...extraData, ContactoEmergencia: v})} />
            </View>
            <View style={{flexDirection: 'row', gap: 12}}>
              <View style={[styles.inputGroup, {flex: 1}]}>
                <Text style={styles.label}>Parentesco *</Text>
                <TextInput style={styles.input} placeholder="Esposa" placeholderTextColor="#64748b" value={extraData.Parentesco} onChangeText={(v) => setExtraData({...extraData, Parentesco: v})} />
              </View>
              <View style={[styles.inputGroup, {flex: 1}]}>
                <Text style={styles.label}>Celular *</Text>
                <TextInput style={styles.input} placeholder="999888777" placeholderTextColor="#64748b" keyboardType="phone-pad" value={extraData.TelefonoEmergencia} onChangeText={(v) => setExtraData({...extraData, TelefonoEmergencia: v})} />
              </View>
            </View>

            <Text style={styles.sectionTitle}>Régimen Pensionario *</Text>
            <View style={styles.chipsContainer}>
              {AFPS.map((afp) => (
                <TouchableOpacity 
                  key={afp.id} 
                  style={[styles.chip, extraData.AFPId === afp.id && styles.chipActive]}
                  onPress={() => setExtraData({...extraData, AFPId: afp.id})}
                >
                  <Text style={[styles.chipText, extraData.AFPId === afp.id && styles.chipTextActive]}>{afp.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={styles.optionsContainer}>
            <TouchableOpacity style={styles.optionCard} onPress={selectCanvas}>
              <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.optionGradient}>
                <PenTool size={48} color="#fff" />
                <Text style={styles.optionTitle}>Dibujar en Pantalla</Text>
                <Text style={styles.optionDesc}>Firma con tu dedo directamente sobre la pantalla del celular.</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.optionCard, { backgroundColor: '#1e293b' }]} onPress={takePhoto}>
              <View style={[styles.optionGradient, { padding: 32 }]}>
                <Camera size={48} color="#60a5fa" />
                <Text style={styles.optionTitle}>Tomar Foto</Text>
                <Text style={styles.optionDesc}>Toma una foto de tu firma en un papel blanco con buena iluminación.</Text>
                
                <View style={styles.tipsContainer}>
                  <Text style={styles.tipsTitle}>Recomendaciones para una firma perfecta:</Text>
                  <View style={styles.tipRow}><CheckCircle size={14} color="#10b981"/><Text style={styles.tipText}>Usa una hoja de papel 100% en blanco (sin líneas).</Text></View>
                  <View style={styles.tipRow}><CheckCircle size={14} color="#10b981"/><Text style={styles.tipText}>Escribe con lapicero de tinta oscura y gruesa.</Text></View>
                  <View style={styles.tipRow}><CheckCircle size={14} color="#10b981"/><Text style={styles.tipText}>Toma la foto de cerca, evita sombras sobre el papel.</Text></View>
                  <View style={styles.tipRow}><CheckCircle size={14} color="#10b981"/><Text style={styles.tipText}>Usa la herramienta de recortar que aparecerá para dejar solo tu firma.</Text></View>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {step === 3 && (
          <View style={styles.canvasContainer}>
            {signatureMethod === 'canvas' ? (
              <>
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
                    <WebSignature ref={ref} onOK={handleCanvasOK} />
                  ) : (
                    <SignatureScreenCanvas
                      ref={ref}
                      onOK={handleCanvasOK}
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
              </>
            ) : (
              <View style={styles.photoContainer}>
                <Image source={{ uri: photoUri! }} style={styles.photoPreview} resizeMode="contain" />
                <TouchableOpacity onPress={() => setStep(2)} style={styles.retakeBtn}>
                  <Text style={styles.retakeText}>Elegir otra foto</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>
      
      <View style={styles.footer}>
        {step === 1 ? (
          <TouchableOpacity style={styles.button} onPress={handleNextStep}>
            <LinearGradient colors={['#3b82f6', '#2563eb']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradientButton}>
              <Text style={styles.buttonText}>CONTINUAR</Text>
              <ArrowRight color="#ffffff" size={20} />
            </LinearGradient>
          </TouchableOpacity>
        ) : step === 3 ? (
          <TouchableOpacity style={[styles.button, isSubmitting && { opacity: 0.7 }]} onPress={handleConfirm} disabled={isSubmitting}>
            <LinearGradient colors={['#10b981', '#059669']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradientButton}>
              <Text style={styles.buttonText}>{isSubmitting ? 'ENVIANDO...' : 'GUARDAR Y FINALIZAR'}</Text>
              {!isSubmitting && <CheckCircle color="#ffffff" size={20} />}
            </LinearGradient>
          </TouchableOpacity>
        ) : null}
      </View>

      <Modal visible={showSuccess} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <LinearGradient colors={['#1e293b', '#0f172a']} style={styles.modalContent}>
            <View style={styles.iconContainer}>
              <CheckCircle size={40} color="#22c55e" />
            </View>
            <Text style={styles.modalTitle}>¡Proceso Completado!</Text>
            <Text style={styles.modalText}>
              Tus datos y firma han sido guardados exitosamente. Ahora podrán generar tu contrato.
            </Text>
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
  container: { flex: 1, backgroundColor: '#020617' },
  header: { padding: 24, paddingBottom: 12 },
  backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  backText: { color: '#3b82f6', fontWeight: '600', marginLeft: 4 },
  step: { color: '#3b82f6', fontSize: 12, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#94a3b8', lineHeight: 20 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  
  formContainer: { gap: 16, marginTop: 12 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginTop: 12, borderBottomWidth: 1, borderBottomColor: '#1e293b', paddingBottom: 8 },
  inputGroup: { gap: 6 },
  label: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  input: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, color: '#fff', fontSize: 15, borderWidth: 1, borderColor: '#334155' },
  
  chipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  chip: { backgroundColor: '#1e293b', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: '#334155' },
  chipActive: { backgroundColor: 'rgba(59, 130, 246, 0.2)', borderColor: '#3b82f6' },
  chipText: { color: '#94a3b8', fontWeight: '600' },
  chipTextActive: { color: '#60a5fa', fontWeight: 'bold' },

  optionsContainer: { gap: 16, marginTop: 12 },
  optionCard: { borderRadius: 20, overflow: 'hidden' },
  optionGradient: { padding: 32, alignItems: 'center', justifyContent: 'center', gap: 16 },
  optionTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  optionDesc: { color: 'rgba(255,255,255,0.8)', textAlign: 'center', paddingHorizontal: 20 },
  optionRow: { flexDirection: 'row', gap: 16 },
  smallOptionContent: { padding: 20, alignItems: 'center', justifyContent: 'center' },
  optionTitleSmall: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginTop: 12 },
  optionDescSmall: { color: '#94a3b8', textAlign: 'center', fontSize: 12, marginTop: 4 },

  tipsContainer: { marginTop: 24, backgroundColor: 'rgba(15, 23, 42, 0.5)', padding: 16, borderRadius: 16, width: '100%', borderColor: 'rgba(59, 130, 246, 0.2)', borderWidth: 1 },
  tipsTitle: { color: '#38bdf8', fontSize: 13, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  tipRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  tipText: { color: '#e2e8f0', fontSize: 12, flex: 1, lineHeight: 18 },

  canvasContainer: { flex: 1, marginTop: 12 },
  canvasHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  clearBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(239, 68, 68, 0.1)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  canvasWrapper: { height: 350, backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', borderWidth: 2, borderColor: '#3b82f6', position: 'relative' },
  linePlaceholder: { position: 'absolute', bottom: 20, left: 0, width: '100%', alignItems: 'center', pointerEvents: 'none', opacity: 0.5 },
  line: { width: '80%', height: 1, backgroundColor: '#94a3b8' },
  lineText: { color: '#64748b', fontSize: 12, marginTop: 4, fontWeight: '600' },
  
  photoContainer: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  photoPreview: { width: '100%', height: 300, borderRadius: 8, backgroundColor: '#0f172a' },
  retakeBtn: { marginTop: 16, paddingVertical: 10, paddingHorizontal: 20, backgroundColor: '#334155', borderRadius: 20 },
  retakeText: { color: '#fff', fontWeight: '600' },

  footer: { padding: 24, paddingTop: 0, paddingBottom: Platform.OS === 'ios' ? 0 : 24 },
  button: { borderRadius: 16, overflow: 'hidden', shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 8 },
  gradientButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 20, gap: 12 },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '800', letterSpacing: 1 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(2, 6, 23, 0.9)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalContent: { width: '100%', borderRadius: 32, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.2)' },
  iconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(34, 197, 94, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 12 },
  modalText: { fontSize: 15, color: '#94a3b8', textAlign: 'center', lineHeight: 24, marginBottom: 32 },
  modalButton: { backgroundColor: '#3b82f6', paddingVertical: 16, paddingHorizontal: 48, borderRadius: 20, width: '100%' },
  modalButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
});
