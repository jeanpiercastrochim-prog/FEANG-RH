import { useState, useEffect, useRef } from 'react';
import CameraCapture from './CameraCapture';
import DataConfirmation from './DataConfirmation';
import ContractPreview from './ContractPreview';
import ProcessList from './ProcessList';
import UserCorroboration from './UserCorroboration';
import AcademicForm from './AcademicForm';
import ContactEmergencyForm from './ContactEmergencyForm';
import DigitalSignature from './DigitalSignature';
import SelectContract from './SelectContract';

const API_URL = 'http://127.0.0.1:5051/api';

/* ─────────────────────────────────────────────
   LOADING SCREEN — diseño moderno y premium
───────────────────────────────────────────── */
const loadingScreenStyles = `
  @keyframes ls-spin    { to { transform: rotate(360deg); } }
  @keyframes ls-float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
  @keyframes ls-fadein  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes ls-scan    { 0%{top:6%} 100%{top:88%} }
  @keyframes ls-bar     { 0%{width:0%} 15%{width:20%} 45%{width:52%} 70%{width:74%} 90%{width:91%} 100%{width:96%} }
  @keyframes ls-dots    { 0%,80%,100%{transform:scale(0);opacity:0.3} 40%{transform:scale(1);opacity:1} }
  .ls-root {
    position: absolute; inset: 0;
    background: linear-gradient(160deg, #f0f4ff 0%, #f8fafc 55%, #faf5ff 100%);
    display: flex; align-items: center; justify-content: center;
    z-index: 50; overflow: hidden;
    animation: ls-fadein 0.35s ease;
  }
  .ls-bg-orb { position: absolute; border-radius: 50%; pointer-events: none; }
  .ls-card {
    position: relative; z-index: 2;
    display: flex; flex-direction: column; align-items: center; gap: 26px;
    padding: 44px 48px 38px;
    background: white; border: 1px solid #e2e8f0; border-radius: 28px;
    box-shadow: 0 24px 60px rgba(99,102,241,0.1), 0 4px 16px rgba(0,0,0,0.04);
    width: 420px;
    animation: ls-fadein 0.45s ease 0.05s both;
  }
  .ls-icon-wrap {
    position: relative; width: 80px; height: 80px;
    display: flex; align-items: center; justify-content: center;
    animation: ls-float 3.5s ease-in-out infinite;
  }
  .ls-ring-outer {
    position: absolute; inset: 0; border-radius: 50%;
    border: 2px solid #e0e7ff;
  }
  .ls-ring-spin {
    position: absolute; inset: 0; border-radius: 50%;
    border: 3px solid transparent;
    border-top-color: #6366f1; border-right-color: #8b5cf6;
    animation: ls-spin 1s linear infinite;
  }
  .ls-icon-core {
    width: 52px; height: 52px; border-radius: 50%;
    background: linear-gradient(135deg, #eef2ff, #f5f3ff);
    border: 1px solid #e0e7ff;
    display: flex; align-items: center; justify-content: center;
    font-size: 22px;
  }
  .ls-title {
    font-family: 'Outfit', 'Inter', sans-serif;
    font-size: 21px; font-weight: 800;
    background: linear-gradient(90deg, #6366f1, #8b5cf6);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    text-align: center; margin: 0;
  }
  .ls-subtitle {
    font-size: 13px; color: #94a3b8;
    text-align: center; margin: 0;
    font-weight: 400; line-height: 1.5;
  }
  .ls-bar-track {
    width: 100%; height: 5px;
    background: #f1f5f9; border-radius: 100px; overflow: hidden;
  }
  .ls-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, #6366f1, #8b5cf6);
    border-radius: 100px;
    animation: ls-bar 9s ease-in-out forwards;
    box-shadow: 0 0 8px rgba(99,102,241,0.35);
  }
  .ls-bar-labels {
    display: flex; justify-content: space-between;
    font-size: 11px; color: #cbd5e1; font-weight: 500;
    margin-top: 6px;
  }
  .ls-steps { width: 100%; display: flex; flex-direction: column; gap: 8px; }
  .ls-step {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 12px;
    background: #f8fafc; border: 1px solid #f1f5f9;
    border-radius: 10px;
    animation: ls-fadein 0.4s ease both;
  }
  .ls-step-emoji {
    width: 28px; height: 28px; border-radius: 8px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center; font-size: 14px;
  }
  .ls-step-label { font-size: 13px; font-weight: 500; color: #475569; flex: 1; }
  .ls-step-dots { display: flex; gap: 4px; align-items: center; }
  .ls-dot {
    width: 5px; height: 5px; border-radius: 50%;
    animation: ls-dots 1.4s ease-in-out infinite;
  }
  .ls-dni-outer { position: relative; padding-bottom: 18px; }
  .ls-dni-card {
    width: 200px; height: 124px;
    background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);
    border-radius: 12px; overflow: hidden; position: relative;
    box-shadow: 0 16px 36px rgba(37,99,235,0.28);
    animation: ls-float 3.5s ease-in-out infinite;
  }
  .ls-scan-line {
    position: absolute; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, transparent 0%, #a5b4fc 50%, transparent 100%);
    box-shadow: 0 0 8px rgba(165,180,252,0.9);
    animation: ls-scan 1.8s ease-in-out infinite alternate;
  }
  .ls-dni-badge {
    position: absolute; bottom: 0; left: 50%; transform: translateX(-50%);
    background: #eef2ff; border: 1px solid #c7d2fe;
    border-radius: 20px; padding: 3px 14px;
    font-size: 11px; color: #6366f1; font-weight: 600; white-space: nowrap;
  }
  .ls-footer {
    font-size: 11px; color: #cbd5e1; letter-spacing: 0.5px;
    text-transform: uppercase; font-weight: 500;
  }
`;

