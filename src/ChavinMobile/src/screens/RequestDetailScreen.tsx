import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, CheckCircle, XCircle, Clock, FileText, User } from 'lucide-react-native';

export default function RequestDetailScreen({ route, navigation }: any) {
  const { request } = route?.params || {};

  if (!request) return null;

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'aprobado': return <CheckCircle color="#10b981" size={24} />;
      case 'rechazado': return <XCircle color="#ef4444" size={24} />;
      default: return <Clock color="#f59e0b" size={24} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'aprobado': return '#10b981';
      case 'rechazado': return '#ef4444';
      default: return '#f59e0b';
    }
  };

  const renderFormData = () => {
    if (!request.formData) return null;
    try {
      const data = JSON.parse(request.formData);
      return (
        <View style={styles.gridContainer}>
          {Object.entries(data).map(([key, value]) => (
            <View key={key} style={styles.gridItem}>
              <Text style={styles.gridItemLabel}>{key.replace(/([A-Z])/g, ' $1').trim()}</Text>
              <Text style={styles.gridItemValue}>{(value as string) || '-'}</Text>
            </View>
          ))}
        </View>
      );
    } catch (e) {
      return <Text style={styles.rawText}>{request.formData}</Text>;
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
          <Text style={styles.headerTitle} numberOfLines={1}>Detalle de Solicitud</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          <View style={styles.cardHeader}>
            <View style={styles.typeRow}>
              <View style={styles.iconBox}>
                <FileText color="#3b82f6" size={24} />
              </View>
              <Text style={styles.typeText}>{request.type}</Text>
            </View>
            <View style={[styles.statusBox, { backgroundColor: getStatusColor(request.status) + '15', borderColor: getStatusColor(request.status) + '30' }]}>
              {getStatusIcon(request.status)}
              <Text style={[styles.statusText, { color: getStatusColor(request.status) }]}>{request.status}</Text>
            </View>
          </View>

          <Text style={styles.dateText}>
            Enviado el {new Date(request.createdAt).toLocaleDateString()} a las {new Date(request.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Datos de la Solicitud</Text>
            {renderFormData()}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Respuesta de Recursos Humanos</Text>
            <View style={[styles.observationsBox, request.status === 'Pendiente' ? styles.pendingBox : null]}>
              {request.status === 'Pendiente' ? (
                <Text style={styles.pendingText}>Tu solicitud está siendo evaluada. Recibirás una notificación cuando sea revisada.</Text>
              ) : (
                <Text style={styles.observationsText}>{request.observations || 'Sin observaciones adicionales.'}</Text>
              )}
            </View>
          </View>

        </ScrollView>
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
  cardHeader: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 16,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconBox: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    padding: 12,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  typeText: {
    flex: 1,
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
    textTransform: 'capitalize',
  },
  dateText: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.06)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  gridItemLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  gridItemValue: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  rawText: {
    color: '#e2e8f0',
    fontFamily: 'monospace',
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 12,
    borderRadius: 8,
  },
  observationsBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  pendingBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  observationsText: {
    color: '#ffffff',
    fontSize: 15,
    lineHeight: 22,
  },
  pendingText: {
    color: '#fcd34d',
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
});
