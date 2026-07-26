import { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { 
  Camera, CheckCircle2, RefreshCcw, Lock, 
  Scan, Sparkles, Sun, Eye, ArrowRight, ArrowLeft, Upload, Maximize2, X
} from 'lucide-react';

export default function CameraCapture({ onComplete, onBack }) {
  const webcamRef = useRef(null);
  const fileInputRefFront = useRef(null);
  const fileInputRefBack = useRef(null);
  // States: 'CONSENT', 'FRONT_INTRO', 'FRONT_CAPTURE', 'BACK_INTRO', 'BACK_CAPTURE', 'REVIEW'
  const [step, setStep] = useState('CONSENT');
  const [images, setImages] = useState({ front: null, back: null });
  const [ocrMode, setOcrMode] = useState('IA');
  const [fullscreenImage, setFullscreenImage] = useState(null);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    
    if (step === 'FRONT_CAPTURE') {
      setImages(prev => ({ ...prev, front: imageSrc }));
      setStep('BACK_INTRO');
    } else if (step === 'BACK_CAPTURE') {
      setImages(prev => ({ ...prev, back: imageSrc }));
      setStep('REVIEW');
    }
  }, [webcamRef, step]);

  const handleFileUpload = (e, side) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (side === 'front') {
          setImages(prev => ({ ...prev, front: reader.result }));
          setStep('BACK_INTRO');
        } else {
          setImages(prev => ({ ...prev, back: reader.result }));
          setStep('REVIEW');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const retake = (side) => {
    if (side === 'front') {
      setStep('FRONT_CAPTURE');
    } else {
      setStep('BACK_CAPTURE');
    }
  };

  const handleFinish = () => {
    onComplete(images.front, images.back, ocrMode);
  };

  // Voice Guidance Hook
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    
    // Cancelar cualquier voz en curso
    window.speechSynthesis.cancel();
    
    let textToSpeak = '';
    
    if (step === 'FRONT_INTRO') {
      const hour = new Date().getHours();
      let greeting = 'Buenos días';
      if (hour >= 12 && hour < 19) greeting = 'Buenas tardes';
      else if (hour >= 19 || hour < 5) greeting = 'Buenas noches';
      
      textToSpeak = `${greeting}, mi nombre es Jota, y hoy te guiaré en el proceso para firmar tu contrato en PRIME RH. Para empezar, por favor alinea la parte delantera de tu DNI en el recuadro y presiona tomar foto.`;
    } else if (step === 'BACK_INTRO') {
      textToSpeak = 'Muy bien, gracias por esa foto. Ahora dale la vuelta a tu documento. Necesito una foto de la parte trasera de tu DNI.';
    } else if (step === 'REVIEW') {
      textToSpeak = 'Excelente captura. Por favor, revisa las fotos en pantalla. Si los datos son perfectamente legibles, presiona Confirmar para que yo procese tu información con inteligencia artificial.';
    }
    
    if (textToSpeak) {
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = 'es-ES';
      utterance.rate = 1.0;
      utterance.pitch = 1.0; // Tono más natural
      
      const voices = window.speechSynthesis.getVoices();
      const esVoices = voices.filter(v => v.lang.startsWith('es'));
      const bestVoice = esVoices.find(v => v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Online')) || esVoices[0];
      if (bestVoice) {
        utterance.voice = bestVoice;
      }

      window.speechSynthesis.speak(utterance);
    }
  }, [step]);

  const instructions = [
    { icon: Scan, text: 'Coloca el DNI dentro del recuadro.' },
    { icon: Sparkles, text: 'Limpia el DNI de polvo o manchas.' },
    { icon: Sun, text: 'Evita reflejos e iluminación fuerte.' },
  ];

  if (step === 'REVIEW') {
    return (
      <div className="camera-view-container animate-fade">
        <div className="camera-header mb-8">
          <div className="camera-header-icon" style={{ background: '#f8fafc', color: '#0f172a', boxShadow: '0 0 20px rgba(15, 23, 42, 0.1)' }}>
            <Eye size={36} />
          </div>
          <div>
            <h1 style={{ fontSize: '28px', color: '#1e293b', marginBottom: '8px' }}>Revisa tus capturas</h1>
            <p style={{ color: '#64748b', fontSize: '15px' }}>Verifica que ambas caras de tu DNI sean perfectamente legibles antes de continuar.</p>
          </div>
        </div>

        {fullscreenImage && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.95)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
            <button onClick={() => setFullscreenImage(null)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', color: 'white', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', zIndex: 10000 }}>
              <X size={28} />
            </button>
            <img src={fullscreenImage} alt="Fullscreen" style={{ maxWidth: '95%', maxHeight: '95%', borderRadius: '16px', objectFit: 'contain', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }} />
          </div>
        )}

        <div className="hr-dashboard-grid" style={{ gridTemplateColumns: '1fr 1fr', maxWidth: '1000px', margin: '0 auto', gap: '30px' }}>
          {/* Front Review */}
          <div className="hr-card flex-col" style={{ padding: '24px', borderRadius: '24px' }}>
            <h3 style={{ fontSize: '18px', color: '#334155', marginBottom: '16px', fontWeight: '600', textAlign: 'center' }}>Parte Delantera (Anverso)</h3>
            <div style={{ borderRadius: '16px', overflow: 'hidden', border: '2px solid #e2e8f0', marginBottom: '20px', position: 'relative' }}>
              <img src={images.front} alt="DNI Frontal" style={{ width: '100%', display: 'block' }} />
              <button onClick={() => setFullscreenImage(images.front)} style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(15, 23, 42, 0.7)', color: 'white', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                <Maximize2 size={20} />
              </button>
            </div>
            <button onClick={() => retake('front')} className="btn-outline" style={{ width: '100%', justifyContent: 'center' }}>
              <RefreshCcw size={18} /> Volver a tomar Frontal
            </button>
          </div>

          {/* Back Review */}
          <div className="hr-card flex-col" style={{ padding: '24px', borderRadius: '24px' }}>
            <h3 style={{ fontSize: '18px', color: '#334155', marginBottom: '16px', fontWeight: '600', textAlign: 'center' }}>Parte Trasera (Reverso)</h3>
            <div style={{ borderRadius: '16px', overflow: 'hidden', border: '2px solid #e2e8f0', marginBottom: '20px', position: 'relative' }}>
              <img src={images.back} alt="DNI Trasero" style={{ width: '100%', display: 'block' }} />
              <button onClick={() => setFullscreenImage(images.back)} style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(15, 23, 42, 0.7)', color: 'white', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                <Maximize2 size={20} />
              </button>
            </div>
            <button onClick={() => retake('back')} className="btn-outline" style={{ width: '100%', justifyContent: 'center' }}>
              <RefreshCcw size={18} /> Volver a tomar Trasera
            </button>
          </div>
        </div>

        {/* OCR MODE SELECTOR */}
        <div style={{ maxWidth: '600px', margin: '40px auto 0 auto', background: 'white', borderRadius: '20px', padding: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '18px', color: '#1e293b', marginBottom: '16px', fontWeight: '600', textAlign: 'center' }}>Selecciona el Motor de Detección</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div 
              onClick={() => setOcrMode('IA')}
              style={{ padding: '20px', borderRadius: '16px', border: `2px solid ${ocrMode === 'IA' ? '#3b82f6' : '#e2e8f0'}`, background: ocrMode === 'IA' ? '#eff6ff' : 'white', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center' }}
            >
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>🤖</div>
              <h4 style={{ fontSize: '16px', color: '#1e293b', fontWeight: '600', marginBottom: '4px' }}>IA Gemini</h4>
              <p style={{ fontSize: '12px', color: '#64748b' }}>Alta precisión espacial</p>
            </div>
            
            <div 
              onClick={() => setOcrMode('LOCAL')}
              style={{ padding: '20px', borderRadius: '16px', border: `2px solid ${ocrMode === 'LOCAL' ? '#10b981' : '#e2e8f0'}`, background: ocrMode === 'LOCAL' ? '#f0fdf4' : 'white', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center' }}
            >
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>⚙️</div>
              <h4 style={{ fontSize: '16px', color: '#1e293b', fontWeight: '600', marginBottom: '4px' }}>Modelo Local</h4>
              <p style={{ fontSize: '12px', color: '#64748b' }}>Respaldo Tesseract</p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginTop: '30px' }}>
          <button onClick={handleFinish} className="btn-proceed" style={{ padding: '16px 40px', fontSize: '18px', borderRadius: '100px', boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.4)' }}>
            Confirmar y Analizar Datos <ArrowRight size={20} />
          </button>
        </div>
      </div>
    );
  }

  // CAPTURE MODE (FRONT OR BACK)
  const isFront = step === 'FRONT_CAPTURE' || step === 'FRONT_INTRO';
  
  return (
    <div className="camera-view-container animate-fade" style={{ position: 'relative', height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: '20px' }}>
      
      {/* INTERSTITIAL MODALS (INTRO / TRANSITION / CONSENT) */}
      {(step === 'CONSENT' || step === 'FRONT_INTRO' || step === 'BACK_INTRO') && (
        <div className="fullscreen-modal-overlay animate-fade" style={{ zIndex: 50, background: 'rgba(255, 255, 255, 0.3)', backdropFilter: 'blur(25px)', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="hr-card flex-col animate-fade" style={{ maxWidth: '600px', width: '100%', padding: '50px', textAlign: 'center', background: 'rgba(255, 255, 255, 0.95)', borderRadius: '32px', boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255,255,255,0.5) inset' }}>
            
            {step === 'CONSENT' ? (
              <>
                <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: '#f5f3ff', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto' }}>
                  <Lock size={44} />
                </div>
                <h2 style={{ fontSize: '28px', color: '#1e293b', marginBottom: '16px' }}>Privacidad y Uso de Datos</h2>
                <p style={{ fontSize: '16px', color: '#475569', lineHeight: '1.6', marginBottom: '24px' }}>
                  Para continuar con tu proceso de Onboarding, utilizaremos Inteligencia Artificial para extraer de forma segura y automática los datos de tu Documento Nacional de Identidad (DNI).
                </p>
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '32px', textAlign: 'left' }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
                    <input type="checkbox" defaultChecked style={{ width: '20px', height: '20px', marginTop: '2px', accentColor: '#6366f1' }} />
                    <span style={{ fontSize: '14px', color: '#334155', lineHeight: '1.5' }}>
                      <strong>Acepto los términos:</strong> Doy mi consentimiento expreso para que el sistema Chavín RH procese la imagen de mi DNI y extraiga mis datos personales estrictamente con fines de contratación, cumpliendo con la Ley de Protección de Datos Personales.
                    </span>
                  </label>
                </div>
                <button onClick={() => setStep('FRONT_INTRO')} className="btn-proceed" style={{ width: '100%', justifyContent: 'center', padding: '16px', fontSize: '18px', borderRadius: '12px', background: '#6366f1' }}>
                  Acepto y Entendido, Empezar <ArrowRight size={20} style={{ marginLeft: '8px' }} />
                </button>
              </>
            ) : step === 'FRONT_INTRO' ? (
              <>
                <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto' }}>
                  <Camera size={44} />
                </div>
                <h2 style={{ fontSize: '28px', color: '#1e293b', marginBottom: '16px' }}>Paso 1: Parte Delantera</h2>
                <p style={{ fontSize: '17px', color: '#475569', lineHeight: '1.6', marginBottom: '32px' }}>
                  Vamos a escanear el <strong>ANVERSO</strong> de tu DNI (donde aparece tu foto y tus nombres).
                  Asegúrate de que el ambiente tenga buena iluminación.
                </p>
                <button onClick={() => setStep('FRONT_CAPTURE')} className="btn-proceed" style={{ width: '100%', justifyContent: 'center', padding: '16px', fontSize: '18px', borderRadius: '12px' }}>
                  Entendido, Empezar <ArrowRight size={20} style={{ marginLeft: '8px' }} />
                </button>
              </>
            ) : (
              <>
                <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto' }}>
                  <CheckCircle2 size={44} />
                </div>
                <h2 style={{ fontSize: '28px', color: '#1e293b', marginBottom: '16px' }}>¡Excelente captura!</h2>
                <p style={{ fontSize: '17px', color: '#475569', lineHeight: '1.6', marginBottom: '32px' }}>
                  Paso 2: Dale la vuelta a tu documento. Ahora vamos a escanear el <strong>REVERSO</strong> de tu DNI.
                </p>
                <button onClick={() => setStep('BACK_CAPTURE')} className="btn-proceed" style={{ width: '100%', justifyContent: 'center', padding: '16px', fontSize: '18px', borderRadius: '12px', background: '#10b981' }}>
                  Continuar <ArrowRight size={20} style={{ marginLeft: '8px' }} />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <button onClick={onBack} className="btn-outline" style={{ position: 'absolute', top: '20px', left: '20px', padding: '8px 16px', border: 'none', background: 'white' }}>
        <ArrowLeft size={18} /> Volver
      </button>

      {/* Header */}
      <div className="camera-header mb-4" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <div className="camera-header-icon mb-2" style={{ background: isFront ? '#eff6ff' : '#f0fdf4', color: isFront ? '#2563eb' : '#16a34a', width: '60px', height: '60px' }}>
          <Camera size={30} />
        </div>
        <div>
          <h1 style={{ fontSize: '24px', color: '#1e293b', marginBottom: '4px' }}>
            {isFront ? 'Escanea la Parte Delantera' : 'Escanea la Parte Trasera'}
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px', maxWidth: '500px', margin: '0 auto' }}>
            {isFront 
              ? 'Por favor, alinea el ANVERSO de tu DNI dentro del recuadro.' 
              : 'Excelente. Ahora dale la vuelta a tu DNI y alinea el REVERSO.'}
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="camera-content-grid" style={{ maxWidth: '1000px', margin: '0 auto', flex: 1, minHeight: 0, display: 'flex', alignItems: 'stretch' }}>
        
        {/* Left Column: Camera */}
        <div className="camera-main-card" style={{ padding: '10px', background: 'white', borderRadius: '24px', boxShadow: '0 20px 50px -20px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column' }}>
          <div className="webcam-wrapper" style={{ borderRadius: '16px', flex: 1, position: 'relative' }}>
            {step !== 'CONSENT' && step !== 'FRONT_INTRO' ? (
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{
                  facingMode: 'environment',
                  width: 1280,
                  height: 720
                }}
                className="webcam-video"
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Camera size={48} color="#cbd5e1" />
              </div>
            )}
            {/* Overlay Frame */}
            <div className="webcam-overlay">
              <div className="scanning-frame" style={{ borderColor: isFront ? '#3b82f6' : '#10b981' }}></div>
            </div>
          </div>
          
          <div className="camera-actions mt-4 mb-2" style={{ display: 'flex', gap: '10px' }}>
            <button className="btn-proceed" onClick={capture} style={{ flex: 1, justifyContent: 'center', padding: '16px', fontSize: '18px', background: isFront ? '#2563eb' : '#10b981' }}>
              <Camera size={24} /> Tomar foto del {isFront ? 'Anverso' : 'Reverso'}
            </button>
            <input 
              type="file" 
              accept="image/*" 
              ref={isFront ? fileInputRefFront : fileInputRefBack} 
              style={{ display: 'none' }} 
              onChange={(e) => handleFileUpload(e, isFront ? 'front' : 'back')} 
            />
            <button 
              className="btn-outline" 
              onClick={() => isFront ? fileInputRefFront.current.click() : fileInputRefBack.current.click()} 
              style={{ padding: '16px', borderRadius: '12px', background: '#f8fafc' }}
              title="Subir foto de prueba"
            >
              <Upload size={24} color="#64748b" />
            </button>
          </div>
        </div>

        {/* Right Column: Instructions */}
        <div className="quality-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h3 style={{ fontSize: '20px', marginBottom: '24px' }}>Recomendaciones</h3>
          
          <div className="instructions-grid" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {instructions.map((inst, idx) => (
              <div key={idx} className="instruction-box" style={{ background: 'white', padding: '16px', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                <inst.icon className="instruction-icon" size={24} style={{ color: '#3b82f6' }} />
                <p style={{ fontWeight: '500', color: '#475569' }}>{inst.text}</p>
              </div>
            ))}
          </div>

          <div className="privacy-notice mt-8" style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px' }}>
            <Lock size={16} className="mb-2" style={{ color: '#64748b' }} /> 
            <p style={{ fontSize: '13px', color: '#64748b' }}>Tus fotos están protegidas y encriptadas. Solo serán utilizadas para el registro biométrico de tu contrato oficial.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
