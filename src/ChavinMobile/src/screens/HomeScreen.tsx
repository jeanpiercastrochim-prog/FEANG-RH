import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { 
  Bell, Wallet, Clock, ArrowRight, FileText, Receipt, 
  Calendar, ClipboardCheck, Folder, ChevronRight, Megaphone,
  Home, User, ScanLine, Leaf, Sun, Settings, MessageSquare, X, GraduationCap, Camera
} from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const API_URL = Platform.OS === 'web' ? 'http://localhost:5051/api' : 'http://10.0.2.2:5051/api';

export default function HomeScreen({ route, navigation }: any) {
  const [checkingContract, setCheckingContract] = React.useState(false);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [latestMessage, setLatestMessage] = React.useState<any>(null);
  const [isPopupOpen, setIsPopupOpen] = React.useState(false);
  const [employeeDetails, setEmployeeDetails] = React.useState<any>(null);
  const [totalBoletas, setTotalBoletas] = React.useState(0);

  // Manejo de seguridad en caso de que no venga el empleado en los params
  let employeeName = route?.params?.employee?.fullName || 'Alonso';
  
  // Si el nombre devuelto es un correo (caso administradores sin registro en Employees)
  if (employeeName.includes('@')) {
    if (route?.params?.employee?.dni === '55555555') {
      employeeName = 'Jeanpier Castro Alva';
    } else {
      employeeName = 'Administrador';
    }
  }

  const employeeRole = route?.params?.employee?.rol?.toLowerCase() || 'campo';
  const isAdministrativo = employeeRole === 'administrativo' || employeeRole === 'administrador' || employeeRole === 'rrhh';

  useFocusEffect(
    React.useCallback(() => {
      const fetchNotifications = async () => {
        try {
          const employee = route?.params?.employee;
          if (employee?.dni) {
            const res = await axios.get(`${API_URL}/AppNotification/${employee.dni}`);
            const messages = res.data;
            const unread = messages.filter((m: any) => !m.isRead);
            setUnreadCount(unread.length);
            if (unread.length > 0) {
              setLatestMessage(unread[0]);
            } else if (messages.length > 0) {
              setLatestMessage(messages[0]); // fallback to latest even if read
            } else {
              setLatestMessage(null);
            }
          }
        } catch (error) {
          console.error('Error fetching notifications:', error);
        }

        try {
          const employee = route?.params?.employee;
          if (employee?.dni) {
            const res = await axios.get(`${API_URL}/Employee/by-dni/${employee.dni}`);
            setEmployeeDetails(res.data);
          }
        } catch (error) {
          console.error('Error fetching employee data:', error);
        }

        try {
          const employee = route?.params?.employee;
          if (employee?.dni) {
            const res = await axios.get(`${API_URL}/Payslip?dni=${employee.dni}`);
            if (res.data && res.data.length > 0) {
              const sum = res.data.reduce((acc: number, curr: any) => acc + (Number(curr.netAmount) || 0), 0);
              setTotalBoletas(sum);
            } else {
              setTotalBoletas(0);
            }
          }
        } catch (error) {
          console.error('Error fetching payslips for total:', error);
        }
      };
      fetchNotifications();
    }, [route?.params?.employee])
  );

  const handleCheckContract = async () => {
    setCheckingContract(true);
    try {
      const employee = route?.params?.employee;
      
      if (!employee || !employee.dni) {
        alert("Sesión inválida o empleado no encontrado. Por favor, inicie sesión nuevamente.");
        setCheckingContract(false);
        return;
      }
      
      // Caso especial para el administrador (Jeanpier Castro Alva) que ya firmó contrato
      if (employee.dni === '55555555') {
        navigation.navigate('MyContract', { dni: employee.dni });
        return;
      }

      try {
        const resEmp = await axios.get(`${API_URL}/Employee/by-dni/${employee.dni}`);
        const empData = resEmp.data;
        if (empData.hasSignedContract) {
           navigation.navigate('MyContract', { dni: employee.dni });
           return;
        } else {
           navigation.navigate('DirectSignature', { employee: empData });
           return;
        }
      } catch (err: any) {
        if (err.response?.status === 404) {
          const [resFirmados, resPending] = await Promise.all([
            axios.get(`${API_URL}/Process/firmados`),
            axios.get(`${API_URL}/Process/pending`)
          ]);
          
          const signedContract = resFirmados.data.find((c: any) => c.numeroDNI === employee?.dni);
          const pendingContract = resPending.data.find((c: any) => c.numeroDNI === employee?.dni);
          
          if (signedContract) {
            navigation.navigate('MyContract', { dni: employee?.dni });
          } else if (pendingContract) {
            navigation.navigate('PendingContract', { contractId: pendingContract.id, employee });
          } else {
            navigation.navigate('Welcome', { employee });
          }
        } else {
          throw err;
        }
      }
    } catch (error) {
      console.error(error);
      if (Platform.OS === 'web') alert('Error al verificar contrato');
    } finally {
      setCheckingContract(false);
    }
  };

  return (
    <LinearGradient 
      colors={['#051c4a', '#020b1f']} 
      style={styles.container}
    >
      <SafeAreaView style={{ flex: 1 }}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>CHAVIN</Text>
            <View style={styles.logoDecoration}>
              <View style={styles.decoLine} />
              <View style={styles.decoIcons}>
                <Leaf color="#10b981" size={12} fill="#10b981" style={{ marginRight: 4 }} />
                <Sun color="#f59e0b" size={12} fill="#f59e0b" style={{ marginRight: 4 }} />
                <Settings color="#94a3b8" size={12} fill="#94a3b8" />
              </View>
              <View style={styles.decoLine} />
            </View>
          </View>
          <TouchableOpacity style={styles.bellButton} onPress={() => setIsPopupOpen(!isPopupOpen)}>
            <Bell color="#ffffff" size={24} />
            {unreadCount > 0 && (
              <View style={[styles.notificationDot, { width: 16, height: 16, borderRadius: 8, top: -2, right: -4, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: 'white', fontSize: 9, fontWeight: 'bold' }}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {isPopupOpen && (
          <View style={{ position: 'absolute', top: 70, right: 20, width: 320, backgroundColor: 'rgba(15, 23, 42, 0.95)', borderRadius: 16, padding: 0, zIndex: 99, shadowColor: '#000', shadowOffset: { width: 0, height: 15 }, shadowOpacity: 0.5, shadowRadius: 25, elevation: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
            
            <LinearGradient colors={['#1d4ed8', '#1e3a8a']} style={{ padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Bell color="#ffffff" size={16} style={{ marginRight: 8 }} />
                <Text style={{ color: 'white', fontWeight: '700', fontSize: 14 }}>Notificaciones</Text>
              </View>
              <TouchableOpacity onPress={() => setIsPopupOpen(false)} style={{ padding: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12 }}>
                <X color="#ffffff" size={14} />
              </TouchableOpacity>
            </LinearGradient>
            
            <View style={{ padding: 16 }}>
              {latestMessage ? (
                <TouchableOpacity 
                  onPress={() => { setIsPopupOpen(false); navigation.navigate('Notifications', { employee: route?.params?.employee }); }}
                  style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.2)' }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                      <MessageSquare color="#ffffff" size={18} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 14, marginBottom: 4 }}>{latestMessage.title}</Text>
                      <Text style={{ color: '#94a3b8', fontSize: 13, lineHeight: 18 }} numberOfLines={2}>{latestMessage.message}</Text>
                      <Text style={{ color: '#64748b', fontSize: 10, marginTop: 6, fontWeight: '500' }}>ÚLTIMO MENSAJE</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ) : (
                <View style={{ alignItems: 'center', paddingVertical: 16 }}>
                  <Bell color="#475569" size={32} style={{ marginBottom: 12 }} />
                  <Text style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center' }}>Estás al día. No tienes notificaciones nuevas.</Text>
                </View>
              )}
            </View>

            <TouchableOpacity 
              onPress={() => { setIsPopupOpen(false); navigation.navigate('Notifications', { employee: route?.params?.employee }); }} 
              style={{ paddingVertical: 14, backgroundColor: 'rgba(255,255,255,0.02)', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', alignItems: 'center' }}
            >
              <Text style={{ color: '#60a5fa', fontSize: 13, fontWeight: '600' }}>Ver bandeja completa</Text>
            </TouchableOpacity>
          </View>
        )}

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {employeeDetails && !employeeDetails.profileImagePath && (
            <TouchableOpacity 
              style={styles.mandatoryPhotoBanner}
              onPress={() => navigation.navigate('Carnet', { employee: route?.params?.employee })}
            >
              <View style={styles.mandatoryPhotoIcon}>
                <Camera color="#ffffff" size={24} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.mandatoryPhotoTitle}>FOTOGRAFÍA OBLIGATORIA</Text>
                <Text style={styles.mandatoryPhotoText}>Ingresa a tu Carnet Digital y tómate una foto para activar tu perfil.</Text>
              </View>
              <ChevronRight color="#ffffff" size={20} opacity={0.7} />
            </TouchableOpacity>
          )}

          {/* GREETING */}
          <View style={styles.greetingSection}>
            <Text style={styles.welcomeText}>¡Hola, {employeeName}! 👋</Text>
            <Text style={styles.subtitleText}>Nos alegra tenerte de vuelta</Text>
          </View>

          {/* MAIN CARD: Próxima boleta */}
          <View style={styles.mainCard}>
            <View style={styles.mainCardTop}>
              <View style={styles.mainCardLeft}>
                <View style={styles.walletCircle}>
                  <Wallet color="#3b82f6" size={24} />
                </View>
                <View>
                  <Text style={styles.cardLabel}>Próxima boleta</Text>
                  <Text style={styles.cardValueLarge}>Julio 2026</Text>
                  <View style={styles.pillContainer}>
                    <Clock color="#cbd5e1" size={12} style={{ marginRight: 4 }} />
                    <Text style={styles.pillText}>En 5 días</Text>
                  </View>
                </View>
              </View>
              <View style={styles.mainCardRight}>
                <Text style={styles.cardLabelRight}>Monto generado</Text>
                <Text style={styles.cardAmount}>S/ {totalBoletas.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}</Text>
                <TouchableOpacity style={styles.historyBtn} onPress={() => navigation.navigate('Payslips', { dni: route?.params?.employee?.dni || '' })}>
                  <Text style={styles.historyBtnText}>Ver historial</Text>
                  <ArrowRight color="#cbd5e1" size={14} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* ACCESOS RÁPIDOS */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Accesos rápidos</Text>
            <TouchableOpacity>
              <Text style={styles.linkText}>Ver todos</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.gridContainer}>
            {/* ROW 1 */}
            <View style={styles.gridRow}>
              <TouchableOpacity style={styles.gridCard} onPress={handleCheckContract} disabled={checkingContract}>
                <FileText color="#60a5fa" size={28} style={[styles.gridIcon, checkingContract && { opacity: 0.5 }]} />
                <Text style={styles.gridTitle}>{checkingContract ? 'Verificando...' : 'Mi Contrato'}</Text>
                <Text style={styles.gridSubtitle}>Consulta y descarga{'\n'}tu contrato laboral</Text>
                <ChevronRight color="#64748b" size={16} style={styles.gridArrow} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.gridCard} onPress={() => navigation.navigate('Payslips', { dni: route?.params?.employee?.dni || '' })}>
                <Receipt color="#10b981" size={28} style={styles.gridIcon} />
                <Text style={styles.gridTitle}>Mis Boletas</Text>
                <Text style={styles.gridSubtitle}>Historial de boletas{'\n'}de pago</Text>
                <ChevronRight color="#64748b" size={16} style={styles.gridArrow} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.gridCard} onPress={() => navigation.navigate('Notifications', { employee: route?.params?.employee })}>
                <MessageSquare color="#60a5fa" size={28} style={styles.gridIcon} />
                <Text style={styles.gridTitle}>Mensajes</Text>
                <Text style={styles.gridSubtitle}>Avisos y{'\n'}comunicados</Text>
                <ChevronRight color="#64748b" size={16} style={styles.gridArrow} />
              </TouchableOpacity>
            </View>

            {/* ROW 2 */}
            {isAdministrativo && (
              <View style={styles.gridRow}>
                <TouchableOpacity style={styles.gridCard} onPress={() => navigation.navigate('Vacations')}>
                  <Calendar color="#60a5fa" size={28} style={styles.gridIcon} />
                  <Text style={styles.gridTitle}>Vacaciones</Text>
                  <Text style={styles.gridSubtitle}>Solicita y revisa{'\n'}tus días libres</Text>
                  <ChevronRight color="#64748b" size={16} style={styles.gridArrow} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.gridCard} onPress={() => navigation.navigate('Training', { employee: route?.params?.employee })}>
                  <GraduationCap color="#14b8a6" size={28} style={styles.gridIcon} />
                  <Text style={styles.gridTitle}>Capacitación</Text>
                  <Text style={styles.gridSubtitle}>Manuales y{'\n'}cursos de seguridad</Text>
                  <ChevronRight color="#64748b" size={16} style={styles.gridArrow} />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* COMUNICADOS IMPORTANTES */}
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Megaphone color="#60a5fa" size={20} style={{ marginRight: 8 }} />
              <Text style={styles.sectionTitle}>Comunicados importantes</Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.linkText}>Ver más</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.comunicadoCard}>
            <View style={styles.comunicadoHeader}>
              <View style={styles.comunicadoTitleContainer}>
                <View style={styles.comunicadoDot} />
                <Text style={styles.comunicadoTitle}>Horario de capacitación</Text>
              </View>
              <Text style={styles.comunicadoDate}>22 may 2026</Text>
            </View>
            <Text style={styles.comunicadoText}>
              Te recordamos que mañana tenemos capacitación obligatoria a las 8:00 a.m.
            </Text>
          </View>

        </ScrollView>

        {/* BOTTOM NAV BAR */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem}>
            <Home color="#3b82f6" size={24} />
            <Text style={[styles.navText, { color: '#3b82f6' }]}>Inicio</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Payslips', { dni: route?.params?.employee?.dni || '' })}>
            <Receipt color="#94a3b8" size={24} />
            <Text style={styles.navText}>Boletas</Text>
          </TouchableOpacity>
          
          <View style={styles.navItemCenterContainer}>
            <TouchableOpacity style={styles.navItemCenterBtn} onPress={() => navigation.navigate('Carnet', { employee: route?.params?.employee })}>
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
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  logoContainer: {
    alignItems: 'flex-start',
  },
  logoText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 1,
    marginBottom: -2,
  },
  logoDecoration: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 100,
  },
  decoLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: '#3b82f6',
  },
  decoIcons: {
    flexDirection: 'row',
    paddingHorizontal: 6,
  },
  bellButton: {
    padding: 4,
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
    borderWidth: 1,
    borderColor: '#051c4a',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 100, // Space for Bottom Nav
  },
  mandatoryPhotoBanner: {
    backgroundColor: '#ef4444', // Red-500
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  mandatoryPhotoIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  mandatoryPhotoTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  mandatoryPhotoText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    lineHeight: 16,
  },
  greetingSection: {
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 14,
    color: '#94a3b8',
  },
  mainCard: {
    backgroundColor: 'rgba(30, 58, 138, 0.4)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    marginBottom: 32,
  },
  mainCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mainCardLeft: {
    flexDirection: 'row',
  },
  walletCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardLabel: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  cardValueLarge: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  pillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  pillText: {
    color: '#cbd5e1',
    fontSize: 10,
    fontWeight: '600',
  },
  mainCardRight: {
    alignItems: 'flex-end',
  },
  cardLabelRight: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  cardAmount: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 12,
  },
  historyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  historyBtnText: {
    color: '#cbd5e1',
    fontSize: 11,
    marginRight: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  linkText: {
    fontSize: 13,
    color: '#3b82f6',
    fontWeight: '600',
  },
  gridContainer: {
    marginBottom: 32,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  gridCard: {
    width: '31%', // Responsive width instead of fixed Dimensions
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  gridIcon: {
    marginBottom: 12,
  },
  gridTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  gridSubtitle: {
    color: '#64748b',
    fontSize: 9,
    lineHeight: 12,
    marginBottom: 12,
  },
  gridArrow: {
    position: 'absolute',
    bottom: 12,
    right: 12,
  },
  comunicadoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 20,
  },
  comunicadoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  comunicadoTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  comunicadoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3b82f6',
    marginRight: 8,
  },
  comunicadoTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  comunicadoDate: {
    color: '#64748b',
    fontSize: 11,
  },
  comunicadoText: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 18,
    paddingLeft: 14,
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
    backgroundColor: '#1d4ed8', // Vivid blue
    justifyContent: 'center',
    alignItems: 'center',
  },
  navTextCenter: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 4,
  },
});
