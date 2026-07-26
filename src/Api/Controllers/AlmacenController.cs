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

        public class IngresoRequest
        {
            public string ProductoCodigo { get; set; } = string.Empty;
            public int Cantidad { get; set; }
            public string UbicacionRack { get; set; } = string.Empty;
            public string Documento { get; set; } = string.Empty;
            public string Responsable { get; set; } = string.Empty;
        }

        // POST: api/almacen/ingreso
        [HttpPost("ingreso")]
        public async Task<IActionResult> RegistrarIngreso([FromBody] IngresoRequest request)
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
                DocumentoReferencia = request.Documento,
                Responsable = request.Responsable
            };
            _context.AlmacenMovimientos.Add(movimiento);
            await _context.SaveChangesAsync();

            // QR Code content could be generated here, but frontend generates it from ID.
            return Ok(new { success = true, movimientoId = movimiento.Id, ticketCode = $"RCV-{movimiento.Id:D5}" });
        }

        // POST: api/almacen/despacho
        [HttpPost("despacho")]
        public async Task<IActionResult> RegistrarDespacho([FromBody] IngresoRequest request)
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
                Responsable = request.Responsable
            };
            _context.AlmacenMovimientos.Add(movimiento);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, movimientoId = movimiento.Id });
        }
    }
}
