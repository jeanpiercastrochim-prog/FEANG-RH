using System;

namespace DNIContractApi.Models.Entities
{
    public class TransAlerta
    {
        public int Id { get; set; }
        public int ViajeId { get; set; }
        public TransViaje? Viaje { get; set; }

        public string Tipo { get; set; } = string.Empty; // critical, warning, info
        public string Titulo { get; set; } = string.Empty;
        public string Detalle { get; set; } = string.Empty;
        public string? FotoBase64 { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public bool IsActive { get; set; } = true;
    }
}
