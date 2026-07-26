using System;

namespace DNIContractApi.Models.Entities
{
    public class DefinicionDetalle
    {
        public int Id { get; set; }
        public string DefinicionCodigo { get; set; } = string.Empty;
        public string Codigo { get; set; } = string.Empty;
        public string Nombre { get; set; } = string.Empty;
        public int Orden { get; set; }
        public bool Activo { get; set; } = true;
        public int? CreatedBy { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public int? ModifiedBy { get; set; }
        public DateTime? ModifiedAt { get; set; }

        public Definicion? Definicion { get; set; }
    }
}
