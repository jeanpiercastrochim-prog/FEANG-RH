using Microsoft.AspNetCore.Mvc;
using DNIContractApi.Services;

namespace DNIContractApi.Controllers
{
    public class ExtractPayslipRequest
    {
        public string RawText { get; set; } = string.Empty;
    }

    [ApiController]
    [Route("api/[controller]")]
    public class OcrController : ControllerBase
    {
        private readonly IOcrService _ocrService;
        private readonly IWebHostEnvironment _env;

        public OcrController(IOcrService ocrService, IWebHostEnvironment env)
        {
            _ocrService = ocrService;
            _env = env;
        }

        [HttpPost("extract")]
        public async Task<IActionResult> ExtractFromImage(IFormFile frontImage, IFormFile backImage, [FromForm] string mode = "IA")
        {
            if (frontImage == null || backImage == null)
                return BadRequest(new { success = false, message = "Ambas imágenes (frontal y trasera) son requeridas." });

            var uploadsFolder = Path.Combine(_env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "uploads");
            if (!Directory.Exists(uploadsFolder)) Directory.CreateDirectory(uploadsFolder);

            var frontFileName = $"{Guid.NewGuid()}_front.jpg";
            var frontPath = Path.Combine(uploadsFolder, frontFileName);
            
            var backFileName = $"{Guid.NewGuid()}_back.jpg";
            var backPath = Path.Combine(uploadsFolder, backFileName);

            using var frontMs = new MemoryStream();
            using var backMs = new MemoryStream();
            
            await frontImage.CopyToAsync(frontMs);
            await backImage.CopyToAsync(backMs);

            await System.IO.File.WriteAllBytesAsync(frontPath, frontMs.ToArray());
            await System.IO.File.WriteAllBytesAsync(backPath, backMs.ToArray());

            var result = await _ocrService.ExtractAsync(frontMs.ToArray(), backMs.ToArray(), mode);

            if (result.Success && result.Data != null)
            {
                result.Data.FrontImagePath = $"/uploads/{frontFileName}";
                result.Data.BackImagePath = $"/uploads/{backFileName}";
                return Ok(result);
            }
            
            return StatusCode(500, result);
        }

        [HttpPost("extract-payslip")]
        public async Task<IActionResult> ExtractPayslip([FromBody] ExtractPayslipRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.RawText))
                return BadRequest(new { success = false, message = "El texto de la boleta no puede estar vacío." });

            var result = await _ocrService.ExtractPayslipDataAsync(request.RawText);

            if (result.Success)
            {
                return Ok(result);
            }
            return StatusCode(500, result);
        }

        [HttpPost("extract-payslip-file")]
        public async Task<IActionResult> ExtractPayslipFile(IFormFile file)
        {
            if (file == null)
                return BadRequest(new { success = false, message = "El archivo de la boleta es requerido." });

            using var ms = new MemoryStream();
            await file.CopyToAsync(ms);

            var mimeType = file.ContentType;
            if (string.IsNullOrEmpty(mimeType))
            {
                mimeType = "application/pdf";
            }

            var result = await _ocrService.ExtractPayslipDataFromFileAsync(ms.ToArray(), mimeType);

            if (result.Success)
            {
                return Ok(result);
            }
            
            return StatusCode(500, result);
        }
    }
}
