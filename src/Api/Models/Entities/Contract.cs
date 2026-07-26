using System;
using System.Collections.Generic;

namespace DNIContractApi.Models.Entities
{
    public class Contract
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? FilePath { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public int? CargoId { get; set; }
        public Cargo? Cargo { get; set; }
        public ICollection<EmployeeContract> EmployeeContracts { get; set; } = new List<EmployeeContract>();
    }
}
