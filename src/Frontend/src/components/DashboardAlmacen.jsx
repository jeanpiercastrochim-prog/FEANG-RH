import React, { useState, useEffect, useRef } from 'react';
import { 
  Package, LayoutDashboard, Grid, ArrowDownToLine, ArrowUpFromLine, 
  ClipboardList, FileText, Search, Plus, MapPin, CheckCircle, 
  AlertTriangle, ScanLine, Printer, Download, LogOut, Menu, RefreshCcw 
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
      case 'recepcion':
        return <ViewRecepcion user={user} />;
      case 'despacho':
        return <ViewDespacho user={user} />;
      case 'inventario':
        return <ViewInventario />;
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
          <div className="nav-divider" />
          <NavItem active={activeTab === 'recepcion'} onClick={() => setActiveTab('recepcion')} icon={<ArrowDownToLine size={20} />} label="Recepción (Ingreso)" />
          <NavItem active={activeTab === 'despacho'} onClick={() => setActiveTab('despacho')} icon={<ArrowUpFromLine size={20} />} label="Despacho (Retiro)" />
          <div className="nav-divider" />
          <NavItem active={activeTab === 'inventario'} onClick={() => setActiveTab('inventario')} icon={<ClipboardList size={20} />} label="Inventario" />
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
    recepcion: 'Registro de Recepción',
    despacho: 'Despacho de Mercadería',
    inventario: 'Inventario Actual',
    kardex: 'Kardex de Movimientos'
  };
  return titles[tab] || '';
}

