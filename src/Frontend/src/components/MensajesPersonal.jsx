import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MessageSquare, Mail, Smartphone, Search, Filter, Loader2, CheckCircle2, X, Send, ChevronLeft, ChevronRight, MoreVertical } from 'lucide-react';

const API_URL = 'http://localhost:5051/api';

export default function MensajesPersonal() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // all, whatsapp, email, app
  const [toastMessage, setToastMessage] = useState(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [msgTitle, setMsgTitle] = useState('');
  const [msgBody, setMsgBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  // WhatsApp Modal states
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [selectedWhatsAppEmp, setSelectedWhatsAppEmp] = useState(null);
  const [wpCustomMessage, setWpCustomMessage] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${API_URL}/Employee`);
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
      } else {
        console.error("Error fetching employees");
      }
    } catch (e) {
      console.error("Fetch error", e);
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsApp = (emp) => {
    setSelectedWhatsAppEmp(emp);
    setWpCustomMessage(''); // Reset the custom part
    setIsWhatsAppModalOpen(true);
  };

  const sendWhatsAppMessage = () => {
    if (!selectedWhatsAppEmp) return;
    
    let cleanPhone = selectedWhatsAppEmp.phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length === 9) {
      cleanPhone = '51' + cleanPhone;
    }
    
    // Default greeting + custom message
    const defaultGreeting = `Hola ${selectedWhatsAppEmp.fullName.split(' ')[0]},\nTe contactamos del área de Recursos Humanos de Chavín.\n\n`;
    const finalMessage = defaultGreeting + wpCustomMessage;
    
    const encodedMessage = encodeURIComponent(finalMessage);
    window.open(`https://wa.me/${cleanPhone}?text=${encodedMessage}`, '_blank');
    setIsWhatsAppModalOpen(false);
  };

  const handleEmail = (email) => {
    window.open(`mailto:${email}`, '_blank');
  };

  const handleAppMessage = (emp) => {
    setSelectedEmployee(emp);
    setMsgTitle('');
    setMsgBody('');
    setIsModalOpen(true);
  };

  const sendAppMessage = async () => {
    if (!msgTitle.trim() || !msgBody.trim()) return;
    setIsSending(true);
    try {
      const response = await fetch(`${API_URL}/AppNotification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeDni: selectedEmployee.dni,
          title: msgTitle,
          message: msgBody
        })
      });
      if (response.ok) {
        setIsModalOpen(false);
        setToastMessage(`Notificación enviada a ${selectedEmployee.fullName}`);
        setTimeout(() => setToastMessage(null), 3000);
      } else {
        alert('Error al enviar la notificación');
      }
    } catch (error) {
      console.error(error);
      alert('Error de conexión al enviar');
    } finally {
      setIsSending(false);
    }
  };
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = (emp.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (emp.dni || '').includes(searchTerm);
    if (!matchesSearch) return false;

    if (filter === 'whatsapp') return !!emp.phone;
    if (filter === 'email') return !!emp.email;
    if (filter === 'app') return emp.hasAppAccount;
    return true;
  });

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const currentEmployees = filteredEmployees.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Reset page when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filter]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b' }}>
        <Loader2 size={40} className="animate-spin" style={{ marginBottom: '16px', color: '#3b82f6' }} />
        <h2>Cargando personal...</h2>
      </div>
    );
  }

  return (
    <div className="view-container animate-fade" style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {toastMessage && (
        <div style={{ position: 'fixed', top: '24px', right: '24px', background: '#10b981', color: 'white', padding: '16px 24px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4)', zIndex: 1000 }} className="animate-fade">
          <CheckCircle2 size={20} />
          <span style={{ fontWeight: '600' }}>{toastMessage}</span>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '32px', color: '#1e293b', marginBottom: '8px', fontWeight: '800', letterSpacing: '-0.5px' }}>
            Mensajes a Personal
          </h1>
          <p style={{ color: '#64748b', fontSize: '16px' }}>
            Comunícate directamente con los colaboradores a través de sus canales disponibles.
          </p>
        </div>
      </div>

      <div className="hr-card" style={{ padding: '24px', marginBottom: '32px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '300px', position: 'relative' }}>
          <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input 
            type="text" 
            placeholder="Buscar por nombre o DNI..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '14px 14px 14px 48px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '15px', outline: 'none' }}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '8px', background: '#f8fafc', padding: '6px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <button 
            onClick={() => setFilter('all')}
            style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: filter === 'all' ? 'white' : 'transparent', color: filter === 'all' ? '#0f172a' : '#64748b', fontWeight: filter === 'all' ? '600' : '500', boxShadow: filter === 'all' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', cursor: 'pointer' }}
          >
            Todos
          </button>
          <button 
            onClick={() => setFilter('whatsapp')}
            style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: filter === 'whatsapp' ? 'white' : 'transparent', color: filter === 'whatsapp' ? '#22c55e' : '#64748b', fontWeight: filter === 'whatsapp' ? '600' : '500', boxShadow: filter === 'whatsapp' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <MessageSquare size={16} /> WhatsApp
          </button>
          <button 
            onClick={() => setFilter('email')}
            style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: filter === 'email' ? 'white' : 'transparent', color: filter === 'email' ? '#3b82f6' : '#64748b', fontWeight: filter === 'email' ? '600' : '500', boxShadow: filter === 'email' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Mail size={16} /> Email
          </button>
          <button 
            onClick={() => setFilter('app')}
            style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: filter === 'app' ? 'white' : 'transparent', color: filter === 'app' ? '#8b5cf6' : '#64748b', fontWeight: filter === 'app' ? '600' : '500', boxShadow: filter === 'app' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Smartphone size={16} /> App RH
          </button>
        </div>
      </div>

      <div className="hr-card" style={{ padding: '0', overflowX: 'auto' }}>
        <table className="premium-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', minWidth: '220px' }}>Colaborador</th>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>DNI</th>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Teléfono</th>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Correo</th>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cuenta App</th>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', minWidth: '280px' }}>Canales de Comunicación</th>
              <th style={{ padding: '16px 24px', textAlign: 'center', width: '60px' }}></th>
            </tr>
          </thead>
          <tbody>
            {currentEmployees.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                  No se encontraron colaboradores.
                </td>
              </tr>
            ) : (
              currentEmployees.map(emp => {
                const initials = emp.fullName ? emp.fullName.substring(0, 2).toUpperCase() : '??';
                // Simple color hash based on name
                const colors = ['#e0e7ff', '#fce7f3', '#ffedd5', '#dcfce7', '#f3e8ff'];
                const textColors = ['#3730a3', '#9d174d', '#c2410c', '#166534', '#6b21a8'];
                const colorIndex = emp.fullName ? emp.fullName.length % colors.length : 0;
                
                return (
                  <tr key={emp.id} style={{ borderBottom: '1px solid #f1f5f9', background: 'white' }}>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: colors[colorIndex], color: textColors[colorIndex], display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '14px' }}>
                          {initials}
                        </div>
                        <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '14px', textTransform: 'uppercase' }}>
                          {emp.fullName}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#475569' }}>
                        {emp.dni}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '13px', color: emp.phone ? '#475569' : '#94a3b8', fontWeight: '500' }}>
                      {emp.phone || 'No registrado'}
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '13px', color: emp.email ? '#475569' : '#94a3b8', fontWeight: '500' }}>
                      {emp.email || 'No registrado'}
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{ padding: '6px 16px', background: emp.hasAppAccount ? '#dcfce7' : '#f1f5f9', borderRadius: '20px', fontSize: '12px', fontWeight: '700', color: emp.hasAppAccount ? '#16a34a' : '#94a3b8' }}>
                        {emp.hasAppAccount ? 'Sí' : 'No'}
                      </span>
                    </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      
                      <button 
                        onClick={() => handleWhatsApp(emp)}
                        disabled={!emp.phone}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                          padding: '6px 14px', borderRadius: '20px', border: '1px solid', cursor: emp.phone ? 'pointer' : 'not-allowed',
                          borderColor: emp.phone ? '#bbf7d0' : '#e2e8f0',
                          background: emp.phone ? '#f0fdf4' : '#f8fafc',
                          color: emp.phone ? '#16a34a' : '#94a3b8',
                          fontWeight: '600', fontSize: '12px',
                          transition: 'all 0.2s'
                        }}
                        title={emp.phone ? `Enviar WhatsApp al ${emp.phone}` : 'No tiene teléfono registrado'}
                        onMouseOver={(e) => emp.phone && (e.currentTarget.style.background = '#dcfce7')}
                        onMouseOut={(e) => emp.phone && (e.currentTarget.style.background = '#f0fdf4')}
                      >
                        <MessageSquare size={14} /> WhatsApp
                      </button>

                      <button 
                        onClick={() => handleEmail(emp.email)}
                        disabled={!emp.email}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                          padding: '6px 14px', borderRadius: '20px', border: '1px solid', cursor: emp.email ? 'pointer' : 'not-allowed',
                          borderColor: emp.email ? '#bfdbfe' : '#e2e8f0',
                          background: emp.email ? '#eff6ff' : '#f8fafc',
                          color: emp.email ? '#2563eb' : '#94a3b8',
                          fontWeight: '600', fontSize: '12px',
                          transition: 'all 0.2s'
                        }}
                        title={emp.email ? `Enviar correo a ${emp.email}` : 'No tiene correo registrado'}
                        onMouseOver={(e) => emp.email && (e.currentTarget.style.background = '#dbeafe')}
                        onMouseOut={(e) => emp.email && (e.currentTarget.style.background = '#eff6ff')}
                      >
                        <Mail size={14} /> Correo
                      </button>

                      <button 
                        onClick={() => handleAppMessage(emp)}
                        disabled={!emp.hasAppAccount}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                          padding: '6px 14px', borderRadius: '20px', border: '1px solid', cursor: emp.hasAppAccount ? 'pointer' : 'not-allowed',
                          borderColor: emp.hasAppAccount ? '#e9d5ff' : '#e2e8f0',
                          background: emp.hasAppAccount ? '#faf5ff' : '#f8fafc',
                          color: emp.hasAppAccount ? '#9333ea' : '#94a3b8',
                          fontWeight: '600', fontSize: '12px',
                          transition: 'all 0.2s'
                        }}
                        title={emp.hasAppAccount ? 'Enviar notificación a la app' : 'No tiene cuenta en la App'}
                        onMouseOver={(e) => emp.hasAppAccount && (e.currentTarget.style.background = '#f3e8ff')}
                        onMouseOut={(e) => emp.hasAppAccount && (e.currentTarget.style.background = '#faf5ff')}
                      >
                        <Smartphone size={14} /> App
                      </button>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                    <button style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px', borderRadius: '50%', transition: 'all 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = '#f1f5f9'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                      <MoreVertical size={20} />
                    </button>
                  </td>
                </tr>
              );
            })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', padding: '0 8px' }}>
          <p style={{ color: '#64748b', fontSize: '14px' }}>
            Mostrando <strong style={{ color: '#1e293b' }}>{((currentPage - 1) * itemsPerPage) + 1}</strong> a <strong style={{ color: '#1e293b' }}>{Math.min(currentPage * itemsPerPage, filteredEmployees.length)}</strong> de <strong style={{ color: '#1e293b' }}>{filteredEmployees.length}</strong> resultados
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', color: currentPage === 1 ? '#cbd5e1' : '#475569', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontWeight: '500' }}
            >
              <ChevronLeft size={16} /> Anterior
            </button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  style={{
                    width: '32px', height: '32px', borderRadius: '8px', border: 'none',
                    background: currentPage === i + 1 ? '#3b82f6' : 'transparent',
                    color: currentPage === i + 1 ? 'white' : '#64748b',
                    fontWeight: currentPage === i + 1 ? '600' : '500',
                    cursor: 'pointer'
                  }}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', color: currentPage === totalPages ? '#cbd5e1' : '#475569', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontWeight: '500' }}
            >
              Siguiente <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {isModalOpen && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, transition: 'all 0.3s ease' }} className="animate-fade">
          <div style={{ background: 'white', borderRadius: '24px', width: '90%', maxWidth: '480px', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255,255,255,0.2)' }}>
            
            {/* Cabecera del Modal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Smartphone size={24} color="#3b82f6" />
                </div>
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.5px', marginBottom: '4px' }}>Notificación Móvil</h3>
                  <p style={{ fontSize: '13px', color: '#64748b' }}>
                    Para: <strong style={{ color: '#3b82f6' }}>{selectedEmployee?.fullName}</strong>
                  </p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ background: '#f1f5f9', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', color: '#64748b', transition: 'all 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = '#e2e8f0'} onMouseOut={(e) => e.currentTarget.style.background = '#f1f5f9'}>
                <X size={18} />
              </button>
            </div>

            {/* Inputs */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Título del mensaje</label>
              <input 
                type="text" 
                value={msgTitle}
                onChange={(e) => setMsgTitle(e.target.value)}
                placeholder="Ej. Nueva Boleta Disponible"
                style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '15px', color: '#0f172a', outline: 'none', transition: 'all 0.2s' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.15)'; e.currentTarget.style.background = 'white'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = '#f8fafc'; }}
              />
            </div>

            <div style={{ marginBottom: '32px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Cuerpo del mensaje</label>
              <textarea 
                value={msgBody}
                onChange={(e) => setMsgBody(e.target.value)}
                placeholder="Escribe el mensaje detallado aquí..."
                rows={4}
                style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '15px', color: '#0f172a', outline: 'none', resize: 'none', transition: 'all 0.2s', fontFamily: 'inherit' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.15)'; e.currentTarget.style.background = 'white'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = '#f8fafc'; }}
              />
            </div>

            {/* Footer Buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => setIsModalOpen(false)}
                style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', color: '#475569', fontWeight: '600', fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseOver={(e) => e.currentTarget.style.background = '#f8fafc'}
                onMouseOut={(e) => e.currentTarget.style.background = 'white'}
              >
                Cancelar
              </button>
              <button 
                onClick={sendAppMessage}
                disabled={isSending || !msgTitle.trim() || !msgBody.trim()}
                style={{ flex: 2, padding: '14px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', fontWeight: '600', fontSize: '15px', cursor: (isSending || !msgTitle.trim() || !msgBody.trim()) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: (isSending || !msgTitle.trim() || !msgBody.trim()) ? 0.6 : 1, transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)' }}
                onMouseOver={(e) => !(isSending || !msgTitle.trim() || !msgBody.trim()) && (e.currentTarget.style.transform = 'translateY(-2px)', e.currentTarget.style.boxShadow = '0 6px 16px rgba(37, 99, 235, 0.4)')}
                onMouseOut={(e) => !(isSending || !msgTitle.trim() || !msgBody.trim()) && (e.currentTarget.style.transform = 'translateY(0)', e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.3)')}
              >
                {isSending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                Enviar a la App
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* ═══ WHATSAPP MODAL ═══ */}
      {isWhatsAppModalOpen && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, transition: 'all 0.3s ease' }} className="animate-fade">
          <div style={{ background: 'white', borderRadius: '24px', width: '90%', maxWidth: '480px', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255,255,255,0.2)' }}>
            
            {/* Cabecera del Modal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MessageSquare size={24} color="#16a34a" />
                </div>
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.5px', marginBottom: '4px' }}>Mensaje por WhatsApp</h3>
                  <p style={{ fontSize: '13px', color: '#64748b' }}>
                    Para: <strong style={{ color: '#16a34a' }}>{selectedWhatsAppEmp?.fullName}</strong>
                  </p>
                </div>
              </div>
              <button onClick={() => setIsWhatsAppModalOpen(false)} style={{ background: '#f1f5f9', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', color: '#64748b', transition: 'all 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = '#e2e8f0'} onMouseOut={(e) => e.currentTarget.style.background = '#f1f5f9'}>
                <X size={18} />
              </button>
            </div>

            {/* Default Message Preview */}
            <div style={{ marginBottom: '16px', padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#475569', fontSize: '14px', fontStyle: 'italic' }}>
              "Hola {selectedWhatsAppEmp?.fullName.split(' ')[0]},<br/>
              Te contactamos del área de Recursos Humanos de Chavín."
            </div>

            {/* Inputs */}
            <div style={{ marginBottom: '32px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Tu mensaje adicional</label>
              <textarea 
                value={wpCustomMessage}
                onChange={(e) => setWpCustomMessage(e.target.value)}
                placeholder="Escribe lo que deseas comunicarle..."
                rows={4}
                style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '15px', color: '#0f172a', outline: 'none', resize: 'none', transition: 'all 0.2s', fontFamily: 'inherit' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#22c55e'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(34, 197, 94, 0.15)'; e.currentTarget.style.background = 'white'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = '#f8fafc'; }}
              />
            </div>

            {/* Footer Buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => setIsWhatsAppModalOpen(false)}
                style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', color: '#475569', fontWeight: '600', fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseOver={(e) => e.currentTarget.style.background = '#f8fafc'}
                onMouseOut={(e) => e.currentTarget.style.background = 'white'}
              >
                Cancelar
              </button>
              <button 
                onClick={sendWhatsAppMessage}
                disabled={!wpCustomMessage.trim()}
                style={{ flex: 2, padding: '14px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: 'white', fontWeight: '600', fontSize: '15px', cursor: !wpCustomMessage.trim() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: !wpCustomMessage.trim() ? 0.6 : 1, transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)' }}
                onMouseOver={(e) => wpCustomMessage.trim() && (e.currentTarget.style.transform = 'translateY(-2px)', e.currentTarget.style.boxShadow = '0 6px 16px rgba(34, 197, 94, 0.4)')}
                onMouseOut={(e) => wpCustomMessage.trim() && (e.currentTarget.style.transform = 'translateY(0)', e.currentTarget.style.boxShadow = '0 4px 12px rgba(34, 197, 94, 0.3)')}
              >
                <Send size={20} />
                Ir a WhatsApp
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
