const fs = require('fs');
const file = 'c:/Users/Lenovo/Desktop/solucion_RH/proyecto/src/Frontend/src/components/ContratosFirmados.jsx';
let content = fs.readFileSync(file, 'utf8');

const tableIdx = content.indexOf('{/* ── TABLE SECTION ── */}');
const statIdx = content.indexOf('{/* ── STAT CARDS ── */}');
const catIdx = content.indexOf('{/* ── CATEGORY CARDS ── */}');
const modalIdx = content.indexOf('      {/* ── MODAL VISTA PREVIA ── */}');

if (tableIdx > -1 && statIdx > -1 && catIdx > -1 && modalIdx > -1) {
  const beforeTable = content.substring(0, tableIdx);
  const tableSec = content.substring(tableIdx, statIdx);
  const statSec = content.substring(statIdx, catIdx);
  const catSec = content.substring(catIdx, modalIdx);
  const afterModal = content.substring(modalIdx);
  
  content = beforeTable + statSec + catSec + tableSec + afterModal;
  fs.writeFileSync(file, content);
  console.log('Layout swapped');
} else {
  console.log('Failed to find sections', {tableIdx, statIdx, catIdx, modalIdx});
}
