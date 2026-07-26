import { useState, useRef } from 'react';
import { X, Camera, User, Mail, CreditCard, Phone, Save, CheckCircle } from 'lucide-react';
import './profilesettings.css';

export default function ProfileSettingsModal({ user, onClose, onSave }) {
  const [formData, setFormData] = useState({
    nombres: user?.nombres || '',
    apellidos: user?.apellidos || '',
    dni: user?.dni || '',
    correo: user?.correo || '',
    telefono: user?.telefono || ''
  });
  
  const [photoPreview, setPhotoPreview] = useState(user?.foto || null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaving(true);
    
    // Simular un guardado en el backend
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      if (onSave) {
        onSave({ ...formData, foto: photoPreview });
      }
      setTimeout(() => {
        onClose();
      }, 1500);
    }, 1000);
  };

  return (
    <div className="profile-modal-overlay">
      <div className="profile-modal">
        <div className="profile-modal-header">
          <h2>Configuración de Perfil</h2>
          <button className="profile-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="profile-modal-body">
          <div className="profile-photo-section">
            <div className="profile-photo-wrapper" onClick={() => fileInputRef.current.click()}>
              {photoPreview ? (
                <img src={photoPreview} alt="Perfil" className="profile-photo-img" />
              ) : (
                <div className="profile-photo-placeholder">
                  {formData.nombres ? formData.nombres.substring(0, 2).toUpperCase() : 'U'}
                </div>
              )}
              <div className="profile-photo-overlay">
                <Camera size={24} />
              </div>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept="image/*"
              onChange={handlePhotoChange}
            />
            <p className="profile-photo-hint">Haz clic para cambiar tu foto</p>
          </div>

          <form onSubmit={handleSubmit} className="profile-form">
            <div className="profile-form-grid">
              <div className="profile-input-group">
                <label>Nombres</label>
                <div className="profile-input-wrapper">
                  <User size={16} className="profile-input-icon" />
                  <input type="text" name="nombres" value={formData.nombres} onChange={handleChange} required />
                </div>
              </div>

              <div className="profile-input-group">
                <label>Apellidos</label>
                <div className="profile-input-wrapper">
                  <User size={16} className="profile-input-icon" />
                  <input type="text" name="apellidos" value={formData.apellidos} onChange={handleChange} required />
                </div>
              </div>

              <div className="profile-input-group">
                <label>DNI</label>
                <div className="profile-input-wrapper">
                  <CreditCard size={16} className="profile-input-icon" />
                  <input type="text" name="dni" value={formData.dni} onChange={handleChange} maxLength={8} required />
                </div>
              </div>

              <div className="profile-input-group">
                <label>Correo Electrónico</label>
                <div className="profile-input-wrapper">
                  <Mail size={16} className="profile-input-icon" />
                  <input type="email" name="correo" value={formData.correo} onChange={handleChange} placeholder="ejemplo@correo.com" />
                </div>
              </div>

              <div className="profile-input-group full-width">
                <label>Teléfono (Opcional)</label>
                <div className="profile-input-wrapper">
                  <Phone size={16} className="profile-input-icon" />
                  <input type="text" name="telefono" value={formData.telefono} onChange={handleChange} placeholder="+51 987 654 321" />
                </div>
              </div>
            </div>

            <div className="profile-form-actions">
              <button type="button" className="profile-btn-cancel" onClick={onClose} disabled={saving}>
                Cancelar
              </button>
              <button type="submit" className="profile-btn-save" disabled={saving || saved}>
                {saving ? (
                  <span className="profile-spinner"></span>
                ) : saved ? (
                  <><CheckCircle size={18} /> ¡Guardado!</>
                ) : (
                  <><Save size={18} /> Guardar Cambios</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
