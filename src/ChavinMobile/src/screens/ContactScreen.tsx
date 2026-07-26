import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { CheckCircle, Mail, Phone } from 'lucide-react-native';

export default function ContactScreen({ route, navigation }: any) {
  const { formData, employee } = route.params || {};
  
  const [email, setEmail] = useState(formData?.email || '');
  const [phone, setPhone] = useState(formData?.phone || '');

  const handleNext = () => {
    if (!email.trim() || !phone.trim()) {
      const msg = 'Por favor complete ambos campos.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Error', msg);
      return;
    }
    
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      const msg = 'Por favor ingrese un correo válido.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Error', msg);
      return;
    }

    if (phone.length !== 9 || !/^[0-9]+$/.test(phone)) {
      const msg = 'El número de teléfono debe tener exactamente 9 dígitos.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Error', msg);
      return;
    }

    const updatedFormData = {
      ...formData,
      email,
      phone
    };
    
    navigation.navigate('Signature', { formData: updatedFormData, employee });
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#0f172a', '#020617']} style={StyleSheet.absoluteFill} />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.step}>PASO 5 DE 6</Text>
        <Text style={styles.title}>Datos de Contacto</Text>
        <Text style={styles.subtitle}>Ingresa tu correo y teléfono para enviarte notificaciones y tu contrato.</Text>
        
        <View style={styles.card}>
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Mail size={16} color="#3b82f6" style={{marginRight: 6}} />
              <Text style={styles.label}>Correo Electrónico</Text>
            </View>
            <TextInput
              value={email}
              onChangeText={setEmail}
              style={[styles.input, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
              placeholder="ejemplo@correo.com"
              placeholderTextColor="#64748b"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Phone size={16} color="#22c55e" style={{marginRight: 6}} />
              <Text style={styles.label}>Número de Teléfono</Text>
            </View>
            <TextInput
              value={phone}
              onChangeText={(val) => setPhone(val.replace(/[^0-9]/g, ''))}
              style={[styles.input, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
              placeholder="Ej. 987654321"
              placeholderTextColor="#64748b"
              keyboardType="phone-pad"
              maxLength={9}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleNext}>
          <LinearGradient
            colors={['#3b82f6', '#2563eb']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientButton}
          >
            <Text style={styles.buttonText}>CONTINUAR A FIRMA</Text>
            <CheckCircle color="#ffffff" size={20} />
          </LinearGradient>
        </TouchableOpacity>
        
        <View style={{height: 40}} />
      </ScrollView>
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
  inputGroup: {
    marginBottom: 16,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f8fafc',
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
});
