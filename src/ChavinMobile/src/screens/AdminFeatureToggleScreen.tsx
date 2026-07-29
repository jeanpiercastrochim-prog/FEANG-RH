import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ActivityIndicator, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Settings2, Save } from 'lucide-react-native';
import axios from 'axios';

const API_URL = Platform.OS === 'web' ? 'https://technical-latina-chastenedly.ngrok-free.dev/api' : 'https://technical-latina-chastenedly.ngrok-free.dev/api';

export default function AdminFeatureToggleScreen({ navigation }: any) {
  const [features, setFeatures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchFeatures();
  }, []);

  const fetchFeatures = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/MobileSettings/features/raw`);
      setFeatures(response.data);
    } catch (error) {
      console.error('Error fetching features:', error);
      if (Platform.OS === 'web') alert('Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (index: number) => {
    const newFeatures = [...features];
    newFeatures[index].activo = !newFeatures[index].activo;
    setFeatures(newFeatures);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const updates = features.map(f => ({
        codigo: f.codigo,
        activo: f.activo
      }));
      await axios.post(`${API_URL}/MobileSettings/features`, updates);
      if (Platform.OS === 'web') alert('Configuraciones actualizadas correctamente');
      else alert('Actualizado', 'Configuraciones guardadas exitosamente');
      navigation.goBack();
    } catch (error) {
      console.error('Error saving features:', error);
      if (Platform.OS === 'web') alert('Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#0f172a', '#020617']} style={StyleSheet.absoluteFill} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={24} color="#94a3b8" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configuración de Módulos</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.iconContainer}>
          <Settings2 size={40} color="#3b82f6" />
        </View>
        <Text style={styles.title}>Permisos de Colaborador</Text>
        <Text style={styles.subtitle}>
          Habilita o deshabilita los módulos que los colaboradores podrán ver en su aplicación móvil.
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.listContainer}>
            {features.map((feature, index) => (
              <View key={feature.codigo} style={styles.featureRow}>
                <View style={styles.featureInfo}>
                  <Text style={styles.featureName}>{feature.nombre}</Text>
                  <Text style={styles.featureDesc}>
                    {feature.activo ? 'Visible para los usuarios' : 'Oculto para los usuarios'}
                  </Text>
                </View>
                <Switch
                  trackColor={{ false: '#334155', true: '#3b82f6' }}
                  thumbColor={feature.activo ? '#ffffff' : '#94a3b8'}
                  onValueChange={() => handleToggle(index)}
                  value={feature.activo}
                />
              </View>
            ))}

            <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
              <LinearGradient colors={['#10b981', '#059669']} style={styles.buttonGradient}>
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Save size={20} color="#fff" />
                    <Text style={styles.buttonText}>Guardar Cambios</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
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
    paddingTop: 20,
  },
  backBtn: { padding: 8 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  content: { padding: 24, paddingBottom: 100 },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    alignSelf: 'center'
  },
  title: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#94a3b8', textAlign: 'center', marginBottom: 32, lineHeight: 22 },
  listContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  featureInfo: { flex: 1, paddingRight: 16 },
  featureName: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 4 },
  featureDesc: { color: '#64748b', fontSize: 12 },
  saveButton: { 
    width: '100%',
    borderRadius: 14, 
    overflow: 'hidden',
    marginTop: 32,
  },
  buttonGradient: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    padding: 16, 
    gap: 10 
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
