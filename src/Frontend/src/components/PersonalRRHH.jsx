import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useEmployees } from '../hooks/useEmployees';
import { createPortal } from 'react-dom';
import ExcelJS from 'exceljs';
import {
  Users, Search, Loader2, CheckCircle2, X, Trash2,
  UserPlus, Filter, List, Grid, User, RefreshCw,
  TrendingUp, Activity, FileText, DollarSign, ChevronLeft, ChevronRight,
  AlertTriangle, ShieldCheck, Download, ZoomIn, PenTool, Eraser, Eye, Edit2, FileSignature, Scan, Clock
} from 'lucide-react';

const API_URL = 'http://localhost:5051/api';

const drawerStyles = `
  @keyframes slideInRight {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
  }
  .drawer-enter {
    animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
`;

// ─── Reusable Input Component ───
const FormInput = ({ label, value, onChange, type = 'text', placeholder = '', required = false, disabled = false }) => (
  <div>
    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
    <input
      type={type}
      value={value || ''}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px', background: disabled ? '#f1f5f9' : '#ffffff', color: '#0f172a', transition: 'border-color 0.2s', fontFamily: 'Inter, sans-serif' }}
      onFocus={e => e.target.style.borderColor = '#3b82f6'}
      onBlur={e => e.target.style.borderColor = '#e2e8f0'}
    />
  </div>
);

