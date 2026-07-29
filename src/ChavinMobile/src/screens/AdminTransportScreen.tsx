import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Truck, ArrowLeft, UserPlus } from 'lucide-react-native';

export default function AdminTransportScreen({ navigation, route }: any) {
  const { employee } = route.params || {};

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#0f172a', '#020617']} style={StyleSheet.absoluteFill} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={24} color="#94a3b8" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dashboard Transporte</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Truck size={48} color="#10b981" />
        </View>
        <Text style={styles.title}>Módulo de Transporte</Text>
        <Text style={styles.subtitle}>
          Esta sección está reservada para el monitoreo de flota, rutas y alertas en tiempo real.
        </Text>

        <TouchableOpacity style={styles.actionButton}>
          <LinearGradient colors={['#10b981', '#059669']} style={styles.buttonGradient}>
            <UserPlus size={24} color="#fff" />
            <Text style={styles.buttonText}>Crear Cuenta de Transportista</Text>
          </LinearGradient>
        </TouchableOpacity>
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
    paddingTop: 20,
  },
  backBtn: { padding: 8 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  content: { padding: 24, alignItems: 'center', justifyContent: 'center', flex: 1, paddingBottom: 100 },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 12, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#94a3b8', textAlign: 'center', marginBottom: 40, lineHeight: 24 },
  actionButton: { 
    width: '100%',
    borderRadius: 16, 
    overflow: 'hidden',
  },
  buttonGradient: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    padding: 18, 
    gap: 12 
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
