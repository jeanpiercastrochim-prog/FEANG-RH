import { CheckCircle2, User, FileText, MapPin, ArrowRight, AlertTriangle, Shield, Edit3, Sparkles } from 'lucide-react';

const ucStyles = `
  @keyframes uc-fadein {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes uc-glow-pulse {
    0%, 100% { box-shadow: 0 0 20px rgba(34,197,94,0.2); }
    50%       { box-shadow: 0 0 40px rgba(34,197,94,0.45); }
  }
  @keyframes uc-shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }
  @keyframes uc-float {
    0%, 100% { transform: translateY(0); }
    50%       { transform: translateY(-6px); }
  }

  .uc-root {
    min-height: 100%;
    background: linear-gradient(160deg, #f0f4ff 0%, #f8fafc 55%, #faf5ff 100%);
    padding: 36px 40px;
    font-family: 'Inter', sans-serif;
    position: relative;
    overflow: hidden;
  }

  .uc-orb {
    position: fixed; border-radius: 50%; pointer-events: none; z-index: 0;
  }

  /* Hero banner */
  .uc-hero {
    position: relative; z-index: 1;
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 28px;
    padding: 28px 36px;
    background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
    border: 1px solid #bbf7d0;
    border-radius: 22px;
    box-shadow: 0 4px 20px rgba(34,197,94,0.08);
    animation: uc-fadein 0.4s ease both;
  }
  .uc-hero-left { display: flex; align-items: center; gap: 18px; }
  .uc-hero-icon {
    width: 60px; height: 60px; border-radius: 18px;
    background: linear-gradient(135deg, #22c55e, #16a34a);
    display: flex; align-items: center; justify-content: center;
    color: white;
    box-shadow: 0 6px 18px rgba(34,197,94,0.3);
    animation: uc-float 4s ease-in-out infinite;
    flex-shrink: 0;
  }
  .uc-hero-title {
    font-size: 24px; font-weight: 800; color: #0f172a; margin: 0 0 4px;
    letter-spacing: -0.4px;
  }
  .uc-hero-sub {
    font-size: 13px; color: #64748b; margin: 0; font-weight: 400; line-height: 1.5;
  }
  .uc-hero-badge {
    display: flex; align-items: center; gap: 8px;
    padding: 9px 18px;
    background: white;
    border: 1px solid #bbf7d0;
    border-radius: 100px;
    color: #16a34a; font-size: 13px; font-weight: 600;
    box-shadow: 0 2px 8px rgba(34,197,94,0.1);
    flex-shrink: 0;
  }

  /* Warning */
  .uc-warning {
    position: relative; z-index: 1;
    display: flex; gap: 14px; align-items: flex-start;
    padding: 18px 22px;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-left: 4px solid #ef4444;
    border-radius: 16px;
    margin-bottom: 24px;
    animation: uc-fadein 0.4s ease 0.1s both;
  }
  .uc-warning-title { color: #dc2626; font-size: 14px; font-weight: 700; margin: 0 0 4px; }
  .uc-warning-text  { color: #b91c1c; font-size: 13px; line-height: 1.6; margin: 0; }

  /* Sección card */
  .uc-section {
    position: relative; z-index: 1;
    background: white;
    border: 1px solid #e8edf5;
    border-radius: 22px;
    padding: 28px 32px;
    margin-bottom: 18px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.04);
    animation: uc-fadein 0.4s ease both;
    transition: box-shadow 0.2s, border-color 0.2s;
  }
  .uc-section:hover { box-shadow: 0 8px 28px rgba(99,102,241,0.08); border-color: #ddd6fe; }

  .uc-section-header {
    display: flex; align-items: center; gap: 12px;
    margin-bottom: 24px; padding-bottom: 18px;
    border-bottom: 1px solid #f1f5f9;
  }
  .uc-section-icon {
    width: 40px; height: 40px; border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .uc-section-title {
    font-size: 15px; font-weight: 700; color: #1e293b; margin: 0;
  }
  .uc-section-count {
    margin-left: auto;
    background: #f8fafc; border: 1px solid #e2e8f0;
    border-radius: 20px; padding: 3px 11px;
    font-size: 12px; color: #94a3b8; font-weight: 600;
  }

  /* Grid */
  .uc-grid { display: grid; gap: 18px; }
  .uc-grid-4 { grid-template-columns: repeat(4, 1fr); }
  .uc-grid-3 { grid-template-columns: repeat(3, 1fr); }
  .uc-grid-2 { grid-template-columns: repeat(2, 1fr); }
  .uc-span-2 { grid-column: span 2; }

  /* Inputs */
  .uc-field { display: flex; flex-direction: column; gap: 7px; }
  .uc-label {
    font-size: 11px; font-weight: 700; color: #94a3b8;
    text-transform: uppercase; letter-spacing: 0.7px;
  }
  .uc-input-wrap { position: relative; display: flex; align-items: center; }
  .uc-input {
    width: 100%;
    background: #f8fafc;
    border: 1.5px solid #e2e8f0;
    border-radius: 11px;
    padding: 11px 14px;
    color: #1e293b;
    font-size: 14px; font-weight: 500;
    font-family: 'Inter', sans-serif;
    outline: none;
    transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
  }
  .uc-input::placeholder { color: #cbd5e1; }
  .uc-input:focus {
    border-color: #6366f1;
    background: white;
    box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
  }
  .uc-input:hover:not(:focus) {
    border-color: #c7d2fe;
    background: white;
  }
  .uc-input-dni {
    font-family: 'Outfit', monospace;
    font-size: 15px; font-weight: 700; letter-spacing: 2px;
    background: #eef2ff; border-color: #c7d2fe; color: #4338ca;
  }
  .uc-input-dni:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
  }

  /* Footer */
  .uc-footer {
    position: relative; z-index: 1;
    display: flex; align-items: center; justify-content: space-between;
    padding: 22px 32px;
    background: white;
    border: 1px solid #e8edf5;
    border-radius: 18px;
    margin-top: 4px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.04);
  }
  .uc-footer-info {
    display: flex; align-items: center; gap: 8px;
    font-size: 13px; color: #94a3b8;
  }
  .uc-confirm-btn {
    display: inline-flex; align-items: center; gap: 10px;
    padding: 13px 30px;
    background: linear-gradient(135deg, #22c55e, #16a34a);
    color: white; border: none; border-radius: 13px;
    font-size: 15px; font-weight: 700; cursor: pointer;
    box-shadow: 0 6px 20px rgba(34,197,94,0.28);
    transition: all 0.2s ease;
    font-family: 'Inter', sans-serif;
  }
  .uc-confirm-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 28px rgba(34,197,94,0.38);
  }
  .uc-confirm-btn:active { transform: translateY(0); }

  @media (max-width: 900px) {
    .uc-grid-4 { grid-template-columns: repeat(2, 1fr); }
    .uc-grid-3 { grid-template-columns: repeat(2, 1fr); }
    .uc-hero { flex-direction: column; gap: 16px; text-align: center; }
    .uc-root { padding: 20px; }
    .uc-section { padding: 24px 20px; }
  }
`;

