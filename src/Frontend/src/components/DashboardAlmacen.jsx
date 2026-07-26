import React, { useState, useEffect, useRef } from 'react';
import { 
  Package, LayoutDashboard, Grid, ArrowDownToLine, ArrowUpFromLine, 
  ClipboardList, FileText, Search, Plus, MapPin, CheckCircle, 
  AlertTriangle, ScanLine, Printer, Download, LogOut, Menu, RefreshCcw, Truck
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

import './DashboardAlmacen.css';

export default function DashboardAlmacen({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <ViewDashboard />;
      case 'mapeo':
        return <ViewMapeo />;
      case 'editor':
        return <ViewEditorMapeo />;
      case 'recepcion':
        return <ViewRecepcion user={user} />;
      case 'despacho':
        return <ViewDespacho user={user} />;
      case 'inventario':
        return <ViewInventario />;
      case 'contenedores':
        return <ViewContenedores />;
      case 'kardex':
        return <ViewKardex />;
      default:
        return <ViewDashboard />;
    }
  };

  return (
    <div className={`almacen-layout ${isSidebarOpen ? '' : 'sidebar-closed'}`}>
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

function ViewMapeo() {
  const [rotationZ, setRotationZ] = useState(-30);
  const [rotationX, setRotationX] = useState(60);
  const [zoom, setZoom] = useState(1);
  const [controlsOpen, setControlsOpen] = useState(true);
  const [selectedBox, setSelectedBox] = useState(null);
  const [racksData, setRacksData] = useState([]);
  
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
    let hash = 0;
    for (let i = 0; i < idStr.length; i++) {
      hash = idStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    const r = Math.abs(hash) % 100;
    return r < 60 ? 'ocupado' : r < 75 ? 'bloqueado' : 'libre';
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
    <div style={{ display: 'flex', height: 'calc(100vh - 80px)', gap: '16px', position: 'relative' }}>
      <div 
        style={{ flex: 1, position: 'relative', overflow: 'hidden', background: 'transparent', cursor: isDragging ? 'grabbing' : 'grab' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <div className="isometric-map-wrapper">
        <div className="map-controls" style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 10, background: 'white', padding: '16px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', width: '220px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: controlsOpen ? '16px' : '0' }}>
            <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#0f172a' }}>📷 Control de Cámara</h4>
            <button onClick={() => setControlsOpen(!controlsOpen)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', padding: '0 4px', color: '#64748b' }}>
              {controlsOpen ? '−' : '+'}
            </button>
          </div>
          {controlsOpen && (
            <>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '0.85rem', color: '#334155' }}>Ángulo Lateral (Z): {rotationZ}°</label>
              <input type="range" min="-180" max="180" value={rotationZ} onChange={(e) => setRotationZ(e.target.value)} style={{ width: '100%', marginBottom: '12px', cursor: 'pointer' }} />
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '0.85rem', color: '#334155' }}>Inclinación (X): {rotationX}°</label>
              <input type="range" min="0" max="90" value={rotationX} onChange={(e) => setRotationX(e.target.value)} style={{ width: '100%', marginBottom: '12px', cursor: 'pointer' }} />
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '0.85rem', color: '#334155' }}>Zoom: {Math.round(zoom * 100)}%</label>
              <input type="range" min="0.5" max="2" step="0.1" value={zoom} onChange={(e) => setZoom(e.target.value)} style={{ width: '100%', cursor: 'pointer' }} />
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '12px' }}>
                <button onClick={() => { setRotationZ(-30); setRotationX(60); setZoom(1); }} style={{ fontSize: '0.75rem', padding: '6px 12px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer', width: '100%', fontWeight: 'bold', color: '#334155' }}>Restablecer Vista</button>
              </div>
            </>
          )}
        </div>
        <div className="isometric-plane custom-layout" style={{ transform: `scale(${zoom}) rotateX(${rotationX}deg) rotateZ(${rotationZ}deg)`, transition: 'transform 0.1s ease-out' }}>
          <div className="main-warehouse-area">
            {racksData.map(rack => (
              <div key={rack.id} className="iso-estante" style={{ left: parseFloat(rack.posicionX || rack.x) - 40, top: rack.posicionY || rack.y }}>
                <div className="estante-floor-label">ESTANTE {rack.codigo || rack.id}</div>
                <div className="estante-grid">
                  {Array.from({length: rack.numeroColumnas || 4}).map((_, pos) => (
                    <div key={pos} className="pallet-spot relative" onClick={() => { setSelectedBox(null); }}>
                      <div className="empty-pallet"></div>
                      <div className="rack-pillar pillar-tl"></div>
                      <div className="rack-pillar pillar-tr"></div>
                      <div className="rack-pillar pillar-bl"></div>
                      <div className="rack-pillar pillar-br"></div>
                      
                      {Array.from({length: rack.numeroNiveles || 3}).map((_, nivel) => {
                        const boxCode = `${rack.codigo || rack.id}${pos+1}-N${nivel+1}`;
                        const estado = getEstado(boxCode);
                        if (estado === 'libre') return null;
                        const isSelected = selectedBox === boxCode;
                        return (
                          <div key={nivel} className={`iso-box ${estado} ${isSelected ? 'selected' : ''}`} style={{ '--base-z': `${nivel * 40}px` }} onClick={(e) => { e.stopPropagation(); setSelectedBox(boxCode); }}>
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
            <div className="porton-entrada">
              <span className="text-rotated">portón entrada</span>
            </div>
            <div className="ventana-despacho">
              <span className="text-rotated">ventana de<br/>despacho</span>
            </div>

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
          <div className="llegada-vehiculos" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '30px' }}>
            <span className="text-rotated-llegada">Zona de<br/>Desembarque</span>
            <div className="truck-model" style={{ transform: 'rotateZ(-45deg)', background: '#cbd5e1', width: '120px', height: '50px', borderRadius: '8px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '5px 5px 15px rgba(0,0,0,0.3)', border: '2px solid #94a3b8' }}>
               <Truck size={36} color="#334155" />
               <div style={{ position: 'absolute', right: '-15px', width: '30px', height: '40px', background: '#3b82f6', borderRadius: '6px', border: '2px solid #1d4ed8' }}></div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

function ViewEditorMapeo() {
  const [racks, setRacks] = useState([]);
  const [rotationZ] = useState(-30);
  const [rotationX] = useState(60);
  const [zoom, setZoom] = useState(1);
  const [selectedRack, setSelectedRack] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

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
    .then(() => { alert("Guardado"); setIsSaving(false); })
    .catch(() => { alert("Error"); setIsSaving(false); });
  };

  const getEstado = (idStr) => {
    let hash = 0;
    for (let i = 0; i < idStr.length; i++) hash = idStr.charCodeAt(i) + ((hash << 5) - hash);
    const r = Math.abs(hash) % 100;
    return r < 60 ? 'ocupado' : r < 75 ? 'bloqueado' : 'libre';
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 80px)', gap: '16px' }}>
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#f8fafc', borderRadius: '12px' }}>
        <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 10, background: 'white', padding: '16px', borderRadius: '12px' }}>
          <button onClick={handleSave} className="btn-primary" style={{ background: '#10b981' }}>{isSaving ? 'Guardando...' : 'Guardar Mapa'}</button>
        </div>
        <div className="isometric-plane custom-layout" style={{ transform: `scale(${zoom}) rotateX(${rotationX}deg) rotateZ(${rotationZ}deg)`, transition: 'transform 0.1s ease-out' }}>
          <div className="main-warehouse-area">
            {racks.map(rack => (
              <div key={rack.codigo} className="iso-estante" style={{ left: parseFloat(rack.posicionX) - 40, top: rack.posicionY }} onClick={() => setSelectedRack(rack)}>
                <div className="estante-floor-label" style={{ background: selectedRack?.codigo === rack.codigo ? '#3b82f6' : 'rgba(0,0,0,0.8)' }}>ESTANTE {rack.codigo}</div>
                <div className="estante-grid">
                  {Array.from({length: rack.numeroColumnas}).map((_, col) => (
                    <div key={col} className="pallet-spot relative">
                      <div className="empty-pallet"></div>
                      <div className="rack-pillar pillar-tl"></div>
                      <div className="rack-pillar pillar-tr"></div>
                      <div className="rack-pillar pillar-bl"></div>
                      <div className="rack-pillar pillar-br"></div>
                      {Array.from({length: rack.numeroNiveles}).map((_, lvl) => {
                        const boxCode = `${rack.codigo}${col+1}-N${lvl+1}`;
                        const estado = getEstado(boxCode);
                        if (estado === 'libre') return null;
                        return (
                          <div key={lvl} className={`iso-box ${estado}`} style={{ '--base-z': `${lvl * 40}px` }}>
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
            <div className="porton-entrada">
              <span className="text-rotated">portón entrada</span>
            </div>
            <div className="ventana-despacho">
              <span className="text-rotated">ventana de<br/>despacho</span>
            </div>

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
          <div className="llegada-vehiculos" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '30px' }}>
            <span className="text-rotated-llegada">Zona de<br/>Desembarque</span>
            <div className="truck-model" style={{ transform: 'rotateZ(-45deg)', background: '#cbd5e1', width: '120px', height: '50px', borderRadius: '8px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '5px 5px 15px rgba(0,0,0,0.3)', border: '2px solid #94a3b8' }}>
               <Truck size={36} color="#334155" />
               <div style={{ position: 'absolute', right: '-15px', width: '30px', height: '40px', background: '#3b82f6', borderRadius: '6px', border: '2px solid #1d4ed8' }}></div>
            </div>
          </div>
        </div>
      </div>
      <div style={{ width: '340px', background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', color: '#0f172a' }}>Propiedades del Estante</h3>
        {selectedRack ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold' }}>Código de Rack</label>
              <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 'bold', color: '#1e293b' }}>
                RACK-{selectedRack.codigo}
              </div>
            </div>
            
            <div style={{ marginTop: '20px', padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <QRCodeSVG value={`RACK-${selectedRack.codigo}`} size={120} style={{ margin: '0 auto 10px auto' }} />
              <p style={{ fontSize: '1rem', fontWeight: 'bold', color: '#0f172a' }}>RACK-{selectedRack.codigo}</p>
              <button className="btn-secondary" onClick={() => window.print()} style={{ width: '100%', marginTop: '10px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                <Printer size={18}/> Imprimir QR
              </button>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '30px 10px' }}>
            <ScanLine size={32} style={{ opacity: 0.5, margin: '0 auto 12px auto' }} />
            <p>Selecciona un estante en el mapa para ver sus detalles e imprimir el QR físico.</p>
          </div>
        )}
      </div>
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
                  Array.from({length: rack.numeroColumnas || 4}).map((_, col) => (
                    Array.from({length: rack.numeroNiveles || 3}).map((_, lvl) => {
                      const id = `R${rack.codigo}-C${col+1}-N${lvl+1}`;
                      return (
                        <tr key={id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px', fontWeight: 'bold' }}>{id}</td>
                          <td style={{ padding: '12px' }}>{rack.codigo}</td>
                          <td style={{ padding: '12px' }}>{col+1}</td>
                          <td style={{ padding: '12px' }}>{lvl+1}</td>
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

function ViewRecepcion({ user }) {
  const [step, setStep] = useState(1);
  const [racks, setRacks] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5051/api/almacen/racks')
      .then(res => res.json())
      .then(data => setRacks(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="recepcion-container">
      <div className="form-card">
        <h3>Registrar Ingreso de Mercadería</h3>
        <div className="form-group">
            <label>Condición al Recibir</label>
            <select className="form-input">
              <option>En buen estado</option>
              <option>Empaque Dañado</option>
              <option>Incompleto</option>
            </select>
        </div>

        <h4 style={{ color: '#0f172a', marginBottom: '15px', marginTop: '30px' }}>Ubicación en Almacén</h4>
        <div className="form-grid">
          <div className="form-group">
            <label>Asignar a Zona/Rack (Opcional)</label>
            <select className="form-input">
              <option value="">-- Seleccionar Zona --</option>
              {racks.map(r => (
                <option key={r.codigo} value={r.codigo}>Zona / Rack {r.codigo}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ marginTop: '30px', display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
          <button type="button" className="btn-secondary" onClick={() => setStep(1)}>Volver</button>
          <button type="button" className="btn-primary" onClick={() => setStep(3)}>Procesar Ingreso</button>
        </div>
      </div>
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
          <Search size={18} color="#94a3b8"/>
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
        <button className="btn-secondary"><Download size={16}/> Exportar Excel</button>
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
            <td><span className="type-badge out"><ArrowUpFromLine size={12}/> SALIDA</span></td>
            <td>Casco de Seguridad 3M</td>
            <td>-5</td>
            <td>Juan Pérez (Mantenimiento)</td>
            <td>RET-0012</td>
          </tr>
          <tr>
            <td>24/07/2026 10:15</td>
            <td><span className="type-badge in"><ArrowDownToLine size={12}/> INGRESO</span></td>
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
