using System.Threading.Tasks;
using DNIContractApi.Models.Entities;
using DNIContractApi.Models.DTOs;

namespace DNIContractApi.Services
{
    public interface IOcrService
    {
        Task<OcrResult> ExtractAsync(byte[] frontImageBytes, byte[] backImageBytes, string mode = "IA");
        Task<PayslipExtractResult> ExtractPayslipDataAsync(string rawText);
        Task<PayslipExtractResult> ExtractPayslipDataFromFileAsync(byte[] fileBytes, string mimeType);
    }
}
