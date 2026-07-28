const fs = require('fs');
let c = fs.readFileSync('src/Frontend/src/components/DashboardAlmacen.jsx', 'utf8');

// 1. Añadir las funciones globales de PDF al final
const pdfCode = `
export const generateHojaRecepcionPDF = (data, user, globalRackConfigs) => {
  if (!data) return;
  const doc = new jsPDF();
  
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 0, 210, 45, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(0, 45, 210, 45);

  const logoImg = document.getElementById('logo-empresa-hidden');
  if (logoImg) {
    doc.addImage(logoImg, 'PNG', 20, 7, 50, 30);
  }

  doc.setTextColor(30, 41, 59);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("HOJA DE RECEPCIÓN", 115, 20, null, null, "center");
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  const d = new Date();
  doc.text(\`Fecha: \${d.toLocaleDateString()} - Documento: REC-\${d.getTime().toString().slice(-6)}\`, 115, 28, null, null, "center");
  doc.text(\`Estado: INGRESADO - Sistema de Gestión\`, 115, 34, null, null, "center");

  doc.setFillColor(255, 255, 255);
  doc.roundedRect(20, 55, 170, 60, 3, 3, 'FD');
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("Información del Producto", 25, 65);
  doc.setDrawColor(226, 232, 240);
  doc.line(25, 68, 185, 68);

  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.setFont("helvetica", "bold");
  doc.text("SKU / Código:", 25, 78);
  doc.text("Descripción:", 25, 88);
  doc.text("Cantidad:", 25, 98);
  doc.text("Proveedor:", 25, 108);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(data.sku, 60, 78);
  doc.text(data.nombre, 60, 88);
  
  doc.setFont("helvetica", "bold");
  doc.setTextColor(37, 99, 235);
  doc.text(data.cantidad.toString(), 60, 98);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(data.proveedor || "No especificado", 60, 108);

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(20, 120, 170, 45, 3, 3, 'FD');

  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.text("UBICACIÓN ASIGNADA EN ALMACÉN", 25, 130);
  doc.setDrawColor(226, 232, 240);
  doc.line(25, 133, 185, 133);

  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.setFont("helvetica", "bold");
  const rackName = globalRackConfigs?.[data.rack]?.text || \`Rack \${data.rack}\`;
  doc.text("Rack:", 25, 143);
  doc.text("Caja Exacta:", 25, 153);
  doc.text("Registrado por:", 110, 143);
  doc.text("Hora Ingreso:", 110, 153);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(rackName, 55, 143);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(37, 99, 235);
  doc.text(data.caja, 55, 153);
  
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(user?.name || 'Operador', 140, 143);
  doc.text(d.toLocaleTimeString(), 140, 153);

  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text("Documento generado automáticamente por Sistema de Gestión de RRHH - DNI Contract", 105, 280, null, null, "center");

  doc.save(\`recepcion_\${data.sku}_\${d.getTime()}.pdf\`);
};

export const generateEtiquetaQRPDF = (data) => {
  if (!data) return;
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [100, 60]
  });

  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(1.5);
  doc.rect(2, 2, 96, 56);

  doc.setFillColor(15, 23, 42);
  doc.rect(2, 2, 96, 12, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("ETIQUETA DE ALMACÉN", 50, 10, null, null, "center");

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.text(\`SKU: \${data.sku}\`, 5, 22);
  
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  let prodName = data.nombre;
  if (prodName.length > 30) prodName = prodName.substring(0, 27) + "...";
  doc.text(prodName, 5, 28);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(37, 99, 235);
  doc.text(\`CANTIDAD: \${data.cantidad}\`, 5, 38);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(\`CAJA: \${data.caja}\`, 5, 46);
  doc.text(\`RACK: \${data.rack}\`, 5, 52);

  const qrCanvas = document.getElementById('recepcion-qr');
  if (qrCanvas) {
    const qrDataUrl = qrCanvas.toDataURL('image/png');
    doc.addImage(qrDataUrl, 'PNG', 65, 20, 30, 30);
  }

  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text("DNI Contract - RRHH", 95, 56, null, null, "right");

  doc.save(\`etiqueta_qr_\${data.sku}.pdf\`);
};
`;

if (!c.includes('export const generateHojaRecepcionPDF')) {
  c = c + '\n' + pdfCode;
}

