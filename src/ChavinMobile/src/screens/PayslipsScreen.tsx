import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Platform, Dimensions, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { 
  Download, ArrowLeft, FileText, Filter, Calendar, TrendingUp, ChevronRight,
  Home, Receipt, ScanLine, ClipboardCheck, User, CalendarDays
} from 'lucide-react-native';

const { width } = Dimensions.get('window');
const API_URL = Platform.OS === 'web' ? 'http://localhost:5050/api' : 'http://127.0.0.1:5050/api';
// Base URL para archivos estáticos (quitando el /api del final)
const BASE_URL = API_URL.replace('/api', '');

export default function PayslipsScreen({ route, navigation }: any) {
  const dni = route?.params?.dni || '';
  const [payslips, setPayslips] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Todas');
  const [availableYears, setAvailableYears] = useState<string[]>(['Todas']);
  const [totalIncome, setTotalIncome] = useState(0);

  useEffect(() => {
    const fetchPayslips = async () => {
      try {
        if (!dni) return;
        const res = await axios.get(`${API_URL}/Payslip?dni=${dni}`);
        // Solo mostrar boletas con estado 'Enviado'
        const sentPayslips = res.data.filter((p: any) => p.status === 'Enviado');
        
        // Mapear al formato de la UI
        const formatted = sentPayslips.map((p: any, index: number) => ({
          id: p.id,
          period: `${p.month} ${p.year}`,
          date: p.generatedAt ? new Date(p.generatedAt).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }) : '25 de mes',
          netAmount: p.amountPaid,
          isRecent: index === 0,
          originalDate: new Date(p.generatedAt || new Date()),
          pdfUrl: `${BASE_URL}/payslips/${p.dni}_${p.month}_${p.year}.pdf`
        }));

        // Ordenar más recientes primero
        formatted.sort((a: any, b: any) => b.originalDate - a.originalDate);
        if (formatted.length > 0) formatted[0].isRecent = true;

        // Calcular total de ingresos y extraer años únicos
        const total = formatted.reduce((sum: number, p: any) => sum + p.netAmount, 0);
        setTotalIncome(total);

        const years = Array.from(new Set(sentPayslips.map((p: any) => p.year.toString()))).sort().reverse();
        setAvailableYears(['Todas', ...years as string[]]);

        setPayslips(formatted);
      } catch (error) {
        console.error('Error fetching payslips:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPayslips();
  }, [dni]);

  const handleDownload = (url: string) => {
    if (url) {
      Linking.openURL(url).catch(err => {
        console.error('Error opening URL: ', err);
        if (Platform.OS === 'web') window.alert('No se pudo abrir el PDF.');
        else alert('No se pudo abrir el PDF.');
      });
    }
  };

  const renderItem = ({ item }: any) => (
    <View style={styles.payslipCard}>
      <View style={styles.payslipCardLeft}>
        <View style={styles.calendarIconBox}>
          <Calendar color="#60a5fa" size={24} />
        </View>
        <View style={styles.payslipInfo}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
            <Text style={styles.periodText}>{item.period}</Text>
            {item.isRecent && (
              <View style={styles.recentBadge}>
                <Text style={styles.recentBadgeText}>Más reciente</Text>
              </View>
            )}
          </View>
          <Text style={styles.payslipType}>Boleta de pago</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <CalendarDays color="#64748b" size={12} style={{ marginRight: 4 }} />
            <Text style={styles.payslipDate}>{item.date || '25 de mes'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.payslipCardRight}>
        <View style={{ alignItems: 'flex-end', marginRight: 12 }}>
          <Text style={styles.amountText}>S/ {item.netAmount.toFixed(2)}</Text>
          <Text style={styles.netText}>Neto a pagar</Text>
        </View>
        <TouchableOpacity style={styles.downloadBtn} onPress={() => handleDownload(item.pdfUrl)}>
          <View style={styles.downloadIconCircle}>
            <Download color="#3b82f6" size={16} />
          </View>
          <Text style={styles.downloadText}>Descargar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFooter = () => (
    <TouchableOpacity style={styles.constanciaBanner}>
      <View style={styles.constanciaIconBox}>
        <FileText color="#60a5fa" size={20} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.constanciaTitle}>¿Necesitas una constancia de ingresos?</Text>
        <Text style={styles.constanciaSubtitle}>Solicítala en <Text style={{ color: '#3b82f6' }}>Solicitudes</Text></Text>
      </View>
      <ChevronRight color="#64748b" size={20} />
    </TouchableOpacity>
  );

  return (
    <LinearGradient 
      colors={['#051c4a', '#020b1f']} 
      style={styles.container}
    >
      <SafeAreaView style={{ flex: 1 }}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <ArrowLeft color="#ffffff" size={20} />
            </TouchableOpacity>
            <View>
              <Text style={styles.title}>Mis Boletas</Text>
              <Text style={styles.subtitle}>Historial de boletas de pago</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.filterBtn}>
            <Filter color="#3b82f6" size={18} style={{ marginRight: 6 }} />
            <Text style={styles.filterText}>Filtrar</Text>
          </TouchableOpacity>
        </View>

        {/* MAIN CARD (Resumen Anual) */}
        <View style={{ paddingHorizontal: 20 }}>
          <LinearGradient colors={['rgba(30, 58, 138, 0.4)', 'rgba(30, 58, 138, 0.1)']} style={styles.summaryCard}>
            <View style={styles.summaryLeft}>
              <View style={styles.summaryIconBox}>
                <FileText color="#ffffff" size={24} />
              </View>
              <View>
                <Text style={styles.summaryTitle}>Resumen anual {activeTab !== 'Todas' ? activeTab : (availableYears.length > 1 ? availableYears[1] : new Date().getFullYear())}</Text>
                <Text style={styles.summaryLabel}>Total ingresos</Text>
                <Text style={styles.summaryAmount}>S/ {totalIncome.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
              </View>
            </View>
            <View style={styles.chartMockup}>
              <Text style={styles.chartYear}>{activeTab !== 'Todas' ? activeTab : (availableYears.length > 1 ? availableYears[1] : new Date().getFullYear())}</Text>
              <TrendingUp color="#3b82f6" size={40} style={{ opacity: 0.8 }} />
            </View>
          </LinearGradient>
        </View>

        {/* TABS */}
        <View style={styles.tabsContainer}>
          {availableYears.map(tab => (
            <TouchableOpacity 
              key={tab} 
              style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* LIST */}
        <FlatList
          data={activeTab === 'Todas' ? payslips : payslips.filter(p => p.period.includes(activeTab))}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          ListFooterComponent={renderFooter}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />

        {/* BOTTOM NAV BAR */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home', { employee: route?.params?.employee })}>
            <Home color="#94a3b8" size={24} />
            <Text style={styles.navText}>Inicio</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <Receipt color="#3b82f6" size={24} />
            <Text style={[styles.navText, { color: '#3b82f6' }]}>Boletas</Text>
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: '#94a3b8',
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
  },
  summaryCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  summaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  summaryTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  summaryLabel: {
    color: '#cbd5e1',
    fontSize: 12,
    marginBottom: 4,
  },
  summaryAmount: {
    color: '#60a5fa',
    fontSize: 20,
    fontWeight: '800',
  },
  chartMockup: {
    width: 90,
    height: 60,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  chartYear: {
    position: 'absolute',
    top: 6,
    left: 6,
    color: 'rgba(96, 165, 250, 0.5)',
    fontSize: 10,
    fontWeight: '700',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tabBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  tabBtnActive: {
    backgroundColor: '#2563eb',
  },
  tabText: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 120, // Extra space for Bottom Nav
  },
  payslipCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  payslipCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calendarIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  payslipInfo: {
    justifyContent: 'center',
  },
  periodText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    marginRight: 8,
  },
  recentBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  recentBadgeText: {
    color: '#10b981',
    fontSize: 9,
    fontWeight: '700',
  },
  payslipType: {
    color: '#cbd5e1',
    fontSize: 12,
    marginBottom: 4,
  },
  payslipDate: {
    color: '#64748b',
    fontSize: 11,
  },
  payslipCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  netText: {
    color: '#94a3b8',
    fontSize: 11,
  },
  downloadBtn: {
    alignItems: 'center',
  },
  downloadIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  downloadText: {
    color: '#3b82f6',
    fontSize: 10,
    fontWeight: '500',
  },
  constanciaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    marginTop: 8,
    marginBottom: 24,
  },
  constanciaIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  constanciaTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  constanciaSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
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
