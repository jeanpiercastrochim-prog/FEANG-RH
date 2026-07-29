import { useState, useRef, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { PenTool, Eraser, CheckCircle2, ArrowLeft, ArrowRight, Upload, Image as ImageIcon, Crop } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { getCroppedImgBase64 } from '../utils/cropImage';

export default function DigitalSignature({ onSubmit, onBack }) {
  const sigPad = useRef({});
  const [error, setError] = useState('');
  const utteranceRef = useRef(null);
  const hasSpoken = useRef(false);

  // Modo: 'dibujar' o 'subir'
  const [mode, setMode] = useState('dibujar');
  
  // Estado para la foto subida y el recorte
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [croppedImageBase64, setCroppedImageBase64] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const fileInputRef = useRef(null);

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
    if (sigPad.current && sigPad.current.clear) {
      sigPad.current.clear();
    }
    setImageSrc(null);
    setCroppedImageBase64(null);
    setShowCropper(false);
    setError('');
  };

  const onFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageSrc(reader.result);
        setShowCropper(true);
        setError('');
      });
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const showCroppedImage = async () => {
    try {
      const croppedImage = await getCroppedImgBase64(
        imageSrc,
        croppedAreaPixels
      );
      setCroppedImageBase64(croppedImage);
      setShowCropper(false);
    } catch (e) {
      console.error(e);
      setError('Error al recortar la imagen');
    }
  };

  const handleSave = () => {
    if (mode === 'dibujar') {
      if (sigPad.current.isEmpty()) {
        setError('Por favor, dibuja tu firma antes de continuar.');
        return;
      }
      setError('');
      const dataURL = sigPad.current.getCanvas().toDataURL('image/png');
      onSubmit(dataURL);
    } else {
      if (!croppedImageBase64) {
        setError('Por favor, sube y recorta la foto de tu firma antes de continuar.');
        return;
      }
      setError('');
      onSubmit(croppedImageBase64);
    }
  };

  return (
    <div className="hr-premium-view">
      <div className="hr-premium-header">
        <div className="header-titles">
          <div className="status-badge pulse" style={{ background:'#eff6ff', color:'#2563eb' }}>
            Paso 4 de 4
          </div>
          <h1>Firma de Contrato</h1>
          <p>Dibuja tu firma o sube una foto de tu firma en papel. Esta firma se adjuntará a tu expediente digital y contrato.</p>
        </div>
        <div className="header-actions">
          <button onClick={onBack} className="btn-glass-secondary">
            <ArrowLeft size={18}/> Volver
          </button>
        </div>
      </div>

      <div className="premium-main-grid" style={{ gridTemplateColumns:'1fr', maxWidth: '700px', margin: '0 auto' }}>
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          
          <div style={{ width: '100%', display: 'flex', gap: '16px', marginBottom: '24px' }}>
            <button 
              onClick={() => { setMode('dibujar'); setError(''); }} 
              style={{ flex: 1, padding: '12px', borderRadius: '12px', border: mode === 'dibujar' ? '2px solid #3b82f6' : '1px solid #cbd5e1', background: mode === 'dibujar' ? '#eff6ff' : 'white', color: mode === 'dibujar' ? '#2563eb' : '#64748b', fontWeight: '600', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
            >
              <PenTool size={20} /> Dibujar Firma
            </button>
            <button 
              onClick={() => { setMode('subir'); setError(''); }} 
              style={{ flex: 1, padding: '12px', borderRadius: '12px', border: mode === 'subir' ? '2px solid #3b82f6' : '1px solid #cbd5e1', background: mode === 'subir' ? '#eff6ff' : 'white', color: mode === 'subir' ? '#2563eb' : '#64748b', fontWeight: '600', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
            >
              <Upload size={20} /> Subir Foto
            </button>
          </div>

          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1e293b', margin: 0 }}>
              {mode === 'dibujar' ? <><PenTool size={20} className="text-blue-500" /> Dibuja tu Firma</> : <><ImageIcon size={20} className="text-blue-500" /> Foto de Firma</>}
            </h3>
            {mode === 'dibujar' || (mode === 'subir' && (imageSrc || croppedImageBase64)) ? (
              <button onClick={clear} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>
                <Eraser size={16} /> Limpiar
              </button>
            ) : null}
          </div>

          {error && (
            <div style={{ width: '100%', background: '#fef2f2', color: '#ef4444', padding: '12px', borderRadius: '12px', marginBottom: '16px', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} /> {error}
            </div>
          )}

          {mode === 'dibujar' ? (
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
          ) : (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              {!imageSrc && !croppedImageBase64 && (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  style={{ width: '100%', height: '250px', background: '#f8fafc', borderRadius: '16px', border: '2px dashed #cbd5e1', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', gap: '12px', color: '#64748b' }}
                >
                  <Upload size={32} />
                  <span style={{ fontWeight: '500' }}>Toca para abrir cámara o galería</span>
                  <span style={{ fontSize: '13px', textAlign: 'center', maxWidth: '300px' }}>Por favor, firma en una hoja de papel blanco con lapicero oscuro y toma una foto nítida.</span>
                </div>
              )}
              
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={onFileChange} 
                accept="image/*" 
                capture="environment"
                style={{ display: 'none' }} 
              />

              {showCropper && imageSrc && (
                <div style={{ width: '100%', position: 'relative', height: '350px', background: '#333', borderRadius: '16px', overflow: 'hidden' }}>
                  <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={4 / 2}
                    onCropChange={setCrop}
                    onCropComplete={onCropComplete}
                    onZoomChange={setZoom}
                  />
                  <div style={{ position: 'absolute', bottom: '16px', left: '0', width: '100%', display: 'flex', justifyContent: 'center', gap: '12px' }}>
                    <button 
                      onClick={() => setShowCropper(false)} 
                      style={{ padding: '8px 16px', borderRadius: '8px', background: '#f1f5f9', color: '#475569', fontWeight: '600', border: 'none', cursor: 'pointer' }}
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={showCroppedImage} 
                      style={{ padding: '8px 16px', borderRadius: '8px', background: '#2563eb', color: 'white', fontWeight: '600', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Crop size={16} /> Recortar Firma
                    </button>
                  </div>
                </div>
              )}

              {!showCropper && croppedImageBase64 && (
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '100%', padding: '16px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'center' }}>
                    <img src={croppedImageBase64} alt="Firma Recortada" style={{ maxHeight: '150px', objectFit: 'contain' }} />
                  </div>
                  <button 
                    onClick={() => setShowCropper(true)} 
                    style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#475569', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Crop size={16} /> Volver a editar recorte
                  </button>
                </div>
              )}
            </div>
          )}

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
