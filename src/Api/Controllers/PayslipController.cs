using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DNIContractApi.Data;
using DNIContractApi.Models.Entities;
using UglyToad.PdfPig;
using DNIContractApi.Models;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Hosting;
using System.IO;

namespace DNIContractApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PayslipController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _env;
        private readonly DNIContractApi.Services.IOcrService _ocrService;

        public PayslipController(AppDbContext context, IWebHostEnvironment env, DNIContractApi.Services.IOcrService ocrService)
        {
            _context = context;
            _env = env;
            _ocrService = ocrService;
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetStats([FromQuery] string? month = null, [FromQuery] int? year = null)
        {
            var targetMonth = string.IsNullOrEmpty(month) ? DateTime.Now.ToString("MMMM") : month;
            var targetYear = year ?? DateTime.Now.Year;
            var targetPeriod = new DateTime(targetYear, ParseMonthName(targetMonth), 1);

            var query = _context.EmployeePayslips
                .Include(ep => ep.Employee)
                .Include(ep => ep.Payslip)
                .Where(ep => ep.Payslip != null && ep.Payslip.Periodo == targetPeriod);

            var allPayslips = await query.ToListAsync();

            var totalAmount = allPayslips.Sum(p => p.AmountPaid);
            var totalCount = allPayslips.Count;
            var sentCount = allPayslips.Count(p => p.Estado == "Enviado");
            var pendingCount = totalCount - sentCount;
            
            // Just simulate read rate for now, or use a new status "Leído" if we add it later
            var readCount = allPayslips.Count(p => p.Estado == "Leído"); 
            var signedCount = allPayslips.Count(p => p.Estado == "Firmado");

            var activeEmployeesCount = await _context.Employees.CountAsync(e => e.EstadoEmpleadoId != null); // approx

            return Ok(new
            {
                TotalAmount = totalAmount,
                TotalPayslips = totalCount,
                SentCount = sentCount,
                PendingCount = pendingCount,
                ReadCount = readCount,
                SignedCount = signedCount,
                TotalActiveEmployees = activeEmployeesCount
            });
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? dni = null)
        {
            var query = _context.EmployeePayslips
                .Include(p => p.Employee)
                    .ThenInclude(e => e.Cargo)
                .Include(p => p.Employee)
                    .ThenInclude(e => e.User)
                .Include(p => p.Payslip)
                .AsQueryable();

            if (!string.IsNullOrEmpty(dni))
            {
                query = query.Where(p => p.Employee != null && p.Employee.Dni == dni);
            }

            var rawList = await query.ToListAsync();

            // Populate the NotMapped properties in memory
            foreach (var item in rawList)
            {
                if (item.Employee != null)
                {
                    Services.DbHelper.PopulateNotMapped(item.Employee);
                }
            }

            var data = rawList.Select(p => new
            {
                p.Id,
                FullName = p.Employee != null ? (p.Employee.Nombres + " " + p.Employee.ApellidoPaterno + " " + p.Employee.ApellidoMaterno).Trim() : "",
                Dni = p.Employee?.Dni ?? "",
                Position = p.Employee?.Position ?? "",
                Month = p.Payslip?.Month ?? "",
                Year = p.Payslip?.Year ?? DateTime.UtcNow.Year,
                p.AmountPaid,
                p.Status,
                p.GeneratedAt,
                HasAppAccount = p.Employee?.User != null && p.Employee.User.IsActive
            }).ToList();

            return Ok(data);
        }

        [HttpPost("send-all")]
        public async Task<IActionResult> SendAll()
        {
            var pendingPayslips = await _context.EmployeePayslips
                .Include(p => p.Employee)
                .Where(p => p.Status == "Pendiente" && p.Employee.UserId != null)
                .ToListAsync();
            
            foreach (var payslip in pendingPayslips)
            {
                payslip.Status = "Enviado";
                if (payslip.Employee != null)
                {
                    _context.AppNotifications.Add(new AppNotification
                    {
                        EmployeeDni = payslip.Employee.Dni,
                        Title = "Nueva Boleta de Pago",
                        Message = "Tu boleta de pago ha sido generada y está lista para descargar.",
                        IsRead = false,
                        CreatedAt = DateTime.Now
                    });
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = $"{pendingPayslips.Count} boletas enviadas exitosamente." });
        }

        [HttpPost("send/{id}")]
        public async Task<IActionResult> SendSingle(int id)
        {
            var payslip = await _context.EmployeePayslips
                .Include(p => p.Employee)
                .FirstOrDefaultAsync(p => p.Id == id);
                
            if (payslip == null)
            {
                return NotFound(new { message = "Boleta no encontrada." });
            }

            if (payslip.Status == "Pendiente")
            {
                payslip.Status = "Enviado";
                
                if (payslip.Employee != null)
                {
                    _context.AppNotifications.Add(new AppNotification
                    {
                        EmployeeDni = payslip.Employee.Dni,
                        Title = "Nueva Boleta de Pago",
                        Message = "Tu boleta de pago ha sido generada y está lista para descargar.",
                        IsRead = false,
                        CreatedAt = DateTime.Now
                    });
                }
                
                await _context.SaveChangesAsync();
            }

            return Ok(new { message = "Boleta enviada exitosamente." });
        }

        private static int ParseMonthName(string month)
        {
            return month.ToLower() switch
            {
                "enero" => 1,
                "febrero" => 2,
                "marzo" => 3,
                "abril" => 4,
                "mayo" => 5,
                "junio" => 6,
                "julio" => 7,
                "agosto" => 8,
                "septiembre" => 9,
                "setiembre" => 9,
                "octubre" => 10,
                "noviembre" => 11,
                "diciembre" => 12,
                _ => 1
            };
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSingle(int id)
        {
            var payslip = await _context.EmployeePayslips.FindAsync(id);
            if (payslip == null) return NotFound(new { message = "Boleta no encontrada." });

            _context.EmployeePayslips.Remove(payslip);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Boleta eliminada exitosamente." });
        }

        [HttpDelete("delete-sent")]
        public async Task<IActionResult> DeleteSent()
        {
            var sentPayslips = await _context.EmployeePayslips
                .Where(p => p.Status == "Enviado")
                .ToListAsync();

            if (sentPayslips.Count == 0)
            {
                return Ok(new { message = "No hay boletas enviadas para eliminar." });
            }

            _context.EmployeePayslips.RemoveRange(sentPayslips);
            await _context.SaveChangesAsync();
            return Ok(new { message = $"{sentPayslips.Count} boletas enviadas eliminadas exitosamente." });
        }

        [HttpPost("upload-bulk")]
        public async Task<IActionResult> UploadBulk([FromForm] List<IFormFile> files, [FromForm] string? targetMonth = null, [FromForm] int? targetYear = null, [FromForm] string? mappingsJson = null)
        {
            if (files == null || files.Count == 0) return BadRequest("No se encontraron archivos.");

            var results = new List<object>();
            var globalMonth = !string.IsNullOrEmpty(targetMonth) ? targetMonth : DateTime.Now.ToString("MMMM", new System.Globalization.CultureInfo("es-ES"));
            var globalYear = targetYear ?? DateTime.Now.Year;

            // Deserialize frontend mappings if they exist
            var frontendMappings = new List<FileMappingDto>();
            if (!string.IsNullOrEmpty(mappingsJson))
            {
                try
                {
                    frontendMappings = System.Text.Json.JsonSerializer.Deserialize<List<FileMappingDto>>(mappingsJson, new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new List<FileMappingDto>();
                }
                catch (Exception)
                {
                    // Ignore parse errors
                }
            }

            var uploadFolder = Path.Combine(_env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "payslips");
            if (!Directory.Exists(uploadFolder)) Directory.CreateDirectory(uploadFolder);

            foreach (var file in files)
            {
                if (file.Length == 0 || !file.FileName.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase)) continue;

                string detectedDni = null;
                decimal netAmount = 0m;
                byte[] fileBytes;

                using (var ms = new MemoryStream())
                {
                    await file.CopyToAsync(ms);
                    fileBytes = ms.ToArray();
                }

                var mapping = frontendMappings.FirstOrDefault(m => m.FileName == file.FileName);
                var currentMonth = mapping?.Month ?? globalMonth;
                var currentYear = mapping?.Year ?? globalYear;

                // Resolve target period date per file
                int monthNumber = ParseMonthName(currentMonth);
                var targetPeriod = new DateTime(currentYear, monthNumber == 0 ? DateTime.Now.Month : monthNumber, 1);

                // Ensure payslip parent exists for this period
                var parentPayslip = await _context.Payslips.FirstOrDefaultAsync(p => p.Periodo == targetPeriod);
                if (parentPayslip == null)
                {
                    parentPayslip = new Payslip { Periodo = targetPeriod };
                    _context.Payslips.Add(parentPayslip);
                    await _context.SaveChangesAsync();
                }

                if (mapping != null && !string.IsNullOrEmpty(mapping.Dni) && mapping.Amount > 0)
                {
                    // Use frontend data (single analysis)
                    detectedDni = mapping.Dni;
                    netAmount = mapping.Amount;
                }
                else
                {
                    // Fallback to backend OCR
                    try
                    {
                        var mimeType = file.ContentType;
                        if (string.IsNullOrEmpty(mimeType)) mimeType = "application/pdf";
                        
                        var extractResult = await _ocrService.ExtractPayslipDataFromFileAsync(fileBytes, mimeType);
                        if (extractResult != null && extractResult.Success)
                        {
                            detectedDni = extractResult.Dni;
                            netAmount = extractResult.NetAmount ?? 0m;
                            
                            if (!string.IsNullOrEmpty(extractResult.Month)) currentMonth = extractResult.Month;
                            if (extractResult.Year.HasValue) currentYear = extractResult.Year.Value;

                            monthNumber = ParseMonthName(currentMonth);
                            targetPeriod = new DateTime(currentYear, monthNumber == 0 ? DateTime.Now.Month : monthNumber, 1);
                            parentPayslip = await _context.Payslips.FirstOrDefaultAsync(p => p.Periodo == targetPeriod);
                            if (parentPayslip == null)
                            {
                                parentPayslip = new Payslip { Periodo = targetPeriod };
                                _context.Payslips.Add(parentPayslip);
                                await _context.SaveChangesAsync();
                            }
                        }
                        else
                        {
                            // Very basic fallback if AI totally fails (only relying on DNI inside filename)
                            var fileNameMatch = Regex.Match(file.FileName, @"\d{7,8}");
                            if (fileNameMatch.Success) detectedDni = fileNameMatch.Value;
                        }
                        if (netAmount == 0) netAmount = 1500m;
                    }
                    catch (Exception ex) 
                    {
                        Console.WriteLine($"Error extrayendo PDF: {ex.Message}");
                    }
                }

                if (detectedDni != null)
                {
                    var employee = await _context.Employees.FirstOrDefaultAsync(e => e.Dni == detectedDni);
                    if (employee == null)
                    {
                        results.Add(new { fileName = file.FileName, dni = detectedDni, status = "EmployeeNotFound", employeeName = "Empleado no registrado" });
                    }
                    else
                    {
                        var existing = await _context.EmployeePayslips.FirstOrDefaultAsync(ep => ep.EmployeeId == employee.Id && ep.PayslipId == parentPayslip.Id);
                        if (existing != null)
                        {
                            var tempFileName = $"temp_{Guid.NewGuid()}.pdf";
                            var tempFilePath = Path.Combine(uploadFolder, tempFileName);
                            await System.IO.File.WriteAllBytesAsync(tempFilePath, fileBytes);

                            results.Add(new { 
                                fileName = file.FileName, 
                                dni = detectedDni, 
                                status = "Duplicate", 
                                employeeName = $"{employee.Nombres} {employee.ApellidoPaterno}",
                                existingId = existing.Id,
                                existingAmount = existing.AmountPaid,
                                newAmount = netAmount,
                                tempFileName = tempFileName
                            });
                        }
                        else
                        {
                            results.Add(new { fileName = file.FileName, dni = detectedDni, status = "Success", employeeName = $"{employee.Nombres} {employee.ApellidoPaterno}" });

                            var fileName = $"{detectedDni}_{currentMonth}_{currentYear}.pdf";
                            var filePath = Path.Combine(uploadFolder, fileName);
                            await System.IO.File.WriteAllBytesAsync(filePath, fileBytes);

                            _context.EmployeePayslips.Add(new EmployeePayslip
                            {
                                EmployeeId = employee.Id,
                                PayslipId = parentPayslip.Id,
                                AmountPaid = netAmount,
                                Status = "Enviado",
                                GeneratedAt = DateTime.Now
                            });

                            _context.AppNotifications.Add(new AppNotification
                            {
                                EmployeeDni = employee.Dni,
                                Title = "Nueva Boleta de Pago",
                                Message = "Tu boleta de pago ha sido generada y está lista para descargar.",
                                IsRead = false,
                                CreatedAt = DateTime.Now
                            });
                            
                            // Guardamos inmediatamente para que la siguiente iteración (si es la misma boleta)
                            // pueda detectarla como duplicada en la base de datos.
                            await _context.SaveChangesAsync();
                        }
                    }
                }
                else
                {
                    results.Add(new { fileName = file.FileName, dni = "No detectado", status = "NoDniFound", employeeName = "Desconocido" });
                }
            }

            await _context.SaveChangesAsync();
            return Ok(results);
        }

        public class ResolveDuplicateRequest
        {
            public int ExistingId { get; set; }
            public string Action { get; set; } = string.Empty;
            public string TempFileName { get; set; } = string.Empty;
            public decimal NewAmount { get; set; }
        }

        [HttpPost("resolve-duplicate")]
        public async Task<IActionResult> ResolveDuplicate([FromBody] ResolveDuplicateRequest request)
        {
            var existing = await _context.EmployeePayslips
                .Include(ep => ep.Employee)
                .Include(ep => ep.Payslip)
                .FirstOrDefaultAsync(ep => ep.Id == request.ExistingId);

            if (existing == null) return NotFound(new { message = "Boleta existente no encontrada." });

            var uploadFolder = Path.Combine(_env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "payslips");
            var tempFilePath = Path.Combine(uploadFolder, request.TempFileName);

            if (request.Action == "replace")
            {
                var month = existing.Payslip?.Periodo.ToString("MMMM") ?? DateTime.Now.ToString("MMMM");
                var year = existing.Payslip?.Periodo.Year ?? DateTime.Now.Year;
                var fileName = $"{existing.Employee?.Dni}_{month}_{year}.pdf";
                var filePath = Path.Combine(uploadFolder, fileName);

                if (System.IO.File.Exists(tempFilePath))
                {
                    System.IO.File.Move(tempFilePath, filePath, true);
                }

                existing.AmountPaid = request.NewAmount;
                existing.Status = "Pendiente";
                existing.GeneratedAt = DateTime.Now;
                await _context.SaveChangesAsync();

                return Ok(new { message = "Boleta reemplazada exitosamente." });
            }
            else // "keep"
            {
                if (System.IO.File.Exists(tempFilePath))
                {
                    System.IO.File.Delete(tempFilePath);
                }
                return Ok(new { message = "Boleta original conservada." });
            }
        }
    }

    public class FileMappingDto
    {
        public string FileName { get; set; } = string.Empty;
        public string Dni { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string? Month { get; set; }
        public int? Year { get; set; }
    }
}
