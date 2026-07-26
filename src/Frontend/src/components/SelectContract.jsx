import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, FileText, CheckCircle2, User, Database,
         Building, Wrench, Code, LayoutDashboard, Loader2 } from 'lucide-react';

const API = 'http://127.0.0.1:5051/api';

const getCategoryStyle = (name) => {
  const n = (name || '').toLowerCase();
  if (n.includes('campo'))       return { icon: User,             color: 'blue'    };
  if (n.includes('software'))    return { icon: Code,             color: 'purple'  };
  if (n.includes('ejecutivo'))   return { icon: Building,         color: 'emerald' };
  if (n.includes('practicante')) return { icon: LayoutDashboard,  color: 'orange'  };
  if (n.includes('limpieza'))    return { icon: Wrench,           color: 'slate'   };
  if (n.includes('datos'))       return { icon: Database,         color: 'indigo'  };
  return                                { icon: FileText,         color: 'gray'    };
};

export default function SelectContract({ onSelectContract, onBack }) {
  const [selectedId, setSelectedId]       = useState(null);
  const [isTransferring, setIsTransferring] = useState(false);
  const [contractTypes, setContractTypes] = useState([]);
  const [loadingTypes, setLoadingTypes]   = useState(true);

  useEffect(() => {
    fetch(`${API}/master/contratos`)
      .then(r => r.json())
      .then(data => {
        const mapped = data.map(t => {
          const style = getCategoryStyle(t.name);
          return { id: t.id, title: t.name, icon: style.icon, color: style.color, sueldo: t.sueldoBase, cargo: t.cargoName };
        });
        setContractTypes(mapped);
      })
      .catch((e) => {
        console.error("Error fetching contracts", e);
      })
      .finally(() => setLoadingTypes(false));
  }, []);

  const handleProceed = () => {
    if (!selectedId) return;
    setIsTransferring(true);
    setTimeout(() => {
      const selected = contractTypes.find(c => c.id === selectedId);
      onSelectContract(selected);
    }, 4500);
  };

  /* ── Pantalla de transferencia ── */
  if (isTransferring) {
    const selectedTitle = contractTypes.find(c => c.id === selectedId)?.title || selectedId;
    return (
      <div style={{ minHeight:'600px', display:'flex', alignItems:'center', justifyContent:'center',
        background:'linear-gradient(160deg,#f0f4ff 0%,#f8fafc 55%,#faf5ff 100%)',
        borderRadius:'32px', padding:'40px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', width:'400px', height:'400px', top:'-100px', left:'-100px',
          background:'radial-gradient(circle,rgba(99,102,241,0.09) 0%,transparent 70%)', borderRadius:'50%' }} />
        <div style={{ position:'absolute', width:'350px', height:'350px', bottom:'-80px', right:'-80px',
          background:'radial-gradient(circle,rgba(139,92,246,0.07) 0%,transparent 70%)', borderRadius:'50%' }} />

        <div style={{ maxWidth:'700px', width:'100%', textAlign:'center', position:'relative', zIndex:1 }}>
          <div style={{ background:'white', borderRadius:'28px', border:'1px solid #e2e8f0',
            boxShadow:'0 24px 60px rgba(99,102,241,0.1)', padding:'52px 56px' }}>

            <h2 style={{ fontSize:'28px', fontWeight:'800', marginBottom:'10px',
              background:'linear-gradient(90deg,#6366f1,#8b5cf6)',
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              Generando Contrato Inteligente
            </h2>
            <p style={{ color:'#94a3b8', fontSize:'15px', marginBottom:'52px' }}>
              Procesando expediente de <strong style={{ color:'#6366f1' }}>{selectedTitle}</strong>
            </p>

            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
              marginBottom:'52px', padding:'0 20px' }}>
              {/* Nodo 1 */}
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'14px' }}>
                <div style={{ width:'76px', height:'76px', borderRadius:'22px', background:'#eef2ff',
                  border:'2px solid #c7d2fe', display:'flex', alignItems:'center', justifyContent:'center',
                  color:'#6366f1', boxShadow:'0 8px 24px rgba(99,102,241,0.15)' }}>
                  <User size={36}/>
                </div>
                <span style={{ fontSize:'12px', color:'#6366f1', fontWeight:'700',
                  letterSpacing:'0.8px', textTransform:'uppercase' }}>Datos Extraídos</span>
              </div>

              {/* Línea animada */}
              <div style={{ flex:1, margin:'0 24px', position:'relative', height:'76px', display:'flex', alignItems:'center' }}>
                <svg width="100%" height="40" style={{ position:'absolute', top:'50%', transform:'translateY(-50%)' }}>
                  <line x1="0" y1="20" x2="100%" y2="20" stroke="#e2e8f0" strokeWidth="2" strokeDasharray="8 8"/>
                  <line x1="0" y1="20" x2="100%" y2="20" stroke="url(#sc-grad)" strokeWidth="3"
                    strokeLinecap="round" className="sc-animated-line"/>
                  <defs>
                    <linearGradient id="sc-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#6366f1"/>
                      <stop offset="50%" stopColor="#8b5cf6"/>
                      <stop offset="100%" stopColor="#a855f7"/>
                    </linearGradient>
                  </defs>
                </svg>
                <div className="sc-packet" style={{ position:'absolute', top:'50%', left:0,
                  transform:'translate(-50%,-50%)', width:'18px', height:'18px',
                  background:'white', borderRadius:'50%',
                  boxShadow:'0 0 16px 4px rgba(99,102,241,0.4)', border:'2px solid #e0e7ff' }}>
                  <div style={{ position:'absolute', top:'50%', left:'50%',
                    transform:'translate(-50%,-50%)', width:'8px', height:'8px',
                    background:'#6366f1', borderRadius:'50%' }}/>
                </div>
              </div>

              {/* Nodo 2 */}
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'14px' }}>
                <div className="sc-node-pulse" style={{ width:'76px', height:'76px', borderRadius:'22px',
                  background:'#faf5ff', border:'2px solid #ddd6fe',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  color:'#8b5cf6', boxShadow:'0 8px 24px rgba(139,92,246,0.15)' }}>
                  <FileText size={36}/>
                </div>
                <span style={{ fontSize:'12px', color:'#8b5cf6', fontWeight:'700',
                  letterSpacing:'0.8px', textTransform:'uppercase' }}>Contrato Oficial</span>
              </div>
            </div>

            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'10px',
              background:'#f8fafc', border:'1px solid #e8edf5', borderRadius:'14px', padding:'14px 24px' }}>
              <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#6366f1',
                animation:'sc-blink 1s ease-in-out infinite', flexShrink:0 }}/>
              <span className="sc-loading-text" style={{ fontSize:'15px', color:'#475569', fontWeight:'500' }}/>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes sc-draw   { 0%{stroke-dashoffset:1000} 100%{stroke-dashoffset:0} }
          @keyframes sc-travel {
            0%   {left:0%;   opacity:0; transform:translate(-50%,-50%) scale(0.5)}
            8%   {opacity:1; transform:translate(-50%,-50%) scale(1)}
            92%  {opacity:1; transform:translate(-50%,-50%) scale(1)}
            100% {left:100%; opacity:0; transform:translate(-50%,-50%) scale(0.5)}
          }
          @keyframes sc-pulse-node {
            0%,70% {box-shadow:0 8px 24px rgba(139,92,246,0.15);transform:scale(1)}
            85%    {box-shadow:0 0 40px rgba(139,92,246,0.5);transform:scale(1.06);border-color:#a78bfa}
            100%   {box-shadow:0 8px 32px rgba(139,92,246,0.3);transform:scale(1)}
          }
          @keyframes sc-blink  { 0%,100%{opacity:1} 50%{opacity:0.3} }
          @keyframes sc-cycle  {
            0%  {content:"Digitalizando perfil biométrico..."}
            33% {content:"Validando políticas de RRHH..."}
            66% {content:"Ensamblando cláusulas del contrato..."}
          }
          .sc-animated-line { stroke-dasharray:1000; stroke-dashoffset:1000; animation:sc-draw 4.5s ease-in-out forwards }
          .sc-packet        { animation:sc-travel 4.5s ease-in-out forwards }
          .sc-node-pulse    { animation:sc-pulse-node 4.5s ease-in-out forwards }
          .sc-loading-text::after { content:"Digitalizando perfil biométrico..."; animation:sc-cycle 4.5s step-end forwards }
        `}</style>
      </div>
    );
  }

  /* ── Pantalla de selección ── */
  return (
    <div className="hr-premium-view">
      <div className="hr-premium-header">
        <div className="header-titles">
          <div className="status-badge pulse" style={{ background:'#eff6ff', color:'#2563eb' }}>
            Paso Siguiente
          </div>
          <h1>Selección de Contrato</h1>
          <p>Elige el tipo de contrato que deseas generar para este candidato.</p>
        </div>
        <div className="header-actions">
          <button onClick={onBack} className="btn-glass-secondary">
            <ArrowLeft size={18}/> Volver
          </button>
          <button
            onClick={handleProceed}
            className="btn-glass-primary"
            disabled={!selectedId}
            style={{ opacity:selectedId?1:0.5, cursor:selectedId?'pointer':'not-allowed' }}
          >
            Generar Contrato <ArrowRight size={18}/>
          </button>
        </div>
      </div>

      <div className="premium-main-grid" style={{ gridTemplateColumns:'1fr' }}>
        <div className="glass-panel">
          <div className="panel-header mb-6">
            <FileText size={20} className="text-blue-500"/>
            <h3>Plantillas Disponibles</h3>
          </div>

          {loadingTypes ? (
            <div style={{ textAlign:'center', padding:'48px', color:'#94a3b8',
              display:'flex', alignItems:'center', justifyContent:'center', gap:'12px' }}>
              <Loader2 size={22} color="#6366f1" style={{ animation:'spin 1s linear infinite' }}/>
              Cargando plantillas...
            </div>
          ) : contractTypes.length === 0 ? (
            <div style={{ textAlign:'center', padding:'48px', color:'#94a3b8' }}>
              No hay plantillas disponibles. Súbelas desde "Subir Contratos".
            </div>
          ) : (
            <div className="contract-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'24px' }}>
              {contractTypes.map(contract => {
                const Icon = contract.icon;
                const isSelected = selectedId === contract.id;
                return (
                  <div
                    key={contract.id}
                    onClick={() => setSelectedId(contract.id)}
                    className={`contract-card ${isSelected ? 'selected' : ''}`}
                    style={{
                      padding:'24px', borderRadius:'20px', cursor:'pointer',
                      border: isSelected ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                      background: isSelected ? '#eff6ff' : '#ffffff',
                      transition:'all 0.3s ease',
                      boxShadow: isSelected
                        ? '0 10px 25px -5px rgba(59,130,246,0.2)'
                        : '0 4px 6px -1px rgba(0,0,0,0.05)',
                      position:'relative', overflow:'hidden'
                    }}
                  >
                    {isSelected && (
                      <div style={{ position:'absolute', top:'16px', right:'16px', color:'#3b82f6' }}>
                        <CheckCircle2 size={24}/>
                      </div>
                    )}
                    <div style={{
                      width:'56px', height:'56px', borderRadius:'16px', marginBottom:'16px',
                      background: isSelected ? '#3b82f6' : '#f1f5f9',
                      color: isSelected ? '#ffffff' : '#64748b',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      transition:'all 0.3s ease'
                    }}>
                      <Icon size={28}/>
                    </div>
                    <h4 style={{ fontSize:'18px', color:'#1e293b', marginBottom:'4px', fontWeight:'600' }}>
                      {contract.title}
                    </h4>
                    {contract.cargo && (
                      <p style={{ fontSize: '13px', color: '#3b82f6', fontWeight: '600', marginBottom: '8px' }}>
                        Cargo: {contract.cargo} | Sueldo: S/ {contract.sueldo}
                      </p>
                    )}
                    <p style={{ fontSize:'14px', color:'#64748b', lineHeight:'1.5' }}>
                      Genera un documento oficial basado en esta plantilla.
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
