import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions, Platform, KeyboardAvoidingView, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { 
  User, Lock, Eye, EyeOff, ArrowRight, 
  CheckSquare, Square, Leaf, Sun, Settings, ScanFace 
} from 'lucide-react-native';
import { Modal } from 'react-native';

const API_URL = Platform.OS === 'web' ? 'http://localhost:5051/api' : 'http://10.0.2.2:5051/api';
const { width } = Dimensions.get('window');

export default function LoginScreen({ navigation }: any) {
  const [dni, setDni] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  
  // Password Change
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);
  const [tempEmployee, setTempEmployee] = useState<any>(null);

  const handleLogin = async () => {
    if (!dni || dni.length < 8) {
      if (Platform.OS === 'web') window.alert('Por favor ingresa un DNI válido.');
      else alert('Por favor ingresa un DNI válido.');
      return;
    }
    if (!password) {
      if (Platform.OS === 'web') window.alert('Por favor ingresa tu contraseña.');
      else alert('Por favor ingresa tu contraseña.');
      return;
    }
    
    setLoading(true);
    setNetworkError(false);
    try {
      const response = await axios.post(`${API_URL}/Auth/login`, { dni, password });
      if (response.data.success) {
        if (response.data.requiresPasswordChange) {
          setTempEmployee(response.data.employee);
          setShowChangePassword(true);
        } else {
          if (response.data.employee.rol === 'Transportista') {
            navigation.navigate('Driver', { employee: response.data.employee });
          } else {
            navigation.navigate('Home', { employee: response.data.employee });
          }
        }
      }
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        setShowErrorModal(true);
      } else {
        setNetworkError(true);
        if (Platform.OS === 'web') window.alert('Error de conexión con el servidor. Verifica que la API esté corriendo y la IP sea correcta: ' + API_URL);
        else alert('Error de red. Verifica la IP de tu servidor: ' + API_URL);
      }
    } finally {
      setLoading(false);
    }
  };

  const startLinkingProcess = () => {
    setShowErrorModal(false);
    navigation.navigate('Welcome');
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      if (Platform.OS === 'web') window.alert('La contraseña debe tener al menos 6 caracteres.');
      else alert('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      if (Platform.OS === 'web') window.alert('Las contraseñas no coinciden.');
      else alert('Las contraseñas no coinciden.');
      return;
    }
    
    setPasswordChangeLoading(true);
    try {
      const response = await axios.post(`${API_URL}/Auth/change-password`, { 
        dni, 
        oldPassword: password, 
        newPassword 
      });
      if (response.data.success) {
        setShowChangePassword(false);
        setPassword('');
        setNewPassword('');
        setConfirmPassword('');
        if (tempEmployee?.rol === 'Transportista') {
          navigation.navigate('Driver', { employee: tempEmployee });
        } else {
          navigation.navigate('Home', { employee: tempEmployee });
        }
      }
    } catch (error: any) {
      if (Platform.OS === 'web') window.alert('Error al cambiar la contraseña.');
      else alert('Error al cambiar la contraseña.');
    } finally {
      setPasswordChangeLoading(false);
    }
  };

  return (
    <LinearGradient 
      colors={['#051c4a', '#020b1f']} 
      style={styles.container}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            
            {/* LOGO SECTION */}
            <View style={styles.logoSection}>
              <Text style={styles.logoText}>CHAVIN</Text>
              <View style={styles.logoDecoration}>
                <View style={styles.decoLine} />
                <View style={styles.decoIcons}>
                  <Leaf color="#10b981" size={20} fill="#10b981" style={{ marginRight: 6 }} />
                  <Sun color="#f59e0b" size={20} fill="#f59e0b" style={{ marginRight: 6 }} />
                  <Settings color="#94a3b8" size={20} fill="#94a3b8" />
                </View>
                <View style={styles.decoLine} />
              </View>
            </View>

            {/* GREETING */}
            <View style={styles.greetingSection}>
              <Text style={styles.welcomeText}>¡Bienvenido! 👋</Text>
              <Text style={styles.subtitleText}>
                Inicia sesión para acceder a tu portal de colaborador
              </Text>
            </View>

            {/* LOGIN CARD */}
            <View style={styles.glassCard}>
              
              {/* DNI FIELD */}
              <View style={styles.fieldHeader}>
                <User color="#cbd5e1" size={16} />
                <Text style={styles.fieldLabel}>DNI</Text>
              </View>
              <View style={styles.inputContainer}>
                <User color="#64748b" size={18} style={styles.inputIcon} />
                <TextInput 
                  style={[styles.input, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
                  placeholder="Ingresa tu número de DNI"
                  placeholderTextColor="#64748b"
                  keyboardType="numeric"
                  maxLength={8}
                  value={dni}
                  onChangeText={setDni}
                />
              </View>

              {/* PASSWORD FIELD */}
              <View style={[styles.fieldHeader, { justifyContent: 'space-between' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Lock color="#cbd5e1" size={16} />
                  <Text style={styles.fieldLabel}>Contraseña</Text>
                </View>
                <TouchableOpacity>
                  <Text style={styles.forgotPassword}>¿Olvidaste tu contraseña?</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.inputContainer}>
                <Lock color="#64748b" size={18} style={styles.inputIcon} />
                <TextInput 
                  style={[styles.input, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
                  placeholder="Ingresa tu contraseña"
                  placeholderTextColor="#64748b"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff color="#cbd5e1" size={18} /> : <Eye color="#cbd5e1" size={18} />}
                </TouchableOpacity>
              </View>

              {/* REMEMBER ME */}
              <TouchableOpacity 
                style={styles.rememberRow} 
                activeOpacity={0.7}
                onPress={() => setRememberMe(!rememberMe)}
              >
                {rememberMe ? (
                  <CheckSquare color="#3b82f6" size={18} fill="#3b82f6" />
                ) : (
                  <Square color="#64748b" size={18} />
                )}
                <Text style={styles.rememberText}>Recordarme</Text>
              </TouchableOpacity>

              {/* SUBMIT BUTTON */}
              <TouchableOpacity style={styles.submitButton} onPress={handleLogin} activeOpacity={0.8} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <>
                    <Text style={styles.submitButtonText}>Iniciar sesión</Text>
                    <ArrowRight color="#ffffff" size={20} />
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* DIVIDER */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>o continúa con</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* BIOMETRICS */}
            <View style={styles.biometricsSection}>
              <TouchableOpacity style={styles.biometricsCircle}>
                <ScanFace color="#3b82f6" size={32} />
              </TouchableOpacity>
              <Text style={styles.biometricsText}>Usar biometría</Text>
            </View>

            {/* BOTTOM NEW USER */}
            <TouchableOpacity 
              style={styles.newUserPill}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Welcome')}
            >
              <Text style={styles.newUserText}>¿Eres nuevo en Chavin?</Text>
              <Text style={styles.newUserAction}>Inicia tu proceso</Text>
              <ArrowRight color="#60a5fa" size={18} style={{ marginLeft: 6 }} />
            </TouchableOpacity>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {showErrorModal && (
        <Modal transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.errorIconWrapper}>
                <User color="#f43f5e" size={48} />
              </View>
              <Text style={styles.modalTitle}>Usuario no encontrado</Text>
              <Text style={styles.modalText}>
                Verifica que tu DNI y clave sean correctos, o contacta con Recursos Humanos si eres un colaborador nuevo.
              </Text>
              
              <TouchableOpacity style={styles.modalButtonPrimary} onPress={() => setShowErrorModal(false)}>
                <Text style={styles.modalButtonTextPrimary}>Intentar de nuevo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {showChangePassword && (
        <Modal transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={[styles.errorIconWrapper, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
                <Lock color="#3b82f6" size={48} />
              </View>
              <Text style={styles.modalTitle}>Actualiza tu Contraseña</Text>
              <Text style={styles.modalText}>
                Por seguridad, debes cambiar tu contraseña predeterminada (tu DNI) para continuar.
              </Text>
              
              <View style={[styles.inputContainer, { width: '100%', marginBottom: 12 }]}>
                <Lock color="#64748b" size={18} style={styles.inputIcon} />
                <TextInput 
                  style={[styles.input, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
                  placeholder="Nueva contraseña"
                  placeholderTextColor="#64748b"
                  secureTextEntry={!showPassword}
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff color="#cbd5e1" size={18} /> : <Eye color="#cbd5e1" size={18} />}
                </TouchableOpacity>
              </View>

              <View style={[styles.inputContainer, { width: '100%', marginBottom: 24 }]}>
                <Lock color="#64748b" size={18} style={styles.inputIcon} />
                <TextInput 
                  style={[styles.input, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
                  placeholder="Confirmar contraseña"
                  placeholderTextColor="#64748b"
                  secureTextEntry={!showPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </View>

              <TouchableOpacity 
                style={[styles.modalButtonPrimary, { backgroundColor: '#3b82f6' }]} 
                onPress={handleChangePassword}
                disabled={passwordChangeLoading}
              >
                {passwordChangeLoading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.modalButtonTextPrimary}>Guardar y Continuar</Text>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.modalButtonSecondary} onPress={() => setShowChangePassword(false)}>
                <Text style={styles.modalButtonTextSecondary}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
    flexGrow: 1,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoText: {
    fontSize: 52,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 2,
    marginBottom: -5,
  },
  logoDecoration: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '80%',
  },
  decoLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#3b82f6',
  },
  decoIcons: {
    flexDirection: 'row',
    paddingHorizontal: 10,
  },
  greetingSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 32,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  fieldLabel: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 8,
  },
  forgotPassword: {
    color: '#3b82f6',
    fontSize: 13,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    height: 56,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#ffffff',
    fontSize: 15,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  rememberText: {
    color: '#cbd5e1',
    marginLeft: 10,
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: '#1d4ed8', // Vivid blue
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 56,
    borderRadius: 14,
    ...Platform.select({
      ios: { shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 8 },
      android: { elevation: 6 },
      web: { boxShadow: '0px 6px 16px rgba(59, 130, 246, 0.4)' as any }
    })
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dividerText: {
    color: '#94a3b8',
    marginHorizontal: 16,
    fontSize: 14,
  },
  biometricsSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  biometricsCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  biometricText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#0f172a',
    borderRadius: 24,
    padding: 32,
    width: '85%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  errorIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(244, 63, 94, 0.3)',
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalText: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  modalButtonPrimary: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalButtonTextPrimary: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
  modalButtonSecondary: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  modalButtonTextSecondary: {
    color: '#94a3b8',
    fontWeight: '600',
    fontSize: 14,
  },
  biometricsText: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '500',
  },
  newUserPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingVertical: 16,
    marginTop: 'auto',
  },
  newUserText: {
    color: '#cbd5e1',
    fontSize: 14,
    marginRight: 4,
  },
  newUserAction: {
    color: '#60a5fa',
    fontSize: 14,
    fontWeight: '600',
  },
});
