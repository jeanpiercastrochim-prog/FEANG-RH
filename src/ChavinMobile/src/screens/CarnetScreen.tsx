import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Dimensions, ScrollView, Image, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Home, Receipt, ScanLine, ClipboardCheck, User, ChevronLeft, Camera } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';

const { width, height } = Dimensions.get('window');
const API_URL = Platform.OS === 'web' ? 'http://localhost:5051/api' : 'http://10.0.2.2:5051/api';
const BASE_URL = Platform.OS === 'web' ? 'http://localhost:5051' : 'http://10.0.2.2:5051';

export default function CarnetScreen({ route, navigation }: any) {
  const employee = route?.params?.employee;
  const dni = employee?.dni || '00000000';
  const fullName = employee?.fullName || 'Usuario';
  const role = employee?.position || 'Personal de Campo';

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [employeeId, setEmployeeId] = useState<number | null>(null);

  useEffect(() => {
    fetchEmployeeData();
  }, []);

  const fetchEmployeeData = async () => {
    try {
      const res = await axios.get(`${API_URL}/Employee/by-dni/${dni}`);
      setEmployeeId(res.data.id);
      if (res.data.profileImagePath) {
        setProfileImage(`${BASE_URL}${res.data.profileImagePath}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTakePhoto = async () => {
    if (Platform.OS === 'web') {
      alert('Esta función de cámara solo está disponible en la app móvil. Por favor usa tu celular o emulador móvil para tomar la foto.');
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Necesitamos permiso para usar la cámara y tomar tu foto de perfil.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      uploadPhoto(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const uploadPhoto = async (base64Img: string) => {
    if (!employeeId) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/Employee/${employeeId}/profile-photo`, {
        PhotoBase64: base64Img
      });
      if (res.data.success) {
        setProfileImage(`${BASE_URL}${res.data.profileImagePath}`);
        Alert.alert('Éxito', 'Tu foto de perfil ha sido actualizada.');
      }
    } catch (e) {
      console.error('Error subiendo foto:', e);
      Alert.alert('Error', 'No se pudo subir la foto.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#f8fafc', '#e2e8f0']} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ChevronLeft color="#0f172a" size={28} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Carnet Digital</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* CARNET CARD */}
          <View style={styles.carnetCard}>
            
            {/* Cabecera del Carnet con Logo */}
            <View style={styles.cardHeaderArea}>
              <Image 
                source={require('../../assets/logo_empresa.png')} 
                style={styles.companyLogo}
                resizeMode="contain"
              />
              
              <View style={styles.decoCircle1} />
              <View style={styles.decoCircle2} />
            </View>

            {/* Cuerpo Blanco del Carnet */}
            <View style={styles.cardBodyArea}>
              
              {/* Foto de Perfil Superpuesta */}
              <View style={styles.avatarWrapper}>
                <View style={styles.avatarContainer}>
                  {profileImage ? (
                    <Image source={{ uri: profileImage }} style={styles.profileImage} />
                  ) : (
                    <User color="#94a3b8" size={50} strokeWidth={2.5} />
                  )}
                </View>
                
                {/* Botón Flotante para Tomar Foto */}
                <TouchableOpacity style={styles.cameraBtn} onPress={handleTakePhoto} disabled={loading}>
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Camera color="#fff" size={20} />
                  )}
                </TouchableOpacity>
              </View>

              {!profileImage && !loading && (
                <Text style={styles.photoWarningText}>⚠️ Tómate una foto para activar el carnet</Text>
              )}

              {/* Información del Perfil */}
              <View style={styles.profileSection}>
                <Text style={styles.name} numberOfLines={2} adjustsFontSizeToFit>
                  {fullName}
                </Text>
                <Text style={styles.role}>{role}</Text>
              </View>

              {/* Contenedor del QR */}
              <View style={styles.qrSection}>
                <View style={styles.qrContainer}>
                  <View style={styles.qrCorners}>
                    <QRCode
                      value={dni}
                      size={Math.min(width * 0.50, 180)}
                      color="#0f172a"
                      backgroundColor="#ffffff"
                    />
                  </View>
                </View>
                <Text style={styles.qrLabel}>ESCANEO DE ASISTENCIA</Text>
              </View>

              {/* Pie de la tarjeta */}
              <View style={styles.footerInfo}>
                <View style={styles.barcodeLines}>
                  <View style={[styles.bar, {width: 2}]} />
                  <View style={[styles.bar, {width: 4}]} />
                  <View style={[styles.bar, {width: 2}]} />
                  <View style={[styles.bar, {width: 6}]} />
                  <View style={[styles.bar, {width: 3}]} />
                  <View style={[styles.bar, {width: 2}]} />
                  <View style={[styles.bar, {width: 8}]} />
                  <View style={[styles.bar, {width: 2}]} />
                  <View style={[styles.bar, {width: 4}]} />
                </View>
                <View>
                  <Text style={styles.dniLabel}>DNI</Text>
                  <Text style={styles.dniText}>{dni}</Text>
                </View>
              </View>

            </View>
          </View>
        </ScrollView>

        {/* BOTTOM NAV BAR */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home', { employee })}>
            <Home color="#94a3b8" size={24} />
            <Text style={styles.navText}>Inicio</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Payslips', { dni: employee?.dni || '' })}>
            <Receipt color="#94a3b8" size={24} />
            <Text style={styles.navText}>Boletas</Text>
          </TouchableOpacity>
          
          <View style={styles.navItemCenterContainer}>
            <TouchableOpacity style={styles.navItemCenterBtn}>
              <View style={[styles.navItemCenterInner, { backgroundColor: '#1d4ed8' }]}>
                <ScanLine color="#ffffff" size={28} />
              </View>
            </TouchableOpacity>
            <Text style={[styles.navTextCenter, { color: '#1d4ed8', fontWeight: '700' }]}>Carnet</Text>
          </View>

          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Requests', { employee: route?.params?.employee })}>
            <ClipboardCheck color="#94a3b8" size={24} />
            <Text style={styles.navText}>Solicitudes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profile', { employee: route?.params?.employee })}>
            <User color="#94a3b8" size={24} />
            <Text style={styles.navText}>Perfil</Text>
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 10,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 120, // Espacio para el nav
    alignItems: 'center',
    flexGrow: 1,
  },
  carnetCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.2,
    shadowRadius: 25,
    elevation: 20,
    overflow: 'hidden',
  },
  cardHeaderArea: {
    backgroundColor: '#ffffff',
    height: 120,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderBottomWidth: 4,
    borderBottomColor: '#1d4ed8',
  },
  companyLogo: {
    width: 220,
    height: 70,
    zIndex: 10,
  },
  decoCircle1: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#f1f5f9',
    top: -50,
    right: -30,
    zIndex: 1,
  },
  decoCircle2: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f1f5f9',
    bottom: -20,
    left: -20,
    zIndex: 1,
  },
  cardBodyArea: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: 'center',
  },
  avatarWrapper: {
    marginTop: -45, // Superpone al borde
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    position: 'relative',
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 6,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  cameraBtn: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#1d4ed8',
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
    elevation: 6,
  },
  photoWarningText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  name: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 4,
    lineHeight: 26,
  },
  role: {
    fontSize: 12,
    fontWeight: '800',
    color: '#3b82f6', 
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  qrSection: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
  },
  qrContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 15,
    elevation: 4,
  },
  qrCorners: {
    padding: 2, 
  },
  qrLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748b',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  footerInfo: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 18,
    borderTopWidth: 2,
    borderTopColor: '#f1f5f9',
  },
  barcodeLines: {
    flexDirection: 'row',
    height: 34,
    gap: 3,
    alignItems: 'center',
    opacity: 0.25,
  },
  bar: {
    backgroundColor: '#0f172a',
    height: '100%',
  },
  dniLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
    textTransform: 'uppercase',
    textAlign: 'right',
  },
  dniText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: 2,
    textAlign: 'right',
  },
  
  // NAV
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: '#010c24',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  navText: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 4,
  },
  navItemCenterContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: -30,
  },
  navItemCenterBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#051c4a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#010c24',
  },
  navItemCenterInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navTextCenter: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 4,
  },
});
