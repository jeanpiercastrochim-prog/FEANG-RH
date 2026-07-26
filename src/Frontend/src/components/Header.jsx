import { useState } from 'react';
import { Bell, Calendar, Settings } from 'lucide-react';
import ProfileSettingsModal from './ProfileSettingsModal';

export default function Header({ user, onLogout, onUpdateUser }) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const currentDate = new Date().toLocaleDateString('es-PE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const currentDayTime = new Date().toLocaleDateString('es-PE', {
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit'
  });

  const handleSaveProfile = (updatedData) => {
    // Aquí actualizamos el estado global en App.jsx, lo que refrescará los datos visuales
    const currentSession = JSON.parse(localStorage.getItem('userSession') || '{}');
    const newSession = { ...currentSession, ...updatedData };
    if (onUpdateUser) {
      onUpdateUser(newSession);
    }
  };

  return (
    <>
      <header className="top-header">
        <div className="header-actions">
          <button className="header-pill icon-btn notification-btn">
            <Bell size={20} />
            <span className="badge">3</span>
          </button>
          
          <div className="header-pill date-widget">
            <Calendar size={18} className="calendar-icon" />
            <div className="date-info">
              <p className="main-date">{currentDate}</p>
              <p className="sub-date">{currentDayTime.charAt(0).toUpperCase() + currentDayTime.slice(1)}</p>
            </div>
          </div>

          <div 
            className="header-pill header-user" 
            onClick={() => setIsProfileOpen(true)} 
            title="Configuración de Perfil"
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            {user?.foto ? (
              <img src={user.foto} alt="Perfil" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div className="mini-avatar">
                {(user?.nombres || 'U').substring(0, 2).toUpperCase()}
              </div>
            )}
            <Settings size={16} style={{ opacity: 0.7 }} />
          </div>
        </div>
      </header>

      {isProfileOpen && (
        <ProfileSettingsModal 
          user={user} 
          onClose={() => setIsProfileOpen(false)} 
          onSave={handleSaveProfile}
        />
      )}
    </>
  );
}

