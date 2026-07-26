using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace DNIContractApi.Models.Entities
{
    public class Payslip
    {
        public int Id { get; set; }

        public DateTime Periodo { get; set; }

        [NotMapped]
        public string Month
        {
            get => GetMonthName(Periodo.Month);
            set => Periodo = new DateTime(Periodo.Year == 0 ? DateTime.UtcNow.Year : Periodo.Year, ParseMonthName(value), 1);
        }

        [NotMapped]
        public int Year
        {
            get => Periodo.Year == 0 ? DateTime.UtcNow.Year : Periodo.Year;
            set => Periodo = new DateTime(value, Periodo.Month == 0 ? 1 : Periodo.Month, 1);
        }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<EmployeePayslip> EmployeePayslips { get; set; } = new List<EmployeePayslip>();

        private static int ParseMonthName(string month)
        {
            return month.ToLower() switch
            {
                "enero" => 1,
                "febrero" => 2,
                "marzo" => 3,
                "abril" => 4,
                "mayo" => 5,
                "junio" => 6,
                "julio" => 7,
                "agosto" => 8,
                "septiembre" => 9,
                "setiembre" => 9,
                "octubre" => 10,
                "noviembre" => 11,
                "diciembre" => 12,
                _ => 1
            };
        }

        private static string GetMonthName(int month)
        {
            return month switch
            {
                1 => "Enero",
                2 => "Febrero",
                3 => "Marzo",
                4 => "Abril",
                5 => "Mayo",
                6 => "Junio",
                7 => "Julio",
                8 => "Agosto",
                9 => "Septiembre",
                10 => "Octubre",
                11 => "Noviembre",
                12 => "Diciembre",
                _ => "Enero"
            };
        }
    }
}
