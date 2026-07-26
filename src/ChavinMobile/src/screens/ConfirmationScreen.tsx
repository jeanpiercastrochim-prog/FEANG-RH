import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert, StyleSheet, Platform, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { CheckCircle, Info } from 'lucide-react-native';

const API_URL = Platform.OS === 'web' ? 'http://localhost:5050/api' : 'http://127.0.0.1:5050/api';

export default function ConfirmationScreen({ route, navigation }: any) {
  const { extractedData, employee } = route.params || {};
  const [formData, setFormData] = useState(extractedData || {});

  const handleSubmit = () => {
    // Navigate to the new Education Screen
    navigation.navigate('Education', { formData, employee });
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#0f172a', '#020617']} style={StyleSheet.absoluteFill} />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.step}>PASO 3 DE 3</Text>
        <Text style={styles.title}>Revisa tus Datos</Text>
        <Text style={styles.subtitle}>Verifica que la información extraída de tu DNI sea correcta antes de enviarla.</Text>
        
        <View style={styles.card}>
          {Object.keys(formData)
            .filter(key => !['UBIGEO', 'FRONTIMAGEPATH', 'BACKIMAGEPATH'].includes(key.toUpperCase()))
            .map((key) => (
            <View key={key} style={styles.inputGroup}>
              <Text style={styles.label}>{key}</Text>
              <TextInput
                value={formData[key]}
                onChangeText={(val) => {
                  let parsedVal = val;
                  if (key === 'numeroDNI' || key === 'DNI') {
                    parsedVal = val.replace(/[^0-9]/g, '');
                  } else if (['nombres', 'apellidoPaterno', 'apellidoMaterno'].includes(key)) {
                    parsedVal = val.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
                  }
                  setFormData({ ...formData, [key]: parsedVal });
                }}
                style={[styles.input, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
                placeholderTextColor="#64748b"
                keyboardType={(key === 'numeroDNI' || key === 'DNI') ? 'numeric' : 'default'}
                maxLength={(key === 'numeroDNI' || key === 'DNI') ? 8 : undefined}
              />
            </View>
          ))}
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <LinearGradient
            colors={['#3b82f6', '#2563eb']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientButton}
          >
            <Text style={styles.buttonText}>CONTINUAR A EDUCACIÓN</Text>
            <CheckCircle color="#ffffff" size={20} />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  step: {
    color: '#3b82f6',
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
    fontSize: 13,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#f8fafc',
  },
  subtitle: {
    fontSize: 15,
    color: '#94a3b8',
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 22,
  },
  card: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#60a5fa',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 14,
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    padding: 24,
    paddingTop: 10,
  },
  button: {
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 8 },
      android: { elevation: 4 },
      web: { boxShadow: '0px 6px 16px rgba(59, 130, 246, 0.3)' as any }
    }),
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    marginRight: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#0f172a',
    borderRadius: 24,
    padding: 32,
    width: '85%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 12,
  },
  modalText: {
    color: '#94a3b8',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  modalButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
});
