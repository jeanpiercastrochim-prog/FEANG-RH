import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated, Modal, Platform, Switch, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Truck, MapPin, Battery, Settings, LogOut, Navigation, Clock, CheckCircle, Camera, AlertTriangle, Info, FileText, Package, Users } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';

export default function DriverScreen({ navigation, route }: any) {
  const { employee } = route.params || {};
  const [localEmployee, setLocalEmployee] = useState(employee || {});
  const unidadPlaca = localEmployee?.dni === '44444444' ? 'CHV-022' : localEmployee?.dni === '55555555' ? 'CHV-089' : 'CHV-014';
  const [tripState, setTripState] = useState<'idle' | 'active' | 'paused' | 'completed'>('idle');
  const [locationSub, setLocationSub] = useState<Location.LocationSubscription | null>(null);
  
  const [showChecklist, setShowChecklist] = useState(false);
  const [checklist, setChecklist] = useState({ tires: false, brakes: false, lights: false, fuel: false });
  const [offlineQueue, setOfflineQueue] = useState<any[]>([]);

  const [showDevMenu, setShowDevMenu] = useState(false);
  const devSpeed = useRef<number | null>(null);
  const devStop = useRef<boolean>(false);
  const devLat = useRef<number | null>(null);
  const devLng = useRef<number | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const [assignment, setAssignment] = useState<any>(null);
  const [customAlert, setCustomAlert] = useState({ visible: false, title: '', message: '', type: 'info' as 'info' | 'warning' | 'error' | 'success', onConfirm: () => {} });
  
  const [showSettings, setShowSettings] = useState(false);
  const [editName, setEditName] = useState(localEmployee?.nombres || '');
  const [editDNI, setEditDNI] = useState(localEmployee?.dni || '');
  const [showSOSModal, setShowSOSModal] = useState(false);
  const [sosActive, setSosActive] = useState(false);
  const sosFlashAnim = useRef(new Animated.Value(0)).current;
  const [checklistPhotos, setChecklistPhotos] = useState<{[key: string]: string}>({
    tires: '', brakes: '', lights: '', fuel: ''
  });
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [showCargoModal, setShowCargoModal] = useState(false);

  const showAlert = (title: string, message: string, type: 'info' | 'warning' | 'error' | 'success' = 'info', onConfirm: () => void = () => {}) => {
     setCustomAlert({ visible: true, title, message, type, onConfirm });
  };

  useEffect(() => {
    const fetchAssignment = () => {
      const url = Platform.OS === 'web' ? `https://technical-latina-chastenedly.ngrok-free.dev/api/tracking/assignment/${unidadPlaca}` : `https://technical-latina-chastenedly.ngrok-free.dev/api/tracking/assignment/${unidadPlaca}`;
      fetch(url)
        .then(res => res.ok ? res.json() : null)
        .then(data => setAssignment(data))
        .catch(() => setAssignment(null));
    };
    fetchAssignment();
    const interval = setInterval(fetchAssignment, 5000); // Polling every 5 seconds
    return () => clearInterval(interval);
  }, [unidadPlaca]);

  useEffect(() => {
    if (tripState === 'active') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true })
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [tripState]);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('employee');
    navigation.replace('Login');
  };

  const startTracking = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      alert('Se necesita permiso de ubicación para iniciar el viaje');
      return;
    }

    // Obtenemos la posición inicial
    let initialLoc;
    try {
      initialLoc = await Location.getCurrentPositionAsync({});
    } catch (e) {
      initialLoc = { coords: { latitude: -8.11599, longitude: -79.02598, speed: 60 } }; // Fallback (Trujillo)
    }

    let currentLat = initialLoc.coords.latitude;
    let currentLng = initialLoc.coords.longitude;
    devLat.current = currentLat;
    devLng.current = currentLng;

    // Para la demo web donde el GPS no se mueve, usamos setInterval para forzar el envío cada 3 segundos
    const timer = setInterval(() => {
      // Simulamos un pequeño movimiento
      if (!devStop.current) {
        if (devLat.current !== null) devLat.current += 0.0001; 
        if (devLng.current !== null) devLng.current += 0.0001;
      }
      
      let fakeSpeed = devStop.current ? 0 : (devSpeed.current !== null ? devSpeed.current : (Math.random() > 0.8 ? 85 : 60));
      
      const payload = {
        unidadPlaca: unidadPlaca,
        latitud: devLat.current,
        longitud: devLng.current,
        velocidad: fakeSpeed,
        bateria: 95
      };

      const trackingUrl = Platform.OS === 'web' ? 'https://technical-latina-chastenedly.ngrok-free.dev/api/tracking/location' : 'https://technical-latina-chastenedly.ngrok-free.dev/api/tracking/location';
      fetch(trackingUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      .then(res => {
        if (res.ok) {
          setOfflineQueue(prev => {
            if (prev.length > 0) {
              const batchUrl = Platform.OS === 'web' ? 'https://technical-latina-chastenedly.ngrok-free.dev/api/tracking/location/batch' : 'https://technical-latina-chastenedly.ngrok-free.dev/api/tracking/location/batch';
              fetch(batchUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(prev) })
                .catch(err => console.log('Error batch offline', err));
              return [];
            }
            return prev;
          });
        }
      })
      .catch(err => {
        console.log('Modo offline: guardando coordenada', payload);
        setOfflineQueue(prev => [...prev, payload]);
      });
    }, 3000);

    setLocationSub({ remove: () => clearInterval(timer) });
  };

  const stopTracking = () => {
    if (locationSub) {
      locationSub.remove();
      setLocationSub(null);
    }
  };

  const handleRestartTrip = () => {
    stopTracking();
    setTripState('idle');
    setShowChecklist(false);
    setChecklist({ tires: false, brakes: false, lights: false, fuel: false });
    setChecklistPhotos({ tires: '', brakes: '', lights: '', fuel: '' });
    
    // Limpiar coordenadas simuladas para que retome el punto de inicio
    devLat.current = null;
    devLng.current = null;
    
    showAlert('Viaje Reiniciado', 'El vehículo ha regresado a su punto de partida.', 'success');
  };

  const handleTripAction = () => {
    if (tripState === 'idle') {
      if (!assignment) {
         showAlert('Sin viaje asignado', 'Aún no te han asignado un viaje. Espera instrucciones de la central.', 'warning');
         return;
      }
      setShowChecklist(true);
    }
    else if (tripState === 'active') {
      setTripState('completed');
      stopTracking();
    }
    else if (tripState === 'completed') setTripState('idle');
  };

  const confirmStartTrip = () => {
    if (!checklist.tires || !checklist.brakes || !checklist.lights || !checklist.fuel) {
       showAlert('Checklist Incompleto', 'Debe completar todas las revisiones para iniciar el viaje.', 'warning');
       return;
    }
    setShowChecklist(false);
    setTripState('active');
    startTracking();
  };

  const sendSOS = async (withPhoto: boolean) => {
    setShowSOSModal(false);
    let fotoBase64 = '';

    if (withPhoto) {
       try {
          const permission = await ImagePicker.requestCameraPermissionsAsync();
          if (permission.granted) {
             const result = await ImagePicker.launchCameraAsync({ 
                base64: true, 
                quality: 0.6,
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
             });
             if (!result.canceled && result.assets && result.assets[0].base64) {
                fotoBase64 = 'data:image/jpeg;base64,' + result.assets[0].base64;
             }
          } else {
             showAlert('Permiso denegado', 'No se pudo acceder a la cámara.', 'warning');
          }
       } catch (e) {
          console.log('Camera error', e);
       }
    }

    const apiBase = Platform.OS === 'web' ? 'https://technical-latina-chastenedly.ngrok-free.dev' : 'https://technical-latina-chastenedly.ngrok-free.dev';
    try {
       const response = await fetch(`${apiBase}/api/tracking/sos`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ 
            unidadPlaca, 
            latitud: devLat.current || -9.189967, 
            longitud: devLng.current || -75.015152,
            fotoBase64: fotoBase64 
         })
       });
       if (response.ok) {
          setSosActive(true);
          // Animación de parpadeo rojo
          Animated.loop(
            Animated.sequence([
              Animated.timing(sosFlashAnim, { toValue: 1, duration: 500, useNativeDriver: false }),
              Animated.timing(sosFlashAnim, { toValue: 0.6, duration: 500, useNativeDriver: false }),
            ])
          ).start();
       } else {
          showAlert('Error', 'No se pudo enviar la alerta. Intente de nuevo.', 'error');
       }
    } catch (e) {
       showAlert('Sin Conexión', 'No hay conexión con la central. Inténtalo de nuevo.', 'error');
    }
  };

  const handleSOS = () => setShowSOSModal(true);

  const handleCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      showAlert('Error', 'Permiso de cámara requerido para registrar la incidencia.', 'error');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      base64: true,
      quality: 0.5,
    });

    if (!result.canceled && result.assets && result.assets[0].base64) {
      const url = Platform.OS === 'web' ? 'https://technical-latina-chastenedly.ngrok-free.dev/api/tracking/incident' : 'https://technical-latina-chastenedly.ngrok-free.dev/api/tracking/incident';
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
           unidadPlaca,
           descripcion: 'Incidencia reportada por el conductor (Foto)',
           fotoBase64: 'data:image/jpeg;base64,' + result.assets[0].base64
        })
      }).then(() => {
         showAlert('Incidencia Reportada', 'La foto y el reporte han sido enviados al instante.', 'success');
      });
    }
  };

  return (
    <LinearGradient colors={sosActive ? ['#450a0a', '#7f1d1d'] : ['#020b1f', '#051c4a']} style={styles.container}>
      {/* PANTALLA ROJA BLOQUEANTE SOS */}
      {sosActive && (
        <Animated.View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999, backgroundColor: sosFlashAnim.interpolate({ inputRange: [0, 1], outputRange: ['rgba(127,29,29,0.95)', 'rgba(220,38,38,0.97)'] }), justifyContent: 'center', alignItems: 'center', padding: 32 }}>
          <View style={{ alignItems: 'center' }}>
            <Animated.View style={{ transform: [{ scale: sosFlashAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] }) }] }}>
              <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginBottom: 24, shadowColor: '#fff', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 30, elevation: 30 }}>
                <AlertTriangle color="#dc2626" size={60} />
              </View>
            </Animated.View>
            <Text style={{ fontSize: 36, fontWeight: '900', color: '#fff', letterSpacing: 4, marginBottom: 8, textAlign: 'center' }}>S.O.S ACTIVO</Text>
            <Text style={{ fontSize: 16, color: '#fecaca', textAlign: 'center', marginBottom: 8, lineHeight: 24 }}>Alerta de emergencia enviada a la central.</Text>
            <Text style={{ fontSize: 14, color: '#fca5a5', textAlign: 'center', marginBottom: 32 }}>Unidad: {unidadPlaca} | Ubicación enviada</Text>
            
            <View style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: 16, borderRadius: 12, marginBottom: 32, width: '100%' }}>
              <Text style={{ color: '#fecaca', fontSize: 13, textAlign: 'center', lineHeight: 20 }}>La central de monitoreo ha sido notificada.{"\n"}Permanezca en su ubicación si es seguro hacerlo.</Text>
            </View>

            <TouchableOpacity 
              onPress={() => { setSosActive(false); sosFlashAnim.stopAnimation(); sosFlashAnim.setValue(0); }}
              style={{ paddingHorizontal: 40, paddingVertical: 18, backgroundColor: '#fff', borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 }}
            >
              <Text style={{ color: '#dc2626', fontWeight: '900', fontSize: 18, letterSpacing: 1 }}>DESACTIVAR ALERTA</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hola, {localEmployee?.nombres || 'Transportista'}</Text>
            <Text style={styles.subtitle}>DNI {localEmployee?.dni || '---'} | Unidad: {assignment ? unidadPlaca : 'Sin asignar'}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity style={[styles.iconButton, { marginRight: 10 }]} onPress={() => setShowDevMenu(true)}>
              <Settings color="#38bdf8" size={20} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={handleLogout}>
              <LogOut color="#fca5a5" size={20} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {!assignment && (
             <View style={{ backgroundColor: '#fff3cd', padding: 16, borderRadius: 12, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: '#f59e0b', flexDirection: 'row', alignItems: 'center' }}>
                <AlertTriangle color="#f59e0b" size={24} style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                   <Text style={{ color: '#856404', fontWeight: 'bold', fontSize: 16 }}>Sin viaje asignado</Text>
                   <Text style={{ color: '#856404', fontSize: 14, marginTop: 4 }}>Aún no asignaron un viaje para ti. Espera instrucciones.</Text>
                </View>
             </View>
          )}

          <View style={styles.glassCard}>
            <View style={styles.statusHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.dot, { backgroundColor: tripState === 'active' ? '#10b981' : '#94a3b8' }]} />
                <Text style={styles.statusText}>
                  {tripState === 'idle' ? 'DISPONIBLE' : tripState === 'active' ? 'EN RUTA' : 'COMPLETADO'}
                </Text>
              </View>
              <Battery color="#10b981" size={20} />
            </View>

            <View style={styles.actionContainer}>
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <TouchableOpacity 
                  style={[
                    styles.mainButton, 
                    tripState === 'active' && styles.mainButtonActive,
                    tripState === 'completed' && styles.mainButtonCompleted
                  ]} 
                  onPress={handleTripAction}
                >
                  {tripState === 'idle' && <Navigation color="#fff" size={48} />}
                  {tripState === 'active' && <MapPin color="#fff" size={48} />}
                  {tripState === 'completed' && <CheckCircle color="#fff" size={48} />}
                </TouchableOpacity>
              </Animated.View>
              <Text style={styles.actionText}>
                {tripState === 'idle' ? 'INICIAR VIAJE' : tripState === 'active' ? 'FINALIZAR VIAJE' : 'NUEVO VIAJE'}
              </Text>
            </View>
          </View>

          {tripState === 'active' && (
            <View style={styles.glassCard}>
              <Text style={styles.cardTitle}>Ruta Actual</Text>
              <View style={styles.routeItem}>
                <MapPin color="#3b82f6" size={20} />
                <View style={styles.routeText}>
                  <Text style={styles.routeLabel}>Origen</Text>
                  <Text style={styles.routeValue}>{assignment?.ruta ? assignment.ruta.split(' - ')[0] : 'Almacén Principal'}</Text>
                </View>
              </View>
              <View style={styles.routeDivider} />
              <View style={styles.routeItem}>
                <MapPin color="#f59e0b" size={20} />
                <View style={styles.routeText}>
                  <Text style={styles.routeLabel}>Destino (Llegada est. 11:45 AM)</Text>
                  <Text style={styles.routeValue}>{assignment?.ruta ? assignment.ruta.split(' - ')[1] : 'Destino Cliente'}</Text>
                </View>
              </View>
            </View>
          )}

          {/* ACCIONES RÁPIDAS Y SOS */}
          {(tripState === 'active' || assignment !== null) && (
             <View style={{ marginBottom: 16 }}>
                <TouchableOpacity style={[styles.sosButton, { marginRight: 0, paddingVertical: 18 }]} onPress={handleSOS}>
                  <AlertTriangle color="#fff" size={28} />
                  <Text style={[styles.sosButtonText, { fontSize: 20 }]}>EMERGENCIA S.O.S</Text>
                </TouchableOpacity>
             </View>
          )}

          <View style={styles.quickActions}>
            <TouchableOpacity 
               style={[styles.quickActionBtn, tripState === 'idle' && { opacity: 0.5 }]} 
               disabled={tripState === 'idle'}
               onPress={() => {
                 if (tripState === 'completed') {
                    showAlert('No permitido', 'El viaje ya ha finalizado.', 'warning');
                 } else {
                    const newTripState = tripState === 'active' ? 'paused' : 'active';
                    setTripState(newTripState);
                    const actionText = newTripState === 'paused' ? 'El conductor ha pausado el viaje (Descanso)' : 'El conductor ha reanudado el viaje';
                    const url = Platform.OS === 'web' ? 'https://technical-latina-chastenedly.ngrok-free.dev/api/tracking/incident' : 'https://technical-latina-chastenedly.ngrok-free.dev/api/tracking/incident';
                    fetch(url, {
                       method: 'POST',
                       headers: { 'Content-Type': 'application/json' },
                       body: JSON.stringify({ unidadPlaca, descripcion: actionText, fotoBase64: '' })
                    });
                    showAlert(newTripState === 'paused' ? 'Viaje Pausado' : 'Viaje Reanudado', 'Se ha notificado a la central de monitoreo.', 'info');
                 }
            }}>
              <Clock color={tripState === 'paused' ? '#f59e0b' : '#cbd5e1'} size={24} />
              <Text style={[styles.quickActionText, tripState === 'paused' && { color: '#f59e0b' }]}>{tripState === 'paused' ? 'Reanudar' : 'Pausa'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickActionBtn} onPress={() => {
                 if (assignment) {
                    setShowCargoModal(true);
                 } else {
                    showAlert('Sin Carga', 'Aún no se ha asignado ninguna carga ni viaje.', 'warning');
                 }
            }}>
              <Truck color="#cbd5e1" size={24} />
              <Text style={styles.quickActionText}>Carga</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickActionBtn} onPress={() => {
                 if (assignment?.guiaPdfBase64) {
                    setShowPdfModal(true);
                 } else {
                    showAlert('Sin PDF', 'No se ha adjuntado un PDF de la Guía de Remisión.', 'warning');
                 }
            }}>
              <FileText color="#cbd5e1" size={24} />
              <Text style={styles.quickActionText}>Guía PDF</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickActionBtn} onPress={() => setShowSettings(true)}>
              <Settings color="#cbd5e1" size={24} />
              <Text style={styles.quickActionText}>Ajustes</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
             style={[styles.quickActionBtn, { marginTop: 16, flexDirection: 'row', justifyContent: 'center', backgroundColor: 'rgba(59, 130, 246, 0.1)' }]} 
             onPress={handleRestartTrip}
          >
             <Navigation color="#60a5fa" size={24} />
             <Text style={[styles.quickActionText, { color: '#60a5fa', marginLeft: 8 }]}>Reiniciar Viaje (Ir al Inicio)</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>

      <Modal visible={showCargoModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.devMenuContainer, { padding: 0, overflow: 'hidden' }]}>
            <LinearGradient colors={['#1e293b', '#0f172a']} style={{ padding: 24, alignItems: 'center' }}>
               <View style={{ width: 60, height: 60, backgroundColor: 'rgba(59, 130, 246, 0.2)', borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <Package color="#60a5fa" size={32} />
               </View>
               <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>Detalles de Carga</Text>
               <Text style={{ color: '#94a3b8', fontSize: 14, marginTop: 4 }}>Guía N° {assignment?.guia || 'Sin Guía'}</Text>
            </LinearGradient>
            <ScrollView style={{ padding: 24, maxHeight: 400 }}>
               
               <View style={{ flexDirection: 'row', gap: 16, marginBottom: 20 }}>
                  <View style={{ flex: 1, backgroundColor: '#f1f5f9', padding: 16, borderRadius: 12 }}>
                     <Text style={{ color: '#64748b', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' }}>Unidad</Text>
                     <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                        <Truck size={16} color="#3b82f6" />
                        <Text style={{ color: '#0f172a', fontSize: 16, fontWeight: 'bold' }}>{assignment?.vehiculo || '---'}</Text>
                     </View>
                  </View>
                  <View style={{ flex: 1, backgroundColor: '#f1f5f9', padding: 16, borderRadius: 12 }}>
                     <Text style={{ color: '#64748b', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' }}>Conductor</Text>
                     <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                        <Users size={16} color="#10b981" />
                        <Text style={{ color: '#0f172a', fontSize: 16, fontWeight: 'bold' }}>{assignment?.conductor?.split(' ')[0] || '---'}</Text>
                     </View>
                  </View>
               </View>

               <View style={{ backgroundColor: '#f8fafc', padding: 16, borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: '#e2e8f0' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
                     <View style={{ marginTop: 2 }}><MapPin size={18} color="#94a3b8" /></View>
                     <View style={{ flex: 1 }}>
                        <Text style={{ color: '#64748b', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' }}>Origen</Text>
                        <Text style={{ color: '#0f172a', fontSize: 15, fontWeight: '600', marginTop: 2 }}>{assignment?.puntoRecojo || '---'}</Text>
                     </View>
                  </View>
                  <View style={{ height: 1, backgroundColor: '#e2e8f0', marginLeft: 30, marginBottom: 16 }} />
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                     <View style={{ marginTop: 2 }}><MapPin size={18} color="#ef4444" /></View>
                     <View style={{ flex: 1 }}>
                        <Text style={{ color: '#64748b', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' }}>Destino Final</Text>
                        <Text style={{ color: '#0f172a', fontSize: 15, fontWeight: '600', marginTop: 2 }}>{assignment?.clienteDestino || '---'}</Text>
                     </View>
                  </View>
               </View>

               <View style={{ backgroundColor: '#eff6ff', padding: 16, borderRadius: 16, marginBottom: 20 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                     <View style={{ flex: 1 }}>
                        <Text style={{ color: '#3b82f6', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' }}>Tipo de Carga</Text>
                        <Text style={{ color: '#1e3a8a', fontSize: 16, fontWeight: 'bold', marginTop: 2 }}>{assignment?.tipoCarga || '---'}</Text>
                     </View>
                     <View style={{ flex: 1, alignItems: 'flex-end' }}>
                        <Text style={{ color: '#3b82f6', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' }}>Peso / Volumen</Text>
                        <Text style={{ color: '#1e3a8a', fontSize: 16, fontWeight: 'bold', marginTop: 2 }}>{assignment?.peso || '---'}</Text>
                     </View>
                  </View>
               </View>

            </ScrollView>
            <View style={{ padding: 24, borderTopWidth: 1, borderTopColor: '#f1f5f9', width: '100%' }}>
               <TouchableOpacity onPress={() => setShowCargoModal(false)} style={{ backgroundColor: '#0f172a', padding: 16, borderRadius: 12, alignItems: 'center' }}>
                  <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Entendido</Text>
               </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showPdfModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.devMenuContainer, { height: '80%' }]}>
            <View style={styles.devHeader}>
              <Text style={styles.devTitle}>📄 Guía de Remisión</Text>
              <TouchableOpacity onPress={() => setShowPdfModal(false)}>
                <LogOut color="#fca5a5" size={24} />
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' }}>
              {Platform.OS === 'web' && assignment?.guiaPdfBase64 ? (
                 <iframe src={assignment.guiaPdfBase64} width="100%" height="100%" style={{ border: 'none' }} title="Guia PDF" />
              ) : (
                 <Text style={{ textAlign: 'center', marginTop: 20 }}>Visor PDF no disponible en este dispositivo.</Text>
              )}
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showChecklist} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.devMenuContainer}>
            <View style={styles.devHeader}>
              <Text style={styles.devTitle}>📋 Checklist Pre-Viaje</Text>
              <TouchableOpacity onPress={() => setShowChecklist(false)}>
                <LogOut color="#fca5a5" size={24} />
              </TouchableOpacity>
            </View>
            <Text style={styles.devDesc}>Por favor, confirme el estado óptimo de la unidad antes de arrancar.</Text>
            
            {(['tires', 'brakes', 'lights', 'fuel'] as const).map((key) => {
              const labels = { tires: 'Llantas y presión', brakes: 'Frenos y líquido', lights: 'Luces delanteras/traseras', fuel: 'Nivel de combustible' };
              const isOk = checklist[key];
              const hasPhoto = !!checklistPhotos[key];
              return (
                <View key={key}>
                  <View style={styles.checklistRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.checklistText}>{labels[key]}</Text>
                      {!isOk && (
                        <Text style={{ color: '#fca5a5', fontSize: 12, marginTop: 2 }}>⚠️ No conforme – se requiere foto</Text>
                      )}
                    </View>
                    <Switch 
                      value={isOk} 
                      onValueChange={(val) => {
                        setChecklist(prev => ({...prev, [key]: val}));
                        if (val) setChecklistPhotos(prev => ({...prev, [key]: ''}));
                      }} 
                      thumbColor={isOk ? '#10b981' : '#ef4444'}
                      trackColor={{ false: '#7f1d1d', true: '#064e3b' }}
                    />
                  </View>
                  {!isOk && (
                    <TouchableOpacity 
                      style={{ flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: hasPhoto ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.15)', borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: hasPhoto ? '#10b981' : '#ef4444' }}
                      onPress={async () => {
                        try {
                          const perm = await ImagePicker.requestCameraPermissionsAsync();
                          if (!perm.granted) { showAlert('Permiso denegado', 'Necesitas permitir acceso a la cámara.', 'warning'); return; }
                          const result = await ImagePicker.launchCameraAsync({ base64: true, quality: 0.5, mediaTypes: ImagePicker.MediaTypeOptions.Images });
                          if (!result.canceled && result.assets?.[0]?.base64) {
                            setChecklistPhotos(prev => ({...prev, [key]: 'data:image/jpeg;base64,' + result.assets[0].base64}));
                            showAlert('Foto capturada', 'La evidencia de la falla ha sido registrada correctamente.', 'success');
                          }
                        } catch(e) { showAlert('Error', 'No se pudo acceder a la cámara.', 'error'); }
                      }}
                    >
                      <Camera color={hasPhoto ? '#10b981' : '#fca5a5'} size={18} />
                      <Text style={{ color: hasPhoto ? '#10b981' : '#fca5a5', marginLeft: 8, fontWeight: 'bold', fontSize: 13 }}>
                        {hasPhoto ? '✅ Foto capturada – Toca para cambiar' : '📸 Tomar foto de la falla'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}

            <TouchableOpacity style={[styles.mainButton, { width: '100%', height: 50, borderRadius: 12, marginTop: 20 }]} onPress={confirmStartTrip}>
              <Text style={[styles.actionText, { fontSize: 16 }]}>CONFIRMAR E INICIAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showDevMenu} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.devMenuContainer}>
            <View style={styles.devHeader}>
              <Text style={styles.devTitle}>Opciones de Desarrollador</Text>
              <TouchableOpacity onPress={() => setShowDevMenu(false)}>
                <CheckCircle color="#fff" size={24} />
              </TouchableOpacity>
            </View>
            <Text style={styles.devDesc}>Usa estos botones para simular escenarios y probar las alertas en la web.</Text>
            
            <TouchableOpacity style={styles.devBtn} onPress={() => { devSpeed.current = 120; devStop.current = false; setShowDevMenu(false); }}>
              <Text style={styles.devBtnText}>🚀 Acelerar a 120 km/h (Alerta)</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.devBtn} onPress={() => { devSpeed.current = null; devStop.current = false; setShowDevMenu(false); }}>
              <Text style={styles.devBtnText}>🚙 Velocidad Normal (60 km/h)</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.devBtn} onPress={() => { devStop.current = true; devSpeed.current = 0; setShowDevMenu(false); }}>
              <Text style={styles.devBtnText}>🛑 Detener Vehículo (0 km/h)</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.devBtn} onPress={() => { if(devLat.current) devLat.current += 0.05; setShowDevMenu(false); }}>
              <Text style={styles.devBtnText}>📍 Saltar 5km (Desvío de Ruta)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL SOS PERSONALIZADO */}
      <Modal visible={showSOSModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{ backgroundColor: '#1a0000', borderRadius: 24, padding: 28, width: '100%', maxWidth: 400, alignItems: 'center', borderWidth: 2, borderColor: '#ef4444' }}>
            {/* Ícono pulsante */}
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#ef4444', justifyContent: 'center', alignItems: 'center', marginBottom: 16, shadowColor: '#ef4444', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 20, elevation: 20 }}>
              <AlertTriangle color="#fff" size={40} />
            </View>

            <Text style={{ fontSize: 26, fontWeight: '900', color: '#fff', marginBottom: 6, letterSpacing: 2 }}>S.O.S EMERGENCIA</Text>
            <Text style={{ fontSize: 14, color: '#fca5a5', textAlign: 'center', marginBottom: 24, lineHeight: 20 }}>
              Se enviará una alerta CRÍTICA a la central con tu ubicación actual.{'\n'}¿Deseas adjuntar una foto de la emergencia?
            </Text>

            {/* Botón CON foto */}
            <TouchableOpacity
              style={{ width: '100%', padding: 16, backgroundColor: '#ef4444', borderRadius: 14, alignItems: 'center', marginBottom: 12, flexDirection: 'row', justifyContent: 'center' }}
              onPress={() => sendSOS(true)}
            >
              <Camera color="#fff" size={20} />
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16, marginLeft: 8 }}>📸 TOMAR FOTO Y ENVIAR</Text>
            </TouchableOpacity>

            {/* Botón SIN foto */}
            <TouchableOpacity
              style={{ width: '100%', padding: 16, backgroundColor: 'rgba(239,68,68,0.2)', borderRadius: 14, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#ef4444' }}
              onPress={() => sendSOS(false)}
            >
              <Text style={{ color: '#fca5a5', fontWeight: 'bold', fontSize: 15 }}>🚨 Solo enviar alerta (sin foto)</Text>
            </TouchableOpacity>

            {/* Cancelar */}
            <TouchableOpacity onPress={() => setShowSOSModal(false)}>
              <Text style={{ color: '#64748b', fontSize: 14 }}>Cancelar — fue un error</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* CUSTOM ALERT MODAL */}
      <Modal visible={customAlert.visible} transparent animationType="fade">
         <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
            <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 24, width: '100%', maxWidth: 400, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 10 }}>
               <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: customAlert.type === 'error' ? '#fee2e2' : customAlert.type === 'warning' ? '#fef3c7' : customAlert.type === 'success' ? '#d1fae5' : '#e0e7ff', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
                  {customAlert.type === 'error' && <AlertTriangle color="#ef4444" size={32} />}
                  {customAlert.type === 'warning' && <AlertTriangle color="#f59e0b" size={32} />}
                  {customAlert.type === 'success' && <CheckCircle color="#10b981" size={32} />}
                  {customAlert.type === 'info' && <Info color="#3b82f6" size={32} />}
               </View>
               <Text style={{ fontSize: 20, fontWeight: '800', color: '#0f172a', marginBottom: 8, textAlign: 'center' }}>{customAlert.title}</Text>
               <Text style={{ fontSize: 15, color: '#475569', textAlign: 'center', marginBottom: 24, lineHeight: 22 }}>{customAlert.message}</Text>
               
               <TouchableOpacity 
                  onPress={() => {
                     setCustomAlert(prev => ({ ...prev, visible: false }));
                     if (customAlert.onConfirm) customAlert.onConfirm();
                  }} 
                  style={{ width: '100%', padding: 16, backgroundColor: customAlert.type === 'error' ? '#ef4444' : customAlert.type === 'warning' ? '#f59e0b' : customAlert.type === 'success' ? '#10b981' : '#3b82f6', borderRadius: 12, alignItems: 'center' }}
               >
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Entendido</Text>
               </TouchableOpacity>
            </View>
         </View>
      </Modal>

      {/* AJUSTES MODAL */}
      <Modal visible={showSettings} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.devMenuContainer}>
            <View style={styles.devHeader}>
              <Text style={styles.devTitle}>⚙️ Ajustes de Perfil</Text>
              <TouchableOpacity onPress={() => setShowSettings(false)}>
                <LogOut color="#fca5a5" size={24} />
              </TouchableOpacity>
            </View>
            
            <View style={{ marginBottom: 16 }}>
               <Text style={{ color: '#fff', marginBottom: 8, fontWeight: 'bold' }}>Nombre Completo</Text>
               <View style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}>
                  <TextInput 
                     value={editName} 
                     onChangeText={setEditName} 
                     style={{ color: '#fff', fontSize: 16, width: '100%' }} 
                  />
               </View>
            </View>

            <View style={{ marginBottom: 24 }}>
               <Text style={{ color: '#fff', marginBottom: 8, fontWeight: 'bold' }}>DNI</Text>
               <View style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}>
                  <TextInput 
                     value={editDNI} 
                     onChangeText={setEditDNI} 
                     style={{ color: '#fff', fontSize: 16, width: '100%' }} 
                  />
               </View>
            </View>

            <TouchableOpacity 
               style={[styles.devBtn, { backgroundColor: '#3b82f6', borderColor: '#2563eb' }]} 
               onPress={async () => {
                  const updatedEmployee = { ...localEmployee, nombres: editName, dni: editDNI };
                  setLocalEmployee(updatedEmployee);
                  await AsyncStorage.setItem('employee', JSON.stringify(updatedEmployee));
                  setShowSettings(false);
                  showAlert('Perfil Actualizado', 'Tus datos se han guardado correctamente.', 'success');
               }}
            >
               <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16, textAlign: 'center' }}>Guardar Cambios</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
  },
  iconButton: {
    padding: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)'
  },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 24,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  statusText: { color: '#cbd5e1', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  actionContainer: { alignItems: 'center', paddingBottom: 16 },
  mainButton: {
    width: 140, height: 140,
    borderRadius: 70,
    backgroundColor: '#3b82f6',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 20,
    elevation: 10,
  },
  mainButtonActive: {
    backgroundColor: '#f59e0b',
    shadowColor: '#f59e0b',
  },
  mainButtonCompleted: {
    backgroundColor: '#10b981',
    shadowColor: '#10b981',
  },
  actionText: { color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: 1 },
  cardTitle: { color: '#94a3b8', fontSize: 14, fontWeight: '600', marginBottom: 20, letterSpacing: 1 },
  routeItem: { flexDirection: 'row', alignItems: 'center' },
  routeText: { marginLeft: 16 },
  routeLabel: { color: '#64748b', fontSize: 12 },
  routeValue: { color: '#fff', fontSize: 16, fontWeight: '600', marginTop: 2 },
  routeDivider: { height: 30, width: 2, backgroundColor: 'rgba(255,255,255,0.1)', marginLeft: 9, marginVertical: 4 },
  quickActions: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  quickActionBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center', justifyContent: 'center'
  },
  quickActionText: { color: '#cbd5e1', fontSize: 12, fontWeight: '600', marginTop: 8 },
  sosButton: {
    flex: 1,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1, borderColor: '#ef4444',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center', justifyContent: 'center'
  },
  sosButtonText: { color: '#ef4444', fontSize: 12, fontWeight: '800', marginTop: 8 },
  checklistRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, backgroundColor: 'rgba(255,255,255,0.05)', padding: 12, borderRadius: 12 },
  checklistText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  greeting: { color: '#fff', fontSize: 24, fontWeight: '700' },
  subtitle: { color: '#94a3b8', fontSize: 14, marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  devMenuContainer: { width: '85%', backgroundColor: '#0f172a', borderRadius: 20, padding: 24 },
  devHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  devTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  devDesc: { color: '#94a3b8', fontSize: 14, marginBottom: 24 },
  devBtn: { backgroundColor: 'rgba(255,255,255,0.1)', padding: 16, borderRadius: 12, marginBottom: 12 },
  devBtnText: { color: '#fff', fontSize: 14, fontWeight: '600', textAlign: 'center' }
});
