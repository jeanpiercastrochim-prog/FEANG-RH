import { useState, useEffect, useRef } from 'react';
import { 
  Truck, AlertTriangle, Activity, MapPin, 
  Battery, Clock, Map, Package, CheckCircle,
  Navigation, Info, WifiOff, FileText, Download,
  Bell, User, Shield, Calendar, PauseCircle, Signal, X,
  Search, Users, Wrench, Settings, Gauge, ChevronRight, LogOut, ClipboardList, Eye
} from 'lucide-react';
import * as signalR from '@microsoft/signalr';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as ExcelJS from 'exceljs';
import './dashboardTransportista.css';

const routes = {
  'CHV-014': [
    [-12.0464, -77.0428], [-11.8744, -77.1085], [-11.7766, -77.1764], 
    [-11.5369, -77.2662], [-11.1093, -77.6083], [-10.7548, -77.7601], 
    [-10.4357, -77.9405], [-10.0681, -78.1522], [-9.7214, -78.2361], [-9.4704, -78.3117]
  ],
  'CHV-022': [
    [-8.11599, -79.02598], [-8.4167, -78.75], [-8.5333, -78.6833], 
    [-9.0833, -78.5833], [-9.4704, -78.3117]
  ],
  'CHV-089': [
    [-12.0651, -75.2048], [-11.7333, -75.7667], [-11.5167, -75.9000], 
    [-11.6333, -76.2667], [-11.1500, -76.8500], [-10.7000, -77.7833], [-9.4704, -78.3117]
  ]
};

