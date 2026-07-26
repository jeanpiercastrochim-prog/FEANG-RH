namespace DNIContractApi.Models.Entities
{
    public class DniPhoto
    {
        public int Id { get; set; }
        public int EmployeeId { get; set; }
        public Employee? Employee { get; set; }

        public string? FrontImagePath { get; set; }
        public string? BackImagePath { get; set; }
    }
}
