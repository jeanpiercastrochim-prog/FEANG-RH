using System;

namespace DNIContractApi.Models.Entities
{
    public class EmployeeRequest
    {
        public int Id { get; set; }
        
        // Relación con el empleado
        public int EmployeeId { get; set; }
        public Employee? Employee { get; set; }

        // Tipo de solicitud (ej. "Cambio de AFP", "Constancia de Trabajo")
        public string? Type { get; set; }

        // Datos del formulario en formato JSON o string estructurado
        public string? FormData { get; set; }

        // Estado de la solicitud (ej. "Pendiente", "Aprobado", "Rechazado")
        public string? Status { get; set; }

        // Observaciones adicionales o respuesta de RRHH
        public string? Observations { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
}
