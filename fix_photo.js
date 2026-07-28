const fs = require('fs');
let content = fs.readFileSync('src/Frontend/src/components/DashboardAlmacen.jsx', 'utf8');

// 1. Añadir blackLogoUrl a ViewRecepcion y el estado de imagenBase64
const viewRecepcionSig = 'function ViewRecepcion({ user, globalBoxConfigs, setGlobalBoxConfigs, globalRackConfigs, showModal }) {';
const viewRecepcionSigNew = 'function ViewRecepcion({ user, globalBoxConfigs, setGlobalBoxConfigs, globalRackConfigs, showModal, blackLogoUrl }) {\n  const [imagenBase64, setImagenBase64] = useState(null);\n  const handleImageUpload = (e) => {\n    const file = e.target.files[0];\n    if (file) {\n      const reader = new FileReader();\n      reader.onloadend = () => setImagenBase64(reader.result);\n      reader.readAsDataURL(file);\n    }\n  };';
content = content.replace(viewRecepcionSig, viewRecepcionSigNew);

// 2. Modificar el formData para incluir la imagen
const formSaveBodyTarget = 'JSON.stringify({\n        ProductoCodigo: data.sku,\n        Cantidad: parseInt(data.cantidad),\n        UbicacionRack: data.rack,\n        Documento: "REC-" + Date.now(),\n        Responsable: user?.name || "Operador",\n        Proveedor: data.proveedor,\n        DescripcionCarga: data.nombre\n      })';
const formSaveBodyNew = 'JSON.stringify({\n        ProductoCodigo: data.sku,\n        Cantidad: parseInt(data.cantidad),\n        UbicacionRack: data.rack,\n        Documento: "REC-" + Date.now(),\n        Responsable: user?.name || "Operador",\n        Proveedor: data.proveedor,\n        DescripcionCarga: data.nombre,\n        ImagenBase64: imagenBase64\n      })';
content = content.replace(formSaveBodyTarget, formSaveBodyNew);

// 3. Añadir el input de cámara al formulario de recepción (Step 1)
const step1Target = '<div className="form-group">\n            <label>Condición</label>';
const step1New = '<div className="form-group">\n            <label>Fotografía del Producto</label>\n            <div style={{ display: \'flex\', alignItems: \'center\', gap: \'10px\' }}>\n              <label style={{ display: \'flex\', alignItems: \'center\', gap: \'8px\', background: \'#e2e8f0\', padding: \'10px 15px\', borderRadius: \'8px\', cursor: \'pointer\' }}>\n                <Camera size={20} />\n                <span>Tomar / Subir Foto</span>\n                <input type="file" accept="image/*" capture="environment" style={{ display: \'none\' }} onChange={handleImageUpload} />\n              </label>\n              {imagenBase64 && <img src={imagenBase64} alt="preview" style={{ height: \'40px\', borderRadius: \'4px\' }} />}\n            </div>\n          </div>\n          <div className="form-group">\n            <label>Condición</label>';
content = content.replace(step1Target, step1New);

// 4. Update ViewInventario logic
const inventarioTargetOld = `function ViewInventario() {
    return (
      <div className="table-card">
        <div className="table-header">
          <h3>Inventario en Tiempo Real</h3>
          <div className="search-box">
            <Search size={18} color="#94a3b8" />
            <input type="text" placeholder="Buscar producto..." />
          </div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Producto</th>
              <th>Ubicación</th>
              <th>Stock</th>
              <th>Unidad</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>ALM-001</td>
              <td>Casco de Seguridad 3M</td>
              <td>A-1</td>
              <td>150</td>
              <td>Unidades</td>
              <td><span className="badge badge-success">Óptimo</span></td>
            </tr>
            <tr>
              <td>ALM-002</td>
              <td>Botas Punta de Acero Talla 42</td>
              <td>B-3</td>
              <td>5</td>
              <td>Pares</td>
              <td><span className="badge badge-danger">Stock Bajo</span></td>
            </tr>
            <tr>
              <td>ALM-003</td>
              <td>Aceite Lubricante Motor</td>
              <td>C-2</td>
              <td>24</td>
              <td>Litros</td>
              <td><span className="badge badge-success">Óptimo</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }`;

const inventarioTargetNew = `function ViewInventario() {
    const [inventario, setInventario] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      fetch('http://localhost:5051/api/almacen/inventario')
        .then(res => res.json())
        .then(data => { setInventario(data); setLoading(false); })
        .catch(err => { console.error(err); setLoading(false); });
    }, []);

    return (
      <div className="table-card">
        <div className="table-header">
          <h3>Inventario en Tiempo Real</h3>
          <div className="search-box">
            <Search size={18} color="#94a3b8" />
            <input type="text" placeholder="Buscar producto..." />
          </div>
        </div>
        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center' }}>Cargando inventario...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Foto</th>
                <th>Código</th>
                <th>Producto</th>
                <th>Ubicación</th>
                <th>Stock</th>
                <th>Unidad</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {inventario.map((item, idx) => (
                <tr key={idx}>
                  <td>
                    {item.imagenUrl ? (
                      <img src={"http://localhost:5051" + item.imagenUrl} alt={item.producto} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '8px' }} />
                    ) : (
                      <div style={{ width: '40px', height: '40px', background: '#e2e8f0', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Package size={20} color="#94a3b8" />
                      </div>
                    )}
                  </td>
                  <td>{item.codigo}</td>
                  <td>{item.producto}</td>
                  <td>{item.ubicacion}</td>
                  <td>{item.stock}</td>
                  <td>{item.unidad}</td>
                  <td><span className={\`badge \${item.estado === 'Optimo' ? 'badge-success' : 'badge-danger'}\`}>{item.estado}</span></td>
                </tr>
              ))}
              {inventario.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>No hay productos en inventario.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    );
  }`;

content = content.replace(inventarioTargetOld, inventarioTargetNew);

fs.writeFileSync('src/Frontend/src/components/DashboardAlmacen.jsx', content, 'utf8');
