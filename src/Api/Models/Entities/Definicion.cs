using System;
using System.Collections.Generic;

namespace DNIContractApi.Models.Entities
{
    public class Definicion
    {
        public string Codigo { get; set; } = string.Empty;
        public string Nombre { get; set; } = string.Empty;
        public string? Descripcion { get; set; }
        public bool Activo { get; set; } = true;
        public int? CreatedBy { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public int? ModifiedBy { get; set; }
        public DateTime? ModifiedAt { get; set; }

        public ICollection<DefinicionDetalle> Detalles { get; set; } = new List<DefinicionDetalle>();
    }
}
