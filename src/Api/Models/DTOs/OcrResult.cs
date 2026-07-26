using System.Collections.Generic;

namespace DNIContractApi.Models.DTOs
{
    public class OcrResult
    {
        public bool Success { get; set; }
        public float Confidence { get; set; }
        public DniData? Data { get; set; }
        public Dictionary<string, float> FieldConfidences { get; set; } = new Dictionary<string, float>();
        public List<string> Warnings { get; set; } = new List<string>();
        public string? ErrorMessage { get; set; }
    }
}
