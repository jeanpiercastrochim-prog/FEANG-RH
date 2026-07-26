namespace DNIContractApi.Models.DTOs
{
    public class PayslipExtractResult
    {
        public bool Success { get; set; }
        public string? ErrorMessage { get; set; }
        
        public string? Dni { get; set; }
        public decimal? NetAmount { get; set; }
        public string? Month { get; set; }
        public int? Year { get; set; }
    }
}
