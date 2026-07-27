using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace DNIContractApi.Models.Entities
{
    public class Employee
    {
        public int Id { get; set; }
        public int? UserId { get; set; }
        public User? User { get; set; }

        public string Nombres { get; set; } = string.Empty;
        public string ApellidoPaterno { get; set; } = string.Empty;
        public string ApellidoMaterno { get; set; } = string.Empty;
        public string FullName => $"{Nombres} {ApellidoPaterno} {ApellidoMaterno}".Trim();

        public string Dni { get; set; } = string.Empty;
        
        public DateTime FechaNacimiento { get; set; } = DateTime.UtcNow.AddYears(-25);

        public int GeneroId { get; set; }
        [DatabaseGenerated(DatabaseGeneratedOption.Computed)]
        public string GeneroDefinicionCodigo { get; set; } = "GENERO";
        public DefinicionDetalle? Genero { get; set; }

        public int EstadoCivilId { get; set; }
        [DatabaseGenerated(DatabaseGeneratedOption.Computed)]
        public string EstadoCivilDefinicionCodigo { get; set; } = "ESTADO_CIVIL";
        public DefinicionDetalle? EstadoCivilDetalle { get; set; }

        public string Direccion { get; set; } = string.Empty;
        
        public int UbigeoId { get; set; }
        public Ubigeo? Ubigeo { get; set; }

        public string? Telefono { get; set; }
        public string? CorreoPersonal { get; set; }
        public string? CorreoCorporativo { get; set; }

        public int CargoId { get; set; }
        public Cargo? Cargo { get; set; }

        public decimal BaseSalary { get; set; }

        public int EstadoEmpleadoId { get; set; }
        [DatabaseGenerated(DatabaseGeneratedOption.Computed)]
        public string EstadoEmpleadoDefinicionCodigo { get; set; } = "ESTADO_EMPLEADO";
        public DefinicionDetalle? EstadoEmpleado { get; set; }

        public DateTime FechaIngreso { get; set; } = DateTime.UtcNow;
        public DateTime? FechaCese { get; set; }

        public int TipoContratoId { get; set; }
        [DatabaseGenerated(DatabaseGeneratedOption.Computed)]
        public string TipoContratoDefinicionCodigo { get; set; } = "TIPO_CONTRATO";
        public DefinicionDetalle? TipoContrato { get; set; }

        public int? BancoId { get; set; }
        [DatabaseGenerated(DatabaseGeneratedOption.Computed)]
        public string BancoDefinicionCodigo { get; set; } = "BANCO";
        public DefinicionDetalle? Banco { get; set; }

        public int? TipoCuentaBancariaId { get; set; }
        [DatabaseGenerated(DatabaseGeneratedOption.Computed)]
        public string TipoCuentaBancariaDefinicionCodigo { get; set; } = "TIPO_CUENTA_BANCARIA";
        public DefinicionDetalle? TipoCuentaBancaria { get; set; }

        public string? NumeroCuenta { get; set; }
        public string? CCI { get; set; }

        public int? AFPId { get; set; }
        [DatabaseGenerated(DatabaseGeneratedOption.Computed)]
        public string AFPDefinicionCodigo { get; set; } = "AFP";
        public DefinicionDetalle? AFP { get; set; }

        public string? CodigoAFP { get; set; }
        public string? SignatureImagePath { get; set; }
        public bool HasBiometrics { get; set; }
        public string? ProfileImagePath { get; set; }

        public string? ContactoEmergencia { get; set; }
        public string? Parentesco { get; set; }
        public string? TelefonoEmergencia { get; set; }

        public int? CreatedBy { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public int? ModifiedBy { get; set; }
        public DateTime? ModifiedAt { get; set; }

        // RELATIONS
        public ICollection<EmployeeEducation> Educations { get; set; } = new List<EmployeeEducation>();
        public ICollection<EmployeeContract> Contracts { get; set; } = new List<EmployeeContract>();
        public ICollection<EmployeePayslip> Payslips { get; set; } = new List<EmployeePayslip>();
        public ICollection<DniPhoto> DniPhotos { get; set; } = new List<DniPhoto>();

        // NOT MAPPED COMPATIBILITY PROPERTIES
        [NotMapped]
        public string Sexo { get; set; } = string.Empty;

        [NotMapped]
        public string EstadoCivil { get; set; } = string.Empty;

        [NotMapped]
        public string Departamento { get; set; } = string.Empty;

        [NotMapped]
        public string Provincia { get; set; } = string.Empty;

        [NotMapped]
        public string Distrito { get; set; } = string.Empty;

        [NotMapped]
        public string Position { get; set; } = string.Empty;

        [NotMapped]
        public string Password { get; set; } = string.Empty;

        [NotMapped]
        public string Email { get; set; } = string.Empty;

        [NotMapped]
        public bool HasPrimary { get; set; }

        [NotMapped]
        public string? PrimarySchool { get; set; }

        [NotMapped]
        public bool HasSecondary { get; set; }

        [NotMapped]
        public string? SecondarySchool { get; set; }

        [NotMapped]
        public bool HasHigherEducation { get; set; }

        [NotMapped]
        public string? HigherEducationInstitution { get; set; }
    }
}
