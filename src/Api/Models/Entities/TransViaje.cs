using System;
using System.Collections.Generic;

namespace DNIContractApi.Models.Entities
{
    public class TransViaje
    {
        public int Id { get; set; }
        public string ConductorDni { get; set; } = string.Empty;
        public string UnidadPlaca { get; set; } = string.Empty; // Ej. CHV-014
        public string Origen { get; set; } = string.Empty;
        public string Destino { get; set; } = string.Empty;
        public string Estado { get; set; } = "En Ruta"; // En Ruta, Completado, Pausado
        public DateTime FechaInicio { get; set; }
        public DateTime? FechaFin { get; set; }

        public ICollection<TransUbicacion> Ubicaciones { get; set; } = new List<TransUbicacion>();
        public ICollection<TransAlerta> Alertas { get; set; } = new List<TransAlerta>();
    }
}
