import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert, StyleSheet, Platform, Modal, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { CheckCircle, Info, GraduationCap } from 'lucide-react-native';

const API_URL = Platform.OS === 'web' ? 'http://localhost:5050/api' : 'http://127.0.0.1:5050/api';

export default function EducationScreen({ route, navigation }: any) {
  const { formData, employee } = route.params || {};
  
  const [hasPrimary, setHasPrimary] = useState(false);
  const [primarySchool, setPrimarySchool] = useState('');
  
  const [hasSecondary, setHasSecondary] = useState(false);
  const [secondarySchool, setSecondarySchool] = useState('');
  
  const [hasHigherEducation, setHasHigherEducation] = useState(false);
  const [higherEducationInstitution, setHigherEducationInstitution] = useState('');
  
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    navigation.navigate('Contact', {
      formData: {
        ...formData,
        NumeroDNI: employee?.dni || formData?.NumeroDNI || formData?.numeroDNI,
        hasPrimary,
        primarySchool: hasPrimary ? primarySchool : '',
        hasSecondary,
        secondarySchool: hasSecondary ? secondarySchool : '',
        hasHigherEducation,
        higherEducationInstitution: hasHigherEducation ? higherEducationInstitution : ''
      },
      employee
    });
  };

  const finishProcess = () => {
    setShowSuccess(false);
    if (employee) {
      navigation.navigate('Home', { employee });
    } else {
      navigation.navigate('Login');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#0f172a', '#020617']} style={StyleSheet.absoluteFill} />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.step}>PASO 4 DE 4</Text>
        <Text style={styles.title}>Validación Académica</Text>
        <Text style={styles.subtitle}>Por favor, indícanos tu nivel educativo actual.</Text>
        
        <View style={styles.card}>
          
          {/* EDUCACION PRIMARIA */}
          <View style={styles.sectionContainer}>
            <View style={styles.switchRow}>
              <View style={styles.switchLabelContainer}>
                <GraduationCap size={20} color="#3b82f6" style={{marginRight: 8}} />
                <Text style={styles.switchLabel}>Educación Primaria</Text>
              </View>
              <Switch
                value={hasPrimary}
                onValueChange={setHasPrimary}
                trackColor={{ false: '#334155', true: '#3b82f6' }}
                thumbColor="#ffffff"
              />
            </View>
            {hasPrimary && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nombre del Colegio (Primaria)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej. I.E. San Juan"
                  placeholderTextColor="#64748b"
                  value={primarySchool}
                  onChangeText={setPrimarySchool}
                />
              </View>
            )}
          </View>
          
          <View style={styles.divider} />
          
          {/* EDUCACION SECUNDARIA */}
          <View style={styles.sectionContainer}>
            <View style={styles.switchRow}>
              <View style={styles.switchLabelContainer}>
                <GraduationCap size={20} color="#8b5cf6" style={{marginRight: 8}} />
                <Text style={styles.switchLabel}>Educación Secundaria</Text>
              </View>
              <Switch
                value={hasSecondary}
                onValueChange={setHasSecondary}
                trackColor={{ false: '#334155', true: '#8b5cf6' }}
                thumbColor="#ffffff"
              />
            </View>
            {hasSecondary && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nombre del Colegio (Secundaria)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej. Colegio Nacional"
                  placeholderTextColor="#64748b"
                  value={secondarySchool}
                  onChangeText={setSecondarySchool}
                />
              </View>
            )}
          </View>
          
          <View style={styles.divider} />
          
          {/* EDUCACION SUPERIOR */}
          <View style={styles.sectionContainer}>
            <View style={styles.switchRow}>
              <View style={styles.switchLabelContainer}>
                <GraduationCap size={20} color="#f59e0b" style={{marginRight: 8}} />
                <Text style={styles.switchLabel}>Educación Superior</Text>
              </View>
              <Switch
                value={hasHigherEducation}
                onValueChange={setHasHigherEducation}
                trackColor={{ false: '#334155', true: '#f59e0b' }}
                thumbColor="#ffffff"
              />
            </View>
            {hasHigherEducation && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Universidad o Instituto</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej. Universidad Nacional"
                  placeholderTextColor="#64748b"
                  value={higherEducationInstitution}
                  onChangeText={setHigherEducationInstitution}
                />
              </View>
            )}
          </View>

        </View>

        <TouchableOpacity 
          style={styles.button} 
          onPress={handleSubmit}
        >
          <Text style={styles.buttonText}>CONTINUAR A CONTACTO</Text>
          <CheckCircle size={20} color="#fff" />
        </TouchableOpacity>
        
        <View style={{height: 40}} />
      </ScrollView>

      {/* SUCCESS MODAL */}
      <Modal visible={showSuccess} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <LinearGradient colors={['#1e293b', '#0f172a']} style={styles.modalContent}>
            <View style={styles.iconContainer}>
              <CheckCircle size={40} color="#22c55e" />
            </View>
            <Text style={styles.modalTitle}>¡Proceso Completado!</Text>
            <Text style={styles.modalText}>
              Sus datos y documentos han sido enviados exitosamente a Recursos Humanos.
            </Text>
            <View style={styles.infoBox}>
              <Info size={20} color="#60a5fa" />
              <Text style={styles.infoText}>
                Acérquese al personal de RR.HH. para la verificación e impresión de su contrato oficial.
              </Text>
            </View>
            <TouchableOpacity style={styles.modalButton} onPress={finishProcess}>
              <Text style={styles.modalButtonText}>Entendido</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  step: {
    color: '#3b82f6',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#94a3b8',
    marginBottom: 24,
    lineHeight: 22,
  },
  card: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sectionContainer: {
    marginVertical: 8,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  switchLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchLabel: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 16,
  },
  inputGroup: {
    marginTop: 8,
  },
  label: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 16,
    gap: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  modalText: {
    fontSize: 15,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    padding: 16,
    borderRadius: 16,
    gap: 12,
    marginBottom: 32,
  },
  infoText: {
    flex: 1,
    color: '#bfdbfe',
    fontSize: 14,
    lineHeight: 20,
  },
  modalButton: {
    backgroundColor: '#3b82f6',
    width: '100%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  }
});
