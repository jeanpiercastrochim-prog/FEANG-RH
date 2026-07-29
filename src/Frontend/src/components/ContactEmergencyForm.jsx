import { useState, useEffect, useRef } from 'react';
import { Phone, Mail, User, ShieldAlert, Heart, ArrowRight, ArrowLeft, AlertCircle, Check } from 'lucide-react';

export default function ContactEmergencyForm({ data, onDataChange, onSubmit, onBack }) {
  const [localErrors, setLocalErrors] = useState({});
  const [telefonoConfirmed, setTelefonoConfirmed] = useState(false);
  const [contactoEmergenciaConfirmed, setContactoEmergenciaConfirmed] = useState(false);
  const [telefonoEmergenciaConfirmed, setTelefonoEmergenciaConfirmed] = useState(false);

  const validatePhone = (val) => {
    return /^\d{9}$/.test(val.trim());
  };

  const validateEmail = (val) => {
    if (!val || !val.trim()) return true; // Opcional
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  };

  const handleBlur = (field) => {
    const val = data[field] || '';
    let err = false;

    if (field === 'telefono') {
      err = !validatePhone(val);
      setLocalErrors(prev => ({ ...prev, telefono: err }));
      if (!err && val.length > 0) setTelefonoConfirmed(true);
    } else if (field === 'correoPersonal') {
      err = !validateEmail(val);
      setLocalErrors(prev => ({ ...prev, correoPersonal: err }));
    } else if (field === 'contactoEmergencia') {
      err = !val.trim();
      setLocalErrors(prev => ({ ...prev, contactoEmergencia: err }));
      if (!err && val.trim().length > 0) setContactoEmergenciaConfirmed(true);
    } else if (field === 'telefonoEmergencia') {
      err = !validatePhone(val);
      setLocalErrors(prev => ({ ...prev, telefonoEmergencia: err }));
      if (!err && val.length > 0) setTelefonoEmergenciaConfirmed(true);
    }
  };

  const showContactoEmergencia = telefonoConfirmed;
  const showTelefonoEmergencia = showContactoEmergencia && contactoEmergenciaConfirmed;
  const showParentesco = showTelefonoEmergencia && telefonoEmergenciaConfirmed;

  const prevStates = useRef({ init: false, showContactoEmergencia: false, showTelefonoEmergencia: false, showParentesco: false });
  
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    
    let textToSpeak = '';
    const currentStates = {
      showContactoEmergencia,
      showTelefonoEmergencia,
      showParentesco
    };

    if (!prevStates.current.init) {
       textToSpeak = "Ya casi terminamos. Por favor, pon tu número de teléfono personal.";
       prevStates.current.init = true;
    } else {
       if (currentStates.showContactoEmergencia && !prevStates.current.showContactoEmergencia) {
         textToSpeak = "Excelente. Luego, pon el nombre de un familiar de emergencia.";
       } else if (currentStates.showTelefonoEmergencia && !prevStates.current.showTelefonoEmergencia) {
         textToSpeak = "Muy bien. Ahora escribe su número de celular.";
       } else if (currentStates.showParentesco && !prevStates.current.showParentesco) {
         textToSpeak = "Perfecto. Y ahora, indícame el parentesco.";
       }
    }
    prevStates.current = { ...prevStates.current, ...currentStates };
    
    if (textToSpeak) {
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = 'es-ES';
      utterance.rate = 1.0;
      utterance.pitch = 1.0; 
      const voices = window.speechSynthesis.getVoices();
      const esVoices = voices.filter(v => v.lang.startsWith('es'));
      const bestVoice = esVoices.find(v => v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Online')) || esVoices[0];
      if (bestVoice) {
        utterance.voice = bestVoice;
      }
      window.speechSynthesis.speak(utterance);
    }
  }, [showContactoEmergencia, showTelefonoEmergencia, showParentesco]);

  // Validaciones en tiempo real
  const errors = {
    telefono: !data.telefono || !validatePhone(data.telefono),
    contactoEmergencia: !(data.contactoEmergencia || '').trim(),
    telefonoEmergencia: !data.telefonoEmergencia || !validatePhone(data.telefonoEmergencia),
    correoPersonal: (data.correoPersonal && data.correoPersonal.trim()) ? !validateEmail(data.correoPersonal) : false
  };

  const hasErrors = Object.values(errors).some(Boolean);

  const handleSubmit = () => {
    if (hasErrors) {
      setLocalErrors({
        telefono: errors.telefono,
        contactoEmergencia: errors.contactoEmergencia,
        telefonoEmergencia: errors.telefonoEmergencia,
        correoPersonal: errors.correoPersonal
      });
      return;
    }
    onSubmit();
  };

  const relationshipOptions = [
    { value: 'Madre', emoji: '👩' },
    { value: 'Padre', emoji: '👨' },
    { value: 'Esposo(a)', emoji: '💑' },
    { value: 'Hijo(a)', emoji: '👧' },
    { value: 'Hermano(a)', emoji: '🧑‍🤝‍🧑' },
    { value: 'Otro', emoji: '👤' }
  ];

  return (
    <div className="camera-view-container animate-fade" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', background: 'radial-gradient(circle at center, #f8fafc 0%, #e2e8f0 100%)', position: 'relative', overflow: 'hidden' }}>
      
      {/* GLOW SPHERES (MATCHING PREMIUM UX) */}
      <div style={{ position: 'absolute', left: '-10%', top: '20%', width: '400px', height: '400px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.12) 0%, rgba(219, 39, 119, 0.12) 100%)', filter: 'blur(80px)', zIndex: 0, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', right: '-5%', top: '10%', width: '450px', height: '450px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(29, 78, 216, 0.1) 100%)', filter: 'blur(90px)', zIndex: 0, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', right: '35%', bottom: '-10%', width: '300px', height: '300px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)', filter: 'blur(70px)', zIndex: 0, pointerEvents: 'none' }} />

      <div className="hr-card" style={{ maxWidth: '1000px', width: '100%', padding: '40px 35px', borderRadius: '32px', boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.08)', background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(20px)', position: 'relative', zIndex: 1, border: '1px solid rgba(255, 255, 255, 0.7)' }}>
        
        {/* VOLVER BUTTON */}
        <button onClick={onBack} className="btn-outline" style={{ position: 'absolute', top: '30px', left: '30px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#1e293b', fontSize: '15px', fontWeight: '600', padding: '10px 18px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
          <ArrowLeft size={16} /> Volver
        </button>

        {/* HEADER AREA */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '10px', marginBottom: '35px' }}>
          <div style={{ background: 'linear-gradient(135deg, #f43f5e 0%, #db2777 100%)', color: 'white', width: '70px', height: '70px', marginBottom: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 25px rgba(219, 39, 119, 0.3)' }}>
            <Phone size={34} />
          </div>
          <h1 style={{ fontSize: '36px', color: '#0f172a', marginBottom: '12px', fontWeight: '800', letterSpacing: '-0.75px' }}>Contacto y Emergencia</h1>
          <p style={{ color: '#475569', fontSize: '16px', maxWidth: '650px', lineHeight: '1.6', fontWeight: '500' }}>
            Proporciona tus datos de comunicación y el contacto de una persona de confianza para casos de emergencia.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* CARD 1: TUS DATOS DE CONTACTO */}
          <div style={{ background: 'white', padding: '28px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '20px', color: '#0f172a', fontWeight: '750', margin: 0 }}>Tus Datos de Contacto</h3>
                <p style={{ fontSize: '14px', color: '#64748b', margin: '2px 0 0 0', fontWeight: '500' }}>Estos datos serán utilizados para comunicarnos contigo.</p>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* Celular */}
              <div className="premium-input-group">
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '10px', letterSpacing: '0.5px' }}>• TU CELULAR (9 DÍGITOS)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#3b82f6', display: 'flex', alignItems: 'center' }}>
                    <Phone size={20} />
                  </span>
                  <input
                    type="tel"
                    maxLength={9}
                    placeholder="999888777"
                    value={data.telefono || ''}
                    onChange={(e) => {
                      onDataChange('telefono', e.target.value.replace(/\D/g, ''));
                      setTelefonoConfirmed(false);
                    }}
                    onBlur={() => handleBlur('telefono')}
                    style={{ padding: '16px 16px 16px 52px', fontSize: '17px', borderRadius: '14px', border: `1.5px solid ${localErrors.telefono ? '#f43f5e' : '#bfdbfe'}`, width: '100%', background: '#f8fafc', outline: 'none', transition: 'all 0.2s', fontWeight: '600', color: '#0f172a' }}
                  />
                  {!telefonoConfirmed && data.telefono?.length === 9 && (
                    <button type="button" onClick={() => handleBlur('telefono')} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', padding: '6px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '13px', zIndex: 2, boxShadow: '0 4px 10px rgba(59, 130, 246, 0.3)' }}>
                      Siguiente
                    </button>
                  )}
                </div>
                {localErrors.telefono && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', color: '#f43f5e', fontSize: '13px', fontWeight: '600' }}>
                    <AlertCircle size={14} color="#f43f5e" /> Ingresa un celular válido de 9 dígitos
                  </div>
                )}
              </div>

              {/* Correo Electrónico */}
              <div className="premium-input-group">
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '10px', letterSpacing: '0.5px' }}>• TU CORREO ELECTRÓNICO (OPCIONAL)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#3b82f6', display: 'flex', alignItems: 'center' }}>
                    <Mail size={20} />
                  </span>
                  <input
                    type="email"
                    placeholder="nombre@ejemplo.com"
                    value={data.correoPersonal || ''}
                    onChange={(e) => onDataChange('correoPersonal', e.target.value)}
                    onBlur={() => handleBlur('correoPersonal')}
                    style={{ padding: '16px 16px 16px 52px', fontSize: '17px', borderRadius: '14px', border: `1.5px solid ${localErrors.correoPersonal ? '#f43f5e' : '#bfdbfe'}`, width: '100%', background: '#f8fafc', outline: 'none', transition: 'all 0.2s', fontWeight: '600', color: '#0f172a' }}
                  />
                </div>
                {localErrors.correoPersonal && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', color: '#f43f5e', fontSize: '13px', fontWeight: '600' }}>
                    <AlertCircle size={14} color="#f43f5e" /> Ingresa un correo electrónico válido
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* CARD 2: CONTACTO DE EMERGENCIA */}
          {showContactoEmergencia && (
          <div className="animate-fade" style={{ background: '#fffafb', padding: '28px', borderRadius: '24px', border: '1px solid #ffe4e6', boxShadow: '0 10px 30px -10px rgba(219, 39, 119, 0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#ffe4e6', color: '#db2777', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldAlert size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '20px', color: '#9f1239', fontWeight: '750', margin: 0 }}>Contacto en Caso de Emergencia</h3>
                <p style={{ fontSize: '14px', color: '#e11d48', margin: '2px 0 0 0', fontWeight: '500' }}>Indica un familiar o persona de confianza a quien podamos contactar.</p>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                {/* Nombre de contacto */}
                <div className="premium-input-group">
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#9f1239', display: 'block', marginBottom: '10px', letterSpacing: '0.5px' }}>• NOMBRE DEL FAMILIAR / CONTACTO</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#e11d48', display: 'flex', alignItems: 'center' }}>
                      <User size={20} />
                    </span>
                    <input
                      type="text"
                      placeholder="Ej. María Flores Ramos"
                      value={data.contactoEmergencia || ''}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
                        onDataChange('contactoEmergencia', val);
                        setContactoEmergenciaConfirmed(false);
                      }}
                      onBlur={() => handleBlur('contactoEmergencia')}
                      style={{ padding: '16px 16px 16px 52px', fontSize: '17px', borderRadius: '14px', border: `1.5px solid ${localErrors.contactoEmergencia ? '#f43f5e' : '#fbcfe8'}`, width: '100%', background: '#fff5f6', outline: 'none', transition: 'all 0.2s', fontWeight: '600', color: '#0f172a' }}
                    />
                    {!contactoEmergenciaConfirmed && data.contactoEmergencia?.length > 2 && (
                      <button type="button" onClick={() => handleBlur('contactoEmergencia')} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', padding: '6px 16px', background: '#db2777', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '13px', zIndex: 2, boxShadow: '0 4px 10px rgba(219, 39, 119, 0.3)' }}>
                        Siguiente
                      </button>
                    )}
                  </div>
                  {localErrors.contactoEmergencia && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', color: '#f43f5e', fontSize: '13px', fontWeight: '600' }}>
                      <AlertCircle size={14} color="#f43f5e" /> Este campo es obligatorio
                    </div>
                  )}
                </div>

                {/* Teléfono de contacto */}
                {showTelefonoEmergencia && (
                <div className="premium-input-group animate-fade">
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#9f1239', display: 'block', marginBottom: '10px', letterSpacing: '0.5px' }}>• CELULAR DEL CONTACTO (9 DÍGITOS)</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#e11d48', display: 'flex', alignItems: 'center' }}>
                      <Phone size={20} />
                    </span>
                    <input
                      type="tel"
                      maxLength={9}
                      placeholder="999333222"
                      value={data.telefonoEmergencia || ''}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        onDataChange('telefonoEmergencia', val);
                        if (val.length === 9) {
                          setTelefonoEmergenciaConfirmed(true);
                          // También ocultamos error local si lo hubiera
                          setLocalErrors(prev => ({ ...prev, telefonoEmergencia: false }));
                        } else {
                          setTelefonoEmergenciaConfirmed(false);
                        }
                      }}
                      onBlur={() => handleBlur('telefonoEmergencia')}
                      style={{ padding: '16px 16px 16px 52px', fontSize: '17px', borderRadius: '14px', border: `1.5px solid ${localErrors.telefonoEmergencia ? '#f43f5e' : '#fbcfe8'}`, width: '100%', background: '#fff5f6', outline: 'none', transition: 'all 0.2s', fontWeight: '600', color: '#0f172a' }}
                    />
                  </div>
                  {localErrors.telefonoEmergencia && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', color: '#f43f5e', fontSize: '13px', fontWeight: '600' }}>
                      <AlertCircle size={14} color="#f43f5e" /> Ingresa un celular válido de 9 dígitos
                    </div>
                  )}
                </div>
                )}
              </div>

              {/* Parentesco (Botones grandes y amigables) */}
              {showParentesco && (
              <div className="premium-input-group animate-fade">
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#9f1239', display: 'block', marginBottom: '14px', letterSpacing: '0.5px' }}>PARENTESCO O RELACIÓN</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px' }}>
                  {relationshipOptions.map(opt => {
                    const isSelected = data.parentesco === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => onDataChange('parentesco', opt.value)}
                        style={{
                          position: 'relative',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '16px 8px',
                          borderRadius: '16px',
                          border: `1.5px solid ${isSelected ? '#e11d48' : '#e2e8f0'}`,
                          background: isSelected ? '#fff5f6' : 'white',
                          cursor: 'pointer',
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          boxShadow: isSelected ? '0 10px 20px -5px rgba(225, 29, 72, 0.15)' : 'none',
                          transform: isSelected ? 'translateY(-2px)' : 'none'
                        }}
                      >
                        {/* CHECKMARK BADGE ON SELECTED BUTTON */}
                        {isSelected && (
                          <div style={{ position: 'absolute', top: '-6px', right: '-6px', width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#e11d48', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}>
                            <Check size={12} strokeWidth={4} />
                          </div>
                        )}
                        <span style={{ fontSize: '28px' }}>{opt.emoji}</span>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: isSelected ? '#e11d48' : '#64748b' }}>{opt.value}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              )}
            </div>
          </div>
          )}

        </div>

        {/* SUBMIT BUTTON SECTION */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginTop: '40px' }}>
          <button
            onClick={handleSubmit}
            disabled={hasErrors}
            style={{
              padding: '18px 60px',
              fontSize: '20px',
              fontWeight: '700',
              color: 'white',
              borderRadius: '100px',
              background: hasErrors 
                ? '#94a3b8' 
                : 'linear-gradient(90deg, #e11d48 0%, #be123c 100%)',
              border: 'none',
              boxShadow: hasErrors ? 'none' : '0 15px 35px -10px rgba(225, 29, 72, 0.4)',
              width: '100%',
              maxWidth: '450px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '12px',
              opacity: hasErrors ? 0.6 : 1,
              cursor: hasErrors ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            Finalizar y Enviar Datos <ArrowRight size={22} strokeWidth={2.5} />
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: hasErrors ? '#e11d48' : '#16a34a', fontSize: '14px', fontWeight: '600' }}>
            {hasErrors ? (
              <>
                <AlertCircle size={16} color="#e11d48" />
                <span>Ingresa todos los campos requeridos correctamente</span>
              </>
            ) : (
              <>
                <Check size={16} color="#16a34a" strokeWidth={3} />
                <span>Todo listo. Haz clic para finalizar.</span>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
