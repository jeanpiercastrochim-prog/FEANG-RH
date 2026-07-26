import { useState } from 'react';
import { Mail, Phone, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ContactForm({ data, onDataChange, onNext, onBack }) {
  const [email, setEmail] = useState(data.email || '');
  const [phone, setPhone] = useState(data.phone || '');
  const [error, setError] = useState('');

  const handleNext = () => {
    if (!email || !phone) {
      setError('Por favor complete ambos campos.');
      return;
    }
    // Basic email validation
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Por favor ingrese un correo válido.');
      return;
    }
    
    onDataChange('email', email);
    onDataChange('phone', phone);
    setError('');
    onNext();
  };

  return (
    <div className="hr-premium-view">
      <div className="hr-premium-header">
        <div className="header-titles">
          <div className="status-badge pulse" style={{ background:'#eff6ff', color:'#2563eb' }}>
            Paso 3 de 4
          </div>
          <h1>Datos de Contacto</h1>
          <p>Ingresa tus datos de contacto para poder enviarte notificaciones y una copia de tu contrato.</p>
        </div>
        <div className="header-actions">
          <button onClick={onBack} className="btn-glass-secondary">
            <ArrowLeft size={18}/> Volver
          </button>
        </div>
      </div>

      <div className="premium-main-grid" style={{ gridTemplateColumns:'1fr', maxWidth: '600px', margin: '0 auto' }}>
        <div className="glass-panel">
          
          {error && (
            <div style={{ background: '#fef2f2', color: '#ef4444', padding: '12px', borderRadius: '12px', marginBottom: '20px', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} /> {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569', fontSize: '14px', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <Mail size={16} className="text-blue-500" /> Correo Electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@correo.com"
                style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '16px', color: '#1e293b', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569', fontSize: '14px', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <Phone size={16} className="text-green-500" /> Número de Teléfono
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^0-9+]/g, ''))}
                placeholder="Ej. 987654321"
                maxLength={15}
                style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '16px', color: '#1e293b', outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ marginTop: '32px' }}>
            <button
              onClick={handleNext}
              className="btn-glass-primary"
              style={{ width: '100%', padding: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '16px' }}
            >
              Continuar a Firma <ArrowRight size={18}/>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
