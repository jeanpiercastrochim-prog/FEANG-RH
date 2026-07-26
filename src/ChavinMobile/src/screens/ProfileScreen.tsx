import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  User, Shield, Lock, LogOut, ChevronRight, Mail, Phone,
  MapPin, Calendar, Camera, Home, Receipt, ScanLine, ClipboardCheck
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function ProfileScreen({ route, navigation }: any) {
  const employee = route?.params?.employee || {};
  const employeeName = employee?.fullName || 'Usuario Chavín';
  const employeeDni = employee?.dni || 'No registrado';
  const employeePhone = employee?.phone || 'No registrado';
  const employeeEmail = employee?.email || 'No registrado';
  const employeePosition = employee?.position || 'Colaborador';

  const getInitials = (name: string) => {
    if (!name) return '??';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleLogout = () => {
    // In a real app we'd clear auth tokens here
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  return (
    <LinearGradient colors={['#051c4a', '#020b1f']} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* HEADER / AVATAR */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <LinearGradient colors={['#3b82f6', '#1d4ed8']} style={styles.avatarGradient}>
                <Text style={styles.avatarText}>{getInitials(employeeName)}</Text>
              </LinearGradient>
              <TouchableOpacity style={styles.cameraBtn}>
                <Camera color="#ffffff" size={16} />
              </TouchableOpacity>
            </View>
            <Text style={styles.nameText}>{employeeName}</Text>
            <Text style={styles.positionText}>{employeePosition}</Text>
            <View style={styles.badgeContainer}>
              <Shield color="#10b981" size={14} style={{ marginRight: 4 }} />
              <Text style={styles.badgeText}>Cuenta Verificada</Text>
            </View>
          </View>

          {/* CONTACT INFO */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Información Personal</Text>
            <View style={styles.card}>
              
              <View style={styles.infoRow}>
                <View style={styles.infoIconBox}>
                  <User color="#3b82f6" size={18} />
                </View>
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Documento de Identidad</Text>
                  <Text style={styles.infoValue}>{employeeDni}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <View style={styles.infoIconBox}>
                  <Phone color="#10b981" size={18} />
                </View>
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Teléfono</Text>
                  <Text style={styles.infoValue}>{employeePhone}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <View style={styles.infoIconBox}>
                  <Mail color="#8b5cf6" size={18} />
                </View>
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Correo Electrónico</Text>
                  <Text style={styles.infoValue}>{employeeEmail}</Text>
                </View>
              </View>

            </View>
          </View>

          {/* SETTINGS */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Configuración</Text>
            <View style={styles.card}>
              
              <TouchableOpacity style={styles.settingRow}>
                <View style={[styles.settingIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                  <Lock color="#f59e0b" size={18} />
                </View>
                <Text style={styles.settingText}>Cambiar Contraseña</Text>
                <ChevronRight color="#64748b" size={20} />
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity style={styles.settingRow} onPress={handleLogout}>
                <View style={[styles.settingIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                  <LogOut color="#ef4444" size={18} />
                </View>
                <Text style={[styles.settingText, { color: '#ef4444' }]}>Cerrar Sesión</Text>
                <ChevronRight color="#64748b" size={20} />
              </TouchableOpacity>

            </View>
          </View>

        </ScrollView>

        {/* BOTTOM NAV BAR */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home', { employee })}>
            <Home color="#94a3b8" size={24} />
            <Text style={styles.navText}>Inicio</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Payslips', { dni: employeeDni, employee })}>
            <Receipt color="#94a3b8" size={24} />
            <Text style={styles.navText}>Boletas</Text>
          </TouchableOpacity>
          
          <View style={styles.navItemCenterContainer}>
            <TouchableOpacity style={styles.navItemCenterBtn} onPress={() => navigation.navigate('Carnet', { employee })}>
              <View style={styles.navItemCenterInner}>
                <ScanLine color="#ffffff" size={28} />
              </View>
            </TouchableOpacity>
            <Text style={styles.navTextCenter}>Carnet</Text>
          </View>

          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Requests', { employee: route?.params?.employee })}>
            <ClipboardCheck color="#94a3b8" size={24} />
            <Text style={styles.navText}>Solicitudes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <User color="#3b82f6" size={24} />
            <Text style={[styles.navText, { color: '#3b82f6' }]}>Perfil</Text>
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
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 100, // Space for Bottom Nav
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#ffffff',
  },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#1d4ed8',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#020b1f',
  },
  nameText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  positionText: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 12,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  badgeText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 12,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    color: '#ffffff',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginVertical: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingText: {
    flex: 1,
    fontSize: 15,
    color: '#ffffff',
    fontWeight: '600',
  },
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
    backgroundColor: '#1d4ed8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navTextCenter: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 4,
  },
});
