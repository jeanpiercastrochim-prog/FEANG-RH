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

                return Ok(new { success = true, movimientoId = movimiento.Id, ticketCode = $"RCV-{movimiento.Id:D5}" });
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
            _context.AlmacenMovimientos.Add(movimiento);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, movimientoId = movimiento.Id });
        }
    }
}
