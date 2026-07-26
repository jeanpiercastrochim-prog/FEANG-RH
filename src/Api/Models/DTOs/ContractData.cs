namespace DNIContractApi.Models.DTOs
{
    public class ContractData
    {
        public string? Nombres { get; set; } = string.Empty;
        public string? ApellidoPaterno { get; set; } = string.Empty;
        public string? ApellidoMaterno { get; set; } = string.Empty;
        public string? NumeroDni { get; set; } = string.Empty;
        public string? FechaNacimiento { get; set; } = string.Empty;
        public string? Sexo { get; set; } = string.Empty;
        public string? Direccion { get; set; } = string.Empty;
        public string? Ubigeo { get; set; } = string.Empty;
        
        public string? NivelEducativo { get; set; } = string.Empty;
        public string? Cargo { get; set; } = "Operario de Producción";
        public decimal SueldoBasico { get; set; } = 1025.00m;
        public string? SignatureImagePath { get; set; } = string.Empty;
        public string? SistemaPensionario { get; set; } = string.Empty;

        // Nuevos campos de educación
        public string? Primaria { get; set; } = "Completa";
        public string? Secundaria { get; set; } = "Completa";
        public string? Area { get; set; } = string.Empty;
        public string? FechaInicio { get; set; } = string.Empty;
        public bool HasBiometrics { get; set; } = false;

        public string NombreCompleto => $"{Nombres} {ApellidoPaterno} {ApellidoMaterno}".Trim();
    }
}
