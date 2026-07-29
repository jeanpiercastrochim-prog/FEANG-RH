using System;

namespace DNIContractApi.Models.DTOs
{
    public class ContractProcessDto
    {
        public string Id { get; set; } = string.Empty;
        public string? FrontImagePath { get; set; }
        public string? BackImagePath { get; set; }
        
        public string Status { get; set; } = "Pendiente";
        public string? RejectionReason { get; set; }
        public string? Categoria { get; set; }
        
        public DateTime CreatedAt { get; set; }

        public string Nombres { get; set; } = string.Empty;
        public string ApellidoPaterno { get; set; } = string.Empty;
        public string ApellidoMaterno { get; set; } = string.Empty;
        public string? NumeroDNI { get; set; }
        public string? SignatureImagePath { get; set; }
        public string? SignatureMetadata { get; set; }
        public bool BiometricValidation { get; set; }
        public string? SistemaPensionario { get; set; } = string.Empty;
        public string FechaNacimiento { get; set; } = string.Empty;
        public string Sexo { get; set; } = string.Empty;
        public string EstadoCivil { get; set; } = string.Empty;
        public string Direccion { get; set; } = string.Empty;
        public string Departamento { get; set; } = string.Empty;
        public string Provincia { get; set; } = string.Empty;
        public string Distrito { get; set; } = string.Empty;

        public bool HasPrimary { get; set; }
        public string? PrimarySchool { get; set; }
        public bool HasSecondary { get; set; }
        public string? SecondarySchool { get; set; }
        public bool HasHigherEducation { get; set; }
        public string? HigherEducationInstitution { get; set; }

        public string? Telefono { get; set; }
        public string? CorreoPersonal { get; set; }
        public string? ContactoEmergencia { get; set; }
        public string? Parentesco { get; set; }
        public string? TelefonoEmergencia { get; set; }
    }
}
