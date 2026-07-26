import { useState, useEffect } from 'react';
import { ArrowLeft, Clock, Search, Eye, Filter, UserCheck, CheckCircle, Trash2, ShieldCheck, Users, AlertTriangle, X } from 'lucide-react';

const API_URL = 'http://127.0.0.1:5051/api';

export default function ProcessList({ onSelectProcess, onBack }) {
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMainTab, setActiveMainTab] = useState('campo');
  const [activeAppSubTab, setActiveAppSubTab] = useState('nuevos');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const procRes = await fetch(`${API_URL}/Process/pending`);
        if (procRes.ok) {
          const data = await procRes.json();
          setProcesses(data);
        }
      } catch (error) {
        console.error("Error fetching data", error);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  const confirmDelete = (id) => {
    setDeleteModal({ isOpen: true, id });
  };

  const executeDelete = async () => {
    const { id } = deleteModal;
    if (!id) return;
    
    try {
      const res = await fetch(`${API_URL}/Process/${id}`, { method: 'DELETE' });
      
      if (res.ok) {
        setProcesses(prev => prev.filter(p => p.id !== id));
        setDeleteModal({ isOpen: false, id: null });
      } else {
        alert("Error al eliminar el registro.");
      }
    } catch (e) {
      alert("Error de conexión al eliminar.");
    }
  };

  const displayProcesses = () => {
    if (activeMainTab === 'campo') return processes;
    if (activeAppSubTab === 'nuevos') return processes.filter(p => !p.hasAppAccount);
    return processes.filter(p => p.hasAppAccount);
  };

  const currentProcesses = displayProcesses();

  const getEmptyStateMessage = () => {
    if (activeMainTab === 'campo') return "No hay procesos pendientes de validación en este momento. Cuando el personal de campo suba nuevos documentos, aparecerán aquí.";
    if (activeAppSubTab === 'nuevos') return "Cuando un usuario nuevo envíe sus datos desde la app móvil, aparecerán aquí para revisión.";
    return "No hay solicitudes pendientes de usuarios con cuenta registrada.";
  };

  return (
    <div className="process-list-container animate-fade">
      <div className="hr-header" style={{ marginBottom: '24px' }}>
        <div className="hr-title-group">
          <div className="icon-box-blue"><UserCheck size={32} /></div>
          <div>
            <h1>Bandeja de Pendientes</h1>
            <p>Lista de capturas de usuarios esperando validación de RR.HH.</p>
          </div>
        </div>
        <button onClick={onBack} className="btn-outline">
          <ArrowLeft size={16} /> Volver
        </button>
      </div>

      {/* ═══ TABS DE NAVEGACIÓN ═══ */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '2px' }}>
          <button
            onClick={() => setActiveMainTab('campo')}
            style={{ padding: '12px 16px', background: 'none', border: 'none', borderBottom: activeMainTab === 'campo' ? '3px solid #3b82f6' : '3px solid transparent', color: activeMainTab === 'campo' ? '#3b82f6' : '#64748b', fontWeight: activeMainTab === 'campo' ? '700' : '600', fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Users size={18} />
            Pendientes (Campo)
          </button>
          <button
            onClick={() => setActiveMainTab('app')}
            style={{ padding: '12px 16px', background: 'none', border: 'none', borderBottom: activeMainTab === 'app' ? '3px solid #10b981' : '3px solid transparent', color: activeMainTab === 'app' ? '#10b981' : '#64748b', fontWeight: activeMainTab === 'app' ? '700' : '600', fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <ShieldCheck size={18} />
            Documentos desde App
          </button>
        </div>

        {activeMainTab === 'app' && (
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px', padding: '0 8px', animation: 'fadeIn 0.2s ease-out' }}>
            <button
              onClick={() => setActiveAppSubTab('nuevos')}
              style={{ padding: '8px 16px', borderRadius: '20px', border: '1px solid', borderColor: activeAppSubTab === 'nuevos' ? '#10b981' : '#e2e8f0', background: activeAppSubTab === 'nuevos' ? '#ecfdf5' : '#f8fafc', color: activeAppSubTab === 'nuevos' ? '#047857' : '#64748b', fontWeight: '600', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              ✨ Nuevos sin Cuenta
            </button>
            <button
              onClick={() => setActiveAppSubTab('registrados')}
              style={{ padding: '8px 16px', borderRadius: '20px', border: '1px solid', borderColor: activeAppSubTab === 'registrados' ? '#3b82f6' : '#e2e8f0', background: activeAppSubTab === 'registrados' ? '#eff6ff' : '#f8fafc', color: activeAppSubTab === 'registrados' ? '#1d4ed8' : '#64748b', fontWeight: '600', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              🔑 Con Cuenta Registrada
            </button>
          </div>
        )}
      </div>

      <div className="hr-card flex-col">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: '#ffffff', padding: '12px 20px', borderRadius: '16px', width: '100%', maxWidth: '400px', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
            <Search size={20} color="#94a3b8" />
            <input type="text" placeholder="Buscar por ID o Nombre..." style={{ border: 'none', background: 'transparent', outline: 'none', marginLeft: '12px', width: '100%', fontSize: '15px', color: '#1e293b' }} />
          </div>
          <button style={{ background: '#ffffff', border: '1px solid #e2e8f0', color: '#475569', padding: '12px 24px', borderRadius: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: '600', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#1e293b'; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#475569'; }}>
            <Filter size={18} /> Filtrar
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center p-10"><div className="spinner"></div></div>
        ) : currentProcesses.length === 0 ? (
          <div style={{ background: 'white', borderRadius: '24px', padding: '60px 20px', textAlign: 'center', border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 20px 40px rgba(0,0,0,0.02)' }}>
            <div style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: '#16a34a', boxShadow: 'inset 0 4px 6px rgba(255,255,255,0.5), 0 10px 25px rgba(22, 163, 74, 0.15)' }}>
              <CheckCircle size={40} />
            </div>
            <h3 style={{ fontSize: '24px', color: '#1e293b', fontWeight: '700', marginBottom: '12px' }}>¡Todo al día!</h3>
            <p style={{ fontSize: '16px', color: '#64748b', maxWidth: '400px', margin: '0 auto', lineHeight: '1.5' }}>
              {getEmptyStateMessage()}
            </p>
          </div>
        ) : (
          <div className="table-responsive" style={{ overflowX: 'auto', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <table className="w-full text-left border-collapse" style={{ width: '100%', minWidth: '800px' }}>
              <thead style={{ background: '#f8fafc' }}>
                <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                  <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ID Solicitud</th>
                  <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fecha y Hora</th>
                  <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Postulante</th>
                  <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estado</th>
                  <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {currentProcesses.map((proc) => (
                  <tr key={proc.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: '20px 24px', fontWeight: '600', color: '#3b82f6', fontSize: '14px' }}>#{proc.id.substring(0, 8)}...</td>
                    <td style={{ padding: '20px 24px', color: '#475569', fontSize: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Clock size={16} color="#94a3b8" />
                        {new Date(proc.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                      </div>
                    </td>
                    <td style={{ padding: '20px 24px', color: '#1e293b', fontWeight: '500', fontSize: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px' }}>
                          {proc.nombres?.charAt(0) || ''}{proc.apellidoPaterno?.charAt(0) || ''}
                        </div>
                        {proc.nombres} {proc.apellidoPaterno}
                      </div>
                    </td>
                    <td style={{ padding: '20px 24px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#fffbeb', color: '#d97706', borderRadius: '20px', fontSize: '13px', fontWeight: '600' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#d97706' }}></span>
                        Pendiente
                      </span>
                    </td>
                    <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => confirmDelete(proc.id)}
                          style={{ background: 'white', color: '#ef4444', border: '1px solid #ef4444', padding: '10px 16px', borderRadius: '12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '600', transition: 'all 0.2s ease' }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#fef2f2'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; }}
                        >
                          <Trash2 size={16} /> Eliminar
                        </button>
                        <button
                          onClick={() => onSelectProcess(proc.id)}
                          style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', boxShadow: '0 4px 10px rgba(37, 99, 235, 0.2)', transition: 'all 0.2s ease' }}
                          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 15px rgba(37, 99, 235, 0.3)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 10px rgba(37, 99, 235, 0.2)'; }}
                        >
                          <Eye size={16} /> Revisar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {deleteModal.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s ease-out' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '32px', width: '90%', maxWidth: '420px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '28px', backgroundColor: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', border: '4px solid #fff1f2' }}>
                <AlertTriangle size={28} />
              </div>
              <button onClick={() => setDeleteModal({ isOpen: false, id: null })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px', display: 'flex', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#1e293b'} onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}>
                <X size={24} />
              </button>
            </div>
            
            <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', marginBottom: '12px' }}>Eliminar registro</h3>
            <p style={{ fontSize: '15px', color: '#64748b', marginBottom: '32px', lineHeight: '1.6' }}>
              ¿Estás seguro de que deseas eliminar permanentemente esta solicitud? Esta acción no se puede deshacer y borrará todos los datos asociados.
            </p>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => setDeleteModal({ isOpen: false, id: null })}
                style={{ flex: 1, padding: '14px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', color: '#475569', fontSize: '15px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
              >
                Cancelar
              </button>
              <button 
                onClick={executeDelete}
                style={{ flex: 1, padding: '14px', background: '#ef4444', border: 'none', borderRadius: '14px', color: 'white', fontSize: '15px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#dc2626'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(239, 68, 68, 0.3)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ef4444'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.25)'; }}
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
