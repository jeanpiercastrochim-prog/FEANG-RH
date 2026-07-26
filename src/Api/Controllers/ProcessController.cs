using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DNIContractApi.Data;
using DNIContractApi.Models.Entities;
using DNIContractApi.Models.DTOs;

namespace DNIContractApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProcessController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _env;

        public ProcessController(AppDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        [HttpPost("start")]
        public async Task<IActionResult> StartProcess([FromForm] IFormFile frontImage, [FromForm] IFormFile backImage, [FromForm] IFormCollection formData)
        {
            if (frontImage == null || backImage == null)
            {
                return BadRequest("Ambas imágenes son requeridas.");
            }

            var uploadsFolder = Path.Combine(_env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "uploads");
            if (!Directory.Exists(uploadsFolder)) Directory.CreateDirectory(uploadsFolder);

            var frontFileName = $"{Guid.NewGuid()}_{frontImage.FileName}";
            var frontPath = Path.Combine(uploadsFolder, frontFileName);
            using (var stream = new FileStream(frontPath, FileMode.Create)) await frontImage.CopyToAsync(stream);

            var backFileName = $"{Guid.NewGuid()}_{backImage.FileName}";
            var backPath = Path.Combine(uploadsFolder, backFileName);
            using (var stream = new FileStream(backPath, FileMode.Create)) await backImage.CopyToAsync(stream);

            var dni = formData["numeroDNI"].ToString();
            var employee = await _context.Employees.FirstOrDefaultAsync(e => e.Dni == dni);
            if (employee == null)
            {
                employee = new Employee
                {
                    Nombres = formData["nombres"].ToString(),
                    ApellidoPaterno = formData["apellidoPaterno"].ToString(),
                    ApellidoMaterno = formData["apellidoMaterno"].ToString(),
                    Dni = dni,
                    FechaNacimiento = DateTime.TryParse(formData["fechaNacimiento"].ToString(), out var dt) ? dt : DateTime.UtcNow.AddYears(-25),
                    Sexo = formData["sexo"].ToString(),
                    EstadoCivil = formData["estadoCivil"].ToString(),
                    Direccion = formData["direccion"].ToString(),
                    Departamento = formData["departamento"].ToString(),
                    Provincia = formData["provincia"].ToString(),
                    Distrito = formData["distrito"].ToString(),
                    HasPrimary = formData["hasPrimary"].ToString() == "true",
                    PrimarySchool = formData["primarySchool"].ToString(),
                    HasSecondary = formData["hasSecondary"].ToString() == "true",
                    SecondarySchool = formData["secondarySchool"].ToString(),
                    HasHigherEducation = formData["hasHigherEducation"].ToString() == "true",
                    HigherEducationInstitution = formData["higherEducationInstitution"].ToString(),
                    Telefono = formData["telefono"].ToString(),
                    CorreoPersonal = formData["correoPersonal"].ToString(),
                    ContactoEmergencia = formData["contactoEmergencia"].ToString(),
                    Parentesco = formData["parentesco"].ToString(),
                    TelefonoEmergencia = formData["telefonoEmergencia"].ToString()
                };
                await Services.DbHelper.ResolveRelationsAsync(_context, employee);
                _context.Employees.Add(employee);
                await _context.SaveChangesAsync();
            }
            if (formData.ContainsKey("signatureBase64"))
            {
                var sigBase64 = formData["signatureBase64"].ToString();
                if (!string.IsNullOrEmpty(sigBase64))
                {
                    var base64Data = sigBase64.Split(',').Last();
                    var signatureBytes = Convert.FromBase64String(base64Data);
                    var signatureFileName = $"{Guid.NewGuid()}_signature.png";
                    var signaturePath = Path.Combine(uploadsFolder, signatureFileName);
                    await System.IO.File.WriteAllBytesAsync(signaturePath, signatureBytes);
                    employee.SignatureImagePath = $"/uploads/{signatureFileName}";
                }
            }

            var photo = new DniPhoto
            {
                EmployeeId = employee.Id,
                FrontImagePath = $"/uploads/{frontFileName}",
                BackImagePath = $"/uploads/{backFileName}"
            };
            _context.DniPhotos.Add(photo);

            var template = await _context.Contracts.FirstOrDefaultAsync();
            if (template == null)
            {
                template = new Contract { Name = "Plantilla General" };
                _context.Contracts.Add(template);
                await _context.SaveChangesAsync();
            }

            var empContract = new EmployeeContract
            {
                EmployeeId = employee.Id,
                ContractId = template.Id,
                Status = "Pendiente"
            };
            _context.EmployeeContracts.Add(empContract);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, id = empContract.Id });
        }

        [HttpGet("pending")]
        public async Task<IActionResult> GetPendingProcesses()
        {
            var processes = await _context.EmployeeContracts
                .Include(ec => ec.Employee)
                    .ThenInclude(e => e.User)
                .Where(ec => ec.Status == "Pendiente")
                .OrderByDescending(ec => ec.CreatedAt)
                .Select(ec => new {
                    Id = ec.Id,
                    Status = ec.Status,
                    CreatedAt = ec.CreatedAt,
                    Nombres = ec.Employee.Nombres,
                    ApellidoPaterno = ec.Employee.ApellidoPaterno,
                    NumeroDNI = ec.Employee.Dni,
                    HasAppAccount = ec.Employee.User != null && ec.Employee.User.IsActive
                })
                .ToListAsync();

            return Ok(processes);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetProcess(string id)
        {
            if (!Guid.TryParse(id, out var guidId)) return BadRequest("Formato de GUID inválido.");

            var ec = await _context.EmployeeContracts
                .Include(c => c.Employee)
                    .ThenInclude(e => e.DniPhotos)
                .Include(c => c.Employee)
                    .ThenInclude(e => e.Genero)
                .Include(c => c.Employee)
                    .ThenInclude(e => e.EstadoCivilDetalle)
                .Include(c => c.Employee)
                    .ThenInclude(e => e.Ubigeo)
                .Include(c => c.Employee)
                    .ThenInclude(e => e.Cargo)
                .Include(c => c.Employee)
                    .ThenInclude(e => e.User)
                .Include(c => c.Employee)
                    .ThenInclude(e => e.Educations)
                        .ThenInclude(edu => edu.NivelEducacion)
                .FirstOrDefaultAsync(c => c.Id == guidId);
                
            if (ec == null || ec.Employee == null) return NotFound();

            Services.DbHelper.PopulateNotMapped(ec.Employee);

            var photo = ec.Employee.DniPhotos.OrderByDescending(p => p.Id).FirstOrDefault();

            var dto = new ContractProcessDto
            {
                Id = ec.Id.ToString(),
                Status = ec.Status,
                Categoria = ec.Employee.Position,
                CreatedAt = ec.CreatedAt,
                FrontImagePath = photo?.FrontImagePath,
                BackImagePath = photo?.BackImagePath,
                Nombres = ec.Employee.Nombres,
                ApellidoPaterno = ec.Employee.ApellidoPaterno,
                ApellidoMaterno = ec.Employee.ApellidoMaterno,
                NumeroDNI = ec.Employee.Dni,
                SignatureImagePath = ec.Employee.SignatureImagePath,
                SistemaPensionario = ec.Employee.CodigoAFP,
                FechaNacimiento = ec.Employee.FechaNacimiento.ToString("yyyy-MM-dd"),
                Sexo = ec.Employee.Sexo,
                EstadoCivil = ec.Employee.EstadoCivil,
                Direccion = ec.Employee.Direccion,
                Departamento = ec.Employee.Departamento,
                Provincia = ec.Employee.Provincia,
                Distrito = ec.Employee.Distrito,
                HasPrimary = ec.Employee.HasPrimary,
                PrimarySchool = ec.Employee.PrimarySchool,
                HasSecondary = ec.Employee.HasSecondary,
                SecondarySchool = ec.Employee.SecondarySchool,
                HasHigherEducation = ec.Employee.HasHigherEducation,
                HigherEducationInstitution = ec.Employee.HigherEducationInstitution,
                Telefono = ec.Employee.Telefono,
                CorreoPersonal = ec.Employee.CorreoPersonal,
                ContactoEmergencia = ec.Employee.ContactoEmergencia,
                Parentesco = ec.Employee.Parentesco,
                TelefonoEmergencia = ec.Employee.TelefonoEmergencia
            };

            return Ok(dto);
        }

        public class MobileSubmitRequest
        {
            public string Nombres { get; set; } = string.Empty;
            public string ApellidoPaterno { get; set; } = string.Empty;
            public string ApellidoMaterno { get; set; } = string.Empty;
            public string NumeroDNI { get; set; } = string.Empty;
            public string Email { get; set; } = string.Empty;
            public string Phone { get; set; } = string.Empty;
            public string FechaNacimiento { get; set; } = string.Empty;
            public string Sexo { get; set; } = string.Empty;
            public string EstadoCivil { get; set; } = string.Empty;
            public string Direccion { get; set; } = string.Empty;
            public string Departamento { get; set; } = string.Empty;
            public string Provincia { get; set; } = string.Empty;
            public string Distrito { get; set; } = string.Empty;
            public bool HasPrimary { get; set; }
            public string? PrimarySchool { get; set; }
            public bool HasSecondary { get; set; }
            public string? SecondarySchool { get; set; }
            public bool HasHigherEducation { get; set; }
            public string? HigherEducationInstitution { get; set; }
            public string? FrontImagePath { get; set; }
            public string? BackImagePath { get; set; }
            public string? Telefono { get; set; }
            public string? CorreoPersonal { get; set; }
            public string? ContactoEmergencia { get; set; }
            public string? Parentesco { get; set; }
            public string? TelefonoEmergencia { get; set; }
            public string? SignatureBase64 { get; set; }
            public bool IsBiometricValidated { get; set; }
        }

        [HttpPost("submit-mobile")]
        public async Task<IActionResult> SubmitMobile([FromBody] MobileSubmitRequest req)
        {
            var employee = await _context.Employees.FirstOrDefaultAsync(e => e.Dni == req.NumeroDNI);
            if (employee == null)
            {
                employee = new Employee();
                _context.Employees.Add(employee);
            }

            employee.Nombres = req.Nombres;
            employee.ApellidoPaterno = req.ApellidoPaterno;
            employee.ApellidoMaterno = req.ApellidoMaterno;
            employee.Dni = req.NumeroDNI;
            employee.FechaNacimiento = DateTime.TryParse(req.FechaNacimiento, out var dt) ? dt : DateTime.UtcNow.AddYears(-25);
            employee.Sexo = req.Sexo;
            employee.EstadoCivil = req.EstadoCivil;
            employee.Direccion = req.Direccion;
            employee.Departamento = req.Departamento;
            employee.Provincia = req.Provincia;
            employee.Distrito = req.Distrito;
            employee.HasPrimary = req.HasPrimary;
            employee.PrimarySchool = req.PrimarySchool;
            employee.HasSecondary = req.HasSecondary;
            employee.SecondarySchool = req.SecondarySchool;
            employee.HasHigherEducation = req.HasHigherEducation;
            employee.HigherEducationInstitution = req.HigherEducationInstitution;
            employee.Telefono = req.Telefono;
            employee.CorreoPersonal = req.CorreoPersonal;
            employee.ContactoEmergencia = req.ContactoEmergencia;
            employee.Parentesco = req.Parentesco;
            employee.TelefonoEmergencia = req.TelefonoEmergencia;
            
            await Services.DbHelper.ResolveRelationsAsync(_context, employee);
            await _context.SaveChangesAsync();

            if (!string.IsNullOrEmpty(req.SignatureBase64))
            {
                var base64Data = req.SignatureBase64.Split(',').Last();
                var signatureBytes = Convert.FromBase64String(base64Data);
                var uploadsFolder = Path.Combine(_env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "uploads");
                if (!Directory.Exists(uploadsFolder)) Directory.CreateDirectory(uploadsFolder);
                var signatureFileName = $"{Guid.NewGuid()}_signature.png";
                var signaturePath = Path.Combine(uploadsFolder, signatureFileName);
                await System.IO.File.WriteAllBytesAsync(signaturePath, signatureBytes);
                employee.SignatureImagePath = $"/uploads/{signatureFileName}";
            }
            
            if (req.IsBiometricValidated) {
                employee.HasBiometrics = true;
            }

            var photo = new DniPhoto
            {
                EmployeeId = employee.Id,
                FrontImagePath = req.FrontImagePath,
                BackImagePath = req.BackImagePath
            };
            _context.DniPhotos.Add(photo);

            var template = await _context.Contracts.FirstOrDefaultAsync();
            if (template == null)
            {
                template = new Contract { Name = "Plantilla General" };
                _context.Contracts.Add(template);
                await _context.SaveChangesAsync();
            }

            var empContract = new EmployeeContract
            {
                EmployeeId = employee.Id,
                ContractId = template.Id,
                Status = "Pendiente"
            };
            _context.EmployeeContracts.Add(empContract);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, id = empContract.Id });
        }

        public class FinalizeRequest
        {
            public int? ContractId { get; set; }
            public string? SistemaPensionario { get; set; }
        }

        [HttpGet("download-pdf/{dni}")]
        public async Task<IActionResult> DownloadContractPdf(string dni)
        {
            var emp = await _context.Employees
                .Include(e => e.Cargo)
                .Include(e => e.AFP)
                .Include(e => e.Ubigeo)
                .FirstOrDefaultAsync(e => e.Dni == dni);

            if (emp == null) return NotFound("Empleado no encontrado");

            var data = new DNIContractApi.Models.DTOs.ContractData {
                Nombres = emp.Nombres,
                ApellidoPaterno = emp.ApellidoPaterno,
                ApellidoMaterno = emp.ApellidoMaterno,
                NumeroDni = emp.Dni,
                FechaNacimiento = emp.FechaNacimiento.ToString("yyyy-MM-dd"),
                Direccion = emp.Direccion,
                Cargo = emp.Cargo?.Nombre ?? "No asignado",
                SueldoBasico = emp.BaseSalary,
                SignatureImagePath = emp.SignatureImagePath,
                HasBiometrics = emp.HasBiometrics,
                SistemaPensionario = emp.AFP?.Nombre ?? "",
                Sexo = emp.Sexo ?? "",
                Ubigeo = emp.Ubigeo?.Distrito ?? "",
            };
            
            var contractService = new Services.ContractService();
            var pdfBytes = contractService.GenerateContract(data);
            
            var uploadsFolder = Path.Combine(_env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "uploads", "contracts");
            if (!Directory.Exists(uploadsFolder)) Directory.CreateDirectory(uploadsFolder);
            
            var pdfPath = Path.Combine(uploadsFolder, $"contrato_{emp.Dni}.pdf");
            await System.IO.File.WriteAllBytesAsync(pdfPath, pdfBytes);

            return File(pdfBytes, "application/pdf", $"Contrato_{dni}.pdf");
        }
        
        [HttpPost("{id}/finalize")]
        public async Task<IActionResult> FinalizeProcess(string id, [FromBody] FinalizeRequest req)
        {
            if (!Guid.TryParse(id, out var guidId)) return BadRequest("Formato de GUID inválido.");
            var ec = await _context.EmployeeContracts.Include(c => c.Employee).FirstOrDefaultAsync(c => c.Id == guidId);
            if (ec == null) return NotFound();

            ec.Status = "Firmado";
            ec.SignedAt = DateTime.UtcNow;
            
            if (req.ContractId.HasValue && req.ContractId.Value > 0)
            {
                ec.ContractId = req.ContractId.Value;
                var contract = await _context.Contracts.Include(c => c.Cargo).FirstOrDefaultAsync(c => c.Id == req.ContractId.Value);
                if (contract != null && ec.Employee != null)
                {
                    if (contract.CargoId.HasValue)
                    {
                        ec.Employee.CargoId = contract.CargoId.Value;
                        if (contract.Cargo != null)
                            ec.Employee.BaseSalary = contract.Cargo.SueldoBase;
                    }
                }
            }
            
            if (ec.Employee != null) {
                if (!string.IsNullOrEmpty(req.SistemaPensionario)) {
                    ec.Employee.CodigoAFP = req.SistemaPensionario;
                }
                await Services.DbHelper.ResolveRelationsAsync(_context, ec.Employee);
            }
            
            await _context.SaveChangesAsync();
            return Ok(new { success = true });
        }

        [HttpGet("firmados")]
        public async Task<IActionResult> GetSignedProcesses()
        {
            var processes = await _context.EmployeeContracts
                .Include(ec => ec.Employee)
                    .ThenInclude(e => e.Cargo)
                .Where(ec => ec.Status == "Firmado")
                .OrderByDescending(ec => ec.CreatedAt)
                .Select(ec => new {
                    Id = ec.Id,
                    Nombres = ec.Employee.Nombres,
                    ApellidoPaterno = ec.Employee.ApellidoPaterno,
                    NumeroDNI = ec.Employee.Dni,
                    Categoria = ec.Employee.Cargo != null ? ec.Employee.Cargo.Nombre : "",
                    CreatedAt = ec.CreatedAt,
                    Status = ec.Status
                })
                .ToListAsync();

            return Ok(processes);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProcess(string id)
        {
            if (!Guid.TryParse(id, out var guidId)) return BadRequest("Formato de GUID inválido.");
            var ec = await _context.EmployeeContracts.FirstOrDefaultAsync(c => c.Id == guidId);
            if (ec == null) return NotFound();

            _context.EmployeeContracts.Remove(ec);
            await _context.SaveChangesAsync();
            return Ok(new { success = true });
        }
    }
}
