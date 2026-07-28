import React, { useState, useEffect, useRef } from 'react';
import {
  Package, LayoutDashboard, Grid, ArrowDownToLine, ArrowUpFromLine,
  ClipboardList, FileText, Search, Plus, MapPin, CheckCircle,
  AlertTriangle, ScanLine, Printer, Download, LogOut, Menu, RefreshCcw, Truck, Maximize, Eye, MousePointer2, Type, Camera, X, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Trash2, Edit
} from 'lucide-react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Html5Qrcode } from 'html5-qrcode';

// Componente para el escáner de cámara
function QRScannerWidget({ onScanSuccess }) {
  const onScanSuccessRef = useRef(onScanSuccess);
  
  useEffect(() => {
    onScanSuccessRef.current = onScanSuccess;
  }, [onScanSuccess]);

  useEffect(() => {
    // Parche temporal nivel DOM para atrapar el AbortError en su origen.
    // Vite intercepta unhandledrejections, así que debemos capturarlo antes de que se vuelva "unhandled".
    const originalPlay = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function() {
      return originalPlay.apply(this, arguments).catch(err => {
        if (err.name === 'AbortError') return;
        throw err;
      });
    };

    let unmounted = false;
    const scanner = new Html5Qrcode("qr-reader-recepcion");
    
    let isScanned = false;
    
    scanner.start(
      { facingMode: "environment" }, // Usa la cámara trasera o por defecto automáticamente
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => {
        if (unmounted || isScanned) return;
        isScanned = true;
        if (onScanSuccessRef.current) {
          onScanSuccessRef.current(decodedText);
        }
        setTimeout(() => { isScanned = false; }, 2000); // Pausa de 2 segundos antes del siguiente escaneo
      },
      (errorMessage) => {
        // Errores de lectura ignorados
      }
    ).then(() => {
      if (unmounted) {
        scanner.stop().then(() => scanner.clear()).catch(() => {});
      }
    }).catch(err => {
      if (!unmounted) console.error("Error al iniciar cámara:", err);
    });

    return () => {
      unmounted = true;
      HTMLMediaElement.prototype.play = originalPlay; // Restaurar
      if (scanner.isScanning) {
        scanner.stop().then(() => scanner.clear()).catch(() => {});
      }
    };
  }, []);

  return <div id="qr-reader-recepcion" style={{ width: '100%', maxWidth: '400px', margin: '0 auto', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', background: '#000', minHeight: '300px' }}></div>;
}

import './DashboardAlmacen.css';

export default function DashboardAlmacen({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [globalBoxConfigs, setGlobalBoxConfigs] = useState({});
  const [globalPositions, setGlobalPositions] = useState({
    desk: { right: 30, bottom: -20 },
    truck: { left: 0, top: 0 }
  });
  const [globalBanners, setGlobalBanners] = useState([
    { id: 'banner_porton', text: 'PORTÓN ENTRADA', bgColor: '#3b82f6', textColor: '#ffffff', right: 15, top: 60, height: 250 },
    { id: 'banner_despacho', text: 'VENTANA DESPACHO', bgColor: '#f59e0b', textColor: '#ffffff', right: 15, top: 450, height: 150 }
  ]);
  const [globalRackConfigs, setGlobalRackConfigs] = useState({});
  const [modalConfig, setModalConfig] = useState(null);

  const showModal = (title, message, type = 'alert', onConfirm = null) => {
    setModalConfig({ title, message, type, onConfirm });
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <ViewDashboard />;
      case 'mapeo':
        return <ViewMapeo setIsSidebarOpen={setIsSidebarOpen} globalBoxConfigs={globalBoxConfigs} globalPositions={globalPositions} globalBanners={globalBanners} globalRackConfigs={globalRackConfigs} showModal={showModal} />;
      case 'editor':
        return <ViewEditorMapeo setIsSidebarOpen={setIsSidebarOpen} globalBoxConfigs={globalBoxConfigs} setGlobalBoxConfigs={setGlobalBoxConfigs} globalPositions={globalPositions} setGlobalPositions={setGlobalPositions} globalBanners={globalBanners} setGlobalBanners={setGlobalBanners} globalRackConfigs={globalRackConfigs} setGlobalRackConfigs={setGlobalRackConfigs} showModal={showModal} />;
      case 'recepcion':
        return <ViewRecepcion user={user} globalBoxConfigs={globalBoxConfigs} setGlobalBoxConfigs={setGlobalBoxConfigs} globalRackConfigs={globalRackConfigs} showModal={showModal} />;
      case 'despacho':
        return <ViewDespacho user={user} showModal={showModal} />;
      case 'inventario':
        return <ViewInventario showModal={showModal} />;
      case 'contenedores':
        return <ViewContenedores showModal={showModal} />;
      case 'kardex':
        return <ViewKardex showModal={showModal} />;
      default:
        return <ViewDashboard />;
    }
  };

  const renderModal = () => {
    if (!modalConfig) return null;
    const isConfirm = modalConfig.type === 'confirm';
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: 'white', borderRadius: '24px', padding: '32px', width: '400px', maxWidth: '90%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', textAlign: 'center', animation: 'scaleIn 0.3s ease' }}>
          <div style={{ background: isConfirm ? '#fef2f2' : '#eff6ff', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <AlertTriangle size={40} color={isConfirm ? '#ef4444' : '#3b82f6'} />
          </div>
          <h2 style={{ margin: '0 0 12px 0', color: '#1e293b', fontSize: '1.5rem', fontWeight: 'bold' }}>{modalConfig.title}</h2>
          <p style={{ margin: '0 0 24px 0', color: '#64748b', fontSize: '1rem', lineHeight: '1.5' }}>{modalConfig.message}</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            {isConfirm && (
              <button
                onClick={() => setModalConfig(null)}
                style={{ padding: '12px 24px', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', fontWeight: 'bold', cursor: 'pointer', flex: 1, transition: 'all 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
              >
                Cancelar
              </button>
            )}
            <button
              onClick={() => {
                if (modalConfig.onConfirm) modalConfig.onConfirm();
                setModalConfig(null);
              }}
              style={{ padding: '12px 24px', borderRadius: '12px', border: 'none', background: isConfirm ? '#ef4444' : '#3b82f6', color: 'white', fontWeight: 'bold', cursor: 'pointer', flex: 1, transition: 'all 0.2s', boxShadow: isConfirm ? '0 4px 6px -1px rgba(239, 68, 68, 0.4)' : '0 4px 6px -1px rgba(59, 130, 246, 0.4)' }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              {isConfirm ? 'Sí, eliminar' : 'Entendido'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`almacen-layout ${isSidebarOpen ? '' : 'sidebar-closed'}`}>
      {renderModal()}
      {/* Sidebar */}
      <aside className="almacen-sidebar">
        <div className="almacen-logo-area">
          <div className="logo-icon-wrapper">
            <Package size={28} color="#3b82f6" />
          </div>
          <h2>Control de Almacén</h2>
        </div>

        <nav className="almacen-nav">
          <NavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={20} />} label="Dashboard" />
          <NavItem active={activeTab === 'mapeo'} onClick={() => setActiveTab('mapeo')} icon={<Grid size={20} />} label="Mapa Almacén" />
          <NavItem active={activeTab === 'editor'} onClick={() => setActiveTab('editor')} icon={<CheckCircle size={20} />} label="Editor de Mapa" />
          <div className="nav-divider" />
          <NavItem active={activeTab === 'recepcion'} onClick={() => setActiveTab('recepcion')} icon={<ArrowDownToLine size={20} />} label="Recepción (Ingreso)" />
          <NavItem active={activeTab === 'despacho'} onClick={() => setActiveTab('despacho')} icon={<ArrowUpFromLine size={20} />} label="Despacho (Retiro)" />
          <div className="nav-divider" />
          <NavItem active={activeTab === 'inventario'} onClick={() => setActiveTab('inventario')} icon={<ClipboardList size={20} />} label="Inventario" />
          <NavItem active={activeTab === 'contenedores'} onClick={() => setActiveTab('contenedores')} icon={<Grid size={20} />} label="Contenedores" />
          <NavItem active={activeTab === 'kardex'} onClick={() => setActiveTab('kardex')} icon={<FileText size={20} />} label="Kardex / Historial" />
        </nav>

        <div className="almacen-user-area">
          <div className="user-info">
            <div className="user-avatar">{user?.nombres?.charAt(0) || 'A'}</div>
            <div>
              <p className="user-name">{user?.nombres || 'Almacenero'}</p>
              <p className="user-role">{user?.rol || 'Almacén'}</p>
            </div>
          </div>
          <button className="logout-btn" onClick={onLogout}>
            <LogOut size={20} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="almacen-main">
        <header className="almacen-header">
          <div className="header-title" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1e293b', padding: '4px', display: 'flex' }}>
              <Menu size={24} />
            </button>
            <div>
              <h1 style={{ margin: 0 }}>{getTabTitle(activeTab)}</h1>
              <p className="header-date" style={{ margin: '4px 0 0 0' }}>
                {currentTime.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} - {currentTime.toLocaleTimeString('es-ES')}
              </p>
            </div>
          </div>
        </header>

        <div className="almacen-content-scroll">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

function NavItem({ active, onClick, icon, label }) {
  return (
    <button className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}>
      <span className="icon">{icon}</span>
      <span className="label">{label}</span>
    </button>
  );
}

function getTabTitle(tab) {
  const titles = {
    dashboard: 'Dashboard General',
    mapeo: 'Mapa de Almacén',
    editor: 'Editor de Mapa',
    recepcion: 'Registro de Recepción',
    despacho: 'Despacho de Mercadería',
    inventario: 'Inventario Actual',
    contenedores: 'Gestión de Contenedores',
    kardex: 'Kardex de Movimientos'
  };
  return titles[tab] || '';
}

// --- VIEWS COMPONENTS ---

function ViewDashboard() {
  return (
    <div className="dashboard-grid">
      <div className="kpi-card">
        <div className="kpi-icon bg-blue"><Grid size={24} color="#3b82f6" /></div>
        <div className="kpi-data">
          <h3>Ocupación</h3>
          <p className="kpi-value">68%</p>
          <span className="kpi-subtext">340/500 Ubicaciones llenas</span>
        </div>
      </div>
      <div className="kpi-card">
        <div className="kpi-icon bg-green"><ArrowDownToLine size={24} color="#10b981" /></div>
        <div className="kpi-data">
          <h3>Ingresos Hoy</h3>
          <p className="kpi-value">12</p>
          <span className="kpi-subtext">Lotes recibidos</span>
        </div>
      </div>
      <div className="kpi-card">
        <div className="kpi-icon bg-orange"><ArrowUpFromLine size={24} color="#f59e0b" /></div>
        <div className="kpi-data">
          <h3>Despachos Hoy</h3>
          <p className="kpi-value">28</p>
          <span className="kpi-subtext">Productos entregados</span>
        </div>
      </div>
      <div className="kpi-card">
        <div className="kpi-icon bg-red"><AlertTriangle size={24} color="#ef4444" /></div>
        <div className="kpi-data">
          <h3>Stock Crítico</h3>
          <p className="kpi-value">5</p>
          <span className="kpi-subtext">Productos por debajo del mínimo</span>
        </div>
      </div>
    </div>
  );
}

function ViewMapeo({ setIsSidebarOpen, globalBoxConfigs, globalPositions, globalBanners, globalRackConfigs }) {
  const [rotationZ, setRotationZ] = useState(-30);
  const [rotationX, setRotationX] = useState(60);
  const [zoom, setZoom] = useState(1);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [selectedBox, setSelectedBox] = useState(null);
  const [boxDetails, setBoxDetails] = useState(null);
  const [loadingBox, setLoadingBox] = useState(false);
  const [racksData, setRacksData] = useState([]);

  // Fetch box details when selectedBox changes
  useEffect(() => {
    if (selectedBox) {
      setLoadingBox(true);
      fetch(`http://localhost:5051/api/almacen/ubicaciones/${selectedBox}`)
        .then(res => res.json())
        .then(data => {
          setBoxDetails(data);
          setLoadingBox(false);
        })
        .catch(err => {
          console.error(err);
          setLoadingBox(false);
        });
    } else {
      setBoxDetails(null);
    }
  }, [selectedBox]);

  // Mouse drag logic
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    fetch('http://localhost:5051/api/almacen/racks')
      .then(res => res.json())
      .then(data => {
        const mappedRacks = data.map(r => ({ id: r.codigo, x: r.posicionX, y: r.posicionY }));
        setRacksData(mappedRacks);
      })
      .catch(err => console.error("Error fetching racks:", err));
  }, []);

  const getEstado = (idStr) => {
    if (globalBoxConfigs && globalBoxConfigs[idStr]?.color) {
      return globalBoxConfigs[idStr].color;
    }
    return 'libre';
  };

  const handleMouseDown = (e) => {
    // Solo girar si clickea el fondo (no los controles ni las cajas)
    if (e.target.closest('.map-controls') || e.target.closest('.iso-box') || e.target.closest('.pallet-spot')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    setRotationZ(prev => Number(prev) + deltaX * 0.5);
    setRotationX(prev => Math.max(0, Math.min(90, Number(prev) - deltaY * 0.5)));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e) => {
    if (e.target.closest('.map-controls')) return;
    const zoomChange = e.deltaY * -0.001;
    setZoom(prev => Math.max(0.3, Math.min(3, Number(prev) + zoomChange)));
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 80px)', gap: '16px' }}>
      <div
        style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#f8fafc', borderRadius: '12px', cursor: isDragging ? 'grabbing' : 'grab' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <div className="isometric-map-wrapper">
          <CameraControls
            rotationZ={rotationZ} setRotationZ={setRotationZ}
            rotationX={rotationX} setRotationX={setRotationX}
            zoom={zoom} setZoom={setZoom}
            controlsOpen={controlsOpen} setControlsOpen={setControlsOpen}
          />

          <div className="isometric-plane custom-layout" style={{ transform: `scale(${zoom}) rotateX(${rotationX}deg) rotateZ(${rotationZ}deg)`, transition: 'transform 0.1s ease-out' }}>
            <div className="main-warehouse-area">
              {racksData.map(rack => (
                <div key={rack.id} className="iso-estante" style={{ left: parseFloat(rack.posicionX || rack.x) - 40, top: rack.posicionY || rack.y }}>
                  <div className="estante-floor-label" style={{ background: globalRackConfigs?.[rack.codigo]?.bgColor || 'rgba(0,0,0,0.8)', color: globalRackConfigs?.[rack.codigo]?.textColor || 'white' }}>{globalRackConfigs?.[rack.codigo]?.text || `ESTANTE ${rack.codigo || rack.id}`}</div>
                  <div className="estante-grid">
                    {Array.from({ length: rack.numeroColumnas || 4 }).map((_, pos) => (
                      <div key={pos} className="pallet-spot relative" onClick={() => { setSelectedBox(null); }}>
                        <div className="empty-pallet"></div>
                        <div className="rack-pillar pillar-tl"></div>
                        <div className="rack-pillar pillar-tr"></div>
                        <div className="rack-pillar pillar-bl"></div>
                        <div className="rack-pillar pillar-br"></div>

                        {Array.from({ length: rack.numeroNiveles || 3 }).map((_, nivel) => {
                          const boxCode = `${rack.codigo || rack.id}${pos + 1}-N${nivel + 1}`;
                          const estado = getEstado(boxCode);
                          // if (estado === 'libre') return null; // Comentado para mostrar cajas vacías
                          const isSelected = selectedBox === boxCode;
                          return (
                            <div key={nivel} className={`iso-box ${estado} ${isSelected ? 'selected' : ''}`} style={{ '--base-z': `${nivel * 40}px` }} onClick={(e) => { e.stopPropagation(); setSelectedBox(boxCode); setControlsOpen(false); if (setIsSidebarOpen) setIsSidebarOpen(false); }}>
                              <div className="iso-face top"></div>
                              <div className="iso-face bottom"></div>
                              <div className="iso-face front"><span className="box-code">{boxCode}</span></div>
                              <div className="iso-face back"><span className="box-code">{boxCode}</span></div>
                              <div className="iso-face left"></div>
                              <div className="iso-face right"></div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {globalBanners?.map(banner => (
                <div
                  key={banner.id}
                  style={{
                    position: 'absolute',
                    right: `${banner.right}px`,
                    top: `${banner.top}px`,
                    width: '60px',
                    height: `${banner.height}px`,
                    background: banner.bgColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '12px',
                    boxShadow: '0 8px 15px -3px rgba(0,0,0,0.2), inset 0 3px 6px rgba(255,255,255,0.2)',
                    border: `3px solid rgba(255,255,255,0.4)`,
                    transition: 'all 0.3s ease'
                  }}
                >
                  <span className="text-rotated" style={{ color: banner.textColor, fontSize: '0.9rem', fontWeight: '900', letterSpacing: '3px', textTransform: 'uppercase', textShadow: '2px 2px 4px rgba(0,0,0,0.5)', whiteSpace: 'nowrap' }}>
                    {banner.text}
                  </span>
                </div>
              ))}

              {/* ULTRA REALISTIC DETAILS */}
              <div className="iso-reception-zone">
                <div style={{ position: 'absolute', top: '-25px', left: '0px', color: '#1e293b', fontSize: '0.8rem', fontWeight: 'bold', transform: 'rotateZ(45deg) rotateX(-45deg)', whiteSpace: 'nowrap' }}>Recepción & Registro</div>
                <div className="iso-desk">
                  <div className="iso-computer"></div>
                </div>
                <div className="iso-person"></div>
              </div>
              <div className="walking-person"></div>
            </div>
            <div className="llegada-vehiculos" style={{ position: 'relative', left: `${globalPositions?.truck?.left ?? 0}px`, top: `${globalPositions?.truck?.top ?? 0}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '30px', transition: 'all 0.3s', margin: 0 }}>
              <span className="text-rotated-llegada">Zona de<br />Desembarque</span>
              <div className="truck-model" style={{ transform: 'rotateZ(-45deg)', background: '#cbd5e1', width: '120px', height: '50px', borderRadius: '8px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '5px 5px 15px rgba(0,0,0,0.3)', border: '2px solid #94a3b8' }}>
                <Truck size={36} color="#334155" />
                <div style={{ position: 'absolute', right: '-15px', width: '30px', height: '40px', background: '#3b82f6', borderRadius: '6px', border: '2px solid #1d4ed8' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PANEL LATERAL DE DETALLES */}
      {selectedBox && (
        <div style={{ width: '340px', background: 'white', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}><Package size={20} color="#3b82f6" /> Caja {selectedBox}</h3>
            <button onClick={() => setSelectedBox(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '1.2rem', padding: '0 5px' }}>&times;</button>
          </div>

          {loadingBox ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: '#64748b' }}>
              <RefreshCcw size={24} className="spinning-icon" style={{ marginBottom: '10px' }} />
              <p style={{ margin: 0, fontSize: '0.9rem' }}>Cargando datos...</p>
            </div>
          ) : boxDetails ? (
            <>
              <div style={{ marginBottom: '15px', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <p style={{ margin: '0 0 5px 0', fontSize: '0.85rem', color: '#475569', display: 'flex', justifyContent: 'space-between' }}><span>Capacidad Max:</span> <strong>{boxDetails.capacidadMaxima} uds</strong></p>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Estado:</span>
                  <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', background: boxDetails.estado.toLowerCase() === 'libre' ? '#dcfce7' : '#fef3c7', color: boxDetails.estado.toLowerCase() === 'libre' ? '#166534' : '#92400e' }}>
                    {boxDetails.estado}
                  </span>
                </p>
              </div>

              <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', color: '#1e293b' }}>Contenido de la Caja</h4>
              {boxDetails.inventario && boxDetails.inventario.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto', paddingRight: '5px' }}>
                  {boxDetails.inventario.map((inv, idx) => (
                    <div key={idx} style={{ background: '#f1f5f9', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                      <p style={{ margin: '0 0 6px 0', fontWeight: 'bold', color: '#0f172a', fontSize: '0.9rem', lineHeight: '1.2' }}>{inv.producto}</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#475569' }}>
                        <span>Cant: <strong style={{ color: '#3b82f6' }}>{inv.cantidad} {inv.unidad}</strong></span>
                        <span>Cód: {inv.codigoProducto}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px 0', color: '#94a3b8', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <Package size={28} style={{ opacity: 0.5, marginBottom: '8px' }} />
                  <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 'bold' }}>Caja vacía</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem' }}>No hay productos en esta ubicación</p>
                </div>
              )}
            </>
          ) : (
            <p style={{ textAlign: 'center', color: '#ef4444' }}>Error al cargar datos</p>
          )}
        </div>
      )}
    </div>
  );
}

function ViewEditorMapeo({ setIsSidebarOpen, globalBoxConfigs, setGlobalBoxConfigs, globalPositions, setGlobalPositions, globalBanners, setGlobalBanners, globalRackConfigs, setGlobalRackConfigs, showModal }) {
  const [racks, setRacks] = useState([]);
  const [rotationZ, setRotationZ] = useState(-30);
  const [rotationX, setRotationX] = useState(60);
  const [zoom, setZoom] = useState(1);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [selectedRack, setSelectedRack] = useState(null);
  const [selectedBox, setSelectedBox] = useState(null);
  const [selectedSpecial, setSelectedSpecial] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingBoxGlobal, setIsAddingBoxGlobal] = useState(false);
  const [addingBoxSelectedRack, setAddingBoxSelectedRack] = useState(null);

  // Create Rack state
  const [isAddingRackGlobal, setIsAddingRackGlobal] = useState(false);
  const [addingRackPos, setAddingRackPos] = useState(null);
  const [newRackData, setNewRackData] = useState({ codigo: '', numeroColumnas: 4, numeroNiveles: 3 });

  // Edit Rack state
  const [editingRackGlobal, setEditingRackGlobal] = useState(null);

  // Toolbar state
  const [isToolbarExpanded, setIsToolbarExpanded] = useState(true);
  const [expandedMenu, setExpandedMenu] = useState(null);

  const [showTagsModal, setShowTagsModal] = useState(false);
  const [activeTool, setActiveTool] = useState('select'); // 'select', 'add_box', 'create_rack', 'delete_rack', 'edit_rack', 'delete_box'

  // Drag and drop state
  const [draggedRack, setDraggedRack] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Box editing state
  const [isEditingBox, setIsEditingBox] = useState(false);
  const [editBoxData, setEditBoxData] = useState({ capacidad: 100, color: 'ocupado' });

  // Camera dragging state
  const [isDraggingCamera, setIsDraggingCamera] = useState(false);
  const [dragCameraStart, setDragCameraStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef(null);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  useEffect(() => {
    fetch('http://localhost:5051/api/almacen/racks')
      .then(res => res.json())
      .then(data => setRacks(data))
      .catch(err => console.error("Error fetching racks:", err));
  }, []);

  const handleSave = () => {
    setIsSaving(true);
    fetch('http://localhost:5051/api/almacen/racks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(racks)
    })
      .then(() => { showModal("¡Éxito!", "El mapa se ha guardado correctamente.", "alert"); setIsSaving(false); })
      .catch(() => { showModal("Error", "Ocurrió un problema al guardar el mapa.", "alert"); setIsSaving(false); });
  };

  const getEstado = (boxCode) => {
    if (globalBoxConfigs && globalBoxConfigs[boxCode]?.color) {
      return globalBoxConfigs[boxCode].color;
    }
    return 'libre';
  };

  const attemptDeleteRack = (rack) => {
    for (let col = 1; col <= rack.numeroColumnas; col++) {
      for (let lvl = 1; lvl <= rack.numeroNiveles; lvl++) {
        const boxCode = `${rack.codigo}${col}-N${lvl}`;
        if (getEstado(boxCode) !== 'libre') {
          showModal("Acción Denegada", "No puedes eliminar este rack porque tiene productos en sus cajas. Por favor, reubica los productos primero para que no queden sin ubicación.", "alert");
          setActiveTool('select');
          return;
        }
      }
    }

    showModal("Confirmar Eliminación", `¿Seguro que deseas eliminar el rack ${rack.codigo} permanentemente?`, "confirm", () => {
      setRacks(prev => prev.filter(r => r.codigo !== rack.codigo));
      setSelectedRack(null);
      setActiveTool('select');
    });
  };

  const getAvailableRacks = () => {
    return racks.filter(rack => {
      const cols = rack.numeroColumnas || 4;
      const lvls = rack.numeroNiveles || 3;
      let hasEmpty = false;
      for (let c = 1; c <= cols; c++) {
        for (let l = 1; l <= lvls; l++) {
          const bCode = `${rack.codigo}${c}-N${l}`;
          if (getEstado(bCode) === 'libre') {
            hasEmpty = true;
            break;
          }
        }
        if (hasEmpty) break;
      }
      return hasEmpty;
    });
  };

  const handleAddBoxToColumn = (rack, column) => {
    const lvls = rack.numeroNiveles || 3;
    let firstEmpty = null;
    // Buscamos desde N1 hasta N3
    for (let l = 1; l <= lvls; l++) {
      const bCode = `${rack.codigo}${column}-N${l}`;
      if (getEstado(bCode) === 'libre') {
        firstEmpty = bCode;
        break;
      }
    }

    if (firstEmpty) {
      if (setGlobalBoxConfigs) {
        setGlobalBoxConfigs(prev => ({ ...prev, [firstEmpty]: { color: 'ocupado', capacidad: 100 } }));
      }
      setSelectedBox(firstEmpty);
      setSelectedRack(null);
      setSelectedSpecial(null);
      setIsEditingBox(true);
      setIsAddingBoxGlobal(false);
      setAddingBoxSelectedRack(null);
      setActiveTool('select');
    }
  };

  const getAvailableColumns = (rack) => {
    const cols = rack.numeroColumnas || 4;
    const lvls = rack.numeroNiveles || 3;
    let availableCols = [];

    for (let c = 1; c <= cols; c++) {
      let hasEmptyLevel = false;
      let nextEmptyLevel = null;
      for (let l = 1; l <= lvls; l++) {
        const bCode = `${rack.codigo}${c}-N${l}`;
        if (getEstado(bCode) === 'libre') {
          hasEmptyLevel = true;
          nextEmptyLevel = l;
          break;
        }
      }
      if (hasEmptyLevel) {
        availableCols.push({ columnNumber: c, nextEmptyLevel });
      }
    }
    return availableCols;
  };

  // --- Drag & Drop logic ---
  const handleRackMouseDown = (e, rack) => {
    e.stopPropagation();

    if (activeTool === 'delete_rack') {
      attemptDeleteRack(rack);
      return;
    }

    if (activeTool === 'edit_rack') {
      setEditingRackGlobal(rack);
      return;
    }

    // Only drag if not clicking a box directly
    if (e.target.closest('.iso-box')) return;

    setDraggedRack(rack.codigo);
    setSelectedRack(rack);
    setSelectedBox(null);
    setDragOffset({
      x: e.clientX - parseFloat(rack.posicionX),
      y: e.clientY - parseFloat(rack.posicionY)
    });
  };

  const handleBackgroundMouseDown = (e) => {
    if (activeTool !== 'select') return;
    // Solo girar si clickea el fondo
    if (e.target.closest('.map-controls') || e.target.closest('.iso-box') || e.target.closest('.pallet-spot') || e.target.closest('.iso-estante') || e.target.closest('.iso-reception-zone') || e.target.closest('.llegada-vehiculos')) return;
    setIsDraggingCamera(true);
    setDragCameraStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    if (isDraggingCamera) {
      const deltaX = e.clientX - dragCameraStart.x;
      const deltaY = e.clientY - dragCameraStart.y;
      setRotationZ(prev => Number(prev) + deltaX * 0.5);
      setRotationX(prev => Math.max(0, Math.min(90, Number(prev) - deltaY * 0.5)));
      setDragCameraStart({ x: e.clientX, y: e.clientY });
    } else if (draggedRack) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      setRacks(prev => prev.map(r =>
        r.codigo === draggedRack
          ? { ...r, posicionX: newX, posicionY: newY }
          : r
      ));
    }
  };

  const handleMouseUp = () => {
    setDraggedRack(null);
    setIsDraggingCamera(false);
  };

  return (
    <div
      ref={containerRef}
      style={{ display: 'flex', height: 'calc(100vh - 80px)', gap: '16px', background: '#f1f5f9' }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div
        style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#f8fafc', borderRadius: '12px', cursor: activeTool === 'select' ? (isDraggingCamera ? 'grabbing' : 'grab') : 'crosshair' }}
        onMouseDown={handleBackgroundMouseDown}
      >
        <div className={`toolbar-menu-scroll ${isToolbarExpanded ? 'toolbar-expanded' : 'toolbar-collapsed'}`} style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '8px', background: 'white', padding: isToolbarExpanded ? '12px' : '8px', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', width: isToolbarExpanded ? '200px' : '56px', height: '470px', maxHeight: 'calc(100vh - 60px)', overflowY: 'auto', transition: 'all 0.3s ease' }}>
          <div style={{ display: 'flex', justifyContent: isToolbarExpanded ? 'space-between' : 'center', alignItems: 'center', padding: '8px', borderBottom: '1px solid #f1f5f9', marginBottom: '4px' }}>
            {isToolbarExpanded && <span style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}><Grid size={14} /> HERRAMIENTAS</span>}
            <button onClick={() => setIsToolbarExpanded(!isToolbarExpanded)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isToolbarExpanded ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button className={`tool-btn ${activeTool === 'select' ? 'active' : ''}`} onClick={() => setActiveTool('select')} title="Seleccionar" style={{ background: activeTool === 'select' ? '#2563eb' : 'transparent', color: activeTool === 'select' ? 'white' : '#475569' }}>
              <MousePointer2 size={18} /> {isToolbarExpanded && <span>Seleccionar</span>}
            </button>

            <div style={{ height: '1px', background: '#cbd5e1', margin: '2px 0', width: '100%', borderRadius: '1px' }}></div>

            {/* Racks Menu */}
            <div style={{ background: expandedMenu === 'racks' ? '#f8fafc' : 'transparent', borderRadius: '8px', overflow: 'hidden', transition: 'all 0.3s' }}>
              <button
                className="tool-btn"
                onClick={() => {
                  if (!isToolbarExpanded) setIsToolbarExpanded(true);
                  setExpandedMenu(expandedMenu === 'racks' ? null : 'racks');
                }}
                style={{ width: '100%', justifyContent: 'space-between', paddingRight: '8px' }}
                title="Gestión de Racks"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Grid size={18} /> {isToolbarExpanded && <span>Racks</span>}</div>
                {isToolbarExpanded && (expandedMenu === 'racks' ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
              </button>
              {isToolbarExpanded && expandedMenu === 'racks' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '8px 8px 8px 32px' }}>
                  <button className={`tool-btn-small ${activeTool === 'create_rack' ? 'active' : ''}`} onClick={() => setActiveTool('create_rack')} style={{ fontSize: '0.85rem', padding: '6px 10px', textAlign: 'left', borderRadius: '6px', border: 'none', background: activeTool === 'create_rack' ? '#dcfce7' : 'rgba(22, 163, 74, 0.08)', color: activeTool === 'create_rack' ? '#15803d' : '#16a34a', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}><Plus size={14} /> Crear</button>
                  <button className={`tool-btn-small ${activeTool === 'edit_rack' ? 'active' : ''}`} onClick={() => {
                    let target = selectedRack;
                    if (!target && selectedBox) {
                      target = racks.slice().sort((a, b) => b.codigo.length - a.codigo.length).find(r => selectedBox.startsWith(r.codigo));
                    }
                    if (target) {
                      setEditingRackGlobal(target);
                      setActiveTool('select');
                    } else {
                      setActiveTool('edit_rack');
                    }
                  }} style={{ fontSize: '0.85rem', padding: '6px 10px', textAlign: 'left', borderRadius: '6px', border: 'none', background: activeTool === 'edit_rack' ? '#e0e7ff' : 'rgba(79, 70, 229, 0.08)', color: activeTool === 'edit_rack' ? '#4338ca' : '#4f46e5', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}><Edit size={14} /> Editar</button>
                  <button className={`tool-btn-small ${activeTool === 'delete_rack' ? 'active' : ''}`} onClick={() => {
                    let target = selectedRack;
                    if (!target && selectedBox) {
                      target = racks.slice().sort((a, b) => b.codigo.length - a.codigo.length).find(r => selectedBox.startsWith(r.codigo));
                    }
                    if (target) {
                      attemptDeleteRack(target);
                    } else {
                      setActiveTool('delete_rack');
                    }
                  }} style={{ fontSize: '0.85rem', padding: '6px 10px', textAlign: 'left', borderRadius: '6px', border: 'none', background: activeTool === 'delete_rack' ? '#fee2e2' : 'rgba(239, 68, 68, 0.08)', color: activeTool === 'delete_rack' ? '#b91c1c' : '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}><Trash2 size={14} /> Eliminar</button>
                </div>
              )}
            </div>

            {/* Boxes Menu */}
            <div style={{ background: expandedMenu === 'cajas' ? '#f8fafc' : 'transparent', borderRadius: '8px', overflow: 'hidden', transition: 'all 0.3s' }}>
              <button
                className="tool-btn"
                onClick={() => {
                  if (!isToolbarExpanded) setIsToolbarExpanded(true);
                  setExpandedMenu(expandedMenu === 'cajas' ? null : 'cajas');
                }}
                style={{ width: '100%', justifyContent: 'space-between', paddingRight: '8px' }}
                title="Gestión de Cajas"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Package size={18} /> {isToolbarExpanded && <span>Cajas</span>}</div>
                {isToolbarExpanded && (expandedMenu === 'cajas' ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
              </button>
              {isToolbarExpanded && expandedMenu === 'cajas' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '8px 8px 8px 32px' }}>
                  <button className={`tool-btn-small ${activeTool === 'add_box' ? 'active' : ''}`} onClick={() => { setActiveTool('add_box'); setIsAddingBoxGlobal(true); }} style={{ fontSize: '0.85rem', padding: '6px 10px', textAlign: 'left', borderRadius: '6px', border: 'none', background: activeTool === 'add_box' ? '#dcfce7' : 'rgba(22, 163, 74, 0.08)', color: activeTool === 'add_box' ? '#15803d' : '#16a34a', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}><Plus size={14} /> Crear</button>
                  <button className={`tool-btn-small ${activeTool === 'edit_box' ? 'active' : ''}`} onClick={() => setActiveTool('edit_box')} style={{ fontSize: '0.85rem', padding: '6px 10px', textAlign: 'left', borderRadius: '6px', border: 'none', background: activeTool === 'edit_box' ? '#e0e7ff' : 'rgba(79, 70, 229, 0.08)', color: activeTool === 'edit_box' ? '#4338ca' : '#4f46e5', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}><Edit size={14} /> Editar</button>
                  <button className={`tool-btn-small ${activeTool === 'delete_box' ? 'active' : ''}`} onClick={() => {
                    if (selectedBox) {
                      if (setGlobalBoxConfigs) {
                        setGlobalBoxConfigs(prev => {
                          const newConfig = { ...prev };
                          delete newConfig[selectedBox];
                          return newConfig;
                        });
                      }
                      setSelectedBox(null);
                      setActiveTool('select');
                    } else {
                      setActiveTool('delete_box');
                    }
                  }} style={{ fontSize: '0.85rem', padding: '6px 10px', textAlign: 'left', borderRadius: '6px', border: 'none', background: activeTool === 'delete_box' ? '#fee2e2' : 'rgba(239, 68, 68, 0.08)', color: activeTool === 'delete_box' ? '#b91c1c' : '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}><Trash2 size={14} /> Eliminar</button>
                </div>
              )}
            </div>

          </div>

          <div style={{ height: '1px', background: '#cbd5e1', margin: '4px 0', width: '100%', borderRadius: '1px' }}></div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button className="tool-btn" onClick={() => setShowTagsModal(true)} title="Etiquetas">
              <Type size={18} /> {isToolbarExpanded && <span>Etiquetas</span>}
            </button>

            <div style={{ height: '1px', background: '#cbd5e1', margin: '4px 0', width: '100%', borderRadius: '1px' }}></div>

            <button className={`tool-btn ${controlsOpen ? 'active' : ''}`} onClick={() => setControlsOpen(!controlsOpen)} title="Cámara 3D">
              <Camera size={18} /> {isToolbarExpanded && <span>Cámara 3D</span>}
            </button>
            <button className="tool-btn" onClick={toggleFullscreen} title="Pantalla Comp.">
              <Maximize size={18} /> {isToolbarExpanded && <span>Pantalla Comp.</span>}
            </button>

            <div style={{ height: '1px', background: '#cbd5e1', margin: '4px 0', width: '100%', borderRadius: '1px' }}></div>

            <button className="tool-btn" onClick={handleSave} style={{ color: '#10b981' }} title="Guardar Mapa">
              <CheckCircle size={18} /> {isToolbarExpanded && <span>{isSaving ? 'Guardando...' : 'Guardar Mapa'}</span>}
            </button>
          </div>
        </div>

        {/* Banner de Instrucción */}
        {activeTool !== 'select' && activeTool !== 'add_box' && (
          <div style={{ position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', background: activeTool.includes('delete') ? '#ef4444' : '#3b82f6', color: 'white', padding: '12px 24px', borderRadius: '30px', fontWeight: 'bold', zIndex: 100, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '10px', animation: 'pulse 2s infinite' }}>
            <MousePointer2 size={20} />
            {activeTool === 'create_rack' && 'Haz clic en el mapa para ubicar el nuevo Rack'}
            {activeTool === 'edit_rack' && 'Haz clic en un Rack para editar sus dimensiones'}
            {activeTool === 'delete_rack' && 'Haz clic en un Rack para eliminarlo del mapa'}
            {activeTool === 'edit_box' && 'Haz clic en una Caja para editar sus propiedades'}
            {activeTool === 'delete_box' && 'Haz clic en una Caja para vaciarla y eliminarla'}
            <button
              onClick={() => setActiveTool('select')}
              style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', marginLeft: '10px' }}
            >
              Cancelar
            </button>
          </div>
        )}

        {/* Controles de cámara flotantes */}
        <div style={{ display: controlsOpen ? 'block' : 'none' }}>
          <CameraControls
            rotationZ={rotationZ} setRotationZ={setRotationZ}
            rotationX={rotationX} setRotationX={setRotationX}
            zoom={zoom} setZoom={setZoom}
            controlsOpen={controlsOpen} setControlsOpen={setControlsOpen}
          />
        </div>
        <div
          className="isometric-plane custom-layout"
          style={{
            transform: `scale(${zoom}) rotateX(${rotationX}deg) rotateZ(${rotationZ}deg)`,
            transition: 'transform 0.1s ease-out',
            cursor: activeTool === 'create_rack' ? 'crosshair' : 'default'
          }}
        >
          <div
            className="main-warehouse-area"
            onClick={(e) => {
              if (activeTool === 'create_rack') {
                const rect = e.currentTarget.getBoundingClientRect();
                // Because of CSS 3D transforms, exact coordinates can be tricky.
                // We'll use a simplified mapping for now, or just rely on native layerX/Y if not transformed perfectly
                const x = e.nativeEvent.offsetX;
                const y = e.nativeEvent.offsetY;
                setAddingRackPos({ x, y });
                setNewRackData({ codigo: '', numeroColumnas: 4, numeroNiveles: 3 });
                setIsAddingRackGlobal(true);
              }
            }}
          >
            {racks.map(rack => (
              <div
                key={rack.codigo}
                className={`iso-estante ${draggedRack === rack.codigo ? 'dragging' : ''}`}
                style={{
                  left: parseFloat(rack.posicionX) - 40,
                  top: rack.posicionY,
                  cursor: draggedRack === rack.codigo ? 'grabbing' : 'grab',
                  zIndex: draggedRack === rack.codigo ? 100 : 1
                }}
                onMouseDown={(e) => handleRackMouseDown(e, rack)}
              >
                <div className="estante-floor-label" style={{
                  background: globalRackConfigs?.[rack.codigo]?.bgColor || 'rgba(0,0,0,0.8)',
                  color: globalRackConfigs?.[rack.codigo]?.textColor || 'white',
                  boxShadow: selectedRack?.codigo === rack.codigo ? '0 0 0 4px #3b82f6, 0 4px 6px rgba(0,0,0,0.3)' : 'none',
                  border: selectedRack?.codigo === rack.codigo ? '2px solid white' : 'none'
                }}>{globalRackConfigs?.[rack.codigo]?.text || `ESTANTE ${rack.codigo}`}</div>
                <div className="estante-grid">
                  {Array.from({ length: rack.numeroColumnas }).map((_, col) => (
                    <div key={col} className="pallet-spot relative">
                      <div className="empty-pallet"></div>
                      <div className="rack-pillar pillar-tl"></div>
                      <div className="rack-pillar pillar-tr"></div>
                      <div className="rack-pillar pillar-bl"></div>
                      <div className="rack-pillar pillar-br"></div>
                      {Array.from({ length: rack.numeroNiveles }).map((_, lvl) => {
                        const boxCode = `${rack.codigo}${col + 1}-N${lvl + 1}`;
                        const estado = getEstado(boxCode);
                        // En modo editor mostramos las cajas vacías para poder interactuar con ellas
                        return (
                          <div
                            key={lvl}
                            className={`iso-box ${estado} ${selectedBox === boxCode ? 'selected' : ''}`}
                            style={{ '--base-z': `${lvl * 40}px` }}
                            onClick={(e) => {
                              e.stopPropagation();

                              if (activeTool === 'delete_box') {
                                if (getEstado(boxCode) !== 'libre') {
                                  showModal("Acción Denegada", "No puedes eliminar esta caja porque contiene productos. Por favor, reubica los productos primero.", "alert");
                                  setActiveTool('select');
                                  return;
                                }
                                if (setGlobalBoxConfigs) {
                                  setGlobalBoxConfigs(prev => {
                                    const newConfig = { ...prev };
                                    delete newConfig[boxCode];
                                    return newConfig;
                                  });
                                }
                                setActiveTool('select');
                                return;
                              } else if (activeTool === 'delete_rack') {
                                attemptDeleteRack(rack);
                                return;
                              } else if (activeTool === 'edit_rack') {
                                setEditingRackGlobal(rack);
                                setActiveTool('select');
                                return;
                              }

                              setSelectedRack(rack);
                              setSelectedBox(boxCode);
                              if (setIsSidebarOpen) setIsSidebarOpen(false); // Reduce sidebar
                              setControlsOpen(false); // Collapsa los controles
                              setIsEditingBox(false);
                              if (activeTool === 'edit_box') {
                                setActiveTool('select');
                              }
                              setEditBoxData({
                                capacidad: globalBoxConfigs[boxCode]?.capacidad || 100,
                                color: globalBoxConfigs[boxCode]?.color || (getEstado(boxCode) === 'bloqueado' ? 'bloqueado' : 'ocupado')
                              });
                            }}
                          >
                            <div className="iso-face top"></div>
                            <div className="iso-face bottom"></div>
                            <div className="iso-face front"><span className="box-code">{boxCode}</span></div>
                            <div className="iso-face back"><span className="box-code">{boxCode}</span></div>
                            <div className="iso-face left"></div>
                            <div className="iso-face right"></div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {globalBanners?.map(banner => (
              <div
                key={banner.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedSpecial(banner.id);
                  setSelectedBox(null);
                  setSelectedRack(null);
                }}
                style={{
                  position: 'absolute',
                  right: `${banner.right}px`,
                  top: `${banner.top}px`,
                  width: '60px',
                  height: `${banner.height}px`,
                  background: banner.bgColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '12px',
                  boxShadow: selectedSpecial === banner.id ? '0 0 0 4px #ef4444, 0 8px 15px -3px rgba(0,0,0,0.2)' : '0 8px 15px -3px rgba(0,0,0,0.2), inset 0 3px 6px rgba(255,255,255,0.2)',
                  border: `3px solid rgba(255,255,255,0.4)`,
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
              >
                <span className="text-rotated" style={{ color: banner.textColor, fontSize: '0.9rem', fontWeight: '900', letterSpacing: '3px', textTransform: 'uppercase', textShadow: '2px 2px 4px rgba(0,0,0,0.5)', whiteSpace: 'nowrap' }}>
                  {banner.text}
                </span>
              </div>
            ))}

            {/* ULTRA REALISTIC DETAILS */}
            <div className="iso-reception-zone">
              <div style={{ position: 'absolute', top: '-25px', left: '0px', color: '#1e293b', fontSize: '0.8rem', fontWeight: 'bold', transform: 'rotateZ(45deg) rotateX(-45deg)', whiteSpace: 'nowrap' }}>Recepción & Registro</div>
              <div className="iso-desk">
                <div className="iso-computer"></div>
              </div>
              <div className="iso-person"></div>
            </div>
            <div className="walking-person"></div>
          </div>
          <div className={`llegada-vehiculos ${selectedSpecial === 'truck' ? 'selected' : ''}`} style={{ position: 'relative', left: `${globalPositions?.truck?.left ?? 0}px`, top: `${globalPositions?.truck?.top ?? 0}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '30px', transition: 'all 0.3s', cursor: 'pointer', outline: selectedSpecial === 'truck' ? '3px solid #3b82f6' : 'none' }} onClick={(e) => { e.stopPropagation(); setSelectedBox(null); setSelectedRack(null); setSelectedSpecial('truck'); }}>
            <span className="text-rotated-llegada">Zona de<br />Desembarque</span>
            <div className="truck-model" style={{ transform: 'rotateZ(-45deg)', background: '#cbd5e1', width: '120px', height: '50px', borderRadius: '8px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '5px 5px 15px rgba(0,0,0,0.3)', border: selectedSpecial === 'truck' ? '2px solid #3b82f6' : '2px solid #94a3b8' }}>
              <Truck size={36} color={selectedSpecial === 'truck' ? '#3b82f6' : '#334155'} />
              <div style={{ position: 'absolute', right: '-15px', width: '30px', height: '40px', background: '#3b82f6', borderRadius: '6px', border: '2px solid #1d4ed8' }}></div>
            </div>
          </div>
        </div>
      </div>
      {(selectedBox || selectedRack || selectedSpecial) && (
        <div style={{ width: '340px', background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', color: '#0f172a' }}>
            {selectedBox ? 'Propiedades de la Caja' : selectedSpecial?.startsWith('banner') ? 'Propiedades del Letrero' : selectedSpecial ? 'Posición de Elemento' : 'Propiedades del Estante'}
          </h3>

          {selectedSpecial?.startsWith('banner') ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <label style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 'bold' }}>Texto del Letrero</label>
                <input
                  type="text"
                  value={globalBanners.find(b => b.id === selectedSpecial)?.text || ''}
                  onChange={(e) => {
                    if (setGlobalBanners) {
                      setGlobalBanners(prev => prev.map(b => b.id === selectedSpecial ? { ...b, text: e.target.value } : b));
                    }
                  }}
                  style={{ width: '100%', padding: '8px', margin: '4px 0 12px 0', borderRadius: '4px', border: '1px solid #94a3b8' }}
                />

                <label style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 'bold' }}>Color de Fondo</label>
                <input
                  type="color"
                  value={globalBanners.find(b => b.id === selectedSpecial)?.bgColor || '#000000'}
                  onChange={(e) => {
                    if (setGlobalBanners) {
                      setGlobalBanners(prev => prev.map(b => b.id === selectedSpecial ? { ...b, bgColor: e.target.value } : b));
                    }
                  }}
                  style={{ width: '100%', height: '40px', padding: '2px', margin: '4px 0 12px 0', borderRadius: '4px', border: '1px solid #94a3b8', cursor: 'pointer' }}
                />

                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '4px' }}>Posición X</label>
                    <input type="number"
                      className="map-input"
                      value={globalBanners.find(b => b.id === selectedSpecial)?.right || 0}
                      onChange={(e) => {
                        if (setGlobalBanners) {
                          setGlobalBanners(prev => prev.map(b => b.id === selectedSpecial ? { ...b, right: parseInt(e.target.value) || 0 } : b));
                        }
                      }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '4px' }}>Posición Y</label>
                    <input type="number"
                      className="map-input"
                      value={globalBanners.find(b => b.id === selectedSpecial)?.top || 0}
                      onChange={(e) => {
                        if (setGlobalBanners) {
                          setGlobalBanners(prev => prev.map(b => b.id === selectedSpecial ? { ...b, top: parseInt(e.target.value) || 0 } : b));
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedSpecial(null)} style={{ background: 'none', border: 'none', color: '#3b82f6', textDecoration: 'underline', cursor: 'pointer' }}>Volver al Plano</button>
            </div>
          ) : selectedSpecial ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#334155' }}>
                  {selectedSpecial === 'desk' ? 'Escritorio (Recepción)' : 'Camión (Desembarque)'}
                </h4>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '4px' }}>Eje X</label>
                    <input type="number"
                      className="map-input"
                      value={selectedSpecial === 'desk' ? (globalPositions?.desk?.right ?? 30) : (globalPositions?.truck?.left ?? 0)}
                      onChange={(e) => {
                        if (setGlobalPositions) {
                          setGlobalPositions(prev => ({
                            ...prev,
                            [selectedSpecial]: {
                              ...prev[selectedSpecial],
                              [selectedSpecial === 'desk' ? 'right' : 'left']: parseInt(e.target.value) || 0
                            }
                          }));
                        }
                      }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '4px' }}>Eje Y</label>
                    <input type="number"
                      className="map-input"
                      value={selectedSpecial === 'desk' ? (globalPositions?.desk?.bottom ?? -20) : (globalPositions?.truck?.top ?? 0)}
                      onChange={(e) => {
                        if (setGlobalPositions) {
                          setGlobalPositions(prev => ({
                            ...prev,
                            [selectedSpecial]: {
                              ...prev[selectedSpecial],
                              [selectedSpecial === 'desk' ? 'bottom' : 'top']: parseInt(e.target.value) || 0
                            }
                          }));
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedSpecial(null)} style={{ background: 'none', border: 'none', color: '#3b82f6', textDecoration: 'underline', cursor: 'pointer' }}>Volver al Plano</button>
            </div>
          ) : selectedBox ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold' }}>Código de Caja (Ubicación)</label>
                <div style={{ background: '#e0f2fe', padding: '10px', borderRadius: '6px', border: '1px solid #bae6fd', fontWeight: 'bold', color: '#0369a1', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Package size={16} /> {selectedBox}
                </div>
              </div>

              <div style={{ marginTop: '10px', padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <QRCodeSVG value={selectedBox} size={120} style={{ margin: '0 auto 10px auto' }} />
                <p style={{ fontSize: '1rem', fontWeight: 'bold', color: '#0f172a' }}>{selectedBox}</p>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '-5px 0 10px 0' }}>QR para escanear en Recepción</p>
                <button className="btn-primary" onClick={() => window.print()} style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px', color: 'white' }}>
                  <Printer size={18} /> Imprimir QR
                </button>
              </div>

              {isEditingBox ? (
                <div style={{ background: '#f1f5f9', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                  <label style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 'bold' }}>Capacidad Max</label>
                  <input
                    type="number"
                    value={editBoxData.capacidad}
                    onChange={(e) => setEditBoxData({ ...editBoxData, capacidad: e.target.value })}
                    style={{ width: '100%', padding: '8px', margin: '4px 0 12px 0', borderRadius: '4px', border: '1px solid #94a3b8' }}
                  />

                  <label style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 'bold' }}>Color de Caja</label>
                  <select
                    value={editBoxData.color}
                    onChange={(e) => setEditBoxData({ ...editBoxData, color: e.target.value })}
                    style={{ width: '100%', padding: '8px', margin: '4px 0 12px 0', borderRadius: '4px', border: '1px solid #94a3b8' }}
                  >
                    <option value="ocupado">Cartón (Por Defecto)</option>
                    <option value="bloqueado">Gris (Bloqueado)</option>
                    <option value="azul">Azul</option>
                    <option value="amarillo">Amarillo</option>
                    <option value="naranja">Naranja</option>
                    <option value="morado">Morado</option>
                    <option value="verde_claro">Verde Claro</option>
                  </select>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="btn-primary"
                      style={{ flex: 1, padding: '8px', background: '#3b82f6' }}
                      onClick={() => {
                        if (setGlobalBoxConfigs) {
                          setGlobalBoxConfigs(prev => ({ ...prev, [selectedBox]: editBoxData }));
                        }
                        setIsEditingBox(false);
                      }}
                    >Guardar</button>
                    <button className="btn-secondary" style={{ flex: 1, padding: '8px' }} onClick={() => setIsEditingBox(false)}>Cancelar</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button className="btn-secondary" style={{ flex: 1, color: '#0f172a' }} onClick={() => setIsEditingBox(true)}>Editar Caja</button>
                  <button
                    className="btn-secondary"
                    style={{ flex: 1, color: '#ef4444', borderColor: '#ef4444' }}
                    onClick={() => {
                      if (setGlobalBoxConfigs) {
                        setGlobalBoxConfigs(prev => ({ ...prev, [selectedBox]: { color: 'libre', capacidad: 100 } }));
                      }
                      setSelectedBox(null);
                    }}
                  >
                    Eliminar
                  </button>
                </div>
              )}

              <button onClick={() => setSelectedBox(null)} style={{ background: 'none', border: 'none', color: '#3b82f6', textDecoration: 'underline', cursor: 'pointer', marginTop: '10px' }}>Volver al Estante</button>
            </div>
          ) : selectedRack ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold' }}>Código de Rack</label>
                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 'bold', color: '#1e293b' }}>
                  RACK-{selectedRack.codigo}
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 'bold' }}>Texto en el Piso</label>
                <input
                  type="text"
                  value={globalRackConfigs?.[selectedRack.codigo]?.text ?? `ESTANTE ${selectedRack.codigo}`}
                  onChange={(e) => {
                    if (setGlobalRackConfigs) {
                      setGlobalRackConfigs(prev => ({
                        ...prev,
                        [selectedRack.codigo]: { ...prev[selectedRack.codigo], text: e.target.value }
                      }));
                    }
                  }}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #94a3b8' }}
                />

                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 'bold' }}>Color Fondo</label>
                    <input
                      type="color"
                      value={globalRackConfigs?.[selectedRack.codigo]?.bgColor || '#000000'}
                      onChange={(e) => {
                        if (setGlobalRackConfigs) {
                          setGlobalRackConfigs(prev => ({
                            ...prev,
                            [selectedRack.codigo]: { ...prev[selectedRack.codigo], bgColor: e.target.value }
                          }));
                        }
                      }}
                      style={{ width: '100%', height: '40px', padding: '2px', borderRadius: '4px', border: '1px solid #94a3b8', cursor: 'pointer' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 'bold' }}>Color Texto</label>
                    <input
                      type="color"
                      value={globalRackConfigs?.[selectedRack.codigo]?.textColor || '#ffffff'}
                      onChange={(e) => {
                        if (setGlobalRackConfigs) {
                          setGlobalRackConfigs(prev => ({
                            ...prev,
                            [selectedRack.codigo]: { ...prev[selectedRack.codigo], textColor: e.target.value }
                          }));
                        }
                      }}
                      style={{ width: '100%', height: '40px', padding: '2px', borderRadius: '4px', border: '1px solid #94a3b8', cursor: 'pointer' }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '10px', padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <QRCodeSVG value={`RACK-${selectedRack.codigo}`} size={120} style={{ margin: '0 auto 10px auto' }} />
                <p style={{ fontSize: '1rem', fontWeight: 'bold', color: '#0f172a' }}>RACK-{selectedRack.codigo}</p>
                <button className="btn-secondary" onClick={() => window.print()} style={{ width: '100%', marginTop: '10px', display: 'flex', justifyContent: 'center', gap: '8px', color: 'white', background: '#00B4D8' }}>
                  <Printer size={18} /> Imprimir QR del Rack
                </button>
              </div>

              <p style={{ fontSize: '0.8rem', color: '#64748b', textAlign: 'center', marginTop: '10px' }}>
                💡 Selecciona una caja individual en el mapa para imprimir su QR específico.
              </p>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: '30px 10px' }}>
              <ScanLine size={32} style={{ opacity: 0.5, margin: '0 auto 12px auto' }} />
              <p>Selecciona un estante o una caja en el mapa para ver sus detalles e imprimir el QR físico.</p>
            </div>
          )}
        </div>
      )}

      {/* 🖨️ MODO IMPRESIÓN (Solo visible al hacer Ctrl+P) 🖨️ */}
      {selectedBox && (
        <div className="print-only-layout">
          <div className="print-page page-qr" style={{ padding: '40px', fontFamily: 'system-ui, sans-serif', background: '#fff', boxSizing: 'border-box', height: '100vh', maxHeight: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* Header con Logo y Empresa */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', borderBottom: '4px solid #3b82f6', paddingBottom: '20px', marginBottom: '30px', flexShrink: 0 }}>
              <img src="/logo_empresa.png" alt="Logo Empresa" style={{ maxHeight: '60px', objectFit: 'contain' }} />
              <div style={{ textAlign: 'right' }}>
                <h2 style={{ margin: 0, color: '#1e3a8a', fontSize: '1.6rem', fontWeight: '900', letterSpacing: '1px' }}>HOJA DE IDENTIFICACIÓN</h2>
                <p style={{ margin: '5px 0 0 0', color: '#3b82f6', fontSize: '1.1rem', fontWeight: 'bold' }}>Sistema de Gestión de Almacén</p>
              </div>
            </div>

            {/* Contenido Principal */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, justifyContent: 'center' }}>
              <div style={{ background: '#eff6ff', border: '3px dashed #60a5fa', borderRadius: '24px', padding: '30px', textAlign: 'center', width: '85%', maxWidth: '700px', boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.1)' }}>
                <p style={{ margin: '0 0 5px 0', fontSize: '1.2rem', color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '3px', fontWeight: 'bold', whiteSpace: 'nowrap', textAlign: 'center', width: '100%' }}>Código de Ubicación</p>
                <h1 style={{ fontSize: '2.5rem', margin: '0 0 20px 0', color: '#1e3a8a', fontWeight: '900', letterSpacing: '2px', textShadow: '2px 2px 0px #bfdbfe', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%', textAlign: 'center', width: '100%' }}>{selectedBox}</h1>

                <div style={{ background: '#fff', padding: '20px', display: 'inline-block', borderRadius: '16px', border: '2px solid #bfdbfe', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                  <QRCodeSVG value={selectedBox} size={280} />
                </div>
              </div>

              {/* Información Adicional (Colored Cards) */}
              <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginTop: '30px', gap: '20px' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', padding: '15px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.4)' }}>
                  <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', opacity: 0.9, letterSpacing: '1px', color: 'white', whiteSpace: 'nowrap', textAlign: 'center' }}>Capacidad Max</p>
                  <p style={{ margin: '5px 0 0 0', fontSize: '1.8rem', fontWeight: '900', color: 'white', whiteSpace: 'nowrap', textAlign: 'center' }}>100 <span style={{ fontSize: '1rem', fontWeight: 'normal', opacity: 0.8 }}>uds</span></p>
                </div>
                
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #10b981, #047857)', padding: '15px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.4)' }}>
                  <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', opacity: 0.9, letterSpacing: '1px', color: 'white', whiteSpace: 'nowrap', textAlign: 'center' }}>Stock Actual</p>
                  <p style={{ margin: '5px 0 0 0', fontSize: '1.8rem', fontWeight: '900', color: 'white', whiteSpace: 'nowrap', textAlign: 'center' }}>{globalBoxConfigs?.[selectedBox]?.capacidad || 0} <span style={{ fontSize: '1rem', fontWeight: 'normal', opacity: 0.8 }}>uds</span></p>
                </div>
                
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f59e0b, #b45309)', padding: '15px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(245, 158, 11, 0.4)' }}>
                  <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', opacity: 0.9, letterSpacing: '1px', color: 'white', whiteSpace: 'nowrap', textAlign: 'center' }}>Fecha</p>
                  <p style={{ margin: '5px 0 0 0', fontSize: '1.5rem', fontWeight: '800', marginTop: '10px', color: 'white', whiteSpace: 'nowrap', textAlign: 'center' }}>{new Date().toLocaleDateString('es-ES')}</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 'auto', width: '100%', textAlign: 'center', borderTop: '2px solid #e2e8f0', paddingTop: '20px', paddingBottom: '15px', flexShrink: 0 }}>
              <p style={{ fontSize: '1rem', color: '#475569', fontWeight: '600', margin: 0, maxWidth: '600px', lineHeight: '1.5' }}>
                Escanea este código en el módulo de Recepción para procesar ingresos rápidamente a esta ubicación.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Global Add Box Modal */}
      {isAddingBoxGlobal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'white', padding: '0', borderRadius: '16px', width: '480px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', overflow: 'hidden' }}>

            {/* Header */}
            <div style={{ background: 'linear-gradient(to right, #3b82f6, #2563eb)', padding: '24px', color: 'white', position: 'relative' }}>
              <button
                onClick={() => { setIsAddingBoxGlobal(false); setActiveTool('select'); setAddingBoxSelectedRack(null); }}
                style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: '#fca5a5', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', transition: 'all 0.2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)'; e.currentTarget.style.color = '#ef4444'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#fca5a5'; }}
              >
                <X size={24} strokeWidth={2.5} />
              </button>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '10px', paddingRight: '30px' }}>
                <Package size={24} color="white" />
                Crear Nueva Caja
              </h3>
              <p style={{ margin: 0, color: '#bfdbfe', fontSize: '0.95rem', lineHeight: '1.4' }}>
                {!addingBoxSelectedRack
                  ? 'Selecciona en qué Rack deseas crear esta caja física. Solo aparecen los racks que aún tienen espacios vacíos.'
                  : `Has seleccionado el Rack ${addingBoxSelectedRack.codigo}. Ahora selecciona en qué columna deseas ubicar la caja.`}
              </p>
            </div>

            {/* Body */}
            <div style={{ padding: '24px', maxHeight: '400px', overflowY: 'auto' }}>
              {!addingBoxSelectedRack ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {getAvailableRacks().map(rack => (
                    <button
                      key={rack.codigo}
                      onClick={() => setAddingBoxSelectedRack(rack)}
                      style={{
                        textAlign: 'left', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', cursor: 'pointer',
                        transition: 'all 0.2s', color: '#0f172a', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(59,130,246,0.1)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)'; }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ background: '#f1f5f9', padding: '8px', borderRadius: '8px', color: '#475569' }}>
                          <Grid size={20} />
                        </div>
                        <span style={{ fontWeight: '700', fontSize: '1.05rem', color: '#1e293b' }}>
                          {globalRackConfigs?.[rack.codigo]?.text || `Rack ${rack.codigo}`}
                        </span>
                      </div>
                      <span style={{ color: '#059669', fontSize: '0.9rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', background: '#d1fae5', padding: '6px 12px', borderRadius: '20px' }}>
                        Seleccionar Columna <ArrowDownToLine size={14} />
                      </span>
                    </button>
                  ))}

                  {getAvailableRacks().length === 0 && (
                    <div style={{ padding: '30px 20px', textAlign: 'center', color: '#b91c1c', background: '#fef2f2', borderRadius: '12px', border: '1px solid #fecaca' }}>
                      <AlertTriangle size={32} style={{ margin: '0 auto 12px auto', color: '#ef4444' }} />
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '1.1rem' }}>No hay espacio disponible</h4>
                      <p style={{ margin: 0, color: '#991b1b', fontSize: '0.9rem' }}>Todos los racks están llenos (12/12 cajas). Crea un nuevo rack o vacía cajas existentes.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {getAvailableColumns(addingBoxSelectedRack).map(col => (
                    <button
                      key={col.columnNumber}
                      onClick={() => handleAddBoxToColumn(addingBoxSelectedRack, col.columnNumber)}
                      style={{
                        textAlign: 'left', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', cursor: 'pointer',
                        transition: 'all 0.2s', color: '#0f172a', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(59,130,246,0.1)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)'; }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ background: '#fef3c7', padding: '8px', borderRadius: '8px', color: '#b45309' }}>
                          <ArrowUpFromLine size={20} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: '700', fontSize: '1.05rem', color: '#1e293b' }}>
                            Columna {addingBoxSelectedRack.codigo}{col.columnNumber}
                          </span>
                          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                            Se colocará en el Nivel {col.nextEmptyLevel}
                          </span>
                        </div>
                      </div>
                      <span style={{ color: '#0284c7', fontSize: '0.9rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', background: '#e0f2fe', padding: '6px 12px', borderRadius: '20px' }}>
                        <Plus size={14} /> Crear Aquí
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '16px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {addingBoxSelectedRack ? (
                <button
                  className="btn-secondary"
                  onClick={() => setAddingBoxSelectedRack(null)}
                  style={{ padding: '10px 20px', borderRadius: '8px', fontWeight: '600', color: '#3b82f6', background: 'white', border: '1px solid #bfdbfe' }}
                >
                  Volver a Racks
                </button>
              ) : <div></div>}
              <button
                className="btn-secondary"
                onClick={() => { setIsAddingBoxGlobal(false); setActiveTool('select'); setAddingBoxSelectedRack(null); }}
                style={{ padding: '10px 20px', borderRadius: '8px', fontWeight: '600' }}
              >
                Cancelar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Create Rack Modal */}
      {isAddingRackGlobal && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', padding: '0', borderRadius: '16px', width: '400px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
            <div style={{ background: 'linear-gradient(to right, #10b981, #059669)', padding: '24px', color: 'white', position: 'relative' }}>
              <button
                onClick={() => { setIsAddingRackGlobal(false); setActiveTool('select'); }}
                style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: '#a7f3d0', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', transition: 'all 0.2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)'; e.currentTarget.style.color = '#ef4444'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#a7f3d0'; }}
              >
                <X size={24} strokeWidth={2.5} />
              </button>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Grid size={24} color="white" />
                Crear Nuevo Rack
              </h3>
              <p style={{ margin: '0', fontSize: '0.9rem', opacity: 0.9 }}>
                Configura las propiedades del nuevo rack que aparecerá en el mapa.
              </p>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#475569' }}>Código del Rack</label>
                <input
                  type="text"
                  className="config-input"
                  placeholder="Ej. RACK-X"
                  value={newRackData.codigo}
                  onChange={(e) => setNewRackData({ ...newRackData, codigo: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#475569' }}>Columnas (Máx 6)</label>
                  <input
                    type="number"
                    className="config-input"
                    min="1" max="6"
                    value={newRackData.numeroColumnas}
                    onChange={(e) => setNewRackData({ ...newRackData, numeroColumnas: parseInt(e.target.value) || 1 })}
                    style={{ width: '100%' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#475569' }}>Niveles (Máx 4)</label>
                  <input
                    type="number"
                    className="config-input"
                    min="1" max="4"
                    value={newRackData.numeroNiveles}
                    onChange={(e) => setNewRackData({ ...newRackData, numeroNiveles: parseInt(e.target.value) || 1 })}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
              <button
                className="btn-primary"
                style={{ width: '100%', padding: '12px', fontSize: '1rem', background: '#10b981', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                onClick={() => {
                  if (!newRackData.codigo.trim()) {
                    showModal("Atención", "Debe ingresar un código para el nuevo Rack.", "alert");
                    return;
                  }
                  const newRack = {
                    codigo: newRackData.codigo.trim().toUpperCase(),
                    posicionX: addingRackPos.x,
                    posicionY: addingRackPos.y,
                    numeroColumnas: Math.min(newRackData.numeroColumnas, 6),
                    numeroNiveles: Math.min(newRackData.numeroNiveles, 4)
                  };
                  setRacks(prev => [...prev, newRack]);
                  if (setGlobalRackConfigs) {
                    setGlobalRackConfigs(prev => ({
                      ...prev,
                      [newRack.codigo]: { text: newRack.codigo, bg: '#1e293b', color: '#ffffff' }
                    }));
                  }
                  setIsAddingRackGlobal(false);
                  setActiveTool('select');
                }}
              >
                <CheckCircle size={20} /> Guardar Rack en Mapa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Rack Modal */}
      {editingRackGlobal && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', padding: '0', borderRadius: '16px', width: '400px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
            <div style={{ background: 'linear-gradient(to right, #0ea5e9, #0284c7)', padding: '24px', color: 'white', position: 'relative' }}>
              <button
                onClick={() => { setEditingRackGlobal(null); setActiveTool('select'); }}
                style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: '#bae6fd', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', transition: 'all 0.2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)'; e.currentTarget.style.color = '#ef4444'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#bae6fd'; }}
              >
                <X size={24} strokeWidth={2.5} />
              </button>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Edit size={24} color="white" />
                Editar Rack {editingRackGlobal.codigo}
              </h3>
              <p style={{ margin: '0', fontSize: '0.9rem', opacity: 0.9 }}>
                Modifica las dimensiones del rack seleccionado.
              </p>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#475569' }}>Columnas (Máx 6)</label>
                  <input
                    type="number"
                    className="config-input"
                    min="1" max="6"
                    value={editingRackGlobal.numeroColumnas || 4}
                    onChange={(e) => setEditingRackGlobal({ ...editingRackGlobal, numeroColumnas: parseInt(e.target.value) || 1 })}
                    style={{ width: '100%' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#475569' }}>Niveles (Máx 4)</label>
                  <input
                    type="number"
                    className="config-input"
                    min="1" max="4"
                    value={editingRackGlobal.numeroNiveles || 3}
                    onChange={(e) => setEditingRackGlobal({ ...editingRackGlobal, numeroNiveles: parseInt(e.target.value) || 1 })}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
              <button
                className="btn-primary"
                style={{ width: '100%', padding: '12px', fontSize: '1rem', background: '#0ea5e9', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                onClick={() => {
                  const updatedRack = {
                    ...editingRackGlobal,
                    numeroColumnas: Math.min(editingRackGlobal.numeroColumnas, 6),
                    numeroNiveles: Math.min(editingRackGlobal.numeroNiveles, 4)
                  };
                  setRacks(prev => prev.map(r => r.codigo === updatedRack.codigo ? updatedRack : r));
                  setEditingRackGlobal(null);
                  setActiveTool('select');
                }}
              >
                <CheckCircle size={20} /> Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tags Modal */}
      {showTagsModal && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '12px', width: '600px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Type size={20} color="#3b82f6" />
                Gestor de Etiquetas
              </h3>
              <button onClick={() => setShowTagsModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '10px' }}>
              {/* Etiquetas del Suelo */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ color: '#334155', borderBottom: '1px solid #cbd5e1', paddingBottom: '8px', marginBottom: '12px' }}>Letreros del Suelo</h4>
                {globalBanners?.map(banner => (
                  <div key={banner.id} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center', background: '#f8fafc', padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ flex: 1 }}>
                      <input
                        type="text"
                        value={banner.text}
                        onChange={(e) => {
                          if (setGlobalBanners) {
                            setGlobalBanners(prev => prev.map(b => b.id === banner.id ? { ...b, text: e.target.value } : b));
                          }
                        }}
                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <label style={{ fontSize: '0.8rem', color: '#64748b' }}>Fondo</label>
                      <input
                        type="color"
                        value={banner.bgColor || '#3b82f6'}
                        onChange={(e) => {
                          if (setGlobalBanners) {
                            setGlobalBanners(prev => prev.map(b => b.id === banner.id ? { ...b, bgColor: e.target.value } : b));
                          }
                        }}
                        style={{ width: '30px', height: '30px', padding: '0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <label style={{ fontSize: '0.8rem', color: '#64748b' }}>Texto</label>
                      <input
                        type="color"
                        value={banner.textColor || '#ffffff'}
                        onChange={(e) => {
                          if (setGlobalBanners) {
                            setGlobalBanners(prev => prev.map(b => b.id === banner.id ? { ...b, textColor: e.target.value } : b));
                          }
                        }}
                        style={{ width: '30px', height: '30px', padding: '0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Etiquetas de Racks */}
              <div>
                <h4 style={{ color: '#334155', borderBottom: '1px solid #cbd5e1', paddingBottom: '8px', marginBottom: '12px' }}>Nombres de Racks</h4>
                {racks.map(rack => {
                  const rackConfig = globalRackConfigs?.[rack.codigo] || { text: `ESTANTE ${rack.codigo}`, bg: '#1e293b', color: '#ffffff' };
                  return (
                    <div key={rack.codigo} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center', background: '#f8fafc', padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ flex: 1 }}>
                        <input
                          type="text"
                          value={rackConfig.text}
                          onChange={(e) => {
                            if (setGlobalRackConfigs) {
                              setGlobalRackConfigs(prev => ({ ...prev, [rack.codigo]: { ...rackConfig, text: e.target.value } }));
                            }
                          }}
                          style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <label style={{ fontSize: '0.8rem', color: '#64748b' }}>Fondo</label>
                        <input
                          type="color"
                          value={rackConfig.bg}
                          onChange={(e) => {
                            if (setGlobalRackConfigs) {
                              setGlobalRackConfigs(prev => ({ ...prev, [rack.codigo]: { ...rackConfig, bg: e.target.value } }));
                            }
                          }}
                          style={{ width: '30px', height: '30px', padding: '0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <label style={{ fontSize: '0.8rem', color: '#64748b' }}>Texto</label>
                        <input
                          type="color"
                          value={rackConfig.color}
                          onChange={(e) => {
                            if (setGlobalRackConfigs) {
                              setGlobalRackConfigs(prev => ({ ...prev, [rack.codigo]: { ...rackConfig, color: e.target.value } }));
                            }
                          }}
                          style={{ width: '30px', height: '30px', padding: '0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
              <button className="btn-primary" onClick={() => setShowTagsModal(false)} style={{ padding: '10px 24px' }}>Listo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ViewContenedores() {
  const [racks, setRacks] = useState([]);
  useEffect(() => {
    fetch('http://localhost:5051/api/almacen/racks')
      .then(res => res.json())
      .then(data => setRacks(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="module-container">
      <h2 className="module-title">Contenedores del almacén (Estructura)</h2>
      <div className="glass-card" style={{ padding: '20px' }}>
        <table className="prime-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '12px' }}>Código</th>
              <th style={{ padding: '12px' }}>Zona/Rack</th>
              <th style={{ padding: '12px' }}>Columna</th>
              <th style={{ padding: '12px' }}>Nivel</th>
              <th style={{ padding: '12px' }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {racks.map(rack => (
              Array.from({ length: rack.numeroColumnas || 4 }).map((_, col) => (
                Array.from({ length: rack.numeroNiveles || 3 }).map((_, lvl) => {
                  const id = `R${rack.codigo}-C${col + 1}-N${lvl + 1}`;
                  return (
                    <tr key={id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>{id}</td>
                      <td style={{ padding: '12px' }}>{rack.codigo}</td>
                      <td style={{ padding: '12px' }}>{col + 1}</td>
                      <td style={{ padding: '12px' }}>{lvl + 1}</td>
                      <td style={{ padding: '12px' }}><span className="status-badge status-success">Libre</span></td>
                    </tr>
                  )
                })
              ))
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ViewRecepcion({ user, globalBoxConfigs, setGlobalBoxConfigs, globalRackConfigs, showModal, blackLogoUrl }) {
  const [imagenBase64, setImagenBase64] = useState(null);
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagenBase64(reader.result);
      reader.readAsDataURL(file);
    }
  };
  const [step, setStep] = useState(1);
  const [racks, setRacks] = useState([]);

  const [formData, setFormData] = useState({
    sku: '',
    nombre: '',
    cantidad: '',
    proveedor: '',
    condicion: 'En buen estado',
    rack: '',
    nivel: '',
    caja: ''
  });

  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [downloadModalData, setDownloadModalData] = useState(null);
  const [scanLocationCode, setScanLocationCode] = useState('');
  const [assignmentMethod, setAssignmentMethod] = useState('');
  useEffect(() => {
    fetch('http://localhost:5051/api/almacen/racks')
      .then(res => res.json())
      .then(data => setRacks(data))
      .catch(err => console.error(err));
  }, []);

  const getEstado = (boxCode) => {
    if (globalBoxConfigs && globalBoxConfigs[boxCode]?.color) {
      return globalBoxConfigs[boxCode].color;
    }
    return 'libre';
  };

  const selectedRackObj = racks.find(r => r.codigo === formData.rack);
  const getCajasDisponibles = () => {
    if (!selectedRackObj) return [];
    const cols = selectedRackObj.numeroColumnas || 4;
    const lvls = selectedRackObj.numeroNiveles || 3;
    const disponibles = [];
    for (let c = 1; c <= cols; c++) {
      for (let l = 1; l <= lvls; l++) {
        if (formData.nivel && String(l) !== String(formData.nivel)) continue;
        const bCode = `${selectedRackObj.codigo}${c}-N${l}`;
        // Para recepción, mostramos todas las cajas excepto las que están en un estado que prohíbe ingresos (ej. lleno)
        if (getEstado(bCode) !== 'lleno') disponibles.push(bCode);
      }
    }
    return disponibles;
  };

  const handleScanLocation = (code) => {
    if (!code) return;
    const searchCode = code.trim().toUpperCase();
    let found = false;
    for (let r of racks) {
      const cols = r.numeroColumnas || 4;
      const lvls = r.numeroNiveles || 3;
      for (let c = 1; c <= cols; c++) {
        for (let l = 1; l <= lvls; l++) {
          const bCode = `${r.codigo}${c}-N${l}`;
          if (bCode.toUpperCase() === searchCode) {
            if (getEstado(bCode) !== 'lleno') {
              setFormData({ ...formData, rack: r.codigo, nivel: String(l), caja: bCode });
              setScanLocationCode('');
              showModal("Ubicación Encontrada", `Se asignó la caja ${bCode} correctamente.`, "alert");
              found = true;
              return;
            } else {
              showModal("Caja Llena", `La caja ${bCode} está completamente llena y no puede recibir más mercancía.`, "alert");
              return;
            }
          }
        }
      }
    }
    if (!found) {
      showModal("No Encontrado", `No se encontró una caja válida con el código: ${searchCode}`, "alert");
    }
  };

  const handleProcesar = async () => {
    if (!formData.sku || !formData.nombre || !formData.cantidad || !formData.rack || !formData.caja) {
      showModal("Atención", "Por favor completa los datos obligatorios del producto y su ubicación antes de procesar.", "alert");
      return;
    }

    try {
      const payload = {
        productoCodigo: formData.sku,
        cantidad: parseInt(formData.cantidad, 10) || 1,
        ubicacionRack: formData.caja,
        documento: "",
        responsable: user?.name || "Operador",
        proveedor: formData.proveedor,
        descripcionCarga: formData.nombre + " / " + formData.condicion
      };

      const response = await fetch('http://localhost:5051/api/almacen/ingreso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Error al registrar en el servidor');
      }

      if (setGlobalBoxConfigs) {
        setGlobalBoxConfigs(prev => ({
          ...prev,
          [formData.caja]: { color: 'ocupado', capacidad: formData.cantidad }
        }));
      }

      setDownloadModalData({ ...formData });
    } catch (error) {
      console.error(error);
      showModal("Error", "Ocurrió un problema al guardar en la base de datos.", "alert");
    }
  };

  const downloadHojaRecepcion = () => {
    const data = downloadModalData;
    if (!data) return;
    const doc = new jsPDF();
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 40, 'F');
    
    const logoImg = document.getElementById('logo-empresa-hidden');
    if (logoImg) {
      doc.addImage(logoImg, 'PNG', 15, 5, 50, 30);
    }

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("HOJA DE RECEPCIÓN", 115, 25, null, null, "center");

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Datos del Producto", 20, 60);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`SKU / Código: ${data.sku}`, 20, 75);
    doc.text(`Descripción: ${data.nombre}`, 20, 85);
    doc.text(`Cantidad: ${data.cantidad} unidades`, 20, 95);
    doc.text(`Condición: ${data.condicion}`, 20, 105);
    if (data.proveedor) doc.text(`Proveedor: ${data.proveedor}`, 20, 115);

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Ubicación Asignada en Almacén", 20, 135);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    const rackName = globalRackConfigs?.[data.rack]?.text || `Rack ${data.rack}`;
    doc.text(`Rack: ${rackName}`, 20, 150);
    doc.text(`Caja Exacta: ${data.caja}`, 20, 160);

    const d = new Date();
    doc.text(`Fecha de Ingreso: ${d.toLocaleString()}`, 20, 170);
    doc.text(`Registrado por: ${user?.name || 'Operador'}`, 20, 180);

    const canvas = document.getElementById('recepcion-qr');
    if (canvas) {
      const qrDataUrl = canvas.toDataURL('image/png');
      doc.addImage(qrDataUrl, 'PNG', 130, 60, 60, 60);
      doc.setFontSize(9);
      doc.text("Escanea este QR en Despacho", 160, 125, null, null, "center");
    }

    doc.save(`hoja_ingreso_${data.sku}.pdf`);
  };

  const downloadQRProducto = () => {
    const data = downloadModalData;
    if (!data) return;
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [100, 60]
    });

    const canvas = document.getElementById('recepcion-qr');
    if (canvas) {
      const qrDataUrl = canvas.toDataURL('image/png');
      doc.addImage(qrDataUrl, 'PNG', 5, 10, 40, 40);
      
      const logoImg = document.getElementById('logo-empresa-hidden');
      if (logoImg) {
        doc.addImage(logoImg, 'PNG', 75, 5, 20, 12);
      }
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`SKU: ${data.sku}`, 50, 20);
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(data.nombre.substring(0, 30), 50, 30);
      doc.text(`Cant: ${data.cantidad} und.`, 50, 38);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(`UBICACIÓN: ${data.caja}`, 50, 48);
    }
    
    doc.save(`etiqueta_qr_${data.sku}.pdf`);
  };

  const handleFinalizar = () => {
    setDownloadModalData(null);
    setFormData({ sku: '', nombre: '', cantidad: '', proveedor: '', condicion: 'En buen estado', rack: '', nivel: '', caja: '' });
  };

  const qrPayload = JSON.stringify({
    sku: formData.sku,
    nombre: formData.nombre,
    cantidad: formData.cantidad,
    ubicacion: formData.caja
  });

  return (
    <div className="recepcion-container">
      {/* Hidden QR for PDF Generation */}
      <div style={{ display: 'none' }}>
        <img id="logo-empresa-hidden" src="/logo_empresa.png" alt="logo" crossOrigin="anonymous" />
        <QRCodeCanvas id="recepcion-qr" value={qrPayload} size={200} level={"H"} imageSettings={{ src: "/logo_empresa.png", height: 45, width: 45, excavate: true }} />
      </div>

      <div style={{ maxWidth: '850px', margin: '0 auto', background: 'white', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.08)', overflow: 'hidden', border: 'none' }}>
          
          <div style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', padding: '35px 45px', color: 'white' }}>
            <h3 style={{ margin: 0, fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '15px', fontWeight: '800' }}>
              <Package size={32} /> Registrar Ingreso de Mercadería
            </h3>
            <p style={{ margin: '10px 0 0 0', opacity: 0.85, fontSize: '1.05rem' }}>Completa los datos del producto y asigna su ubicación en el almacén.</p>
          </div>

          <div style={{ padding: '40px 45px' }}>
            <h4 style={{ color: '#0f172a', margin: '0 0 25px 0', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ background: '#eff6ff', color: '#3b82f6', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 'bold' }}>1</span> Datos del Producto
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px', marginBottom: '40px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>SKU / Código <span style={{color: '#ef4444'}}>*</span></label>
                <input type="text" style={{ padding: '14px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1.05rem', outline: 'none', transition: 'all 0.2s', background: '#f8fafc', width: '100%', boxSizing: 'border-box' }} onFocus={e => { e.target.style.background = 'white'; e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)'; }} onBlur={e => { e.target.style.background = '#f8fafc'; e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }} value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })} placeholder="Ej. PROD-001" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nombre del Producto <span style={{color: '#ef4444'}}>*</span></label>
                <input type="text" style={{ padding: '14px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1.05rem', outline: 'none', transition: 'all 0.2s', background: '#f8fafc', width: '100%', boxSizing: 'border-box' }} onFocus={e => { e.target.style.background = 'white'; e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)'; }} onBlur={e => { e.target.style.background = '#f8fafc'; e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }} value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} placeholder="Descripción..." />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cantidad <span style={{color: '#ef4444'}}>*</span></label>
                <input type="number" style={{ padding: '14px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1.05rem', outline: 'none', transition: 'all 0.2s', background: '#f8fafc', width: '100%', boxSizing: 'border-box' }} onFocus={e => { e.target.style.background = 'white'; e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)'; }} onBlur={e => { e.target.style.background = '#f8fafc'; e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }} value={formData.cantidad} onChange={e => setFormData({ ...formData, cantidad: e.target.value })} placeholder="0" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Proveedor <span style={{fontWeight: 'normal', color: '#94a3b8'}}>(Opcional)</span></label>
                <input type="text" style={{ padding: '14px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1.05rem', outline: 'none', transition: 'all 0.2s', background: '#f8fafc', width: '100%', boxSizing: 'border-box' }} onFocus={e => { e.target.style.background = 'white'; e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)'; }} onBlur={e => { e.target.style.background = '#f8fafc'; e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }} value={formData.proveedor} onChange={e => setFormData({ ...formData, proveedor: e.target.value })} placeholder="Nombre de proveedor" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Condición al Recibir</label>
                <select style={{ padding: '14px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1.05rem', outline: 'none', transition: 'all 0.2s', background: '#f8fafc', width: '100%', boxSizing: 'border-box', cursor: 'pointer', appearance: 'none' }} onFocus={e => { e.target.style.background = 'white'; e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)'; }} onBlur={e => { e.target.style.background = '#f8fafc'; e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }} value={formData.condicion} onChange={e => setFormData({ ...formData, condicion: e.target.value })}>
                  <option>En buen estado</option>
                  <option>Empaque Dañado</option>
                  <option>Incompleto</option>
                </select>
              </div>
            </div>

            <div style={{ height: '1px', background: '#e2e8f0', margin: '40px -45px 40px -45px' }}></div>

            <h4 style={{ color: '#0f172a', margin: '0 0 25px 0', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ background: '#f5f3ff', color: '#8b5cf6', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 'bold' }}>2</span> Ubicación en Almacén <span style={{color: '#ef4444'}}>*</span>
            </h4>

        {!assignmentMethod ? (
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', margin: '30px 0' }}>
            <button type="button" onClick={() => setAssignmentMethod('qr')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', padding: '30px', background: 'white', border: '2px dashed #cbd5e1', borderRadius: '16px', cursor: 'pointer', transition: 'all 0.2s', width: '250px' }} onMouseOver={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.background = '#f0f9ff'; }} onMouseOut={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = 'white'; }}>
              <ScanLine size={48} color="#3b82f6" />
              <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#0f172a' }}>Escanear QR</span>
              <span style={{ fontSize: '0.9rem', color: '#64748b', textAlign: 'center' }}>Capturar QR de la caja destino con un lector</span>
            </button>
            <button type="button" onClick={() => setAssignmentMethod('manual')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', padding: '30px', background: 'white', border: '2px dashed #cbd5e1', borderRadius: '16px', cursor: 'pointer', transition: 'all 0.2s', width: '250px' }} onMouseOver={e => { e.currentTarget.style.borderColor = '#10b981'; e.currentTarget.style.background = '#ecfdf5'; }} onMouseOut={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = 'white'; }}>
              <MousePointer2 size={48} color="#10b981" />
              <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#0f172a' }}>Selección Manual</span>
              <span style={{ fontSize: '0.9rem', color: '#64748b', textAlign: 'center' }}>Elegir Rack y Caja manualmente</span>
            </button>
          </div>
        ) : (
          <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
              <span style={{ fontWeight: 'bold', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {assignmentMethod === 'qr' ? <><ScanLine size={18} /> Método: Escáner QR</> : <><MousePointer2 size={18} /> Método: Selección Manual</>}
              </span>
              <button type="button" onClick={() => { setAssignmentMethod(''); setFormData({ ...formData, rack: '', nivel: '', caja: '' }); setScanLocationCode(''); }} style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: '0.9rem', textDecoration: 'underline', cursor: 'pointer' }}>
                Cambiar método
              </button>
            </div>

            {assignmentMethod === 'qr' ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0' }}>
                {!formData.caja ? (
                  <>
                    <p style={{ color: '#475569', marginBottom: '20px', textAlign: 'center' }}>Utiliza tu cámara o un lector manual para escanear el QR de la ubicación destino:</p>
                    <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
                      <div style={{ flex: '1', minWidth: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <h5 style={{ color: '#3b82f6', marginBottom: '10px' }}>📸 Escanear con Cámara</h5>
                        <QRScannerWidget onScanSuccess={(text) => handleScanLocation(text)} />
                      </div>
                      
                      <div style={{ flex: '1', minWidth: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <h5 style={{ color: '#8b5cf6', marginBottom: '15px' }}>📟 O usar Lector Manual / Teclado</h5>
                        <div style={{ position: 'relative', width: '320px' }}>
                          <input 
                            type="text" 
                            className="form-input" 
                            style={{ width: '100%', padding: '14px 16px', paddingRight: '50px', fontSize: '1.1rem', borderRadius: '8px', border: '2px solid #cbd5e1', textAlign: 'center', fontWeight: 'bold', letterSpacing: '2px' }}
                            placeholder="Ej. X3-N2"
                            value={scanLocationCode}
                            onChange={e => setScanLocationCode(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleScanLocation(scanLocationCode);
                              }
                            }}
                          />
                          <button 
                            type="button" 
                            onClick={() => handleScanLocation(scanLocationCode)} 
                            style={{ position: 'absolute', right: '6px', top: '6px', bottom: '6px', padding: '0 12px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', transition: 'background 0.2s' }}
                            onMouseOver={e => e.currentTarget.style.background = '#7c3aed'}
                            onMouseOut={e => e.currentTarget.style.background = '#8b5cf6'}
                          >
                            <ScanLine size={20} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ 
                    marginTop: '15px', 
                    padding: '30px', 
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                    borderRadius: '16px', 
                    color: 'white', 
                    width: '100%', 
                    maxWidth: '550px', 
                    textAlign: 'center', 
                    boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4)', 
                    animation: 'scaleIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' 
                  }}>
                    <div style={{ background: 'rgba(255,255,255,0.2)', width: '70px', height: '70px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px' }}>
                      <CheckCircle size={36} color="white" />
                    </div>
                    <h3 style={{ fontSize: '1.8rem', margin: '0 0 5px 0', fontWeight: '800' }}>¡Ubicación Asignada!</h3>
                    <p style={{ fontSize: '1.2rem', margin: '0 0 20px 0', opacity: 0.9 }}>
                      Caja <strong>{formData.caja}</strong> en {globalRackConfigs?.[formData.rack]?.text || `Rack ${formData.rack}`}
                    </p>
                    <button 
                      type="button" 
                      onClick={() => setFormData({ ...formData, rack: '', nivel: '', caja: '' })}
                      style={{ background: 'white', color: '#059669', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                      onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)'; }}
                      onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.1)'; }}
                    >
                      Escanear otra ubicación
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '25px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Asignar a Zona/Rack</label>
                  <select style={{ padding: '14px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1.05rem', outline: 'none', transition: 'all 0.2s', background: '#f8fafc', width: '100%', boxSizing: 'border-box', cursor: 'pointer', appearance: 'none' }} onFocus={e => { e.target.style.background = 'white'; e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)'; }} onBlur={e => { e.target.style.background = '#f8fafc'; e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }} value={formData.rack} onChange={e => setFormData({ ...formData, rack: e.target.value, nivel: '', caja: '' })}>
                    <option value="">-- Seleccionar Rack --</option>
                    {racks.map(r => (
                      <option key={r.codigo} value={r.codigo}>{globalRackConfigs?.[r.codigo]?.text || `Rack ${r.codigo}`}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Seleccionar Nivel</label>
                  <select style={{ padding: '14px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1.05rem', outline: 'none', transition: 'all 0.2s', background: '#f8fafc', width: '100%', boxSizing: 'border-box', cursor: 'pointer', appearance: 'none' }} onFocus={e => { e.target.style.background = 'white'; e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)'; }} onBlur={e => { e.target.style.background = '#f8fafc'; e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }} value={formData.nivel} onChange={e => setFormData({ ...formData, nivel: e.target.value, caja: '' })} disabled={!formData.rack}>
                    <option value="">-- Todos los Niveles --</option>
                    {selectedRackObj && Array.from({ length: selectedRackObj.numeroNiveles || 3 }).map((_, i) => (
                      <option key={i + 1} value={i + 1}>Nivel {i + 1}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Seleccionar Destino</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select style={{ padding: '14px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1.05rem', outline: 'none', transition: 'all 0.2s', background: '#f8fafc', width: '100%', boxSizing: 'border-box', cursor: 'pointer', appearance: 'none' }} onFocus={e => { e.target.style.background = 'white'; e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)'; }} onBlur={e => { e.target.style.background = '#f8fafc'; e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }} value={formData.caja} onChange={e => setFormData({ ...formData, caja: e.target.value })} disabled={!formData.rack}>
                      <option value="">-- Seleccionar Columna --</option>
                      {getCajasDisponibles().map(caja => {
                        const sinRack = caja.substring(formData.rack.length);
                        const partes = sinRack.split('-N');
                        const colNum = partes[0];
                        const lvlNum = partes[1];
                        const texto = formData.nivel ? `Columna ${colNum}` : `Columna ${colNum} - Nivel ${lvlNum}`;
                        return <option key={caja} value={caja}>{texto}</option>;
                      })}
                    </select>
                    {formData.caja && (
                      <button type="button" onClick={() => setShowPreviewModal(true)} style={{ padding: '0 12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)' }} title="Ver Ubicación en Mapa 3D">
                        <Eye size={20} />
                      </button>
                    )}
                  </div>
                  {formData.rack && getCajasDisponibles().length === 0 && (
                    <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>No hay espacios registrados en este Rack/Nivel.</span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
          <div style={{ padding: '25px 45px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '15px', justifyContent: 'flex-end', alignItems: 'center' }}>
            <button type="button" onClick={() => setFormData({ sku: '', nombre: '', cantidad: '', proveedor: '', condicion: 'En buen estado', rack: '', nivel: '', caja: '' })} style={{ padding: '14px 24px', background: 'transparent', color: '#64748b', border: 'none', borderRadius: '12px', fontSize: '1.05rem', fontWeight: '700', cursor: 'pointer', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#e2e8f0'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>Limpiar</button>
            <button type="button" onClick={handleProcesar} style={{ padding: '14px 32px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.3)', transition: 'transform 0.2s, box-shadow 0.2s' }} onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(16, 185, 129, 0.4)'; }} onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(16, 185, 129, 0.3)'; }}>
              <Package size={22} /> Registrar en Almacén
            </button>
          </div>
        </div>
      </div>

      {showPreviewModal && selectedRackObj && formData.caja && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#f1f5f9', padding: '24px', borderRadius: '12px', width: '600px', maxWidth: '90%', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={24} color="#3b82f6" />
              Ubicación Física de la Caja: {formData.caja}
            </h3>

            <div style={{ height: '350px', position: 'relative', overflow: 'hidden', background: 'white', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
              <div className="iso-map-container" style={{ transform: 'scale(1.2) translate(150px, 150px)', pointerEvents: 'none' }}>
                <div className="iso-estante" style={{ left: 0, top: 0, zIndex: 10 }}>
                  <div className="estante-floor-label" style={{
                    background: globalRackConfigs?.[selectedRackObj.codigo]?.bgColor || 'rgba(0,0,0,0.8)',
                    color: globalRackConfigs?.[selectedRackObj.codigo]?.textColor || 'white'
                  }}>{globalRackConfigs?.[selectedRackObj.codigo]?.text || `Rack ${selectedRackObj.codigo}`}</div>
                  <div className="estante-grid">
                    {Array.from({ length: selectedRackObj.numeroColumnas || 4 }).map((_, col) => (
                      <div key={col} className="pallet-spot relative">
                        <div className="empty-pallet"></div>
                        <div className="rack-pillar pillar-tl"></div>
                        <div className="rack-pillar pillar-tr"></div>
                        <div className="rack-pillar pillar-bl"></div>
                        <div className="rack-pillar pillar-br"></div>
                        {Array.from({ length: selectedRackObj.numeroNiveles || 3 }).map((_, lvl) => {
                          const boxCode = `${selectedRackObj.codigo}${col + 1}-N${lvl + 1}`;
                          if (getEstado(boxCode) !== 'ocupado') return null;
                          const isSelected = boxCode === formData.caja;
                          return (
                            <div
                              key={lvl}
                              className={`iso-box ${isSelected ? 'lleno' : 'ocupado'}`}
                              style={{ '--base-z': `${lvl * 40}px`, opacity: isSelected ? 1 : 0.3 }}
                            >
                              <div className="iso-face top"></div>
                              <div className="iso-face bottom"></div>
                              <div className="iso-face front"><span className="box-code">{boxCode}</span></div>
                              <div className="iso-face back"><span className="box-code">{boxCode}</span></div>
                              <div className="iso-face left"></div>
                              <div className="iso-face right"></div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <p style={{ marginTop: '15px', color: '#64748b', fontSize: '0.9rem', textAlign: 'center' }}>
              La caja destino <strong>({formData.caja})</strong> se encuentra resaltada en color verde sólido.
            </p>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" className="btn-secondary" onClick={() => setShowPreviewModal(false)}>Cerrar Vista Previa</button>
            </div>
          </div>
        </div>
      )}

      {downloadModalData && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: '24px', padding: '40px', width: '550px', maxWidth: '90%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', textAlign: 'center', animation: 'scaleIn 0.3s ease' }}>
            <div style={{ background: '#ecfdf5', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <CheckCircle size={40} color="#10b981" />
            </div>
            <h3 style={{ margin: '0 0 10px 0', color: '#0f172a', fontSize: '1.8rem', fontWeight: '800' }}>¡Ingreso Registrado!</h3>
            <p style={{ color: '#475569', fontSize: '1.05rem', marginBottom: '20px' }}>El producto ha sido asignado correctamente a la ubicación <strong>{downloadModalData.caja}</strong>.</p>
            
            <div style={{ background: '#f8fafc', padding: '30px', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', marginBottom: '30px', position: 'relative' }}>
                <div style={{ background: 'white', padding: '15px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                  <QRCodeSVG value={JSON.stringify({ sku: downloadModalData.sku, ubicacion: downloadModalData.caja, tipo: "PRODUCTO" })} size={140} level="H" imageSettings={{ src: "/logo_empresa.png", height: 32, width: 32, excavate: true }} />
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' }}>
              <button onClick={downloadHojaRecepcion} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', transition: 'transform 0.1s, filter 0.2s', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.4)' }} onMouseOver={e => e.currentTarget.style.filter = 'brightness(1.1)'} onMouseOut={e => e.currentTarget.style.filter = 'brightness(1)'} onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'} onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}>
                <FileText size={24} /> Descargar Hoja de Recepción (PDF)
              </button>
              
              <button onClick={downloadQRProducto} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '16px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', transition: 'transform 0.1s, filter 0.2s', boxShadow: '0 4px 6px -1px rgba(139, 92, 246, 0.4)' }} onMouseOver={e => e.currentTarget.style.filter = 'brightness(1.1)'} onMouseOut={e => e.currentTarget.style.filter = 'brightness(1)'} onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'} onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}>
                <Printer size={24} /> Imprimir Etiqueta QR del Producto
              </button>
            </div>
            
            <button onClick={handleFinalizar} style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline', padding: '10px' }}>
              Finalizar y regresar al formulario
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

function ViewDespacho({ user }) {
  const [scanCode, setScanCode] = useState('');
  const [foundProduct, setFoundProduct] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => { if (inputRef.current) inputRef.current.focus(); }, []);

  const handleScan = (e) => {
    e.preventDefault();
    setFoundProduct({ code: scanCode, producto: 'Casco de Seguridad 3M', stockDisponible: 150, zona: 'A-1', unidad: 'Unidades' });
  };

  return (
    <div className="despacho-container">
      <div className="scan-card">
        <form onSubmit={handleScan} className="scan-form">
          <input ref={inputRef} type="text" value={scanCode} onChange={e => setScanCode(e.target.value)} className="scan-input" />
          <button type="submit" className="btn-primary">Buscar</button>
        </form>
      </div>
    </div>
  );
}

function ViewInventario() {
  return (
    <div className="table-card">
      <div className="table-header">
        <h3>Inventario en Tiempo Real</h3>
        <div className="search-box">
          <Search size={18} color="#94a3b8" />
          <input type="text" placeholder="Buscar producto..." />
        </div>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>Código</th>
            <th>Producto</th>
            <th>Ubicación</th>
            <th>Stock</th>
            <th>Unidad</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>ALM-001</td>
            <td>Casco de Seguridad 3M</td>
            <td>A-1</td>
            <td>150</td>
            <td>Unidades</td>
            <td><span className="badge badge-success">Óptimo</span></td>
          </tr>
          <tr>
            <td>ALM-002</td>
            <td>Botas Punta de Acero Talla 42</td>
            <td>B-3</td>
            <td>5</td>
            <td>Pares</td>
            <td><span className="badge badge-danger">Stock Bajo</span></td>
          </tr>
          <tr>
            <td>ALM-003</td>
            <td>Aceite Lubricante Motor</td>
            <td>C-2</td>
            <td>24</td>
            <td>Litros</td>
            <td><span className="badge badge-success">Óptimo</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function ViewKardex() {
  return (
    <div className="table-card">
      <div className="table-header">
        <h3>Historial de Movimientos (Kardex)</h3>
        <button className="btn-secondary"><Download size={16} /> Exportar Excel</button>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>Fecha y Hora</th>
            <th>Tipo</th>
            <th>Producto</th>
            <th>Cantidad</th>
            <th>Responsable / Solicitante</th>
            <th>Doc. Referencia</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>24/07/2026 14:30</td>
            <td><span className="type-badge out"><ArrowUpFromLine size={12} /> SALIDA</span></td>
            <td>Casco de Seguridad 3M</td>
            <td>-5</td>
            <td>Juan Pérez (Mantenimiento)</td>
            <td>RET-0012</td>
          </tr>
          <tr>
            <td>24/07/2026 10:15</td>
            <td><span className="type-badge in"><ArrowDownToLine size={12} /> INGRESO</span></td>
            <td>Casco de Seguridad 3M</td>
            <td>+100</td>
            <td>Almacenero Principal</td>
            <td>ALM-001</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// --- SHARED COMPONENTS ---
function CameraControls({ rotationZ, setRotationZ, rotationX, setRotationX, zoom, setZoom, controlsOpen = true, setControlsOpen }) {
  return (
    <div className="premium-camera-controls">
      <div className="camera-header" onClick={() => setControlsOpen(!controlsOpen)}>
        <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="icon-pulse"></div>
          Controles de Cámara 3D
        </h4>
        <button className="toggle-btn">{controlsOpen ? '▼' : '▶'}</button>
      </div>

      {controlsOpen && (
        <div className="camera-body">
          <div className="control-group">
            <div className="control-label">
              <span>Ángulo (Z)</span>
              <span className="value-badge">{rotationZ}°</span>
            </div>
            <input type="range" className="premium-slider" min="-180" max="180" value={rotationZ} onChange={(e) => setRotationZ(e.target.value)} />
          </div>

          <div className="control-group">
            <div className="control-label">
              <span>Inclinación (X)</span>
              <span className="value-badge">{rotationX}°</span>
            </div>
            <input type="range" className="premium-slider" min="0" max="90" value={rotationX} onChange={(e) => setRotationX(e.target.value)} />
          </div>

          <div className="control-group">
            <div className="control-label">
              <span>Zoom Visual</span>
              <span className="value-badge">{Math.round(zoom * 100)}%</span>
            </div>
            <input type="range" className="premium-slider" min="0.5" max="2" step="0.1" value={zoom} onChange={(e) => setZoom(e.target.value)} />
          </div>

          <button className="btn-reset-view" onClick={() => { setRotationZ(-30); setRotationX(60); setZoom(1); }}>
            <RefreshCcw size={14} /> Restaurar Vista Original
          </button>
        </div>
      )}
    </div>
  );
}


export const generateHojaRecepcionPDF = (data, user, globalRackConfigs) => {
  if (!data) return;
  const doc = new jsPDF();
  
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 0, 210, 45, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(0, 45, 210, 45);

  const logoImg = document.getElementById('logo-empresa-hidden');
  if (logoImg) {
    doc.addImage(logoImg, 'PNG', 20, 7, 50, 30);
  }

  doc.setTextColor(30, 41, 59);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("HOJA DE RECEPCIÓN", 115, 20, null, null, "center");
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  const d = new Date();
  doc.text(`Fecha: ${d.toLocaleDateString()} - Documento: REC-${d.getTime().toString().slice(-6)}`, 115, 28, null, null, "center");
  doc.text(`Estado: INGRESADO - Sistema de Gestión`, 115, 34, null, null, "center");

  doc.setFillColor(255, 255, 255);
  doc.roundedRect(20, 55, 170, 60, 3, 3, 'FD');
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("Información del Producto", 25, 65);
  doc.setDrawColor(226, 232, 240);
  doc.line(25, 68, 185, 68);

  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.setFont("helvetica", "bold");
  doc.text("SKU / Código:", 25, 78);
  doc.text("Descripción:", 25, 88);
  doc.text("Cantidad:", 25, 98);
  doc.text("Proveedor:", 25, 108);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(data.sku, 60, 78);
  doc.text(data.nombre, 60, 88);
  
  doc.setFont("helvetica", "bold");
  doc.setTextColor(37, 99, 235);
  doc.text(data.cantidad.toString(), 60, 98);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(data.proveedor || "No especificado", 60, 108);

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(20, 120, 170, 45, 3, 3, 'FD');

  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.text("UBICACIÓN ASIGNADA EN ALMACÉN", 25, 130);
  doc.setDrawColor(226, 232, 240);
  doc.line(25, 133, 185, 133);

  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.setFont("helvetica", "bold");
  const rackName = globalRackConfigs?.[data.rack]?.text || `Rack ${data.rack}`;
  doc.text("Rack:", 25, 143);
  doc.text("Caja Exacta:", 25, 153);
  doc.text("Registrado por:", 110, 143);
  doc.text("Hora Ingreso:", 110, 153);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(rackName, 55, 143);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(37, 99, 235);
  doc.text(data.caja, 55, 153);
  
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(user?.name || 'Operador', 140, 143);
  doc.text(d.toLocaleTimeString(), 140, 153);

  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text("Documento generado automáticamente por Sistema de Gestión de RRHH - DNI Contract", 105, 280, null, null, "center");

  doc.save(`recepcion_${data.sku}_${d.getTime()}.pdf`);
};

export const generateEtiquetaQRPDF = (data) => {
  if (!data) return;
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [100, 60]
  });

  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(1.5);
  doc.rect(2, 2, 96, 56);

  doc.setFillColor(15, 23, 42);
  doc.rect(2, 2, 96, 12, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("ETIQUETA DE ALMACÉN", 50, 10, null, null, "center");

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.text(`SKU: ${data.sku}`, 5, 22);
  
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  let prodName = data.nombre;
  if (prodName.length > 30) prodName = prodName.substring(0, 27) + "...";
  doc.text(prodName, 5, 28);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(37, 99, 235);
  doc.text(`CANTIDAD: ${data.cantidad}`, 5, 38);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(`CAJA: ${data.caja}`, 5, 46);
  doc.text(`RACK: ${data.rack}`, 5, 52);

  const qrCanvas = document.getElementById('recepcion-qr');
  if (qrCanvas) {
    const qrDataUrl = qrCanvas.toDataURL('image/png');
    doc.addImage(qrDataUrl, 'PNG', 65, 20, 30, 30);
  }

  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text("DNI Contract - RRHH", 95, 56, null, null, "right");

  doc.save(`etiqueta_qr_${data.sku}.pdf`);
};
