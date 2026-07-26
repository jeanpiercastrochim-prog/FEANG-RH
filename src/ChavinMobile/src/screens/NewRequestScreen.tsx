import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, ChevronRight, FileText, Smartphone, Home, BriefcaseMedical, UserPlus, FileHeart, Banknote, Edit3, Building, PiggyBank } from 'lucide-react-native';

const REQUEST_TYPES = [
  { name: 'Cambio de Cuenta Bancaria', icon: Building },
  { name: 'Cambio de AFP', icon: PiggyBank },
  { name: 'Actualización de Número Celular', icon: Smartphone },
  { name: 'Actualización de Dirección', icon: Home },
  { name: 'Solicitud de Constancia de Trabajo', icon: FileText },
  { name: 'Solicitud de Descanso Médico', icon: BriefcaseMedical },
  { name: 'Solicitud de Permiso (Personal/Familiar)', icon: UserPlus },
  { name: 'Solicitud de Permiso por Luto', icon: FileHeart },
  { name: 'Solicitud de Adelanto de Sueldo', icon: Banknote },
  { name: 'Corrección de Datos Personales', icon: Edit3 }
];

export default function NewRequestScreen({ route, navigation }: any) {
  const employee = route?.params?.employee;

  const handleSelectType = (type: string) => {
    navigation.navigate('RequestForm', { selectedType: type, employee });
  };

  return (
    <LinearGradient colors={['#051c4a', '#020b1f']} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ChevronLeft color="#ffffff" size={28} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Seleccionar Trámite</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.instructionText}>
            Elige el tipo de solicitud que deseas enviar a Recursos Humanos.
          </Text>

          <View style={styles.optionsList}>
            {REQUEST_TYPES.map((item, idx) => {
              const IconComponent = item.icon;
              return (
                <TouchableOpacity
                  key={idx}
                  style={styles.optionCard}
                  onPress={() => handleSelectType(item.name)}
                  activeOpacity={0.7}
                >
                  <View style={styles.optionIconContainer}>
                    <IconComponent color="#60a5fa" size={22} />
                  </View>
                  <Text style={styles.optionText}>{item.name}</Text>
                  <ChevronRight color="#475569" size={20} />
                </TouchableOpacity>
              );
            })}
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
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  instructionText: {
    fontSize: 15,
    color: '#94a3b8',
    marginBottom: 24,
    lineHeight: 22,
  },
  optionsList: {
    flexDirection: 'column',
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  optionIconContainer: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    padding: 10,
    borderRadius: 12,
    marginRight: 16,
  },
  optionText: {
    flex: 1,
    color: '#e2e8f0',
    fontSize: 15,
    fontWeight: '600',
  },
});
