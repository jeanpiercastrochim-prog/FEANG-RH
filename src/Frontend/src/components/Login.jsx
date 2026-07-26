import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Moon } from 'lucide-react';
import './login.css';

import loginBg from '../assets/fondo_login.png';
import logoEmpresa from '../assets/logo_empresa.png';

export default function Login({ onLoginSuccess }) {
  const [dni, setDni] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [darkMode, setDarkMode] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!dni || !password) {
      setError('Por favor ingresa tu DNI y contraseña.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://127.0.0.1:5051/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dni, password })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.message || 'Error de inicio de sesión.');
      } else {
        onLoginSuccess(data.employee);
      }
    } catch (err) {
      setError('Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`chavin-login-wrapper ${darkMode ? 'dark' : 'light'}`}>
      <div className="chavin-login-scaler" style={{ backgroundImage: `url(${loginBg})` }}>
        
        {darkMode && <div className="chavin-dark-overlay"></div>}

        <div className="chavin-theme-toggle" onClick={() => setDarkMode(!darkMode)}>
          <Moon size={16} />
          <span>Modo oscuro</span>
          <div className={`toggle-switch ${darkMode ? 'active' : ''}`}>
            <div className="toggle-knob"></div>
          </div>
        </div>

        <div className="chavin-form-box">
          <div className="chavin-form-inner">
            <div className="chavin-form-header">
              <img src={logoEmpresa} alt="Chavin Logo" className="chavin-form-logo" />
              <h2>Bienvenido de vuelta</h2>
              <p>Inicia sesión para continuar en la plataforma</p>
            </div>

            <form onSubmit={handleSubmit} className="chavin-form">
              {error && <div className="chavin-error-msg">{error}</div>}
              
              <div className="chavin-input-group">
                <label>Correo electrónico / DNI</label>
                <div className="chavin-input-wrapper">
                  <Mail size={18} className="chavin-input-icon" />
                  <input 
                    type="text" 
                    placeholder="ejemplo@chavin.com.pe / 12345678"
                    value={dni}
                    onChange={(e) => setDni(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="chavin-input-group">
                <label>Contraseña</label>
                <div className="chavin-input-wrapper">
                  <Lock size={18} className="chavin-input-icon" />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Ingresa tu contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                  <button type="button" className="chavin-eye-btn" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="chavin-forgot-pass">
                <a href="#">¿Olvidaste tu contraseña?</a>
              </div>

              <button type="submit" className="chavin-submit-btn" disabled={loading}>
                <ArrowRight size={18} /> {loading ? 'Iniciando...' : 'Iniciar sesión'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
