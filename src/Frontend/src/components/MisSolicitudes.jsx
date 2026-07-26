import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Clock, Search, Filter, CheckCircle, XCircle, FileText, ArrowLeft, MessageSquare, ShieldCheck, Zap, ArrowRight, UserCheck, CheckSquare, Settings2, Trash2, Edit2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://127.0.0.1:5051/api';

export default function MisSolicitudes() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Todos');
  
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [observations, setObservations] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultModal, setResultModal] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/EmployeeRequest/all`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (status) => {
    if (!selectedRequest) return;
    setIsSubmitting(true);
    
    try {
      const res = await fetch(`${API_URL}/EmployeeRequest/${selectedRequest.id}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: status,
          observations: observations
        })
      });
      
      if (res.ok) {
        setResultModal({ msg: `Solicitud ${status.toLowerCase()} correctamente.`, type: 'success' });
        setSelectedRequest(null);
        setObservations('');
        fetchRequests();
      } else {
        setResultModal({ msg: 'Hubo un error al procesar la solicitud.', type: 'error' });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      setResultModal({ msg: 'Error de conexión. Revisa tu internet o el servidor.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredRequests = requests.filter(req => {
    const matchesSearch = req.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          req.employeeDni?.includes(searchTerm);
    const matchesStatus = filterStatus === 'Todos' || req.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Pendiente':
        return <span className="status-badge" style={{ backgroundColor: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' }}><Clock size={14} style={{ marginRight: 4 }}/> Pendiente</span>;
      case 'Aprobado':
        return <span className="status-badge" style={{ backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}><CheckCircle size={14} style={{ marginRight: 4 }}/> Aprobado</span>;
      case 'Rechazado':
        return <span className="status-badge" style={{ backgroundColor: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}><XCircle size={14} style={{ marginRight: 4 }}/> Rechazado</span>;
      default:
        return <span className="status-badge" style={{ backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' }}>{status}</span>;
    }
  };

  const renderFormData = (formDataString) => {
    try {
      const data = JSON.parse(formDataString);
      return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {Object.entries(data).map(([key, value]) => (
            <div key={key} style={{ backgroundColor: '#ffffff', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
              <p style={{ color: '#64748b', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px 0' }}>
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </p>
              <p style={{ color: '#0f172a', fontSize: '15px', fontWeight: '500', margin: 0, wordBreak: 'break-word' }}>
                {value || '-'}
              </p>
            </div>
          ))}
        </div>
      );
    } catch (e) {
      return (
        <pre style={{ color: '#334155', fontSize: '14px', margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'monospace', lineHeight: '1.6' }}>
          {formDataString}
        </pre>
      );
    }
  };

  return (
    <div className="dashboard-content animate-fade">
      
      {/* BANNER HEADER */}
      <div className="module-card blue-card" style={{ marginBottom: '32px', minHeight: 'auto', padding: '32px 40px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="card-swoosh dark-blue-swoosh" style={{ width: '300px', height: '300px', top: '-100px', left: '-50px' }}></div>
        
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '16px', borderRadius: '16px', backdropFilter: 'blur(10px)' }}>
             <FileText size={40} color="#ffffff" />
          </div>
          <div>
            <h2 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>Gestión de Solicitudes</h2>
            <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.9)', margin: 0, maxWidth: '600px', lineHeight: '1.5' }}>
              Revisa, aprueba o rechaza las peticiones enviadas por los colaboradores desde la App Móvil. Notificaremos a sus celulares al instante.
            </p>
          </div>
        </div>

        {/* Decorative elements on the right instead of the broken card-right class */}
        <div style={{ position: 'absolute', right: '-20px', top: '-50px', opacity: 0.1, transform: 'rotate(15deg)' }}>
           <FileText size={250} color="#ffffff" />
        </div>
      </div>

      {/* DASHBOARD CARDS */}
      <div className="features-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
        
        <div className="feature-item" style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div className="feature-icon-wrapper yellow" style={{ margin: 0 }}>
            <Clock size={28} />
          </div>
          <div className="feature-text">
            <p style={{ color: '#64748b', fontSize: '14px', fontWeight: '500', margin: '0 0 4px 0' }}>Pendientes</p>
            <h3 style={{ color: '#0f172a', fontSize: '28px', fontWeight: '800', margin: 0 }}>{requests.filter(r => r.status === 'Pendiente').length}</h3>
          </div>
        </div>

        <div className="feature-item" style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div className="feature-icon-wrapper green" style={{ margin: 0 }}>
            <CheckCircle size={28} />
          </div>
          <div className="feature-text">
            <p style={{ color: '#64748b', fontSize: '14px', fontWeight: '500', margin: '0 0 4px 0' }}>Aprobadas</p>
            <h3 style={{ color: '#0f172a', fontSize: '28px', fontWeight: '800', margin: 0 }}>{requests.filter(r => r.status === 'Aprobado').length}</h3>
          </div>
        </div>

        <div className="feature-item" style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div className="feature-icon-wrapper dark" style={{ margin: 0, backgroundColor: '#fee2e2', color: '#ef4444' }}>
            <XCircle size={28} />
          </div>
          <div className="feature-text">
            <p style={{ color: '#64748b', fontSize: '14px', fontWeight: '500', margin: '0 0 4px 0' }}>Rechazadas</p>
            <h3 style={{ color: '#0f172a', fontSize: '28px', fontWeight: '800', margin: 0 }}>{requests.filter(r => r.status === 'Rechazado').length}</h3>
          </div>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        
        {/* FILTERS */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '16px', backgroundColor: '#f8fafc', alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input 
              type="text" 
              placeholder="Buscar por DNI o Nombre del colaborador..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '12px 16px 12px 44px', borderRadius: '10px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '14px', outline: 'none', transition: 'all 0.2s' }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
            />
          </div>
          
          <div style={{ position: 'relative' }}>
            <Filter size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ padding: '12px 40px 12px 40px', borderRadius: '10px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '14px', outline: 'none', cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none', minWidth: '180px' }}
            >
              <option value="Todos">Todos los Estados</option>
              <option value="Pendiente">Pendientes</option>
              <option value="Aprobado">Aprobados</option>
              <option value="Rechazado">Rechazados</option>
            </select>
            <Settings2 size={16} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
          </div>
        </div>

        {/* TABLE */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#ffffff', color: '#64748b', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fecha</th>
                <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Colaborador</th>
                <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>DNI</th>
                <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tipo de Solicitud</th>
                <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estado</th>
                <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Cargando solicitudes...</td></tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                       <FileText size={48} color="#cbd5e1" />
                       <p style={{ fontSize: '16px', margin: 0, fontWeight: '500' }}>No hay solicitudes para mostrar.</p>
                       <p style={{ fontSize: '14px', margin: 0 }}>Intenta cambiar los filtros de búsqueda.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRequests.map(req => (
                  <tr key={req.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: '16px 24px', color: '#64748b', fontSize: '14px' }}>{new Date(req.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding: '16px 24px', color: '#0f172a', fontWeight: '600', fontSize: '15px' }}>{req.employeeName}</td>
                    <td style={{ padding: '16px 24px', color: '#64748b', fontSize: '14px', fontFamily: 'monospace' }}>{req.employeeDni}</td>
                    <td style={{ padding: '16px 24px', color: '#3b82f6', fontWeight: '500', fontSize: '14px' }}>{req.type}</td>
                    <td style={{ padding: '16px 24px' }}>{getStatusBadge(req.status)}</td>
                    <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                      <button 
                        onClick={() => { setSelectedRequest(req); setObservations(req.observations || ''); }}
                        className="primary-btn"
                        style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#2563eb'; e.currentTarget.style.color = '#ffffff'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#eff6ff'; e.currentTarget.style.color = '#2563eb'; }}
                      >
                        <FileText size={16} /> Revisar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* LIGHT THEME MODAL */}
      {selectedRequest && createPortal(
        <div className="fullscreen-modal-overlay animate-fade" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999999, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)', padding: '40px 20px' }}>
          <div style={{ width: '100%', maxWidth: '700px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)' }}>
            
            {/* Modal Header */}
            <div style={{ padding: '24px 32px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ backgroundColor: '#e0e7ff', padding: '10px', borderRadius: '12px' }}>
                  <FileText size={24} color="#4f46e5" />
                </div>
                <div>
                  <h2 style={{ color: '#0f172a', margin: 0, fontSize: '20px', fontWeight: '700' }}>Revisión de Solicitud</h2>
                  <p style={{ color: '#64748b', margin: '4px 0 0 0', fontSize: '13px' }}>ID: {selectedRequest.id} • {new Date(selectedRequest.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <button onClick={() => setSelectedRequest(null)} style={{ backgroundColor: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '8px', borderRadius: '50%', transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                <XCircle size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '32px', overflowY: 'auto', flex: 1 }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '28px' }}>
                <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <UserCheck size={16} color="#64748b" />
                    <p style={{ color: '#64748b', fontSize: '13px', fontWeight: '600', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Colaborador</p>
                  </div>
                  <p style={{ color: '#0f172a', fontWeight: '700', fontSize: '16px', margin: '0 0 4px 0' }}>{selectedRequest.employeeName}</p>
                  <p style={{ color: '#64748b', fontSize: '14px', margin: 0, fontFamily: 'monospace' }}>DNI: {selectedRequest.employeeDni}</p>
                </div>
                <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <FileText size={16} color="#64748b" />
                    <p style={{ color: '#64748b', fontSize: '13px', fontWeight: '600', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Trámite</p>
                  </div>
                  <p style={{ color: '#2563eb', fontWeight: '700', fontSize: '16px', margin: '0 0 4px 0' }}>{selectedRequest.type}</p>
                  <div style={{ marginTop: '4px' }}>{getStatusBadge(selectedRequest.status)}</div>
                </div>
              </div>

              {selectedRequest.formData && (
                <div style={{ marginBottom: '28px' }}>
                  <h3 style={{ color: '#0f172a', fontSize: '15px', fontWeight: '700', margin: '0 0 12px 0' }}>Datos enviados por el colaborador:</h3>
                  <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    {renderFormData(selectedRequest.formData)}
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '8px' }}>
                <label style={{ color: '#0f172a', fontSize: '15px', fontWeight: '700', display: 'block', marginBottom: '12px' }}>
                  Respuesta / Observaciones de RR.HH.
                </label>
                <textarea 
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder="Escribe el motivo del rechazo o detalles de la aprobación (opcional)..."
                  disabled={selectedRequest.status !== 'Pendiente'}
                  style={{ 
                    width: '100%', height: '120px', padding: '16px', borderRadius: '12px', 
                    backgroundColor: selectedRequest.status === 'Pendiente' ? '#ffffff' : '#f8fafc', 
                    border: '1px solid #cbd5e1', 
                    color: '#1e293b', resize: 'none', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s',
                    boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.03)'
                  }}
                  onFocus={(e) => { if (selectedRequest.status === 'Pendiente') e.target.style.borderColor = '#3b82f6'; }}
                  onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                />
              </div>

            </div>
            
            {/* Modal Footer */}
            <div style={{ padding: '20px 32px', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              
              <div>
                {selectedRequest.status === 'Aprobado' && (
                  <button 
                    onClick={() => {
                      navigate('/personal', { state: { editEmployeeDni: selectedRequest.employeeDni } });
                    }}
                    style={{ padding: '12px 24px', borderRadius: '10px', border: '1px solid #3b82f6', color: '#3b82f6', backgroundColor: '#eff6ff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '14px', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(59, 130, 246, 0.1)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#3b82f6'; e.currentTarget.style.color = '#ffffff'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#eff6ff'; e.currentTarget.style.color = '#3b82f6'; }}
                  >
                    <Edit2 size={18} /> Comenzar Trámite
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                {selectedRequest.status === 'Pendiente' ? (
                  <>
                    <button 
                    disabled={isSubmitting}
                    onClick={() => handleUpdateStatus('Rechazado')}
                    style={{ padding: '12px 24px', borderRadius: '10px', border: '1px solid #fecaca', color: '#ef4444', backgroundColor: '#fef2f2', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', fontSize: '14px', transition: 'all 0.2s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#ef4444'; e.currentTarget.style.color = '#ffffff'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fef2f2'; e.currentTarget.style.color = '#ef4444'; }}
                  >
                    <XCircle size={18} /> Rechazar
                  </button>
                  <button 
                    disabled={isSubmitting}
                    onClick={() => handleUpdateStatus('Aprobado')}
                    style={{ padding: '12px 24px', borderRadius: '10px', border: 'none', color: '#ffffff', backgroundColor: '#10b981', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', fontSize: '14px', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)', transition: 'all 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                  >
                    <CheckCircle size={18} /> Aprobar Solicitud
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setSelectedRequest(null)}
                  style={{ padding: '12px 24px', borderRadius: '10px', border: '1px solid #e2e8f0', color: '#475569', backgroundColor: '#ffffff', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}
                >
                  Cerrar
                </button>
              )}
            </div>
          </div>
          
        </div>
      </div>,
        document.body
      )}

      {/* RESULT MODAL PREMIUM */}
      {resultModal && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(5px)', zIndex: 9999999, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s ease-out' }}>
          <div style={{ background: 'white', padding: '32px', borderRadius: '24px', width: '90%', maxWidth: '400px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: resultModal.type === 'success' ? '#dcfce7' : '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              {resultModal.type === 'success'
                ? <CheckCircle size={32} color="#16a34a" />
                : <XCircle size={32} color="#dc2626" />
              }
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
              {resultModal.type === 'success' ? '¡Éxito!' : 'Error'}
            </h3>
            <p style={{ fontSize: '15px', color: '#64748b', marginBottom: '24px', lineHeight: '1.5' }}>
              {resultModal.msg}
            </p>
            <button
              onClick={() => setResultModal(null)}
              style={{ padding: '12px 40px', borderRadius: '12px', border: 'none', background: resultModal.type === 'success' ? '#16a34a' : '#dc2626', color: 'white', fontWeight: '700', fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', transition: 'all 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              Aceptar
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
