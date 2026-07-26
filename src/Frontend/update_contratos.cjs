const fs = require('fs');
const file = 'c:/Users/Lenovo/Desktop/solucion_RH/proyecto/src/Frontend/src/components/ContratosFirmados.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'import { useState, useEffect } from \'react\';',
  'import { useState, useEffect } from \'react\';\nimport { useNavigate } from \'react-router-dom\';'
);

content = content.replace(
  'MapPin, GraduationCap, IdCard\n} from \'lucide-react\';',
  'MapPin, GraduationCap, IdCard, Edit\n} from \'lucide-react\';'
);

content = content.replace(
  'export default function ContratosFirmados() {\n  const [searchTerm, setSearchTerm] = useState(\'\');',
  'export default function ContratosFirmados() {\n  const navigate = useNavigate();\n  const [searchTerm, setSearchTerm] = useState(\'\');'
);

const tableIdx = content.indexOf('{/* ── TABLE SECTION ── */}');
const statIdx = content.indexOf('{/* ── STAT CARDS ── */}');
const catIdx = content.indexOf('{/* ── CATEGORY CARDS ── */}');
const modalIdx = content.indexOf('</div>\n\n      {/* ── MODAL VISTA PREVIA ── */}');

if (tableIdx > -1 && statIdx > -1 && catIdx > -1 && modalIdx > -1) {
  const beforeTable = content.substring(0, tableIdx);
  const tableSec = content.substring(tableIdx, statIdx);
  const statSec = content.substring(statIdx, catIdx);
  const catSec = content.substring(catIdx, modalIdx);
  const afterModal = content.substring(modalIdx);
  
  content = beforeTable + statSec + catSec + '\n        ' + tableSec + afterModal;
} else {
  console.log('Failed to find sections');
}

const editButton = `                            {/* Lápiz (Editar) */}
                            <button
                              title="Editar datos"
                              onClick={() => navigate('/personal')}
                              style={{
                                width: '34px', height: '34px',
                                borderRadius: '10px',
                                border: '1.5px solid #fed7aa',
                                background: '#fff7ed',
                                cursor: 'pointer',
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0,
                                padding: 0, lineHeight: 1,
                              }}
                              onMouseEnter={e => { e.currentTarget.style.background = '#f97316'; e.currentTarget.style.borderColor = '#f97316'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = '#fff7ed'; e.currentTarget.style.borderColor = '#fed7aa'; }}
                            >
                              <Edit size={16} strokeWidth={2} color="#f97316" />
                            </button>

                            `;

content = content.replace(
  '{/* Imprimir */}',
  editButton + '{/* Imprimir */}'
);

const oldModalData = `{ label: 'Estado Civil', value: previewContract.estadoCivil || '—' },
                    ].map((f, i) => (`;
const newModalData = `{ label: 'Estado Civil', value: previewContract.estadoCivil || '—' },
                      { label: 'Teléfono', value: previewContract.telefono || '—' },
                      { label: 'Correo', value: previewContract.correoPersonal || '—' },
                      { label: 'Contacto Emergencia', value: previewContract.contactoEmergencia || '—' },
                      { label: 'Parentesco', value: previewContract.parentesco || '—' },
                      { label: 'Teléfono Emergencia', value: previewContract.telefonoEmergencia || '—' }
                    ].map((f, i) => (`;
                    
content = content.replace(oldModalData, newModalData);

fs.writeFileSync(file, content);
console.log('Done');
