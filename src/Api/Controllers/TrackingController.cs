using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using DNIContractApi.Hubs;
using DNIContractApi.Models.Entities;
using System.Threading.Tasks;
using System.Collections.Concurrent;
using System;

namespace DNIContractApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TrackingController : ControllerBase
    {
        private readonly IHubContext<TrackingHub> _hubContext;

        // Simulamos persistencia ligera en RAM para la demo
        private static readonly ConcurrentDictionary<string, TransUbicacion> _lastLocations = new();
        private static readonly ConcurrentDictionary<string, AssignmentPayload> _assignments = new();

        public TrackingController(IHubContext<TrackingHub> hubContext)
        {
            _hubContext = hubContext;
        }

        [HttpPost("location")]
        public async Task<IActionResult> PostLocation([FromBody] LocationPayload payload)
        {
            var location = new TransUbicacion
            {
                Latitud = payload.Latitud,
                Longitud = payload.Longitud,
                Velocidad = payload.Velocidad,
                Bateria = payload.Bateria,
                Timestamp = DateTime.UtcNow
            };

            // Regla de Negocio 1: Exceso de velocidad
            if (payload.Velocidad > 80)
            {
                var alerta = new TransAlerta
                {
                    Tipo = "critical",
                    Titulo = "Exceso de velocidad detectado",
                    Detalle = $"{payload.Velocidad} km/h (Límite 80)",
                    Timestamp = DateTime.UtcNow
                };
                await _hubContext.Clients.Group("Gerentes").SendAsync("ReceiveAlert", payload.UnidadPlaca, alerta);
            }

            // Regla de Negocio 2: Vehículo detenido
            if (payload.Velocidad == 0)
            {
                var alerta = new TransAlerta
                {
                    Tipo = "warning",
                    Titulo = "Vehículo detenido",
                    Detalle = "Velocidad 0 km/h registrada en ruta.",
                    Timestamp = DateTime.UtcNow
                };
                await _hubContext.Clients.Group("Gerentes").SendAsync("ReceiveAlert", payload.UnidadPlaca, alerta);
            }

            // Regla de Negocio 3: Desvío de ruta (salto en mapa)
            if (_lastLocations.TryGetValue(payload.UnidadPlaca, out var lastLoc))
            {
                var dLat = Math.Abs(payload.Latitud - lastLoc.Latitud);
                var dLng = Math.Abs(payload.Longitud - lastLoc.Longitud);
                if (dLat > 0.04 || dLng > 0.04)
                {
                    var alerta = new TransAlerta
                    {
                        Tipo = "critical",
                        Titulo = "Desvío de ruta",
                        Detalle = "Salto de posición sospechoso detectado.",
                        Timestamp = DateTime.UtcNow
                    };
                    await _hubContext.Clients.Group("Gerentes").SendAsync("ReceiveAlert", payload.UnidadPlaca, alerta);
                }
            }

            // Transmitir inmediatamente al Dashboard del gerente
            await _hubContext.Clients.Group("Gerentes").SendAsync("ReceiveLocation", payload.UnidadPlaca, location);

            // Actualizar la última posición DESPUÉS de las comprobaciones
            _lastLocations[payload.UnidadPlaca] = location;

            return Ok(new { success = true });
        }
        [HttpPost("sos")]
        public async Task<IActionResult> PostSos([FromBody] SosPayload payload)
        {
            Console.WriteLine($"[SOS] Recibido SOS de {payload.UnidadPlaca} - Lat: {payload.Latitud}, Lng: {payload.Longitud}, ConFoto: {!string.IsNullOrEmpty(payload.FotoBase64)}");
            var alerta = new TransAlerta
            {
                Tipo = "critical",
                Titulo = "🚨 BOTÓN DE PÁNICO (S.O.S)",
                Detalle = $"El conductor de la unidad ha presionado el botón de emergencia. Ubicación: Lat {payload.Latitud}, Lng {payload.Longitud}",
                FotoBase64 = payload.FotoBase64,
                Timestamp = DateTime.UtcNow
            };
            await _hubContext.Clients.Group("Gerentes").SendAsync("ReceiveAlert", payload.UnidadPlaca, alerta);
            Console.WriteLine($"[SOS] Alerta enviada por SignalR al grupo Gerentes para {payload.UnidadPlaca}");
            return Ok(new { success = true });
        }

        [HttpPost("incident")]
        public async Task<IActionResult> PostIncident([FromBody] IncidentPayload payload)
        {
            var alerta = new TransAlerta
            {
                Tipo = "warning",
                Titulo = "📸 Reporte de Incidencia",
                Detalle = payload.Descripcion,
                FotoBase64 = payload.FotoBase64,
                Timestamp = DateTime.UtcNow
            };
            await _hubContext.Clients.Group("Gerentes").SendAsync("ReceiveAlert", payload.UnidadPlaca, alerta);
            return Ok(new { success = true });
        }

        [HttpPost("location/batch")]
        public async Task<IActionResult> PostLocationBatch([FromBody] List<LocationPayload> payloads)
        {
            if (payloads == null || payloads.Count == 0) return Ok(new { success = true });
            
            // Enviamos solo el último punto al dashboard para actualizar la posición
            var lastPayload = payloads.Last();
            await PostLocation(lastPayload);
            
            return Ok(new { success = true, count = payloads.Count });
        }

        [HttpPost("assign")]
        public IActionResult PostAssign([FromBody] AssignmentPayload payload)
        {
            if(string.IsNullOrEmpty(payload.Vehiculo)) return BadRequest();
            _assignments[payload.Vehiculo] = payload;
            return Ok(new { success = true });
        }

        [HttpGet("assignment/{placa}")]
        public IActionResult GetAssignment(string placa)
        {
            if (_assignments.TryGetValue(placa, out var assignment))
            {
                return Ok(assignment);
            }
            return NotFound();
        }
    }

    public class AssignmentPayload
    {
        public string Vehiculo { get; set; } = string.Empty;
        public string Conductor { get; set; } = string.Empty;
        public string Ruta { get; set; } = string.Empty;
        public string TipoCarga { get; set; } = string.Empty;
        public string Peso { get; set; } = string.Empty;
        public string Guia { get; set; } = string.Empty;
        public string PuntoRecojo { get; set; } = string.Empty;
        public string ClienteDestino { get; set; } = string.Empty;
        public string GuiaPdfBase64 { get; set; } = string.Empty;
    }

    public class LocationPayload
    {
        public string UnidadPlaca { get; set; } = string.Empty;
        public double Latitud { get; set; }
        public double Longitud { get; set; }
        public double Velocidad { get; set; }
        public double Bateria { get; set; }
    }

    public class SosPayload
    {
        public string UnidadPlaca { get; set; } = string.Empty;
        public double Latitud { get; set; }
        public double Longitud { get; set; }
        public string FotoBase64 { get; set; } = string.Empty;
    }

    public class IncidentPayload
    {
        public string UnidadPlaca { get; set; } = string.Empty;
        public string Descripcion { get; set; } = string.Empty;
        public string FotoBase64 { get; set; } = string.Empty;
    }
}
