import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { LogOut, PackagePlus, PackageMinus, Map, ArrowRightLeft, ClipboardCheck, CloudOff, RefreshCw } from 'lucide-react-native';
import { getOfflineQueue, syncOfflineQueue } from '../services/OfflineSyncService';

const { width } = Dimensions.get('window');

export default function AlmacenScreen({ route, navigation }: any) {
  const { employee } = route.params || {};
  const [offlineCount, setOfflineCount] = React.useState(0);
  const [syncing, setSyncing] = React.useState(false);

  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      checkQueue();
    });
    return unsubscribe;
  }, [navigation]);

  const checkQueue = async () => {
    const q = await getOfflineQueue();
    setOfflineCount(q.length);
  };

  const handleSync = async () => {
    setSyncing(true);
    const res = await syncOfflineQueue('https://technical-latina-chastenedly.ngrok-free.dev/api');
    if (res.total > 0) {
      alert(`Sincronización completada. ${res.synced} exitosos, ${res.errors} errores.`);
    }
    await checkQueue();
    setSyncing(false);
  };

  const handleLogout = () => {
    navigation.replace('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#0f172a', '#020617']} style={StyleSheet.absoluteFill} />
      
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hola, Almacenero</Text>
          <Text style={styles.name}>{employee?.nombres || 'Colaborador'}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <LogOut size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>

      {offlineCount > 0 && (
        <TouchableOpacity style={styles.syncBanner} onPress={handleSync} disabled={syncing}>
          {syncing ? <RefreshCw size={24} color="#fff" /> : <CloudOff size={24} color="#fff" />}
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Modo Offline ({offlineCount} pdtes)</Text>
            <Text style={{ color: '#cbd5e1', fontSize: 12 }}>Toca para sincronizar</Text>
          </View>
        </TouchableOpacity>
      )}

      <View style={styles.content}>
        <Text style={styles.title}>Panel de Almacén</Text>
        <Text style={styles.subtitle}>Seleccione una opción para continuar</Text>

        <View style={styles.grid}>
          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: '#3b82f6' }]}
            onPress={() => navigation.navigate('MobileRecepcion')}
          >
            <PackagePlus size={32} color="#fff" style={styles.cardIcon} />
            <Text style={styles.cardTitle}>Recepcionar</Text>
            <Text style={styles.cardDesc}>Ingreso de mercadería al almacén</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: '#10b981' }]}
            onPress={() => navigation.navigate('MobileDespacho')}
          >
            <PackageMinus size={32} color="#fff" style={styles.cardIcon} />
            <Text style={styles.cardTitle}>Despachar</Text>
            <Text style={styles.cardDesc}>Salida de mercadería con QR</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: '#f59e0b' }]}
            onPress={() => navigation.navigate('MobileTraslado')}
          >
            <ArrowRightLeft size={32} color="#fff" style={styles.cardIcon} />
            <Text style={styles.cardTitle}>Reubicar</Text>
            <Text style={styles.cardDesc}>Mover de un Rack a otro</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: '#ec4899' }]}
            onPress={() => navigation.navigate('MobileAuditoria')}
          >
            <ClipboardCheck size={32} color="#fff" style={styles.cardIcon} />
            <Text style={styles.cardTitle}>Auditoría</Text>
            <Text style={styles.cardDesc}>Inventario ciego de racks</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: '#8b5cf6' }]}
            onPress={() => navigation.navigate('MobileMapa')}
          >
            <Map size={32} color="#fff" style={styles.cardIcon} />
            <Text style={styles.cardTitle}>Mapa del Almacén</Text>
            <Text style={styles.cardDesc}>Ver disposición y stock en vivo</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 24,
    paddingTop: 40,
  },
  greeting: { color: '#94a3b8', fontSize: 14 },
  name: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  logoutBtn: { 
    backgroundColor: 'rgba(239, 68, 68, 0.1)', 
    padding: 10, 
    borderRadius: 12 
  },
  content: { padding: 24 },
  title: { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#94a3b8', marginBottom: 32 },
  buttonContainer: { gap: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between' },
  actionCard: { width: '47%', padding: 20, borderRadius: 24, minHeight: 160, justifyContent: 'space-between', elevation: 5, shadowColor: '#000', shadowOffset: {width:0,height:4}, shadowOpacity: 0.3, shadowRadius: 4 },
  cardIcon: { marginBottom: 10 },
  cardTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  cardDesc: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  syncBanner: { flexDirection: 'row', backgroundColor: '#ef4444', marginHorizontal: 20, marginTop: 20, padding: 15, borderRadius: 12, alignItems: 'center' },
  actionButton: { 
    borderRadius: 20, 
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1e293b'
  },
  buttonGradient: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 16, 
    padding: 20 
  },
  buttonText: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: '600' 
  }
});
