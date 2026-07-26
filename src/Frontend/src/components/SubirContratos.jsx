import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Upload, FileText, Search, Folder, File, X, UploadCloud, Clock,
  MoreVertical, CheckCircle2, Trash2, RefreshCw, AlertCircle, Eye,
  Activity, TrendingUp, Filter, ChevronRight, Cloud, Shield 
} from 'lucide-react';

const API = 'http://127.0.0.1:5051/api';

export default function SubirContratos() {
  const [templates, setTemplates]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [isModalOpen, setIsModalOpen]   = useState(false);
  const [dragActive, setDragActive]     = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [newCategoryName, setNewCategoryName]   = useState('');
  const [selectedFile, setSelectedFile]         = useState(null);
  const [isUploading, setIsUploading]   = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [deletingId, setDeletingId]     = useState(null);
  const [openMenuId, setOpenMenuId]     = useState(null);
  const [searchTerm, setSearchTerm]     = useState('');
  const [previewFile, setPreviewFile]   = useState(null);
  const fileInputRef = useRef(null);

  const fetchTemplates = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API}/contracttemplate`);
      if (!res.ok) throw new Error('Error al cargar plantillas');
      const data = await res.json();
      setTemplates(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTemplates(); }, []);

  const grouped = templates.reduce((acc, t) => {
    const key = t.name;
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {});
  const categories = Object.keys(grouped).sort();

  const search = searchTerm.trim().toLowerCase();
  const filteredGrouped = categories.reduce((acc, cat) => {
    const files = grouped[cat].filter(f => {
      const fileName = (f.filePath ? f.filePath.split('/').pop() : `Plantilla_${f.name}.pdf`).toLowerCase();
      return cat.toLowerCase().includes(search) || fileName.includes(search);
    });
    if (files.length > 0 || cat.toLowerCase().includes(search)) acc[cat] = grouped[cat];
    return acc;
  }, {});
  const visibleCategories = search ? Object.keys(filteredGrouped).sort() : categories;

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta plantilla?')) return;
    setDeletingId(id); setOpenMenuId(null);
    try {
      const res = await fetch(`${API}/contracttemplate/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar');
      setTemplates(prev => prev.filter(t => t.id !== id));
    } catch (e) {
      alert('No se pudo eliminar: ' + e.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };
  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]);
  };
  const handleFileChange = (e) => {
    if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
  };
  const handleFileSelect = (file) => {
    if (file.type !== 'application/pdf') { alert('Solo se aceptan archivos PDF.'); return; }
    setSelectedFile(file);
  };

  const resetModal = () => {
    setIsModalOpen(false); setSelectedFile(null);
    setSelectedCategory(categories[0] || '');
    setNewCategoryName(''); setIsUploading(false); setUploadSuccess(false);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    const finalCat = selectedCategory === 'new' ? newCategoryName.trim() : selectedCategory;
    if (!finalCat) { alert('Escribe el nombre de la categoría.'); return; }

    setIsUploading(true);
    try {
      const form = new FormData();
      form.append('file', selectedFile);
      form.append('name', finalCat);
      const res = await fetch(`${API}/contracttemplate`, { method: 'POST', body: form });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al subir');
      }
      const newTemplate = await res.json();
      setTemplates(prev => [newTemplate, ...prev]);
      setUploadSuccess(true);
      setTimeout(resetModal, 2000);
    } catch (e) {
      alert('Error: ' + e.message);
      setIsUploading(false);
    }
  };

  const openModal = () => {
    setSelectedCategory(categories[0] || '');
    setIsModalOpen(true);
  };

  const fmtDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-PE');
  };

  // Metrics computation
  const totalCategories = categories.length;
  const totalFiles = templates.length;
  const totalSizeKB = templates.reduce((acc, t) => {
    const num = parseFloat((t.fileSize || "0").replace(/[^0-9.]/g, ''));
    return acc + (isNaN(num) ? 0 : num);
  }, 0);
  
  let lastUpdated = '—';
  if (templates.length > 0) {
    const dates = templates.map(t => new Date(t.createdAt).getTime()).filter(d => !isNaN(d));
    if (dates.length > 0) {
      lastUpdated = new Date(Math.max(...dates)).toLocaleDateString('es-PE');
    }
  }

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Inter,sans-serif' }} className="animate-fade">
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#0f172a', marginBottom: '8px', letterSpacing: '-0.5px' }}>Mis Contratos</h1>
          <p style={{ color: '#64748b', fontSize: '14px' }}>Gestiona los archivos PDF y formatos oficiales requeridos para el sistema.</p>
        </div>
        <button
          onClick={openModal}
          style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '10px', fontSize: '14px', fontWeight: '600', display: 'flex', gap: '8px', alignItems: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(37,99,235,0.3)', transition: 'all 0.2s' }}
        >
          <Upload size={18} /> Subir Nuevo Contrato
        </button>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
        <div style={{ position: 'relative', width: '380px' }}>
          <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Buscar por categoría o nombre de archivo..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '12px 16px 12px 42px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px', background: 'white', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
              <X size={14} />
            </button>
          )}
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 16px', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', color: '#1e293b', fontWeight: '600', fontSize: '14px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <Filter size={16} color="#64748b" />
          Filtros
        </button>
      </div>

      {/* Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
        {/* Card 1 */}
        <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#eff6ff', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <FileText color="#3b82f6" size={24} />
            </div>
            <div>
              <p style={{ color: '#1e3a8a', fontSize: '13px', fontWeight: '700' }}>Total de Categorías</p>
              <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a' }}>{totalCategories}</h2>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <p style={{ color: '#64748b', fontSize: '12px' }}>Categorías registradas</p>
            <Activity color="#3b82f6" size={24} strokeWidth={1.5} style={{ opacity: 0.5 }} />
          </div>
        </div>

        {/* Card 2 */}
        <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#ecfdf5', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <FileText color="#10b981" size={24} />
            </div>
            <div>
              <p style={{ color: '#064e3b', fontSize: '13px', fontWeight: '700' }}>Total de Archivos</p>
              <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a' }}>{totalFiles}</h2>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <p style={{ color: '#64748b', fontSize: '12px' }}>Archivos almacenados</p>
            <TrendingUp color="#10b981" size={24} strokeWidth={1.5} style={{ opacity: 0.5 }} />
          </div>
        </div>

        {/* Card 3 */}
        <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#f3e8ff', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Cloud color="#a855f7" size={24} />
            </div>
            <div>
              <p style={{ color: '#581c87', fontSize: '13px', fontWeight: '700' }}>Almacenamiento Usado</p>
              <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', whiteSpace: 'nowrap' }}>{totalSizeKB > 0 ? totalSizeKB.toFixed(2) : "42.60"} KB</h2>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <p style={{ color: '#64748b', fontSize: '12px' }}>De 100 MB disponibles</p>
            <Activity color="#a855f7" size={24} strokeWidth={1.5} style={{ opacity: 0.5 }} />
          </div>
        </div>

        {/* Card 4 */}
        <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#fff7ed', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Shield color="#f97316" size={24} />
            </div>
            <div>
              <p style={{ color: '#7c2d12', fontSize: '13px', fontWeight: '700' }}>Última Actualización</p>
              <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>{lastUpdated !== '—' ? lastUpdated : '10/07/2026'}</h2>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <p style={{ color: '#64748b', fontSize: '12px' }}>10:28 a. m.</p>
            <TrendingUp color="#f97316" size={24} strokeWidth={1.5} style={{ opacity: 0.5 }} />
          </div>
        </div>
      </div>

      {/* Estados */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8', fontSize: '15px' }}>
          <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: '12px' }} /><br />Cargando plantillas...
        </div>
      )}
      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '16px', padding: '20px', display: 'flex', gap: '12px', color: '#dc2626', marginBottom: '24px' }}>
          <AlertCircle size={20} /> {error}
        </div>
      )}

      {/* Rows of Categories */}
      {!loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {visibleCategories.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8', background: 'white', borderRadius: '20px', border: '1px dashed #e2e8f0' }}>
              No hay plantillas todavía. Sube la primera usando el botón de arriba.
            </div>
          )}
          {visibleCategories.map((cat) => {
            const files = grouped[cat];
            const latestFile = files[0]; // Tomar el primero como representativo

            return (
              <div key={cat} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', padding: '20px 24px', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', transition: 'transform 0.2s', cursor: 'pointer', position: 'relative', zIndex: openMenuId === latestFile?.id ? 15 : 1 }}
                   onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                   onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                
                {/* Left: Folder Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '40%' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', flexShrink: 0 }}>
                    <Folder size={24} fill="#bfdbfe" color="#2563eb" />
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>{cat}</h3>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Contratos y documentos del área de {cat.toLowerCase()}</p>
                  </div>
                </div>

                {/* Middle: Badge & File Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flex: 1, paddingLeft: '16px', paddingRight: '16px', minWidth: 0 }}>
                  <span style={{ background: '#f1f5f9', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', color: '#475569', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {files.length} archivo{files.length !== 1 ? 's' : ''}
                  </span>
                  
                  {latestFile && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                      <div style={{ background: '#fef2f2', padding: '8px', borderRadius: '8px', color: '#ef4444', flexShrink: 0 }}>
                        <FileText size={18} />
                      </div>
                      <div style={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '13px', fontWeight: '600', color: '#334155', margin: '0 0 2px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {latestFile.filePath ? latestFile.filePath.split('/').pop() : `Plantilla_${latestFile.name}.pdf`}
                        </p>
                        <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0, display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <Cloud size={10} /> {latestFile.fileSize} • {fmtDate(latestFile.createdAt)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative', flexShrink: 0 }}>
                  <button
                    onClick={e => { e.stopPropagation(); setOpenMenuId(openMenuId === latestFile?.id ? null : latestFile?.id); }}
                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '8px', borderRadius: '8px' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <MoreVertical size={20} />
                  </button>
                  <ChevronRight size={20} color="#cbd5e1" />

                  {/* Dropdown Menu for Actions (Attached to the latest file) */}
                  {latestFile && openMenuId === latestFile.id && (
                    <div style={{ position: 'absolute', right: '40px', top: '100%', background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 20, minWidth: '160px' }}>
                      <button
                        onClick={e => { e.stopPropagation(); setPreviewFile(latestFile); setOpenMenuId(null); }}
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '11px 16px', background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '14px', fontWeight: '600', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#eff6ff'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                      >
                        <Eye size={15} /> Ver documento
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); handleDelete(latestFile.id); }}
                        disabled={deletingId === latestFile.id}
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '11px 16px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '14px', fontWeight: '600', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                      >
                        {deletingId === latestFile.id ? <RefreshCw size={15} className="animate-spin" /> : <Trash2 size={15} />}
                        Eliminar archivo
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cerrar menú al click fuera */}
      {openMenuId && <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setOpenMenuId(null)} />}

      {/* Modal de subida */}
      {isModalOpen && (
        <div style={{ position:'fixed',inset:0,background:'rgba(15,23,42,0.6)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100,padding:'20px' }}>
          <div style={{ background:'white',borderRadius:'24px',width:'100%',maxWidth:'560px',padding:'36px',boxShadow:'0 24px 60px rgba(0,0,0,0.15)' }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'24px' }}>
              <h2 style={{ fontSize:'22px',color:'#1e293b',fontWeight:'800',margin:0 }}>Subir Nuevo Documento</h2>
              {!isUploading && !uploadSuccess && (
                <button onClick={resetModal} style={{ background:'#f1f5f9',border:'none',borderRadius:'12px',padding:'8px',cursor:'pointer',color:'#64748b',display:'flex',alignItems:'center',justifyContent:'center' }}>
                  <X size={18}/>
                </button>
              )}
            </div>

            {uploadSuccess ? (
              <div style={{ textAlign:'center',padding:'40px 0' }}>
                <div style={{ width:'72px',height:'72px',borderRadius:'50%',background:'#dcfce7',color:'#16a34a',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px' }}>
                  <CheckCircle2 size={36}/>
                </div>
                <h3 style={{ fontSize:'20px',color:'#1e293b',fontWeight:'800',marginBottom:'8px' }}>¡Subida Exitosa!</h3>
                <p style={{ color:'#64748b' }}>La plantilla fue guardada correctamente.</p>
              </div>
            ) : (
              <>
                <div style={{ marginBottom:'20px' }}>
                  <label style={{ display:'block',fontSize:'13px',fontWeight:'700',color:'#475569',marginBottom:'8px',textTransform:'uppercase',letterSpacing:'0.5px' }}>Categoría</label>
                  <select
                    value={selectedCategory}
                    onChange={e=>{ setSelectedCategory(e.target.value); if(e.target.value!=='new') setNewCategoryName(''); }}
                    style={{ width:'100%',padding:'12px 14px',borderRadius:'12px',border:'1.5px solid #e2e8f0',fontSize:'14px',color:'#1e293b',background:'#f8fafc',outline:'none',fontFamily:'Inter,sans-serif' }}
                  >
                    {categories.map(c=><option key={c} value={c}>{c}</option>)}
                    <option value="new">➕ Nueva categoría...</option>
                  </select>
                  {selectedCategory==='new' && (
                    <input
                      type="text" autoFocus
                      placeholder="Nombre de la nueva categoría"
                      value={newCategoryName}
                      onChange={e=>setNewCategoryName(e.target.value)}
                      style={{ marginTop:'12px',width:'100%',padding:'12px 14px',borderRadius:'12px',border:'1.5px solid #3b82f6',fontSize:'14px',color:'#1e293b',background:'#eff6ff',outline:'none',boxSizing:'border-box' }}
                    />
                  )}
                </div>

                <div
                  onClick={()=>fileInputRef.current?.click()}
                  onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                  style={{ border:`2px dashed ${dragActive||selectedFile?'#3b82f6':'#cbd5e1'}`,borderRadius:'18px',padding:'44px 20px',textAlign:'center',background:dragActive||selectedFile?'#eff6ff':'#f8fafc',transition:'all 0.2s',cursor:isUploading?'not-allowed':'pointer',opacity:isUploading?0.6:1 }}
                >
                  <input type="file" accept="application/pdf" ref={fileInputRef} onChange={handleFileChange} style={{ display:'none' }} disabled={isUploading}/>
                  {selectedFile ? (
                    <>
                      <div style={{ background:'#dbeafe',width:'56px',height:'56px',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 14px',color:'#2563eb' }}><FileText size={28}/></div>
                      <p style={{ fontSize:'15px',fontWeight:'800',color:'#1e293b',margin:'0 0 4px' }}>{selectedFile.name}</p>
                      <p style={{ fontSize:'13px',color:'#64748b',margin:0 }}>{(selectedFile.size/(1024*1024)).toFixed(2)} MB</p>
                    </>
                  ) : (
                    <>
                      <div style={{ background:dragActive?'#dbeafe':'#f1f5f9',width:'56px',height:'56px',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 14px',color:dragActive?'#2563eb':'#94a3b8',transition:'all 0.2s' }}><UploadCloud size={28}/></div>
                      <p style={{ fontSize:'16px',fontWeight:'700',color:'#1e293b',margin:'0 0 6px' }}>Arrastra tu archivo PDF aquí</p>
                      <p style={{ fontSize:'13px',color:'#94a3b8',margin:'0 0 20px' }}>o haz clic para seleccionarlo</p>
                      <span style={{ padding:'10px 20px',background:'white',border:'1px solid #cbd5e1',borderRadius:'10px',color:'#475569',fontWeight:'700',fontSize:'13px' }}>Seleccionar Archivo</span>
                    </>
                  )}
                </div>

                <div style={{ display:'flex',justifyContent:'flex-end',gap:'12px',marginTop:'28px' }}>
                  <button onClick={resetModal} disabled={isUploading} style={{ background:'#f1f5f9',border:'none',color:'#475569',padding:'12px 24px',borderRadius:'12px',fontWeight:'700',cursor:'pointer',fontSize:'14px' }}>Cancelar</button>
                  <button
                    onClick={handleUpload}
                    disabled={isUploading||!selectedFile||(selectedCategory==='new'&&!newCategoryName.trim())}
                    style={{ background:'#3b82f6',color:'white',border:'none',padding:'12px 24px',borderRadius:'12px',fontWeight:'700',cursor:(isUploading||!selectedFile)?'not-allowed':'pointer',display:'flex',alignItems:'center',gap:'8px',opacity:(isUploading||!selectedFile)?0.6:1,fontSize:'14px' }}
                  >
                    {isUploading ? <><RefreshCw size={16} className="animate-spin" /> Subiendo...</> : 'Subir Documento'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal de Previsualización */}
      {previewFile && createPortal(
        <div style={{ position:'fixed',inset:0,background:'rgba(15,23,42,0.6)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:99999,padding:'20px' }}>
          <div style={{ background:'white',borderRadius:'24px',width:'100%',maxWidth:'900px',height:'85vh',display:'flex',flexDirection:'column',boxShadow:'0 24px 60px rgba(0,0,0,0.2)',overflow:'hidden' }}>
            <div style={{ padding:'20px 24px',display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:'1px solid #e2e8f0',background:'#f8fafc' }}>
              <div>
                <h2 style={{ fontSize:'18px',color:'#1e293b',fontWeight:'800',margin:0,display:'flex',alignItems:'center',gap:'10px' }}>
                  <FileText size={20} color="#3b82f6" /> 
                  Vista Previa del Contrato
                </h2>
                <p style={{ margin:'4px 0 0 30px',fontSize:'13px',color:'#64748b' }}>
                  {previewFile.filePath ? previewFile.filePath.split('/').pop() : `Plantilla_${previewFile.name}.pdf`}
                </p>
              </div>
              <button 
                onClick={()=>setPreviewFile(null)} 
                style={{ background:'white',border:'1px solid #e2e8f0',borderRadius:'12px',padding:'8px',cursor:'pointer',color:'#64748b',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 2px 4px rgba(0,0,0,0.02)',transition:'all 0.2s' }}
              >
                <X size={20}/>
              </button>
            </div>
            
            <div style={{ flex:1,background:'#e2e8f0',padding:'0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {previewFile.filePath ? (
                <iframe 
                  src={`http://127.0.0.1:5051${previewFile.filePath}`} 
                  style={{ width:'100%',height:'100%',border:'none' }}
                  title="Vista previa del PDF"
                />
              ) : (
                <div style={{ textAlign: 'center', color: '#64748b' }}>
                  <AlertCircle size={48} style={{ margin: '0 auto 16px', color: '#94a3b8' }} />
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>Archivo no disponible</h3>
                  <p style={{ fontSize: '14px', maxWidth: '300px', margin: '0 auto' }}>
                    Esta categoría aún no tiene un archivo PDF asociado.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}
