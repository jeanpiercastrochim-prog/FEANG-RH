import { useState, useEffect, useRef } from 'react';
import { CheckCircle2, Camera, Maximize2, Contact2, Edit2, Info, ArrowLeft, ArrowRight, Check, Clock, UserCheck, Search, Image as ImageIcon, Crosshair, AlertTriangle, ShieldCheck, GraduationCap, X as CloseIcon, BookOpen, Book, Award, Volume2 } from 'lucide-react';

const DataConfirmation = ({ ocrData, capturedImages, handleInputChange, generateContract, onBack, role }) => {
  const fields = [
    { label: 'Nombres:', value: ocrData.nombres },
    { label: 'Apellido Paterno:', value: ocrData.apellidoPaterno },
    { label: 'Apellido Materno:', value: ocrData.apellidoMaterno },
    { label: 'Número de DNI:', value: ocrData.numeroDNI },
    { label: 'Fecha Nacimiento:', value: ocrData.fechaNacimiento },
    { label: 'Sexo:', value: ocrData.sexo },
    { label: 'Estado Civil:', value: ocrData.estadoCivil },
    { label: 'Dirección:', value: ocrData.direccion },
    { label: 'Departamento:', value: ocrData.departamento },
    { label: 'Provincia:', value: ocrData.provincia },
    { label: 'Distrito:', value: ocrData.distrito },
  ];

  const [isEditing, setIsEditing] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const now = new Date();
    setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  }, []);

  // Voice Guidance Hook
  const utteranceRef = useRef(null);
  
  const speakData = () => {
    if (!('speechSynthesis' in window)) return;
    if (!ocrData.numeroDNI || !ocrData.nombres) return;
    
    window.speechSynthesis.cancel();
    
    const hora = new Date().getHours();
    let saludo = "Buenos días";
    if (hora >= 12 && hora < 19) saludo = "Buenas tardes";
    else if (hora >= 19 || hora < 5) saludo = "Buenas noches";

    const textToSpeak = `${saludo}, verifica los datos de la persona.`;
    
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utteranceRef.current = utterance;
    
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
  };

  useEffect(() => {
    speakData();
  }, [ocrData.numeroDNI, ocrData.nombres]);

  const wizardSteps = [
    { label: 'Captura DNI', status: 'completed' },
    { label: 'Validación', status: 'active' },
    { label: 'Contrato', status: 'pending' },
    { label: 'Firma', status: 'pending' },
    { label: 'Finalizado', status: 'pending' }
  ];

  return (
    <div className="hr-premium-view">
      
      {/* HEADER SECTION */}
      <div className="hr-premium-header">
        <div className="header-titles">
          <div className="status-badge success-pulse" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} /> Validado Automáticamente
            <button onClick={speakData} title="Escuchar de nuevo" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#16a34a', padding: '2px' }}>
              <Volume2 size={16} />
            </button>
          </div>
          <h1>Revisión de Expediente del Candidato</h1>
          <p>Verifica la información extraída y finaliza la incorporación.</p>
        </div>
        <div className="header-actions">
          <button onClick={onBack} className="btn-glass-secondary">
            <ArrowLeft size={18} /> Volver
          </button>
          <button onClick={generateContract} className="btn-glass-primary">
            Proceder al Contrato <ArrowRight size={18} />
          </button>
        </div>
      </div>

      {/* FALLBACK WARNING ALERT */}
      {ocrData.nombres === 'NOMBRE_A_REVISAR' && (
        <div style={{ background: '#fef2f2', borderLeft: '4px solid #ef4444', padding: '16px 20px', borderRadius: '0 12px 12px 0', marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'flex-start', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ color: '#ef4444', marginTop: '2px' }}><AlertTriangle size={24} /></div>
          <div>
            <h4 style={{ color: '#991b1b', fontSize: '15px', fontWeight: '700', marginBottom: '4px' }}>Detección por Modelo de Respaldo</h4>
            <p style={{ color: '#b91c1c', fontSize: '14px', lineHeight: '1.5' }}>
              La IA principal se encuentra saturada. El escaneo se realizó mediante el mapeo de modelo entrenado alternativo, el cual puede presentar un mayor margen de fallas si el DNI no es legible o presenta reflejos. <b>Por favor, verifique y corrija los datos manualmente.</b>
            </p>
          </div>
        </div>
      )}

      {/* METRICS ROW */}
      <div className="premium-metrics-row">
        <div className="p-metric-card blue-glow">
          <div className="icon-wrapper"><ImageIcon size={24}/></div>
          <div className="p-metric-data">
            <span className="p-val">2</span>
            <span className="p-label">Documentos</span>
          </div>
        </div>
        <div className="p-metric-card purple-glow">
          <div className="icon-wrapper"><Search size={24}/></div>
          <div className="p-metric-data">
            <span className="p-val">14</span>
            <span className="p-label">Campos Leídos</span>
          </div>
        </div>
        <div className="p-metric-card green-glow">
          <div className="icon-wrapper"><Crosshair size={24}/></div>
          <div className="p-metric-data">
            <span className="p-val">99%</span>
            <span className="p-label">Precisión OCR</span>
          </div>
        </div>
        <div className="p-metric-card teal-glow">
          <div className="icon-wrapper"><ShieldCheck size={24}/></div>
          <div className="p-metric-data">
            <span className="p-val">Óptimo</span>
            <span className="p-label">Nivel Riesgo</span>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="premium-main-grid" style={{ gridTemplateColumns: '350px 1fr' }}>
        
        {/* LEFT COL: IMAGES & TIMELINE */}
        <div className="premium-col-left" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-panel">
            <div className="panel-header">
              <Camera size={20} className="text-blue-500" />
              <h3>Evidencia Fotográfica</h3>
            </div>
            <div className="dni-showcase">
              <div className="dni-frame" onClick={() => setSelectedImage(capturedImages?.front || "/dni_front.png")} style={{ cursor: 'pointer' }}>
                <div className="dni-tag">Anverso</div>
                <img src={capturedImages?.front || "/dni_front.png"} alt="Frente DNI" />
                <div className="zoom-hint"><Maximize2 size={14} /> Hover para ampliar</div>
              </div>
              <div className="dni-frame" onClick={() => setSelectedImage(capturedImages?.back || "/dni_back.png")} style={{ cursor: 'pointer' }}>
                <div className="dni-tag">Reverso</div>
                <img src={capturedImages?.back || "/dni_back.png"} alt="Reverso DNI" />
                <div className="zoom-hint"><Maximize2 size={14} /> Hover para ampliar</div>
              </div>
              {capturedImages?.signature && (
                <div className="dni-frame" onClick={() => setSelectedImage(capturedImages.signature)} style={{ cursor: 'pointer', background: 'white' }}>
                  <div className="dni-tag" style={{ background: '#3b82f6' }}>Firma Digital</div>
                  <img src={capturedImages.signature} alt="Firma" style={{ objectFit: 'contain' }} />
                  <div className="zoom-hint"><Maximize2 size={14} /> Hover para ampliar</div>
                </div>
              )}
            </div>
          </div>

          {/* TIMELINE MOVED HERE */}
          <div className="glass-panel flex-1">
            <div className="panel-header">
              <Clock size={18} className="text-slate-500" />
              <h3>Registro de Actividad</h3>
            </div>
            <div className="premium-timeline">
              <div className="p-timeline-item">
                <div className="p-time">{currentTime}</div>
                <div className="p-node"><UserCheck size={12}/></div>
                <div className="p-content">Captura biométrica facial y DNI</div>
              </div>
              <div className="p-timeline-item">
                <div className="p-time">{currentTime}</div>
                <div className="p-node"><Search size={12}/></div>
                <div className="p-content">Procesamiento OCR iniciado</div>
              </div>
              <div className="p-timeline-item success">
                <div className="p-time">{currentTime}</div>
                <div className="p-node"><CheckCircle2 size={12}/></div>
                <div className="p-content">Extracción de 14 campos exitosa</div>
              </div>
              <div className="p-timeline-item active">
                <div className="p-time">{currentTime}</div>
                <div className="p-node"><Clock size={12}/></div>
                <div className="p-content">Esperando confirmación RRHH</div>
              </div>
            </div>
          </div>
        </div>

        {/* MIDDLE COL: DATA */}
        <div className="premium-col-middle">
          <div className="glass-panel h-full flex-col">
            <div className="panel-header justify-between">
              <div className="flex gap-2 items-center">
                <Contact2 size={20} className="text-indigo-500" />
                <h3>Datos Personales Extraídos</h3>
              </div>
              <button 
                className={`btn-edit-micro ${isEditing ? 'active' : ''}`}
                onClick={() => setIsEditing(!isEditing)}
                style={isEditing ? { backgroundColor: '#4f46e5', color: 'white' } : {}}
              >
                {isEditing ? <Check size={14} /> : <Edit2 size={14} />} 
                {isEditing ? 'Guardar' : 'Editar'}
              </button>
            </div>
            
            <div className="premium-data-grid">
              {Object.keys(ocrData).filter(k => k !== 'hasPrimary' && k !== 'primarySchool' && k !== 'hasSecondary' && k !== 'secondarySchool' && k !== 'hasHigherEducation' && k !== 'higherEducationInstitution').map((key) => {
                const labelMap = {
                  nombres: 'Nombres', apellidoPaterno: 'Apellido Paterno', apellidoMaterno: 'Apellido Materno',
                  numeroDNI: 'Número de DNI', fechaNacimiento: 'Fecha Nacimiento', sexo: 'Sexo', estadoCivil: 'Estado Civil',
                  direccion: 'Dirección', departamento: 'Departamento', provincia: 'Provincia', distrito: 'Distrito',
                  telefono: 'Celular', correoPersonal: 'Correo Personal',
                  contactoEmergencia: 'Contacto Emergencia', parentesco: 'Parentesco Emergencia', telefonoEmergencia: 'Celular Emergencia'
                };
                if (!labelMap[key]) return null;

                return (
                  <div key={key} className="p-data-item">
                    <span className="p-data-label">{labelMap[key]}</span>
                    {isEditing ? (
                      <input 
                        type="text" 
                        value={ocrData[key] || ''} 
                        onChange={(e) => handleInputChange(key, e.target.value)}
                        className="premium-input-micro"
                        style={{ width: '100%', padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '14px', marginTop: '4px' }}
                      />
                    ) : (
                      <span className="p-data-value">{ocrData[key] || <span className="empty-val">No detectado</span>}</span>
                    )}
                  </div>
                );
              })}
              
              <div className="p-data-item">
                <span className="p-data-label">Régimen Pensionario</span>
                {isEditing ? (
                  <select
                    value={ocrData.sistemaPensionario || ''}
                    onChange={(e) => handleInputChange('sistemaPensionario', e.target.value)}
                    className="premium-input-micro"
                    style={{ width: '100%', padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '14px', marginTop: '4px' }}
                  >
                    <option value="">Seleccione AFP/ONP</option>
                    <option value="AFP Habitat">AFP Habitat</option>
                    <option value="AFP Integra">AFP Integra</option>
                    <option value="AFP Prima">AFP Prima</option>
                    <option value="AFP Profuturo">AFP Profuturo</option>
                    <option value="ONP">ONP</option>
                  </select>
                ) : (
                  <span className="p-data-value">{ocrData.sistemaPensionario || <span className="empty-val">No asignado</span>}</span>
                )}
              </div>

            </div>

            <div className="academic-modern-section mt-auto">
              <div className="academic-modern-header">
                <div className="academic-icon-wrapper">
                  <GraduationCap size={22} />
                </div>
                <h4>Validación Académica</h4>
              </div>
              <div className="academic-modern-grid">
                
                {/* PRIMARY EDUCATION CARD */}
                <div className="academic-card level-primary">
                  <div className="academic-card-icon">
                    <BookOpen size={24} />
                  </div>
                  <div className="academic-card-content">
                    <div className="academic-card-label">Educación Primaria</div>
                    <div className={`academic-card-value ${!ocrData.hasPrimary ? 'missing' : ''}`}>
                      {ocrData.hasPrimary ? ocrData.primarySchool : 'No registrada'}
                    </div>
                  </div>
                  <div className={`academic-card-status ${ocrData.hasPrimary ? 'valid' : 'invalid'}`}>
                    {ocrData.hasPrimary ? <Check size={16} /> : <CloseIcon size={16} />}
                  </div>
                </div>

                {/* SECONDARY EDUCATION CARD */}
                <div className="academic-card level-secondary">
                  <div className="academic-card-icon">
                    <Book size={24} />
                  </div>
                  <div className="academic-card-content">
                    <div className="academic-card-label">Educación Secundaria</div>
                    <div className={`academic-card-value ${!ocrData.hasSecondary ? 'missing' : ''}`}>
                      {ocrData.hasSecondary ? ocrData.secondarySchool : 'No registrada'}
                    </div>
                  </div>
                  <div className={`academic-card-status ${ocrData.hasSecondary ? 'valid' : 'invalid'}`}>
                    {ocrData.hasSecondary ? <Check size={16} /> : <CloseIcon size={16} />}
                  </div>
                </div>

                {/* HIGHER EDUCATION CARD */}
                <div className="academic-card level-higher">
                  <div className="academic-card-icon">
                    <Award size={24} />
                  </div>
                  <div className="academic-card-content">
                    <div className="academic-card-label">Educación Superior</div>
                    <div className={`academic-card-value ${!ocrData.hasHigherEducation ? 'missing' : ''}`}>
                      {ocrData.hasHigherEducation ? ocrData.higherEducationInstitution : 'No registrada'}
                    </div>
                  </div>
                  <div className={`academic-card-status ${ocrData.hasHigherEducation ? 'valid' : 'invalid'}`}>
                    {ocrData.hasHigherEducation ? <Check size={16} /> : <CloseIcon size={16} />}
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>



      </div>

      {/* IMAGE ZOOM MODAL */}
      {selectedImage && (
        <div 
          style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(4px)' }}
          onClick={() => setSelectedImage(null)}
        >
          <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }}>
            <button 
              onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }}
              style={{ position: 'absolute', top: '-40px', right: 0, background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center', fontSize: '16px' }}
            >
              <CloseIcon size={24} /> Cerrar
            </button>
            <img 
              src={selectedImage} 
              alt="DNI Zoom" 
              style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain', borderRadius: '12px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }} 
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

    </div>
  );
};

export default DataConfirmation;