// 2. Modificar funciones locales en ViewRecepcion
const targetFuncsOld = `    const downloadHojaRecepcion = () => {
      const data = downloadModalData;
      if (!data) return;
      const doc = new jsPDF();
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 40, 'F');
      
      const logoImg = document.getElementById('logo-empresa-hidden');
      if (logoImg) {
        doc.addImage(logoImg, 'PNG', 15, 5, 50, 30);
      }
  
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("HOJA DE RECEPCIÓN", 115, 25, null, null, "center");
  
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Datos del Producto", 20, 60);
  
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text(\`SKU / Código: \${data.sku}\`, 20, 75);
      doc.text(\`Descripción: \${data.nombre}\`, 20, 85);
      doc.text(\`Cantidad: \${data.cantidad}\`, 20, 95);
      doc.text(\`Proveedor: \${data.proveedor || 'N/A'}\`, 20, 105);
  
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Ubicación Asignada", 20, 125);
  
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text(\`Rack: \${globalRackConfigs?.[data.rack]?.text || data.rack}\`, 20, 140);
      doc.text(\`Nivel: \${data.nivel}\`, 20, 150);
      doc.text(\`Caja Exacta: \${data.caja}\`, 20, 160);
      
      doc.text(\`Registrado por: \${user?.name || 'Operador'}\`, 20, 180);
      const d = new Date();
      doc.text(\`Fecha de Ingreso: \${d.toLocaleDateString()} \${d.toLocaleTimeString()}\`, 20, 190);
  
      doc.save(\`hoja_recepcion_\${data.sku}_\${d.getTime()}.pdf\`);
    };
  
    const downloadQRProducto = () => {
      const data = downloadModalData;
      if (!data) return;
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [100, 60]
      });
  
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("ETIQUETA DE ALMACÉN", 50, 10, null, null, "center");
  
      doc.setFontSize(10);
      doc.text(\`SKU: \${data.sku}\`, 5, 25);
      doc.text(\`Producto: \${data.nombre}\`, 5, 32);
      doc.text(\`Caja: \${data.caja}\`, 5, 39);
      doc.text(\`Cantidad: \${data.cantidad}\`, 5, 46);
  
      const qrCanvas = document.getElementById('recepcion-qr');
      if (qrCanvas) {
        const qrDataUrl = qrCanvas.toDataURL('image/png');
        doc.addImage(qrDataUrl, 'PNG', 65, 15, 30, 30);
      }
  
      doc.save(\`etiqueta_qr_\${data.sku}.pdf\`);
    };`;

const targetFuncsNew = `    const downloadHojaRecepcion = () => {
      generateHojaRecepcionPDF(downloadModalData, user, globalRackConfigs);
    };
  
    const downloadQRProducto = () => {
      generateEtiquetaQRPDF(downloadModalData);
    };`;

if (c.includes('doc.setFillColor(15, 23, 42);')) {
  c = c.replace(targetFuncsOld, targetFuncsNew);
}

// 3. Añadir modal en ViewMapeo
const viewMapeoModalOpenOld = `  const [isAddingBoxGlobal, setIsAddingBoxGlobal] = useState(false);
  const [addingBoxSelectedRack, setAddingBoxSelectedRack] = useState(null);`;

const viewMapeoModalOpenNew = `  const [isAddingBoxGlobal, setIsAddingBoxGlobal] = useState(false);
  const [addingBoxSelectedRack, setAddingBoxSelectedRack] = useState(null);
  const [printModalData, setPrintModalData] = useState(null);`;
c = c.replace(viewMapeoModalOpenOld, viewMapeoModalOpenNew);

const viewMapeoPrintLogicOld = `<span style={{ fontWeight: '500', color: '#0f172a' }}>{inv.producto}</span>
                                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{inv.cantidad} {inv.unidad}</span>`;
const viewMapeoPrintLogicNew = `<span style={{ fontWeight: '500', color: '#0f172a' }}>{inv.producto}</span>
                                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{inv.cantidad} {inv.unidad}</span>
                                  </div>
                                  <button onClick={(e) => {
                                    e.stopPropagation();
                                    setPrintModalData({
                                      sku: inv.codigoProducto || inv.producto,
                                      nombre: inv.producto,
                                      cantidad: inv.cantidad,
                                      rack: rack.id,
                                      caja: selectedBox.id
                                    });
                                  }} style={{ background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}>
                                    <Printer size={16} />
                                  </button>
                                  <div style={{ display: 'none' }}>`;
c = c.replace(viewMapeoPrintLogicOld, viewMapeoPrintLogicNew);

const printModalJSX = `
        {printModalData && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '500px', textAlign: 'center' }}>
              <button className="close-btn" onClick={() => setPrintModalData(null)}><X size={24} /></button>
              <h2 style={{ marginBottom: '10px', color: '#1e293b' }}>Opciones de Impresión</h2>
              <p style={{ color: '#64748b', marginBottom: '20px' }}>Seleccione el documento que desea imprimir para el producto <strong>{printModalData.nombre}</strong></p>
              
              <div style={{ display: 'none' }}>
                <QRCodeCanvas id="recepcion-qr" value={JSON.stringify(printModalData)} size={200} level={"H"} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', padding: '10px' }}>
                <button 
                  onClick={() => {
                    generateHojaRecepcionPDF(printModalData, null, globalRackConfigs);
                    setPrintModalData(null);
                  }} 
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.4)' }}
                >
                  <FileText size={24} /> Descargar Hoja de Recepción (PDF)
                </button>
                
                <button 
                  onClick={() => {
                    generateEtiquetaQRPDF(printModalData);
                    setPrintModalData(null);
                  }} 
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '16px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(139, 92, 246, 0.4)' }}
                >
                  <Printer size={24} /> Imprimir Etiqueta QR
                </button>
              </div>
            </div>
          </div>
        )}
`;

const modalEndTarget = `            </div>
          </div>
        </div>
    </div>
  );
}`;

c = c.replace(modalEndTarget, `            </div>\n          </div>\n        </div>\n${printModalJSX}\n    </div>\n  );\n}`);

fs.writeFileSync('src/Frontend/src/components/DashboardAlmacen.jsx', c, 'utf8');
