import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Platform, Alert, TouchableOpacity, Modal, TextInput, ScrollView, Image, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { CheckCircle, Eraser, PenTool, Camera, Upload, ArrowRight, ArrowLeft, BookOpen, User, Phone, ShieldAlert } from 'lucide-react-native';
import SignatureScreenCanvas from 'react-native-signature-canvas';
import axios from 'axios';
import * as LocalAuthentication from 'expo-local-authentication';
import * as ImagePicker from 'expo-image-picker';
import * as Device from 'expo-device';
import WebSignature from '../components/WebSignature';

const API_URL = 'https://technical-latina-chastenedly.ngrok-free.dev/api';

const AFPS = [
  { id: 1, name: 'AFP Integra' },
  { id: 2, name: 'AFP Prima' },
  { id: 3, name: 'AFP Profuturo' },
  { id: 4, name: 'AFP Habitat' },
  { id: 5, name: 'ONP' },
  { id: 6, name: 'Ninguno' },
];

export default function DirectSignatureScreen({ route, navigation }: any) {
  const { employee } = route.params || {};
  const ref = useRef<any>(null);
  
  const [step, setStep] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    Telefono: employee?.telefono || '',
    CorreoPersonal: employee?.correoPersonal || '',
    ContactoEmergencia: employee?.contactoEmergencia || '',
    Parentesco: employee?.parentesco || '',
    TelefonoEmergencia: employee?.telefonoEmergencia || '',
    AFPId: employee?.afpId || null,
    HasPrimary: employee?.hasPrimary || false,
    PrimarySchool: employee?.primarySchool || '',
    PrimaryYear: employee?.primaryYear || '',
    HasSecondary: employee?.hasSecondary || false,
    SecondarySchool: employee?.secondarySchool || '',
    SecondaryYear: employee?.secondaryYear || '',
    HasHigherEducation: employee?.hasHigherEducation || false,
    HigherEducationInstitution: employee?.higherEducationInstitution || '',
    HigherEducationYear: employee?.higherEducationYear || '',
  });

  const [signatureMethod, setSignatureMethod] = useState<'canvas' | 'photo' | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  const getBirthYear = (fecha: string) => {
    if (!fecha) return null;
    const match = fecha.match(/\d{4}/);
    return match ? parseInt(match[0], 10) : null;
  };

  const getErrors = (checkEmpty = hasAttemptedSubmit) => {
    const errs: any = {};
    
    // Validaciones al tipear
    if (formData.Telefono && formData.Telefono.length !== 9) errs.Telefono = "El celular debe tener 9 dígitos exactos.";
    if (formData.TelefonoEmergencia && formData.TelefonoEmergencia.length !== 9) errs.TelefonoEmergencia = "Debe tener 9 dígitos.";
    if (formData.CorreoPersonal && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.CorreoPersonal)) errs.CorreoPersonal = "Falta el @ o dominio válido.";
    
    const birthYear = getBirthYear(employee?.fechaNacimiento);
    const currYear = new Date().getFullYear();

    if (formData.HasPrimary && formData.PrimaryYear) {
      const py = parseInt(formData.PrimaryYear, 10);
      if (py > currYear - 3) errs.PrimaryYear = "Año muy reciente.";
      if (birthYear && py < birthYear + 11) errs.PrimaryYear = `Incoherente (Mín ${birthYear + 11}).`;
    }
    if (formData.HasSecondary && formData.SecondaryYear) {
      const sy = parseInt(formData.SecondaryYear, 10);
      if (sy > currYear) errs.SecondaryYear = "No puede ser en el futuro.";
      if (birthYear && sy < birthYear + 15) errs.SecondaryYear = `Incoherente (Mín ${birthYear + 15}).`;
    }
    if (formData.HasHigherEducation && formData.HigherEducationYear) {
      const hy = parseInt(formData.HigherEducationYear, 10);
      if (hy > currYear + 5) errs.HigherEducationYear = `Máx ${currYear + 5}.`;
      if (birthYear && hy < birthYear + 17) errs.HigherEducationYear = `Incoherente (Mín ${birthYear + 17}).`;
    }

    // Validaciones al intentar enviar (campos vacíos)
    if (checkEmpty) {
      if (!formData.Telefono) errs.Telefono = "Este campo es obligatorio.";
      if (!formData.ContactoEmergencia) errs.ContactoEmergencia = "Este campo es obligatorio.";
      if (!formData.Parentesco) errs.Parentesco = "Este campo es obligatorio.";
      if (!formData.TelefonoEmergencia) errs.TelefonoEmergencia = "Este campo es obligatorio.";
      if (!formData.AFPId) errs.AFPId = "Debes seleccionar tu sistema de pensión.";
      
      if (formData.HasPrimary && !formData.PrimarySchool) errs.PrimarySchool = "Ingresa el nombre del colegio.";
      if (formData.HasPrimary && !formData.PrimaryYear) errs.PrimaryYear = "Ingresa el año.";
      
      if (formData.HasSecondary && !formData.SecondarySchool) errs.SecondarySchool = "Ingresa el nombre del colegio.";
      if (formData.HasSecondary && !formData.SecondaryYear) errs.SecondaryYear = "Ingresa el año.";
      
      if (formData.HasHigherEducation && !formData.HigherEducationInstitution) errs.HigherEducationInstitution = "Ingresa la institución.";
      if (formData.HasHigherEducation && !formData.HigherEducationYear) errs.HigherEducationYear = "Ingresa el año.";
    }
    return errs;
  };
  
  const errors = getErrors();
  const canProceed = Object.keys(getErrors(true)).length === 0;

  const handleNextStep = () => {
    if (step === 1) {
      setHasAttemptedSubmit(true);
      const currentErrors = getErrors(true);
      
      if (Object.keys(currentErrors).length > 0) {
        Alert.alert('Datos Incorrectos', 'Por favor, corrige los errores en rojo antes de continuar.');
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
            promptMessage: 'Verifica tu identidad con tu Huella para firmar',
            cancelLabel: 'Cancelar',
            disableDeviceFallback: false,
          });

          if (!authResult.success) {
            Alert.alert('Autenticación cancelada', 'Debes verificar tu huella para poder firmar.');
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

      const signatureMetadata = JSON.stringify({
        osName: Device.osName,
        osVersion: Device.osVersion,
        brand: Device.brand,
        modelName: Device.modelName,
        isDevice: Device.isDevice,
        signedAt: new Date().toISOString(),
        biometricValidated: isBiometricValidated
      });

      await axios.post(`${API_URL}/Employee/${employee.id}/signature`, {
        signatureBase64,
        isBiometricValidated,
        SignatureMetadata: signatureMetadata,
        Telefono: formData.Telefono,
        CorreoPersonal: formData.CorreoPersonal,
        ContactoEmergencia: formData.ContactoEmergencia,
        Parentesco: formData.Parentesco,
        TelefonoEmergencia: formData.TelefonoEmergencia,
        AFPId: formData.AFPId === 6 ? null : formData.AFPId, // 6 is Ninguno
        HasPrimary: formData.HasPrimary,
        PrimarySchool: formData.PrimarySchool,
        PrimaryYear: formData.PrimaryYear,
        HasSecondary: formData.HasSecondary,
        SecondarySchool: formData.SecondarySchool,
        SecondaryYear: formData.SecondaryYear,
        HasHigherEducation: formData.HasHigherEducation,
        HigherEducationInstitution: formData.HigherEducationInstitution,
        HigherEducationYear: formData.HigherEducationYear
      });
      
      setShowSuccess(true);
    } catch (error: any) {
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
          {step === 1 ? 'Actualización de Datos' : step === 2 ? 'Método de Firma' : 'Firma de Contrato'}
        </Text>
        <Text style={styles.subtitle}>
          {step === 1 ? 'Por favor, llena tus datos para que podamos generar tu contrato.' : 
           step === 2 ? 'Elige cómo prefieres registrar tu firma.' : 
           'Al guardar, se validará tu identidad mediante biometría.'}
        </Text>
      </View>

      <ScrollView style={{flex: 1}} contentContainerStyle={styles.scrollContent}>
        {step === 1 && (
          <View style={styles.formContainer}>
            
            {/* 1. DATOS PERSONALES */}
            <View style={styles.sectionHeader}>
              <User size={20} color="#60a5fa" />
              <Text style={styles.sectionTitle}>1. Datos Personales</Text>
            </View>
            <View style={styles.card}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nro. de Celular *</Text>
                <TextInput style={[styles.input, errors.Telefono && styles.inputError]} placeholder="Ejem: 987654321" placeholderTextColor="#475569" keyboardType="phone-pad" maxLength={9} value={formData.Telefono} onChangeText={(v) => setFormData({...formData, Telefono: v.replace(/\D/g, '')})} />
                {errors.Telefono && <Text style={styles.errorText}>{errors.Telefono}</Text>}
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Correo Personal (Opcional)</Text>
                <TextInput style={[styles.input, errors.CorreoPersonal && styles.inputError]} placeholder="Ejem: juan@email.com" placeholderTextColor="#475569" keyboardType="email-address" autoCapitalize="none" value={formData.CorreoPersonal} onChangeText={(v) => setFormData({...formData, CorreoPersonal: v})} />
                {errors.CorreoPersonal && <Text style={styles.errorText}>{errors.CorreoPersonal}</Text>}
              </View>
              
              <Text style={[styles.label, {marginTop: 8}]}>Sistema de Pensión (AFP/ONP) *</Text>
              <View style={styles.chipsContainer}>
                {AFPS.map((afp) => (
                  <TouchableOpacity 
                    key={afp.id} 
                    style={[styles.chip, formData.AFPId === afp.id && styles.chipActive]}
                    onPress={() => setFormData({...formData, AFPId: afp.id})}
                  >
                    <Text style={[styles.chipText, formData.AFPId === afp.id && styles.chipTextActive]}>{afp.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {errors.AFPId && <Text style={styles.errorText}>{errors.AFPId}</Text>}
            </View>

            {/* 2. DATOS DE ESTUDIO */}
            <View style={[styles.sectionHeader, {marginTop: 20}]}>
              <BookOpen size={20} color="#60a5fa" />
              <Text style={styles.sectionTitle}>2. Nivel Educativo</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.helpText}>Activa las opciones si cursaste dicho nivel e ingresa el nombre de la institución y el año.</Text>
              
              {/* Primaria */}
              <View style={styles.educationRow}>
                <View style={styles.switchHeader}>
                  <Text style={styles.educationTitle}>Primaria Completa</Text>
                  <Switch 
                    value={formData.HasPrimary} 
                    onValueChange={(v) => setFormData({...formData, HasPrimary: v})} 
                    trackColor={{ false: '#334155', true: '#3b82f6' }}
                    thumbColor="#fff"
                  />
                </View>
                {formData.HasPrimary && (
                  <View style={styles.subInputs}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Nombre del Colegio *</Text>
                      <TextInput style={[styles.input, errors.PrimarySchool && styles.inputError]} placeholder="Ejem: I.E. San Juan" placeholderTextColor="#475569" value={formData.PrimarySchool} onChangeText={(v) => setFormData({...formData, PrimarySchool: v})} />
                      {errors.PrimarySchool && <Text style={styles.errorText}>{errors.PrimarySchool}</Text>}
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Año de Finalización *</Text>
                      <TextInput style={[styles.input, errors.PrimaryYear && styles.inputError]} placeholder="Ejem: 2010" placeholderTextColor="#475569" keyboardType="numeric" maxLength={4} value={formData.PrimaryYear} onChangeText={(v) => setFormData({...formData, PrimaryYear: v.replace(/\D/g, '')})} />
                      {errors.PrimaryYear && <Text style={styles.errorText}>{errors.PrimaryYear}</Text>}
                    </View>
                  </View>
                )}
              </View>

              <View style={styles.divider} />

              {/* Secundaria */}
              <View style={styles.educationRow}>
                <View style={styles.switchHeader}>
                  <Text style={styles.educationTitle}>Secundaria Completa</Text>
                  <Switch 
                    value={formData.HasSecondary} 
                    onValueChange={(v) => setFormData({...formData, HasSecondary: v})} 
                    trackColor={{ false: '#334155', true: '#3b82f6' }}
                    thumbColor="#fff"
                  />
                </View>
                {formData.HasSecondary && (
                  <View style={styles.subInputs}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Nombre del Colegio *</Text>
                      <TextInput style={[styles.input, errors.SecondarySchool && styles.inputError]} placeholder="Ejem: I.E. San Juan" placeholderTextColor="#475569" value={formData.SecondarySchool} onChangeText={(v) => setFormData({...formData, SecondarySchool: v})} />
                      {errors.SecondarySchool && <Text style={styles.errorText}>{errors.SecondarySchool}</Text>}
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Año de Finalización *</Text>
                      <TextInput style={[styles.input, errors.SecondaryYear && styles.inputError]} placeholder="Ejem: 2015" placeholderTextColor="#475569" keyboardType="numeric" maxLength={4} value={formData.SecondaryYear} onChangeText={(v) => setFormData({...formData, SecondaryYear: v.replace(/\D/g, '')})} />
                      {errors.SecondaryYear && <Text style={styles.errorText}>{errors.SecondaryYear}</Text>}
                    </View>
                  </View>
                )}
              </View>

              <View style={styles.divider} />

              {/* Superior */}
              <View style={styles.educationRow}>
                <View style={styles.switchHeader}>
                  <Text style={styles.educationTitle}>Educación Superior</Text>
                  <Switch 
                    value={formData.HasHigherEducation} 
                    onValueChange={(v) => setFormData({...formData, HasHigherEducation: v})} 
                    trackColor={{ false: '#334155', true: '#3b82f6' }}
                    thumbColor="#fff"
                  />
                </View>
                {formData.HasHigherEducation && (
                  <View style={styles.subInputs}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Institución o Universidad *</Text>
                      <TextInput style={[styles.input, errors.HigherEducationInstitution && styles.inputError]} placeholder="Ejem: Universidad Nacional" placeholderTextColor="#475569" value={formData.HigherEducationInstitution} onChangeText={(v) => setFormData({...formData, HigherEducationInstitution: v})} />
                      {errors.HigherEducationInstitution && <Text style={styles.errorText}>{errors.HigherEducationInstitution}</Text>}
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Año de Finalización *</Text>
                      <TextInput style={[styles.input, errors.HigherEducationYear && styles.inputError]} placeholder="Ejem: 2020" placeholderTextColor="#475569" keyboardType="numeric" maxLength={4} value={formData.HigherEducationYear} onChangeText={(v) => setFormData({...formData, HigherEducationYear: v.replace(/\D/g, '')})} />
                      {errors.HigherEducationYear && <Text style={styles.errorText}>{errors.HigherEducationYear}</Text>}
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* 3. DATOS DE EMERGENCIA */}
            <View style={[styles.sectionHeader, {marginTop: 20}]}>
              <ShieldAlert size={20} color="#ef4444" />
              <Text style={[styles.sectionTitle, {color: '#f87171'}]}>3. En Caso de Emergencia</Text>
            </View>
            <View style={[styles.card, {borderColor: 'rgba(239, 68, 68, 0.2)'}]}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>¿A quién llamamos? (Nombre) *</Text>
                <TextInput style={[styles.input, errors.ContactoEmergencia && styles.inputError]} placeholder="Ejem: Maria Perez" placeholderTextColor="#475569" value={formData.ContactoEmergencia} onChangeText={(v) => setFormData({...formData, ContactoEmergencia: v.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '')})} />
                {errors.ContactoEmergencia && <Text style={styles.errorText}>{errors.ContactoEmergencia}</Text>}
              </View>
              <View style={{flexDirection: 'row', gap: 12}}>
                <View style={[styles.inputGroup, {flex: 1}]}>
                  <Text style={styles.label}>Parentesco *</Text>
                  <TextInput style={[styles.input, errors.Parentesco && styles.inputError]} placeholder="Ejem: Esposa" placeholderTextColor="#475569" value={formData.Parentesco} onChangeText={(v) => setFormData({...formData, Parentesco: v.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '')})} />
                  {errors.Parentesco && <Text style={styles.errorText}>{errors.Parentesco}</Text>}
                </View>
                <View style={[styles.inputGroup, {flex: 1}]}>
                  <Text style={styles.label}>Celular *</Text>
                  <TextInput style={[styles.input, errors.TelefonoEmergencia && styles.inputError]} placeholder="999888777" placeholderTextColor="#475569" keyboardType="phone-pad" maxLength={9} value={formData.TelefonoEmergencia} onChangeText={(v) => setFormData({...formData, TelefonoEmergencia: v.replace(/\D/g, '')})} />
                  {errors.TelefonoEmergencia && <Text style={styles.errorText}>{errors.TelefonoEmergencia}</Text>}
                </View>
              </View>
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
                  <View style={styles.tipRow}><CheckCircle size={14} color="#10b981"/><Text style={styles.tipText}>ENCIENDE EL FLASH de tu cámara para que no haya sombras oscuras sobre el papel.</Text></View>
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
          <TouchableOpacity 
            style={[styles.button, !canProceed && { opacity: 0.5 }]} 
            onPress={handleNextStep}
            disabled={!canProceed}
          >
            <LinearGradient colors={!canProceed ? ['#64748b', '#475569'] : ['#3b82f6', '#2563eb']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradientButton}>
              <Text style={styles.buttonText}>SIGUIENTE</Text>
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
  title: { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#94a3b8', lineHeight: 20 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  
  formContainer: { gap: 8, marginTop: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8, paddingHorizontal: 4 },
  sectionTitle: { color: '#60a5fa', fontSize: 18, fontWeight: 'bold' },
  
  card: { backgroundColor: '#1e293b', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#334155', gap: 16 },
  inputGroup: { gap: 6 },
  label: { color: '#cbd5e1', fontSize: 14, fontWeight: '600' },
  input: { backgroundColor: '#0f172a', borderRadius: 12, padding: 16, color: '#fff', fontSize: 16, borderWidth: 1, borderColor: '#334155' },
  
  helpText: { color: '#94a3b8', fontSize: 13, marginBottom: 8, lineHeight: 18 },
  educationRow: { paddingVertical: 4 },
  switchHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  educationTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },
  subInputs: { marginTop: 16, gap: 12, backgroundColor: 'rgba(15, 23, 42, 0.4)', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#334155' },
  divider: { height: 1, backgroundColor: '#334155', marginVertical: 8 },

  chipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  chip: { backgroundColor: '#0f172a', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: '#334155' },
  chipActive: { backgroundColor: 'rgba(59, 130, 246, 0.2)', borderColor: '#3b82f6' },
  chipText: { color: '#94a3b8', fontWeight: '600', fontSize: 14 },
  chipTextActive: { color: '#60a5fa', fontWeight: 'bold' },

  optionsContainer: { gap: 16, marginTop: 12 },
  optionCard: { borderRadius: 20, overflow: 'hidden' },
  optionGradient: { padding: 32, alignItems: 'center', justifyContent: 'center', gap: 16 },
  optionTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  optionDesc: { color: 'rgba(255,255,255,0.8)', textAlign: 'center', paddingHorizontal: 20 },
  
  tipsContainer: { marginTop: 24, backgroundColor: 'rgba(15, 23, 42, 0.5)', padding: 16, borderRadius: 16, width: '100%', borderColor: 'rgba(59, 130, 246, 0.2)', borderWidth: 1 },
  tipsTitle: { color: '#38bdf8', fontSize: 13, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  tipRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  tipText: { color: '#e2e8f0', fontSize: 12, flex: 1, lineHeight: 18 },

  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
    paddingLeft: 4,
  },
  inputError: {
    borderColor: '#ef4444',
    borderWidth: 1,
  },

  canvasContainer: { flex: 1, marginTop: 12 },
  canvasHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  clearBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(239, 68, 68, 0.1)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  canvasWrapper: { height: 350, backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', borderWidth: 2, borderColor: '#3b82f6', position: 'relative' },
  linePlaceholder: { position: 'absolute', bottom: 20, left: 0, width: '100%', alignItems: 'center', pointerEvents: 'none', opacity: 0.5 },
  line: { width: '80%', height: 1, backgroundColor: '#94a3b8' },
  lineText: { color: '#64748b', fontSize: 12, marginTop: 4, fontWeight: '600' },
  
  photoContainer: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  photoPreview: { width: '100%', height: 300, borderRadius: 8, backgroundColor: '#0f172a' },
  retakeBtn: { marginTop: 16, paddingVertical: 12, paddingHorizontal: 24, backgroundColor: '#334155', borderRadius: 20 },
  retakeText: { color: '#fff', fontWeight: '600', fontSize: 16 },

  footer: { padding: 24, paddingTop: 0, paddingBottom: Platform.OS === 'ios' ? 0 : 24 },
  button: { borderRadius: 16, overflow: 'hidden', shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 8 },
  gradientButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 20, gap: 12 },
  buttonText: { color: '#ffffff', fontSize: 18, fontWeight: '800', letterSpacing: 1 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(2, 6, 23, 0.9)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalContent: { width: '100%', borderRadius: 32, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.2)' },
  iconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(34, 197, 94, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 12 },
  modalText: { fontSize: 16, color: '#94a3b8', textAlign: 'center', lineHeight: 24, marginBottom: 32 },
  modalButton: { backgroundColor: '#3b82f6', paddingVertical: 16, paddingHorizontal: 48, borderRadius: 20, width: '100%' },
  modalButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
});
