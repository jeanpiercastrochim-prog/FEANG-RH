import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Platform, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Send, CheckCircle, AlertCircle } from 'lucide-react-native';
import axios from 'axios';

const API_URL = Platform.OS === 'web' ? 'http://localhost:5051/api' : 'http://10.0.2.2:5051/api';

export default function RequestFormScreen({ route, navigation }: any) {
  const { employee, selectedType } = route?.params || {};
  const [formData, setFormData] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!selectedType) return;
    
    setLoading(true);
    setError('');
    
    try {
      await axios.post(`${API_URL}/EmployeeRequest`, {
        employeeId: employee?.id,
        type: selectedType,
        formData: JSON.stringify(formData)
      });
      
      setSuccessModalVisible(true);
    } catch (err) {
      console.error(err);
      setError('Ocurrió un error al enviar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  const renderFormFields = () => {
    switch (selectedType) {
      case 'Cambio de Cuenta Bancaria':
        return (
          <>
            <Text style={styles.label}>Banco Nuevo</Text>
            <TextInput style={styles.input} placeholderTextColor="#64748b" placeholder="Ej. BCP, BBVA, Interbank" onChangeText={(v) => handleInputChange('banco', v)} />
            <Text style={styles.label}>Tipo de Cuenta</Text>
            <TextInput style={styles.input} placeholderTextColor="#64748b" placeholder="Ej. Ahorros, Corriente" onChangeText={(v) => handleInputChange('tipoCuenta', v)} />
            <Text style={styles.label}>Número de Cuenta</Text>
            <TextInput style={styles.input} placeholderTextColor="#64748b" keyboardType="numeric" onChangeText={(v) => handleInputChange('numeroCuenta', v)} />
            <Text style={styles.label}>CCI</Text>
            <TextInput style={styles.input} placeholderTextColor="#64748b" keyboardType="numeric" onChangeText={(v) => handleInputChange('cci', v)} />
          </>
        );
      case 'Cambio de AFP':
        return (
          <>
            <Text style={styles.label}>Nueva AFP</Text>
            <TextInput style={styles.input} placeholderTextColor="#64748b" placeholder="Ej. Integra, Prima, Profuturo, Habitat" onChangeText={(v) => handleInputChange('afp', v)} />
          </>
        );
      case 'Actualización de Número Celular':
        return (
          <>
            <Text style={styles.label}>Nuevo Número Celular</Text>
            <TextInput style={styles.input} placeholderTextColor="#64748b" keyboardType="phone-pad" onChangeText={(v) => handleInputChange('celular', v)} />
          </>
        );
      case 'Actualización de Dirección':
        return (
          <>
            <Text style={styles.label}>Nueva Dirección (Domicilio)</Text>
            <TextInput style={styles.input} placeholderTextColor="#64748b" placeholder="Ej. Av. Los Pinos 123" onChangeText={(v) => handleInputChange('direccion', v)} />
            <Text style={styles.label}>Distrito / Ciudad</Text>
            <TextInput style={styles.input} placeholderTextColor="#64748b" onChangeText={(v) => handleInputChange('distrito', v)} />
          </>
        );
      case 'Solicitud de Constancia de Trabajo':
        return (
          <>
            <Text style={styles.label}>Dirigido a (Opcional)</Text>
            <TextInput style={styles.input} placeholderTextColor="#64748b" placeholder="Ej. A quien corresponda, Banco XYZ" onChangeText={(v) => handleInputChange('dirigidoA', v)} />
            <Text style={styles.label}>Motivo</Text>
            <TextInput style={styles.input} placeholderTextColor="#64748b" placeholder="Ej. Trámite bancario" onChangeText={(v) => handleInputChange('motivo', v)} />
          </>
        );
      case 'Solicitud de Descanso Médico':
        return (
          <>
            <Text style={styles.label}>Fecha de Inicio (DD/MM/AAAA)</Text>
            <TextInput style={styles.input} placeholderTextColor="#64748b" onChangeText={(v) => handleInputChange('fechaInicio', v)} />
            <Text style={styles.label}>Fecha de Fin (DD/MM/AAAA)</Text>
            <TextInput style={styles.input} placeholderTextColor="#64748b" onChangeText={(v) => handleInputChange('fechaFin', v)} />
            <Text style={styles.label}>Motivo / Diagnóstico</Text>
            <TextInput style={styles.input} placeholderTextColor="#64748b" onChangeText={(v) => handleInputChange('motivo', v)} />
          </>
        );
      case 'Solicitud de Permiso (Personal/Familiar)':
      case 'Solicitud de Permiso por Luto':
        return (
          <>
            <Text style={styles.label}>Fecha de Inicio</Text>
            <TextInput style={styles.input} placeholderTextColor="#64748b" onChangeText={(v) => handleInputChange('fechaInicio', v)} />
            <Text style={styles.label}>Fecha de Fin</Text>
            <TextInput style={styles.input} placeholderTextColor="#64748b" onChangeText={(v) => handleInputChange('fechaFin', v)} />
            <Text style={styles.label}>Motivo Detallado</Text>
            <TextInput style={[styles.input, { height: 100, textAlignVertical: 'top' }]} multiline placeholderTextColor="#64748b" onChangeText={(v) => handleInputChange('motivo', v)} />
          </>
        );
      case 'Solicitud de Adelanto de Sueldo':
        return (
          <>
            <Text style={styles.label}>Monto Solicitado (S/)</Text>
            <TextInput style={styles.input} placeholderTextColor="#64748b" keyboardType="numeric" onChangeText={(v) => handleInputChange('monto', v)} />
            <Text style={styles.label}>Motivo</Text>
            <TextInput style={[styles.input, { height: 100, textAlignVertical: 'top' }]} multiline placeholderTextColor="#64748b" onChangeText={(v) => handleInputChange('motivo', v)} />
          </>
        );
      case 'Corrección de Datos Personales':
        return (
          <>
            <Text style={styles.label}>Dato a corregir</Text>
            <TextInput style={styles.input} placeholderTextColor="#64748b" placeholder="Ej. Nombres, Apellidos, Estado Civil" onChangeText={(v) => handleInputChange('datoIncorrecto', v)} />
            <Text style={styles.label}>Dato Correcto</Text>
            <TextInput style={styles.input} placeholderTextColor="#64748b" onChangeText={(v) => handleInputChange('datoCorrecto', v)} />
          </>
        );
      default:
        return (
          <>
            <Text style={styles.label}>Detalles de la solicitud</Text>
            <TextInput style={[styles.input, { height: 120, textAlignVertical: 'top' }]} multiline placeholderTextColor="#64748b" onChangeText={(v) => handleInputChange('detalles', v)} />
          </>
        );
    }
  };

  return (
    <LinearGradient colors={['#051c4a', '#020b1f']} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ChevronLeft color="#ffffff" size={28} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>Completar Solicitud</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <>
              {error ? (
                <View style={styles.errorBox}>
                  <AlertCircle color="#ef4444" size={20} style={{ marginRight: 8 }} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <View style={styles.typeBanner}>
                <Text style={styles.typeBannerLabel}>Trámite Seleccionado:</Text>
                <Text style={styles.typeBannerTitle}>{selectedType}</Text>
              </View>

              <View style={styles.formContainer}>
                {renderFormFields()}

                <TouchableOpacity 
                  style={styles.submitButton}
                  onPress={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <>
                      <Send color="#ffffff" size={20} style={{ marginRight: 8 }} />
                      <Text style={styles.submitButtonText}>Enviar Solicitud</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
          </>
        </ScrollView>

        {/* SUCCESS MODAL */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={successModalVisible}
          onRequestClose={() => {}}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalIconBox}>
                <CheckCircle color="#10b981" size={60} />
              </View>
              <Text style={styles.modalTitle}>¡Solicitud Enviada!</Text>
              <Text style={styles.modalText}>
                Tu solicitud ha sido registrada exitosamente. RR.HH. la revisará a la brevedad y recibirás una notificación.
              </Text>
              <TouchableOpacity 
                style={styles.modalButton}
                onPress={() => {
                  setSuccessModalVisible(false);
                  navigation.navigate('Requests', { employee: route?.params?.employee });
                }}
              >
                <Text style={styles.modalButtonText}>Aceptar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  backButton: { padding: 4 },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 60,
  },
  typeBanner: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  typeBannerLabel: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  typeBannerTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  formContainer: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  label: {
    color: '#e2e8f0',
    fontSize: 14,
    marginBottom: 10,
    fontWeight: '600',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
    color: '#ffffff',
    padding: 16,
    fontSize: 15,
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    marginTop: 20,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 11, 31, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: 'rgba(10, 25, 47, 0.95)',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    width: '100%',
    maxWidth: 340,
  },
  modalIconBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    padding: 20,
    borderRadius: 50,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalText: {
    color: '#cbd5e1',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
  },
  modalButton: {
    backgroundColor: '#3b82f6',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.4)',
    padding: 16,
    borderRadius: 14,
    marginBottom: 20,
  },
  errorText: {
    color: '#f87171',
    fontSize: 14,
    fontWeight: '600',
  },
});
