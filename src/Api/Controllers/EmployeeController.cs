using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DNIContractApi.Data;
using ClosedXML.Excel;

namespace DNIContractApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EmployeeController : ControllerBase
    {
        private readonly AppDbContext _context;

        public EmployeeController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllEmployees()
        {
            var employees = await _context.Employees
                .Include(e => e.User)
                .Include(e => e.Cargo)
                .Include(e => e.Genero)
                .Include(e => e.EstadoCivilDetalle)
                .Include(e => e.EstadoEmpleado)
                .Include(e => e.TipoContrato)
                .Include(e => e.Banco)
                .Include(e => e.TipoCuentaBancaria)
                .Include(e => e.AFP)
                .Include(e => e.Ubigeo)
                .Include(e => e.Contracts)
                .OrderByDescending(e => e.Id)
                .ToListAsync();

            var result = employees.Select(e => new {
                e.Id,
                e.UserId,
                e.Nombres,
                e.ApellidoPaterno,
                e.ApellidoMaterno,
                FullName = e.FullName,
                e.Dni,
                Email = e.CorreoCorporativo ?? e.CorreoPersonal ?? (e.User?.Email ?? ""),
                Phone = e.Telefono ?? "",
                HasAppAccount = e.User != null && e.User.IsActive,
                HasSignedContract = !string.IsNullOrEmpty(e.SignatureImagePath) || e.Contracts.Any(c => c.Status == "Firmado"),
                // Datos personales
                FechaNacimiento = e.FechaNacimiento.ToString("yyyy-MM-dd"),
                Genero = e.Genero?.Nombre ?? "",
                EstadoCivil = e.EstadoCivilDetalle?.Nombre ?? "",
                e.Direccion,
                Departamento = e.Ubigeo?.Departamento ?? "",
                Provincia = e.Ubigeo?.Provincia ?? "",
                Distrito = e.Ubigeo?.Distrito ?? "",
                // Datos laborales
                Cargo = e.Cargo?.Nombre ?? "",
                e.BaseSalary,
                EstadoEmpleado = e.EstadoEmpleado?.Nombre ?? "Activo",
                FechaIngreso = e.FechaIngreso.ToString("yyyy-MM-dd"),
                FechaCese = e.FechaCese?.ToString("yyyy-MM-dd") ?? "",
                TipoContrato = e.TipoContrato?.Nombre ?? "",
                // Datos bancarios
                Banco = e.Banco?.Nombre ?? "",
                TipoCuentaBancaria = e.TipoCuentaBancaria?.Nombre ?? "",
                e.NumeroCuenta,
                e.CCI,
                // AFP
                AFP = e.AFP?.Nombre ?? "",
                e.CodigoAFP,
                // Contacto
                e.CorreoPersonal,
                e.CorreoCorporativo,
                // Emergencia
                e.ContactoEmergencia,
                e.Parentesco,
                e.TelefonoEmergencia
            });

            return Ok(result);
        }

        [HttpGet("by-dni/{dni}")]
        public async Task<IActionResult> GetEmployeeByDni(string dni)
        {
            var employee = await _context.Employees
                .Include(e => e.User)
                .Include(e => e.Contracts)
                .FirstOrDefaultAsync(e => e.Dni == dni);

            if (employee == null) return NotFound(new { message = "Empleado no encontrado" });

            return Ok(new {
                employee.Id,
                employee.Dni,
                employee.FullName,
                employee.SignatureImagePath,
                employee.HasBiometrics,
                employee.ProfileImagePath,
                HasSignedContract = !string.IsNullOrEmpty(employee.SignatureImagePath) || employee.Contracts.Any(c => c.Status == "Firmado")
            });
        }

        [HttpGet("paged")]
        public async Task<IActionResult> GetPagedEmployees([FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] string search = "")
        {
            var query = _context.Employees
                .Include(e => e.User)
                .Include(e => e.Cargo)
                .Include(e => e.Genero)
                .Include(e => e.EstadoCivilDetalle)
                .Include(e => e.EstadoEmpleado)
                .Include(e => e.TipoContrato)
                .Include(e => e.Banco)
                .Include(e => e.TipoCuentaBancaria)
                .Include(e => e.AFP)
                .Include(e => e.Ubigeo)
                .Include(e => e.Contracts)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var lowerSearch = search.ToLower();
                query = query.Where(e => e.Nombres.ToLower().Contains(lowerSearch) || 
                                         e.ApellidoPaterno.ToLower().Contains(lowerSearch) || 
                                         e.ApellidoMaterno.ToLower().Contains(lowerSearch) || 
                                         e.Dni.Contains(search));
            }

            var totalItems = await query.CountAsync();
            var totalPages = (int)Math.Ceiling(totalItems / (double)pageSize);

            var employees = await query
                .OrderByDescending(e => e.Id)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var items = employees.Select(e => new {
                e.Id,
                e.UserId,
                e.Nombres,
                e.ApellidoPaterno,
                e.ApellidoMaterno,
                FullName = e.FullName,
                e.Dni,
                Email = e.CorreoCorporativo ?? e.CorreoPersonal ?? (e.User?.Email ?? ""),
                Phone = e.Telefono ?? "",
                HasAppAccount = e.User != null && e.User.IsActive,
                HasSignedContract = !string.IsNullOrEmpty(e.SignatureImagePath) || e.Contracts.Any(c => c.Status == "Firmado"),
                FechaNacimiento = e.FechaNacimiento.ToString("yyyy-MM-dd"),
                Genero = e.Genero?.Nombre ?? "",
                EstadoCivil = e.EstadoCivilDetalle?.Nombre ?? "",
                e.Direccion,
                Departamento = e.Ubigeo?.Departamento ?? "",
                Provincia = e.Ubigeo?.Provincia ?? "",
                Distrito = e.Ubigeo?.Distrito ?? "",
                Cargo = e.Cargo?.Nombre ?? "",
                e.BaseSalary,
                EstadoEmpleado = e.EstadoEmpleado?.Nombre ?? "Activo",
                FechaIngreso = e.FechaIngreso.ToString("yyyy-MM-dd"),
                FechaCese = e.FechaCese?.ToString("yyyy-MM-dd") ?? "",
                TipoContrato = e.TipoContrato?.Nombre ?? "",
                Banco = e.Banco?.Nombre ?? "",
                TipoCuentaBancaria = e.TipoCuentaBancaria?.Nombre ?? "",
                e.NumeroCuenta,
                e.CCI,
                AFP = e.AFP?.Nombre ?? "",
                e.CodigoAFP,
                e.CorreoPersonal,
                e.CorreoCorporativo,
                e.ContactoEmergencia,
                e.Parentesco,
                e.TelefonoEmergencia
            });

            return Ok(new {
                totalItems,
                totalPages,
                currentPage = page,
                pageSize,
                items
            });
        }

        [HttpGet("export")]
        public async Task<IActionResult> ExportEmployees(
            [FromQuery] string filename = "Personal_Reporte",
            [FromQuery] string pension = "todos",
            [FromQuery] string appAccount = "todos",
            [FromQuery] string bank = "todos",
            [FromQuery] string phone = "todos")
        {
            var query = _context.Employees
                .Include(e => e.User)
                .Include(e => e.Cargo)
                .Include(e => e.Banco)
                .Include(e => e.AFP)
                .Include(e => e.Genero)
                .Include(e => e.EstadoCivilDetalle)
                .Include(e => e.Ubigeo)
                .Include(e => e.EstadoEmpleado)
                .Include(e => e.TipoContrato)
                .Include(e => e.TipoCuentaBancaria)
                .AsQueryable();

            if (appAccount == "si") query = query.Where(e => e.User != null && e.User.IsActive);
            else if (appAccount == "no") query = query.Where(e => e.User == null || !e.User.IsActive);

            if (bank == "si") query = query.Where(e => !string.IsNullOrEmpty(e.NumeroCuenta));
            else if (bank == "no") query = query.Where(e => string.IsNullOrEmpty(e.NumeroCuenta));

            if (phone == "si") query = query.Where(e => !string.IsNullOrEmpty(e.Telefono));
            else if (phone == "no") query = query.Where(e => string.IsNullOrEmpty(e.Telefono));

            if (pension == "afp") query = query.Where(e => e.AFP != null && e.AFP.Nombre != "ONP");
            else if (pension == "onp") query = query.Where(e => e.AFP != null && e.AFP.Nombre == "ONP");

            var employees = await query.OrderBy(e => e.ApellidoPaterno).ToListAsync();

            using var workbook = new XLWorkbook();
            var worksheet = workbook.Worksheets.Add("Colaboradores");

            string[] headers = {
                "DNI", "Nombres", "Apellido Paterno", "Apellido Materno", "Correo Personal", "Correo Corporativo", 
                "Teléfono", "Fecha Nacimiento", "Género", "Estado Civil", "Dirección", "Departamento", "Provincia", "Distrito",
                "Cargo", "Salario Base", "Fecha Ingreso", "Fecha Cese", "Tipo Contrato", "Sistema Pensionario", "Código AFP", 
                "Banco", "Tipo Cuenta Bancaria", "Nro Cuenta", "CCI", "Contacto Emergencia", "Parentesco", "Teléfono Emergencia", "Estado"
            };

            for (int i = 0; i < headers.Length; i++)
            {
                worksheet.Cell(1, i + 1).Value = headers[i];
            }
            
            var headerRange = worksheet.Range(1, 1, 1, headers.Length);
            headerRange.Style.Font.Bold = true;
            headerRange.Style.Fill.BackgroundColor = XLColor.LightBlue;

            for (int i = 0; i < employees.Count; i++)
            {
                var row = i + 2;
                var e = employees[i];
                worksheet.Cell(row, 1).Value = e.Dni;
                worksheet.Cell(row, 2).Value = e.Nombres;
                worksheet.Cell(row, 3).Value = e.ApellidoPaterno;
                worksheet.Cell(row, 4).Value = e.ApellidoMaterno;
                worksheet.Cell(row, 5).Value = e.CorreoPersonal ?? "";
                worksheet.Cell(row, 6).Value = e.CorreoCorporativo ?? "";
                worksheet.Cell(row, 7).Value = e.Telefono ?? "";
                worksheet.Cell(row, 8).Value = e.FechaNacimiento.ToString("yyyy-MM-dd");
                worksheet.Cell(row, 9).Value = e.Genero?.Nombre ?? "";
                worksheet.Cell(row, 10).Value = e.EstadoCivilDetalle?.Nombre ?? "";
                worksheet.Cell(row, 11).Value = e.Direccion ?? "";
                worksheet.Cell(row, 12).Value = e.Ubigeo?.Departamento ?? "";
                worksheet.Cell(row, 13).Value = e.Ubigeo?.Provincia ?? "";
                worksheet.Cell(row, 14).Value = e.Ubigeo?.Distrito ?? "";
                worksheet.Cell(row, 15).Value = e.Cargo?.Nombre ?? "";
                worksheet.Cell(row, 16).Value = e.BaseSalary;
                worksheet.Cell(row, 17).Value = e.FechaIngreso.ToString("yyyy-MM-dd");
                worksheet.Cell(row, 18).Value = e.FechaCese?.ToString("yyyy-MM-dd") ?? "";
                worksheet.Cell(row, 19).Value = e.TipoContrato?.Nombre ?? "";
                worksheet.Cell(row, 20).Value = e.AFP?.Nombre ?? "";
                worksheet.Cell(row, 21).Value = e.CodigoAFP ?? "";
                worksheet.Cell(row, 22).Value = e.Banco?.Nombre ?? "";
                worksheet.Cell(row, 23).Value = e.TipoCuentaBancaria?.Nombre ?? "";
                worksheet.Cell(row, 24).Value = e.NumeroCuenta ?? "";
                worksheet.Cell(row, 25).Value = e.CCI ?? "";
                worksheet.Cell(row, 26).Value = e.ContactoEmergencia ?? "";
                worksheet.Cell(row, 27).Value = e.Parentesco ?? "";
                worksheet.Cell(row, 28).Value = e.TelefonoEmergencia ?? "";
                worksheet.Cell(row, 29).Value = e.EstadoEmpleado?.Nombre ?? "Activo";
            }

            worksheet.Columns().AdjustToContents();

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            var content = stream.ToArray();

            string downloadFilename = filename.EndsWith(".xlsx") ? filename : $"{filename}.xlsx";
            return File(content, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", downloadFilename);
        }

        public class CreateEmployeeDto
        {
            public string Nombres { get; set; } = string.Empty;
            public string ApellidoPaterno { get; set; } = string.Empty;
            public string ApellidoMaterno { get; set; } = string.Empty;
            public string Dni { get; set; } = string.Empty;
            public string? Sexo { get; set; }
            public string? EstadoCivil { get; set; }
            public string? Direccion { get; set; }
            public string? Departamento { get; set; }
            public string? Provincia { get; set; }
            public string? Distrito { get; set; }
            public string? Telefono { get; set; }
            public string? CorreoPersonal { get; set; }
            public string? CorreoCorporativo { get; set; }
            public string? FechaNacimiento { get; set; }
            public decimal? BaseSalary { get; set; }
            public string? NumeroCuenta { get; set; }
            public string? CCI { get; set; }
            public string? CodigoAFP { get; set; }
            public string? SistemaPensionario { get; set; }
            public string? ContactoEmergencia { get; set; }
            public string? Parentesco { get; set; }
            public string? TelefonoEmergencia { get; set; }
            public string? Cargo { get; set; }
        }

        [HttpPost]
        public async Task<IActionResult> CreateEmployee([FromBody] CreateEmployeeDto dto)
        {
            var existing = await _context.Employees.FirstOrDefaultAsync(e => e.Dni == dto.Dni);
            if (existing != null) return BadRequest(new { success = false, message = "El colaborador con este DNI ya existe." });

            var employee = new DNIContractApi.Models.Entities.Employee
            {
                Nombres = dto.Nombres,
                ApellidoPaterno = dto.ApellidoPaterno,
                ApellidoMaterno = dto.ApellidoMaterno,
                Dni = dto.Dni,
                Sexo = dto.Sexo ?? "MASCULINO",
                EstadoCivil = dto.EstadoCivil ?? "SOLTERO",
                Direccion = dto.Direccion ?? "",
                Departamento = dto.Departamento ?? "LIMA",
                Provincia = dto.Provincia ?? "LIMA",
                Distrito = dto.Distrito ?? "LIMA",
                Telefono = dto.Telefono ?? "",
                CorreoPersonal = dto.CorreoPersonal ?? "",
                CorreoCorporativo = dto.CorreoCorporativo ?? "",
                FechaNacimiento = DateTime.TryParse(dto.FechaNacimiento, out var fn) ? fn : DateTime.UtcNow.AddYears(-25),
                BaseSalary = dto.BaseSalary ?? 0,
                NumeroCuenta = dto.NumeroCuenta ?? "",
                CCI = dto.CCI ?? "",
                CodigoAFP = dto.SistemaPensionario ?? dto.CodigoAFP ?? "",
                ContactoEmergencia = dto.ContactoEmergencia ?? "",
                Parentesco = dto.Parentesco ?? "",
                TelefonoEmergencia = dto.TelefonoEmergencia ?? "",
                Position = dto.Cargo ?? "Colaborador",
                FechaIngreso = DateTime.UtcNow.Date
            };

            await Services.DbHelper.ResolveRelationsAsync(_context, employee);
            
            _context.Employees.Add(employee);
            await _context.SaveChangesAsync();
            
            // Automatically activate the user since HR is creating them
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Dni == employee.Dni);
            if (user != null)
            {
                user.IsActive = true;
                await _context.SaveChangesAsync();
            }
            
            return Ok(new { success = true, id = employee.Id });
        }

        public class UpdateEmployeeDto
        {
            public string Nombres { get; set; } = string.Empty;
            public string ApellidoPaterno { get; set; } = string.Empty;
            public string ApellidoMaterno { get; set; } = string.Empty;
            public string Dni { get; set; } = string.Empty;
            // Contacto
            public string? Telefono { get; set; }
            public string? CorreoPersonal { get; set; }
            public string? CorreoCorporativo { get; set; }
            // Datos personales
            public string? Direccion { get; set; }
            public string? FechaNacimiento { get; set; }
            // Laboral
            public decimal? BaseSalary { get; set; }
            // Bancario
            public string? NumeroCuenta { get; set; }
            public string? CCI { get; set; }
            // AFP
            public string? CodigoAFP { get; set; }
            // Emergencia
            public string? ContactoEmergencia { get; set; }
            public string? Parentesco { get; set; }
            public string? TelefonoEmergencia { get; set; }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateEmployee(int id, [FromBody] UpdateEmployeeDto dto)
        {
            var employee = await _context.Employees.FindAsync(id);
            if (employee == null) return NotFound();

            employee.Nombres = dto.Nombres;
            employee.ApellidoPaterno = dto.ApellidoPaterno;
            employee.ApellidoMaterno = dto.ApellidoMaterno;
            employee.Dni = dto.Dni;
            employee.Telefono = dto.Telefono ?? "";
            employee.CorreoPersonal = dto.CorreoPersonal ?? "";
            employee.CorreoCorporativo = dto.CorreoCorporativo ?? "";
            employee.Direccion = dto.Direccion ?? "";
            if (!string.IsNullOrEmpty(dto.FechaNacimiento) && DateTime.TryParse(dto.FechaNacimiento, out var fn))
                employee.FechaNacimiento = fn;
            if (dto.BaseSalary.HasValue)
                employee.BaseSalary = dto.BaseSalary.Value;
            employee.NumeroCuenta = dto.NumeroCuenta ?? "";
            employee.CCI = dto.CCI ?? "";
            employee.CodigoAFP = dto.CodigoAFP ?? "";
            employee.ContactoEmergencia = dto.ContactoEmergencia ?? "";
            employee.Parentesco = dto.Parentesco ?? "";
            employee.TelefonoEmergencia = dto.TelefonoEmergencia ?? "";

            await _context.SaveChangesAsync();
            return Ok();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteEmployee(int id)
        {
            try 
            {
                var employee = await _context.Employees
                    .Include(e => e.Contracts)
                    .Include(e => e.Payslips)
                    .Include(e => e.DniPhotos)
                    .Include(e => e.User)
                    .FirstOrDefaultAsync(e => e.Id == id);
                    
                if (employee == null) return NotFound();

                if (employee.User != null)
                {
                    _context.Users.Remove(employee.User);
                }

                _context.Employees.Remove(employee);
                await _context.SaveChangesAsync();
                return Ok();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message, inner = ex.InnerException?.Message });
            }
        }

        public class SignatureRequest
        {
            public string SignatureBase64 { get; set; } = string.Empty;
            public bool IsBiometricValidated { get; set; }
            public string? Telefono { get; set; }
            public string? CorreoPersonal { get; set; }
            public string? ContactoEmergencia { get; set; }
            public string? Parentesco { get; set; }
            public string? TelefonoEmergencia { get; set; }
            public int? AFPId { get; set; }
        }

        [HttpPost("{id}/signature")]
        public async Task<IActionResult> SaveSignature(int id, [FromBody] SignatureRequest req)
        {
            var emp = await _context.Employees.FindAsync(id);
            if (emp == null) return NotFound("Empleado no encontrado.");

            emp.Telefono = req.Telefono;
            emp.CorreoPersonal = req.CorreoPersonal;
            emp.ContactoEmergencia = req.ContactoEmergencia;
            emp.Parentesco = req.Parentesco;
            emp.TelefonoEmergencia = req.TelefonoEmergencia;
            if (req.AFPId.HasValue) emp.AFPId = req.AFPId.Value;

            if (string.IsNullOrEmpty(req.SignatureBase64))
            {
                emp.SignatureImagePath = "GENERATED_BY_HR";
            }
            else
            {
                try
                {
                    var base64Data = req.SignatureBase64.Split(',').Last();
                    var signatureBytes = Convert.FromBase64String(base64Data);
                    var imageService = new DNIContractApi.Services.ImagePreprocessingService();
                    signatureBytes = imageService.ProcessSignatureImage(signatureBytes);
                    
                    var env = HttpContext.RequestServices.GetService<IWebHostEnvironment>();
                    var uploadsFolder = Path.Combine(env?.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "uploads");
                    if (!Directory.Exists(uploadsFolder)) Directory.CreateDirectory(uploadsFolder);
                    
                    var signatureFileName = $"{Guid.NewGuid()}_signature.png";
                    var signaturePath = Path.Combine(uploadsFolder, signatureFileName);
                    await System.IO.File.WriteAllBytesAsync(signaturePath, signatureBytes);
                    
                    emp.SignatureImagePath = $"/uploads/{signatureFileName}";
                }
                catch (Exception ex)
                {
                    return StatusCode(500, new { message = $"Error en el servidor: {ex.Message}", stack = ex.StackTrace });
                }
            }
            
            if (req.IsBiometricValidated) {
                emp.HasBiometrics = true;
            }
            
            await _context.SaveChangesAsync();
            return Ok(new { success = true });
        }

        [HttpPost("{id}/biometrics")]
        public async Task<IActionResult> SaveBiometrics(int id)
        {
            var emp = await _context.Employees.FindAsync(id);
            if (emp == null) return NotFound("Empleado no encontrado.");

            emp.HasBiometrics = true;
            await _context.SaveChangesAsync();
            return Ok(new { success = true });
        }

        [HttpPost("activate-accounts")]
        public async Task<IActionResult> ActivateAccounts([FromBody] List<string> dnis)
        {
            if (dnis == null || !dnis.Any()) return BadRequest("Lista de DNIs vacía.");

            var users = await _context.Users.Where(u => dnis.Contains(u.Dni)).ToListAsync();
            foreach (var user in users)
            {
                user.IsActive = true;
                user.ModifiedAt = DateTime.UtcNow;
            }
            
            await _context.SaveChangesAsync();
            return Ok(new { success = true, activatedCount = users.Count });
        }

        public class ProfilePhotoRequest
        {
            public string PhotoBase64 { get; set; } = string.Empty;
        }

        [HttpPost("{id}/profile-photo")]
        public async Task<IActionResult> SaveProfilePhoto(int id, [FromBody] ProfilePhotoRequest req)
        {
            var emp = await _context.Employees.FindAsync(id);
            if (emp == null) return NotFound("Empleado no encontrado.");
            
            if (string.IsNullOrEmpty(req.PhotoBase64)) return BadRequest("Foto vacía");
            
            var base64Data = req.PhotoBase64.Split(',').Last();
            var photoBytes = Convert.FromBase64String(base64Data);
            
            var env = HttpContext.RequestServices.GetService<IWebHostEnvironment>();
            var uploadsFolder = Path.Combine(env?.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "uploads", "profiles");
            if (!Directory.Exists(uploadsFolder)) Directory.CreateDirectory(uploadsFolder);
            
            var fileName = $"{Guid.NewGuid()}_profile.jpg";
            var filePath = Path.Combine(uploadsFolder, fileName);
            await System.IO.File.WriteAllBytesAsync(filePath, photoBytes);
            
            emp.ProfileImagePath = $"/uploads/profiles/{fileName}";
            await _context.SaveChangesAsync();
            
            return Ok(new { success = true, profileImagePath = emp.ProfileImagePath });
        }

        [HttpPost("{dni}/create-app-account")]
        public async Task<IActionResult> CreateAppAccount(string dni)
        {
            var employee = await _context.Employees.FirstOrDefaultAsync(e => e.Dni == dni);
            if (employee == null) return NotFound(new { message = "Empleado no encontrado" });
            
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Dni == dni);
            if (user == null)
            {
                user = new Models.Entities.User 
                { 
                    Dni = dni, 
                    Email = dni + "@chavin.com", 
                    Rol = "Colaborador", 
                    IsActive = true, 
                    CreatedAt = DateTime.UtcNow 
                };
                Services.DbHelper.CreatePasswordHash(dni, out var hash, out var salt);
                user.PasswordHash = hash;
                user.PasswordSalt = salt;
                _context.Users.Add(user);
                await _context.SaveChangesAsync();
                
                employee.UserId = user.Id;
                await _context.SaveChangesAsync();
                return Ok(new { success = true, message = "Cuenta creada y vinculada correctamente." });
            }
            
            // Si ya existe pero no estaba activa
            user.IsActive = true;
            user.ModifiedAt = DateTime.UtcNow;
            if (employee.UserId == null) 
            {
                employee.UserId = user.Id;
            }
            await _context.SaveChangesAsync();
            
            return Ok(new { success = true, message = "Cuenta activada correctamente." });
        }
    }
}
