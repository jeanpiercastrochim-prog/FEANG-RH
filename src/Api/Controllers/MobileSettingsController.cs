using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DNIContractApi.Data;
using DNIContractApi.Models.Entities;

namespace DNIContractApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MobileSettingsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public MobileSettingsController(AppDbContext context)
        {
            _context = context;
        }

        private async Task EnsureFeaturesSeeded()
        {
            var definicion = await _context.Definiciones.FirstOrDefaultAsync(d => d.Codigo == "MOBILE_FEATURES");
            if (definicion == null)
            {
                definicion = new Definicion
                {
                    Codigo = "MOBILE_FEATURES",
                    Nombre = "Configuración de Funciones Móviles",
                    Descripcion = "Controla qué botones ven los usuarios en la app móvil",
                    Activo = true
                };
                _context.Definiciones.Add(definicion);
                await _context.SaveChangesAsync();

                var defaultFeatures = new[]
                {
                    new DefinicionDetalle { DefinicionCodigo = "MOBILE_FEATURES", Codigo = "feature_contratos", Nombre = "Contratos", Orden = 1, Activo = true },
                    new DefinicionDetalle { DefinicionCodigo = "MOBILE_FEATURES", Codigo = "feature_boletas", Nombre = "Boletas", Orden = 2, Activo = true },
                    new DefinicionDetalle { DefinicionCodigo = "MOBILE_FEATURES", Codigo = "feature_mensajes", Nombre = "Mensajes", Orden = 3, Activo = true },
                    new DefinicionDetalle { DefinicionCodigo = "MOBILE_FEATURES", Codigo = "feature_vacaciones", Nombre = "Vacaciones", Orden = 4, Activo = true },
                    new DefinicionDetalle { DefinicionCodigo = "MOBILE_FEATURES", Codigo = "feature_capacitacion", Nombre = "Capacitación", Orden = 5, Activo = true }
                };

                _context.DefinicionDetalles.AddRange(defaultFeatures);
                await _context.SaveChangesAsync();
            }
            else
            {
                // Ensure all default features exist in case they were deleted or missing
                var defaultCodes = new[] { "feature_contratos", "feature_boletas", "feature_mensajes", "feature_vacaciones", "feature_capacitacion" };
                var existingFeatures = await _context.DefinicionDetalles
                    .Where(d => d.DefinicionCodigo == "MOBILE_FEATURES")
                    .ToListAsync();

                foreach (var code in defaultCodes)
                {
                    if (!existingFeatures.Any(f => f.Codigo == code))
                    {
                        var name = code.Replace("feature_", "");
                        name = char.ToUpper(name[0]) + name.Substring(1);
                        _context.DefinicionDetalles.Add(new DefinicionDetalle
                        {
                            DefinicionCodigo = "MOBILE_FEATURES",
                            Codigo = code,
                            Nombre = name,
                            Activo = true,
                            Orden = 10
                        });
                    }
                }
                await _context.SaveChangesAsync();
            }
        }

        [HttpGet("features")]
        public async Task<IActionResult> GetFeatures()
        {
            await EnsureFeaturesSeeded();

            var features = await _context.DefinicionDetalles
                .Where(d => d.DefinicionCodigo == "MOBILE_FEATURES")
                .ToListAsync();

            var result = new Dictionary<string, bool>();
            foreach (var feature in features)
            {
                result[feature.Codigo] = feature.Activo;
            }

            return Ok(result);
        }

        [HttpGet("features/raw")]
        public async Task<IActionResult> GetFeaturesRaw()
        {
            await EnsureFeaturesSeeded();

            var features = await _context.DefinicionDetalles
                .Where(d => d.DefinicionCodigo == "MOBILE_FEATURES")
                .Select(d => new {
                    id = d.Id,
                    codigo = d.Codigo,
                    nombre = d.Nombre,
                    activo = d.Activo
                })
                .OrderBy(d => d.id)
                .ToListAsync();

            return Ok(features);
        }

        public class FeatureUpdateRequest
        {
            public string Codigo { get; set; } = string.Empty;
            public bool Activo { get; set; }
        }

        [HttpPost("features")]
        public async Task<IActionResult> UpdateFeatures([FromBody] List<FeatureUpdateRequest> updates)
        {
            await EnsureFeaturesSeeded();

            var features = await _context.DefinicionDetalles
                .Where(d => d.DefinicionCodigo == "MOBILE_FEATURES")
                .ToListAsync();

            foreach (var update in updates)
            {
                var feature = features.FirstOrDefault(f => f.Codigo == update.Codigo);
                if (feature != null)
                {
                    feature.Activo = update.Activo;
                    feature.ModifiedAt = DateTime.UtcNow;
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new { success = true, message = "Configuraciones actualizadas exitosamente." });
        }
    }
}
