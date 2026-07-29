using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DNIContractApi.Models.Entities
{
    public class EmployeeContract
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        public int EmployeeId { get; set; }
        public Employee? Employee { get; set; }

        public int ContractId { get; set; }
        public Contract? Contract { get; set; }

        [Column("Estado")]
        public string Status { get; set; } = "Pendiente";
        public string? RejectionReason { get; set; }
        public string? SignatureMetadata { get; set; }
        public bool BiometricValidation { get; set; } = false;
        public DateTime? SignedAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
