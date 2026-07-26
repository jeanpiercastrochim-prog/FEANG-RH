import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  ArrowLeft, CalendarDays, CheckCircle2, Hourglass, Plus, ChevronRight,
  Home, Receipt, ScanLine, ClipboardCheck, User, Check
} from 'lucide-react-native';

const HISTORY = [
  { id: 1, dateStr: '15 - 20 de julio 2026', days: 6, status: 'Aprobada', requestDate: '10 may. 2026' },
  { id: 2, dateStr: '3 - 7 de febrero 2026', days: 5, status: 'Aprobada', requestDate: '20 ene. 2026' },
  { id: 3, dateStr: '10 - 12 de abril 2026', days: 3, status: 'Pendiente', requestDate: '5 abr. 2026' },
];

export default function VacationsScreen({ navigation, route }: any) {
  const [activeTab, setActiveTab] = useState('Resumen');

  return (
    <LinearGradient colors={['#051c4a', '#020b1f']} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <ArrowLeft color="#ffffff" size={20} />
            </TouchableOpacity>
            <View>
              <Text style={styles.title}>Vacaciones</Text>
              <Text style={styles.subtitle}>Gestiona tu descanso</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <CalendarDays color="#60a5fa" size={32} />
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* MAIN CARD */}
          <LinearGradient colors={['rgba(30, 58, 138, 0.4)', 'rgba(30, 58, 138, 0.1)']} style={styles.mainCard}>
            <View style={styles.mainCardTop}>
              <View>
                <Text style={styles.saldoLabel}>Saldo disponible</Text>
                <Text style={styles.saldoDays}>18 <Text style={{ fontSize: 24, fontWeight: '400' }}>días</Text></Text>
                <Text style={styles.saldoTotal}>de 30 días totales</Text>
              </View>
              <View style={styles.progressCircle}>
                <View style={styles.progressInner}>
                  <Text style={styles.progressText}>60%</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity style={styles.requestBtn}>
              <Text style={styles.requestBtnText}>Solicitar vacaciones</Text>
              <Plus color="#ffffff" size={20} />
            </TouchableOpacity>
          </LinearGradient>

          {/* TABS */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity style={[styles.tabBtn, activeTab === 'Resumen' && styles.tabBtnActive]} onPress={() => setActiveTab('Resumen')}>
              <Text style={[styles.tabText, activeTab === 'Resumen' && styles.tabTextActive]}>Resumen</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tabBtn, activeTab === 'Historial' && styles.tabBtnActive]} onPress={() => setActiveTab('Historial')}>
              <Text style={[styles.tabText, activeTab === 'Historial' && styles.tabTextActive]}>Historial</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tabBtn, activeTab === 'Próximas' && styles.tabBtnActive]} onPress={() => setActiveTab('Próximas')}>
              <Text style={[styles.tabText, activeTab === 'Próximas' && styles.tabTextActive]}>Próximas</Text>
            </TouchableOpacity>
          </View>

          {/* STATS */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={[styles.statIconBox, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                <CalendarDays color="#60a5fa" size={20} />
              </View>
              <Text style={styles.statLabel}>Total anual</Text>
              <Text style={styles.statValue}>30 días</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                <CheckCircle2 color="#10b981" size={20} />
              </View>
              <Text style={styles.statLabel}>Días usados</Text>
              <Text style={styles.statValue}>12 días</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                <Hourglass color="#f59e0b" size={20} />
              </View>
              <Text style={styles.statLabel}>Pendientes</Text>
              <Text style={styles.statValue}>18 días</Text>
            </View>
          </View>

          {/* HISTORY LIST */}
          <Text style={styles.sectionTitle}>Historial de vacaciones</Text>
          {HISTORY.map((item) => (
            <TouchableOpacity key={item.id} style={styles.historyCard}>
              <View style={styles.historyLeft}>
                <View style={[styles.historyIconBox, { backgroundColor: item.status === 'Aprobada' ? '#10b981' : '#475569' }]}>
                  {item.status === 'Aprobada' ? <Check color="#ffffff" size={16} /> : <View style={styles.minusLine} />}
                </View>
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <Text style={styles.historyDateStr}>{item.dateStr}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: item.status === 'Aprobada' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)' }]}>
                      <Text style={[styles.statusBadgeText, { color: item.status === 'Aprobada' ? '#10b981' : '#f59e0b' }]}>{item.status}</Text>
                    </View>
                  </View>
                  <Text style={styles.historyDays}>{item.days} días</Text>
                </View>
              </View>
              <View style={styles.historyRight}>
                <Text style={styles.historyReqDate}>Solicitada el{'\n'}{item.requestDate}</Text>
                <ChevronRight color="#64748b" size={20} style={{ marginLeft: 8 }} />
              </View>
            </TouchableOpacity>
          ))}

        </ScrollView>

        {/* BOTTOM NAV BAR */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home', { employee: route?.params?.employee })}>
            <Home color="#94a3b8" size={24} />
            <Text style={styles.navText}>Inicio</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Payslips', { employee: route?.params?.employee })}>
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
          <TouchableOpacity style={styles.navItem}>
            <ClipboardCheck color="#3b82f6" size={24} />
            <Text style={[styles.navText, { color: '#3b82f6' }]}>Solicitudes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <User color="#94a3b8" size={24} />
            <Text style={styles.navText}>Perfil</Text>
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  title: { fontSize: 20, fontWeight: '700', color: '#ffffff', marginBottom: 2 },
  subtitle: { fontSize: 13, color: '#94a3b8' },
  headerRight: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 120 },
  mainCard: { borderRadius: 24, padding: 24, borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.2)', marginBottom: 24 },
  mainCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  saldoLabel: { color: '#cbd5e1', fontSize: 14, marginBottom: 4 },
  saldoDays: { color: '#60a5fa', fontSize: 42, fontWeight: '800', lineHeight: 48 },
  saldoTotal: { color: '#94a3b8', fontSize: 13 },
  progressCircle: { width: 80, height: 80, borderRadius: 40, borderWidth: 6, borderColor: '#1d4ed8', borderLeftColor: '#0f172a', justifyContent: 'center', alignItems: 'center' },
  progressInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' },
  progressText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  requestBtn: { backgroundColor: '#2563eb', borderRadius: 12, paddingVertical: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  requestBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '600', marginRight: 8 },
  tabsContainer: { flexDirection: 'row', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 20, padding: 4, marginBottom: 24 },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 16 },
  tabBtnActive: { backgroundColor: '#2563eb' },
  tabText: { color: '#cbd5e1', fontSize: 13, fontWeight: '500' },
  tabTextActive: { color: '#ffffff', fontWeight: '600' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
  statCard: { flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)', marginHorizontal: 4 },
  statIconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  statLabel: { color: '#94a3b8', fontSize: 12, marginBottom: 4 },
  statValue: { color: '#ffffff', fontSize: 18, fontWeight: '700' },
  sectionTitle: { color: '#ffffff', fontSize: 16, fontWeight: '600', marginBottom: 16 },
  historyCard: { backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  historyLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  historyIconBox: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  minusLine: { width: 12, height: 3, backgroundColor: '#ffffff', borderRadius: 2 },
  historyDateStr: { color: '#ffffff', fontSize: 14, fontWeight: '600', marginRight: 8 },
  statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  statusBadgeText: { fontSize: 9, fontWeight: '700' },
  historyDays: { color: '#94a3b8', fontSize: 13 },
  historyRight: { flexDirection: 'row', alignItems: 'center' },
  historyReqDate: { color: '#64748b', fontSize: 11, textAlign: 'right' },
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, backgroundColor: '#010c24', borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.05)', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingBottom: Platform.OS === 'ios' ? 20 : 0 },
  navItem: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  navText: { fontSize: 10, color: '#94a3b8', marginTop: 4 },
  navItemCenterContainer: { flex: 1, alignItems: 'center', justifyContent: 'flex-start', marginTop: -30 },
  navItemCenterBtn: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#051c4a', justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: '#010c24' },
  navItemCenterInner: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#1d4ed8', justifyContent: 'center', alignItems: 'center' },
  navTextCenter: { fontSize: 10, color: '#94a3b8', marginTop: 4 },
});
