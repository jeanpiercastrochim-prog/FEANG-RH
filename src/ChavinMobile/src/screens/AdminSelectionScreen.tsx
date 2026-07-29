import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Briefcase, Truck, Package, LogOut } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function AdminSelectionScreen({ navigation, route }: any) {
  const { employee } = route.params || {};

  const handleLogout = () => {
    navigation.replace('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#0f172a', '#020617']} style={StyleSheet.absoluteFill} />
      
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Bienvenido, Administrador</Text>
          <Text style={styles.name}>{employee?.nombres || 'Jean Pierre Castro'}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <LogOut size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Seleccione el Dashboard</Text>
        <Text style={styles.subtitle}>¿A qué módulo deseas ingresar?</Text>

        <View style={styles.cardsContainer}>
          
          <TouchableOpacity 
            style={styles.card}
            onPress={() => navigation.navigate('AdminRH', { employee })}
          >
            <LinearGradient colors={['rgba(59, 130, 246, 0.1)', 'rgba(30, 58, 138, 0.2)']} style={styles.cardGradient}>
              <View style={[styles.iconWrapper, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}>
                <Briefcase size={32} color="#3b82f6" />
              </View>
              <Text style={styles.cardTitle}>Recursos Humanos</Text>
              <Text style={styles.cardSubtitle}>Gestión de personal y contratos.</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.card}
            onPress={() => navigation.navigate('AdminTransporte', { employee })}
          >
            <LinearGradient colors={['rgba(16, 185, 129, 0.1)', 'rgba(6, 95, 70, 0.2)']} style={styles.cardGradient}>
              <View style={[styles.iconWrapper, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                <Truck size={32} color="#10b981" />
              </View>
              <Text style={styles.cardTitle}>Transporte</Text>
              <Text style={styles.cardSubtitle}>Monitoreo de flota y rutas.</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.card}
            onPress={() => navigation.navigate('AdminAlmacen', { employee })}
          >
            <LinearGradient colors={['rgba(139, 92, 246, 0.1)', 'rgba(91, 33, 182, 0.2)']} style={styles.cardGradient}>
              <View style={[styles.iconWrapper, { backgroundColor: 'rgba(139, 92, 246, 0.2)' }]}>
                <Package size={32} color="#8b5cf6" />
              </View>
              <Text style={styles.cardTitle}>Almacén</Text>
              <Text style={styles.cardSubtitle}>Inventario, ingresos y despachos.</Text>
            </LinearGradient>
          </TouchableOpacity>

        </View>
      </ScrollView>
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
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)'
  },
  scrollContent: { padding: 24 },
  title: { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#94a3b8', marginBottom: 32 },
  cardsContainer: { gap: 20 },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardGradient: {
    padding: 24,
    alignItems: 'center',
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
});
