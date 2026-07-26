import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Image, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Clock, ArrowLeft } from 'lucide-react-native';
import axios from 'axios';

const API_URL = Platform.OS === 'web' ? 'http://localhost:5050/api' : 'http://127.0.0.1:5050/api';

export default function PendingContractScreen({ route, navigation }: any) {
  const { contractId, employee } = route.params;
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    axios.get(`${API_URL}/Process/${contractId}`)
      .then(res => setData(res.data))
      .catch(err => console.error(err));
  }, [contractId]);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#0f172a', '#020617']} style={StyleSheet.absoluteFill} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
           <ArrowLeft color="#fff" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Estado del Proceso</Text>
        <View style={{ width: 24 }} />
      </View>

      {data ? (
        <ScrollView contentContainerStyle={styles.content}>
           <View style={styles.statusCard}>
             <Clock color="#f59e0b" size={56} />
             <Text style={styles.statusTitle}>Validación Pendiente</Text>
             <Text style={styles.statusDesc}>
               Tus datos y fotos fueron enviados exitosamente. Recursos Humanos está revisando la información para validar tu identidad y generar tu contrato.
             </Text>
           </View>

           <Text style={styles.sectionTitle}>Datos Enviados a RRHH</Text>
           <View style={styles.dataCard}>
             <Text style={[styles.dataLabel, { marginTop: 0 }]}>NOMBRES COMPLETOS</Text>
             <Text style={styles.dataValue}>{data.nombres} {data.apellidoPaterno} {data.apellidoMaterno}</Text>
             
             <View style={styles.row}>
               <View style={styles.col}>
                 <Text style={styles.dataLabel}>DNI</Text>
                 <Text style={styles.dataValue}>{data.numeroDNI}</Text>
               </View>
               <View style={styles.col}>
                 <Text style={styles.dataLabel}>FECHA NACIMIENTO</Text>
                 <Text style={styles.dataValue}>{data.fechaNacimiento}</Text>
               </View>
             </View>

             <View style={styles.row}>
               <View style={styles.col}>
                 <Text style={styles.dataLabel}>SEXO</Text>
                 <Text style={styles.dataValue}>{data.sexo}</Text>
               </View>
               <View style={styles.col}>
                 <Text style={styles.dataLabel}>ESTADO CIVIL</Text>
                 <Text style={styles.dataValue}>{data.estadoCivil}</Text>
               </View>
             </View>

             <Text style={styles.dataLabel}>DIRECCIÓN DECLARADA</Text>
             <Text style={styles.dataValue}>{data.direccion}</Text>

             <Text style={styles.dataLabel}>UBICACIÓN</Text>
             <Text style={styles.dataValue}>{data.distrito}, {data.provincia}, {data.departamento}</Text>

             {data.hasPrimary && (
               <>
                 <Text style={styles.dataLabel}>EDUCACIÓN PRIMARIA</Text>
                 <Text style={styles.dataValue}>{data.primarySchool}</Text>
               </>
             )}

             {data.hasSecondary && (
               <>
                 <Text style={styles.dataLabel}>EDUCACIÓN SECUNDARIA</Text>
                 <Text style={styles.dataValue}>{data.secondarySchool}</Text>
               </>
             )}

             {data.hasHigherEducation && (
               <>
                 <Text style={styles.dataLabel}>EDUCACIÓN SUPERIOR</Text>
                 <Text style={styles.dataValue}>{data.higherEducationInstitution}</Text>
               </>
             )}
             
             <Text style={styles.dataLabel}>FECHA DE ENVÍO</Text>
             <Text style={styles.dataValue}>{new Date(data.createdAt).toLocaleDateString()}</Text>
           </View>

           <Text style={styles.sectionTitle}>Documentos Adjuntos</Text>
           <View style={styles.imagesContainer}>
             {data.frontImagePath && (
               <View style={styles.imageCard}>
                 <Text style={styles.imageTitle}>DNI Frontal</Text>
                 <Image source={{ uri: `${API_URL.replace('/api', '')}${data.frontImagePath}` }} style={styles.dniImage} resizeMode="contain" />
               </View>
             )}
             {data.backImagePath && (
               <View style={styles.imageCard}>
                 <Text style={styles.imageTitle}>DNI Reverso</Text>
                 <Image source={{ uri: `${API_URL.replace('/api', '')}${data.backImagePath}` }} style={styles.dniImage} resizeMode="contain" />
               </View>
             )}
           </View>
        </ScrollView>
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20,
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  content: { padding: 20 },
  statusCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderRadius: 24, padding: 32, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 24,
  },
  statusTitle: { color: '#f59e0b', fontSize: 24, fontWeight: '800', marginTop: 20, marginBottom: 12 },
  statusDesc: { color: '#94a3b8', textAlign: 'center', fontSize: 14, lineHeight: 22 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 12, marginLeft: 4 },
  dataCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 16, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)'
  },
  dataLabel: { color: '#60a5fa', fontSize: 11, fontWeight: '700', marginBottom: 6, marginTop: 16, letterSpacing: 0.5 },
  dataValue: { color: '#f8fafc', fontSize: 15, fontWeight: '500' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  col: { flex: 1, paddingRight: 10 },
  imagesContainer: { gap: 16, marginBottom: 40 },
  imageCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)'
  },
  imageTitle: { color: '#f8fafc', fontSize: 14, fontWeight: '600', marginBottom: 12 },
  dniImage: { width: '100%', height: 200, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.2)' }
});
