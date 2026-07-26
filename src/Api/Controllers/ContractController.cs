using DNIContractApi.Models.Entities;
using DNIContractApi.Models.DTOs;
using DNIContractApi.Services;
using Microsoft.AspNetCore.Mvc;

namespace DNIContractApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ContractController : ControllerBase
    {
        private readonly ContractService _contractService;

        public ContractController()
        {
            _contractService = new ContractService();
        }

        [HttpPost("generate")]
        public IActionResult GenerateContract([FromBody] ContractData data)
        {
            try
            {
                var pdfBytes = _contractService.GenerateContract(data);
                return File(pdfBytes, "application/pdf", $"Contrato_{data.NumeroDni}.pdf");
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Error generando el PDF", detail = ex.Message });
            }
        }
    }
}