function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export default function DashboardTransportista({ onLogout, user }) {
  const [time, setTime] = useState(new Date());
  const [liveFeed, setLiveFeed] = useState([]);
  const [liveAlerts, setLiveAlerts] = useState([]);
  const [truckLocations, setTruckLocations] = useState({
    'CHV-014': { latitud: routes['CHV-014'][0][0], longitud: routes['CHV-014'][0][1], velocidad: 0, bateria: 100 },
    'CHV-022': { latitud: routes['CHV-022'][0][0], longitud: routes['CHV-022'][0][1], velocidad: 0, bateria: 100 },
    'CHV-089': { latitud: routes['CHV-089'][0][0], longitud: routes['CHV-089'][0][1], velocidad: 0, bateria: 100 }
  }); // Mapa de placa a ubicación inicial
  const [selectedTruck, setSelectedTruck] = useState(null);
  const [activeTab, setActiveTab] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    return ['operacion', 'mapa', 'flota', 'conductores', 'mantenimiento', 'asignaciones', 'historial', 'reportes'].includes(hash) ? hash : 'operacion';
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [fleetFilter, setFleetFilter] = useState('todos');
  
  // Nuevos Estados para Presentación
  const [isEmergency, setIsEmergency] = useState(false);
  const [emergencyTruck, setEmergencyTruck] = useState(null);
  const [emergencyPhoto, setEmergencyPhoto] = useState(null);
  
  // Estados de formulario de Asignaciones
  const [asigData, setAsigData] = useState({ ruta: '', conductor: '', vehiculo: '', tipoCarga: '', peso: '', guia: '', puntoRecojo: '', clienteDestino: '' });
  const [asigSuccess, setAsigSuccess] = useState(false);
  const [assignments, setAssignments] = useState({});
  const [assignmentHistory, setAssignmentHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const [maintenanceVehicle, setMaintenanceVehicle] = useState(null);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (['operacion', 'mapa', 'flota', 'conductores', 'mantenimiento', 'asignaciones', 'historial', 'reportes'].includes(hash)) {
        setActiveTab(hash);
      } else {
        setActiveTab('operacion');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (window.location.hash.replace('#', '') !== activeTab) {
      window.history.pushState(null, '', `#${activeTab}`);
    }
  }, [activeTab]);
  const [activeVehicles, setActiveVehicles] = useState([]);
  const [truckDistances, setTruckDistances] = useState({});
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);

  const [mapCenter, setMapCenter] = useState([-10.7548, -77.7601]);
  const [mapZoom, setMapZoom] = useState(6);
  
  const focusVehicle = (placa) => {
    const loc = truckLocations[placa];
    if (loc) {
      setMapCenter([loc.latitud, loc.longitud]);
      setMapZoom(14);
      setActiveTab('mapa');
      setIsSidebarCollapsed(true);
    }
  };

  const getETA = (placa) => {
    const distanceLeft = 500 - (truckDistances[placa] || 0);
    if (distanceLeft <= 0) return "Llegando";
    const speed = truckLocations[placa]?.velocidad || 0;
    if (speed < 5) return "--"; // detenido
    const hours = distanceLeft / speed;
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  // Lógica de KPIs dinámicos
  const listosDescargaCount = Object.keys(truckLocations).filter(placa => (truckDistances[placa] || 0) >= 500).length;
  const llegadasHoyCount = Object.keys(truckLocations).filter(placa => {
     const dist = truckDistances[placa] || 0;
     const speed = truckLocations[placa]?.velocidad || 0;
     return dist < 500 && speed > 0;
  }).length;
  const criticasCount = liveAlerts.filter(a => a.type === 'critical').length;
  const movingTrucks = Object.values(truckLocations).filter(t => t.velocidad > 0);
  const avgSpeed = movingTrucks.length > 0 ? (movingTrucks.reduce((acc, t) => acc + t.velocidad, 0) / movingTrucks.length).toFixed(0) : 0;

  // Carrusel effect
  useEffect(() => {
    if (activeVehicles.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentCarouselIndex(prev => (prev + 1) % activeVehicles.length);
    }, 10000); // Cambiar cada 10 segundos
    return () => clearInterval(timer);
  }, [activeVehicles.length]);

  // Time effect
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Configurar SignalR
    const connection = new signalR.HubConnectionBuilder()
      .withUrl("http://localhost:5051/trackingHub")
      .withAutomaticReconnect()
      .build();

    connection.start()
      .then(() => {
        console.log("SignalR Connected!");
        connection.invoke("JoinFleetGroup", "Gerente");
      })
      .catch(err => console.error("SignalR Connection Error: ", err));

    connection.on("ReceiveLocation", (placa, location) => {
      // Actualizar posición del camión
      setTruckLocations(prev => ({ ...prev, [placa]: location }));
      
      // Registrar que el camión está activo para el carrusel
      setActiveVehicles(prev => {
        if (!prev.includes(placa)) return [...prev, placa];
        return prev;
      });

      // Lógica simulada de distancia acumulada (Mantenimiento Predictivo)
      if (location.velocidad > 0) {
        setTruckDistances(prev => {
          const current = prev[placa] || 0;
          const next = current + 20; // Simulamos avance acelerado
          if (next >= 500 && current < 500) {
            setLiveAlerts(alerts => [{
              id: Math.random().toString(),
              type: 'warning',
              title: '🔧 Mantenimiento Preventivo',
              vehicle: placa,
              time: 'AHORA',
              detail: `La unidad ${placa} requiere mantenimiento programado (Superó 500 km).`
            }, ...alerts].slice(0, 5));
          }
          return { ...prev, [placa]: next };
        });
      }
      
      // Agregar un evento al feed (solo si cambia drásticamente, pero para demo lo mostramos)
      setLiveFeed(prev => [{
        type: 'operation',
        icon: Navigation,
        time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        text: `GPS Actualizado - ${placa} a ${location.velocidad.toFixed(0)} km/h`,
        label: 'Rastreo'
      }, ...prev].slice(0, 15)); // Mantener los últimos 15
    });

    connection.on("ReceiveAlert", (placa, alerta) => {
      console.log('🚨 ALERTA RECIBIDA:', placa, alerta);
      const tipo = alerta.tipo || alerta.Tipo;
      const titulo = alerta.titulo || alerta.Titulo;
      const detalle = alerta.detalle || alerta.Detalle;
      const foto = alerta.fotoBase64 || alerta.FotoBase64;
      
      setLiveAlerts(prev => [{
        id: Math.random().toString(),
        type: tipo,
        title: titulo,
        vehicle: placa,
        time: 'AHORA',
        detail: detalle,
        fotoBase64: foto
      }, ...prev].slice(0, 5));

      if (titulo && titulo.includes('S.O.S')) {
         setIsEmergency(true);
         setEmergencyTruck(placa);
         if (foto) {
             setEmergencyPhoto(foto);
         }
      }
    });

    return () => {
      connection.stop();
    };
  }, []);

  const formatDate = (date) => {
    const options = { day: '2-digit', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('es-ES', options);
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();
  };

  // Dynamic Health Score
  const healthScore = Math.max(0, 100 - (liveAlerts.length * 5));
  const getHealthColor = (score) => {
    if (score >= 95) return 'green';
    if (score >= 80) return 'yellow';
    return 'red';
  };
  const healthColor = getHealthColor(healthScore);

  const activeCount = Object.keys(truckLocations).length;
  const stoppedCount = Object.values(truckLocations).filter(loc => loc.velocidad < 5).length;

  const kpis = [
    { title: 'Camiones activos', value: activeCount.toString(), icon: Truck, color: 'blue' },
    { title: 'Viajes realizados', value: '42', icon: Package, color: 'purple' },
    { title: 'Puntualidad', value: '98%', icon: Clock, color: 'green' },
    { title: 'Alertas activas', value: liveAlerts.length.toString(), icon: Bell, color: 'red' },
    { title: 'Gasto Gasolina (Mes)', value: 'S/ 24,500', icon: Battery, color: 'orange' },
    { title: 'Tiempo promedio', value: '4h 15m', icon: Activity, color: 'blue' },
    { title: 'Distancia recorrida', value: '1,240 km', icon: Navigation, color: 'purple' },
    { title: 'Cumplimiento ruta', value: '95%', icon: Map, color: 'green' }
  ];

  const generarPDF = () => {
     const doc = new jsPDF();
     doc.setFontSize(22);
     doc.text('Reporte de Rendimiento - Flota Chavín', 20, 20);
     doc.setFontSize(12);
     doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 20, 30);
     doc.autoTable({
        startY: 40,
        head: [['Placa', 'Viajes', 'Rendimiento Combustible', 'Incidentes']],
        body: [
           ['CHV-014', '12', '14.5 km/gl', '0'],
           ['CHV-022', '8', '13.2 km/gl', '1'],
           ['CHV-089', '15', '15.1 km/gl', '0']
        ]
     });
     doc.save('Reporte_Flota_Chavin.pdf');
  };

  const generarExcel = async () => {
     const workbook = new ExcelJS.Workbook();
     const sheet = workbook.addWorksheet('Asistencias');
     sheet.columns = [
        { header: 'Conductor', key: 'nombre', width: 25 },
        { header: 'DNI', key: 'dni', width: 15 },
        { header: 'Horas Conducidas (Mes)', key: 'horas', width: 25 },
        { header: 'Calificación', key: 'rating', width: 15 }
     ];
     sheet.addRow({ nombre: 'Carlos Prueba', dni: '33333333', horas: 140, rating: 4.8 });
     sheet.addRow({ nombre: 'Ana Prueba', dni: '44444444', horas: 125, rating: 4.9 });
     sheet.addRow({ nombre: 'Luis Transporte', dni: '55555555', horas: 160, rating: 4.7 });
     
     const buffer = await workbook.xlsx.writeBuffer();
     const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
     const url = window.URL.createObjectURL(blob);
     const a = document.createElement('a');
     a.href = url;
     a.download = 'Asistencias_Conductores.xlsx';
     a.click();
     window.URL.revokeObjectURL(url);
  };

  const displayFeed = liveFeed;
  const displayAlerts = liveAlerts;

  return (
    <>
      {isEmergency && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backgroundColor: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', animation: 'pulse-bg 2s infinite' }}>
           <style>{`
             @keyframes pulse-bg {
               0% { box-shadow: inset 0 0 0 0px rgba(239,68,68,0.8); }
               50% { box-shadow: inset 0 0 0 15px rgba(239,68,68,0.6); }
               100% { box-shadow: inset 0 0 0 0px rgba(239,68,68,0.8); }
             }
             @keyframes slide-down {
               0% { transform: translateY(-50px); opacity: 0; }
               100% { transform: translateY(0); opacity: 1; }
             }
           `}</style>
           <div style={{ pointerEvents: 'auto', backgroundColor: '#ffffff', padding: '40px', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(239,68,68,0.5)', width: '500px', textAlign: 'center', border: '2px solid #ef4444', animation: 'slide-down 0.4s ease-out' }}>
              <div style={{ width: '80px', height: '80px', backgroundColor: '#fee2e2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto', animation: 'pulse-bg 1s infinite' }}>
                 <AlertTriangle size={40} color="#ef4444" />
              </div>
              <h2 style={{ color: '#b91c1c', fontSize: '28px', fontWeight: '900', margin: '0 0 12px 0', letterSpacing: '-0.5px' }}>¡ALERTA CRÍTICA RECIBIDA!</h2>
              <p style={{ color: '#0f172a', fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>Unidad: <span style={{ color: '#ef4444', fontSize: '22px', fontWeight: '900' }}>{emergencyTruck}</span></p>
              <p style={{ color: '#64748b', fontSize: '15px', marginBottom: '32px' }}>El conductor ha activado el botón de pánico / SOS. Posible asalto o accidente grave.</p>
              {emergencyPhoto && (
                  <div style={{ marginBottom: '24px' }}>
                     <img src={emergencyPhoto} alt="Evidencia de Emergencia" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '12px', border: '2px solid #ef4444' }} />
                  </div>
              )}
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                 <button onClick={() => { setIsEmergency(false); focusVehicle(emergencyTruck); setEmergencyTruck(null); setEmergencyPhoto(null); }} style={{ padding: '16px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <MapPin size={20} /> Ver en Mapa
                 </button>
                 <button onClick={() => { setIsEmergency(false); setEmergencyTruck(null); setEmergencyPhoto(null); }} style={{ padding: '16px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '800', cursor: 'pointer' }}>
                    Falsa Alarma
                 </button>
              </div>
           </div>
        </div>
      )}
      <div className="transp-dashboard-layout">
      {/* Sidebar Lateral */}
      <aside className={`transp-sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <button 
          className="sidebar-toggle-btn" 
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          title={isSidebarCollapsed ? "Expandir menú" : "Ocultar menú"}
        >
          <ChevronRight size={16} className={isSidebarCollapsed ? '' : 'rotate-180'} />
        </button>

        <div className="transp-sidebar-header" style={{ padding: isSidebarCollapsed ? '28px 12px 12px 12px' : '28px 24px 12px 24px', display: 'flex', justifyContent: 'center', minHeight: '80px', alignItems: 'center', transition: 'padding 0.3s' }}>
          <div className="transp-logo-container" style={{ 
            textAlign: 'center', 
            width: '100%',
            backgroundColor: '#ffffff',
            padding: isSidebarCollapsed ? '8px' : '12px',
            borderRadius: isSidebarCollapsed ? '10px' : '16px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), inset 0 -3px 0 rgba(226, 232, 240, 1)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            <img src="/logo_empresa.png" alt="Chavín Logo" style={{ maxWidth: isSidebarCollapsed ? '28px' : '140px', maxHeight: isSidebarCollapsed ? '28px' : '50px', objectFit: 'contain', transition: 'all 0.3s', display: 'block', margin: '0 auto' }} />
          </div>
        </div>

        <nav className="transp-sidebar-nav">
          <ul>
            <li className={activeTab === 'operacion' ? 'active' : ''} onClick={() => { window.location.hash = 'operacion'; setIsSidebarCollapsed(false); }}><Activity size={20} /> <span>Operación</span></li>
            <li className={activeTab === 'mapa' ? 'active' : ''} onClick={() => { window.location.hash = 'mapa'; setIsSidebarCollapsed(true); }}><MapPin size={20} /> <span>Mapa en Vivo</span></li>
            
            <div style={{ marginTop: '16px', marginBottom: '4px', paddingLeft: '16px', fontSize: '11px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {!isSidebarCollapsed && <span>Asignaciones</span>}
            </div>
            
            <li className={activeTab === 'asignaciones' ? 'active' : ''} onClick={() => { window.location.hash = 'asignaciones'; setIsSidebarCollapsed(false); }}><ClipboardList size={20} /> <span>Asignar Rutas</span></li>
            <li className={activeTab === 'historial' ? 'active' : ''} onClick={() => { window.location.hash = 'historial'; setIsSidebarCollapsed(false); }}><Clock size={20} /> <span>Historial Despachos</span></li>
            <li className={activeTab === 'flota' ? 'active' : ''} onClick={() => { window.location.hash = 'flota'; setIsSidebarCollapsed(false); }}><Truck size={20} /> <span>Flota</span></li>
            <li className={activeTab === 'conductores' ? 'active' : ''} onClick={() => { window.location.hash = 'conductores'; setIsSidebarCollapsed(false); }}><Users size={20} /> <span>Conductores</span></li>
            
            <div style={{ marginTop: '16px', marginBottom: '4px', paddingLeft: '16px', fontSize: '11px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {!isSidebarCollapsed && <span>Análisis</span>}
            </div>
            
            <li className={activeTab === 'reportes' ? 'active' : ''} onClick={() => { window.location.hash = 'reportes'; setIsSidebarCollapsed(false); }}><FileText size={20} /> <span>Reportes</span></li>
          </ul>
        </nav>

        <div className="transp-sidebar-footer">
          <div className="transp-user-info">
            <div className="transp-user-avatar">
              <img src="https://ui-avatars.com/api/?name=Juan+Perez&background=0D8ABC&color=fff" alt="User" />
            </div>
            <div className="transp-user-details">
              <p className="transp-user-name">Juan Pérez</p>
              <p className="transp-user-role">Transportista</p>
              <p className="transp-user-status"><span className="status-dot-green"></span> <span>En línea</span></p>
            </div>
          </div>
          <button className="transp-logout-btn" onClick={onLogout} style={{ backgroundColor: '#ef4444', color: '#ffffff', border: 'none', padding: isSidebarCollapsed ? '12px 0' : '12px', borderRadius: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontWeight: 'bold', cursor: 'pointer', transition: 'background-color 0.2s', width: '100%', marginTop: '12px', boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.2)' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#dc2626'} onMouseOut={e => e.currentTarget.style.backgroundColor = '#ef4444'}>
             {isSidebarCollapsed ? '' : <span>Cerrar Sesión</span>} <LogOut size={18} color="#fff" />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="transp-main-content">
        
        {/* Top Header - Solo visible en Operación o Mapa */}
        {(activeTab === 'operacion' || activeTab === 'mapa') && (
          <header className="cc-top-header" style={{ paddingBottom: activeTab === 'mapa' ? '0' : '24px' }}>
            {activeTab === 'operacion' && (
              <div className="cc-header-left" style={{
                 flex: 1,
                 width: '100%',
                 background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
                 padding: '24px 32px',
                 borderRadius: '20px',
                 color: '#ffffff',
                 boxShadow: '0 10px 25px -5px rgba(30, 58, 138, 0.4)',
                 display: 'flex',
                 flexDirection: 'column',
                 gap: '6px',
                 position: 'relative',
                 overflow: 'hidden'
              }}>
                {/* Destello decorativo de fondo */}
                <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(59,130,246,0.6) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%' }}></div>
                
                <p style={{ margin: 0, fontSize: '15px', color: '#93c5fd', fontWeight: '600' }}>
                  ¡Bienvenido, <strong style={{ color: '#ffffff' }}>Juan!</strong> 👋
                </p>
                <h1 style={{ margin: 0, fontSize: '32px', fontWeight: '900', letterSpacing: '-0.5px', color: '#ffffff' }}>
                   Centro de Control de <span style={{ color: '#60a5fa' }}>Transporte</span>
                </h1>
                <p style={{ margin: 0, fontSize: '14px', color: '#cbd5e1', fontWeight: '400' }}>
                   Monitoreo en tiempo real de tu flota y operaciones
                </p>
              </div>
            )}
            <div className="cc-header-right" style={{ display: 'flex', gap: '16px', alignItems: 'center', marginLeft: activeTab === 'mapa' ? '24px' : '0' }}>
               {activeTab === 'mapa' && Object.entries(truckLocations).map(([placa, data]) => (
                  <div 
                    key={placa} 
                    onClick={() => focusVehicle(placa)}
                    style={{
                       backgroundColor: '#ffffff',
                       border: '1px solid #e2e8f0',
                       borderRadius: '14px',
                       padding: '10px 18px',
                       cursor: 'pointer',
                       display: 'flex',
                       flexDirection: 'column',
                       alignItems: 'center',
                       transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                       boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                       minWidth: '110px'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.boxShadow = '0 12px 20px -5px rgba(37, 99, 235, 0.15), 0 8px 10px -6px rgba(37, 99, 235, 0.1)';
                      e.currentTarget.style.borderColor = '#93c5fd';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)';
                      e.currentTarget.style.borderColor = '#e2e8f0';
                    }}
                  >
                     <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                       <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: data.velocidad > 0 ? '#10b981' : '#f59e0b', boxShadow: data.velocidad > 0 ? '0 0 8px #10b981' : 'none' }}></span>
                       <span style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.3px' }}>{placa}</span>
                     </div>
                     <span style={{ fontSize: '11px', fontWeight: '700', color: data.velocidad > 0 ? '#2563eb' : '#64748b', backgroundColor: data.velocidad > 0 ? '#dbeafe' : '#f1f5f9', padding: '3px 10px', borderRadius: '12px' }}>
                        ETA: {data.velocidad > 0 ? getETA(placa) : 'Detenido'}
                     </span>
                  </div>
               ))}
            </div>
          </header>
        )}

        {/* Dashboard Grid Principal */}
        {activeTab === 'operacion' && (
        <div className="cc-dashboard-container">
          
          {/* Top KPIs Row */}
          <div className="cc-kpi-row">
            <div className="cc-kpi-card">
              <div className="cc-kpi-icon blue"><Navigation size={24} /></div>
              <div className="cc-kpi-info">
                <span className="cc-kpi-value">{llegadasHoyCount}</span>
                <span className="cc-kpi-label">Llegadas estimadas</span>
                <span className="cc-kpi-trend blue">En tránsito hoy</span>
              </div>
            </div>
            <div className="cc-kpi-card">
              <div className="cc-kpi-icon green"><CheckCircle size={24} /></div>
              <div className="cc-kpi-info">
                <span className="cc-kpi-value">{listosDescargaCount}</span>
                <span className="cc-kpi-label">Listos para descarga</span>
                <span className="cc-kpi-trend green">En punto de llegada</span>
              </div>
            </div>
            <div className="cc-kpi-card">
              <div className="cc-kpi-icon red"><AlertTriangle size={24} /></div>
              <div className="cc-kpi-info">
                <span className="cc-kpi-value">{criticasCount}</span>
                <span className="cc-kpi-label">Alertas Críticas</span>
                <span className="cc-kpi-trend red">Requieren atención</span>
              </div>
            </div>
            <div className="cc-kpi-card">
              <div className="cc-kpi-icon purple"><Gauge size={24} /></div>
              <div className="cc-kpi-info">
                <span className="cc-kpi-value">{avgSpeed} km/h</span>
                <span className="cc-kpi-label">Velocidad promedio</span>
                <span className="cc-kpi-trend purple">Eficiencia de ruta</span>
              </div>
            </div>
          </div>
          

          
          {/* Fila Media (Map & Alerts/Maint) */}
          <div className="cc-middle-row">
            
            {/* Mapa en tiempo real */}
            <div className="cc-panel cc-map-panel">
              <div className="cc-panel-header overlay-header">
                <h3>Mapa en tiempo real</h3>
                <div className="live-indicator"><span className="live-dot"></span> En vivo</div>
              </div>
              <div className="cc-map-container">
                <MapContainer 
                  center={[-10.7548, -77.7601]} 
                  zoom={5} 
                  style={{ height: '100%', width: '100%', background: '#091c3f', borderRadius: '16px' }}
                  zoomControl={false}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                  />
                  {/* Polyline quitado porque ya no hay simulacion */}
                  {Object.entries(truckLocations).map(([placa, data]) => {
                    const statusColor = data.velocidad < 5 ? '#f59e0b' : '#10b981';
                    const customIcon = new L.divIcon({
                      className: 'custom-truck-icon',
                      html: `<div style="background: ${statusColor}; border: 2px solid #fff; border-radius: 50%; width: 28px; height: 28px; display:flex; justify-content:center; align-items:center; box-shadow: 0 0 10px ${statusColor}80;"><span style="font-size: 12px; color:#fff">🚚</span></div>`,
                      iconSize: [28, 28],
                      iconAnchor: [14, 14],
                    });
                    return (
                      <Marker key={placa} position={[data.latitud, data.longitud]} icon={customIcon} />
                    );
                  })}
                </MapContainer>
                
                {/* Leyenda Flotante (dentro del mapa) */}
                <div className="cc-map-legend-box">
                  <h4>Estado de unidades</h4>
                  <ul>
                    <li><span className="cc-dot green"></span> En ruta <span>42</span></li>
                    <li><span className="cc-dot orange"></span> Detenidos <span>6</span></li>
                    <li><span className="cc-dot red"></span> En alerta <span>4</span></li>
                    <li><span className="cc-dot gray"></span> Sin conexión <span>2</span></li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Columna Derecha Media */}
            <div className="cc-right-col">
              {/* Alertas Activas List (Carrusel) */}
              <div className="cc-panel cc-alerts-list-panel">
                <div className="cc-panel-header">
                  <h3 className="text-blue">Alertas activas</h3>
                  {activeVehicles.length > 0 && (
                     <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)', padding: '4px 8px', borderRadius: '12px' }}>
                       Viendo: {activeVehicles[currentCarouselIndex]}
                     </span>
                  )}
                </div>
                <div className="cc-alerts-items" style={{ minHeight: '150px' }}>
                  {activeVehicles.length === 0 ? (
                    <div className="cc-alert-item" style={{justifyContent: 'center', color: '#64748b', border: 'none'}}>Esperando inicio de viajes...</div>
                  ) : (
                    (() => {
                      const currentVehicle = activeVehicles[currentCarouselIndex];
                      const vehicleAlerts = liveAlerts.filter(a => a.vehicle === currentVehicle);
                      if (vehicleAlerts.length === 0) {
                        return <div className="cc-alert-item" style={{justifyContent: 'center', color: '#64748b', border: 'none'}}>Sin alertas para {currentVehicle}</div>;
                      }
                      return vehicleAlerts.map(alert => (
                        <div key={alert.id} className={`cc-alert-item ${alert.type}`}>
                          <div className={`cc-al-icon ${alert.type === 'critical' ? 'red' : 'orange'}`}>
                            <AlertTriangle size={18}/>
                          </div>
                          <div className="cc-al-info">
                            <h4>{alert.title}</h4>
                            <p>Unidad {alert.vehicle} - {alert.detail}</p>
                          </div>
                          <div className="cc-al-meta">
                            <span className="cc-al-time">{alert.time}</span>
                            <span className={`cc-al-badge ${alert.type}`}>
                              {alert.type === 'critical' ? 'Crítica' : 'Advertencia'}
                            </span>
                          </div>
                        </div>
                      ));
                    })()
                  )}
                </div>
                {/* Indicadores del carrusel */}
                {activeVehicles.length > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', padding: '12px 0 4px 0', borderTop: '1px solid #e2e8f0' }}>
                    {activeVehicles.map((v, i) => (
                      <div key={v} style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: i === currentCarouselIndex ? '#3b82f6' : '#cbd5e1', transition: 'background 0.3s' }} />
                    ))}
                  </div>
                )}
              </div>

              {/* Contenedor de Camiones (Vehículos Registrados) */}
              <div className="cc-panel" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>VEHÍCULOS REGISTRADOS</h3>
                  <span style={{ backgroundColor: '#e2e8f0', padding: '2px 8px', borderRadius: '12px', fontSize: '10px', color: '#64748b', fontWeight: '600' }}>{Object.keys(truckLocations).length > 0 ? Object.keys(truckLocations).length : 3} unidades</span>
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', flexDirection: 'column', overflowY: 'auto' }}>
                  {['CHV-014', 'CHV-022', 'CHV-089'].map(placa => {
                    const isActive = truckLocations[placa];
                    
                    let etaText = '--';
                    let isMoving = false;
                    
                    if (isActive && isActive.velocidad > 0 && activeVehicles.includes(placa)) {
                      isMoving = true;
                      const destination = routes[placa][routes[placa].length - 1];
                      const distance = calculateDistance(isActive.latitud, isActive.longitud, destination[0], destination[1]);
                      const hoursToArrival = distance / isActive.velocidad;
                      
                      if (hoursToArrival < 1) {
                        const mins = Math.round(hoursToArrival * 60);
                        etaText = `ETA: ${mins} min`;
                      } else {
                        const hrs = Math.floor(hoursToArrival);
                        const mins = Math.round((hoursToArrival - hrs) * 60);
                        etaText = `ETA: ${hrs}h ${mins}m`;
                      }
                    }
                    
                    return (
                        <div 
                          key={placa} 
                          style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', backgroundColor: isMoving ? 'rgba(59, 130, 246, 0.1)' : '#f8fafc', border: `1px solid ${isMoving ? 'rgba(59, 130, 246, 0.2)' : '#e2e8f0'}`, borderRadius: '8px', flex: '1 1 calc(33.333% - 12px)', minWidth: '120px' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => { setSelectedTruck(placa); setActiveTab('detalle_vehiculo'); }}>
                            <div style={{ backgroundColor: isMoving ? 'rgba(59, 130, 246, 0.2)' : '#e2e8f0', padding: '6px', borderRadius: '6px' }}>
                              <Truck size={14} color={isMoving ? '#3b82f6' : '#64748b'} />
                            </div>
                            <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <div style={{ fontSize: '12px', fontWeight: '600', color: '#0f172a' }}>{placa}</div>
                                {isMoving ? (
                                  <div style={{ fontSize: '10px', color: '#10b981', fontWeight: '600' }}>{isActive.velocidad.toFixed(0)} km/h</div>
                                ) : (
                                  <div style={{ fontSize: '10px', color: '#64748b' }}>Estacionado</div>
                                )}
                              </div>
                              {isMoving && (
                                <div style={{ fontSize: '10px', fontWeight: '700', color: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.1)', padding: '2px 6px', borderRadius: '8px' }}>
                                  {etaText}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Fila Inferior */}
          <div className="cc-bottom-row">
            
            {/* Alertas por tipo (Donut) */}
            <div className="cc-panel cc-alerts-donut">
              <div className="cc-panel-header">
                <h3 className="text-blue">Alertas por tipo <span className="small-txt">(hoy)</span></h3>
              </div>
              <div className="cc-donut-container">
                <div className="cc-donut-chart">
                  <svg viewBox="0 0 36 36" className="cc-circular-chart">
                    <path className="cc-circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path className="cc-circle red" strokeDasharray="43, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path className="cc-circle orange" strokeDasharray="28, 100" strokeDashoffset="-43" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path className="cc-circle blue" strokeDasharray="18, 100" strokeDashoffset="-71" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path className="cc-circle gray" strokeDasharray="11, 100" strokeDashoffset="-89" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  </svg>
                  <div className="cc-donut-text">
                    <span className="cc-donut-value">28</span>
                    <span className="cc-donut-label">Total</span>
                  </div>
                </div>
                <div className="cc-donut-legend">
                  <div className="cc-legend-item"><span className="cc-dot red"></span> <span className="cc-val">12</span> Críticas</div>
                  <div className="cc-legend-item"><span className="cc-dot orange"></span> <span className="cc-val">8</span> Advertencias</div>
                  <div className="cc-legend-item"><span className="cc-dot blue"></span> <span className="cc-val">5</span> Informativas</div>
                  <div className="cc-legend-item"><span className="cc-dot gray"></span> <span className="cc-val">3</span> Otros</div>
                </div>
              </div>
            </div>
            


            {/* Eventos en Tiempo Real */}
            <div className="cc-panel cc-events-panel">
              <div className="cc-panel-header">
                <h3 className="text-blue">Eventos en tiempo real</h3>
                <a href="#" className="cc-link">Ver todos</a>
              </div>
              <div className="cc-events-list">
                <div className="cc-event-item">
                  <div className="cc-event-icon green"><Truck size={16} /></div>
                  <div className="cc-event-info">
                    <span className="cc-event-title">Camión CHV-024 - En ruta</span>
                    <span className="cc-event-desc">Panamá, Panamá</span>
                  </div>
                  <div className="cc-event-time">10:34 AM</div>
                </div>
                <div className="cc-event-item">
                  <div className="cc-event-icon orange"><Truck size={16} /></div>
                  <div className="cc-event-info">
                    <span className="cc-event-title">Camión CHV-056 - Detenido</span>
                    <span className="cc-event-desc">San José, Costa Rica</span>
                  </div>
                  <div className="cc-event-time">10:21 AM</div>
                </div>
                <div className="cc-event-item">
                  <div className="cc-event-icon red"><Truck size={16} /></div>
                  <div className="cc-event-info">
                    <span className="cc-event-title">Camión CHV-089 - Alerta de velocidad</span>
                    <span className="cc-event-desc">Cartagena, Colombia</span>
                  </div>
                  <div className="cc-event-time">10:15 AM</div>
                </div>
              </div>
            </div>

            {/* Actividad de la flota (Area Chart) */}
            <div className="cc-panel cc-activity-panel">
              <div className="cc-panel-header">
                <h3 className="text-blue">Actividad de la flota <span className="small-txt">(últimas 24h)</span></h3>
                <a href="#" className="cc-link">Ver reporte</a>
              </div>
              <div className="cc-line-chart-wrapper">
                <div className="cc-svg-container">
                  <svg viewBox="0 0 400 120" className="cc-area-chart" preserveAspectRatio="none">
                    <line x1="0" y1="20" x2="400" y2="20" stroke="#f1f5f9" />
                    <line x1="0" y1="50" x2="400" y2="50" stroke="#f1f5f9" />
                    <line x1="0" y1="80" x2="400" y2="80" stroke="#f1f5f9" />
                    <line x1="0" y1="110" x2="400" y2="110" stroke="#f1f5f9" />
                    
                    <path d="M0,110 L30,95 L70,85 L110,85 L150,70 L190,65 L240,20 L270,45 L320,80 L360,95 L400,105 L400,110 L0,110 Z" fill="url(#blue-grad)" />
                    <path d="M0,110 L30,95 L70,85 L110,85 L150,70 L190,65 L240,20 L270,45 L320,80 L360,95 L400,105" fill="none" stroke="#3b82f6" strokeWidth="2" />
                    
                    <circle cx="240" cy="20" r="4" fill="#fff" stroke="#3b82f6" strokeWidth="2" />
                    <rect x="230" y="2" width="20" height="12" rx="4" fill="#fff" stroke="#e2e8f0" />
                    <text x="240" y="10" fill="#3b82f6" fontSize="8" textAnchor="middle" fontWeight="bold">52</text>
                    
                    <defs>
                      <linearGradient id="blue-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(59, 130, 246, 0.4)" />
                        <stop offset="100%" stopColor="rgba(59, 130, 246, 0)" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="cc-chart-y">
                    <span>60</span><span>40</span><span>20</span><span>0</span>
                  </div>
                  <div className="cc-chart-x">
                    <span>00:00</span><span>04:00</span><span>08:00</span><span>12:00</span><span>16:00</span><span>20:00</span><span>24:00</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
        )}

        {/* Vista de Detalle de Vehículo */}
        {activeTab === 'detalle_vehiculo' && selectedTruck && (
          <div className="cc-dashboard-container">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <button 
                onClick={() => { setActiveTab('operacion'); setSelectedTruck(null); }}
                style={{ background: '#f1f5f9', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', color: '#64748b' }}
              >
                &larr; Volver al Dashboard
              </button>
              <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                Detalle de Unidad: <span style={{ color: '#3b82f6' }}>{selectedTruck}</span>
              </h2>
            </div>
            
            <div style={{ display: 'flex', gap: '24px', flexDirection: 'row', flexWrap: 'wrap' }}>
              {/* Info y KPIs del camión específico */}
              <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="cc-panel" style={{ padding: '24px' }}>
                  <h3 className="text-blue" style={{ marginBottom: '16px' }}>Estado en Tiempo Real</h3>
                  
                  {(() => {
                    const data = truckLocations[selectedTruck];
                    const isMoving = data && data.velocidad > 0 && activeVehicles.includes(selectedTruck);
                    const destination = routes[selectedTruck][routes[selectedTruck].length - 1];
                    const distance = calculateDistance(data.latitud, data.longitud, destination[0], destination[1]);
                    
                    let etaText = 'No disponible';
                    if (isMoving) {
                      const hoursToArrival = distance / data.velocidad;
                      if (hoursToArrival < 1) etaText = `${Math.round(hoursToArrival * 60)} min`;
                      else etaText = `${Math.floor(hoursToArrival)}h ${Math.round((hoursToArrival - Math.floor(hoursToArrival)) * 60)}m`;
                    }

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                          <span style={{ color: '#64748b', fontWeight: '600' }}>Velocidad Actual</span>
                          <span style={{ fontWeight: '800', color: isMoving ? '#10b981' : '#f59e0b', fontSize: '16px' }}>{data.velocidad.toFixed(0)} km/h</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                          <span style={{ color: '#64748b', fontWeight: '600' }}>ETA (Llegada)</span>
                          <span style={{ fontWeight: '800', color: '#3b82f6', fontSize: '16px' }}>{etaText}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                          <span style={{ color: '#64748b', fontWeight: '600' }}>Distancia Restante</span>
                          <span style={{ fontWeight: '800', color: '#0f172a', fontSize: '16px' }}>{distance.toFixed(1)} km</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px' }}>
                          <span style={{ color: '#64748b', fontWeight: '600' }}>Nivel de Batería</span>
                          <span style={{ fontWeight: '800', color: data.bateria > 20 ? '#10b981' : '#ef4444', fontSize: '16px' }}>{data.bateria}%</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="cc-panel" style={{ padding: '24px' }}>
                  <h3 className="text-blue" style={{ marginBottom: '16px' }}>Historial de Alertas ({selectedTruck})</h3>
                  <div className="cc-alerts-items" style={{ padding: 0 }}>
                    {liveAlerts.filter(a => a.vehicle === selectedTruck).length === 0 ? (
                      <div className="cc-alert-item" style={{justifyContent: 'center', color: '#64748b', border: 'none'}}>Sin alertas recientes</div>
                    ) : (
                      liveAlerts.filter(a => a.vehicle === selectedTruck).map(alert => (
                        <div key={alert.id} className={`cc-alert-item ${alert.type}`}>
                          <div className={`cc-al-icon ${alert.type === 'critical' ? 'red' : 'orange'}`}>
                            <AlertTriangle size={18}/>
                          </div>
                          <div className="cc-al-info" style={{ width: '100%' }}>
                            <h4>{alert.title}</h4>
                            <p>{alert.detail}</p>
                            {alert.fotoBase64 && (
                              <img src={alert.fotoBase64} alt="Incidencia" style={{ width: '100%', borderRadius: '8px', marginTop: '8px', maxHeight: '150px', objectFit: 'cover' }} />
                            )}
                          </div>
                          <div className="cc-al-meta">
                            <span className="cc-al-time">{alert.time}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Mapa grande del camión */}
              <div style={{ flex: '2 1 500px', display: 'flex', flexDirection: 'column' }}>
                <div className="cc-panel" style={{ flex: 1, padding: 0, overflow: 'hidden', minHeight: '500px' }}>
                  <MapContainer 
                    center={[truckLocations[selectedTruck].latitud, truckLocations[selectedTruck].longitud]} 
                    zoom={13} 
                    style={{ height: '100%', width: '100%', background: '#091c3f' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; OpenStreetMap contributors'
                    />
                    
                    {/* Polyline de la ruta completa (en gris) */}
                    <Polyline 
                      positions={routes[selectedTruck]} 
                      color={'rgba(255,255,255,0.4)'} 
                      weight={4} 
                      dashArray="10, 10" 
                    />

                    {/* Marcador del destino final */}
                    <Marker 
                      position={routes[selectedTruck][routes[selectedTruck].length - 1]} 
                      icon={new L.divIcon({
                        className: 'destination-icon',
                        html: `<div style="background: #ef4444; border: 2px solid #fff; border-radius: 50%; width: 20px; height: 20px; display:flex; justify-content:center; align-items:center; box-shadow: 0 0 10px #ef444480;"><span style="font-size: 10px; color:#fff">🏁</span></div>`,
                        iconSize: [20, 20],
                      })} 
                    />

                    {/* Marcador del camión */}
                    {(() => {
                      const data = truckLocations[selectedTruck];
                      const statusColor = data.velocidad < 5 ? '#f59e0b' : '#10b981';
                      const customIcon = new L.divIcon({
                        className: 'custom-truck-icon',
                        html: `<div style="background: ${statusColor}; border: 2px solid #fff; border-radius: 50%; width: 36px; height: 36px; display:flex; justify-content:center; align-items:center; box-shadow: 0 0 15px ${statusColor};"><span style="font-size: 16px; color:#fff">🚚</span></div>`,
                        iconSize: [36, 36],
                        iconAnchor: [18, 18],
                      });
                      return (
                        <Marker position={[data.latitud, data.longitud]} icon={customIcon} />
                      );
                    })()}
                  </MapContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'mapa' && (
          <div className="cc-dashboard-container" style={{ position: 'relative', height: 'calc(100vh - 100px)' }}>
            <MapContainer 
              center={mapCenter} 
              zoom={mapZoom} 
              style={{ height: '100%', width: '100%', background: '#091c3f', borderRadius: '16px' }}
            >
              <MapController center={mapCenter} zoom={mapZoom} />
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
              />
              {Object.entries(truckLocations).map(([placa, data]) => {
                const statusColor = data.velocidad < 5 ? '#f59e0b' : '#10b981';
                const customIcon = new L.divIcon({
                  className: 'custom-truck-icon',
                  html: `<div style="background: ${statusColor}; border: 2px solid #fff; border-radius: 50%; width: 36px; height: 36px; display:flex; justify-content:center; align-items:center; box-shadow: 0 0 15px ${statusColor};"><span style="font-size: 16px; color:#fff">🚚</span></div>`,
                  iconSize: [36, 36],
                  iconAnchor: [18, 18],
                });
                return (
                  <Marker key={placa} position={[data.latitud, data.longitud]} icon={customIcon}>
                    <Popup>
                       <strong style={{color: '#0f172a'}}>{placa}</strong><br/>
                       Velocidad: {data.velocidad.toFixed(0)} km/h<br/>
                       Batería: {data.bateria}%
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
        )}

        {activeTab === 'flota' && (
          <div className="cc-dashboard-container">
            <div style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#f4f7fe', margin: '0 -32px 24px -32px', padding: '24px 32px 0 32px' }}>
              <div style={{ background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)', borderRadius: '16px', padding: '24px', color: 'white', display: 'flex', alignItems: 'center', gap: '20px', boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.4)' }}>
                 <div style={{ background: 'rgba(255,255,255,0.2)', padding: '16px', borderRadius: '16px', backdropFilter: 'blur(10px)' }}><Truck size={36} /></div>
                 <div>
                    <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px' }}>Flota Registrada</h2>
                    <p style={{ margin: '6px 0 0', opacity: 0.9, fontSize: '15px', fontWeight: '500' }}>Gestión y estado en tiempo real de las unidades operativas</p>
                 </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
               {['todos', 'en-ruta', 'detenidos'].map(filter => (
                 <button 
                   key={filter}
                   onClick={() => setFleetFilter(filter)}
                   style={{ 
                     padding: '10px 20px', 
                     borderRadius: '100px', 
                     border: 'none', 
                     backgroundColor: fleetFilter === filter ? '#3b82f6' : '#e2e8f0', 
                     color: fleetFilter === filter ? '#fff' : '#475569', 
                     fontWeight: '700', 
                     fontSize: '14px',
                     cursor: 'pointer',
                     textTransform: 'capitalize',
                     transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                     boxShadow: fleetFilter === filter ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none'
                   }}
                 >
                   {filter.replace('-', ' ')}
                 </button>
               ))}
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
              {Object.entries(truckLocations)
                .filter(([placa, data]) => {
                   if (fleetFilter === 'todos') return true;
                   if (fleetFilter === 'en-ruta') return data.velocidad > 0;
                   if (fleetFilter === 'detenidos') return data.velocidad === 0;
                   return true;
                })
                .map(([placa, data]) => (
                <div key={placa} className="cc-panel" style={{ padding: '0', overflow: 'hidden', transition: 'transform 0.3s, box-shadow 0.3s', cursor: 'default' }} onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'; }} onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)'; }}>
                   {/* Header Row */}
                   <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                         <div style={{ width: '46px', height: '46px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '2px solid #fff', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                            {assignments[placa] ? (
                               <img src={`https://i.pravatar.cc/150?u=${assignments[placa].conductor}`} alt="Driver" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                               <User size={24} color="#94a3b8" />
                            )}
                         </div>
                         <div>
                            <h3 style={{ margin: 0, fontSize: '20px', color: '#0f172a', fontWeight: '900', letterSpacing: '-0.3px' }}>{placa}</h3>
                            <span style={{ fontSize: '13px', color: assignments[placa] ? '#3b82f6' : '#94a3b8', fontWeight: '600' }}>
                               {assignments[placa] ? assignments[placa].conductor : 'Sin Conductor Asignado'}
                            </span>
                            {assignments[placa] && (
                               <span style={{ display: 'block', fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                                  Ruta: {assignments[placa].ruta}
                               </span>
                            )}
                         </div>
                      </div>
                      <span style={{ backgroundColor: data.velocidad > 0 ? '#10b981' : '#f59e0b', color: '#fff', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', boxShadow: data.velocidad > 0 ? '0 0 12px rgba(16,185,129,0.4)' : 'none', letterSpacing: '0.5px' }}>
                         {data.velocidad > 0 ? 'EN RUTA' : 'DETENIDO'}
                      </span>
                   </div>
                   
                   {/* Telemetry Row */}
                   <div style={{ padding: '24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
                         <div>
                           <span style={{ color: '#64748b', fontWeight: '600', fontSize: '13px', display: 'block', marginBottom: '4px' }}>Velocidad Actual</span>
                           <span style={{ fontWeight: '900', color: '#0f172a', fontSize: '32px', lineHeight: '1' }}>{data.velocidad.toFixed(0)} <span style={{ fontSize: '16px', color: '#94a3b8', fontWeight: '700' }}>km/h</span></span>
                         </div>
                         {/* Fake Sparkline */}
                         <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '30px' }}>
                           {[...Array(8)].map((_, i) => (
                              <div key={i} style={{ width: '6px', height: data.velocidad > 0 ? `${Math.max(20, Math.random() * 100)}%` : '10%', backgroundColor: data.velocidad > 0 ? '#3b82f6' : '#cbd5e1', borderRadius: '2px', transition: 'height 0.5s', opacity: 0.2 + (i * 0.1) }}></div>
                           ))}
                         </div>
                      </div>
                      
                      {/* Batería Progress */}
                      <div style={{ marginBottom: '20px' }}>
                         <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ color: '#475569', fontWeight: '700', fontSize: '13px' }}>Batería GPS</span>
                            <span style={{ fontWeight: '800', color: data.bateria > 20 ? '#10b981' : '#ef4444', fontSize: '13px' }}>{data.bateria}%</span>
                         </div>
                         <div style={{ width: '100%', height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)' }}>
                            <div style={{ width: `${data.bateria}%`, height: '100%', backgroundColor: data.bateria > 20 ? '#10b981' : '#ef4444', transition: 'width 0.3s', borderRadius: '4px' }}></div>
                         </div>
                      </div>
                      
                      {/* Distancia Progress */}
                      <div style={{ marginBottom: '28px' }}>
                         <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ color: '#475569', fontWeight: '700', fontSize: '13px' }}>Progreso de Ruta simulada</span>
                            <span style={{ fontWeight: '800', color: '#3b82f6', fontSize: '13px' }}>{(truckDistances[placa] || 0).toFixed(1)} km</span>
                         </div>
                         <div style={{ width: '100%', height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)' }}>
                            <div style={{ width: `${Math.min(100, ((truckDistances[placa] || 0) / 100) * 100)}%`, height: '100%', backgroundColor: '#3b82f6', transition: 'width 0.3s', borderRadius: '4px' }}></div>
                         </div>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '12px' }}>
                      <button onClick={() => { setActiveTab('mapa'); focusVehicle(placa); window.location.hash = 'mapa'; }} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '2px solid #e2e8f0', backgroundColor: '#fff', color: '#0f172a', fontSize: '14px', fontWeight: '800', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }} onMouseOver={e => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.transform = 'translateY(-1px)'; }} onMouseOut={e => { e.currentTarget.style.backgroundColor = '#fff'; e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                         <MapPin size={18} color="#3b82f6" /> Mapa
                      </button>
                      <button onClick={() => { setMaintenanceVehicle(placa); window.location.hash = 'mantenimiento'; }} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '2px solid #e2e8f0', backgroundColor: '#fff', color: '#0f172a', fontSize: '14px', fontWeight: '800', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }} onMouseOver={e => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.transform = 'translateY(-1px)'; }} onMouseOut={e => { e.currentTarget.style.backgroundColor = '#fff'; e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                         <Wrench size={18} color="#f59e0b" /> Mantenimiento
                      </button>
                   </div>
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'alertas' && (
          <div className="cc-dashboard-container">
            <div style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#f4f7fe', margin: '0 -32px 24px -32px', padding: '24px 32px 0 32px' }}>
              <div style={{ background: 'linear-gradient(135deg, #b91c1c 0%, #ef4444 100%)', borderRadius: '16px', padding: '24px', color: 'white', display: 'flex', alignItems: 'center', gap: '20px', boxShadow: '0 10px 25px -5px rgba(239, 68, 68, 0.4)' }}>
                 <div style={{ background: 'rgba(255,255,255,0.2)', padding: '16px', borderRadius: '16px', backdropFilter: 'blur(10px)' }}><AlertTriangle size={36} /></div>
                 <div>
                    <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px' }}>Registro Global de Alertas</h2>
                    <p style={{ margin: '6px 0 0', opacity: 0.9, fontSize: '15px', fontWeight: '500' }}>Auditoría completa de incidencias y eventos críticos</p>
                 </div>
              </div>
            </div>
            <div className="cc-panel" style={{ padding: '0', overflow: 'hidden' }}>
               <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                     <tr>
                        <th style={{ padding: '16px', color: '#64748b', fontWeight: '700' }}>Tipo</th>
                        <th style={{ padding: '16px', color: '#64748b', fontWeight: '700' }}>Unidad</th>
                        <th style={{ padding: '16px', color: '#64748b', fontWeight: '700' }}>Título</th>
                        <th style={{ padding: '16px', color: '#64748b', fontWeight: '700' }}>Detalle</th>
                        <th style={{ padding: '16px', color: '#64748b', fontWeight: '700' }}>Hora</th>
                     </tr>
                  </thead>
                  <tbody>
                     {liveAlerts.map(alert => (
                        <tr key={alert.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                           <td style={{ padding: '16px' }}>
                              <span style={{ backgroundColor: alert.type === 'critical' ? '#fee2e2' : '#fef3c7', color: alert.type === 'critical' ? '#ef4444' : '#f59e0b', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                                 {alert.type === 'critical' ? 'CRÍTICA' : 'ADVERTENCIA'}
                              </span>
                           </td>
                           <td style={{ padding: '16px', fontWeight: '600', color: '#0f172a' }}>{alert.vehicle}</td>
                           <td style={{ padding: '16px', fontWeight: '600', color: '#3b82f6' }}>{alert.title}</td>
                           <td style={{ padding: '16px', color: '#64748b' }}>
                              {alert.detail}
                              {alert.fotoBase64 && <div style={{ marginTop: '8px' }}><img src={alert.fotoBase64} alt="foto" style={{ width: '100px', borderRadius: '4px' }}/></div>}
                           </td>
                           <td style={{ padding: '16px', color: '#64748b' }}>{alert.time}</td>
                        </tr>
                     ))}
                     {liveAlerts.length === 0 && (
                        <tr><td colSpan="5" style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>No hay alertas registradas.</td></tr>
                     )}
                  </tbody>
               </table>
            </div>
          </div>
        )}

        {activeTab === 'conductores' && (
          <div className="cc-dashboard-container">
            <div style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#f4f7fe', margin: '0 -32px 24px -32px', padding: '24px 32px 0 32px' }}>
              <div style={{ background: 'linear-gradient(135deg, #4338ca 0%, #6366f1 100%)', borderRadius: '16px', padding: '24px', color: 'white', display: 'flex', alignItems: 'center', gap: '20px', boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.4)' }}>
                 <div style={{ background: 'rgba(255,255,255,0.2)', padding: '16px', borderRadius: '16px', backdropFilter: 'blur(10px)' }}><Users size={36} /></div>
                 <div>
                    <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px' }}>Directorio de Conductores</h2>
                    <p style={{ margin: '6px 0 0', opacity: 0.9, fontSize: '15px', fontWeight: '500' }}>Perfiles, unidades asignadas y estado de conexión de la tripulación</p>
                 </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
              {[
                 { nombre: 'Carlos Prueba', dni: '33333333', placa: 'CHV-014', role: 'Conductor Principal', rating: 4.8 },
                 { nombre: 'Ana Prueba', dni: '44444444', placa: 'CHV-022', role: 'Conductora de Apoyo', rating: 4.9 },
                 { nombre: 'Luis Transporte', dni: '55555555', placa: 'CHV-089', role: 'Conductor de Ruta', rating: 4.7 }
              ].map(cond => (
                <div key={cond.dni} className="cc-panel" style={{ padding: '0', overflow: 'hidden', transition: 'transform 0.3s, box-shadow 0.3s', cursor: 'default' }} onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'; }} onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)'; }}>
                   <div style={{ height: '80px', background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)', position: 'relative' }}>
                      <div style={{ position: 'absolute', bottom: '-30px', left: '24px', width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#fff', padding: '4px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                         <img src={`https://i.pravatar.cc/150?u=${cond.placa}`} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="Avatar" />
                         <span style={{ position: 'absolute', bottom: '4px', right: '4px', width: '14px', height: '14px', backgroundColor: '#10b981', border: '2px solid #fff', borderRadius: '50%', boxShadow: '0 0 5px rgba(16,185,129,0.5)' }}></span>
                      </div>
                   </div>
                   <div style={{ padding: '40px 24px 24px 24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                         <div>
                            <h3 style={{ margin: 0, fontSize: '22px', color: '#0f172a', fontWeight: '900', letterSpacing: '-0.5px' }}>{cond.nombre}</h3>
                            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '14px', fontWeight: '500' }}>{cond.role}</p>
                         </div>
                         <div style={{ backgroundColor: '#fef3c7', padding: '6px 12px', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ color: '#d97706' }}>★</span>
                            <span style={{ color: '#92400e', fontWeight: '800', fontSize: '13px' }}>{cond.rating}</span>
                         </div>
                      </div>
                      
                      <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                         <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
                            <span style={{ color: '#64748b', fontSize: '13px', fontWeight: '600' }}>Documento de Identidad</span>
                            <span style={{ color: '#0f172a', fontSize: '14px', fontWeight: '700' }}>DNI {cond.dni}</span>
                         </div>
                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#64748b', fontSize: '13px', fontWeight: '600' }}>Unidad Asignada</span>
                            <span style={{ backgroundColor: '#eff6ff', color: '#2563eb', padding: '6px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '800', border: '1px solid #bfdbfe' }}>{cond.placa}</span>
                         </div>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
                         <button style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: '#3b82f6', color: '#fff', fontWeight: '700', cursor: 'pointer', transition: 'background-color 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#2563eb'} onMouseOut={e => e.currentTarget.style.backgroundColor = '#3b82f6'}>Ver Perfil</button>
                         <button style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', backgroundColor: '#fff', color: '#475569', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.borderColor = '#94a3b8'; }} onMouseOut={e => { e.currentTarget.style.backgroundColor = '#fff'; e.currentTarget.style.borderColor = '#cbd5e1'; }}>Contactar</button>
                      </div>
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'mantenimiento' && (
          <div className="cc-dashboard-container">
            <div style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#f4f7fe', margin: '0 -32px 24px -32px', padding: '24px 32px 0 32px' }}>
              <div style={{ background: 'linear-gradient(135deg, #047857 0%, #10b981 100%)', borderRadius: '16px', padding: '24px', color: 'white', display: 'flex', alignItems: 'center', gap: '20px', boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4)' }}>
                 <div style={{ background: 'rgba(255,255,255,0.2)', padding: '16px', borderRadius: '16px', backdropFilter: 'blur(10px)' }}><Wrench size={36} /></div>
                 <div>
                    <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px' }}>Mantenimiento Predictivo</h2>
                    <p style={{ margin: '6px 0 0', opacity: 0.9, fontSize: '15px', fontWeight: '500' }}>Seguimiento inteligente del desgaste y servicios preventivos</p>
                 </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '24px' }}>
              {Object.entries(truckLocations)
                .filter(([placa]) => !maintenanceVehicle || placa === maintenanceVehicle)
                .map(([placa]) => {
                const distance = truckDistances[placa] || 0;
                const limit = 500;
                const percentage = Math.min((distance / limit) * 100, 100);
                const isWarning = distance >= limit * 0.85; // Warning at 85%
                const isCritical = distance >= limit;
                
                const progressColor = isCritical ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981';
                const bgColor = isCritical ? '#fee2e2' : isWarning ? '#fef3c7' : '#d1fae5';
                
                return (
                   <div key={placa} className="cc-panel" style={{ padding: '0', overflow: 'hidden', transition: 'transform 0.3s, box-shadow 0.3s', cursor: 'default' }} onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'; }} onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)'; }}>
                      <div style={{ padding: '24px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                               <Truck size={24} color="#64748b" />
                            </div>
                            <div>
                               <h3 style={{ margin: 0, fontSize: '22px', color: '#0f172a', fontWeight: '900', letterSpacing: '-0.5px' }}>{placa}</h3>
                               <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '13px', fontWeight: '600' }}>Tractocamión Volvo FH</p>
                            </div>
                         </div>
                         <div style={{ backgroundColor: bgColor, color: progressColor, padding: '10px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 15px ${bgColor}` }}>
                            <Wrench size={20} />
                         </div>
                      </div>
                      
                      <div style={{ padding: '24px' }}>
                         {maintenanceVehicle && (
                            <button onClick={() => setMaintenanceVehicle(null)} style={{ marginBottom: '16px', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#fff', color: '#475569', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                               ← Volver a todos
                            </button>
                         )}
                         <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#0f172a', fontWeight: '800' }}>Desgaste de Componentes</h4>
                         
                         <div style={{ marginBottom: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                               <span style={{ color: '#475569', fontWeight: '700', fontSize: '14px' }}>Detección de Aceite y Filtros</span>
                               <span style={{ fontWeight: '800', color: progressColor, fontSize: '14px' }}>{distance.toFixed(0)} / {limit} km</span>
                            </div>
                            <div style={{ width: '100%', height: '10px', backgroundColor: '#f1f5f9', borderRadius: '5px', overflow: 'hidden', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)' }}>
                               <div style={{ width: `${percentage}%`, height: '100%', backgroundColor: progressColor, transition: 'width 0.3s', borderRadius: '5px' }}></div>
                            </div>
                         </div>

                         <div style={{ marginBottom: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                               <span style={{ color: '#475569', fontWeight: '700', fontSize: '14px' }}>Nivel de Refrigerante</span>
                               <span style={{ fontWeight: '800', color: '#10b981', fontSize: '14px' }}>85% (Óptimo)</span>
                            </div>
                            <div style={{ width: '100%', height: '10px', backgroundColor: '#f1f5f9', borderRadius: '5px', overflow: 'hidden', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)' }}>
                               <div style={{ width: `85%`, height: '100%', backgroundColor: '#10b981', transition: 'width 0.3s', borderRadius: '5px' }}></div>
                            </div>
                         </div>
                         
                         <div style={{ marginBottom: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                               <span style={{ color: '#475569', fontWeight: '700', fontSize: '14px' }}>Desgaste de Frenos (Pastillas)</span>
                               <span style={{ fontWeight: '800', color: '#f59e0b', fontSize: '14px' }}>Requiere revisión pronta</span>
                            </div>
                            <div style={{ width: '100%', height: '10px', backgroundColor: '#f1f5f9', borderRadius: '5px', overflow: 'hidden', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)' }}>
                               <div style={{ width: `70%`, height: '100%', backgroundColor: '#f59e0b', transition: 'width 0.3s', borderRadius: '5px' }}></div>
                            </div>
                         </div>

                         <div style={{ marginBottom: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                               <span style={{ color: '#475569', fontWeight: '700', fontSize: '14px' }}>Presión de Neumáticos</span>
                               <span style={{ fontWeight: '800', color: '#10b981', fontSize: '14px' }}>Óptima (110 psi)</span>
                            </div>
                            <div style={{ width: '100%', height: '10px', backgroundColor: '#f1f5f9', borderRadius: '5px', overflow: 'hidden', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)' }}>
                               <div style={{ width: `95%`, height: '100%', backgroundColor: '#10b981', transition: 'width 0.3s', borderRadius: '5px' }}></div>
                            </div>
                         </div>
                         
                         {isCritical ? (
                            <div style={{ backgroundColor: '#fee2e2', border: '1px solid #fecaca', padding: '16px', borderRadius: '12px', color: '#b91c1c', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                               <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                               <div>
                                  <strong style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>Mantenimiento Urgente</strong>
                                  <span style={{ fontSize: '13px', opacity: 0.9 }}>Límite superado. Programe su entrada al taller inmediatamente para evitar daños.</span>
                               </div>
                            </div>
                         ) : isWarning ? (
                            <div style={{ backgroundColor: '#fef3c7', border: '1px solid #fde68a', padding: '16px', borderRadius: '12px', color: '#b45309', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                               <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                               <div>
                                  <strong style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>Mantenimiento Próximo</strong>
                                  <span style={{ fontSize: '13px', opacity: 0.9 }}>La unidad está al {percentage.toFixed(0)}% del límite de servicio. Empiece a planificar.</span>
                               </div>
                            </div>
                         ) : (
                            <div style={{ backgroundColor: '#f8fafc', border: '1px dashed #cbd5e1', padding: '16px', borderRadius: '12px', color: '#64748b', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                               <span style={{ fontSize: '13px', fontWeight: '600' }}>Todos los componentes operando normalmente</span>
                            </div>
                         )}
                         
                         <button style={{ width: '100%', marginTop: '20px', padding: '14px', borderRadius: '12px', border: 'none', backgroundColor: isCritical ? '#ef4444' : '#0f172a', color: '#fff', fontSize: '15px', fontWeight: '800', cursor: 'pointer', transition: 'background-color 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = isCritical ? '#dc2626' : '#1e293b'} onMouseOut={e => e.currentTarget.style.backgroundColor = isCritical ? '#ef4444' : '#0f172a'}>
                            Agendar Servicio en Taller
                         </button>
                      </div>
                   </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'asignaciones' && (
          <div className="cc-dashboard-container">
            <div style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#f4f7fe', margin: '0 -32px 24px -32px', padding: '16px 32px 0 32px' }}>
              <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', borderRadius: '16px', padding: '20px 24px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.4), inset 0 1px 0 rgba(255,255,255,0.1)', position: 'relative', overflow: 'hidden' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '16px', zIndex: 1 }}>
                    <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.4) 0%, rgba(59,130,246,0.1) 100%)', padding: '12px', borderRadius: '14px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}><ClipboardList size={32} color="#c7d2fe" /></div>
                    <div>
                       <h2 style={{ margin: 0, fontSize: '26px', fontWeight: '900', letterSpacing: '-0.5px', background: 'linear-gradient(to right, #ffffff, #a5b4fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Centro de Control Logístico</h2>
                       <p style={{ margin: '4px 0 0', opacity: 0.8, fontSize: '14px', fontWeight: '500', color: '#e2e8f0' }}>Gestión avanzada de rutas, flota y despacho de unidades</p>
                    </div>
                 </div>
                 <div style={{ position: 'absolute', top: -30, right: -30, width: 150, height: 150, background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, rgba(99,102,241,0) 70%)', borderRadius: '50%' }}></div>
              </div>
            </div>

            {asigSuccess ? (
               <div className="cc-panel" style={{ padding: '60px', textAlign: 'center', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0' }}>
                  <div style={{ width: '80px', height: '80px', backgroundColor: '#10b981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto', boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4)' }}>
                     <CheckCircle size={40} color="white" />
                  </div>
                  <h3 style={{ color: '#065f46', fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>¡Despacho Confirmado!</h3>
                  <p style={{ color: '#059669', fontSize: '16px', marginBottom: '32px' }}>La unidad {asigData.vehiculo} ha sido asignada a la ruta "{asigData.ruta}" con el conductor {asigData.conductor}.</p>
                  <button onClick={() => { setAsigSuccess(false); setAsigData({ ruta: '', conductor: '', vehiculo: ''}); }} style={{ padding: '14px 32px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)' }}>Crear Nueva Asignación</button>
               </div>
            ) : (
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  <div className="cc-panel" style={{ padding: '40px', background: '#ffffff', borderRadius: '24px', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08)', border: '1px solid #f1f5f9' }}>
                     <h3 style={{ margin: '0 0 32px 0', fontSize: '22px', color: '#0f172a', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ padding: '10px', background: '#eff6ff', borderRadius: '12px' }}><Map size={24} color="#2563eb" /></div> Detalles de la Ruta
                     </h3>
                     <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', color: '#475569', fontWeight: '700', marginBottom: '8px' }}>Seleccionar Ruta Predefinida</label>
                        <select value={asigData.ruta} onChange={e => {
                              const newRuta = e.target.value;
                              setAsigData({...asigData, ruta: newRuta, clienteDestino: newRuta ? 'Almacén Casma' : ''});
                           }} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontSize: '15px', color: '#0f172a', outline: 'none' }}>
                           <option value="">-- Seleccione una ruta --</option>
                           <option value="Lima - Casma (Norte)">Lima - Casma (Ruta Norte)</option>
                           <option value="Piura - Casma (Norte)">Piura - Casma (Ruta Norte)</option>
                           <option value="Arequipa - Casma (Sur)">Arequipa - Casma (Ruta Sur)</option>
                           <option value="Callao - Casma (Centro)">Callao - Casma (Ruta Centro)</option>
                        </select>
                     </div>
                     <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                           <label style={{ display: 'block', color: '#475569', fontWeight: '700', marginBottom: '8px' }}>Punto de Recojo</label>
                           <input type="text" value={asigData.puntoRecojo} onChange={e => setAsigData({...asigData, puntoRecojo: e.target.value})} placeholder="Ej: Almacén Callao" style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontSize: '15px' }} />
                        </div>
                        <div>
                           <label style={{ display: 'block', color: '#475569', fontWeight: '700', marginBottom: '8px' }}>Cliente Destino</label>
                           <input type="text" value={asigData.clienteDestino} onChange={e => setAsigData({...asigData, clienteDestino: e.target.value})} placeholder="Ej: Distribuidora Sur" style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontSize: '15px' }} />
                        </div>
                     </div>
                     <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '20px' }}>
                        <div>
                           <label style={{ display: 'block', color: '#475569', fontWeight: '700', marginBottom: '8px' }}>Tipo de Carga</label>
                           <select value={asigData.tipoCarga} onChange={e => setAsigData({...asigData, tipoCarga: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontSize: '15px', color: '#0f172a', outline: 'none' }}>
                              <option value="">-- Seleccione --</option>
                              <option value="Seca">Carga Seca General</option>
                              <option value="Refrigerada">Refrigerada / Perecible</option>
                              <option value="Peligrosa">Materiales Peligrosos (MATPEL)</option>
                              <option value="Pesada">Maquinaria Pesada</option>
                           </select>
                        </div>
                        <div>
                           <label style={{ display: 'block', color: '#475569', fontWeight: '700', marginBottom: '8px' }}>Peso (Ton.) y Volumen</label>
                           <input type="text" value={asigData.peso} onChange={e => setAsigData({...asigData, peso: e.target.value})} placeholder="Ej: 28 Toneladas" style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontSize: '15px' }} />
                        </div>
                     </div>
                     <div style={{ marginTop: '20px' }}>
                        <label style={{ display: 'block', color: '#475569', fontWeight: '700', marginBottom: '8px' }}>Guía de Remisión (Adjuntar PDF)</label>
                        <div style={{ display: 'flex', gap: '16px' }}>
                           <input type="text" value={asigData.guia} onChange={e => setAsigData({...asigData, guia: e.target.value})} placeholder="N° GR-001-492837" style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontSize: '15px' }} />
                           <input type="file" accept="application/pdf" onChange={e => {
                               const file = e.target.files[0];
                               if (file) {
                                  const reader = new FileReader();
                                  reader.onload = ev => setAsigData({...asigData, guiaPdfBase64: ev.target.result});
                                  reader.readAsDataURL(file);
                               }
                           }} style={{ padding: '10px', borderRadius: '12px', border: '1px dashed #3b82f6', backgroundColor: '#eff6ff', fontSize: '14px', color: '#1d4ed8', flex: 1, cursor: 'pointer' }} />
                        </div>
                     </div>
                      {asigData.ruta && (
                         <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ backgroundColor: '#f97316', padding: '10px', borderRadius: '10px' }}><Battery size={24} color="white" /></div>
                            <div>
                               <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#ea580c', fontWeight: '800', textTransform: 'uppercase' }}>Estimación de Combustible</p>
                               <p style={{ margin: 0, fontSize: '16px', color: '#9a3412', fontWeight: '600' }}>
                                  {asigData.ruta === 'Lima - Casma (Norte)' ? '60 Galones - Aprox. S/ 900' : 
                                   asigData.ruta === 'Piura - Casma (Norte)' ? '110 Galones - Aprox. S/ 1,650' : 
                                   asigData.ruta === 'Arequipa - Casma (Sur)' ? '160 Galones - Aprox. S/ 2,400' : 
                                   asigData.ruta === 'Callao - Casma (Centro)' ? '65 Galones - Aprox. S/ 975' : ''}
                               </p>
                            </div>
                         </div>
                      )}
                  </div>

                  <div className="cc-panel" style={{ padding: '40px', background: '#ffffff', borderRadius: '24px', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08)', border: '1px solid #f1f5f9' }}>
                     <h3 style={{ margin: '0 0 32px 0', fontSize: '22px', color: '#0f172a', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ padding: '10px', background: '#f5f3ff', borderRadius: '12px' }}><Truck size={24} color="#7c3aed" /></div> Unidad y Conductor
                     </h3>
                     <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', color: '#475569', fontWeight: '700', marginBottom: '8px' }}>Asignar Tractocamión</label>
                        <select value={asigData.vehiculo} onChange={e => setAsigData({...asigData, vehiculo: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontSize: '15px', color: '#0f172a', outline: 'none' }}>
                           <option value="">-- Seleccione una unidad disponible --</option>
                           <option value="CHV-014">CHV-014 (Volvo FH - Disponible)</option>
                           <option value="CHV-022">CHV-022 (Volvo FH - Disponible)</option>
                           <option value="CHV-089">CHV-089 (Scania R - Mantenimiento Próximo)</option>
                        </select>
                     </div>
                     <div style={{ marginBottom: '32px' }}>
                        <label style={{ display: 'block', color: '#475569', fontWeight: '700', marginBottom: '8px' }}>Designar Conductor Principal</label>
                        <select value={asigData.conductor} onChange={e => setAsigData({...asigData, conductor: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontSize: '15px', color: '#0f172a', outline: 'none' }}>
                           <option value="">-- Seleccione un conductor --</option>
                           <option value="Carlos Prueba">Carlos Prueba (Licencia A3C - Vigente)</option>
                           <option value="Ana Prueba">Ana Prueba (Licencia A3C - Vigente)</option>
                           <option value="Luis Transporte">Luis Transporte (Licencia A3C - Vigente)</option>
                        </select>
                     </div>
                     <button 
                        onClick={() => { 
                           if(asigData.ruta && asigData.vehiculo && asigData.conductor) {
                              setAssignments(prev => ({
                                 ...prev,
                                 [asigData.vehiculo]: { conductor: asigData.conductor, ruta: asigData.ruta }
                              }));
                              setAssignmentHistory(prev => [...prev, { ...asigData, fecha: new Date().toLocaleString() }]);
                              
                              // Informar al backend
                              fetch('http://localhost:5051/api/tracking/assign', {
                                 method: 'POST',
                                 headers: { 'Content-Type': 'application/json' },
                                 body: JSON.stringify({
                                     vehiculo: asigData.vehiculo,
                                     conductor: asigData.conductor,
                                     ruta: asigData.ruta,
                                     tipoCarga: asigData.tipoCarga,
                                     peso: asigData.peso,
                                     guia: asigData.guia,
                                     puntoRecojo: asigData.puntoRecojo,
                                     clienteDestino: asigData.clienteDestino,
                                     guiaPdfBase64: asigData.guiaPdfBase64
                                  })
                               }).catch(err => console.error("Error asignando:", err));
 
                               setAsigSuccess(true);
                            } else {
                               alert('Complete todos los campos obligatorios');
                            }
                         }} 
                         style={{ width: '100%', padding: '20px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '16px', fontSize: '18px', fontWeight: '900', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.5)' }}
                         onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(16, 185, 129, 0.6)'; }}
                         onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(16, 185, 129, 0.5)'; }}
                      >
                         Confirmar Despacho Logístico <Navigation size={24} />
                      </button>
                  </div>
               </div>
            )}
          </div>
        )}

        {activeTab === 'historial' && (
          <div className="cc-dashboard-container">
            <div style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#f4f7fe', margin: '0 -32px 24px -32px', padding: '16px 32px 0 32px' }}>
              <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', borderRadius: '16px', padding: '20px 24px', color: 'white', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.4), inset 0 1px 0 rgba(255,255,255,0.1)' }}>
                 <div style={{ background: 'rgba(255,255,255,0.1)', padding: '12px', borderRadius: '14px' }}><Clock size={32} color="#cbd5e1" /></div>
                 <div>
                    <h2 style={{ margin: 0, fontSize: '26px', fontWeight: '900', letterSpacing: '-0.5px' }}>Historial de Despachos</h2>
                    <p style={{ margin: '4px 0 0', opacity: 0.8, fontSize: '14px', color: '#cbd5e1' }}>Bitácora completa de asignaciones realizadas</p>
                 </div>
              </div>
            </div>

            <div className="cc-panel" style={{ padding: '32px', backgroundColor: '#fff', borderRadius: '24px', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08)' }}>
               {assignmentHistory.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 0' }}>
                     <Clock size={48} color="#cbd5e1" style={{ marginBottom: '16px' }} />
                     <p style={{ color: '#64748b', fontSize: '18px', fontWeight: '600' }}>No hay despachos registrados aún.</p>
                  </div>
               ) : (
                  <div style={{ overflowX: 'auto' }}>
                     <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                           <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                              <th style={{ padding: '16px 12px', fontWeight: '800' }}>Fecha / Hora</th>
                              <th style={{ padding: '16px 12px', fontWeight: '800' }}>Unidad</th>
                              <th style={{ padding: '16px 12px', fontWeight: '800' }}>Conductor</th>
                              <th style={{ padding: '16px 12px', fontWeight: '800' }}>Ruta Asignada</th>
                              <th style={{ padding: '16px 12px', fontWeight: '800' }}>Carga y Peso</th>
                              <th style={{ padding: '16px 12px', fontWeight: '800' }}>Guía de Remisión</th>
                              <th style={{ padding: '16px 12px', fontWeight: '800', textAlign: 'center' }}>Acciones</th>
                           </tr>
                        </thead>
                        <tbody>
                           {assignmentHistory.slice().reverse().map((item, i) => (
                              <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor='#f8fafc'} onMouseOut={e => e.currentTarget.style.backgroundColor='transparent'}>
                                 <td style={{ padding: '16px 12px', color: '#0f172a', fontWeight: '500' }}>{item.fecha}</td>
                                 <td style={{ padding: '16px 12px' }}><span style={{ backgroundColor: '#eff6ff', color: '#3b82f6', padding: '6px 12px', borderRadius: '8px', fontWeight: '800', fontSize: '14px' }}>{item.vehiculo}</span></td>
                                 <td style={{ padding: '16px 12px', color: '#334155', fontWeight: '600' }}>{item.conductor}</td>
                                 <td style={{ padding: '16px 12px', color: '#334155' }}>{item.ruta}</td>
                                 <td style={{ padding: '16px 12px', color: '#475569' }}>{item.tipoCarga || '-'} {item.peso ? `(${item.peso})` : ''}</td>
                                 <td style={{ padding: '16px 12px', color: '#64748b' }}>{item.guia || '-'}</td>
                                 <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                                    <button onClick={() => setSelectedHistoryItem(item)} style={{ padding: '8px', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', transition: 'all 0.2s' }} onMouseOver={e => { e.currentTarget.style.backgroundColor='#e2e8f0'; e.currentTarget.style.color='#0f172a'; }} onMouseOut={e => { e.currentTarget.style.backgroundColor='#f1f5f9'; e.currentTarget.style.color='#64748b'; }}>
                                       <Eye size={18} />
                                    </button>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               )}
            </div>

            {selectedHistoryItem && (
               <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fade-in 0.2s ease-out' }}>
                  <div style={{ backgroundColor: '#ffffff', borderRadius: '24px', width: '90%', maxWidth: '600px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                     <div style={{ padding: '24px 32px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                           <div style={{ backgroundColor: '#e0e7ff', padding: '10px', borderRadius: '12px' }}><ClipboardList size={24} color="#4f46e5" /></div>
                           <div>
                              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>Detalles del Despacho</h3>
                              <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#64748b', fontWeight: '500' }}>{selectedHistoryItem.fecha}</p>
                           </div>
                        </div>
                        <button onClick={() => setSelectedHistoryItem(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }} onMouseOver={e => e.currentTarget.style.backgroundColor='#f1f5f9'} onMouseOut={e => e.currentTarget.style.backgroundColor='transparent'}>
                           <X size={24} />
                        </button>
                     </div>
                     <div style={{ padding: '32px', flex: 1, overflowY: 'auto' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                           <div style={{ backgroundColor: '#f1f5f9', padding: '16px', borderRadius: '16px' }}>
                              <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Unidad Asignada</p>
                              <p style={{ margin: 0, fontSize: '18px', color: '#0f172a', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px' }}><Truck size={18} color="#3b82f6" /> {selectedHistoryItem.vehiculo}</p>
                           </div>
                           <div style={{ backgroundColor: '#f1f5f9', padding: '16px', borderRadius: '16px' }}>
                              <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Conductor</p>
                              <p style={{ margin: 0, fontSize: '16px', color: '#0f172a', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}><Users size={18} color="#10b981" /> {selectedHistoryItem.conductor}</p>
                           </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                           <div>
                              <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#64748b', fontWeight: '700' }}>Punto de Recojo</p>
                              <p style={{ margin: 0, fontSize: '15px', color: '#0f172a', fontWeight: '600' }}>{selectedHistoryItem.puntoRecojo || '-'}</p>
                           </div>
                           <div>
                              <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#64748b', fontWeight: '700' }}>Cliente Destino</p>
                              <p style={{ margin: 0, fontSize: '15px', color: '#0f172a', fontWeight: '600' }}>{selectedHistoryItem.clienteDestino || '-'}</p>
                           </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                           <div>
                              <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#64748b', fontWeight: '700' }}>Tipo de Carga</p>
                              <p style={{ margin: 0, fontSize: '15px', color: '#0f172a', fontWeight: '600' }}>{selectedHistoryItem.tipoCarga || '-'}</p>
                           </div>
                           <div>
                              <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#64748b', fontWeight: '700' }}>Peso (Ton.) y Volumen</p>
                              <p style={{ margin: 0, fontSize: '15px', color: '#0f172a', fontWeight: '600' }}>{selectedHistoryItem.peso || '-'}</p>
                           </div>
                        </div>
                        <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                           <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#64748b', fontWeight: '700' }}>Guía de Remisión Adjunta</p>
                           <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <p style={{ margin: 0, fontSize: '16px', color: '#0f172a', fontWeight: '800' }}>{selectedHistoryItem.guia || 'Sin Guía'}</p>
                              {selectedHistoryItem.guiaPdfBase64 && (
                                 <button onClick={() => {
                                    const newWindow = window.open();
                                    newWindow.document.write(`<iframe src="${selectedHistoryItem.guiaPdfBase64}" width="100%" height="100%" style="border:none;"></iframe>`);
                                 }} style={{ padding: '8px 16px', backgroundColor: '#e2e8f0', color: '#0f172a', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <FileText size={16} /> Ver PDF
                                 </button>
                              )}
                           </div>
                        </div>
                     </div>
                     <div style={{ padding: '24px 32px', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                        <button onClick={() => setSelectedHistoryItem(null)} style={{ width: '100%', padding: '14px', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '800', cursor: 'pointer' }}>
                           Cerrar Detalles
                        </button>
                     </div>
                  </div>
               </div>
            )}
          </div>
        )}

        {activeTab === 'reportes' && (
          <div className="cc-dashboard-container">
            <div style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#f4f7fe', margin: '0 -32px 24px -32px', padding: '24px 32px 0 32px' }}>
              <div style={{ background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)', borderRadius: '16px', padding: '24px', color: 'white', display: 'flex', alignItems: 'center', gap: '20px', boxShadow: '0 10px 25px -5px rgba(245, 158, 11, 0.4)' }}>
                 <div style={{ background: 'rgba(255,255,255,0.2)', padding: '16px', borderRadius: '16px', backdropFilter: 'blur(10px)' }}><Calendar size={36} /></div>
                 <div>
                    <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px' }}>Reportes y Analítica</h2>
                    <p style={{ margin: '6px 0 0', opacity: 0.9, fontSize: '15px', fontWeight: '500' }}>Visualiza estadísticas globales y exporta la data operacional</p>
                 </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px' }}>
               <div className="cc-panel" style={{ padding: '24px' }}>
                  <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#0f172a', fontWeight: '800' }}>Rendimiento Semanal de Viajes</h3>
                  <div style={{ height: '250px', width: '100%' }}>
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[
                           { name: 'Lun', viajes: 4 }, { name: 'Mar', viajes: 7 }, { name: 'Mié', viajes: 5 },
                           { name: 'Jue', viajes: 9 }, { name: 'Vie', viajes: 12 }, { name: 'Sáb', viajes: 3 }, { name: 'Dom', viajes: 2 }
                        ]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                           <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13, fontWeight: 600 }} dy={10} />
                           <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13, fontWeight: 600 }} />
                           <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                           <Bar dataKey="viajes" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
                        </BarChart>
                     </ResponsiveContainer>
                  </div>
               </div>
               <div className="cc-panel" style={{ padding: '24px' }}>
                  <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#0f172a', fontWeight: '800' }}>Estado de la Flota</h3>
                  <div style={{ height: '250px', width: '100%', position: 'relative' }}>
                     <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                           <Pie data={[
                              { name: 'En Ruta', value: 3, color: '#10b981' },
                              { name: 'Detenidos', value: 1, color: '#f59e0b' },
                              { name: 'Mantenimiento', value: 1, color: '#ef4444' }
                           ]} cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={5} dataKey="value">
                              {
                                 [
                                    { name: 'En Ruta', value: 3, color: '#10b981' },
                                    { name: 'Detenidos', value: 1, color: '#f59e0b' },
                                    { name: 'Mantenimiento', value: 1, color: '#ef4444' }
                                 ].map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                                 ))
                              }
                           </Pie>
                           <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                        </PieChart>
                     </ResponsiveContainer>
                     <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                        <span style={{ display: 'block', fontSize: '32px', fontWeight: '900', color: '#0f172a', lineHeight: '1' }}>5</span>
                        <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '700' }}>Unidades</span>
                     </div>
                  </div>
               </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
               <div className="cc-panel" style={{ padding: '40px 32px', textAlign: 'center', transition: 'transform 0.3s', cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
                  <div style={{ width: '80px', height: '80px', backgroundColor: '#fee2e2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto' }}>
                     <FileText size={36} color="#ef4444" />
                  </div>
                  <h3 style={{ fontSize: '22px', color: '#0f172a', fontWeight: '800', marginBottom: '8px' }}>Rendimiento de Flota</h3>
                  <p style={{ color: '#64748b', fontSize: '15px', marginBottom: '32px' }}>Documento formal en PDF con métricas de combustible, viajes e incidentes de todas las unidades.</p>
                  <button onClick={generarPDF} style={{ padding: '14px 24px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.3)' }}>
                     <Download size={18} /> Descargar PDF Oficial
                  </button>
               </div>

               <div className="cc-panel" style={{ padding: '40px 32px', textAlign: 'center', transition: 'transform 0.3s', cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
                  <div style={{ width: '80px', height: '80px', backgroundColor: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto' }}>
                     <Users size={36} color="#10b981" />
                  </div>
                  <h3 style={{ fontSize: '22px', color: '#0f172a', fontWeight: '800', marginBottom: '8px' }}>Asistencias y Horas</h3>
                  <p style={{ color: '#64748b', fontSize: '15px', marginBottom: '32px' }}>Plantilla en formato Excel con el consolidado de horas conducidas y calificaciones del personal.</p>
                  <button onClick={generarExcel} style={{ padding: '14px 24px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)' }}>
                     <Download size={18} /> Exportar Excel Completo
                  </button>
               </div>
            </div>
          </div>
        )}
      </main>
    </div>
    </>
  );
}
