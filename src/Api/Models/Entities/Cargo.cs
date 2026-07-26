using System;

namespace DNIContractApi.Models.Entities
{
    public class Cargo
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string? Descripcion { get; set; }
        public string AreaDefinicionCodigo { get; set; } = "AREA";
        public int? AreaId { get; set; }
        public DefinicionDetalle? AreaDetalle { get; set; }

        public string NivelDefinicionCodigo { get; set; } = "NIVEL";
        public int? NivelId { get; set; }
        public DefinicionDetalle? NivelDetalle { get; set; }

        public decimal SueldoBase { get; set; } = 0m;

        public string Estado { get; set; } = "Activo";
        public int? CreatedBy { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public int? ModifiedBy { get; set; }
        public DateTime? ModifiedAt { get; set; }
    }
}