// --- VIEWS COMPONENTS (Mocks for Phase 1) ---

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
  const [selectedColumn, setSelectedColumn] = useState(null);
  const [selectedBox, setSelectedBox] = useState(null);

  // 8 Estantes según el diagrama (2 filas x 4 columnas)
  const racksData = [
    // Fila Superior
    { id: '1', x: 100, y: 150 },
    { id: '2', x: 280, y: 150 },
    { id: '3', x: 460, y: 150 },
    { id: '4', x: 640, y: 150 },
    // Fila Inferior
    { id: '5', x: 100, y: 350 },
    { id: '6', x: 280, y: 350 },
    { id: '7', x: 460, y: 350 },
    { id: '8', x: 640, y: 350 },
  ];

  // Función determinista para que el mapa no cambie en cada render ni al recargar
  const getEstado = (idStr) => {
    let hash = 0;
    for (let i = 0; i < idStr.length; i++) {
      hash = idStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    const r = Math.abs(hash) % 100;
    return r < 60 ? 'ocupado' : r < 75 ? 'bloqueado' : 'libre';
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 80px)', gap: '16px', position: 'relative' }}>
      {/* MAPA Y CONTROLES FLOTANTES */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: 'transparent' }}>
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
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '0.85rem', color: '#334155' }}>
                Ángulo Lateral (Z): {rotationZ}°
              </label>
              <input type="range" min="-180" max="180" value={rotationZ} onChange={(e) => setRotationZ(e.target.value)} style={{ width: '100%', marginBottom: '12px', cursor: 'pointer' }} />
              
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '0.85rem', color: '#334155' }}>
                Inclinación (X): {rotationX}°
              </label>
              <input type="range" min="0" max="90" value={rotationX} onChange={(e) => setRotationX(e.target.value)} style={{ width: '100%', marginBottom: '12px', cursor: 'pointer' }} />

              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '0.85rem', color: '#334155' }}>
                Zoom: {Math.round(zoom * 100)}%
              </label>
              <input type="range" min="0.5" max="2" step="0.1" value={zoom} onChange={(e) => setZoom(e.target.value)} style={{ width: '100%', cursor: 'pointer' }} />

              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '12px' }}>
                <button onClick={() => { setRotationZ(-30); setRotationX(60); setZoom(1); }} style={{ fontSize: '0.75rem', padding: '6px 12px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer', width: '100%', fontWeight: 'bold', color: '#334155' }}>Restablecer Vista</button>
              </div>
            </>
          )}
        </div>

        <div className="isometric-plane custom-layout" style={{ transform: `scale(${zoom}) rotateX(${rotationX}deg) rotateZ(${rotationZ}deg)`, transition: 'transform 0.1s ease-out' }}>
          
          {/* Zona Principal (Gris) */}
          <div className="main-warehouse-area">
            
            {/* Racks (Estantes) */}
            {racksData.map(rack => (
              <div key={rack.id} className="iso-estante" style={{ left: rack.x, top: rack.y }}>
                <div className="estante-floor-label">ESTANTE 0{rack.id}</div>
                <div className="estante-grid">
                  {[0, 1, 2, 3].map(pos => (
                    <div 
                      key={pos} 
                      className="pallet-spot relative" 
                      onClick={() => { setSelectedColumn({ rackId: rack.id, pos: pos + 1 }); setSelectedBox(null); }}
                    >
                      <div className="empty-pallet"></div>
                      
                      {/* Pilares del Rack */}
                      <div className="rack-pillar pillar-tl"></div>
                      <div className="rack-pillar pillar-tr"></div>
                      <div className="rack-pillar pillar-bl"></div>
                      <div className="rack-pillar pillar-br"></div>
                      
                      {/* 3 Niveles */}
                      {[0, 1, 2].map(nivel => {
                        const boxCode = `E${rack.id}-P${pos+1}-L${nivel+1}`;
                        const estado = getEstado(boxCode);
                        if (estado === 'libre') return null;
                        
                        const isSelected = selectedBox === boxCode;
                        const boxClasses = `iso-box ${estado} ${isSelected ? 'selected' : ''}`;

                        return (
                          <div key={nivel} className={boxClasses} style={{ '--base-z': `${nivel * 40}px` }}>
                            <div className="iso-face top"></div>
                            <div className="iso-face bottom"></div>
                            <div className="iso-face front">
                              <span className="box-code">{boxCode}</span>
                            </div>
                            <div className="iso-face back">
                              <span className="box-code">{boxCode}</span>
                            </div>
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

            {/* Portón de Entrada y Ventana de Despacho */}
            <div className="porton-entrada">
              <span className="text-rotated">portón entrada</span>
            </div>
            <div className="ventana-despacho">
              <span className="text-rotated">ventana de<br/>despacho</span>
            </div>

          </div>

          {/* Llegada de vehículos */}
          <div className="llegada-vehiculos">
            <span className="text-rotated-llegada">Llegada de<br/>vehículos con<br/>carga</span>
          </div>

        </div>
        </div>
      </div>

      {/* PANEL LATERAL DERECHO (INSPECCIÓN Y ESTADÍSTICAS) */}
      <div style={{ width: '340px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', paddingRight: '4px' }}>
        
        {/* Tarjeta 1: Información de Ubicación */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', color: '#0f172a', fontWeight: 'bold' }}>Información de Ubicación</h3>
          
          {selectedBox ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: '900', color: '#1e293b' }}>{selectedBox}</span>
                <span className={`status-badge ${getEstado(selectedBox)}`} style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '6px' }}>
                  {getEstado(selectedBox).toUpperCase()}
                </span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Zona</span><span style={{ fontWeight: '600' }}>Principal</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Rack</span><span style={{ fontWeight: '600' }}>{selectedBox.split('-')[0].replace('E', '')}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Nivel</span><span style={{ fontWeight: '600' }}>{selectedBox.split('-')[2].replace('L', '')}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Capacidad Máx.</span><span style={{ fontWeight: '600' }}>100 unidades</span></div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 0', color: '#94a3b8', fontSize: '0.9rem' }}>
              <Package size={32} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
              Selecciona una caja o espacio en el mapa para ver sus detalles aquí.
            </div>
          )}
        </div>

        {/* Tarjeta 2: Resumen por Estado */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', color: '#0f172a', fontWeight: 'bold' }}>Resumen por Estado</h3>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {/* Gráfico de dona (simulado con CSS) */}
            <div style={{ 
              width: '100px', height: '100px', borderRadius: '50%', 
              background: 'conic-gradient(#22c55e 0% 30%, #f59e0b 30% 65%, #ef4444 65% 90%, #64748b 90% 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'white' }}></div>
            </div>
            
            {/* Leyenda */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }}></div>Libre</span><span style={{ color: '#64748b' }}>38 (31.7%)</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }}></div>Parcial</span><span style={{ color: '#64748b' }}>44 (36.7%)</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }}></div>Ocupado</span><span style={{ color: '#64748b' }}>32 (26.7%)</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#64748b' }}></div>Bloqueado</span><span style={{ color: '#64748b' }}>6 (5.0%)</span></div>
            </div>
          </div>
        </div>

        {/* Tarjeta 3: Filtros */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', color: '#0f172a', fontWeight: 'bold' }}>Filtros y Visualización</h3>
          
          <select style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '12px', outline: 'none' }}>
            <option>Todos los Estados</option>
            <option>Libres</option>
            <option>Ocupados</option>
          </select>
          
          <select style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '16px', outline: 'none' }}>
            <option>Todas las Zonas</option>
            <option>Zona Principal</option>
          </select>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <span style={{ fontSize: '0.9rem', color: '#334155', fontWeight: '500' }}>Mostrar Nombres de Racks</span>
            <div style={{ width: '40px', height: '22px', background: '#3b82f6', borderRadius: '11px', position: 'relative', cursor: 'pointer' }}>
              <div style={{ width: '18px', height: '18px', background: 'white', borderRadius: '50%', position: 'absolute', top: '2px', right: '2px' }}></div>
            </div>
          </div>

          <button onClick={() => { setRotationZ(-30); setRotationX(60); setZoom(1); }} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#3b82f6', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
            <RefreshCcw size={16} />
            Actualizar Mapa
          </button>
        </div>
      </div>
    </div>
  );
}

