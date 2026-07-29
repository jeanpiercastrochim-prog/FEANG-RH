using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DNIContractApi.Data;
using DNIContractApi.Models.Entities;

namespace DNIContractApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AlmacenController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AlmacenController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/almacen/dashboard-kpis
        [HttpGet("dashboard-kpis")]
        public async Task<IActionResult> GetDashboardKpis()
        {
            var inventarioTotal = await _context.AlmacenInventarios.SumAsync(i => i.CantidadDisponible);
            var ingresosMes = await _context.AlmacenMovimientos.CountAsync(m => m.TipoMovimiento == "INGRESO" && m.FechaMovimiento.Month == DateTime.UtcNow.Month);
            var salidasMes = await _context.AlmacenMovimientos.CountAsync(m => m.TipoMovimiento == "SALIDA" && m.FechaMovimiento.Month == DateTime.UtcNow.Month);
            var productosBajoStock = await _context.AlmacenProductos
                .Where(p => _context.AlmacenInventarios.Where(i => i.ProductoId == p.Id).Sum(i => i.CantidadDisponible) <= p.StockMinimo)
                .CountAsync();

            return Ok(new { inventarioTotal, ingresosMes, salidasMes, productosBajoStock });
        }

        // GET: api/almacen/ubicaciones
        [HttpGet("ubicaciones")]
        public async Task<IActionResult> GetUbicaciones()
        {
            var ubicaciones = await _context.AlmacenUbicaciones.ToListAsync();
            return Ok(ubicaciones);
        }

        // GET: api/almacen/ubicaciones/{codigo}
        [HttpGet("ubicaciones/{codigo}")]
        public async Task<IActionResult> GetUbicacionDetalle(string codigo)
        {
            // Parse boxCode (ej. "A1-N1")
            var ubicacion = await _context.AlmacenUbicaciones.FirstOrDefaultAsync(u => u.Posicion == codigo || u.Rack + u.Nivel == codigo);
            
            // Simular respuesta si no existe en BD para no romper la UI,
            // asumiendo capacidad base de 100 y estado según un hash simple (como en frontend)
            if (ubicacion == null)
            {
                int hash = 0;
                for (int i = 0; i < codigo.Length; i++) hash = codigo[i] + ((hash << 5) - hash);
                int r = Math.Abs(hash) % 100;
                string estadoSimulado = r < 60 ? "Ocupado" : r < 75 ? "Bloqueado" : "Libre";

                return Ok(new { 
                    codigo = codigo,
                    capacidadMaxima = 100, 
                    estado = estadoSimulado,
                    inventario = new List<object>() 
                });
            }

            var inventario = await _context.AlmacenInventarios
                .Include(i => i.Producto)
                .Where(i => i.UbicacionId == ubicacion.Id && i.CantidadDisponible > 0)
                .Select(i => new {
                    producto = i.Producto.Nombre,
                    codigoProducto = i.Producto.Codigo,
                    imagenUrl = i.Producto.ImagenUrl,
                    cantidad = i.CantidadDisponible,
                    unidad = i.Producto.UnidadMedida,
                    lote = i.Lote,
                    vencimiento = i.FechaVencimiento
                })
                .ToListAsync();

            return Ok(new {
                codigo = codigo,
                capacidadMaxima = ubicacion.CapacidadMaxima,
                estado = ubicacion.Estado,
                inventario = inventario
            });
        }
        
        // GET: api/almacen/productos
        [HttpGet("productos")]
        public async Task<IActionResult> GetProductos()
        {
            var productos = await _context.AlmacenProductos.ToListAsync();
            return Ok(productos);
        }

        // GET: api/almacen/inventario
        [HttpGet("inventario")]
        public async Task<IActionResult> GetInventarioGeneral()
        {
            var inventario = await _context.AlmacenInventarios
                .Include(i => i.Producto)
                .Include(i => i.Ubicacion)
                .Where(i => i.CantidadDisponible > 0 || i.Lote == "MANTENIDO")
                .Select(i => new {
                    codigo = i.Producto.Codigo,
                    producto = i.Producto.Nombre,
                    ubicacion = i.Ubicacion != null ? $"{i.Ubicacion.Rack}-{i.Ubicacion.Nivel}-{i.Ubicacion.Posicion}" : "",
                    stock = i.CantidadDisponible,
                    unidad = i.Producto.UnidadMedida,
                    estado = i.CantidadDisponible > i.Producto.StockMinimo ? "Optimo" : "Stock Bajo",
                    imagenUrl = i.Producto.ImagenUrl,
                    proveedor = _context.AlmacenMovimientos.Where(m => m.InventarioId == i.Id && m.TipoMovimiento == "INGRESO").Select(m => m.Solicitante).FirstOrDefault() ?? "No especificado",
                    descripcion = _context.AlmacenMovimientos.Where(m => m.InventarioId == i.Id && m.TipoMovimiento == "INGRESO").Select(m => m.DescripcionCarga).FirstOrDefault() ?? i.Producto.Nombre,
                    fechaRegistro = _context.AlmacenMovimientos.Where(m => m.InventarioId == i.Id && m.TipoMovimiento == "INGRESO").Select(m => (DateTime?)m.FechaMovimiento).FirstOrDefault() ?? i.LastUpdated
                })
                .ToListAsync();
            return Ok(inventario);
        }

        // GET: api/almacen/kardex
        [HttpGet("kardex")]
        public async Task<IActionResult> GetKardex()
        {
            var movimientos = await _context.AlmacenMovimientos
                .Include(m => m.Inventario)
                .ThenInclude(i => i.Producto)
                .OrderByDescending(m => m.FechaMovimiento)
                .Select(m => new {
                    m.Id,
                    Fecha = m.FechaMovimiento,
                    m.TipoMovimiento,
                    Producto = m.Inventario.Producto.Nombre,
                    m.Cantidad,
                    m.DocumentoReferencia,
                    m.Responsable
                })
                .ToListAsync();

            return Ok(movimientos);
        }

        [HttpGet("recepciones")]
        public async Task<IActionResult> GetRecepciones()
        {
            var recepciones = await _context.AlmacenMovimientos
                .Include(m => m.Inventario)
                .ThenInclude(i => i.Producto)
                .Include(m => m.Inventario)
                .ThenInclude(i => i.Ubicacion)
                .Where(m => m.TipoMovimiento == "INGRESO")
                .OrderByDescending(m => m.FechaMovimiento)
                .Select(m => new {
                    m.Id,
                    ReceiptId = m.DocumentoReferencia,
                    Fecha = m.FechaMovimiento,
                    Sku = m.Inventario.Producto.Codigo,
                    Nombre = m.Inventario.Producto.Nombre,
                    Cantidad = m.Cantidad,
                    Condicion = m.DescripcionCarga,
                    Proveedor = m.Solicitante,
                    Rack = m.Inventario.Ubicacion.Rack,
                    ImagenUrl = m.Inventario.Producto.ImagenUrl,
                    Responsable = m.Responsable
                })
                .ToListAsync();

            return Ok(recepciones);
        }

        // GET: api/almacen/racks
        [HttpGet("racks")]
        public async Task<IActionResult> GetRacks()
        {
            var racks = await _context.AlmacenRacks.ToListAsync();
            if (!racks.Any())
            {
                racks = new List<AlmacenRack>
                {
                    new AlmacenRack { Codigo = "H", PosicionX = 100, PosicionY = 150 },
                    new AlmacenRack { Codigo = "G", PosicionX = 280, PosicionY = 150 },
                    new AlmacenRack { Codigo = "F", PosicionX = 460, PosicionY = 150 },
                    new AlmacenRack { Codigo = "E", PosicionX = 640, PosicionY = 150 },
                    new AlmacenRack { Codigo = "D", PosicionX = 100, PosicionY = 350 },
                    new AlmacenRack { Codigo = "C", PosicionX = 280, PosicionY = 350 },
                    new AlmacenRack { Codigo = "B", PosicionX = 460, PosicionY = 350 },
                    new AlmacenRack { Codigo = "A", PosicionX = 640, PosicionY = 350 }
                };
                _context.AlmacenRacks.AddRange(racks);
                await _context.SaveChangesAsync();
            }
            return Ok(racks);
        }

        // POST: api/almacen/racks
        [HttpPost("racks")]
        public async Task<IActionResult> SaveRacks([FromBody] List<AlmacenRack> racks)
        {
            var currentRacks = await _context.AlmacenRacks.ToListAsync();
            _context.AlmacenRacks.RemoveRange(currentRacks);
            
            foreach (var rack in racks)
            {
                rack.Id = 0;
            }
            _context.AlmacenRacks.AddRange(racks);
            await _context.SaveChangesAsync();

            return Ok(new { success = true });
        }

        public class IngresoRequest
        {
            public string ProductoCodigo { get; set; } = string.Empty;
            public int Cantidad { get; set; }
            public string UbicacionRack { get; set; } = string.Empty;
            public string Documento { get; set; } = string.Empty;
            public string Responsable { get; set; } = string.Empty;
            public string Proveedor { get; set; } = string.Empty;
            public decimal? Peso { get; set; }
            public string DescripcionCarga { get; set; } = string.Empty;
            public string? ImagenBase64 { get; set; }
        }

        public class DespachoRequest
        {
            public string ProductoCodigo { get; set; } = string.Empty;
            public int Cantidad { get; set; }
            public string Documento { get; set; } = string.Empty;
            public string Responsable { get; set; } = string.Empty;
            public string NombreSolicitante { get; set; } = string.Empty;
            public string AreaSolicitante { get; set; } = string.Empty;
            public string CargoSolicitante { get; set; } = string.Empty;
            public string VehiculoAsignado { get; set; } = string.Empty;
            public string Turno { get; set; } = string.Empty;
            public string Planta { get; set; } = string.Empty;
            public string EquipoLinea { get; set; } = string.Empty;
            public string MotivoObservacion { get; set; } = string.Empty;
            public bool MantenerEnRack { get; set; } = false;
            public string? FirmaBase64 { get; set; }
        }

        // POST: api/almacen/ingreso
        [HttpPost("ingreso")]
        public async Task<IActionResult> RegistrarIngreso([FromBody] IngresoRequest request)
        {
            try
            {
                var producto = await _context.AlmacenProductos.FirstOrDefaultAsync(p => p.Codigo == request.ProductoCodigo);
                if (producto == null)
                {
                    producto = new AlmacenProducto { Codigo = request.ProductoCodigo, Nombre = $"Producto {request.ProductoCodigo}" };
                    _context.AlmacenProductos.Add(producto);
                    await _context.SaveChangesAsync();
                }

                if (!string.IsNullOrEmpty(request.ImagenBase64))
                {
                    try
                    {
                        var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "productos");
                        if (!Directory.Exists(uploadsFolder)) Directory.CreateDirectory(uploadsFolder);
                        
                        var base64Data = request.ImagenBase64.Split(',').Length > 1 ? request.ImagenBase64.Split(',')[1] : request.ImagenBase64;
                        var imageBytes = Convert.FromBase64String(base64Data);
                        var fileName = $"{Guid.NewGuid()}.jpg";
                        var filePath = Path.Combine(uploadsFolder, fileName);
                        await System.IO.File.WriteAllBytesAsync(filePath, imageBytes);
                        
                        producto.ImagenUrl = $"/uploads/productos/{fileName}";
                        await _context.SaveChangesAsync();
                    }
                    catch (Exception ex)
                    {
                        // Log error optionally
                    }
                }

                var ubicacion = await _context.AlmacenUbicaciones.FirstOrDefaultAsync(u => u.Rack == request.UbicacionRack);
                if (ubicacion == null)
                {
                    ubicacion = new AlmacenUbicacion { Zona = "A", Rack = request.UbicacionRack };
                    _context.AlmacenUbicaciones.Add(ubicacion);
                    await _context.SaveChangesAsync();
                }

                var inventario = await _context.AlmacenInventarios.FirstOrDefaultAsync(i => i.ProductoId == producto.Id && i.UbicacionId == ubicacion.Id);
                if (inventario == null)
                {
                    inventario = new AlmacenInventario { ProductoId = producto.Id, UbicacionId = ubicacion.Id, CantidadDisponible = request.Cantidad };
                    _context.AlmacenInventarios.Add(inventario);
                }
                else
                {
                    inventario.CantidadDisponible += request.Cantidad;
                    inventario.LastUpdated = DateTime.UtcNow;
                }
                await _context.SaveChangesAsync();

                var movimiento = new AlmacenMovimiento
                {
                    TipoMovimiento = "INGRESO",
                    InventarioId = inventario.Id,
                    Cantidad = request.Cantidad,
                    DocumentoReferencia = request.Documento ?? "",
                    Responsable = request.Responsable ?? "",
                    Solicitante = request.Proveedor ?? "",
                    Peso = request.Peso,
                    DescripcionCarga = request.DescripcionCarga ?? ""
                };
                _context.AlmacenMovimientos.Add(movimiento);
                await _context.SaveChangesAsync();
                var ticketCode = $"HR-{DateTime.UtcNow.Year}-{movimiento.Id:D6}";
                movimiento.DocumentoReferencia = ticketCode; // Save it as the document reference
                await _context.SaveChangesAsync();

                return Ok(new { success = true, movimientoId = movimiento.Id, ticketCode });
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message + " " + ex.InnerException?.Message);
            }
        }

        // POST: api/almacen/despacho
        [HttpPost("despacho")]
        public async Task<IActionResult> RegistrarDespacho([FromBody] DespachoRequest request)
        {
            // For scanner: request.Documento could be the barcode scanned
            // Here, we simulate a scan logic
            var producto = await _context.AlmacenProductos.FirstOrDefaultAsync(p => p.Codigo == request.ProductoCodigo);
            if (producto == null) return NotFound(new { success = false, message = "Producto no encontrado." });

            var inventario = await _context.AlmacenInventarios.FirstOrDefaultAsync(i => i.ProductoId == producto.Id && i.CantidadDisponible >= request.Cantidad);
            if (inventario == null) return BadRequest(new { success = false, message = "Stock insuficiente o no disponible." });

            inventario.CantidadDisponible -= request.Cantidad;
            inventario.LastUpdated = DateTime.UtcNow;

            if (inventario.CantidadDisponible == 0)
            {
                if (request.MantenerEnRack)
                {
                    inventario.Lote = "MANTENIDO";
                }
                else
                {
                    inventario.Lote = "ELIMINADO";
                }
            }

            var movimiento = new AlmacenMovimiento
            {
                TipoMovimiento = "SALIDA",
                InventarioId = inventario.Id,
                Cantidad = request.Cantidad,
                DocumentoReferencia = request.Documento,
                Responsable = request.Responsable,
                Solicitante = request.NombreSolicitante,
                AreaSolicitante = request.AreaSolicitante,
                CargoSolicitante = request.CargoSolicitante,
                VehiculoAsignado = request.VehiculoAsignado,
                Turno = request.Turno,
                Planta = request.Planta,
                EquipoLinea = request.EquipoLinea,
                MotivoObservacion = request.MotivoObservacion
            };

            if (!string.IsNullOrEmpty(request.FirmaBase64))
            {
                try
                {
                    var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "firmas");
                    if (!Directory.Exists(uploadsFolder)) Directory.CreateDirectory(uploadsFolder);
                    
                    var base64Data = request.FirmaBase64.Split(',').Length > 1 ? request.FirmaBase64.Split(',')[1] : request.FirmaBase64;
                    var imageBytes = Convert.FromBase64String(base64Data);
                    var fileName = $"firma_{Guid.NewGuid()}.png";
                    var filePath = Path.Combine(uploadsFolder, fileName);
                    await System.IO.File.WriteAllBytesAsync(filePath, imageBytes);
                    
                    movimiento.FirmaUrl = $"/uploads/firmas/{fileName}";
                }
                catch (Exception ex)
                {
                    // Log error optionally
                }
            }

            _context.AlmacenMovimientos.Add(movimiento);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, movimientoId = movimiento.Id, firmaUrl = movimiento.FirmaUrl });
        }

        public class TrasladoRequest
        {
            public string ProductoCodigo { get; set; } = string.Empty;
            public int Cantidad { get; set; }
            public string NuevoRack { get; set; } = string.Empty;
            public string Responsable { get; set; } = string.Empty;
        }

        // POST: api/almacen/traslado
        [HttpPost("traslado")]
        public async Task<IActionResult> RegistrarTraslado([FromBody] TrasladoRequest request)
        {
            var producto = await _context.AlmacenProductos.FirstOrDefaultAsync(p => p.Codigo == request.ProductoCodigo);
            if (producto == null) return NotFound(new { success = false, message = "Producto no encontrado." });

            var inventario = await _context.AlmacenInventarios.FirstOrDefaultAsync(i => i.ProductoId == producto.Id && i.CantidadDisponible >= request.Cantidad);
            if (inventario == null) return BadRequest(new { success = false, message = "Stock insuficiente para trasladar." });

            // Reducir stock del origen
            inventario.CantidadDisponible -= request.Cantidad;
            inventario.LastUpdated = DateTime.UtcNow;

            // Buscar si ya existe la ubicacion destino, si no crearla
            var ubicacionDestino = await _context.AlmacenUbicaciones.FirstOrDefaultAsync(u => u.Rack == request.NuevoRack);
            if (ubicacionDestino == null)
            {
                ubicacionDestino = new AlmacenUbicacion
                {
                    Rack = request.NuevoRack,
                    Zona = "DEFAULT", // Required
                    CapacidadMaxima = 100,
                    Estado = "Ocupado"
                };
                _context.AlmacenUbicaciones.Add(ubicacionDestino);
                await _context.SaveChangesAsync();
            }

            // Buscar si ya existe el producto en el destino
            var inventarioDestino = await _context.AlmacenInventarios.FirstOrDefaultAsync(i => i.ProductoId == producto.Id && i.UbicacionId == ubicacionDestino.Id);
            if (inventarioDestino != null)
            {
                inventarioDestino.CantidadDisponible += request.Cantidad;
                inventarioDestino.LastUpdated = DateTime.UtcNow;
            }
            else
            {
                inventarioDestino = new AlmacenInventario
                {
                    ProductoId = producto.Id,
                    UbicacionId = ubicacionDestino.Id,
                    CantidadDisponible = request.Cantidad,
                    Lote = "TRASLADO",
                    LastUpdated = DateTime.UtcNow
                };
                _context.AlmacenInventarios.Add(inventarioDestino);
            }

            // Registrar movimiento de TRASLADO
            var movimiento = new AlmacenMovimiento
            {
                TipoMovimiento = "TRASLADO",
                InventarioId = inventario.Id, // Registramos el origen
                Cantidad = request.Cantidad,
                Responsable = request.Responsable,
                MotivoObservacion = $"Movido a {request.NuevoRack}"
            };

            _context.AlmacenMovimientos.Add(movimiento);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Traslado registrado exitosamente." });
        }

        public class AuditoriaRequest
        {
            public string Rack { get; set; } = string.Empty;
            public string Auditor { get; set; } = string.Empty;
            public List<AuditoriaItem> Items { get; set; } = new List<AuditoriaItem>();
        }

        public class AuditoriaItem
        {
            public string ProductoCodigo { get; set; } = string.Empty;
            public int CantidadEscaneada { get; set; }
        }

        // POST: api/almacen/auditoria
        [HttpPost("auditoria")]
        public async Task<IActionResult> RegistrarAuditoria([FromBody] AuditoriaRequest request)
        {
            var rackUbicacion = await _context.AlmacenUbicaciones.FirstOrDefaultAsync(u => u.Rack == request.Rack);
            if (rackUbicacion == null) return NotFound(new { success = false, message = "Rack no encontrado." });

            var inventariosActuales = await _context.AlmacenInventarios
                .Include(i => i.Producto)
                .Where(i => i.UbicacionId == rackUbicacion.Id)
                .ToListAsync();

            var auditoria = new AlmacenAuditoria
            {
                Rack = request.Rack,
                Auditor = request.Auditor,
                TieneDiscrepancias = false
            };

            var discrepanciasList = new List<object>();

            // Procesar items esperados
            foreach (var inv in inventariosActuales)
            {
                var escaneado = request.Items.FirstOrDefault(i => i.ProductoCodigo == inv.Producto.Codigo);
                int cantidadEscaneada = escaneado?.CantidadEscaneada ?? 0;
                int diferencia = cantidadEscaneada - inv.CantidadDisponible;

                var detalle = new AlmacenAuditoriaDetalle
                {
                    ProductoCodigo = inv.Producto.Codigo,
                    CantidadEsperada = inv.CantidadDisponible,
                    CantidadEscaneada = cantidadEscaneada,
                    Diferencia = diferencia
                };
                auditoria.Detalles.Add(detalle);

                if (diferencia != 0)
                {
                    auditoria.TieneDiscrepancias = true;
                    discrepanciasList.Add(new {
                        ProductoCodigo = inv.Producto.Codigo,
                        Nombre = inv.Producto.Nombre,
                        Esperado = inv.CantidadDisponible,
                        Encontrado = cantidadEscaneada,
                        Faltante = diferencia < 0 ? Math.Abs(diferencia) : 0,
                        Sobrante = diferencia > 0 ? diferencia : 0
                    });
                }
            }

            // Procesar items escaneados que NO existen en el rack según el sistema (Sobrantes totales)
            foreach (var item in request.Items)
            {
                if (!inventariosActuales.Any(i => i.Producto.Codigo == item.ProductoCodigo))
                {
                    var productoDb = await _context.AlmacenProductos.FirstOrDefaultAsync(p => p.Codigo == item.ProductoCodigo);
                    string nombreProd = productoDb?.Nombre ?? "Desconocido";

                    var detalle = new AlmacenAuditoriaDetalle
                    {
                        ProductoCodigo = item.ProductoCodigo,
                        CantidadEsperada = 0,
                        CantidadEscaneada = item.CantidadEscaneada,
                        Diferencia = item.CantidadEscaneada
                    };
                    auditoria.Detalles.Add(detalle);
                    auditoria.TieneDiscrepancias = true;

                    discrepanciasList.Add(new {
                        ProductoCodigo = item.ProductoCodigo,
                        Nombre = nombreProd,
                        Esperado = 0,
                        Encontrado = item.CantidadEscaneada,
                        Faltante = 0,
                        Sobrante = item.CantidadEscaneada
                    });
                }
            }

            _context.AlmacenAuditorias.Add(auditoria);
            await _context.SaveChangesAsync();

            return Ok(new { 
                success = true, 
                auditoriaId = auditoria.Id,
                tieneDiscrepancias = auditoria.TieneDiscrepancias,
                discrepancias = discrepanciasList
            });
        }

        // GET: api/almacen/producto/{codigo}/trazabilidad
        [HttpGet("producto/{codigo}/trazabilidad")]
        public async Task<IActionResult> GetTrazabilidad(string codigo)
        {
            var producto = await _context.AlmacenProductos.FirstOrDefaultAsync(p => p.Codigo == codigo);
            if (producto == null) return NotFound(new { success = false, message = "Producto no encontrado." });

            var movimientos = await _context.AlmacenMovimientos
                .Where(m => m.Inventario.ProductoId == producto.Id)
                .OrderByDescending(m => m.FechaMovimiento)
                .Select(m => new {
                    id = m.Id,
                    tipoMovimiento = m.TipoMovimiento,
                    cantidad = m.Cantidad,
                    documento = m.DocumentoReferencia,
                    responsable = m.Responsable,
                    observacion = m.MotivoObservacion,
                    fecha = m.FechaMovimiento,
                    firmaUrl = m.FirmaUrl
                })
                .ToListAsync();

            return Ok(new { success = true, trazabilidad = movimientos });
        }

        // GET: api/almacen/dashboard/abc
        [HttpGet("dashboard/abc")]
        public async Task<IActionResult> GetDashboardABC()
        {
            // Simple ABC analysis based on outgoing movements in the last 30 days
            var thirtyDaysAgo = DateTime.UtcNow.AddDays(-30);

            var despachos = await _context.AlmacenMovimientos
                .Where(m => m.TipoMovimiento == "SALIDA" && m.FechaMovimiento >= thirtyDaysAgo)
                .GroupBy(m => m.Inventario.ProductoId)
                .Select(g => new { ProductoId = g.Key, TotalDespachado = g.Sum(m => m.Cantidad) })
                .ToListAsync();

            var inventarios = await _context.AlmacenInventarios
                .Include(i => i.Producto)
                .GroupBy(i => new { i.ProductoId, i.Producto.Codigo, i.Producto.Nombre })
                .Select(g => new { 
                    ProductoId = g.Key.ProductoId, 
                    Codigo = g.Key.Codigo, 
                    Nombre = g.Key.Nombre, 
                    StockTotal = g.Sum(i => i.CantidadDisponible) 
                })
                .ToListAsync();

            // Combinar datos
            var analisis = inventarios.Select(inv => {
                var desp = despachos.FirstOrDefault(d => d.ProductoId == inv.ProductoId)?.TotalDespachado ?? 0;
                // Clasificación simple (en producción usar Pareto 80/15/5 basado en valor/frecuencia)
                string tipo = "C";
                if (desp > 50) tipo = "A";
                else if (desp > 10) tipo = "B";

                return new {
                    codigo = inv.Codigo,
                    nombre = inv.Nombre,
                    stock = inv.StockTotal,
                    salidasUltimoMes = desp,
                    categoriaABC = tipo
                };
            })
            .OrderBy(a => a.categoriaABC)
            .ThenByDescending(a => a.salidasUltimoMes)
            .ToList();

            var resumen = new {
                totalProductos = analisis.Count,
                A = analisis.Count(a => a.categoriaABC == "A"),
                B = analisis.Count(a => a.categoriaABC == "B"),
                C = analisis.Count(a => a.categoriaABC == "C"),
                criticosA = analisis.Count(a => a.categoriaABC == "A" && a.stock < 10) // Ejemplo de alerta
            };

            return Ok(new { success = true, analisis, resumen });
        }
    }
}