// Field fuera del componente principal para evitar re-mount en cada render
const Field = ({ label, field, span, isDni = false, lettersOnly = false, options = null, autoComplete = 'off', data, onDataChange }) => (
  <div className={`uc-field${span ? ` uc-span-${span}` : ''}`}>
    <label className="uc-label">{label}</label>
    <div className="uc-input-wrap">
      {options ? (
        <select
          className="uc-input"
          value={data[field] || ''}
          onChange={e => onDataChange(field, e.target.value)}
          style={{ cursor: 'pointer', appearance: 'none' }}
        >
          <option value="" disabled>Seleccione una opción</option>
          {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      ) : (
        <input
          type="text"
          autoComplete={autoComplete}
          className={`uc-input${isDni ? ' uc-input-dni' : ''}`}
          value={data[field] || ''}
          onChange={e => {
            let val = e.target.value;
            if (lettersOnly) val = val.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
            onDataChange(field, val);
          }}
          placeholder={`Ingrese ${label.toLowerCase()}`}
        />
      )}
    </div>
  </div>
);

export default function UserCorroboration({ data, onDataChange, onConfirm }) {
  const isFallback = data.nombres === 'NOMBRE_A_REVISAR';

  return (
    <>
      <style>{ucStyles}</style>
      <div className="uc-root">
        {/* Orbes de fondo */}
        <div className="uc-orb" style={{ width:'500px',height:'500px',top:'-150px',left:'-150px',background:'radial-gradient(circle,rgba(99,102,241,0.08) 0%,transparent 70%)' }} />
        <div className="uc-orb" style={{ width:'400px',height:'400px',bottom:'-100px',right:'-150px',background:'radial-gradient(circle,rgba(34,197,94,0.06) 0%,transparent 70%)' }} />
        <div className="uc-orb" style={{ width:'300px',height:'300px',top:'45%',left:'55%',background:'radial-gradient(circle,rgba(139,92,246,0.05) 0%,transparent 70%)' }} />

        {/* Hero Header */}
        <div className="uc-hero">
          <div className="uc-hero-left">
            <div className="uc-hero-icon">
              <CheckCircle2 size={32} />
            </div>
            <div>
              <h1 className="uc-hero-title">Datos Extraídos del DNI</h1>
              <p className="uc-hero-sub">Revisa y corrige la información antes de continuar. Los cambios se guardan automáticamente.</p>
            </div>
          </div>
          <div className="uc-hero-badge">
            <Shield size={14} color="#4ade80" />
            Verificación en curso
          </div>
        </div>

        {/* Alerta de fallback */}
        {isFallback && (
          <div className="uc-warning">
            <AlertTriangle size={22} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <p className="uc-warning-title">⚠️ Detección por Modelo de Respaldo</p>
              <p className="uc-warning-text">
                La IA principal se encuentra temporalmente saturada. Se está usando el segundo método de detección (Mapeo Local). Es probable que existan fallas — <b>por favor verifica y completa los datos manualmente</b> basándote en la fotografía del DNI.
              </p>
            </div>
          </div>
        )}

        {/* ── SECCIÓN 1: DATOS PERSONALES ── */}
        <div className="uc-section" style={{ animationDelay: '0.1s' }}>
          <div className="uc-section-header">
            <div className="uc-section-icon" style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.2)' }}>
              <User size={20} />
            </div>
            <h2 className="uc-section-title">Datos Personales y Laborales</h2>
            <span className="uc-section-count">5 campos</span>
          </div>
          <div className="uc-grid uc-grid-3">
            <Field label="Nombres"           field="nombres"          lettersOnly data={data} onDataChange={onDataChange} />
            <Field label="Apellido Paterno"  field="apellidoPaterno"  lettersOnly data={data} onDataChange={onDataChange} />
            <Field label="Apellido Materno"  field="apellidoMaterno"  lettersOnly data={data} onDataChange={onDataChange} />
            <Field label="Fecha Nacimiento"  field="fechaNacimiento"  data={data} onDataChange={onDataChange} />
            <Field label="Sistema de Pensión" field="sistemaPensionario" options={["ONP", "AFP Integra", "AFP Prima", "AFP Profuturo", "AFP Habitat"]} data={data} onDataChange={onDataChange} />
          </div>
        </div>

        {/* ── SECCIÓN 2: IDENTIFICACIÓN ── */}
        <div className="uc-section" style={{ animationDelay: '0.2s' }}>
          <div className="uc-section-header">
            <div className="uc-section-icon" style={{ background: 'rgba(168,85,247,0.15)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.2)' }}>
              <FileText size={20} />
            </div>
            <h2 className="uc-section-title">Identificación y Estado</h2>
            <span className="uc-section-count">3 campos</span>
          </div>
          <div className="uc-grid uc-grid-3">
            <Field label="Número de DNI" field="numeroDNI"   isDni data={data} onDataChange={onDataChange} />
            <Field label="Estado Civil"  field="estadoCivil"       data={data} onDataChange={onDataChange} />
            <Field label="Sexo"          field="sexo"              data={data} onDataChange={onDataChange} />
          </div>
        </div>

        {/* ── SECCIÓN 3: UBICACIÓN ── */}
        <div className="uc-section" style={{ animationDelay: '0.3s' }}>
          <div className="uc-section-header">
            <div className="uc-section-icon" style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.2)' }}>
              <MapPin size={20} />
            </div>
            <h2 className="uc-section-title">Ubicación</h2>
            <span className="uc-section-count">4 campos</span>
          </div>
          <div className="uc-grid uc-grid-2" style={{ marginBottom: '20px' }}>
            <Field label="Dirección Completa" field="direccion" span={2} data={data} onDataChange={onDataChange} />
          </div>
          <div className="uc-grid uc-grid-3">
            <Field label="Departamento" field="departamento" data={data} onDataChange={onDataChange} />
            <Field label="Provincia"    field="provincia"    data={data} onDataChange={onDataChange} />
            <Field label="Distrito"     field="distrito"     data={data} onDataChange={onDataChange} />
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div className="uc-footer" style={{ animationDelay: '0.4s' }}>
          <div className="uc-footer-info">
            <Edit3 size={14} color="rgba(255,255,255,0.35)" />
            Puedes editar cualquier campo antes de confirmar
          </div>
          <button 
            className="uc-confirm-btn" 
            onClick={onConfirm} 
            disabled={!data.sistemaPensionario}
            style={{ opacity: !data.sistemaPensionario ? 0.5 : 1, cursor: !data.sistemaPensionario ? 'not-allowed' : 'pointer' }}
          >
            Confirmar y Continuar
            <ArrowRight size={18} />
          </button>
        </div>

      </div>
    </>
  );
}
