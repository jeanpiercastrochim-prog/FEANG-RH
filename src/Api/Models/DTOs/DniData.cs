namespace DNIContractApi.Models.DTOs
{
    public class DniData
    {
        public string Nombres { get; set; } = string.Empty;
        public string ApellidoPaterno { get; set; } = string.Empty;
        public string ApellidoMaterno { get; set; } = string.Empty;
        public string NumeroDni { get; set; } = string.Empty;
        public string FechaNacimiento { get; set; } = string.Empty;
        public string Sexo { get; set; } = string.Empty;
        public string EstadoCivil { get; set; } = string.Empty;
        public string Direccion { get; set; } = string.Empty;
        public string Departamento { get; set; } = string.Empty;
        public string Provincia { get; set; } = string.Empty;
        public string Distrito { get; set; } = string.Empty;
        public string Ubigeo { get; set; } = string.Empty;
        public string? FrontImagePath { get; set; }
        public string? BackImagePath { get; set; }
        public bool WasSwapped { get; set; } = false;
    }
}
