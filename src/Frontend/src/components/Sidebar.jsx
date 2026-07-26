import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, FileText, FileSpreadsheet, Users, BarChart3, Settings, HelpCircle, ChevronDown, ChevronRight, Upload, Briefcase, MapPin, LogOut, MessageSquare } from 'lucide-react';

export default function Sidebar({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [gestionRhOpen, setGestionRhOpen] = useState(true);
  const [contratosOpen, setContratosOpen] = useState(false);
  const [boletasOpen, setBoletasOpen] = useState(false);

  const menuItems = [
    { id: 'maestros', label: 'Maestros', icon: Settings, path: '/maestros' },
    { id: 'mensajes', label: 'Mensajes a Personal', icon: MessageSquare, path: '/mensajes' },
    { id: 'reportes', label: 'Reportes', icon: BarChart3, path: '/reportes' },
  ];

  const isPersonalActive = location.pathname.startsWith('/personal');
  const isSolicitudesActive = location.pathname.startsWith('/solicitudes');
  const isContratosActive = location.pathname.startsWith('/contratos') || location.pathname.startsWith('/scanner');
  const isBoletasActive = location.pathname.startsWith('/boletas');
  const isGestionRhActive = isContratosActive || isBoletasActive || isPersonalActive || isSolicitudesActive;

  return (
    <div className="left-panel">
      <div className="sidebar-logo">
        <h2 className="logo-text-blue">CHAVIN</h2>
        <div className="logo-line-container">
          <div className="logo-line"></div>
          <div className="logo-dots">
            <span className="dot green"></span>
            <span className="dot yellow"></span>
            <span className="dot gray"></span>
          </div>
          <div className="logo-line"></div>
        </div>
      </div>

      <aside className="sidebar">
        <nav className="sidebar-nav">
          {/* Inicio */}
          <button
            className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}
            onClick={() => navigate('/')}
          >
            <Home size={20} className="nav-icon" />
            <span>Inicio</span>
          </button>

          {/* Gestión R.H. Accordion */}
          <div className="nav-accordion">
            <button
              className={`nav-item ${isGestionRhActive ? 'active' : ''}`}
              onClick={() => setGestionRhOpen(!gestionRhOpen)}
              style={{ justifyContent: 'space-between' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Users size={20} className="nav-icon" />
                <span>Gestión R.H.</span>
              </div>
              {gestionRhOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            
            {gestionRhOpen && (
              <div className="submenu">
                
                {/* Personal Button (No Sub-Accordion, Direct Link) */}
                <button 
                  className={`submenu-item ${location.pathname === '/personal' ? 'active-text' : ''}`}
                  onClick={() => navigate('/personal')}
                  style={{ paddingLeft: '24px', fontWeight: location.pathname === '/personal' ? '600' : '400' }}
                >
                  <Users size={16} /> Personal
                </button>
                
                {/* Solicitudes Button */}
                <button 
                  className={`submenu-item ${location.pathname === '/solicitudes' ? 'active-text' : ''}`}
                  onClick={() => navigate('/solicitudes')}
                  style={{ paddingLeft: '24px', fontWeight: location.pathname === '/solicitudes' ? '600' : '400' }}
                >
                  <FileText size={16} /> Mis Solicitudes
                </button>
                
                {/* Contratos Sub-Accordion */}
                <div className="nav-accordion" style={{ marginTop: '4px' }}>
                  <button
                    className={`nav-item ${isContratosActive ? 'active' : ''}`}
                    onClick={() => setContratosOpen(!contratosOpen)}
                    style={{ justifyContent: 'space-between', paddingLeft: '24px', background: 'transparent' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <FileText size={18} className="nav-icon" />
                      <span style={{ fontSize: '14px' }}>Contratos</span>
                    </div>
                    {contratosOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                  
                  {contratosOpen && (
                    <div className="submenu" style={{ paddingLeft: '24px' }}>
                      <button 
                        className={`submenu-item ${location.pathname === '/scanner/rh' ? 'active-text' : ''}`}
                        onClick={() => navigate('/scanner/rh')}
                      >
                        <Briefcase size={16} /> Vista Personal RH
                      </button>
                      <button 
                        className={`submenu-item ${location.pathname === '/contratos/subir' ? 'active-text' : ''}`}
                        onClick={() => navigate('/contratos/subir')}
                      >
                        <Upload size={16} /> Mis Contratos
                      </button>
                      <button 
                        className={`submenu-item ${location.pathname === '/scanner/campo' ? 'active-text' : ''}`}
                        onClick={() => navigate('/scanner/campo')}
                      >
                        <MapPin size={16} /> Vista Personal Campo
                      </button>
                    </div>
                  )}
                </div>

                {/* Boletas Sub-Accordion */}
                <div className="nav-accordion" style={{ marginTop: '4px' }}>
                  <button
                    className={`nav-item ${isBoletasActive ? 'active' : ''}`}
                    onClick={() => setBoletasOpen(!boletasOpen)}
                    style={{ justifyContent: 'space-between', paddingLeft: '24px', background: 'transparent' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <FileSpreadsheet size={18} className="nav-icon" />
                      <span style={{ fontSize: '14px' }}>Boletas</span>
                    </div>
                    {boletasOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                  
                  {boletasOpen && (
                    <div className="submenu" style={{ paddingLeft: '24px' }}>
                      <button 
                        className={`submenu-item ${location.pathname === '/boletas' ? 'active-text' : ''}`}
                        onClick={() => navigate('/boletas')}
                      >
                        <Upload size={16} /> Enviar Boletas
                      </button>
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>

          {/* Maestros Accordion */}
          <div className="nav-accordion">
            <button
              className={`nav-item ${location.pathname.startsWith('/maestros') ? 'active' : ''}`}
              onClick={() => navigate(location.pathname.startsWith('/maestros') ? '/' : '/maestros/cargos')}
              style={{ justifyContent: 'space-between' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Settings size={20} className="nav-icon" />
                <span>Maestros</span>
              </div>
              {location.pathname.startsWith('/maestros') ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            
            {location.pathname.startsWith('/maestros') && (
              <div className="submenu">
                <button 
                  className={`submenu-item ${location.pathname === '/maestros/cargos' ? 'active-text' : ''}`}
                  onClick={() => navigate('/maestros/cargos')}
                  style={{ paddingLeft: '48px', fontWeight: location.pathname === '/maestros/cargos' ? '600' : '400' }}
                >
                  <Briefcase size={16} /> Cargos
                </button>
                <button 
                  className={`submenu-item ${location.pathname === '/maestros/contratos' ? 'active-text' : ''}`}
                  onClick={() => navigate('/maestros/contratos')}
                  style={{ paddingLeft: '48px', fontWeight: location.pathname === '/maestros/contratos' ? '600' : '400' }}
                >
                  <FileText size={16} /> Contratos
                </button>
                <button 
                  className={`submenu-item ${location.pathname === '/maestros/definiciones' ? 'active-text' : ''}`}
                  onClick={() => navigate('/maestros/definiciones')}
                  style={{ paddingLeft: '48px', fontWeight: location.pathname === '/maestros/definiciones' ? '600' : '400' }}
                >
                  <Settings size={16} /> Definiciones
                </button>
                <button 
                  className={`submenu-item ${location.pathname === '/maestros/ubigeos' ? 'active-text' : ''}`}
                  onClick={() => navigate('/maestros/ubigeos')}
                  style={{ paddingLeft: '48px', fontWeight: location.pathname === '/maestros/ubigeos' ? '600' : '400' }}
                >
                  <MapPin size={16} /> Ubigeos
                </button>
                <button 
                  className={`submenu-item ${location.pathname === '/maestros/usuarios' ? 'active-text' : ''}`}
                  onClick={() => navigate('/maestros/usuarios')}
                  style={{ paddingLeft: '48px', fontWeight: location.pathname === '/maestros/usuarios' ? '600' : '400' }}
                >
                  <Users size={16} /> Usuarios
                </button>
                <button 
                  className={`submenu-item ${location.pathname === '/maestros/definicion-detalles' ? 'active-text' : ''}`}
                  onClick={() => navigate('/maestros/definicion-detalles')}
                  style={{ paddingLeft: '48px', fontWeight: location.pathname === '/maestros/definicion-detalles' ? '600' : '400' }}
                >
                  <Settings size={16} /> Detalles Def.
                </button>
                <button 
                  className={`submenu-item ${location.pathname === '/maestros/employees' ? 'active-text' : ''}`}
                  onClick={() => navigate('/maestros/employees')}
                  style={{ paddingLeft: '48px', fontWeight: location.pathname === '/maestros/employees' ? '600' : '400' }}
                >
                  <Users size={16} /> Empleados
                </button>
                <button 
                  className={`submenu-item ${location.pathname === '/maestros/employee-educations' ? 'active-text' : ''}`}
                  onClick={() => navigate('/maestros/employee-educations')}
                  style={{ paddingLeft: '48px', fontWeight: location.pathname === '/maestros/employee-educations' ? '600' : '400' }}
                >
                  <Settings size={16} /> Educ. Empleados
                </button>
                <button 
                  className={`submenu-item ${location.pathname === '/maestros/employee-contracts' ? 'active-text' : ''}`}
                  onClick={() => navigate('/maestros/employee-contracts')}
                  style={{ paddingLeft: '48px', fontWeight: location.pathname === '/maestros/employee-contracts' ? '600' : '400' }}
                >
                  <FileText size={16} /> Contratos Emp.
                </button>
                <button 
                  className={`submenu-item ${location.pathname === '/maestros/payslips' ? 'active-text' : ''}`}
                  onClick={() => navigate('/maestros/payslips')}
                  style={{ paddingLeft: '48px', fontWeight: location.pathname === '/maestros/payslips' ? '600' : '400' }}
                >
                  <FileText size={16} /> Boletas
                </button>
                <button 
                  className={`submenu-item ${location.pathname === '/maestros/employee-payslips' ? 'active-text' : ''}`}
                  onClick={() => navigate('/maestros/employee-payslips')}
                  style={{ paddingLeft: '48px', fontWeight: location.pathname === '/maestros/employee-payslips' ? '600' : '400' }}
                >
                  <FileText size={16} /> Boletas Emp.
                </button>
                <button 
                  className={`submenu-item ${location.pathname === '/maestros/dni-photos' ? 'active-text' : ''}`}
                  onClick={() => navigate('/maestros/dni-photos')}
                  style={{ paddingLeft: '48px', fontWeight: location.pathname === '/maestros/dni-photos' ? '600' : '400' }}
                >
                  <Settings size={16} /> Fotos DNI
                </button>
                <button 
                  className={`submenu-item ${location.pathname === '/maestros/app-notifications' ? 'active-text' : ''}`}
                  onClick={() => navigate('/maestros/app-notifications')}
                  style={{ paddingLeft: '48px', fontWeight: location.pathname === '/maestros/app-notifications' ? '600' : '400' }}
                >
                  <Settings size={16} /> Notificaciones
                </button>
              </div>
            )}
          </div>

          {/* Other Items */}
          {menuItems.filter(i => i.id !== 'maestros').map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <button
                key={item.id}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                <Icon size={20} className="nav-icon" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="avatar">
              {user?.foto ? (
                <img src={user.foto} alt="Perfil" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div className="avatar-placeholder">
                  {(user?.nombres || 'C').substring(0, 2).toUpperCase()}
                </div>
              )}
              <div className="status-dot"></div>
            </div>
            <div className="user-info" style={{ flex: 1 }}>
              <p className="user-name">{user?.nombres || 'Colaborador'}</p>
              <p className="user-role">{user?.rol || 'Personal'}</p>
            </div>
            <button 
              onClick={onLogout}
              className="logout-icon-btn" 
              title="Cerrar sesión"
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: 'none',
                color: '#ef4444',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '8px',
                borderRadius: '8px',
                transition: 'all 0.3s',
                marginLeft: 'auto'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
              }}
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
