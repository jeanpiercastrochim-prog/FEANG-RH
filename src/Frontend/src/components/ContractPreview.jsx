import { useState } from 'react';
import { PartyPopper, Printer, RefreshCw, Home, CheckCircle2, Copy, ArrowRight, FileCheck } from 'lucide-react';

const ContractPreview = ({ contractPdfUrl, onReset, onBack, role }) => {
  const [printStage, setPrintStage] = useState(0);

  const handlePrintSingle = () => {
    const printWindow = window.open(contractPdfUrl, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
    setTimeout(() => {
      onReset();
    }, 1500);
  };

  const startDualPrint = () => {
    setPrintStage(1);
    const win = window.open(contractPdfUrl, '_blank');
    if (win) { win.onload = () => win.print(); }
  };

  const continueDualPrint = () => {
    setPrintStage(2);
    const win = window.open(contractPdfUrl, '_blank');
    if (win) { win.onload = () => win.print(); }
  };

  const finishDualPrint = () => {
    setPrintStage(0);
    onReset();
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative', padding: '20px' }}>
      
      {/* HEADER COMPACTO Y PREMIUM */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        padding: '20px 30px', 
        background: 'linear-gradient(90deg, #1e293b 0%, #0f172a 100%)', 
        color: 'white', 
        borderRadius: '20px', 
        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
        border: '1px solid #334155'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ 
            width: '56px', height: '56px', borderRadius: '16px', 
            background: 'rgba(56, 189, 248, 0.15)', 
            border: '1px solid rgba(56, 189, 248, 0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8',
            boxShadow: '0 0 20px rgba(56, 189, 248, 0.2)'
          }}>
            <PartyPopper size={28} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: '800', margin: '0 0 4px 0', letterSpacing: '0.5px', color: 'white' }}>
              Contrato Generado con Éxito
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: 0 }}>
              El expediente ha sido procesado. El documento está listo para imprimir y firmar.
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '12px', color: '#4ade80', fontWeight: '600', fontSize: '14px' }}>
          <CheckCircle2 size={18} /> Proceso Terminado
        </div>
      </div>

      {/* VISOR DE PDF ESTILO MAC/TERMINAL */}
      <div style={{ 
        position: 'relative', 
        height: '85vh', 
        minHeight: '900px',
        borderRadius: '24px', 
        background: '#0f172a', 
        border: '1px solid #334155', 
        display: 'flex', 
        flexDirection: 'column', 
        overflow: 'hidden', 
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' 
      }}>
        
        {/* Toolbar del Visor */}
        <div style={{ 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
          padding: '16px 24px', background: 'rgba(15, 23, 42, 0.9)', 
          backdropFilter: 'blur(10px)', borderBottom: '1px solid #1e293b' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444' }}></div>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#eab308' }}></div>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#22c55e' }}></div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#cbd5e1', fontWeight: '600', fontSize: '14px', background: '#1e293b', padding: '6px 14px', borderRadius: '8px', border: '1px solid #334155' }}>
              <FileCheck size={16} className="text-blue-400" />
              Visor Oficial del Documento
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={startDualPrint} className="premium-print-dual">
              <Copy size={16} /> Imprimir 2 Copias <span style={{ opacity: 0.7, fontSize: '12px', marginLeft: '4px' }}>(RRHH y Trabajador)</span>
            </button>
            <button onClick={handlePrintSingle} className="premium-print-single">
              <Printer size={16} /> Directo
            </button>
          </div>
        </div>
        
        {/* Frame del PDF */}
        <div style={{ flex: 1, background: '#334155', position: 'relative' }}>
          <iframe 
            src={`${contractPdfUrl}#view=FitH`} 
            width="100%" 
            height="100%" 
            title="Previsualización del Contrato"
            style={{ border: 'none', backgroundColor: '#525659', display: 'block' }}
          />
        </div>
      </div>

      {/* BARRA DE COMANDOS INFERIOR */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '8px' }}>
        <button 
          onClick={onReset} 
          style={{ padding: '14px 28px', fontSize: '15px', fontWeight: '600', display: 'flex', gap: '10px', alignItems: 'center', background: 'white', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '14px', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', transition: 'all 0.2s' }}
          onMouseOver={(e) => e.currentTarget.style.background = '#f8fafc'}
          onMouseOut={(e) => e.currentTarget.style.background = 'white'}
        >
          <RefreshCw size={20} /> Ir a la Lista de Pendientes
        </button>

        {role === 'RH' && onBack && (
          <button 
            onClick={onBack} 
            style={{ padding: '14px 28px', fontSize: '15px', fontWeight: '600', display: 'flex', gap: '10px', alignItems: 'center', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '14px', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.2)', transition: 'all 0.2s' }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <Home size={20} /> Volver al Panel Principal
          </button>
        )}
      </div>

      {/* DUAL PRINT MODAL PREMIUM */}
      {printStage > 0 && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, borderRadius: '24px' }}>
          <div style={{ textAlign: 'center', maxWidth: '480px', padding: '48px', background: 'white', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', position: 'relative', overflow: 'hidden' }}>
            
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '6px', background: printStage === 1 ? 'linear-gradient(90deg, #38bdf8, #818cf8)' : 'linear-gradient(90deg, #34d399, #10b981)' }}></div>

            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: printStage === 1 ? '#eff6ff' : '#ecfdf5', color: printStage === 1 ? '#4f46e5' : '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto' }}>
              {printStage === 1 ? <Printer size={40} /> : <CheckCircle2 size={40} />}
            </div>
            
            {printStage === 1 && (
              <>
                <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', marginBottom: '16px' }}>Copia del Trabajador</h2>
                <p style={{ color: '#64748b', fontSize: '15px', marginBottom: '32px', lineHeight: '1.6' }}>
                  Se ha abierto una nueva pestaña con la copia para el colaborador. Cuando termines de imprimirla y cierres esa pestaña, presiona el botón para continuar con RR.HH.
                </p>
                <button onClick={continueDualPrint} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.3)' }}>
                  Imprimir Copia RR.HH. <ArrowRight size={20} style={{ marginLeft: '8px' }} />
                </button>
              </>
            )}

            {printStage === 2 && (
              <>
                <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', marginBottom: '16px' }}>Copia de RR.HH.</h2>
                <p style={{ color: '#64748b', fontSize: '15px', marginBottom: '32px', lineHeight: '1.6' }}>
                  Se ha abierto la pestaña con la copia oficial para el archivo de Recursos Humanos. El proceso ha finalizado correctamente.
                </p>
                <button onClick={finishDualPrint} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.3)' }}>
                  <CheckCircle2 size={20} style={{ marginRight: '8px' }} /> Finalizar y Volver
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        .premium-print-dual {
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(124, 58, 237, 0.3);
          transition: all 0.2s ease;
        }
        .premium-print-dual:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(124, 58, 237, 0.4);
        }
        .premium-print-single {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 10px 20px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .premium-print-single:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>

    </div>
  );
};

export default ContractPreview;
