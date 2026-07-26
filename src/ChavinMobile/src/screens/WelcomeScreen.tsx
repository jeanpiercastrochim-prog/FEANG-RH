import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FileText, Camera, ArrowRight } from 'lucide-react-native';

export default function WelcomeScreen({ navigation, route }: any) {
  const employee = route.params?.employee;
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.step}>PASO 1 DE 3</Text>
        <Text style={styles.title}>Bienvenido a{'\n'}Chavín</Text>
        <Text style={styles.subtitle}>
          Para completar tu proceso de contratación, necesitamos extraer tus datos del DNI.
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.listItem}>
          <View style={styles.iconContainer}>
            <FileText color="#10b981" size={24} />
          </View>
          <View style={styles.listTextContainer}>
            <Text style={styles.listTitle}>Ten tu DNI a la mano</Text>
            <Text style={styles.listDesc}>Necesitarás el documento original físico.</Text>
          </View>
        </View>

        <View style={styles.listItem}>
          <View style={styles.iconContainer}>
            <Camera color="#10b981" size={24} />
          </View>
          <View style={styles.listTextContainer}>
            <Text style={styles.listTitle}>Buena iluminación</Text>
            <Text style={styles.listDesc}>Busca un lugar iluminado para que la cámara pueda leer los datos claramente.</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.navigate('Scanner', { employee })}
        >
          <Text style={styles.buttonText}>COMENZAR ESCANEO</Text>
          <ArrowRight color="#ffffff" size={20} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 24,
  },
  header: {
    marginTop: 40,
    marginBottom: 40,
  },
  step: {
    color: '#10b981',
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
  },
  title: {
    fontSize: 40,
    fontWeight: '800',
    color: '#064e3b',
    lineHeight: 48,
  },
  subtitle: {
    fontSize: 16,
    color: '#047857',
    marginTop: 16,
    lineHeight: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 15 },
      android: { elevation: 5 },
      web: { boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.05)' as any }
    }),
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  listTextContainer: {
    flex: 1,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#064e3b',
    marginBottom: 4,
  },
  listDesc: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  footer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 40,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    borderRadius: 16,
    height: 60,
    ...Platform.select({
      ios: { shadowColor: '#10b981', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 8 },
      android: { elevation: 4 },
      web: { boxShadow: '0px 6px 16px rgba(16, 185, 129, 0.3)' as any }
    }),
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
    letterSpacing: 1,
  },
});