const getLoadingConfig = (text) => {
  const t = (text || '').toLowerCase();
  if (t.includes('analizando su dni') || t.includes('modelo local') || t.includes('procesando su dni')) {
    return {
      title: 'Analizando tu DNI', subtitle: 'La IA está extrayendo los datos del documento',
      steps: [
        { label: 'Preprocesando imagen',      emoji: '🖼️', bg: '#eef2ff', c1: '#6366f1', c2: '#8b5cf6' },
        { label: 'Detectando campos del DNI', emoji: '🎯', bg: '#f5f3ff', c1: '#8b5cf6', c2: '#a855f7' },
        { label: 'Extrayendo información',    emoji: '✨', bg: '#fdf4ff', c1: '#a855f7', c2: '#c084fc' },
      ], showDni: true,
    };
  }
  if (t.includes('generando')) {
    return {
      title: 'Generando contrato', subtitle: 'Preparando el documento oficial para firma', emoji: '📄',
      steps: [
        { label: 'Compilando datos',       emoji: '👤', bg: '#eff6ff', c1: '#3b82f6', c2: '#6366f1' },
        { label: 'Aplicando plantilla',    emoji: '⚖️', bg: '#eef2ff', c1: '#6366f1', c2: '#8b5cf6' },
        { label: 'Generando PDF oficial',  emoji: '📋', bg: '#f5f3ff', c1: '#8b5cf6', c2: '#a855f7' },
      ], showDni: false,
    };
  }
  if (t.includes('enviando') || t.includes('recursos')) {
    return {
      title: 'Enviando a RRHH', subtitle: 'Transmitiendo el expediente completo', emoji: '📤',
      steps: [
        { label: 'Empaquetando datos',        emoji: '📦', bg: '#f0fdf4', c1: '#22c55e', c2: '#16a34a' },
        { label: 'Enviando al servidor',      emoji: '🌐', bg: '#eff6ff', c1: '#3b82f6', c2: '#2563eb' },
        { label: 'Registrando en sistema',    emoji: '✅', bg: '#f0fdf4', c1: '#16a34a', c2: '#15803d' },
      ], showDni: false,
    };
  }
  return {
    title: 'Procesando', subtitle: 'Por favor espere un momento...', emoji: '⚙️',
    steps: [
      { label: 'Cargando datos',          emoji: '📂', bg: '#f8fafc', c1: '#64748b', c2: '#475569' },
      { label: 'Procesando información', emoji: '⚙️', bg: '#f8fafc', c1: '#64748b', c2: '#475569' },
      { label: 'Preparando vista',       emoji: '🖥️', bg: '#f8fafc', c1: '#64748b', c2: '#475569' },
    ], showDni: false,
  };
};

