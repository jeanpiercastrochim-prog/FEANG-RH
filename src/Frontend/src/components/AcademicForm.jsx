import { useEffect, useRef, useState } from 'react';
import { GraduationCap, ArrowRight, ArrowLeft, Check, X as CloseIcon, AlertCircle } from 'lucide-react';

export default function AcademicForm({ data, onDataChange, onSubmit, onBack }) {
  const handleRadio = (field, value) => {
    onDataChange(field, value);
    if (field === 'hasPrimary' && !value) {
      onDataChange('hasSecondary', false);
      onDataChange('hasHigherEducation', false);
    }
    if (field === 'hasSecondary' && !value) {
      onDataChange('hasHigherEducation', false);
    }
  };

  const getBirthYear = (fecha) => {
    if (!fecha) return null;
    const match = fecha.match(/\d{4}/);
    return match ? parseInt(match[0]) : null;
  };
  const birthYear = getBirthYear(data.fechaNacimiento);

  const validateYear = (val, minAge, maxAgeDiff) => {
    if (!val) return "Campo obligatorio";
    const y = parseInt(val);
    const currYear = new Date().getFullYear();
    if (isNaN(y) || val.length !== 4) return "Año inválido";
    if (y > currYear + maxAgeDiff) return `Máx. año ${currYear + maxAgeDiff}`;
    if (birthYear && y < birthYear + minAge) return `Edad inválida (Mín ${birthYear + minAge})`;
    return null;
  };

  const errPrimaryYear = data.hasPrimary === true ? validateYear(data.primaryYear, 11, -3) : null;
  const errSecondaryYear = data.hasSecondary === true ? validateYear(data.secondaryYear, 15, 0) : null;
  const errHigherYear = data.hasHigherEducation === true ? validateYear(data.higherEducationYear, 17, 5) : null;

  const errors = {
    primarySchool: data.hasPrimary === true && !(data.primarySchool || '').trim(),
    primaryYear: !!errPrimaryYear,
    secondarySchool: data.hasSecondary === true && !(data.secondarySchool || '').trim(),
    secondaryYear: !!errSecondaryYear,
    higherEducationInstitution: data.hasHigherEducation === true && !(data.higherEducationInstitution || '').trim(),
    higherEducationYear: !!errHigherYear,
  };
  
  const hasErrors = Object.values(errors).some(Boolean);

  const handleSubmit = () => {
    if (hasErrors) return; 
    onSubmit();
  };

  const renderHugeRadioCard = (field, label, value, isChecked, iconType) => (
    <div
      onClick={() => handleRadio(field, value)}
      className={`huge-radio-card ${isChecked ? 'active' : ''}`}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px 10px',
        background: isChecked ? (value ? '#eff6ff' : '#fff1f2') : 'white',
        border: `2px solid ${isChecked ? (value ? '#3b82f6' : '#f43f5e') : '#e2e8f0'}`,
        borderRadius: '20px',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: isChecked ? (value ? '0 10px 25px -5px rgba(59, 130, 246, 0.2)' : '0 10px 25px -5px rgba(244, 63, 94, 0.2)') : 'none',
        transform: isChecked ? 'translateY(-4px)' : 'none'
      }}
    >
      <div style={{
        width: '50px', height: '50px', borderRadius: '50%', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: isChecked ? (value ? '#3b82f6' : '#f43f5e') : '#f1f5f9',
        color: isChecked ? 'white' : '#94a3b8',
        transition: 'all 0.3s'
      }}>
        {iconType === 'check' ? <Check size={28} strokeWidth={3} /> : <CloseIcon size={28} strokeWidth={3} />}
      </div>
      <span style={{ fontSize: '15px', fontWeight: '600', color: isChecked ? (value ? '#1e3a8a' : '#881337') : '#475569', textAlign: 'center' }}>{label}</span>
    </div>
  );

  const [primaryConfirmed, setPrimaryConfirmed] = useState(false);
  const [secondaryConfirmed, setSecondaryConfirmed] = useState(false);

  const showSecondary = data.hasPrimary === true && primaryConfirmed;
  const showHigherEducation = data.hasSecondary === true && secondaryConfirmed;

  const primaryValid = (data.primarySchool || '').trim().length > 2 && !errPrimaryYear;
  const secondaryValid = (data.secondarySchool || '').trim().length > 2 && !errSecondaryYear;
  const higherValid = (data.higherEducationInstitution || '').trim().length > 2 && !errHigherYear;

  const isFlowComplete = 
    data.hasPrimary === false ||
    (data.hasPrimary === true && primaryConfirmed && data.hasSecondary === false && primaryValid) ||
    (data.hasPrimary === true && primaryConfirmed && data.hasSecondary === true && secondaryConfirmed && data.hasHigherEducation === false && primaryValid && secondaryValid) ||
    (data.hasPrimary === true && primaryConfirmed && data.hasSecondary === true && secondaryConfirmed && data.hasHigherEducation === true && primaryValid && secondaryValid && higherValid);

  // Voice Guidance Hook
  const prevStates = useRef({ hasPrimary: undefined, hasSecondary: undefined, hasHigherEducation: undefined, primaryConfirmed: false, secondaryConfirmed: false });
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    
    let textToSpeak = '';
    const currentStates = {
      hasPrimary: data.hasPrimary,
      hasSecondary: data.hasSecondary,
      hasHigherEducation: data.hasHigherEducation,
      primaryConfirmed,
      secondaryConfirmed
    };
    
    // Initial load vs updates
    if (prevStates.current.hasPrimary === undefined) {
       textToSpeak = "Muy bien, ya tengo tus datos personales. Ahora hablemos de tu educación. Dime, ¿Llegaste a completar la educación primaria?";
    } else {
       if (currentStates.hasPrimary === true && prevStates.current.hasPrimary !== true) {
         textToSpeak = "Excelente. ¿En qué colegio estudiaste la primaria y en qué año terminaste?";
       } else if (currentStates.primaryConfirmed && !prevStates.current.primaryConfirmed) {
         textToSpeak = "Muy bien. Y dime, ¿Completaste la educación secundaria?";
       } else if (currentStates.hasSecondary === true && prevStates.current.hasSecondary !== true) {
         textToSpeak = "Perfecto. ¿En qué colegio estudiaste la secundaria y en qué año terminaste?";
       } else if (currentStates.secondaryConfirmed && !prevStates.current.secondaryConfirmed) {
         textToSpeak = "Excelente. Finalmente, ¿Llegaste a cursar educación superior?";
       } else if (currentStates.hasHigherEducation === true && prevStates.current.hasHigherEducation !== true) {
         textToSpeak = "Muy bien. Por favor escribe el nombre de la institución y el año.";
       } else if (currentStates.hasPrimary === false && prevStates.current.hasPrimary !== false) {
         textToSpeak = "Entendido. Presiona continuar para avanzar al siguiente paso.";
       }
    }
    prevStates.current = currentStates;
    
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
  }, [data.hasPrimary, data.hasSecondary, data.hasHigherEducation, showSecondary, showHigherEducation]);

  return (
    <div className="camera-view-container animate-fade" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', background: 'radial-gradient(circle at center, #f8fafc 0%, #e2e8f0 100%)' }}>

      <div className="hr-card" style={{ maxWidth: '1400px', width: '100%', padding: '50px', borderRadius: '32px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)', background: 'white', position: 'relative' }}>

        <button onClick={onBack} className="btn-outline" style={{ position: 'absolute', top: '30px', left: '30px', border: 'none' }}>
          <ArrowLeft size={20} /> Volver
        </button>

        <div className="camera-header mb-10" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '10px' }}>
          <div className="camera-header-icon" style={{ background: '#eff6ff', color: '#2563eb', boxShadow: '0 0 30px rgba(37, 99, 235, 0.2)', width: '70px', height: '70px', marginBottom: '16px' }}>
            <GraduationCap size={36} />
          </div>
          <h1 style={{ fontSize: '32px', color: '#1e293b', marginBottom: '8px', fontWeight: '700', letterSpacing: '-0.5px' }}>Formación Académica</h1>
          <p style={{ color: '#64748b', fontSize: '16px', maxWidth: '600px' }}>
            Tu educación es importante. Indícanos tu último nivel de estudios completado.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>

          {/* Fila 1: Primaria + Secundaria */}
          <div style={{ display: 'grid', gridTemplateColumns: data.hasPrimary ? 'repeat(2, 1fr)' : '1fr', gap: '24px' }}>
            {/* PRIMARIA */}
            <div className="academic-section" style={{ background: '#f8fafc', padding: '30px 24px', borderRadius: '24px', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '20px', color: '#334155', marginBottom: '24px', fontWeight: '700', textAlign: 'center' }}>¿Educación primaria?</h3>
              <div style={{ display: 'flex', gap: '16px', marginBottom: data.hasPrimary ? '24px' : '0' }}>
                {renderHugeRadioCard('hasPrimary', 'Sí, la completé', true, data.hasPrimary === true, 'check')}
                {renderHugeRadioCard('hasPrimary', 'No la completé', false, data.hasPrimary === false, 'cross')}
              </div>
              {data.hasPrimary && (
                <div className="premium-input-group animate-fade" style={{ marginTop: 'auto', paddingTop: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ flex: '2', minWidth: '150px' }}>
                    <label style={{ fontSize: '14px', fontWeight: '600', color: '#475569' }}>Nombre del Colegio</label>
                    <input
                      type="text"
                      placeholder="Ej. IE 1024 Maria..."
                      value={data.primarySchool || ''}
                      onChange={(e) => {
                        onDataChange('primarySchool', e.target.value);
                        setPrimaryConfirmed(false);
                      }}
                      style={{ padding: '14px', fontSize: '15px', borderRadius: '12px', border: `2px solid ${errors.primarySchool ? '#f43f5e' : '#e2e8f0'}`, width: '100%', background: 'white', outline: 'none', transition: 'border-color 0.2s' }}
                    />
                  </div>
                  <div style={{ flex: '1', minWidth: '100px', position: 'relative' }}>
                    <label style={{ fontSize: '14px', fontWeight: '600', color: '#475569' }}>Año Fin</label>
                    <input
                      type="number"
                      placeholder="Ej. 2005"
                      value={data.primaryYear || ''}
                      onChange={(e) => {
                        onDataChange('primaryYear', e.target.value);
                        setPrimaryConfirmed(false);
                      }}
                      style={{ padding: '14px', fontSize: '15px', borderRadius: '12px', border: `2px solid ${errors.primaryYear ? '#f43f5e' : '#e2e8f0'}`, width: '100%', background: 'white', outline: 'none', transition: 'border-color 0.2s' }}
                    />
                    {!primaryConfirmed && primaryValid && (
                      <button type="button" onClick={() => setPrimaryConfirmed(true)} style={{ position: 'absolute', right: '-120px', top: '50%', padding: '10px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '13px', zIndex: 2, boxShadow: '0 4px 10px rgba(59, 130, 246, 0.3)' }}>
                        Siguiente
                      </button>
                    )}
                  </div>
                  
                  {errors.primarySchool && (
                    <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', color: '#f43f5e', fontSize: '13px', fontWeight: '500' }}>
                      <AlertCircle size={14} color="#f43f5e" /> Colegio obligatorio
                    </div>
                  )}
                  {errPrimaryYear && (
                    <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', color: '#f43f5e', fontSize: '13px', fontWeight: '500' }}>
                      <AlertCircle size={14} color="#f43f5e" /> {errPrimaryYear}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* SECUNDARIA */}
            {showSecondary && (
              <div className="academic-section animate-fade" style={{ background: '#f8fafc', padding: '30px 24px', borderRadius: '24px', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '20px', color: '#334155', marginBottom: '24px', fontWeight: '700', textAlign: 'center' }}>¿Educación secundaria?</h3>
                <div style={{ display: 'flex', gap: '16px', marginBottom: data.hasSecondary ? '24px' : '0' }}>
                  {renderHugeRadioCard('hasSecondary', 'Sí, la completé', true, data.hasSecondary === true, 'check')}
                  {renderHugeRadioCard('hasSecondary', 'No la completé', false, data.hasSecondary === false, 'cross')}
                </div>
                {data.hasSecondary && (
                  <div className="premium-input-group animate-fade" style={{ marginTop: 'auto', paddingTop: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ flex: '2', minWidth: '150px' }}>
                      <label style={{ fontSize: '14px', fontWeight: '600', color: '#475569' }}>Nombre del Colegio</label>
                      <input
                        type="text"
                        placeholder="Ej. Colegio Nacional..."
                        value={data.secondarySchool || ''}
                        onChange={(e) => {
                          onDataChange('secondarySchool', e.target.value);
                          setSecondaryConfirmed(false);
                        }}
                        style={{ padding: '14px', fontSize: '15px', borderRadius: '12px', border: `2px solid ${errors.secondarySchool ? '#f43f5e' : '#e2e8f0'}`, width: '100%', background: 'white', outline: 'none', transition: 'border-color 0.2s' }}
                      />
                    </div>
                    <div style={{ flex: '1', minWidth: '100px', position: 'relative' }}>
                      <label style={{ fontSize: '14px', fontWeight: '600', color: '#475569' }}>Año Fin</label>
                      <input
                        type="number"
                        placeholder="Ej. 2010"
                        value={data.secondaryYear || ''}
                        onChange={(e) => {
                          onDataChange('secondaryYear', e.target.value);
                          setSecondaryConfirmed(false);
                        }}
                        style={{ padding: '14px', fontSize: '15px', borderRadius: '12px', border: `2px solid ${errors.secondaryYear ? '#f43f5e' : '#e2e8f0'}`, width: '100%', background: 'white', outline: 'none', transition: 'border-color 0.2s' }}
                      />
                      {!secondaryConfirmed && secondaryValid && (
                        <button type="button" onClick={() => setSecondaryConfirmed(true)} style={{ position: 'absolute', right: '-120px', top: '50%', padding: '10px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '13px', zIndex: 2, boxShadow: '0 4px 10px rgba(59, 130, 246, 0.3)' }}>
                          Siguiente
                        </button>
                      )}
                    </div>
                    {errors.secondarySchool && (
                      <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', color: '#f43f5e', fontSize: '13px', fontWeight: '500' }}>
                        <AlertCircle size={14} color="#f43f5e" /> Colegio obligatorio
                      </div>
                    )}
                    {errSecondaryYear && (
                      <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', color: '#f43f5e', fontSize: '13px', fontWeight: '500' }}>
                        <AlertCircle size={14} color="#f43f5e" /> {errSecondaryYear}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Fila 2: Estudios Superiores — centrado */}
          {showHigherEducation && (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div className="academic-section animate-fade" style={{ background: '#f8fafc', padding: '30px 24px', borderRadius: '24px', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', width: '50%', minWidth: '400px' }}>
                <h3 style={{ fontSize: '20px', color: '#334155', marginBottom: '24px', fontWeight: '700', textAlign: 'center' }}>¿Estudios superiores?</h3>
                <div style={{ display: 'flex', gap: '16px', marginBottom: data.hasHigherEducation ? '24px' : '0' }}>
                  {renderHugeRadioCard('hasHigherEducation', 'Sí, los tengo', true, data.hasHigherEducation === true, 'check')}
                  {renderHugeRadioCard('hasHigherEducation', 'No tengo', false, data.hasHigherEducation === false, 'cross')}
                </div>
                {data.hasHigherEducation && (
                  <div className="premium-input-group animate-fade" style={{ marginTop: 'auto', paddingTop: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ flex: '2', minWidth: '150px' }}>
                      <label style={{ fontSize: '14px', fontWeight: '600', color: '#475569' }}>Institución / Universidad</label>
                      <input
                        type="text"
                        placeholder="Ej. SENATI o San Marcos"
                        value={data.higherEducationInstitution || ''}
                        onChange={(e) => {
                          onDataChange('higherEducationInstitution', e.target.value);
                        }}
                        style={{ padding: '14px', fontSize: '15px', borderRadius: '12px', border: `2px solid ${errors.higherEducationInstitution ? '#f43f5e' : '#e2e8f0'}`, width: '100%', background: 'white', outline: 'none', transition: 'border-color 0.2s' }}
                      />
                    </div>
                    <div style={{ flex: '1', minWidth: '100px' }}>
                      <label style={{ fontSize: '14px', fontWeight: '600', color: '#475569' }}>Año Fin</label>
                      <input
                        type="number"
                        placeholder="Ej. 2015"
                        value={data.higherEducationYear || ''}
                        onChange={(e) => {
                          onDataChange('higherEducationYear', e.target.value);
                        }}
                        style={{ padding: '14px', fontSize: '15px', borderRadius: '12px', border: `2px solid ${errors.higherEducationYear ? '#f43f5e' : '#e2e8f0'}`, width: '100%', background: 'white', outline: 'none', transition: 'border-color 0.2s' }}
                      />
                    </div>
                    {errors.higherEducationInstitution && (
                      <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', color: '#f43f5e', fontSize: '13px', fontWeight: '500' }}>
                        <AlertCircle size={14} color="#f43f5e" /> Institución obligatoria
                      </div>
                    )}
                    {errHigherYear && (
                      <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', color: '#f43f5e', fontSize: '13px', fontWeight: '500' }}>
                        <AlertCircle size={14} color="#f43f5e" /> {errHigherYear}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', marginTop: '40px', paddingBottom: '20px' }}>
            <button
              onClick={handleSubmit}
              disabled={hasErrors || !isFlowComplete}
              className="btn-proceed"
              style={{
                padding: '20px 60px', fontSize: '20px', borderRadius: '100px',
                boxShadow: (hasErrors || !isFlowComplete) ? 'none' : '0 15px 35px -10px rgba(37, 99, 235, 0.5)',
                width: '100%', maxWidth: '400px',
                display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px',
                opacity: (hasErrors || !isFlowComplete) ? 0.5 : 1,
                cursor: (hasErrors || !isFlowComplete) ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                background: (hasErrors || !isFlowComplete) ? '#94a3b8' : undefined,
              }}
            >
              Continuar <ArrowRight size={24} />
            </button>
            {(hasErrors || !isFlowComplete) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', color: '#64748b', fontSize: '13px', fontWeight: '500' }}>
                <AlertCircle size={15} color="#94a3b8" />
                Completa y confirma todos los pasos obligatorios para continuar
              </div>
            )}
          </div>
      </div>
    </div>
  );
}
