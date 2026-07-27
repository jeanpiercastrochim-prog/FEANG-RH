using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DNIContractApi.Data;

namespace DNIContractApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AuthController(AppDbContext context)
        {
            _context = context;
        }

        public class LoginRequest
        {
            public string Dni { get; set; } = string.Empty;
            public string Password { get; set; } = string.Empty;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest req)
        {
            if (string.IsNullOrEmpty(req.Dni) || string.IsNullOrEmpty(req.Password))
            {
                return BadRequest(new { success = false, message = "DNI y contraseña son requeridos." });
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Dni == req.Dni && u.IsActive);
            if (user == null || !Services.DbHelper.VerifyPasswordHash(req.Password, user.PasswordHash, user.PasswordSalt))
            {
                return NotFound(new { success = false, message = "DNI o contraseña incorrectos." });
            }

            bool requiresPasswordChange = Services.DbHelper.VerifyPasswordHash(user.Dni, user.PasswordHash, user.PasswordSalt);

            var employee = await _context.Employees.FirstOrDefaultAsync(e => e.UserId == user.Id);
            if (employee == null)
            {
                return Ok(new { 
                    success = true, 
                    requiresPasswordChange,
                    employee = new {
                        id = 0,
                        nombres = user.Rol,
                        fullName = user.Email,
                        dni = user.Dni,
                        rol = user.Rol
                    }
                });
            }

            return Ok(new { 
                success = true, 
                requiresPasswordChange,
                employee = new {
                    id = employee.Id,
                    nombres = employee.Nombres,
                    fullName = employee.FullName,
                    dni = employee.Dni,
                    rol = user.Rol
                }
            });
        }

        public class ChangePasswordRequest
        {
            public string Dni { get; set; } = string.Empty;
            public string OldPassword { get; set; } = string.Empty;
            public string NewPassword { get; set; } = string.Empty;
        }

        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest req)
        {
            if (string.IsNullOrEmpty(req.Dni) || string.IsNullOrEmpty(req.OldPassword) || string.IsNullOrEmpty(req.NewPassword))
            {
                return BadRequest(new { success = false, message = "DNI, contraseña actual y nueva contraseña son requeridos." });
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Dni == req.Dni && u.IsActive);
            if (user == null || !Services.DbHelper.VerifyPasswordHash(req.OldPassword, user.PasswordHash, user.PasswordSalt))
            {
                return NotFound(new { success = false, message = "Credenciales incorrectas." });
            }

            Services.DbHelper.CreatePasswordHash(req.NewPassword, out var hash, out var salt);
            user.PasswordHash = hash;
            user.PasswordSalt = salt;
            user.ModifiedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Contraseña actualizada exitosamente." });
        }

        [HttpPost("create-temp-user")]
        public async Task<IActionResult> CreateTempUser([FromQuery] string dni, [FromQuery] string password)
        {
            var employee = await _context.Employees.FirstOrDefaultAsync(e => e.Dni == dni);
            if (employee == null) return NotFound("Employee not found");
            
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Dni == dni);
            if (user == null)
            {
                user = new Models.Entities.User { Dni = dni, Email = dni + "@chavin.com", Rol = "Colaborador" };
                Services.DbHelper.CreatePasswordHash(password, out var hash, out var salt);
                user.PasswordHash = hash;
                user.PasswordSalt = salt;
                _context.Users.Add(user);
                await _context.SaveChangesAsync();
                
                employee.UserId = user.Id;
                await _context.SaveChangesAsync();
                return Ok("User created and linked");
            }
            return Ok("User already exists");
        }

        [HttpGet("seed-roles")]
        public async Task<IActionResult> SeedRoles()
        {
            // Seed Admin
            var adminDni = "00000000";
            var adminUser = await _context.Users.FirstOrDefaultAsync(u => u.Dni == adminDni);
            if (adminUser == null)
            {
                adminUser = new Models.Entities.User { Dni = adminDni, Email = "admin@chavin.com", Rol = "Admin" };
                Services.DbHelper.CreatePasswordHash("admin123", out var hash, out var salt);
                adminUser.PasswordHash = hash;
                adminUser.PasswordSalt = salt;
                _context.Users.Add(adminUser);
                await _context.SaveChangesAsync();
            }

            // Seed Transportista and Fix Drivers
            var driverDnis = new[] { "11111111", "33333333", "44444444", "55555555" };
            foreach (var d in driverDnis)
            {
                var u = await _context.Users.FirstOrDefaultAsync(x => x.Dni == d);
                if (u == null)
                {
                    u = new Models.Entities.User { Dni = d, Email = $"driver{d}@chavin.com", Rol = "Transportista" };
                    _context.Users.Add(u);
                }
                
                u.Rol = "Transportista";
                u.IsActive = true;
                Services.DbHelper.CreatePasswordHash("trans123", out var hash, out var salt);
                u.PasswordHash = hash;
                u.PasswordSalt = salt;
            }

            // Seed Almacenero
            var almacenDnis = new[] { "66666666", "88888888" };
            foreach (var a in almacenDnis)
            {
                var almacenUser = await _context.Users.FirstOrDefaultAsync(u => u.Dni == a);
                if (almacenUser == null)
                {
                    almacenUser = new Models.Entities.User { Dni = a, Email = $"almacen{a}@chavin.com", Rol = "Almacenero" };
                    _context.Users.Add(almacenUser);
                }

                almacenUser.Rol = "Almacenero";
                almacenUser.IsActive = true;
                Services.DbHelper.CreatePasswordHash("almacen123", out var hash, out var salt);
                almacenUser.PasswordHash = hash;
                almacenUser.PasswordSalt = salt;
            }

            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Usuarios Transportista y Almacen creados correctamente." });
        }
    }
}
