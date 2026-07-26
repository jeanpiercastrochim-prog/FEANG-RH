import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, ActivityIndicator, Platform, Linking, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, FileText, Download, CheckCircle, Calendar, User, FileSignature, Clock, Fingerprint } from 'lucide-react-native';
import axios from 'axios';
import * as LocalAuthentication from 'expo-local-authentication';
import { Alert } from 'react-native';

const { width } = Dimensions.get('window');
const API_URL = Platform.OS === 'web' ? 'http://localhost:5050/api' : 'http://127.0.0.1:5050/api';
const BASE_URL = API_URL.replace('/api', '');

export default function MyContractScreen({ route, navigation }: any) {
  const dni = route?.params?.dni || '55555555';
  const [loading, setLoading] = useState(true);
  const [contractData, setContractData] = useState<any>(null);
  const [employee, setEmployee] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isRegisteringBiometrics, setIsRegisteringBiometrics] = useState(false);

  useEffect(() => {
    const fetchContract = async () => {
      try {
        // 1. Obtener datos del empleado para verificar huella
        const empRes = await axios.get(`${API_URL}/Employee/by-dni/${dni}`);
        setEmployee(empRes.data);

        // 2. Buscar el contractId en la lista de firmados
        const firmadosRes = await axios.get(`${API_URL}/Process/firmados`);
        const signedProcess = firmadosRes.data.find((c: any) => c.numeroDNI === dni);
        
        if (!signedProcess) {
          setErrorMsg('En espera de respuesta de RH.');
          setLoading(false);
          return;
        }

        // 2. Traer el detalle completo del proceso
        const detailRes = await axios.get(`${API_URL}/Process/${signedProcess.id}`);
        setContractData(detailRes.data);
      } catch (err) {
        console.error(err);
        setErrorMsg('Error al cargar los datos del contrato.');
      } finally {
        setLoading(false);
      }
    };

    fetchContract();
  }, [dni]);

  const handleDownload = () => {
    const url = `${API_URL}/Process/download-pdf/${dni}`;
    Linking.openURL(url).catch(err => {
      console.error('Error opening URL: ', err);
      if (Platform.OS === 'web') window.alert('El PDF aún no se ha generado o hubo un error.');
      else alert('No se pudo abrir el PDF.');
    });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const handleRegisterBiometrics = async () => {
    if (!employee) return;
    setIsRegisteringBiometrics(true);
    try {
      if (Platform.OS !== 'web') {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();

        if (hasHardware && isEnrolled) {
          const authResult = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Verifica tu identidad con tu Huella Dactilar',
            cancelLabel: 'Cancelar',
            disableDeviceFallback: false,
          });

          if (!authResult.success) {
            Alert.alert('Autenticación cancelada', 'Debes verificar tu huella para registrarla.');
            setIsRegisteringBiometrics(false);
            return;
          }
        } else {
          Alert.alert('Aviso', 'Tu dispositivo no cuenta con sensor de huella configurado.');
          setIsRegisteringBiometrics(false);
          return;
        }
      }

      await axios.post(`${API_URL}/Employee/${employee.id}/biometrics`);
      setEmployee({ ...employee, hasBiometrics: true });
      Alert.alert('¡Éxito!', 'Tu huella digital ha sido registrada correctamente.');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'No se pudo registrar la huella.');
    } finally {
      setIsRegisteringBiometrics(false);
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={['#051c4a', '#020b1f']} style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Cargando expediente...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#051c4a', '#020b1f']} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft color="#ffffff" size={24} />
          </TouchableOpacity>
          <Text style={styles.title}>Expediente Laboral</Text>
          <TouchableOpacity style={styles.downloadIconBtn} onPress={handleDownload}>
            <Download color="#60a5fa" size={24} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Banner de Huella Digital si no la tiene */}
          {employee && !employee.hasBiometrics && (
            <View style={styles.biometricCard}>
              <View style={styles.biometricHeader}>
                <Fingerprint color="#f59e0b" size={28} />
                <View style={styles.biometricTextContainer}>
                  <Text style={styles.biometricTitle}>Huella no registrada</Text>
                  <Text style={styles.biometricSubtitle}>Registra tu huella digital para validar tu identidad de forma segura.</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.biometricBtn} 
                onPress={handleRegisterBiometrics}
                disabled={isRegisteringBiometrics}
              >
                <Text style={styles.biometricBtnText}>{isRegisteringBiometrics ? 'Registrando...' : 'Registrar Huella Ahora'}</Text>
              </TouchableOpacity>
            </View>
          )}

          {errorMsg ? (
            <View style={styles.waitingCard}>
              <View style={styles.waitingIconContainer}>
                <Clock color="#3b82f6" size={48} />
              </View>
              <Text style={styles.waitingTitle}>Procesando Contrato</Text>
              <Text style={styles.waitingText}>
                Recursos Humanos está elaborando tu contrato oficial.
                Te notificaremos cuando esté listo para tu visualización.
              </Text>
              <View style={styles.waitingBadge}>
                <Text style={styles.waitingBadgeText}>ESTADO: {errorMsg.toUpperCase()}</Text>
              </View>
            </View>
          ) : (
            <>
              {/* Status Banner */}
              <View style={styles.statusBanner}>
                <CheckCircle color="#10b981" size={28} />
                <View style={styles.statusTextContainer}>
                  <Text style={styles.statusTitle}>Contrato Firmado Oficialmente</Text>
                  <Text style={styles.statusSubtitle}>Fecha: {formatDate(contractData.createdAt)}</Text>
                </View>
              </View>

              {/* Personal Data */}
              <View style={styles.glassCard}>
                <View style={styles.cardHeader}>
                  <User color="#60a5fa" size={20} />
                  <Text style={styles.cardTitle}>Datos del Trabajador</Text>
                </View>
                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>Nombres:</Text>
                  <Text style={styles.dataValue}>{contractData.nombres} {contractData.apellidoPaterno} {contractData.apellidoMaterno}</Text>
                </View>
                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>DNI:</Text>
                  <Text style={styles.dataValue}>{contractData.numeroDNI}</Text>
                </View>
                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>Cargo:</Text>
                  <Text style={styles.dataValue}>{contractData.categoria || 'No asignado'}</Text>
                </View>
                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>Teléfono:</Text>
                  <Text style={styles.dataValue}>{contractData.telefono}</Text>
                </View>
                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>Dirección:</Text>
                  <Text style={styles.dataValue}>{contractData.direccion}</Text>
                </View>
              </View>

              {/* Document Photos */}
              <View style={styles.glassCard}>
                <View style={styles.cardHeader}>
                  <FileText color="#60a5fa" size={20} />
                  <Text style={styles.cardTitle}>Documentos de Identidad</Text>
                </View>
                
                <View style={styles.photosGrid}>
                  <View style={styles.photoContainer}>
                    <Text style={styles.photoLabel}>DNI Frontal</Text>
                    {contractData.frontImagePath ? (
                      <Image source={{ uri: `${BASE_URL}${contractData.frontImagePath}` }} style={styles.dniImage} resizeMode="cover" />
                    ) : (
                      <View style={styles.placeholderImage}><Text style={styles.placeholderText}>No disponible</Text></View>
                    )}
                  </View>
                  <View style={styles.photoContainer}>
                    <Text style={styles.photoLabel}>DNI Reverso</Text>
                    {contractData.backImagePath ? (
                      <Image source={{ uri: `${BASE_URL}${contractData.backImagePath}` }} style={styles.dniImage} resizeMode="cover" />
                    ) : (
                      <View style={styles.placeholderImage}><Text style={styles.placeholderText}>No disponible</Text></View>
                    )}
                  </View>
                </View>
              </View>

              {/* Signature */}
              <View style={styles.glassCard}>
                <View style={styles.cardHeader}>
                  <FileSignature color="#10b981" size={20} />
                  <Text style={styles.cardTitle}>Firma Registrada</Text>
                </View>
                <View style={styles.signatureContainer}>
                  {contractData.signatureImagePath ? (
                    <Image source={{ uri: `${BASE_URL}${contractData.signatureImagePath}` }} style={styles.signatureImage} resizeMode="contain" />
                  ) : (
                    <Text style={styles.placeholderText}>Firma no registrada en sistema</Text>
                  )}
                </View>
              </View>
              
              <TouchableOpacity style={styles.downloadBtn} onPress={handleDownload}>
                <Download color="#ffffff" size={20} style={{ marginRight: 8 }} />
                <Text style={styles.downloadBtnText}>Descargar Contrato PDF</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  backBtn: {
    padding: 8,
    marginLeft: -8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  downloadIconBtn: {
    padding: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 12,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  statusTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  statusTitle: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  statusSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    paddingBottom: 12,
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  dataRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  dataLabel: {
    width: 90,
    color: '#94a3b8',
    fontSize: 14,
  },
  dataValue: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '500',
  },
  photosGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  photoContainer: {
    width: '48%',
  },
  photoLabel: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  dniImage: {
    width: '100%',
    height: 100,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  placeholderImage: {
    width: '100%',
    height: 100,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  placeholderText: {
    color: '#64748b',
    fontSize: 12,
  },
  signatureContainer: {
    width: '100%',
    height: 120,
    backgroundColor: '#ffffff', // Fondo blanco para la firma que suele tener trazos oscuros
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  signatureImage: {
    width: '90%',
    height: '90%',
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 10,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  downloadBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  errorText: {
    color: '#f43f5e',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  waitingCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    alignItems: 'center',
    marginTop: 20,
  },
  waitingIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  waitingTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  waitingText: {
    color: '#94a3b8',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  waitingBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  waitingBadgeText: {
    color: '#60a5fa',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  biometricCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    marginBottom: 20,
  },
  biometricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  biometricTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  biometricTitle: {
    color: '#f59e0b',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  biometricSubtitle: {
    color: '#d1d5db',
    fontSize: 13,
    lineHeight: 18,
  },
  biometricBtn: {
    backgroundColor: '#f59e0b',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  biometricBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  }
});
