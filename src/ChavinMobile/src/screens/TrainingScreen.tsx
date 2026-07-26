import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, PlaySquare, FileText, CheckCircle2, ChevronRight, GraduationCap } from 'lucide-react-native';

const trainingModules = [
  {
    id: 1,
    title: 'Inducción de Seguridad SSOMA',
    description: 'Video obligatorio para todo el personal nuevo antes de ingresar a planta.',
    type: 'video',
    duration: '15 min',
    completed: true,
  },
  {
    id: 2,
    title: 'Manual de Uso de EPP',
    description: 'Guía completa sobre el correcto uso de Equipos de Protección Personal.',
    type: 'pdf',
    duration: '12 págs',
    completed: false,
  },
  {
    id: 3,
    title: 'Prevención de Riesgos 2026',
    description: 'Actualización anual de la normativa de prevención de riesgos laborales.',
    type: 'video',
    duration: '22 min',
    completed: false,
  },
  {
    id: 4,
    title: 'Manejo de Extintores',
    description: 'Instrucciones teóricas sobre los tipos de fuego y uso de extintores portátiles.',
    type: 'pdf',
    duration: '5 págs',
    completed: false,
  }
];

export default function TrainingScreen({ navigation, route }: any) {
  const handlePressModule = (module: any) => {
    // Para propósitos de demostración
    alert(`Abriendo: ${module.title}\n\nEn la versión final esto abrirá el reproductor de video o el visor de PDF correspondiente.`);
  };

  return (
    <LinearGradient colors={['#051c4a', '#020b1f']} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft color="#ffffff" size={20} />
          </TouchableOpacity>
          <View style={styles.headerTitleBox}>
            <Text style={styles.title}>Capacitaciones</Text>
            <Text style={styles.subtitle}>Cursos y manuales asignados</Text>
          </View>
          <View style={styles.headerIconBox}>
            <GraduationCap color="#14b8a6" size={24} />
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* BANNER */}
          <View style={styles.banner}>
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerTitle}>Tu progreso</Text>
              <Text style={styles.bannerDesc}>Has completado 1 de 4 módulos obligatorios este año.</Text>
            </View>
            <View style={styles.progressCircle}>
              <Text style={styles.progressText}>25%</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Módulos Pendientes</Text>
          
          {trainingModules.filter(m => !m.completed).map((module) => (
            <TouchableOpacity key={module.id} style={styles.card} onPress={() => handlePressModule(module)}>
              <View style={[styles.iconContainer, { backgroundColor: module.type === 'video' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(244, 63, 94, 0.15)' }]}>
                {module.type === 'video' ? (
                  <PlaySquare color="#3b82f6" size={24} />
                ) : (
                  <FileText color="#f43f5e" size={24} />
                )}
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{module.title}</Text>
                <Text style={styles.cardDesc} numberOfLines={2}>{module.description}</Text>
                <View style={styles.cardFooter}>
                  <Text style={styles.cardMeta}>{module.type === 'video' ? '🎥 Video' : '📄 PDF'} • {module.duration}</Text>
                </View>
              </View>
              <ChevronRight color="#475569" size={20} />
            </TouchableOpacity>
          ))}

          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Completados</Text>
          
          {trainingModules.filter(m => m.completed).map((module) => (
            <TouchableOpacity key={module.id} style={[styles.card, { opacity: 0.7 }]} onPress={() => handlePressModule(module)}>
              <View style={[styles.iconContainer, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                <CheckCircle2 color="#10b981" size={24} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{module.title}</Text>
                <Text style={styles.cardDesc} numberOfLines={1}>{module.description}</Text>
                <View style={styles.cardFooter}>
                  <Text style={[styles.cardMeta, { color: '#10b981' }]}>Completado</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}

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
    paddingHorizontal: 20, 
    paddingTop: 16, 
    paddingBottom: 24 
  },
  backBtn: { 
    width: 40, height: 40, 
    borderRadius: 20, 
    backgroundColor: 'rgba(255, 255, 255, 0.05)', 
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', 
    justifyContent: 'center', alignItems: 'center', 
    marginRight: 16 
  },
  headerTitleBox: { flex: 1 },
  title: { fontSize: 20, fontWeight: '800', color: '#ffffff', marginBottom: 2 },
  subtitle: { fontSize: 13, color: '#94a3b8' },
  headerIconBox: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: 'rgba(20, 184, 166, 0.15)',
    justifyContent: 'center', alignItems: 'center'
  },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  banner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(30, 58, 138, 0.4)',
    borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.2)',
    marginBottom: 24
  },
  bannerTitle: { color: '#ffffff', fontSize: 16, fontWeight: '700', marginBottom: 4 },
  bannerDesc: { color: '#cbd5e1', fontSize: 13, lineHeight: 18 },
  progressCircle: {
    width: 56, height: 56, borderRadius: 28,
    borderWidth: 4, borderColor: '#3b82f6',
    justifyContent: 'center', alignItems: 'center',
    marginLeft: 16
  },
  progressText: { color: '#ffffff', fontWeight: '800', fontSize: 14 },
  sectionTitle: { color: '#ffffff', fontSize: 16, fontWeight: '700', marginBottom: 16 },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 12
  },
  iconContainer: {
    width: 50, height: 50, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 16
  },
  cardContent: { flex: 1, marginRight: 12 },
  cardTitle: { color: '#ffffff', fontSize: 15, fontWeight: '700', marginBottom: 4 },
  cardDesc: { color: '#94a3b8', fontSize: 12, lineHeight: 16, marginBottom: 8 },
  cardFooter: { flexDirection: 'row', alignItems: 'center' },
  cardMeta: { color: '#64748b', fontSize: 11, fontWeight: '600', textTransform: 'uppercase' }
});
