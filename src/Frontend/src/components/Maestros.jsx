import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Settings, Save, Trash2, Edit2, Plus, AlertCircle, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

export default function Maestros() {
  const { tab } = useParams();
  const activeTab = tab || 'cargos';
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [editingItem, setEditingItem] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingTarget, setEditingTarget] = useState('master'); // 'master' | 'detail'
  
  // Master-Detail specific state
  const [selectedMasterId, setSelectedMasterId] = useState(null);
  const [selectedMasterItem, setSelectedMasterItem] = useState(null);
  const [detailData, setDetailData] = useState([]);
  
  const [cargosList, setCargosList] = useState([]);
  const [areasList, setAreasList] = useState([]);
  const [nivelesList, setNivelesList] = useState([]);

  useEffect(() => {
    fetchData(activeTab);
    if (activeTab === 'contratos') {
      fetchCargosList();
    }
    if (activeTab === 'cargos') {
      fetchAreasAndNiveles();
    }
  }, [activeTab]);

  const fetchData = async (currentTab) => {
    setLoading(true);
    setError('');
    setSelectedMasterId(null);
    setSelectedMasterItem(null);
    setDetailData([]);
    try {
      let url = `http://localhost:5051/api/master/${currentTab}`;
      if (currentTab === 'empleados') {
        url = `http://localhost:5051/api/employee`;
      }
      const res = await axios.get(url);
      setData(res.data);
    } catch (err) {
      setError('Error al cargar datos de ' + currentTab);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCargosList = async () => {
    try {
      const res = await axios.get(`http://localhost:5051/api/master/cargos`);
      setCargosList(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAreasAndNiveles = async () => {
    try {
      const res = await axios.get(`http://localhost:5051/api/master/definicion-detalles`);
      const allDetalles = res.data;
      setAreasList(allDetalles.filter(d => d.definicionCodigo === 'AREA'));
      setNivelesList(allDetalles.filter(d => d.definicionCodigo === 'NIVEL'));
    } catch (err) {
      console.error(err);
    }
  };

  const loadDetailData = async (item) => {
    const id = item.codigo || item.Codigo || item.id || item.Id;
    setSelectedMasterId(id);
    setSelectedMasterItem(item);
    setDetailData([]);
    
    try {
      if (activeTab === 'definiciones') {
        const res = await axios.get(`http://localhost:5051/api/master/definicion-detalles`);
        const code = item.codigo || item.Codigo;
        setDetailData(res.data.filter(d => d.definicionCodigo === code));
      } else if (activeTab === 'empleados') {
        const res = await axios.get(`http://localhost:5051/api/master/usuarios`);
        const userId = item.userId || item.UserId;
        if (userId) {
          const user = res.data.find(u => u.id === userId || u.Id === userId);
          if (user) setDetailData([user]);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      let endpoint = activeTab;
      let baseUrl = 'http://localhost:5051/api/master';
      
      if (editingTarget === 'detail') {
        if (activeTab === 'definiciones') endpoint = 'definicion-detalles';
        if (activeTab === 'empleados') endpoint = 'usuarios';
      }

      if (isAdding) {
        if (editingTarget === 'detail' && activeTab === 'definiciones') {
          editingItem.definicionCodigo = selectedMasterId;
        }
        await axios.post(`${baseUrl}/${endpoint}`, editingItem);
      } else {
        let idParam = editingItem.id || editingItem.Id;
        if (endpoint === 'definiciones') idParam = editingItem.codigo || editingItem.Codigo;
        await axios.put(`${baseUrl}/${endpoint}/${idParam}`, editingItem);
      }

      setEditingItem(null);
      setIsAdding(false);
      
      if (editingTarget === 'master') {
        fetchData(activeTab);
      } else {
        loadDetailData(selectedMasterItem);
      }
    } catch (err) {
      setError('Error al guardar. Verifica los datos.');
    }
  };

  const handleDelete = async (id, target = 'master') => {
    if (!window.confirm('¿Estás seguro de eliminar este registro?')) return;
    try {
      let endpoint = activeTab;
      if (target === 'detail') {
        if (activeTab === 'definiciones') endpoint = 'definicion-detalles';
        if (activeTab === 'empleados') endpoint = 'usuarios';
      }

      await axios.delete(`http://localhost:5051/api/master/${endpoint}/${id}`);
      
      if (target === 'master') {
        if (id === selectedMasterId) setSelectedMasterId(null);
        fetchData(activeTab);
      } else {
        loadDetailData(selectedMasterItem);
      }
    } catch (err) {
      if (err.response && err.response.data && typeof err.response.data === 'string') {
        setError(err.response.data);
      } else {
        setError('Error al eliminar el registro.');
      }
    }
  };

  const renderTableData = (tableData, target = 'master') => {
    if (tableData.length === 0) return <p style={{ padding: '16px', color: '#64748b' }}>No hay datos.</p>;

    const keys = Object.keys(tableData[0]).filter(k => 
      !['createdat', 'createdby', 'modifiedat', 'modifiedby', 'areaid', 'nivelid', 'cargoid', 'userid', 'filepath', 'passwordhash', 'passwordsalt'].includes(k.toLowerCase())
    );
    
    return (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {keys.map(k => (
                <th key={k} style={{ padding: '12px', textAlign: 'left', color: '#64748b', textTransform: 'capitalize', fontSize: '13px' }}>{k}</th>
              ))}
              <th style={{ padding: '12px', textAlign: 'right', color: '#64748b', fontSize: '13px' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((item, idx) => {
              const itemId = item.id || item.Id || item.codigo || item.Codigo;
              const isSelected = target === 'master' && itemId === selectedMasterId;
              
              return (
                <tr 
                  key={itemId || idx} 
                  onClick={() => target === 'master' && (activeTab === 'definiciones' || activeTab === 'empleados') ? loadDetailData(item) : null}
                  style={{ 
                    borderBottom: '1px solid #f1f5f9', 
                    background: isSelected ? '#ecfdf5' : 'white',
                    cursor: target === 'master' && (activeTab === 'definiciones' || activeTab === 'empleados') ? 'pointer' : 'default',
                    transition: 'background 0.2s'
                  }}
                >
                  {keys.map(k => (
                    <td key={k} style={{ padding: '12px', fontSize: '14px', color: '#334155' }}>
                      {typeof item[k] === 'boolean' ? (
                        <span style={{ padding: '4px 8px', borderRadius: '4px', background: item[k] ? '#dcfce7' : '#fee2e2', color: item[k] ? '#166534' : '#991b1b', fontSize: '12px', fontWeight: 'bold' }}>
                          {item[k] ? 'SÍ' : 'NO'}
                        </span>
                      ) : 
                       (typeof item[k] === 'object' && item[k] !== null ? JSON.stringify(item[k]) : String(item[k] || '-'))}
                    </td>
                  ))}
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    {!(target === 'master' && activeTab === 'empleados') && (
                      <>
                        <button onClick={(e) => { e.stopPropagation(); setEditingItem(item); setIsAdding(false); setEditingTarget(target); }} style={{ background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer', marginRight: '8px' }}>
                          <Edit2 size={18} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(itemId, target); }} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderForm = () => {
    if (!editingItem && !isAdding) return null;

    let endpoint = activeTab;
    if (editingTarget === 'detail') {
      endpoint = activeTab === 'definiciones' ? 'definicion-detalles' : 'usuarios';
    }

    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
        <div style={{ background: 'white', padding: '32px', borderRadius: '16px', width: '500px', maxWidth: '90%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
          <h2 style={{ margin: '0 0 24px 0', color: '#0f172a' }}>{isAdding ? 'Nuevo Registro' : 'Editar Registro'}</h2>
          
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {endpoint === 'cargos' && (
              <>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#475569', fontWeight: 'bold', fontSize: '13px' }}>Nombre del Cargo</label>
                  <input required type="text" value={editingItem?.nombre || ''} onChange={(e) => setEditingItem({...editingItem, nombre: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#475569', fontWeight: 'bold', fontSize: '13px' }}>Descripción</label>
                  <input type="text" value={editingItem?.descripcion || ''} onChange={(e) => setEditingItem({...editingItem, descripcion: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#475569', fontWeight: 'bold', fontSize: '13px' }}>Área</label>
                  <select required value={editingItem?.areaId || ''} onChange={(e) => setEditingItem({...editingItem, areaId: e.target.value ? parseInt(e.target.value) : null})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                    <option value="">-- Seleccionar Área --</option>
                    {areasList.map(a => (
                      <option key={a.id} value={a.id}>{a.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#475569', fontWeight: 'bold', fontSize: '13px' }}>Nivel</label>
                  <select required value={editingItem?.nivelId || ''} onChange={(e) => setEditingItem({...editingItem, nivelId: e.target.value ? parseInt(e.target.value) : null})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                    <option value="">-- Seleccionar Nivel --</option>
                    {nivelesList.map(n => (
                      <option key={n.id} value={n.id}>{n.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#475569', fontWeight: 'bold', fontSize: '13px' }}>Sueldo Base (S/)</label>
                  <input required type="number" step="0.01" value={editingItem?.sueldoBase || 0} onChange={(e) => setEditingItem({...editingItem, sueldoBase: parseFloat(e.target.value)})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                </div>
              </>
            )}

            {endpoint === 'contratos' && (
              <>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#475569', fontWeight: 'bold', fontSize: '13px' }}>Nombre del Contrato</label>
                  <input required type="text" value={editingItem?.name || ''} onChange={(e) => setEditingItem({...editingItem, name: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#475569', fontWeight: 'bold', fontSize: '13px' }}>Cargo Automático</label>
                  <select value={editingItem?.cargoId || ''} onChange={(e) => setEditingItem({...editingItem, cargoId: e.target.value ? parseInt(e.target.value) : null})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                    <option value="">-- Seleccionar Cargo --</option>
                    {cargosList.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {endpoint === 'definiciones' && (
              <>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#475569', fontWeight: 'bold', fontSize: '13px' }}>Código</label>
                  <input required type="text" disabled={!isAdding} value={editingItem?.codigo || ''} onChange={(e) => setEditingItem({...editingItem, codigo: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: !isAdding ? '#f1f5f9' : 'white' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#475569', fontWeight: 'bold', fontSize: '13px' }}>Nombre</label>
                  <input required type="text" value={editingItem?.nombre || ''} onChange={(e) => setEditingItem({...editingItem, nombre: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#475569', fontWeight: 'bold', fontSize: '13px' }}>Descripción</label>
                  <input type="text" value={editingItem?.descripcion || ''} onChange={(e) => setEditingItem({...editingItem, descripcion: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569', fontWeight: 'bold', fontSize: '13px' }}>
                    <input type="checkbox" checked={editingItem?.activo ?? true} onChange={(e) => setEditingItem({...editingItem, activo: e.target.checked})} />
                    Activo
                  </label>
                </div>
              </>
            )}
            
            {endpoint === 'definicion-detalles' && (
              <>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#475569', fontWeight: 'bold', fontSize: '13px' }}>Valor</label>
                  <input required type="text" value={editingItem?.valor || ''} onChange={(e) => setEditingItem({...editingItem, valor: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#475569', fontWeight: 'bold', fontSize: '13px' }}>Nombre/Descripción</label>
                  <input required type="text" value={editingItem?.nombre || ''} onChange={(e) => setEditingItem({...editingItem, nombre: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569', fontWeight: 'bold', fontSize: '13px' }}>
                    <input type="checkbox" checked={editingItem?.activo ?? true} onChange={(e) => setEditingItem({...editingItem, activo: e.target.checked})} />
                    Activo
                  </label>
                </div>
              </>
            )}

            {endpoint === 'ubigeos' && (
              <>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#475569', fontWeight: 'bold', fontSize: '13px' }}>Departamento</label>
                  <input required type="text" value={editingItem?.departamento || ''} onChange={(e) => setEditingItem({...editingItem, departamento: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#475569', fontWeight: 'bold', fontSize: '13px' }}>Provincia</label>
                  <input required type="text" value={editingItem?.provincia || ''} onChange={(e) => setEditingItem({...editingItem, provincia: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#475569', fontWeight: 'bold', fontSize: '13px' }}>Distrito</label>
                  <input required type="text" value={editingItem?.distrito || ''} onChange={(e) => setEditingItem({...editingItem, distrito: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                </div>
              </>
            )}

            {endpoint === 'usuarios' && (
              <>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#475569', fontWeight: 'bold', fontSize: '13px' }}>DNI</label>
                  <input required type="text" value={editingItem?.dni || editingItem?.Dni || ''} onChange={(e) => setEditingItem({...editingItem, dni: e.target.value, Dni: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#475569', fontWeight: 'bold', fontSize: '13px' }}>Email</label>
                  <input required type="email" value={editingItem?.email || editingItem?.Email || ''} onChange={(e) => setEditingItem({...editingItem, email: e.target.value, Email: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#475569', fontWeight: 'bold', fontSize: '13px' }}>Rol</label>
                  <select value={editingItem?.rol || editingItem?.Rol || 'Colaborador'} onChange={(e) => setEditingItem({...editingItem, rol: e.target.value, Rol: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                    <option value="Colaborador">Colaborador</option>
                    <option value="Admin">Admin</option>
                    <option value="Recursos Humanos">Recursos Humanos</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569', fontWeight: 'bold', fontSize: '13px' }}>
                    <input type="checkbox" checked={editingItem?.isActive ?? editingItem?.IsActive ?? true} onChange={(e) => setEditingItem({...editingItem, isActive: e.target.checked, IsActive: e.target.checked})} />
                    Activo
                  </label>
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button type="submit" style={{ flex: 1, padding: '12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                Guardar
              </button>
              <button type="button" onClick={() => { setEditingItem(null); setIsAdding(false); }} style={{ padding: '12px 24px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const isSplitView = activeTab === 'definiciones' || activeTab === 'empleados';

  return (
    <div style={{ padding: '32px', maxWidth: isSplitView ? '1600px' : '1000px', margin: '0 auto', transition: 'max-width 0.3s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <div style={{ background: '#e0e7ff', padding: '16px', borderRadius: '16px' }}>
          <Settings size={32} color="#4338ca" />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: '2rem', color: '#0f172a' }}>Maestros del Sistema</h1>
          <p style={{ margin: '4px 0 0 0', color: '#64748b' }}>Gestiona las tablas y configuraciones principales</p>
        </div>
      </div>

      {error && (
        <div style={{ background: '#fee2e2', color: '#ef4444', padding: '16px', borderRadius: '8px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {!isSplitView ? (
        <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ margin: 0, color: '#334155' }}>
              {activeTab === 'cargos' ? 'Gestión de Cargos' : activeTab === 'contratos' ? 'Gestión de Contratos' : activeTab === 'ubigeos' ? 'Gestión de Ubigeos' : activeTab === 'usuarios' ? 'Gestión de Usuarios' : activeTab === 'detalles def.' ? 'Detalles de Definiciones' : 'Gestión Maestros'}
            </h2>
            <button 
              onClick={() => { setIsAdding(true); setEditingItem({}); setEditingTarget('master'); }}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              <Plus size={18} /> Nuevo Registro
            </button>
          </div>
          {loading ? <p>Cargando...</p> : renderTableData(data, 'master')}
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          {/* Master Panel */}
          <div style={{ flex: '1 1 500px', background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, color: '#334155', textTransform: 'uppercase', fontSize: '16px', letterSpacing: '1px' }}>
                {activeTab === 'definiciones' ? 'Definiciones' : 'Empleados'}
              </h2>
              {activeTab !== 'empleados' && (
                <button 
                  onClick={() => { setIsAdding(true); setEditingItem({}); setEditingTarget('master'); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'transparent', color: '#10b981', border: '1px solid #10b981', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  <Plus size={16} /> Nuevo
                </button>
              )}
            </div>
            {loading ? <p>Cargando...</p> : renderTableData(data, 'master')}
          </div>

          {/* Detail Panel */}
          <div style={{ flex: '1 1 500px', background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', borderTop: '4px solid #3b82f6' }}>
            {selectedMasterId ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h2 style={{ margin: 0, color: '#1d4ed8', textTransform: 'uppercase', fontSize: '16px', letterSpacing: '1px' }}>
                    {activeTab === 'definiciones' ? `Valores: ${selectedMasterItem?.nombre || selectedMasterItem?.Nombre || ''}` : `Usuario Asignado: ${selectedMasterItem?.nombres || selectedMasterItem?.Nombres || ''}`}
                  </h2>
                  <button 
                    onClick={() => { setIsAdding(true); setEditingItem(activeTab === 'empleados' ? { dni: selectedMasterItem?.dni || selectedMasterItem?.Dni } : {}); setEditingTarget('detail'); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    <Plus size={16} /> {activeTab === 'empleados' && detailData.length > 0 ? 'Reemplazar Usuario' : 'Crear Usuario'}
                  </button>
                </div>
                {renderTableData(detailData, 'detail')}
              </>
            ) : (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', minHeight: '200px' }}>
                <CheckCircle2 size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                <p style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Selecciona un registro de la izquierda</p>
                <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>Para visualizar y editar sus detalles</p>
              </div>
            )}
          </div>
        </div>
      )}

      {renderForm()}
    </div>
  );
}
