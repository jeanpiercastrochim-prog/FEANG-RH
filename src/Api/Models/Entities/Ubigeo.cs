namespace DNIContractApi.Models.Entities
{
    public class Ubigeo
    {
        public int Id { get; set; }
        public string Departamento { get; set; } = string.Empty;
        public string Provincia { get; set; } = string.Empty;
        public string Distrito { get; set; } = string.Empty;
    }
}