function ViewRecepcion({ user }) {
  const [formData, setFormData] = useState({
    proveedor: '', producto: '', cantidad: '', unidad: 'Unidades', zona: 'A-1'
  });
  const [generatedCode, setGeneratedCode] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const code = `ALM-${Date.now().toString().slice(-6)}`;
    setGeneratedCode({ ...formData, code, date: new Date() });
    alert("Recepción registrada correctamente.");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="recepcion-container">
      <div className="form-card">
        <h3>Registrar Ingreso</h3>
        <form onSubmit={handleSubmit} className="recepcion-form">
          <div className="form-row">
            <div className="form-group">
              <label>Producto / Material</label>
              <input required value={formData.producto} onChange={e => setFormData({...formData, producto: e.target.value})} placeholder="Ej: Casco de Seguridad" />
            </div>
            <div className="form-group">
              <label>Proveedor / Área Origen</label>
              <input required value={formData.proveedor} onChange={e => setFormData({...formData, proveedor: e.target.value})} placeholder="Ej: 3M Perú" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Cantidad</label>
              <input type="number" required value={formData.cantidad} onChange={e => setFormData({...formData, cantidad: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Unidad de Medida</label>
              <select value={formData.unidad} onChange={e => setFormData({...formData, unidad: e.target.value})}>
                <option>Unidades</option>
                <option>Cajas</option>
                <option>Kg</option>
                <option>Litros</option>
              </select>
            </div>
            <div className="form-group">
              <label>Ubicación (Destino)</label>
              <select value={formData.zona} onChange={e => setFormData({...formData, zona: e.target.value})}>
                <option value="A-1">Zona A - Rack 1</option>
                <option value="B-3">Zona B - Rack 3</option>
                <option value="C-2">Zona C - Rack 2</option>
              </select>
            </div>
          </div>
          <button type="submit" className="btn-primary">Registrar y Generar QR</button>
        </form>
      </div>

      {generatedCode && (
        <div className="ticket-preview-card">
          <div className="ticket-header">
            <h3>Hoja de Recepción (Vista Previa)</h3>
            <button className="btn-secondary" onClick={handlePrint}><Printer size={16}/> Imprimir Etiqueta</button>
          </div>
          <div className="ticket-body" id="printable-ticket">
            <div className="ticket-logo">
              <Package size={32} color="#0f172a" />
              <h2>CHAVIN LOGISTICS</h2>
            </div>
            <div className="ticket-qr">
               <QRCodeSVG value={generatedCode.code} size={120} />
               <p className="ticket-code">{generatedCode.code}</p>
            </div>
            <div className="ticket-details">
              <p><strong>Producto:</strong> {generatedCode.producto}</p>
              <p><strong>Cantidad:</strong> {generatedCode.cantidad} {generatedCode.unidad}</p>
              <p><strong>Ubicación:</strong> {generatedCode.zona}</p>
              <p><strong>Fecha:</strong> {generatedCode.date.toLocaleString('es-ES')}</p>
              <p><strong>Recibido por:</strong> {user?.nombres}</p>
            </div>
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

  useEffect(() => {
    // Auto-focus para la pistola lectora
    if (inputRef.current) inputRef.current.focus();
  }, []);

  const handleScan = (e) => {
    e.preventDefault();
    if (scanCode.trim() === '') return;
    
    // Simular búsqueda en BD local
    setFoundProduct({
      code: scanCode,
      producto: 'Casco de Seguridad 3M',
      stockDisponible: 150,
      zona: 'A-1',
      unidad: 'Unidades'
    });
  };

  const handleRetiro = (e) => {
    e.preventDefault();
    alert(`Retiro de ${scanCode} registrado exitosamente.`);
    setFoundProduct(null);
    setScanCode('');
    if (inputRef.current) inputRef.current.focus();
  };

  return (
    <div className="despacho-container">
      <div className="scan-card">
        <div className="scan-icon-pulse"><ScanLine size={48} color="#3b82f6" /></div>
        <h3>Escanear Código de Retiro</h3>
        <p>Use la pistola lectora o escriba el código QR generado en la recepción.</p>
        
        <form onSubmit={handleScan} className="scan-form">
          <input 
            ref={inputRef}
            type="text" 
            placeholder="Esperando lectura de código..." 
            value={scanCode}
            onChange={e => setScanCode(e.target.value)}
            className="scan-input"
            autoFocus
          />
          <button type="submit" className="btn-primary">Buscar</button>
        </form>
      </div>

      {foundProduct && (
        <div className="retiro-form-card">
          <h3>Confirmar Retiro</h3>
          <div className="product-info-box">
            <div className="info-item">
              <span className="info-label">Producto</span>
              <span className="info-value">{foundProduct.producto}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Stock Disponible</span>
              <span className="info-value text-green">{foundProduct.stockDisponible} {foundProduct.unidad}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Ubicación</span>
              <span className="info-value">{foundProduct.zona}</span>
            </div>
          </div>

          <form onSubmit={handleRetiro} className="retiro-form">
            <div className="form-row">
              <div className="form-group">
                <label>Solicitante / Área</label>
                <input required placeholder="Ej: Juan Pérez - Mantenimiento" />
              </div>
              <div className="form-group">
                <label>Cantidad a Retirar</label>
                <input type="number" required max={foundProduct.stockDisponible} placeholder="Ej: 5" />
              </div>
            </div>
            <div className="form-group">
              <label>Motivo (Opcional)</label>
              <input placeholder="Ej: Reposición de EPPs" />
            </div>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => { setFoundProduct(null); setScanCode(''); }}>Cancelar</button>
              <button type="submit" className="btn-primary bg-orange">Confirmar Retiro (Descontar Stock)</button>
            </div>
          </form>
        </div>
      )}
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