function LoadingScreen({ text }) {
  const cfg = getLoadingConfig(text);
  const utteranceRef = useRef(null);

  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    
    let textToSpeak = '';
    if (cfg.title === 'Analizando tu DNI') {
      textToSpeak = 'Analizando tu DNI.';
    } else if (cfg.title === 'Generando contrato') {
      textToSpeak = 'Generando contrato oficial.';
    } else if (cfg.title === 'Enviando a RRHH') {
      textToSpeak = ''; // Muted as per user request to not speak while sending signature
    }
    
    if (textToSpeak) {
      window.speechSynthesis.cancel();
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
    }
  }, [cfg.title]);

  return (
    <>
      <style>{loadingScreenStyles}</style>
      <div className="ls-root">
        <div className="ls-bg-orb" style={{ width:'480px',height:'480px',top:'-140px',left:'-160px',background:'radial-gradient(circle,rgba(99,102,241,0.09) 0%,transparent 70%)' }} />
        <div className="ls-bg-orb" style={{ width:'360px',height:'360px',bottom:'-100px',right:'-120px',background:'radial-gradient(circle,rgba(139,92,246,0.07) 0%,transparent 70%)' }} />

        <div className="ls-card">

          {/* Visual superior */}
          {cfg.showDni ? (
            <div className="ls-dni-outer">
              <div className="ls-dni-card">
                <div className="ls-scan-line" />
                <div style={{ position:'absolute',top:'14px',left:'14px',width:'32px',height:'24px',background:'linear-gradient(135deg,#fbbf24,#f59e0b)',borderRadius:'4px',border:'1px solid rgba(255,255,255,0.25)' }} />
                {[[36,'54%'],[54,'76%'],[70,'44%']].map(([top,w],i)=>(
                  <div key={i} style={{ position:'absolute',top,left:'58px',height:'5px',width:w,background:'rgba(255,255,255,0.2)',borderRadius:'3px' }} />
                ))}
                <div style={{ position:'absolute',bottom:'10px',right:'12px',width:'36px',height:'46px',background:'rgba(255,255,255,0.12)',borderRadius:'5px',border:'1px solid rgba(255,255,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px' }}>👤</div>
              </div>
              <div className="ls-dni-badge">Escaneando DNI...</div>
            </div>
          ) : (
            <div className="ls-icon-wrap" style={{ animation:'ls-float 3.5s ease-in-out infinite' }}>
              <div className="ls-ring-outer" />
              <div className="ls-ring-spin" />
              <div className="ls-icon-core">{cfg.emoji}</div>
            </div>
          )}

          {/* Título y subtítulo — sin margin negativo */}
          <div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:'6px',width:'100%' }}>
            <h2 className="ls-title">{cfg.title}</h2>
            <p className="ls-subtitle">{cfg.subtitle}</p>
          </div>

          {/* Barra de progreso */}
          <div style={{ width:'100%' }}>
            <div className="ls-bar-track"><div className="ls-bar-fill" /></div>
            <div className="ls-bar-labels"><span>Procesando</span><span>Por favor espere</span></div>
          </div>

          {/* Pasos */}
          <div className="ls-steps">
            {cfg.steps.map((s, i) => (
              <div key={i} className="ls-step" style={{ animationDelay:`${i*0.12}s` }}>
                <div className="ls-step-emoji" style={{ background:s.bg }}>{s.emoji}</div>
                <span className="ls-step-label">{s.label}</span>
                <div className="ls-step-dots">
                  {[s.c1, s.c2, '#e2e8f0'].map((c,j)=>(
                    <div key={j} className="ls-dot" style={{ background:c, animationDelay:`${i*0.15+j*0.2}s` }} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <p className="ls-footer">CHAVIN · RRHH Inteligente</p>
        </div>
      </div>
    </>
  );
}

export default function ScannerFlow({ role, onBack }) {
  const [step, setStep] = useState(role === 'RH' ? 0 : 1);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [ocrData, setOcrData] = useState(null);
  const [contractPdfUrl, setContractPdfUrl] = useState(null);
  const [capturedImages, setCapturedImages] = useState({ front: null, back: null });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const successTimeoutRef = useRef(null);

  const successUtteranceRef = useRef(null);
  useEffect(() => {
    if (showSuccessModal) {
      if (!('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();
      const textToSpeak = '¡Felicidades! Has completado con éxito todo tu proceso. Tu contrato ya fue generado. Por favor, dale el espacio a la siguiente persona.';
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      successUtteranceRef.current = utterance;
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
  }, [showSuccessModal]);

  useEffect(() => {
    if (role === 'RH') {
      setStep(0); // 0 = ProcessList
    } else {
      setStep(1); // 1 = CameraCapture
    }
  }, [role]);

  const processDni = async (frontImageSrc, backImageSrc, mode = 'IA') => {
    setCapturedImages({ front: frontImageSrc, back: backImageSrc });
    setLoading(true);
    setLoadingText(mode === 'IA' ? "La IA está analizando su DNI..." : "El modelo local está procesando su DNI...");

    try {
      const frontRes = await fetch(frontImageSrc);
      const frontBlob = await frontRes.blob();
      
      const backRes = await fetch(backImageSrc);
      const backBlob = await backRes.blob();

      const formData = new FormData();
      formData.append('frontImage', frontBlob, 'front.jpg');
      formData.append('backImage', backBlob, 'back.jpg');
      formData.append('mode', mode);

      const response = await fetch(`${API_URL}/Ocr/extract`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (response.ok && result.success && result.data) {
        setOcrData({
          nombres: result.data.nombres || "",
          apellidoPaterno: result.data.apellidoPaterno || "",
          apellidoMaterno: result.data.apellidoMaterno || "",
          numeroDNI: result.data.numeroDni || "",
          fechaNacimiento: result.data.fechaNacimiento || "",
          sexo: result.data.sexo === "M" ? "MASCULINO" : (result.data.sexo === "F" ? "FEMENINO" : result.data.sexo),
          estadoCivil: result.data.estadoCivil || "SOLTERO",
          direccion: result.data.direccion || "",
          departamento: result.data.departamento || "",
          provincia: result.data.provincia || "",
          distrito: result.data.distrito || "",
          hasPrimary: false,
          primarySchool: "",
          hasSecondary: false,
          secondarySchool: "",
          hasHigherEducation: false,
          higherEducationInstitution: "",
          telefono: "",
          correoPersonal: "",
          contactoEmergencia: "",
          parentesco: "Madre",
          telefonoEmergencia: ""
        });
        setStep(1.25); // Go to Corroboration
      } else {
        alert("Error de la IA: " + (result.errorMessage || "No se pudo leer el DNI. Intente nuevamente con mejor iluminación."));
        setStep(1); // Back to camera
      }
    } catch (error) {
      console.error("Error connecting to OCR:", error);
      alert("Error de red conectando con el servicio de IA.");
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const submitToServer = async (signatureBase64 = null) => {
    setLoading(true);
    setLoadingText("Enviando paquete completo a Recursos Humanos...");
    try {
      const frontRes = await fetch(capturedImages.front);
      const frontBlob = await frontRes.blob();
      
      const backRes = await fetch(capturedImages.back);
      const backBlob = await backRes.blob();

      const formData = new FormData();
      formData.append('frontImage', frontBlob, 'front.jpg');
      formData.append('backImage', backBlob, 'back.jpg');
      
      // Append all DNI and Academic data
      Object.keys(ocrData).forEach(key => {
        formData.append(key, ocrData[key] !== null ? ocrData[key] : '');
      });

      if (signatureBase64) {
        formData.append('signatureBase64', signatureBase64);
      }

      const response = await fetch(`${API_URL}/Process/start`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        setShowSuccessModal(true);
        // Esperar 15 segundos y reiniciar todo el flujo para la siguiente persona
        successTimeoutRef.current = setTimeout(() => {
          setShowSuccessModal(false);
          resetFlow();
        }, 15051);
      } else {
        alert("Error guardando el proceso en el servidor.");
      }
    } catch (e) {
      alert("Error de conexión al servidor: " + e.message);
    }
    setLoading(false);
  };

  // Handle HR User selecting a process from the list
  const handleSelectProcess = async (id) => {
    setLoading(true);
    setLoadingText("Cargando datos del proceso...");
    try {
      const response = await fetch(`${API_URL}/Process/${id}`);
      if (response.ok) {
        const data = await response.json();
        setOcrData(data); // Load all DB response directly
        setCapturedImages({ 
          front: `http://127.0.0.1:5051${data.frontImagePath}`,
          back: `http://127.0.0.1:5051${data.backImagePath}`,
          signature: data.signatureImagePath ? `http://127.0.0.1:5051${data.signatureImagePath}` : null
        });
        setStep(2); // Go to Data Confirmation
      } else {
        alert("No se pudo cargar el proceso.");
      }
    } catch (e) {
      alert("Error: " + e.message);
    }
    setLoading(false);
  };

  const generateContract = async (contractObj) => {
    setLoading(true);
    setLoadingText("Generando contrato oficial...");
    
    try {
      const payload = {
        ...ocrData,
        tipoContrato: contractObj.title, // For PDF generation text if needed
        cargo: contractObj.cargo || contractObj.title,
        sueldoBasico: contractObj.sueldo || 1025.00
      };

      const response = await fetch(`${API_URL}/Contract/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setContractPdfUrl(url);

        // Llamar al nuevo endpoint para marcar el contrato como firmado
        if (ocrData && ocrData.id) {
          await fetch(`${API_URL}/Process/${ocrData.id}/finalize`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              ContractId: contractObj.id, 
              SistemaPensionario: ocrData.sistemaPensionario 
            })
          });
        }

        setStep(3);
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`Error generando el contrato PDF: ${errorData.detail || errorData.error || response.statusText}`);
      }
    } catch (e) {
      alert("Error de conexión al generar el contrato: " + e.message);
    }
    setLoading(false);
  };

  const handleInputChange = (field, value) => {
    setOcrData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetFlow = () => {
    setStep(role === 'RH' ? 0 : 1);
    setOcrData(null);
    setContractPdfUrl(null);
    setCapturedImages({ front: null, back: null });
  };

  const handleSkipSuccess = () => {
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
    }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setShowSuccessModal(false);
    resetFlow();
  };

  return (
    <div className="scanner-container full-width-flow" style={{ position: 'relative' }}>
      
      {/* BEAUTIFUL SUCCESS MODAL */}
      {showSuccessModal && (
        <div className="fullscreen-modal-overlay animate-fade" onClick={handleSkipSuccess} style={{ zIndex: 9999, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(10px)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="hr-card flex-col animate-fade" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', width: '100%', padding: '40px', textAlign: 'center', background: 'white', borderRadius: '24px' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto', boxShadow: '0 0 30px rgba(22, 163, 74, 0.3)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <h2 style={{ fontSize: '26px', color: '#1e293b', marginBottom: '16px' }}>¡Proceso Completado!</h2>
            <p style={{ fontSize: '16px', color: '#475569', lineHeight: '1.6', marginBottom: '24px' }}>
              Sus datos y documentos han sido enviados exitosamente a Recursos Humanos.
            </p>
            <div style={{ background: '#eff6ff', padding: '20px', borderRadius: '16px', border: '1px solid #bfdbfe' }}>
              <p style={{ fontSize: '15px', color: '#1e3a8a', fontWeight: '500' }}>
                👉 Por favor, acérquese al personal de RR.HH. para la verificación e impresión de su contrato oficial.
              </p>
            </div>
            <div style={{ marginTop: '30px', width: '100%', height: '4px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: '#3b82f6', width: '100%', animation: 'progress 15s linear forwards' }}></div>
            </div>
            <p style={{ marginTop: '16px', fontSize: '13px', color: '#94a3b8' }}>Haz clic fuera de esta tarjeta para continuar ahora</p>
          </div>
          <style>{`
            @keyframes progress {
              0% { width: 100%; }
              100% { width: 0%; }
            }
          `}</style>
        </div>
      )}

      {loading ? (
        <LoadingScreen text={loadingText} />
      ) : (
        <>
          {step === 0 && (
            <div className="animate-fade">
              <ProcessList onSelectProcess={handleSelectProcess} onBack={onBack} />
            </div>
          )}

          {step === 1 && (
            <div className="animate-fade">
              <CameraCapture onComplete={processDni} onBack={onBack} />
            </div>
          )}

          {step === 1.25 && ocrData && (
            <div className="animate-fade">
              <UserCorroboration 
                data={ocrData} 
                onDataChange={handleInputChange} 
                onConfirm={() => setStep(1.5)} 
              />
            </div>
          )}

          {step === 1.5 && ocrData && (
            <div className="animate-fade">
              <AcademicForm 
                data={ocrData} 
                onDataChange={handleInputChange} 
                onSubmit={() => setStep(1.6)} 
                onBack={() => setStep(1.25)} 
              />
            </div>
          )}

          {step === 1.6 && ocrData && (
            <div className="animate-fade">
              <ContactEmergencyForm 
                data={ocrData} 
                onDataChange={handleInputChange} 
                onSubmit={() => setStep(1.75)} 
                onBack={() => setStep(1.5)} 
              />
            </div>
          )}

          {step === 1.75 && ocrData && (
            <div className="animate-fade">
              <DigitalSignature
                onSubmit={submitToServer}
                onBack={() => setStep(1.6)}
              />
            </div>
          )}

          {step === 2 && ocrData && (
            <div className="animate-fade">
              <DataConfirmation 
                ocrData={ocrData} 
                capturedImages={capturedImages}
                handleInputChange={handleInputChange} 
                generateContract={() => setStep(2.5)}
                onBack={() => setStep(0)}
                role={role}
              />
            </div>
          )}

          {step === 2.5 && ocrData && (
            <div className="animate-fade">
              <SelectContract 
                onSelectContract={generateContract} 
                onBack={() => setStep(2)} 
              />
            </div>
          )}

          {step === 3 && contractPdfUrl && (
            <div className="animate-fade">
              <ContractPreview 
                contractPdfUrl={contractPdfUrl} 
                onReset={resetFlow} 
                onBack={onBack}
                role={role}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
