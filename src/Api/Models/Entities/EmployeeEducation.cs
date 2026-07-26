using System;

namespace DNIContractApi.Models.Entities
{
    public class EmployeeEducation
    {
        public int Id { get; set; }
        public int EmployeeId { get; set; }
        public Employee? Employee { get; set; }

        public int NivelEducacionId { get; set; }
        public string NivelEducacionDefinicionCodigo { get; set; } = "NIVEL_EDUCACION";
        public DefinicionDetalle? NivelEducacion { get; set; }

        public string Institucion { get; set; } = string.Empty;
        public string? Carrera { get; set; }
        public DateTime? FechaInicio { get; set; }
        public DateTime? FechaFin { get; set; }
        public string Estado { get; set; } = "En curso";
        
        public int? CreatedBy { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public int? ModifiedBy { get; set; }
        public DateTime? ModifiedAt { get; set; }
    }
}
