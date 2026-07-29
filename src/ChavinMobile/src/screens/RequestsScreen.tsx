import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Plus, Clock, CheckCircle, XCircle, FileText } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';

const API_URL = Platform.OS === 'web' ? 'https://technical-latina-chastenedly.ngrok-free.dev/api' : 'https://technical-latina-chastenedly.ngrok-free.dev/api';

export default function RequestsScreen({ route, navigation }: any) {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const employee = route?.params?.employee;

  const fetchRequests = async () => {
    if (employee?.id === undefined || employee?.id === null) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/EmployeeRequest/${employee.id}`);
      setRequests(res.data);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchRequests();
    }, [employee])
  );

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'aprobado': return <CheckCircle color="#10b981" size={20} />;
      case 'rechazado': return <XCircle color="#ef4444" size={20} />;
      default: return <Clock color="#f59e0b" size={20} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'aprobado': return '#10b981';
      case 'rechazado': return '#ef4444';
      default: return '#f59e0b';
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
          <Text style={styles.headerTitle}>Mis Solicitudes</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {loading ? (
            <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 40 }} />
          ) : requests.length === 0 ? (
            <View style={styles.emptyState}>
              <FileText color="#475569" size={48} style={{ marginBottom: 16 }} />
              <Text style={styles.emptyText}>No tienes solicitudes registradas.</Text>
              <Text style={styles.emptySubtext}>Puedes crear una nueva usando el botón inferior.</Text>
            </View>
          ) : (
            requests.map((req, index) => (
              <TouchableOpacity 
                key={req.id || index} 
                style={styles.requestCard}
                onPress={() => navigation.navigate('RequestDetail', { request: req })}
              >
                <View style={styles.requestHeader}>
                  <View style={styles.typeContainer}>
                    <View style={styles.iconBox}>
                      <FileText color="#3b82f6" size={20} />
                    </View>
                    <Text style={styles.requestType}>{req.type}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(req.status) + '20', borderColor: getStatusColor(req.status) + '50' }]}>
                    {getStatusIcon(req.status)}
                    <Text style={[styles.statusText, { color: getStatusColor(req.status) }]}>{req.status}</Text>
                  </View>
                </View>
                
                <View style={styles.dateContainer}>
                  <Clock color="#94a3b8" size={14} style={{ marginRight: 6 }} />
                  <Text style={styles.requestDate}>
                    {new Date(req.createdAt).toLocaleDateString()} • {new Date(req.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        {/* FAB */}
        <TouchableOpacity 
          style={styles.fab}
          onPress={() => navigation.navigate('NewRequest', { employee })}
        >
          <Plus color="#ffffff" size={28} />
        </TouchableOpacity>
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
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
  },
  emptyText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
  },
  requestCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  typeContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  iconBox: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    padding: 8,
    borderRadius: 10,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  requestType: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
    textTransform: 'capitalize',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requestDate: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
