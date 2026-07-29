import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Platform, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { 
  ArrowLeft, Bell, MessageSquare, ClipboardCheck, Megaphone, ShieldCheck,
  Home, Receipt, ScanLine, User
} from 'lucide-react-native';

const API_URL = Platform.OS === 'web' ? 'https://technical-latina-chastenedly.ngrok-free.dev/api' : 'https://technical-latina-chastenedly.ngrok-free.dev/api';

export default function NotificationsScreen({ navigation, route }: any) {
  const [activeTab, setActiveTab] = useState('Todas');
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);

  const employee = route?.params?.employee;

  const fetchMessages = async () => {
    if (!employee?.dni) return;
    try {
      const response = await axios.get(`${API_URL}/AppNotification/${employee.dni}`);
      setMessages(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchMessages();
    }, [employee?.dni])
  );

  const handlePressMessage = async (item: any) => {
    if (!item.isRead) {
      try {
        await axios.put(`${API_URL}/AppNotification/${item.id}/read`);
        // Update local state
        setMessages(prev => prev.map(msg => msg.id === item.id ? { ...msg, isRead: true } : msg));
      } catch (error) {
        console.error('Error marking as read', error);
      }
    }
    setSelectedMessage(item);
  };

  const filteredMessages = messages.filter(msg => {
    if (activeTab === 'No leídas') return !msg.isRead;
    if (activeTab === 'Leídas') return msg.isRead;
    return true;
  });

  const unreadCount = messages.filter(m => !m.isRead).length;

  const renderItem = ({ item }: any) => {
    const bg = item.isRead ? 'rgba(148, 163, 184, 0.15)' : 'rgba(59, 130, 246, 0.15)';
    return (
      <TouchableOpacity style={styles.card} onPress={() => handlePressMessage(item)}>
        <View style={styles.cardLeft}>
          <View style={[styles.iconBox, { backgroundColor: bg }]}>
            <MessageSquare color={item.isRead ? "#94a3b8" : "#3b82f6"} size={24} />
          </View>
        </View>
        <View style={styles.cardMiddle}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardDesc} numberOfLines={2}>{item.message}</Text>
          <Text style={styles.cardDate}>{new Date(item.createdAt).toLocaleString()}</Text>
        </View>
        <View style={styles.cardRight}>
          <View style={[styles.dot, { backgroundColor: item.isRead ? '#475569' : '#3b82f6' }]} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient colors={['#051c4a', '#020b1f']} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <ArrowLeft color="#ffffff" size={20} />
            </TouchableOpacity>
            <View>
              <Text style={styles.title}>Mensajes</Text>
              <Text style={styles.subtitle}>Mantente al día</Text>
            </View>
          </View>
          <View style={styles.bellBox}>
            <Bell color="#fcd34d" size={28} fill="#fcd34d" />
            {unreadCount > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.tabsContainer}>
          <TouchableOpacity style={[styles.tabBtn, activeTab === 'Todas' && styles.tabBtnActive]} onPress={() => setActiveTab('Todas')}>
            <Text style={[styles.tabText, activeTab === 'Todas' && styles.tabTextActive]}>Todas</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabBtn, activeTab === 'No leídas' && styles.tabBtnActive]} onPress={() => setActiveTab('No leídas')}>
            <Text style={[styles.tabText, activeTab === 'No leídas' && styles.tabTextActive]}>No leídas {unreadCount > 0 && <Text style={styles.badgeNum}>{unreadCount}</Text>}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabBtn, activeTab === 'Leídas' && styles.tabBtnActive]} onPress={() => setActiveTab('Leídas')}>
            <Text style={[styles.tabText, activeTab === 'Leídas' && styles.tabTextActive]}>Leídas</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 50 }} />
        ) : (
          <FlatList
            data={filteredMessages}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Text style={{ color: '#64748b', textAlign: 'center', marginTop: 40 }}>No tienes mensajes en esta bandeja.</Text>
            }
          />
        )}

        {/* Custom Message Detail Modal */}
        <Modal
          visible={!!selectedMessage}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setSelectedMessage(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <LinearGradient colors={['#1e3a8a', '#1e40af']} style={styles.modalHeader}>
                <View style={styles.modalIconBox}>
                  <MessageSquare color="#ffffff" size={24} />
                </View>
                <Text style={styles.modalTitle}>{selectedMessage?.title}</Text>
              </LinearGradient>
              
              <View style={styles.modalBody}>
                <Text style={styles.modalDate}>
                  {selectedMessage && new Date(selectedMessage.createdAt).toLocaleString()}
                </Text>
                <Text style={styles.modalText}>{selectedMessage?.message}</Text>
              </View>
              
              <View style={styles.modalFooter}>
                <TouchableOpacity 
                  style={styles.closeModalBtn} 
                  onPress={() => setSelectedMessage(null)}
                >
                  <Text style={styles.closeModalBtnText}>Entendido</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

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
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  title: { fontSize: 20, fontWeight: '700', color: '#ffffff', marginBottom: 2 },
  subtitle: { fontSize: 13, color: '#94a3b8' },
  bellBox: { position: 'relative' },
  bellBadge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#ef4444', minWidth: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  bellBadgeText: { color: '#ffffff', fontSize: 10, fontWeight: '800' },
  tabsContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 20, justifyContent: 'space-between' },
  tabBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  tabBtnActive: { backgroundColor: '#2563eb' },
  tabText: { color: '#cbd5e1', fontSize: 13, fontWeight: '500' },
  tabTextActive: { color: '#ffffff', fontWeight: '600' },
  badgeNum: { backgroundColor: '#ef4444', color: 'white', paddingHorizontal: 6, borderRadius: 10, overflow: 'hidden', marginLeft: 4, fontSize: 11 },
  listContent: { paddingHorizontal: 20, paddingBottom: 120 },
  card: { backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)', flexDirection: 'row', marginBottom: 12 },
  cardLeft: { marginRight: 16 },
  iconBox: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  cardMiddle: { flex: 1, justifyContent: 'center' },
  cardTitle: { color: '#ffffff', fontSize: 15, fontWeight: '700', marginBottom: 4 },
  cardDesc: { color: '#94a3b8', fontSize: 13, marginBottom: 8, lineHeight: 18 },
  cardDate: { color: '#64748b', fontSize: 11 },
  cardRight: { justifyContent: 'center', marginLeft: 12 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, backgroundColor: '#010c24', borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.05)', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingBottom: Platform.OS === 'ios' ? 20 : 0 },
  navItem: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  navText: { fontSize: 10, color: '#94a3b8', marginTop: 4 },
  navItemCenterContainer: { flex: 1, alignItems: 'center', justifyContent: 'flex-start', marginTop: -30 },
  navItemCenterBtn: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#051c4a', justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: '#010c24' },
  navItemCenterInner: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#1d4ed8', justifyContent: 'center', alignItems: 'center' },
  navTextCenter: { fontSize: 10, color: '#94a3b8', marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(2, 11, 31, 0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', maxWidth: 400, backgroundColor: '#ffffff', borderRadius: 24, overflow: 'hidden', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20 },
  modalHeader: { padding: 24, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.1)' },
  modalIconBox: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255, 255, 255, 0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#ffffff', textAlign: 'center' },
  modalBody: { padding: 24, backgroundColor: '#f8fafc' },
  modalDate: { fontSize: 12, color: '#64748b', marginBottom: 16, textAlign: 'center', fontWeight: '500' },
  modalText: { fontSize: 15, color: '#334155', lineHeight: 24, textAlign: 'center' },
  modalFooter: { padding: 20, backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  closeModalBtn: { backgroundColor: '#2563eb', paddingVertical: 14, borderRadius: 16, alignItems: 'center' },
  closeModalBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '700' }
});
