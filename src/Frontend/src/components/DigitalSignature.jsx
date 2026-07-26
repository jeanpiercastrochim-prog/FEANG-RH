import { useState, useRef, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { PenTool, Eraser, CheckCircle2, ArrowLeft, ArrowRight } from 'lucide-react';

export default function DigitalSignature({ onSubmit, onBack }) {
  const sigPad = useRef({});
  const [error, setError] = useState('');
  const utteranceRef = useRef(null);
  const hasSpoken = useRef(false);

  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    if (hasSpoken.current) return;
    hasSpoken.current = true;
    
    window.speechSynthesis.cancel();
    
    const textToSpeak = "Ya casi terminamos. Por favor, dibuja tu firma en el recuadro para completar tu contrato.";
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
  }, []);

  const clear = () => {
    sigPad.current.clear();
    setError('');
  };

  const handleSave = () => {
    if (sigPad.current.isEmpty()) {
      setError('Por favor, dibuja tu firma antes de continuar.');
      return;
    }
    setError('');
    // Get base64 PNG data URL (using getCanvas instead of getTrimmedCanvas to fix Vite/Rollup ESM issue)
    const dataURL = sigPad.current.getCanvas().toDataURL('image/png');
    onSubmit(dataURL);
  };

  return (
    <div className="hr-premium-view">
      <div className="hr-premium-header">
        <div className="header-titles">
          <div className="status-badge pulse" style={{ background:'#eff6ff', color:'#2563eb' }}>
            Paso 4 de 4
          </div>
          <h1>Firma Digital</h1>
          <p>Dibuja tu firma en el recuadro inferior. Esta firma se adjuntará a tu expediente digital y contrato.</p>
        </div>
        <div className="header-actions">
          <button onClick={onBack} className="btn-glass-secondary">
            <ArrowLeft size={18}/> Volver
          </button>
        </div>
      </div>

      <div className="premium-main-grid" style={{ gridTemplateColumns:'1fr', maxWidth: '700px', margin: '0 auto' }}>
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1e293b', margin: 0 }}>
              <PenTool size={20} className="text-blue-500" /> Dibuja tu Firma
            </h3>
            <button onClick={clear} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>
              <Eraser size={16} /> Limpiar
            </button>
          </div>

          {error && (
            <div style={{ width: '100%', background: '#fef2f2', color: '#ef4444', padding: '12px', borderRadius: '12px', marginBottom: '16px', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} /> {error}
            </div>
          )}

          <div style={{ width: '100%', background: '#f8fafc', borderRadius: '16px', border: '2px dashed #cbd5e1', overflow: 'hidden', position: 'relative' }}>
            <SignatureCanvas 
              ref={sigPad}
              penColor="#0f172a"
              canvasProps={{
                width: 650, 
                height: 250, 
                className: 'sigCanvas',
                style: { width: '100%', height: '250px', touchAction: 'none' }
              }} 
            />
            <div style={{ position: 'absolute', bottom: '12px', left: '0', width: '100%', textAlign: 'center', pointerEvents: 'none', opacity: 0.4 }}>
              <div style={{ width: '80%', height: '1px', background: '#94a3b8', margin: '0 auto' }}></div>
              <span style={{ fontSize: '12px', fontWeight: '500', color: '#64748b', marginTop: '4px', display: 'block' }}>Firma aquí</span>
            </div>
          </div>

          <div style={{ marginTop: '32px', width: '100%' }}>
            <button
              onClick={handleSave}
              className="btn-glass-primary"
              style={{ width: '100%', padding: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '16px' }}
            >
              Guardar y Finalizar <ArrowRight size={18}/>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
