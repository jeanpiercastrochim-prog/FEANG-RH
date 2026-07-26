import { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardHome from './components/DashboardHome';
import ScannerFlow from './components/ScannerFlow';
import SubirContratos from './components/SubirContratos';
import BoletasDePago from './components/BoletasDePago';
import Login from './components/Login';
import MensajesPersonal from './components/MensajesPersonal';
import PersonalRRHH from './components/PersonalRRHH';
import Maestros from './components/Maestros';
import MisSolicitudes from './components/MisSolicitudes';
import DashboardTransportista from './components/DashboardTransportista';
import DashboardAlmacen from './components/DashboardAlmacen';
import { Briefcase, MapPin, X } from 'lucide-react';
import './index.css';

function App() {
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('userSession');
    return saved ? JSON.parse(saved) : null;
  });
  const navigate = useNavigate();
  const location = useLocation();

  const handleSelectRole = (role) => {
    setShowRoleModal(false);
    if (role === 'RH') {
      navigate('/scanner/rh');
    } else if (role === 'CAMPO') {
      navigate('/scanner/campo');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userSession');
    setUser(null);
    navigate('/');
  };

  const handleUpdateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('userSession', JSON.stringify(updatedUser));
  };

  const isScannerRoute = location.pathname.startsWith('/scanner/');

  if (!user) {
    return (
      <Login onLoginSuccess={(userData) => {
        localStorage.setItem('userSession', JSON.stringify(userData));
        setUser(userData);
      }} />
    );
  }

  if (user.rol === 'Transportista') {
    return <DashboardTransportista user={user} onLogout={handleLogout} />;
  }

  if (user.rol === 'Almacenero') {
    return <DashboardAlmacen user={user} onLogout={handleLogout} />;
  }

  return (
    <>
      <div className={`layout-container ${isScannerRoute ? 'kiosk-mode' : ''}`}>
        {!isScannerRoute && (
          <Sidebar user={user} onLogout={handleLogout} />
        )}
        
        <main className="main-area" style={isScannerRoute ? { marginLeft: 0, padding: 0 } : {}}>
          {!isScannerRoute && <Header user={user} onLogout={handleLogout} onUpdateUser={handleUpdateUser} />}
          <div className="content-area" style={isScannerRoute ? { height: '100vh', padding: 0 } : {}}>
            <Routes>
              <Route path="/" element={<DashboardHome onOpenRoleModal={() => setShowRoleModal(true)} />} />
              <Route path="/scanner/rh" element={<ScannerFlow role="RH" onBack={() => navigate('/')} />} />
              <Route path="/scanner/campo" element={<ScannerFlow role="CAMPO" onBack={() => navigate('/')} />} />
              <Route path="/contratos/subir" element={<SubirContratos />} />
              <Route path="/boletas" element={<BoletasDePago />} />
              <Route path="/mensajes" element={<MensajesPersonal />} />
              <Route path="/personal" element={<PersonalRRHH />} />
              <Route path="/maestros/:tab?" element={<Maestros />} />
              <Route path="/solicitudes" element={<MisSolicitudes />} />
              <Route path="*" element={
                <div className="placeholder-view">
                  <h2>Módulo en construcción</h2>
                  <p>Esta sección estará disponible próximamente.</p>
                </div>
              } />
            </Routes>
          </div>
        </main>
      </div>

      {showRoleModal && (
        <div className="fullscreen-modal-overlay animate-fade">
          <div className="fullscreen-modal-content">
            <button className="modal-close-icon" onClick={() => setShowRoleModal(false)}>
              <X size={24} />
            </button>
            
            <div className="modal-header-fancy">
              <h2>Selecciona tu Perfil</h2>
              <p>Elige cómo deseas ingresar al módulo de Firma de Contratos</p>
            </div>

            <div className="role-cards-container">
              <div className="role-card-fancy rh" onClick={() => handleSelectRole('RH')}>
                <div className="role-icon-wrapper"><Briefcase size={32} /></div>
                <h3>Personal de RH</h3>
                <p>Verifica datos, escanea y gestiona contratos desde oficina.</p>
                <div className="role-card-arrow">→</div>
              </div>

              <div className="role-card-fancy campo" onClick={() => handleSelectRole('CAMPO')}>
                <div className="role-icon-wrapper"><MapPin size={32} /></div>
                <h3>Usuario de Campo</h3>
                <p>Toma fotografías del DNI y envía la información rápidamente.</p>
                <div className="role-card-arrow">→</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
