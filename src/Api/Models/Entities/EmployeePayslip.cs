using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace DNIContractApi.Models.Entities
{
    public class EmployeePayslip
    {
        public int Id { get; set; }

        public int EmployeeId { get; set; }
        public Employee? Employee { get; set; }

        public int PayslipId { get; set; }
        public Payslip? Payslip { get; set; }

        public decimal SueldoBase { get; set; }
        public decimal HorasExtras { get; set; }
        public decimal Bonificaciones { get; set; }
        public decimal Comisiones { get; set; }
        public decimal AFP { get; set; }
        public decimal ONP { get; set; }
        public decimal Essalud { get; set; }
        public decimal QuintaCategoria { get; set; }
        public decimal OtrosDescuentos { get; set; }

        [DatabaseGenerated(DatabaseGeneratedOption.Computed)]
        public decimal NetoPagar { get; set; }

        [NotMapped]
        public decimal AmountPaid
        {
            get => NetoPagar > 0 ? NetoPagar : SueldoBase;
            set => SueldoBase = value;
        }

        public string Estado { get; set; } = "Pendiente";

        [NotMapped]
        public string Status
        {
            get => Estado;
            set => Estado = value;
        }

        public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
    }
}