// ─── Section Header ───
const SectionHeader = ({ icon, title, color = '#3b82f6' }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', paddingBottom: '10px', borderBottom: '2px solid #f1f5f9' }}>
    <span style={{ fontSize: '18px' }}>{icon}</span>
    <h3 style={{ fontSize: '14px', fontWeight: '800', color: color, textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>{title}</h3>
  </div>
);

// ─── Reusable Filter Option Component ───
const FilterOption = ({ label, value, current, onChange, icon }) => (
  <div
    onClick={() => onChange(value)}
    style={{
      flex: 1,
      padding: '10px 4px',
      textAlign: 'center',
      background: current === value ? '#eff6ff' : 'white',
      border: `1px solid ${current === value ? '#3b82f6' : '#e2e8f0'}`,
      color: current === value ? '#1d4ed8' : '#64748b',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: current === value ? '700' : '600',
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px'
    }}
  >
    <span style={{ fontSize: '16px' }}>{icon}</span>
    {label}
  </div>
);

export default function PersonalRRHH() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const hookData = useEmployees(API_URL, currentPage, itemsPerPage, searchTerm);
  const currentEmployees = hookData.items || hookData.Items || [];
  const totalItems = hookData.totalItems || hookData.TotalItems || 0;
  const totalPages = hookData.totalPages || hookData.TotalPages || 0;
  const loading = hookData.loading;
  const refreshEmployees = hookData.mutate;

  // Tabs de Filtrado
  const [activeMainTab, setActiveMainTab] = useState('regular');
  const [activeAppSubTab, setActiveAppSubTab] = useState('nuevos');

  // Edit Modal
  const [editEmployee, setEditEmployee] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editTab, setEditTab] = useState('personal');
  const [isSaving, setIsSaving] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAndOpenModal = async () => {
      if (location.state?.editEmployeeDni) {
        const dni = location.state.editEmployeeDni;
        // Limpiamos el estado inmediatamente para no causar ciclos
        navigate(location.pathname, { replace: true });
        
        let emp = currentEmployees.find(e => e.dni === dni);
        if (!emp) {
          try {
            // Fetch directo en caso de que no esté en la página actual
            const res = await fetch(`${API_URL}/Employee?searchTerm=${dni}`);
            if (res.ok) {
              const data = await res.json();
              if (data.items && data.items.length > 0) {
                emp = data.items[0];
              } else if (data.Items && data.Items.length > 0) {
                emp = data.Items[0];
              }
            }
          } catch (e) {
            console.error('Error fetching employee by DNI:', e);
          }
        }
        
        if (emp) {
          setEditEmployee(emp);
          setEditForm(emp);
          setShowManualModal(true);
        }
      }
    };
    checkAndOpenModal();
  }, [location.state, navigate, location.pathname, currentEmployees]);

  // Export Modal
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFilename, setExportFilename] = useState('Personal_Reporte');
  const [exportFilters, setExportFilters] = useState({
    pension: 'todos',
    appAccount: 'todos',
    bank: 'todos',
    phone: 'todos'
  });

  // Custom Modals
  const [confirmModal, setConfirmModal] = useState(null);
  const [resultModal, setResultModal] = useState(null);

  // New Collaborator
  const [showNewCollabMenu, setShowNewCollabMenu] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);

  // Mobile Accounts Activation
  const [showEnableAccounts, setShowEnableAccounts] = useState(false);
  const [newlyRegisteredDnis, setNewlyRegisteredDnis] = useState([]);

  // Smart Upload & Verification
  const [showSmartUpload, setShowSmartUpload] = useState(false);
  const [showSingleUpload, setShowSingleUpload] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [uploadedPairs, setUploadedPairs] = useState([]);
  const [detectedEmployees, setDetectedEmployees] = useState([]);
  const [isProcessingOcr, setIsProcessingOcr] = useState(false);
  const [ocrProgress, setOcrProgress] = useState({ current: 0, total: 0 });
  const [loadingMessageIdx, setLoadingMessageIdx] = useState(0);

  useEffect(() => {
    let interval;
    if (isProcessingOcr) {
      interval = setInterval(() => {
        setLoadingMessageIdx(prev => (prev + 1) % 4);
      }, 2500);
    } else {
      setLoadingMessageIdx(0);
    }
    return () => clearInterval(interval);
  }, [isProcessingOcr]);

  const loadingMessages = [
    "Extrayendo Información...",
    "Analizando los DNI...",
    "Procesando con IA...",
    "Capturando datos exactos..."
  ];
  const [zoomedImage, setZoomedImage] = useState(null);

  // Contract Signature Modal
  const [signEmployee, setSignEmployee] = useState(null);
  const [sigError, setSigError] = useState('');


  // Eliminamos useEffect vacío ya que useEmployees se encarga de fetchear al montar

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = () => setDropdownOpen(null);
    if (dropdownOpen) document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [dropdownOpen]);

  // fetchEmployees local eliminado, se usa refreshEmployees del hook

  const showResult = (msg, type = 'success') => {
    setResultModal({ msg, type });
  };

  const handleEditClick = (emp, readOnly = false) => {
    setEditEmployee(emp);
    setIsReadOnly(readOnly);
    setEditTab('personal');
    setEditForm({
      nombres: emp.nombres || '',
      apellidoPaterno: emp.apellidoPaterno || '',
      apellidoMaterno: emp.apellidoMaterno || '',
      dni: emp.dni || '',
      telefono: emp.phone || '',
      correoPersonal: emp.correoPersonal || '',
      correoCorporativo: emp.correoCorporativo || '',
      direccion: emp.direccion || '',
      fechaNacimiento: emp.fechaNacimiento || '',
      baseSalary: emp.baseSalary || 0,
      numeroCuenta: emp.numeroCuenta || '',
      cci: emp.cci || '',
      codigoAFP: emp.codigoAFP || '',
      contactoEmergencia: emp.contactoEmergencia || '',
      parentesco: emp.parentesco || '',
      telefonoEmergencia: emp.telefonoEmergencia || ''
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch(`${API_URL}/Employee/${editEmployee.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        showResult('Personal actualizado exitosamente', 'success');
        setEditEmployee(null);
        refreshEmployees();
      } else {
        showResult('Error al actualizar el personal', 'error');
      }
    } catch (err) {
      console.error(err);
      showResult('Error de conexión al actualizar', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (id, name) => {
    setConfirmModal({
      title: '¿Eliminar colaborador?',
      message: `Estás a punto de eliminar a "${name}". Esta acción no se puede deshacer y se eliminarán todos sus datos, contratos y boletas asociadas.`,
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      type: 'danger',
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          const res = await fetch(`${API_URL}/Employee/${id}`, { method: 'DELETE' });
          if (res.ok) {
            showResult('Colaborador eliminado correctamente', 'success');
            refreshEmployees();
          } else {
            showResult('Error al eliminar el colaborador', 'error');
          }
        } catch (err) {
          console.error(err);
          showResult('Error de conexión al eliminar', 'error');
        }
      }
    });
  };

  const handleExportExcel = async () => {
    try {
      const queryParams = new URLSearchParams({
        filename: exportFilename,
        pension: exportFilters.pension,
        appAccount: exportFilters.appAccount,
        bank: exportFilters.bank,
        phone: exportFilters.phone
      });
      const res = await fetch(`${API_URL}/Employee/export?${queryParams}`);
      if (!res.ok) throw new Error('Error al exportar');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = exportFilename.endsWith('.xlsx') ? exportFilename : `${exportFilename}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch(e) {
      console.error(e);
      showResult('Error al descargar el reporte', 'error');
    }
    setShowExportModal(false);
  };


  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b' }}>
        <Loader2 size={32} className="animate-spin" style={{ marginBottom: '16px', color: '#3b82f6' }} />
        <p>Cargando personal...</p>
      </div>
    );
  }

  // ─── Logic Functions ───

  const handleSaveManualCreation = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch(`${API_URL}/Employee`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al crear colaborador');

      setShowManualModal(false);
      setEditForm({});

      if (editForm.dni) {
        setNewlyRegisteredDnis([editForm.dni]);
        setShowEnableAccounts(true);
      } else {
        showResult('Colaborador creado exitosamente');
      }

      refreshEmployees();
    } catch (err) {
      showResult(err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotosUpload = (e) => {
    // Sort files chronologically by lastModified (when they were taken)
    const files = Array.from(e.target.files).sort((a, b) => {
      if (a.lastModified === b.lastModified) return a.name.localeCompare(b.name);
      return a.lastModified - b.lastModified;
    });

    let currentPairs = [...uploadedPairs];
    let unmatchedFiles = [];

    files.forEach(file => {
      const match = file.name.match(/(\d+)[-_]([12])/i);

      if (match) {
        const dni = match[1];
        const isFront = match[2] === '1';

        let existingPair = currentPairs.find(p => p.dni === dni);
        if (!existingPair) {
          existingPair = { id: Math.random().toString(36).substring(7), dni, front: null, back: null };
          currentPairs.push(existingPair);
        }

        if (isFront) existingPair.front = file;
        else existingPair.back = file;
      } else {
        unmatchedFiles.push(file);
      }
    });

    // Auto-pair the rest sequentially (Front, Back, Front, Back...)
    for (let i = 0; i < unmatchedFiles.length; i += 2) {
      const frontFile = unmatchedFiles[i];
      const backFile = unmatchedFiles[i + 1] || null;

      const fallbackMatch = frontFile.name.match(/(\d{8,})/);
      const fallbackDni = fallbackMatch ? fallbackMatch[1] : 'Desconocido';

      currentPairs.push({
        id: Math.random().toString(36).substring(7),
        dni: fallbackDni,
        front: frontFile,
        back: backFile
      });
    }

    setUploadedPairs(currentPairs);
  };

  const handleSinglePhotosUpload = (e) => {
    // Ordenar cronológicamente por lastModified para asegurar que la primera tomada sea el Anverso
    const files = Array.from(e.target.files).sort((a, b) => {
      if (a.lastModified === b.lastModified) return a.name.localeCompare(b.name);
      return a.lastModified - b.lastModified;
    });
    
    let currentPairs = [...uploadedPairs];
    let pair = currentPairs.length > 0 ? currentPairs[0] : { id: Math.random().toString(36).substring(7), dni: 'Desconocido', front: null, back: null };

    files.forEach(file => {
      const match = file.name.match(/(\d+)[-_]([12])/i);
      if (match) {
        const isFront = match[2] === '1';
        if (isFront) pair.front = file;
        else pair.back = file;
      } else {
        if (!pair.front) {
          pair.front = file;
        } else if (!pair.back) {
          pair.back = file;
        }
      }
    });

    if (currentPairs.length === 0) currentPairs.push(pair);
    setUploadedPairs([...currentPairs]);
  };

  const removePair = (id) => {
    setUploadedPairs(prev => prev.filter(p => p.id !== id));
  };

  const swapSinglePhotos = (id) => {
    setUploadedPairs(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, front: p.back, back: p.front };
      }
      return p;
    }));
  };

  const swapSmartPair = (index) => {
    setUploadedPairs(prev => {
      const newPairs = [...prev];
      const pair = { ...newPairs[index] };
      const temp = pair.front;
      pair.front = pair.back;
      pair.back = temp;
      newPairs[index] = pair;
      return newPairs;
    });
  };

  const moveSmartImage = (index, side, direction) => {
    setUploadedPairs(prev => {
      const newPairs = [...prev];
      const targetIndex = index + direction;
      if (targetIndex >= 0 && targetIndex < newPairs.length) {
        const pairA = { ...newPairs[index] };
        const pairB = { ...newPairs[targetIndex] };
        const temp = pairA[side];
        pairA[side] = pairB[side];
        pairB[side] = temp;
        newPairs[index] = pairA;
        newPairs[targetIndex] = pairB;
      }
      return newPairs;
    });
  };

  const processOCRBatch = async () => {
    const validPairs = uploadedPairs.filter(p => p.front && p.back);
    if (validPairs.length === 0) {
      showResult('Debe emparejar al menos un DNI (Anverso y Reverso).', 'error');
      return;
    }

    setIsProcessingOcr(true);
    setOcrProgress({ current: 0, total: validPairs.length });
    let results = [];

    for (let i = 0; i < validPairs.length; i++) {
      const pair = validPairs[i];
      setOcrProgress(prev => ({ ...prev, current: i + 1 }));

      const formData = new FormData();
      formData.append('frontImage', pair.front);
      formData.append('backImage', pair.back);
      formData.append('mode', 'IA'); // Usar Gemini (IA) en lugar de LOCAL

      try {
        const res = await fetch(`${API_URL}/Ocr/extract`, {
          method: 'POST',
          body: formData
        });
        const data = await res.json();

        if (data.success && data.data) {
          results.push({
            tempId: pair.id,
            ...data.data,
            numeroDni: pair.dni !== 'Desconocido' ? pair.dni : (data.data.numeroDni || ''),
            frontImageFile: data.data.wasSwapped ? pair.back : pair.front,
            backImageFile: data.data.wasSwapped ? pair.front : pair.back,
            sistemaPensionario: '', // Empty initially
            cargo: 'Colaborador',
            baseSalary: 0
          });
        }
      } catch (err) {
        console.error("Error OCR IA:", err);
      }
    }

    setIsProcessingOcr(false);
    if (results.length > 0) {
      setDetectedEmployees(results);
      setShowSmartUpload(false);
      setShowSingleUpload(false);
      setShowVerification(true);
    } else {
      showResult('No se pudo extraer información de ninguna imagen.', 'error');
    }
  };

  const handleUpdateDetected = (index, field, value) => {
    const updated = [...detectedEmployees];
    updated[index][field] = value;
    setDetectedEmployees(updated);
  };

  const handleSaveVerification = async () => {
    setIsSaving(true);
    let successCount = 0;

    for (const emp of detectedEmployees) {
      const formData = new FormData();
      formData.append('frontImage', emp.frontImageFile);
      formData.append('backImage', emp.backImageFile);

      // Mapear campos para ProcessController/start
      Object.keys(emp).forEach(key => {
        if (key !== 'frontImageFile' && key !== 'backImageFile' && key !== 'tempId') {
          formData.append(key, emp[key] !== null ? emp[key] : '');
        }
      });
      // Asegurar el numeroDNI para StartProcess sin duplicar
      if (!formData.has('numeroDNI') && !formData.has('numeroDni') && emp.numeroDni) {
        formData.append('numeroDNI', emp.numeroDni);
      }

      try {
        const res = await fetch(`${API_URL}/Process/start`, {
          method: 'POST',
          body: formData
        });
        if (res.ok) {
          successCount++;
        } else {
          const errorText = await res.text();
          console.error("Backend error:", errorText);
          showResult(`Error backend: ${errorText}`, 'error');
        }
      } catch (err) {
        console.error("Error registrando empleado masivo:", err);
        showResult(`Error de conexión: ${err.message}`, 'error');
      }
    }

    setIsSaving(false);
    setShowVerification(false);
    if (successCount > 0) {
      const dnis = detectedEmployees.map(e => e.numeroDni || e.numeroDNI).filter(d => d);
      if (dnis.length > 0) {
        setNewlyRegisteredDnis(dnis);
        setShowEnableAccounts(true);
      } else {
        showResult(`Se registraron ${successCount} colaboradores exitosamente.`);
      }
      refreshEmployees();
    }
  };

  const handleActivateAccounts = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`${API_URL}/Employee/activate-accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newlyRegisteredDnis)
      });
      if (res.ok) {
        setShowEnableAccounts(false);
        showResult('Cuentas habilitadas exitosamente', 'success');
        refreshEmployees();
      } else {
        showResult('Error al habilitar las cuentas', 'error');
      }
    } catch (err) {
      showResult('Error de conexión', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Tab styles ───
  const tabStyle = (active) => ({
    padding: '10px 18px',
    borderRadius: '8px',
    border: 'none',
    background: active ? '#1d4ed8' : 'transparent',
    color: active ? '#ffffff' : '#64748b',
    fontWeight: '700',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap'
  });

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }} className="animate-fade">
      <style>{drawerStyles}</style>

      {/* ═══ RESULT MODAL (Success/Error) ═══ */}
      {resultModal && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '400px', padding: '40px 32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)', textAlign: 'center', animation: 'fadeIn 0.2s ease-out' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: resultModal.type === 'success' ? '#dcfce7' : '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              {resultModal.type === 'success'
                ? <CheckCircle2 size={32} color="#16a34a" />
                : <AlertTriangle size={32} color="#dc2626" />
              }
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '28px' }}>
              {resultModal.msg}
            </h3>
            <button
              onClick={() => setResultModal(null)}
              style={{ padding: '12px 40px', borderRadius: '12px', border: 'none', background: resultModal.type === 'success' ? '#16a34a' : '#dc2626', color: 'white', fontWeight: '700', fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
            >
              Aceptar
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* ═══ CONFIRM MODAL (Delete confirmation) ═══ */}
      {confirmModal && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '440px', padding: '40px 32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)', textAlign: 'center', animation: 'fadeIn 0.2s ease-out' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '3px solid #fecaca' }}>
              <AlertTriangle size={32} color="#dc2626" />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>{confirmModal.title}</h3>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '28px', lineHeight: 1.6 }}>{confirmModal.message}</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => setConfirmModal(null)}
                style={{ padding: '12px 28px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#475569', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}
              >
                {confirmModal.cancelText}
              </button>
              <button
                onClick={confirmModal.onConfirm}
                style={{ padding: '12px 28px', borderRadius: '12px', border: 'none', background: '#dc2626', color: 'white', fontWeight: '700', fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(220,38,38,0.3)' }}
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <p style={{ color: '#3b82f6', fontSize: '14px', fontWeight: '700', marginBottom: '4px', letterSpacing: '0.5px' }}>¡Bienvenido de vuelta, Jhean! 👋</p>
          <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#0f172a', marginBottom: '8px', letterSpacing: '-0.5px' }}>Gestión de Personal</h1>
          <p style={{ color: '#64748b', fontSize: '14px' }}>Administra, visualiza y controla la información de todos los colaboradores.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => setShowExportModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', color: '#10b981', padding: '12px 20px', borderRadius: '10px', border: '1px solid #10b981', fontWeight: '600', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s' }}>
            <Download size={18} />
            Exportar Excel
          </button>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowNewCollabMenu(!showNewCollabMenu)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white', padding: '12px 20px', borderRadius: '10px', border: 'none', fontWeight: '600', fontSize: '14px', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              <UserPlus size={18} />
              Nuevo Colaborador
            </button>
            {showNewCollabMenu && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', background: 'white', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)', padding: '8px', zIndex: 100, minWidth: '220px', border: '1px solid #f1f5f9', animation: 'fadeIn 0.2s ease-out' }}>
                <div
                  onClick={() => { 
                    setShowNewCollabMenu(false); 
                    setEditEmployee(null);
                    setEditForm({});
                    setShowManualModal(true); 
                  }}
                  style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', borderRadius: '8px', transition: 'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileText size={16} color="#3b82f6" />
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '13px', color: '#0f172a' }}>Registro Manual</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Ingresar datos a mano</div>
                  </div>
                </div>
                <div
                  onClick={() => { setShowNewCollabMenu(false); setShowSmartUpload(true); setUploadedPairs([]); }}
                  style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', borderRadius: '8px', transition: 'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users size={16} color="#16a34a" />
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '13px', color: '#0f172a' }}>Carga Masiva (OCR)</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>IA detecta datos del DNI</div>
                  </div>
                </div>
                <div
                  onClick={() => { setShowNewCollabMenu(false); setShowSingleUpload(true); setUploadedPairs([]); }}
                  style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', borderRadius: '8px', transition: 'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={16} color="#ea580c" />
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '13px', color: '#0f172a' }}>Carga Unitaria</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Carga solo 1 DNI (2 fotos)</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
        <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#eff6ff', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Users color="#3b82f6" size={24} /></div>
            <div><p style={{ color: '#1e3a8a', fontSize: '13px', fontWeight: '700' }}>Total Colaboradores</p><h2 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a' }}>{totalItems}</h2></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}><p style={{ color: '#64748b', fontSize: '12px' }}>Activos en el sistema</p><Activity color="#3b82f6" size={24} strokeWidth={1.5} style={{ opacity: 0.5 }} /></div>
        </div>
        <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#ecfdf5', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><CheckCircle2 color="#10b981" size={24} /></div>
            <div><p style={{ color: '#064e3b', fontSize: '13px', fontWeight: '700' }}>Registros Activos</p><h2 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a' }}>{totalItems}</h2></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}><p style={{ color: '#64748b', fontSize: '12px' }}>100% del total</p><TrendingUp color="#10b981" size={24} strokeWidth={1.5} style={{ opacity: 0.5 }} /></div>
        </div>
        <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#f3e8ff', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><FileText color="#a855f7" size={24} /></div>
            <div><p style={{ color: '#581c87', fontSize: '13px', fontWeight: '700' }}>Contratos Vigentes</p><h2 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a' }}>{totalItems}</h2></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}><p style={{ color: '#64748b', fontSize: '12px' }}>Tiempo completo</p><Activity color="#a855f7" size={24} strokeWidth={1.5} style={{ opacity: 0.5 }} /></div>
        </div>
        <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#fff7ed', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><DollarSign color="#f97316" size={24} /></div>
            <div><p style={{ color: '#7c2d12', fontSize: '13px', fontWeight: '700' }}>Boletas Pendientes</p><h2 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a' }}>0</h2></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}><p style={{ color: '#64748b', fontSize: '12px' }}>Este mes</p><TrendingUp color="#f97316" size={24} strokeWidth={1.5} style={{ opacity: 0.5 }} /></div>
        </div>
      </div>


      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ position: 'relative', width: '320px' }}>
            <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
            <input type="text" placeholder="Buscar por nombre o DNI..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '12px 16px 12px 42px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px', background: 'white', transition: 'all 0.2s' }} />
          </div>
          <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 16px', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', color: '#1e293b', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>
            <Filter size={16} color="#64748b" />Filtros
          </button>
        </div>
        <div style={{ display: 'flex', gap: '8px', background: 'white', padding: '4px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <button style={{ padding: '8px', borderRadius: '8px', border: 'none', background: '#3b82f6', color: 'white', cursor: 'pointer' }}><List size={18} /></button>
          <button style={{ padding: '8px', borderRadius: '8px', border: 'none', background: 'transparent', color: '#94a3b8', cursor: 'pointer' }}><Grid size={18} /></button>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', overflow: 'visible', border: '1px solid #f1f5f9', marginBottom: '24px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '800', color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Colaborador</th>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '800', color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>DNI</th>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '800', color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contacto</th>
              <th style={{ padding: '16px 24px', textAlign: 'center', fontSize: '12px', fontWeight: '800', color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cuenta App</th>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '800', color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estado</th>
              <th style={{ padding: '16px 24px', textAlign: 'center', fontSize: '12px', fontWeight: '800', color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {currentEmployees.length === 0 ? (
              <tr><td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No se encontró personal.</td></tr>
            ) : (
              currentEmployees.map(emp => (
                <tr key={emp.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '20px', background: 'linear-gradient(135deg, #3b82f6 0%, #4f46e5 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '14px', boxShadow: '0 2px 4px rgba(59,130,246,0.3)' }}>
                        {(emp.nombres?.[0] || '')}{(emp.apellidoPaterno?.[0] || '')}
                      </div>
                      <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '14px', maxWidth: '200px', whiteSpace: 'normal', textTransform: 'uppercase' }}>{emp.fullName}</div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px' }}><span style={{ padding: '6px 12px', background: '#f1f5f9', borderRadius: '8px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>{emp.dni}</span></td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#475569', marginBottom: '4px' }}><span style={{ color: '#94a3b8' }}>📞</span> {emp.telefono || emp.phone || 'Sin teléfono'}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#475569' }}><span style={{ color: '#94a3b8' }}>✉️</span> {emp.correoPersonal || emp.email || 'Sin correo'}</div>
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: emp.hasAppAccount ? '#ecfdf5' : '#f1f5f9', borderRadius: '8px', border: `1px solid ${emp.hasAppAccount ? '#a7f3d0' : '#e2e8f0'}` }}>
                      {emp.hasAppAccount && <CheckCircle2 size={14} color="#10b981" />}
                      <span style={{ fontSize: '12px', fontWeight: '700', color: emp.hasAppAccount ? '#10b981' : '#94a3b8' }}>{emp.hasAppAccount ? 'Registrado' : 'No registrado'}</span>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '4px', background: '#10b981' }}></div>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>Activo</span>
                      </div>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', background: emp.hasSignedContract ? '#ecfdf5' : '#fffbeb', borderRadius: '6px', border: `1px solid ${emp.hasSignedContract ? '#a7f3d0' : '#fde68a'}`, width: 'fit-content' }}>
                        {emp.hasSignedContract ? <FileSignature size={12} color="#10b981" /> : <Clock size={12} color="#d97706" />}
                        <span style={{ fontSize: '11px', fontWeight: '700', color: emp.hasSignedContract ? '#10b981' : '#d97706' }}>
                          {emp.hasSignedContract ? 'Contrato Firmado' : 'Firma Pendiente (App)'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <div style={{ position: 'relative' }}>
                        <button onClick={(e) => { e.stopPropagation(); setDropdownOpen(dropdownOpen === emp.id ? null : emp.id); }} title="Opciones" style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0, fontSize: '18px', color: '#000000', fontWeight: 'bold' }}>
                          ⋮
                        </button>
                        {dropdownOpen === emp.id && (
                          <div className="animate-fade" onClick={e => e.stopPropagation()} style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(12px)', border: '1px solid rgba(226, 232, 240, 0.8)', borderRadius: '14px', boxShadow: '0 20px 40px -8px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.02)', padding: '8px', zIndex: 50, minWidth: '190px', transformOrigin: 'top right' }}>
                            <button onClick={() => { setDropdownOpen(null); handleEditClick(emp, true); }} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', textAlign: 'left', padding: '10px 14px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#475569', borderRadius: '8px', fontWeight: '600', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#0f172a'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#475569'; }}>
                              <Eye size={16} /> Ver detalles
                            </button>
                            <button onClick={() => { setDropdownOpen(null); handleEditClick(emp, false); }} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', textAlign: 'left', padding: '10px 14px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#3b82f6', borderRadius: '8px', fontWeight: '600', transition: 'all 0.2s', marginTop: '4px' }} onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.color = '#1d4ed8'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#3b82f6'; }}>
                              <Edit2 size={16} /> Editar
                            </button>

                            <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(226, 232, 240, 0.8), transparent)', margin: '6px 0' }}></div>
                            <button onClick={() => { setDropdownOpen(null); handleDelete(emp.id, emp.fullName); }} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', textAlign: 'left', padding: '10px 14px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#ef4444', borderRadius: '8px', fontWeight: '600', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#b91c1c'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#ef4444'; }}>
                              <Trash2 size={16} /> Eliminar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <select style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', color: '#475569', fontSize: '13px', fontWeight: '600', outline: 'none' }}>
            <option>10 por página</option><option>20 por página</option><option>50 por página</option>
          </select>
        </div>
        <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>
          Mostrando {totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} a {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems} resultados
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: '#94a3b8' }}><ChevronLeft size={16} /></button>
          <button style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: '#3b82f6', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', color: 'white', fontWeight: '700', fontSize: '14px' }}>{currentPage}</button>
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)} style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', color: '#94a3b8' }}><ChevronRight size={16} /></button>
        </div>
      </div>

      {/* ═══ EDIT DRAWER (Full Employee Data with Tabs) ═══ */}
      {editEmployee && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'flex-end', zIndex: 99999, backdropFilter: 'blur(6px)' }}>
          <div className="drawer-enter" style={{ background: 'white', borderRadius: '20px 0 0 20px', width: '100%', maxWidth: '720px', height: '100vh', overflow: 'hidden', boxShadow: '-10px 0 50px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column' }}>

            {/* Modal Header */}
            <div style={{ padding: '24px 28px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '16px', boxShadow: '0 4px 12px rgba(29,78,216,0.3)' }}>
                  {(editEmployee.nombres?.[0] || '')}{(editEmployee.apellidoPaterno?.[0] || '')}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>{isReadOnly ? 'Detalles del Colaborador' : 'Editar Colaborador'}</h2>
                  </div>
                  <p style={{ color: '#64748b', fontSize: '13px', margin: 0, marginTop: '6px', fontWeight: '500' }}>{editEmployee.fullName} — DNI: <span style={{ color: '#3b82f6', fontWeight: '700' }}>{editEmployee.dni}</span></p>
                </div>
              </div>
              <button type="button" onClick={() => setEditEmployee(null)} style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fee2e2', border: '1px solid #fecaca', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = '#fecaca'; e.currentTarget.style.color = '#dc2626'; }} onMouseLeave={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.color = '#ef4444'; }}>✕</button>
            </div>

            {/* Tabs */}
            <div style={{ padding: '12px 28px 0', display: 'flex', gap: '6px', background: '#fafbfc', borderBottom: '1px solid #f1f5f9' }}>
              <button style={tabStyle(editTab === 'personal')} onClick={() => setEditTab('personal')}>👤 Personal</button>
              <button style={tabStyle(editTab === 'contacto')} onClick={() => setEditTab('contacto')}>📞 Contacto</button>
              <button style={tabStyle(editTab === 'laboral')} onClick={() => setEditTab('laboral')}>💼 Laboral</button>
              <button style={tabStyle(editTab === 'bancario')} onClick={() => setEditTab('bancario')}>🏦 Bancario / AFP</button>
              <button style={tabStyle(editTab === 'emergencia')} onClick={() => setEditTab('emergencia')}>🚨 Emergencia</button>
              <button style={tabStyle(editTab === 'firma')} onClick={() => setEditTab('firma')}>✍️ Firma Digital</button>
            </div>

            {/* Tab Content */}
            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1 }}>
                <fieldset disabled={isReadOnly} style={{ border: 'none', padding: 0, margin: 0, minWidth: 0 }}>

                  {editTab === 'personal' && (
                    <>
                      <SectionHeader icon="👤" title="Datos Personales" color="#1d4ed8" />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                        <FormInput label="Nombres" value={editForm.nombres} onChange={e => setEditForm({ ...editForm, nombres: e.target.value })} required />
                        <FormInput label="DNI" value={editForm.dni} onChange={e => setEditForm({ ...editForm, dni: e.target.value })} required />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                        <FormInput label="Apellido Paterno" value={editForm.apellidoPaterno} onChange={e => setEditForm({ ...editForm, apellidoPaterno: e.target.value })} required />
                        <FormInput label="Apellido Materno" value={editForm.apellidoMaterno} onChange={e => setEditForm({ ...editForm, apellidoMaterno: e.target.value })} required />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <FormInput label="Fecha de Nacimiento" value={editForm.fechaNacimiento} onChange={e => setEditForm({ ...editForm, fechaNacimiento: e.target.value })} type="date" />
                        <FormInput label="Dirección" value={editForm.direccion} onChange={e => setEditForm({ ...editForm, direccion: e.target.value })} placeholder="Av. ejemplo 123" />
                      </div>
                      {/* Read-only info */}
                      <div style={{ marginTop: '20px', padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <p style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase' }}>Datos de catálogo (solo lectura)</p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                          <div><span style={{ fontSize: '11px', color: '#94a3b8' }}>Género</span><p style={{ fontSize: '13px', fontWeight: '600', color: '#334155', margin: 0 }}>{editEmployee.genero || '—'}</p></div>
                          <div><span style={{ fontSize: '11px', color: '#94a3b8' }}>Estado Civil</span><p style={{ fontSize: '13px', fontWeight: '600', color: '#334155', margin: 0 }}>{editEmployee.estadoCivil || '—'}</p></div>
                          <div><span style={{ fontSize: '11px', color: '#94a3b8' }}>Ubicación</span><p style={{ fontSize: '13px', fontWeight: '600', color: '#334155', margin: 0 }}>{[editEmployee.departamento, editEmployee.provincia, editEmployee.distrito].filter(Boolean).join(', ') || '—'}</p></div>
                        </div>
                      </div>
                    </>
                  )}

                  {editTab === 'contacto' && (
                    <>
                      <SectionHeader icon="📞" title="Información de Contacto" color="#0891b2" />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                        <FormInput label="Teléfono" value={editForm.telefono} onChange={e => setEditForm({ ...editForm, telefono: e.target.value })} placeholder="999 999 999" />
                        <FormInput label="Correo Personal" value={editForm.correoPersonal} onChange={e => setEditForm({ ...editForm, correoPersonal: e.target.value })} type="email" placeholder="correo@personal.com" />
                        <FormInput label="Correo Corporativo" value={editForm.correoCorporativo} onChange={e => setEditForm({ ...editForm, correoCorporativo: e.target.value })} type="email" placeholder="correo@chavin.com" />
                      </div>
                    </>
                  )}

                  {editTab === 'laboral' && (
                    <>
                      <SectionHeader icon="💼" title="Información Laboral" color="#7c3aed" />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                        <FormInput label="Salario Base (S/)" value={editForm.baseSalary} onChange={e => setEditForm({ ...editForm, baseSalary: e.target.value })} type="number" />
                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                          <div style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                            <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>Cargo</span>
                            <p style={{ fontSize: '14px', fontWeight: '600', color: '#334155', margin: 0 }}>{editEmployee.cargo || '—'}</p>
                          </div>
                        </div>
                      </div>
                      <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <p style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase' }}>Datos laborales (solo lectura)</p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                          <div><span style={{ fontSize: '11px', color: '#94a3b8' }}>Estado</span><p style={{ fontSize: '13px', fontWeight: '600', color: '#334155', margin: 0 }}>{editEmployee.estadoEmpleado || '—'}</p></div>
                          <div><span style={{ fontSize: '11px', color: '#94a3b8' }}>Tipo Contrato</span><p style={{ fontSize: '13px', fontWeight: '600', color: '#334155', margin: 0 }}>{editEmployee.tipoContrato || '—'}</p></div>
                          <div><span style={{ fontSize: '11px', color: '#94a3b8' }}>Fecha Ingreso</span><p style={{ fontSize: '13px', fontWeight: '600', color: '#334155', margin: 0 }}>{editEmployee.fechaIngreso || '—'}</p></div>
                        </div>
                      </div>
                    </>
                  )}

                  {editTab === 'bancario' && (
                    <>
                      <SectionHeader icon="🏦" title="Datos Bancarios" color="#0d9488" />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                        <FormInput label="Número de Cuenta" value={editForm.numeroCuenta} onChange={e => setEditForm({ ...editForm, numeroCuenta: e.target.value })} placeholder="Número de cuenta bancaria" />
                        <FormInput label="CCI" value={editForm.cci} onChange={e => setEditForm({ ...editForm, cci: e.target.value })} placeholder="Código CCI" />
                      </div>
                      <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div><span style={{ fontSize: '11px', color: '#94a3b8' }}>Banco</span><p style={{ fontSize: '13px', fontWeight: '600', color: '#334155', margin: 0 }}>{editEmployee.banco || '—'}</p></div>
                          <div><span style={{ fontSize: '11px', color: '#94a3b8' }}>Tipo Cuenta</span><p style={{ fontSize: '13px', fontWeight: '600', color: '#334155', margin: 0 }}>{editEmployee.tipoCuentaBancaria || '—'}</p></div>
                        </div>
                      </div>

                      <SectionHeader icon="🛡️" title="AFP / Pensión" color="#ea580c" />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <FormInput label="Código AFP" value={editForm.codigoAFP} onChange={e => setEditForm({ ...editForm, codigoAFP: e.target.value })} placeholder="CUSPP / Código" />
                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                          <div style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                            <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>AFP Asignada</span>
                            <p style={{ fontSize: '14px', fontWeight: '600', color: '#334155', margin: 0 }}>{editEmployee.afp || '—'}</p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {editTab === 'emergencia' && (
                    <>
                      <SectionHeader icon="🚨" title="Contacto de Emergencia" color="#dc2626" />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                        <FormInput label="Nombre del Contacto" value={editForm.contactoEmergencia} onChange={e => setEditForm({ ...editForm, contactoEmergencia: e.target.value })} placeholder="Nombre completo del contacto" />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                          <FormInput label="Parentesco" value={editForm.parentesco} onChange={e => setEditForm({ ...editForm, parentesco: e.target.value })} placeholder="Ej: Madre, Padre, Hermano" />
                          <FormInput label="Teléfono de Emergencia" value={editForm.telefonoEmergencia} onChange={e => setEditForm({ ...editForm, telefonoEmergencia: e.target.value })} placeholder="999 999 999" />
                        </div>
                      </div>
                    </>
                  )}

                  {editTab === 'firma' && (
                    <>
                      <SectionHeader icon="✍️" title="Validación de Firma Digital" color="#0ea5e9" />
                      {(() => {
                        let sigMeta = null;
                        try {
                          if (editEmployee.signatureMetadata) {
                            sigMeta = JSON.parse(editEmployee.signatureMetadata);
                          }
                        } catch(e) {}
                        
                        return sigMeta ? (
                          <div style={{ background: '#f0f9ff', padding: '24px', borderRadius: '16px', border: '1px solid #bae6fd', marginBottom: '24px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                              <div>
                                <p style={{ fontSize: '12px', fontWeight: '700', color: '#0369a1', textTransform: 'uppercase', marginBottom: '4px' }}>Validación Biométrica (Huella)</p>
                                <p style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                                  {sigMeta.biometricValidated ? '✅ Verificado exitosamente' : '❌ No realizada'}
                                </p>
                              </div>
                              <div>
                                <p style={{ fontSize: '12px', fontWeight: '700', color: '#0369a1', textTransform: 'uppercase', marginBottom: '4px' }}>Fecha de Firma</p>
                                <p style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                                  {new Date(sigMeta.signedAt).toLocaleString()}
                                </p>
                              </div>
                              <div>
                                <p style={{ fontSize: '12px', fontWeight: '700', color: '#0369a1', textTransform: 'uppercase', marginBottom: '4px' }}>Dispositivo Utilizado</p>
                                <p style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                                  {sigMeta.brand} {sigMeta.modelName}
                                </p>
                              </div>
                              <div>
                                <p style={{ fontSize: '12px', fontWeight: '700', color: '#0369a1', textTransform: 'uppercase', marginBottom: '4px' }}>Sistema Operativo</p>
                                <p style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                                  {sigMeta.osName} {sigMeta.osVersion}
                                </p>
                              </div>
                            </div>
                            
                            {editEmployee.signatureImagePath && editEmployee.signatureImagePath !== "GENERATED_BY_HR" && (
                              <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px dashed #bae6fd', textAlign: 'center' }}>
                                <p style={{ fontSize: '12px', fontWeight: '700', color: '#0369a1', textTransform: 'uppercase', marginBottom: '12px' }}>Firma Digital Adjunta</p>
                                <img src={`http://localhost:5051${editEmployee.signatureImagePath}`} alt="Firma" style={{ background: 'white', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '16px', maxHeight: '120px', maxWidth: '100%', objectFit: 'contain' }} />
                              </div>
                            )}
                          </div>
                        ) : (
                          <div style={{ background: '#f8fafc', padding: '32px', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                              <ShieldCheck size={32} color="#94a3b8" />
                            </div>
                            <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Sin metadatos registrados</h4>
                            <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '400px', margin: '0 auto' }}>
                              No hay metadatos de firma registrados para este contrato. O se firmó en una versión anterior de la aplicación, o no se requirió biometría.
                            </p>
                          </div>
                        );
                      })()}
                    </>
                  )}
                </fieldset>
              </div>

              {/* Modal Footer */}
              <div style={{ padding: '20px 28px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '16px', background: '#f8fafc' }}>
                {!isReadOnly && (
                  <button type="button" onClick={() => setEditEmployee(null)} style={{ padding: '12px 24px', borderRadius: '12px', border: '1px solid #cbd5e1', background: 'white', color: '#475569', fontWeight: '700', cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    Cancelar
                  </button>
                )}
                {!isReadOnly && (
                  <button type="submit" disabled={isSaving} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 28px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', color: 'white', fontWeight: '800', cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? 0.7 : 1, fontSize: '14px', boxShadow: '0 8px 16px -4px rgba(37,99,235,0.4)', transition: 'transform 0.2s, box-shadow 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                    {isSaving && <Loader2 size={16} className="animate-spin" />}
                    💾 Guardar Cambios
                  </button>
                )}
                {isReadOnly && (
                  <>
                    {editEmployee.hasSignedContract ? (
                      <button type="button" onClick={async () => {
                        try {
                          const payload = {
                            nombres: editEmployee.nombres,
                            apellidoPaterno: editEmployee.apellidoPaterno,
                            apellidoMaterno: editEmployee.apellidoMaterno,
                            numeroDni: editEmployee.dni,
                            fechaNacimiento: editEmployee.fechaNacimiento,
                            sexo: editEmployee.genero || '',
                            direccion: editEmployee.direccion || '',
                            cargo: editEmployee.cargo || '',
                            sistemaPensionario: editEmployee.afp || ''
                          };
                          const res = await fetch(`${API_URL}/Contract/generate`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload)
                          });
                          if (res.ok) {
                            const blob = await res.blob();
                            const url = window.URL.createObjectURL(blob);
                            window.open(url, '_blank');
                          } else {
                            alert("No se pudo generar el documento del contrato.");
                          }
                        } catch (err) {
                          console.error(err);
                          alert("Error de conexión al obtener el contrato.");
                        }
                      }} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 32px', borderRadius: '14px', border: 'none', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', fontWeight: '800', cursor: 'pointer', fontSize: '15px', boxShadow: '0 10px 25px -5px rgba(16,185,129,0.4)', transition: 'all 0.3s ease' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 15px 30px -5px rgba(16,185,129,0.5)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(16,185,129,0.4)'; }}>
                        <FileSignature size={20} /> VER CONTRATO OFICIAL
                      </button>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 32px', borderRadius: '14px', border: '1px dashed #d97706', background: '#fffbeb', color: '#b45309', fontWeight: '700', fontSize: '14px' }}>
                        <Clock size={18} /> PENDIENTE FIRMA DEL TRABAJADOR (APP MÓVIL)
                      </div>
                    )}
                  </>
                )}
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ═══ EXPORT MODAL ═══ */}
      {showExportModal && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '600px', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)', animation: 'fadeIn 0.2s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Exportar Personal a Excel</h2>
              <button onClick={() => setShowExportModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={24} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#1e293b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nombre del archivo</label>
                <div style={{ position: 'relative' }}>
                  <input type="text" value={exportFilename} onChange={e => setExportFilename(e.target.value)} style={{ width: '100%', padding: '12px 14px 12px 40px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px', background: '#f8fafc', color: '#0f172a', fontWeight: '600' }} />
                  <FileText size={18} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                </div>
              </div>

              <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 20px 0' }}>Configuración de Filtros</h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>

                  {/* Fila 1 */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '10px' }}>Sistema Pensionario</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <FilterOption label="Todos" value="todos" current={exportFilters.pension} onChange={v => setExportFilters(prev => ({ ...prev, pension: v }))} icon="🏦" />
                        <FilterOption label="AFP" value="afp" current={exportFilters.pension} onChange={v => setExportFilters(prev => ({ ...prev, pension: v }))} icon="📈" />
                        <FilterOption label="ONP" value="onp" current={exportFilters.pension} onChange={v => setExportFilters(prev => ({ ...prev, pension: v }))} icon="🏛️" />
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '10px' }}>Cuenta en la App</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <FilterOption label="Todos" value="todos" current={exportFilters.appAccount} onChange={v => setExportFilters(prev => ({ ...prev, appAccount: v }))} icon="📱" />
                        <FilterOption label="Registrados" value="si" current={exportFilters.appAccount} onChange={v => setExportFilters(prev => ({ ...prev, appAccount: v }))} icon="✅" />
                        <FilterOption label="Pendientes" value="no" current={exportFilters.appAccount} onChange={v => setExportFilters(prev => ({ ...prev, appAccount: v }))} icon="⏳" />
                      </div>
                    </div>
                  </div>

                  {/* Fila 2 */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '10px' }}>Cuenta Bancaria (Depósito)</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <FilterOption label="Todos" value="todos" current={exportFilters.bank} onChange={v => setExportFilters(prev => ({ ...prev, bank: v }))} icon="💳" />
                        <FilterOption label="Asignada" value="si" current={exportFilters.bank} onChange={v => setExportFilters(prev => ({ ...prev, bank: v }))} icon="✔️" />
                        <FilterOption label="Faltante" value="no" current={exportFilters.bank} onChange={v => setExportFilters(prev => ({ ...prev, bank: v }))} icon="❌" />
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '10px' }}>Teléfono Asignado</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <FilterOption label="Todos" value="todos" current={exportFilters.phone} onChange={v => setExportFilters(prev => ({ ...prev, phone: v }))} icon="📞" />
                        <FilterOption label="Con número" value="si" current={exportFilters.phone} onChange={v => setExportFilters(prev => ({ ...prev, phone: v }))} icon="📱" />
                        <FilterOption label="Sin número" value="no" current={exportFilters.phone} onChange={v => setExportFilters(prev => ({ ...prev, phone: v }))} icon="📵" />
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setShowExportModal(false)} style={{ padding: '12px 24px', borderRadius: '10px', border: '1px solid #cbd5e1', background: 'white', color: '#475569', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}>Cancelar</button>
              <button onClick={handleExportExcel} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '10px', border: 'none', background: '#10b981', color: 'white', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)', fontSize: '14px' }}>
                <Download size={18} /> Descargar Reporte
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ═══ MANUAL REGISTRATION DRAWER ═══ */}
      {showManualModal && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'flex-end', zIndex: 99999, backdropFilter: 'blur(6px)' }}>
          <div className="drawer-enter" style={{ background: 'white', borderRadius: '20px 0 0 20px', width: '100%', maxWidth: '720px', height: '100vh', overflow: 'hidden', boxShadow: '-10px 0 50px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '24px 28px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '16px', boxShadow: '0 4px 12px rgba(29,78,216,0.3)' }}>
                  <UserPlus size={24} />
                </div>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Registro Manual de Colaborador</h2>
                  <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>Ingresa los datos sin procesar DNI</p>
                </div>
              </div>
              <button onClick={() => setShowManualModal(false)} style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#f1f5f9', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>✕</button>
            </div>

            <form onSubmit={handleSaveManualCreation} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1 }}>
                <SectionHeader icon="👤" title="Datos Personales Obligatorios" color="#1d4ed8" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                  <FormInput label="Nombres" value={editForm.nombres} onChange={e => setEditForm({ ...editForm, nombres: e.target.value })} required />
                  <FormInput label="DNI" value={editForm.dni} onChange={e => setEditForm({ ...editForm, dni: e.target.value })} required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                  <FormInput label="Apellido Paterno" value={editForm.apellidoPaterno} onChange={e => setEditForm({ ...editForm, apellidoPaterno: e.target.value })} required />
                  <FormInput label="Apellido Materno" value={editForm.apellidoMaterno} onChange={e => setEditForm({ ...editForm, apellidoMaterno: e.target.value })} required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                  <FormInput label="Fecha de Nacimiento" value={editForm.fechaNacimiento} onChange={e => setEditForm({ ...editForm, fechaNacimiento: e.target.value })} type="date" />
                  <FormInput label="Dirección" value={editForm.direccion} onChange={e => setEditForm({ ...editForm, direccion: e.target.value })} placeholder="Av. ejemplo 123" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sexo</label>
                    <select value={editForm.sexo || 'MASCULINO'} onChange={e => setEditForm({ ...editForm, sexo: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px' }}>
                      <option value="MASCULINO">MASCULINO</option>
                      <option value="FEMENINO">FEMENINO</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Estado Civil</label>
                    <select value={editForm.estadoCivil || 'SOLTERO'} onChange={e => setEditForm({ ...editForm, estadoCivil: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px' }}>
                      <option value="SOLTERO">SOLTERO(A)</option>
                      <option value="CASADO">CASADO(A)</option>
                      <option value="DIVORCIADO">DIVORCIADO(A)</option>
                      <option value="VIUDO">VIUDO(A)</option>
                    </select>
                  </div>
                </div>

                <SectionHeader icon="📞" title="Información de Contacto" color="#0891b2" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                  <FormInput label="Teléfono" value={editForm.telefono} onChange={e => setEditForm({ ...editForm, telefono: e.target.value })} placeholder="999 999 999" />
                  <FormInput label="Correo Personal" value={editForm.correoPersonal} onChange={e => setEditForm({ ...editForm, correoPersonal: e.target.value })} type="email" placeholder="correo@personal.com" />
                </div>

                <SectionHeader icon="💼" title="Información Laboral" color="#7c3aed" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                  <FormInput label="Cargo" value={editForm.cargo} onChange={e => setEditForm({ ...editForm, cargo: e.target.value })} placeholder="Ej: Desarrollador" />
                  <FormInput label="Salario Base (S/)" value={editForm.baseSalary} onChange={e => setEditForm({ ...editForm, baseSalary: e.target.value })} type="number" />
                </div>

                <SectionHeader icon="🏦" title="Datos Bancarios y AFP" color="#0d9488" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                  <FormInput label="Número de Cuenta" value={editForm.numeroCuenta} onChange={e => setEditForm({ ...editForm, numeroCuenta: e.target.value })} placeholder="Número de cuenta bancaria" />
                  <FormInput label="CCI" value={editForm.cci} onChange={e => setEditForm({ ...editForm, cci: e.target.value })} placeholder="Código CCI" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                  <FormInput label="Sistema Pensionario" value={editForm.sistemaPensionario} onChange={e => setEditForm({ ...editForm, sistemaPensionario: e.target.value })} placeholder="Ej: AFP Integra / ONP" />
                  <FormInput label="Código AFP / CUSPP" value={editForm.codigoAFP} onChange={e => setEditForm({ ...editForm, codigoAFP: e.target.value })} placeholder="Código de afiliado" />
                </div>

                <SectionHeader icon="🚨" title="Contacto de Emergencia" color="#dc2626" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', marginBottom: '20px' }}>
                  <FormInput label="Nombre del Contacto" value={editForm.contactoEmergencia} onChange={e => setEditForm({ ...editForm, contactoEmergencia: e.target.value })} placeholder="Nombre completo del contacto" />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <FormInput label="Parentesco" value={editForm.parentesco} onChange={e => setEditForm({ ...editForm, parentesco: e.target.value })} placeholder="Ej: Madre, Padre" />
                    <FormInput label="Teléfono de Emergencia" value={editForm.telefonoEmergencia} onChange={e => setEditForm({ ...editForm, telefonoEmergencia: e.target.value })} placeholder="999 999 999" />
                  </div>
                </div>
              </div>

              <div style={{ padding: '16px 28px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: '#fafbfc' }}>
                <button type="button" onClick={() => setShowManualModal(false)} style={{ padding: '12px 24px', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', color: '#475569', fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}>Cancelar</button>
                <button type="submit" disabled={isSaving} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 28px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', color: 'white', fontWeight: '700', cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? 0.7 : 1, fontSize: '14px', boxShadow: '0 4px 12px rgba(29,78,216,0.3)' }}>
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />} Registrar Colaborador
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ═══ SIGN CONTRACT MODAL ═══ */}
      {signEmployee && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, backdropFilter: 'blur(6px)' }}>
          <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '500px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.2s ease-out' }}>
            <div style={{ padding: '24px 28px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '24px', boxShadow: '0 4px 12px rgba(37,99,235,0.3)' }}>
                  📄
                </div>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Generar Contrato</h2>
                  <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>{signEmployee.fullName} — DNI: {signEmployee.dni}</p>
                </div>
              </div>
              <button onClick={() => setSignEmployee(null)} style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#f1f5f9', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>✕</button>
            </div>

            <div style={{ padding: '32px 40px', background: '#f8fafc', textAlign: 'center' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '2px solid #bfdbfe' }}>
                <FileSignature size={32} className="text-blue-600" />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', marginBottom: '8px', marginTop: 0 }}>Confirmar Generación</h3>
              <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.6', margin: 0 }}>
                Estás a punto de generar el contrato formal para este colaborador. Ya que este proceso es gestionado internamente por RRHH, no se requiere firma digital.
              </p>

              {sigError && (
                <div style={{ width: '100%', background: '#fef2f2', color: '#ef4444', padding: '12px', borderRadius: '12px', marginTop: '16px', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={16} /> {sigError}
                </div>
              )}

              <div style={{ marginTop: '32px', width: '100%', display: 'flex', gap: '12px' }}>
                <button onClick={() => setSignEmployee(null)} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', background: 'white', color: '#475569', fontWeight: '700', cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s' }}>Cancelar</button>
                <button
                  disabled={isSaving}
                  onClick={async () => {
                    setIsSaving(true);
                    setSigError('');
                    try {
                      const res = await fetch(`${API_URL}/Employee/${signEmployee.id}/signature`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ SignatureBase64: '' })
                      });
                      if (res.ok) {
                        setSignEmployee(null);
                        showResult('Contrato generado exitosamente. Se ha habilitado la vista del documento.', 'success');
                        refreshEmployees();
                      } else {
                        setSigError('Ocurrió un error al generar el contrato.');
                      }
                    } catch (err) {
                      setSigError('Error de conexión.');
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                  style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', fontWeight: '700', cursor: isSaving ? 'not-allowed' : 'pointer', fontSize: '14px', boxShadow: '0 4px 12px rgba(16,185,129,0.3)', transition: 'all 0.2s', opacity: isSaving ? 0.7 : 1 }}
                >
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : <FileSignature size={18} />}
                  {isSaving ? 'Procesando...' : 'Sí, Generar Contrato'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ═══ ENABLE ACCOUNTS MODAL ═══ */}
      {showEnableAccounts && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, backdropFilter: 'blur(6px)' }}>
          <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '450px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.2s ease-out' }}>
            <div style={{ padding: '24px 28px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '24px', boxShadow: '0 4px 12px rgba(37,99,235,0.3)' }}>
                  📱
                </div>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Habilitar App Móvil</h2>
                </div>
              </div>
            </div>

            <div style={{ padding: '32px 40px', background: '#ffffff', textAlign: 'center' }}>
              <p style={{ fontSize: '15px', color: '#475569', lineHeight: '1.6', margin: '0 0 20px 0' }}>
                ¿Desea habilitar las cuentas en el aplicativo móvil para los colaboradores registrados?
              </p>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
                <p style={{ margin: 0, fontSize: '14px', color: '#334155', fontWeight: '500' }}>Contraseña inicial: <strong style={{ color: '#0f172a' }}>El Nro. de DNI</strong></p>
              </div>

              <div style={{ width: '100%', display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => {
                    setShowEnableAccounts(false);
                    showResult('Colaboradores registrados. Las cuentas permanecen inactivas.');
                  }}
                  style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', background: 'white', color: '#475569', fontWeight: '700', cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s' }}>
                  No, saltar
                </button>
                <button
                  disabled={isSaving}
                  onClick={handleActivateAccounts}
                  style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', color: 'white', fontWeight: '700', cursor: isSaving ? 'not-allowed' : 'pointer', fontSize: '14px', boxShadow: '0 4px 12px rgba(37,99,235,0.3)', transition: 'all 0.2s', opacity: isSaving ? 0.7 : 1 }}
                >
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
                  {isSaving ? 'Habilitando...' : 'Sí, Habilitar Cuentas'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
      {/* ═══ SMART MASS UPLOAD MODAL ═══ */}
      {showSmartUpload && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, backdropFilter: 'blur(6px)' }}>
          <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '720px', maxHeight: '90vh', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '24px 28px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '16px', boxShadow: '0 4px 12px rgba(22,163,74,0.3)' }}>
                  <Users size={24} />
                </div>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Carga Inteligente de DNI (Masiva)</h2>
                  <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>Toma las fotos en orden (Anverso, Reverso, Anverso...) y la IA las emparejará solas.</p>
                </div>
              </div>
              <button onClick={() => setShowSmartUpload(false)} style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.5)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s', fontSize: '18px' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.8)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.5)'}>
                ❌
              </button>
            </div>

            <div style={{ padding: '32px 40px', overflowY: 'auto', flex: 1, background: '#f8fafc' }}>
              <div style={{ border: '2px dashed #22c55e', borderRadius: '24px', padding: '48px 32px', textAlign: 'center', background: 'linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%)', marginBottom: '32px', position: 'relative', boxShadow: '0 10px 25px -5px rgba(34, 197, 94, 0.1)', transition: 'all 0.3s ease' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                <input type="file" multiple accept="image/*" onChange={handlePhotosUpload} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', zIndex: 10 }} />
                <div style={{ width: '80px', height: '80px', background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 4px 12px rgba(34,197,94,0.2)' }}>
                  <FileText size={40} color="#15803d" />
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#14532d', margin: '0 0 8px 0' }}>Arrastra múltiples fotos de DNI aquí</h3>
                <p style={{ fontSize: '14px', color: '#166534', margin: 0, fontWeight: '500' }}>Haz clic o arrastra para cargar archivos (.jpg, .png)</p>
              </div>

              {uploadedPairs.length > 0 && (
                <div className="animate-fade">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Pares Detectados</h3>
                    <div style={{ padding: '6px 14px', background: '#e2e8f0', color: '#475569', borderRadius: '20px', fontWeight: '700', fontSize: '13px' }}>
                      {uploadedPairs.length} Elementos
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                    {uploadedPairs.map((pair, idx) => (
                      <div key={pair.id} style={{ display: 'flex', flexDirection: 'column', padding: '16px', background: 'white', borderRadius: '16px', border: `2px solid ${pair.front && pair.back ? '#86efac' : '#fca5a5'}`, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', transition: 'all 0.2s', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: pair.front && pair.back ? '#dcfce7' : '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: pair.front && pair.back ? '#166534' : '#991b1b', fontWeight: '800' }}>
                              {idx + 1}
                            </div>
                            <span style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>Par {idx + 1}</span>
                          </div>
                          <button onClick={() => removePair(pair.id)} style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fee2e2', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s', fontSize: '16px' }}>
                            🗑️
                          </button>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          {/* Anverso */}
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '8px' }}>FOTO ANVERSO</span>
                            {pair.front ? (
                              <img src={URL.createObjectURL(pair.front)} style={{ width: '100%', height: '80px', objectFit: 'contain', borderRadius: '8px', backgroundColor: '#fff', border: '1px solid #cbd5e1' }} />
                            ) : (
                              <div style={{ width: '100%', height: '80px', background: '#e2e8f0', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '12px', border: '1px dashed #cbd5e1' }}>Falta Foto</div>
                            )}
                            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                              <button onClick={() => moveSmartImage(idx, 'front', -1)} disabled={idx === 0} style={{ padding: '4px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'white', cursor: idx === 0 ? 'not-allowed' : 'pointer', opacity: idx === 0 ? 0.5 : 1 }}>⬆️ Subir</button>
                              <button onClick={() => moveSmartImage(idx, 'front', 1)} disabled={idx === uploadedPairs.length - 1} style={{ padding: '4px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'white', cursor: idx === uploadedPairs.length - 1 ? 'not-allowed' : 'pointer', opacity: idx === uploadedPairs.length - 1 ? 0.5 : 1 }}>⬇️ Bajar</button>
                            </div>
                          </div>

                          {/* Swap Button */}
                          <button onClick={() => swapSmartPair(idx)} style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#eff6ff', border: '1px solid #bfdbfe', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', flexShrink: 0, fontSize: '20px' }} title="Invertir Anverso y Reverso">
                            🔄
                          </button>

                          {/* Reverso */}
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '8px' }}>FOTO REVERSO</span>
                            {pair.back ? (
                              <img src={URL.createObjectURL(pair.back)} style={{ width: '100%', height: '80px', objectFit: 'contain', borderRadius: '8px', backgroundColor: '#fff', border: '1px solid #cbd5e1' }} />
                            ) : (
                              <div style={{ width: '100%', height: '80px', background: '#e2e8f0', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '12px', border: '1px dashed #cbd5e1' }}>Falta Foto</div>
                            )}
                            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                              <button onClick={() => moveSmartImage(idx, 'back', -1)} disabled={idx === 0} style={{ padding: '4px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'white', cursor: idx === 0 ? 'not-allowed' : 'pointer', opacity: idx === 0 ? 0.5 : 1 }}>⬆️ Subir</button>
                              <button onClick={() => moveSmartImage(idx, 'back', 1)} disabled={idx === uploadedPairs.length - 1} style={{ padding: '4px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'white', cursor: idx === uploadedPairs.length - 1 ? 'not-allowed' : 'pointer', opacity: idx === uploadedPairs.length - 1 ? 0.5 : 1 }}>⬇️ Bajar</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isProcessingOcr && (
                <div style={{ padding: '60px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ position: 'relative', width: '80px', height: '80px', marginBottom: '24px' }}>
                    <Loader2 size={80} className="animate-spin" color="#16a34a" />
                    <Scan size={32} color="#16a34a" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
                  </div>
                  <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '0 0 12px 0' }}>Procesando DNI con IA</h3>
                  <p style={{ fontSize: '15px', color: '#64748b', textAlign: 'center', maxWidth: '400px', lineHeight: '1.6', marginBottom: '24px' }}>
                    La Inteligencia Artificial de Gemini está leyendo los datos de los DNI. Por favor espera...
                  </p>
                  
                  {/* Progress bar container */}
                  <div style={{ width: '100%', maxWidth: '400px', background: '#f1f5f9', borderRadius: '12px', height: '16px', overflow: 'hidden', border: '1px solid #e2e8f0', marginBottom: '12px' }}>
                    <div style={{ 
                      height: '100%', 
                      background: 'linear-gradient(90deg, #16a34a 0%, #22c55e 100%)', 
                      width: `${ocrProgress.total > 0 ? (ocrProgress.current / ocrProgress.total) * 100 : 0}%`,
                      transition: 'width 0.4s ease-out'
                    }}></div>
                  </div>
                  <p style={{ fontSize: '14px', fontWeight: '700', color: '#15803d' }}>
                    Procesando {ocrProgress.current} de {ocrProgress.total} DNIs...
                  </p>
                </div>
              )}
            </div>

            {!isProcessingOcr && (
              <div style={{ padding: '16px 28px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafbfc' }}>
                <button type="button" onClick={() => setShowSmartUpload(false)} style={{ padding: '12px 24px', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', color: '#475569', fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}>Cancelar</button>

                <button onClick={processOCRBatch} disabled={uploadedPairs.length === 0} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 28px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)', color: 'white', fontWeight: '700', cursor: uploadedPairs.length === 0 ? 'not-allowed' : 'pointer', opacity: uploadedPairs.length === 0 ? 0.7 : 1, fontSize: '14px', boxShadow: '0 4px 12px rgba(22,163,74,0.3)' }}>
                  <Activity size={16} /> Procesar con IA (Gemini)
                </button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* ═══ SINGLE UPLOAD MODAL ═══ */}
      {showSingleUpload && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, backdropFilter: 'blur(6px)' }}>
          <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '24px 28px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '16px', boxShadow: '0 4px 12px rgba(217,119,6,0.3)' }}>
                  <User size={24} />
                </div>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Carga Unitaria de DNI</h2>
                  <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>Sube la parte delantera y trasera de un DNI</p>
                </div>
              </div>
              <button onClick={() => setShowSingleUpload(false)} style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.5)', border: 'none', color: '#b45309', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>✕</button>
            </div>

            <div style={{ padding: '32px 40px', overflowY: 'auto', flex: 1, background: '#f8fafc' }}>
              <div style={{ border: '2px dashed #f59e0b', borderRadius: '24px', padding: '48px 32px', textAlign: 'center', background: 'linear-gradient(180deg, #fffbeb 0%, #ffffff 100%)', marginBottom: '32px', position: 'relative', boxShadow: '0 10px 25px -5px rgba(245, 158, 11, 0.1)', transition: 'all 0.3s ease' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                <input type="file" multiple accept="image/*" onChange={handleSinglePhotosUpload} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', zIndex: 10 }} />
                <div style={{ width: '80px', height: '80px', background: '#fef3c7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 4px 12px rgba(245,158,11,0.2)' }}>
                  <User size={40} color="#b45309" />
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#78350f', margin: '0 0 8px 0' }}>Arrastra las 2 fotos del DNI aquí</h3>
                <p style={{ fontSize: '14px', color: '#92400e', margin: 0, fontWeight: '500' }}>Puedes arrastrarlas juntas o una por una (.jpg, .png)</p>
              </div>

              {uploadedPairs.length > 0 && (
                <div className="animate-fade">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                    {uploadedPairs.map((pair, idx) => (
                      <div key={pair.id} style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px 20px', background: 'white', borderRadius: '16px', border: `2px solid ${pair.front && pair.back ? '#86efac' : '#fca5a5'}`, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: pair.front && pair.back ? '#dcfce7' : '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: pair.front && pair.back ? '#166534' : '#991b1b', fontWeight: '800' }}>
                              1
                            </div>
                            <div>
                              <span style={{ display: 'block', fontSize: '16px', fontWeight: '800', color: '#0f172a', marginBottom: '2px' }}>DNI Detectado</span>
                              <span style={{ fontSize: '13px', color: '#64748b' }}>Verifica las fotos y su orden</span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => removePair(pair.id)} style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fee2e2', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}>
                              <Trash2 size={18} color="#ef4444" style={{ flexShrink: 0 }} />
                            </button>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <span style={{ fontSize: '12px', fontWeight: '800', color: pair.front ? '#166534' : '#991b1b', marginBottom: '8px', padding: '4px 10px', background: pair.front ? '#dcfce7' : '#fee2e2', borderRadius: '12px' }}>
                              {pair.front ? 'ANVERSO ✅' : 'ANVERSO ❌'}
                            </span>
                            {pair.front ? (
                              <img src={URL.createObjectURL(pair.front)} style={{ width: '100%', height: '120px', objectFit: 'contain', borderRadius: '8px', backgroundColor: '#fff', border: '1px solid #cbd5e1' }} />
                            ) : (
                              <div style={{ width: '100%', height: '120px', background: '#e2e8f0', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '12px', border: '1px dashed #cbd5e1' }}>Falta Foto</div>
                            )}
                          </div>

                          <button onClick={() => swapSinglePhotos(pair.id)} style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#eff6ff', border: '2px solid #bfdbfe', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', flexShrink: 0, boxShadow: '0 4px 6px -1px rgba(59,130,246,0.2)' }} title="Invertir orden (Anverso/Reverso)">
                            🔄
                          </button>

                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <span style={{ fontSize: '12px', fontWeight: '800', color: pair.back ? '#166534' : '#991b1b', marginBottom: '8px', padding: '4px 10px', background: pair.back ? '#dcfce7' : '#fee2e2', borderRadius: '12px' }}>
                              {pair.back ? 'REVERSO ✅' : 'REVERSO ❌'}
                            </span>
                            {pair.back ? (
                              <img src={URL.createObjectURL(pair.back)} style={{ width: '100%', height: '120px', objectFit: 'contain', borderRadius: '8px', backgroundColor: '#fff', border: '1px solid #cbd5e1' }} />
                            ) : (
                              <div style={{ width: '100%', height: '120px', background: '#e2e8f0', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '12px', border: '1px dashed #cbd5e1' }}>Falta Foto</div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ padding: '16px 28px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafbfc' }}>
              <button type="button" onClick={() => setShowSingleUpload(false)} style={{ padding: '12px 24px', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', color: '#475569', fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}>Cancelar</button>

              <button onClick={processOCRBatch} disabled={isProcessingOcr || uploadedPairs.length === 0 || !(uploadedPairs[0]?.front && uploadedPairs[0]?.back)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 28px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: 'white', fontWeight: '700', cursor: isProcessingOcr || uploadedPairs.length === 0 || !(uploadedPairs[0]?.front && uploadedPairs[0]?.back) ? 'not-allowed' : 'pointer', opacity: isProcessingOcr || uploadedPairs.length === 0 || !(uploadedPairs[0]?.front && uploadedPairs[0]?.back) ? 0.7 : 1, fontSize: '14px', boxShadow: '0 4px 12px rgba(245,158,11,0.3)' }}>
                {isProcessingOcr ? <Loader2 size={16} className="animate-spin" /> : <Activity size={16} />} {isProcessingOcr ? 'Procesando...' : 'Procesar DNI'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ═══ VERIFICATION MODAL ═══ */}
      {showVerification && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, backdropFilter: 'blur(8px)' }}>
          <div style={{ background: 'white', borderRadius: '24px', width: '100%', maxWidth: '1100px', maxHeight: '90vh', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '24px 32px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)' }}>
              <div>
                <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>Verificación de Datos Extraídos</h2>
                <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Revisa y corrige la información detectada antes de registrar a los colaboradores de manera masiva.</p>
              </div>
              <div style={{ padding: '8px 16px', background: '#dbeafe', color: '#1e40af', borderRadius: '20px', fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={18} /> {detectedEmployees.length} Registros detectados
              </div>
            </div>

            <div style={{ padding: '24px 32px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', background: '#f8fafc' }}>
              {detectedEmployees.map((emp, index) => (
                <div key={emp.tempId} style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '16px', boxShadow: '0 4px 12px rgba(29,78,216,0.3)' }}>
                        {index + 1}
                      </div>
                      <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Colaborador {index + 1}</h3>
                    </div>
                    <button 
                      onClick={() => setDetectedEmployees(prev => prev.filter(e => e.tempId !== emp.tempId))} 
                      style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fee2e2', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s', flexShrink: 0 }}
                      title="Eliminar registro"
                    >
                      <Trash2 size={18} style={{ minWidth: '18px', minHeight: '18px', flexShrink: 0 }} />
                    </button>
                  </div>

                  {(emp.frontImageFile || emp.backImageFile) && (
                    <div style={{ display: 'flex', gap: '24px', overflowX: 'auto', paddingBottom: '16px', marginBottom: '24px', alignItems: 'center', justifyContent: 'center' }}>
                      {emp.frontImageFile && (
                        <div style={{ flex: '0 0 auto', position: 'relative', width: '320px', borderRadius: '16px', overflow: 'hidden', border: '4px solid white', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1)', transition: 'transform 0.3s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '8px 16px', background: 'linear-gradient(180deg, rgba(15,23,42,0.85) 0%, transparent 100%)', color: 'white', fontSize: '11px', fontWeight: '800', letterSpacing: '1px', zIndex: 10 }}>FOTO ANVERSO</div>
                          <img src={URL.createObjectURL(emp.frontImageFile)} alt={`DNI Anverso ${index + 1}`} style={{ width: '100%', height: '200px', objectFit: 'contain', display: 'block', backgroundColor: '#f1f5f9' }} />
                          <button onClick={() => setZoomedImage(URL.createObjectURL(emp.frontImageFile))} style={{ position: 'absolute', bottom: '12px', right: '12px', padding: '8px 14px', borderRadius: '10px', background: 'rgba(15,23,42,0.85)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '700', backdropFilter: 'blur(8px)', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.2)' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(15,23,42,1)'; e.currentTarget.style.transform = 'scale(1.05)' }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(15,23,42,0.85)'; e.currentTarget.style.transform = 'scale(1)' }}>
                            <ZoomIn size={14} /> Ampliar
                          </button>
                        </div>
                      )}
                      {emp.backImageFile && (
                        <div style={{ flex: '0 0 auto', position: 'relative', width: '320px', borderRadius: '16px', overflow: 'hidden', border: '4px solid white', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1)', transition: 'transform 0.3s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '8px 16px', background: 'linear-gradient(180deg, rgba(15,23,42,0.85) 0%, transparent 100%)', color: 'white', fontSize: '11px', fontWeight: '800', letterSpacing: '1px', zIndex: 10 }}>FOTO REVERSO</div>
                          <img src={URL.createObjectURL(emp.backImageFile)} alt={`DNI Reverso ${index + 1}`} style={{ width: '100%', height: '200px', objectFit: 'contain', display: 'block', backgroundColor: '#f1f5f9' }} />
                          <button onClick={() => setZoomedImage(URL.createObjectURL(emp.backImageFile))} style={{ position: 'absolute', bottom: '12px', right: '12px', padding: '8px 14px', borderRadius: '10px', background: 'rgba(15,23,42,0.85)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '700', backdropFilter: 'blur(8px)', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.2)' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(15,23,42,1)'; e.currentTarget.style.transform = 'scale(1.05)' }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(15,23,42,0.85)'; e.currentTarget.style.transform = 'scale(1)' }}>
                            <ZoomIn size={14} /> Ampliar
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                    <FormInput label="Nombres" value={emp.nombres} onChange={e => handleUpdateDetected(index, 'nombres', e.target.value)} />
                    <FormInput label="A. Paterno" value={emp.apellidoPaterno} onChange={e => handleUpdateDetected(index, 'apellidoPaterno', e.target.value)} />
                    <FormInput label="A. Materno" value={emp.apellidoMaterno} onChange={e => handleUpdateDetected(index, 'apellidoMaterno', e.target.value)} />
                    <FormInput label="Número DNI" value={emp.numeroDni} onChange={e => handleUpdateDetected(index, 'numeroDni', e.target.value)} />
                    <FormInput label="Fecha Nac." value={emp.fechaNacimiento} onChange={e => handleUpdateDetected(index, 'fechaNacimiento', e.target.value)} />
                    <FormInput label="Sexo" value={emp.sexo} onChange={e => handleUpdateDetected(index, 'sexo', e.target.value)} />
                    <FormInput label="Estado Civil" value={emp.estadoCivil} onChange={e => handleUpdateDetected(index, 'estadoCivil', e.target.value)} />
                    <FormInput label="Dirección" value={emp.direccion} onChange={e => handleUpdateDetected(index, 'direccion', e.target.value)} />
                    <FormInput label="Departamento" value={emp.departamento} onChange={e => handleUpdateDetected(index, 'departamento', e.target.value)} />
                    <FormInput label="Provincia" value={emp.provincia} onChange={e => handleUpdateDetected(index, 'provincia', e.target.value)} />
                    <FormInput label="Distrito" value={emp.distrito} onChange={e => handleUpdateDetected(index, 'distrito', e.target.value)} />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ padding: '20px 32px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white' }}>
              <button type="button" onClick={() => setShowVerification(false)} style={{ padding: '12px 28px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#475569', fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}>Descartar Todo</button>

              <button onClick={handleSaveVerification} disabled={isSaving} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 32px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white', fontWeight: '800', cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? 0.7 : 1, fontSize: '15px', boxShadow: '0 4px 15px rgba(37,99,235,0.4)' }}>
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />} {isSaving ? 'Registrando...' : 'Confirmar y Registrar Todos'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ═══ FULL SCREEN IMAGE ZOOM MODAL ═══ */}
      {zoomedImage && createPortal(
        <div
          onClick={() => setZoomedImage(null)}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999999, backdropFilter: 'blur(10px)', cursor: 'zoom-out' }}
        >
          <button onClick={() => setZoomedImage(null)} style={{ position: 'absolute', top: '24px', right: '24px', width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s', fontSize: '24px' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
            ❌
          </button>
          <img src={zoomedImage} alt="Zoom DNI" style={{ maxWidth: '90%', maxHeight: '90vh', objectFit: 'contain', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', animation: 'fadeIn 0.2s ease-out' }} />
        </div>,
        document.body
      )}

      {/* ═══ MODERN OCR LOADING MODAL ═══ */}
      {isProcessingOcr && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999999, backdropFilter: 'blur(8px)', animation: 'fadeIn 0.3s ease-out' }}>
          <div style={{ background: 'white', borderRadius: '24px', padding: '48px 64px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)', transform: 'scale(1)', animation: 'zoomIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
            
            <div style={{ position: 'relative', width: '96px', height: '96px', marginBottom: '32px' }}>
              <div style={{ position: 'absolute', inset: 0, border: '4px solid #f1f5f9', borderRadius: '50%' }}></div>
              <div style={{ position: 'absolute', inset: 0, border: '4px solid transparent', borderTopColor: '#3b82f6', borderRightColor: '#60a5fa', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              <div style={{ position: 'absolute', inset: '16px', background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)' }}>
                <Scan size={32} color="#2563eb" className="animate-pulse" />
              </div>
            </div>

            <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '0 0 12px 0', textAlign: 'center', letterSpacing: '-0.5px' }}>
              {loadingMessages[loadingMessageIdx] || "Extrayendo Información..."}
            </h3>
            
            <p style={{ fontSize: '15px', color: '#64748b', margin: '0 0 24px 0', textAlign: 'center', maxWidth: '320px', lineHeight: '1.5' }}>
              Nuestra IA está analizando los DNI para capturar los datos con máxima precisión. No cierres esta ventana.
            </p>

            <div style={{ width: '100%', height: '6px', background: '#f1f5f9', borderRadius: '100px', overflow: 'hidden' }}>
              <div style={{ width: `${ocrProgress.total > 0 ? (ocrProgress.current / ocrProgress.total) * 100 : 40}%`, height: '100%', background: 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)', borderRadius: '100px', animation: ocrProgress.total > 0 ? 'shimmer 2s infinite linear' : 'shimmer 2s infinite linear, moveRight 2s infinite ease-in-out alternate', transition: 'width 0.4s ease-out' }}></div>
            </div>

            {ocrProgress.total > 0 && (
              <p style={{ fontSize: '14px', fontWeight: '700', color: '#3b82f6', marginTop: '16px', textAlign: 'center' }}>
                {ocrProgress.current} documento{ocrProgress.current !== 1 ? 's' : ''} analizado{ocrProgress.current !== 1 ? 's' : ''} de {ocrProgress.total}...
              </p>
            )}
            
            <style>
              {`
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.7; transform: scale(0.95); } }
                @keyframes shimmer { 0% { opacity: 0.8; } 50% { opacity: 1; } 100% { opacity: 0.8; } }
                @keyframes moveRight { 0% { transform: translateX(-50%); } 100% { transform: translateX(200%); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes zoomIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
              `}
            </style>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
