import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Box, Map as MapIcon, X } from 'lucide-react-native';
import axios from 'axios';

const API_URL = Platform.OS === 'web' ? 'https://technical-latina-chastenedly.ngrok-free.dev/api' : 'https://technical-latina-chastenedly.ngrok-free.dev/api';

export default function MobileMapaScreen({ navigation }: any) {
  const [selectedRack, setSelectedRack] = useState<string | null>(null);
  const [rackItems, setRackItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // A simple static layout generation for the mobile view
  const rows = [1, 2, 3, 4];
  const columns = ['A', 'B', 'C', 'D'];

  const handleRackPress = async (rackId: string) => {
    setSelectedRack(rackId);
    setLoading(true);
    setModalVisible(true);
    
    try {
      const res = await axios.get(`${API_URL}/almacen/ubicaciones/${rackId}`);
      // Usually returns an array of items in that rack
      setRackItems(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      setRackItems([]);
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#0f172a', '#020617']} style={StyleSheet.absoluteFill} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <MapIcon size={24} color="#8b5cf6" />
          <Text style={styles.headerTitle}>Mapa Almacén</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <Text style={styles.instructions}>Desliza para explorar el almacén. Toca un rack para ver su contenido (Solo lectura).</Text>

      {/* Mapa Desplazable */}
      <ScrollView horizontal contentContainerStyle={{ padding: 20 }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={styles.mapCanvas}>
            {rows.map((row) => (
              <View key={`row-${row}`} style={styles.mapRow}>
                {columns.map((col) => {
                  const rackId = `R${row}-${col}`;
                  return (
                    <TouchableOpacity 
                      key={rackId} 
                      style={styles.rack}
                      onPress={() => handleRackPress(rackId)}
                    >
                      <View style={styles.rackHeader}>
                        <Text style={styles.rackTitle}>{rackId}</Text>
                      </View>
                      <View style={styles.rackLevels}>
                        <View style={styles.level}><Box size={16} color="#475569" /></View>
                        <View style={styles.level}><Box size={16} color="#475569" /></View>
                        <View style={styles.level}><Box size={16} color="#475569" /></View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>
      </ScrollView>

      {/* Modal / Bottom Sheet con contenido del Rack */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Contenido de {selectedRack}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#8b5cf6" />
                <Text style={styles.loadingText}>Cargando inventario...</Text>
              </View>
            ) : rackItems.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Box size={48} color="#cbd5e1" />
                <Text style={styles.emptyText}>Este rack está vacío actualmente.</Text>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 300 }}>
                {rackItems.map((item, index) => (
                  <View key={index} style={styles.itemCard}>
                    <View style={styles.itemIconContainer}>
                      <Package size={20} color="#8b5cf6" />
                    </View>
                    <View style={styles.itemDetails}>
                      <Text style={styles.itemName}>{item.ProductoNombre || item.ProductoCodigo || 'Producto Desconocido'}</Text>
                      <Text style={styles.itemCode}>SKU: {item.ProductoCodigo}</Text>
                    </View>
                    <View style={styles.itemQtyContainer}>
                      <Text style={styles.itemQty}>{item.CantidadDisponible}</Text>
                      <Text style={styles.itemQtyLabel}>uds</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}

            <TouchableOpacity 
              style={styles.primaryBtn} 
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.btnText}>Cerrar Visor</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, justifyContent: 'space-between' },
  backBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  instructions: { color: '#94a3b8', fontSize: 14, textAlign: 'center', paddingHorizontal: 20, marginBottom: 10 },
  
  mapCanvas: { backgroundColor: '#0f172a', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#1e293b' },
  mapRow: { flexDirection: 'row', gap: 20, marginBottom: 20 },
  
  rack: { width: 120, height: 180, backgroundColor: '#1e293b', borderRadius: 12, borderWidth: 2, borderColor: '#334155', overflow: 'hidden' },
  rackHeader: { backgroundColor: '#334155', padding: 8, alignItems: 'center' },
  rackTitle: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  rackLevels: { flex: 1, padding: 10, justifyContent: 'space-between' },
  level: { height: 35, backgroundColor: '#0f172a', borderRadius: 6, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#1e293b' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, minHeight: '40%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#0f172a' },
  
  loadingContainer: { alignItems: 'center', padding: 40 },
  loadingText: { marginTop: 10, color: '#64748b' },
  emptyContainer: { alignItems: 'center', padding: 40, opacity: 0.5 },
  emptyText: { marginTop: 10, color: '#64748b', fontSize: 16 },
  
  itemCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  itemIconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(139, 92, 246, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  itemDetails: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  itemCode: { fontSize: 13, color: '#64748b', marginTop: 2 },
  itemQtyContainer: { alignItems: 'flex-end' },
  itemQty: { fontSize: 18, fontWeight: '900', color: '#8b5cf6' },
  itemQtyLabel: { fontSize: 12, color: '#64748b' },

  primaryBtn: { backgroundColor: '#8b5cf6', padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 20, width: '100%' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
