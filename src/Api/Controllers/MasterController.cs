using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DNIContractApi.Data;
using DNIContractApi.Models.Entities;
using System.Threading.Tasks;
using System.Linq;
using System;

namespace DNIContractApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MasterController : ControllerBase
    {
        private readonly AppDbContext _context;

        public MasterController(AppDbContext context)
        {
            _context = context;
        }

        // --- CARGOS ---
        [HttpGet("cargos")]
        public async Task<IActionResult> GetCargos()
        {
            var cargos = await _context.Cargos
                .Include(c => c.AreaDetalle)
                .Include(c => c.NivelDetalle)
                .OrderBy(c => c.Nombre)
                .Select(c => new {
                    c.Id,
                    c.Nombre,
                    c.Descripcion,
                    Area = c.AreaDetalle != null ? c.AreaDetalle.Nombre : null,
                    AreaId = c.AreaId,
                    Nivel = c.NivelDetalle != null ? c.NivelDetalle.Nombre : null,
                    NivelId = c.NivelId,
                    c.SueldoBase,
                    c.Estado,
                    c.CreatedAt,
                    c.ModifiedAt
                })
                .ToListAsync();
            return Ok(cargos);
        }

        [HttpPost("cargos")]
        public async Task<IActionResult> CreateCargo([FromBody] Cargo cargo)
        {
            _context.Cargos.Add(cargo);
            await _context.SaveChangesAsync();
            return Ok(cargo);
        }

        [HttpPut("cargos/{id}")]
        public async Task<IActionResult> UpdateCargo(int id, [FromBody] Cargo cargo)
        {
            var existing = await _context.Cargos.FindAsync(id);
            if (existing == null) return NotFound();
            
            existing.Nombre = cargo.Nombre;
            existing.Descripcion = cargo.Descripcion;
            existing.AreaId = cargo.AreaId;
            existing.NivelId = cargo.NivelId;
            existing.SueldoBase = cargo.SueldoBase;
            existing.Estado = cargo.Estado ?? "Activo";

            await _context.SaveChangesAsync();
            return Ok(existing);
        }

        [HttpDelete("cargos/{id}")]
        public async Task<IActionResult> DeleteCargo(int id)
        {
            var existing = await _context.Cargos.FindAsync(id);
            if (existing == null) return NotFound();

            _context.Cargos.Remove(existing);
            await _context.SaveChangesAsync();
            return Ok(new { success = true });
        }

        // --- CONTRATOS ---
        [HttpGet("contratos")]
        public async Task<IActionResult> GetContracts()
        {
            var contracts = await _context.Contracts
                .Include(c => c.Cargo)
                .OrderBy(c => c.Name)
                .Select(c => new {
                    c.Id,
                    c.Name,
                    c.FilePath,
                    c.CargoId,
                    CargoName = c.Cargo != null ? c.Cargo.Nombre : null,
                    SueldoBase = c.Cargo != null ? c.Cargo.SueldoBase : 0m,
                    c.CreatedAt
                })
                .ToListAsync();
            return Ok(contracts);
        }

        [HttpPost("contratos")]
        public async Task<IActionResult> CreateContract([FromBody] Contract contract)
        {
            _context.Contracts.Add(contract);
            await _context.SaveChangesAsync();
            return Ok(contract);
        }

        [HttpPut("contratos/{id}")]
        public async Task<IActionResult> UpdateContract(int id, [FromBody] Contract contract)
        {
            var existing = await _context.Contracts.FindAsync(id);
            if (existing == null) return NotFound();
            
            existing.Name = contract.Name;
            existing.FilePath = contract.FilePath;
            existing.CargoId = contract.CargoId;

            await _context.SaveChangesAsync();
            return Ok(existing);
        }

        [HttpDelete("contratos/{id}")]
        public async Task<IActionResult> DeleteContract(int id)
        {
            var existing = await _context.Contracts.FindAsync(id);
            if (existing == null) return NotFound();

            _context.Contracts.Remove(existing);
            await _context.SaveChangesAsync();
            return Ok(new { success = true });
        }

        // --- DEFINICIONES ---
        [HttpGet("definiciones")]
        public async Task<IActionResult> GetDefiniciones()
        {
            var definiciones = await _context.Definiciones.OrderBy(d => d.Codigo).ToListAsync();
            return Ok(definiciones);
        }

        [HttpPost("definiciones")]
        public async Task<IActionResult> CreateDefinicion([FromBody] Definicion definicion)
        {
            _context.Definiciones.Add(definicion);
            await _context.SaveChangesAsync();
            return Ok(definicion);
        }

        [HttpPut("definiciones/{codigo}")]
        public async Task<IActionResult> UpdateDefinicion(string codigo, [FromBody] Definicion definicion)
        {
            var existing = await _context.Definiciones.FindAsync(codigo);
            if (existing == null) return NotFound();
            
            existing.Nombre = definicion.Nombre;
            existing.Descripcion = definicion.Descripcion;
            existing.Activo = definicion.Activo;

            await _context.SaveChangesAsync();
            return Ok(existing);
        }

        [HttpDelete("definiciones/{codigo}")]
        public async Task<IActionResult> DeleteDefinicion(string codigo)
        {
            var existing = await _context.Definiciones.FindAsync(codigo);
            if (existing == null) return NotFound();

            _context.Definiciones.Remove(existing);
            await _context.SaveChangesAsync();
            return Ok(new { success = true });
        }

        // --- UBIGEOS ---
        [HttpGet("ubigeos")]
        public async Task<IActionResult> GetUbigeos()
        {
            var ubigeos = await _context.Ubigeos.OrderBy(u => u.Departamento).ThenBy(u => u.Provincia).ThenBy(u => u.Distrito).ToListAsync();
            return Ok(ubigeos);
        }

        [HttpPost("ubigeos")]
        public async Task<IActionResult> CreateUbigeo([FromBody] Ubigeo ubigeo)
        {
            _context.Ubigeos.Add(ubigeo);
            await _context.SaveChangesAsync();
            return Ok(ubigeo);
        }

        [HttpPut("ubigeos/{id}")]
        public async Task<IActionResult> UpdateUbigeo(int id, [FromBody] Ubigeo ubigeo)
        {
            var existing = await _context.Ubigeos.FindAsync(id);
            if (existing == null) return NotFound();
            
            existing.Departamento = ubigeo.Departamento;
            existing.Provincia = ubigeo.Provincia;
            existing.Distrito = ubigeo.Distrito;

            await _context.SaveChangesAsync();
            return Ok(existing);
        }

        [HttpDelete("ubigeos/{id}")]
        public async Task<IActionResult> DeleteUbigeo(int id)
        {
            var existing = await _context.Ubigeos.FindAsync(id);
            if (existing == null) return NotFound();

            _context.Ubigeos.Remove(existing);
            await _context.SaveChangesAsync();
            return Ok(new { success = true });
        }

        // --- USUARIOS ---
        [HttpGet("usuarios")]
        public async Task<IActionResult> GetUsuarios()
        {
            var usuarios = await _context.Users.Select(u => new {
                u.Id,
                u.Dni,
                u.Email,
                u.Rol,
                u.IsActive
            }).OrderBy(u => u.Dni).ToListAsync();
            return Ok(usuarios);
        }

        [HttpPost("usuarios")]
        public async Task<IActionResult> CreateUsuario([FromBody] User user)
        {
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            return Ok(new { user.Id, user.Dni, user.Email, user.Rol, user.IsActive });
        }

        [HttpPut("usuarios/{id}")]
        public async Task<IActionResult> UpdateUsuario(int id, [FromBody] User user)
        {
            var existing = await _context.Users.FindAsync(id);
            if (existing == null) return NotFound();
            
            existing.Dni = user.Dni;
            existing.Email = user.Email;
            existing.Rol = user.Rol;
            existing.IsActive = user.IsActive;

            await _context.SaveChangesAsync();
            return Ok(new { existing.Id, existing.Dni, existing.Email, existing.Rol, existing.IsActive });
        }

        [HttpDelete("usuarios/{id}")]
        public async Task<IActionResult> DeleteUsuario(int id)
        {
            var existing = await _context.Users.FindAsync(id);
            if (existing == null) return NotFound();

            bool isReferenced = await _context.Employees.AnyAsync(e => e.UserId == id);
            if (isReferenced)
            {
                return BadRequest("No se puede eliminar el usuario porque está vinculado a un Empleado. Te recomendamos simplemente Editarlo y quitarle el check de Activo.");
            }

            _context.Users.Remove(existing);
            await _context.SaveChangesAsync();
            return Ok(new { success = true });
        }
        // --- DEFINICION DETALLES ---
        [HttpGet("definicion-detalles")]
        public async Task<IActionResult> GetDefinicionDetalles()
        {
            var data = await _context.DefinicionDetalles.OrderBy(d => d.Id).Take(100).ToListAsync();
            return Ok(data);
        }
        [HttpDelete("definicion-detalles/{id}")]
        public async Task<IActionResult> DeleteDefinicionDetalle(int id) {
            var existing = await _context.DefinicionDetalles.FindAsync(id);
            if (existing != null) { _context.DefinicionDetalles.Remove(existing); await _context.SaveChangesAsync(); }
            return Ok(new { success = true });
        }

        // --- EMPLOYEES ---
        [HttpGet("employees")]
        public async Task<IActionResult> GetEmployees()
        {
            var data = await _context.Employees.OrderBy(d => d.Id).Take(100).ToListAsync();
            return Ok(data);
        }
        [HttpDelete("employees/{id}")]
        public async Task<IActionResult> DeleteEmployee(int id) {
            var existing = await _context.Employees.FindAsync(id);
            if (existing != null) { _context.Employees.Remove(existing); await _context.SaveChangesAsync(); }
            return Ok(new { success = true });
        }

        // --- EMPLOYEE EDUCATIONS ---
        [HttpGet("employee-educations")]
        public async Task<IActionResult> GetEmployeeEducations()
        {
            var data = await _context.EmployeeEducations.OrderBy(d => d.Id).Take(100).ToListAsync();
            return Ok(data);
        }
        [HttpDelete("employee-educations/{id}")]
        public async Task<IActionResult> DeleteEmployeeEducation(int id) {
            var existing = await _context.EmployeeEducations.FindAsync(id);
            if (existing != null) { _context.EmployeeEducations.Remove(existing); await _context.SaveChangesAsync(); }
            return Ok(new { success = true });
        }

        // --- EMPLOYEE CONTRACTS ---
        [HttpGet("employee-contracts")]
        public async Task<IActionResult> GetEmployeeContracts()
        {
            var data = await _context.EmployeeContracts.OrderBy(d => d.Id).Take(100).ToListAsync();
            return Ok(data);
        }
        [HttpDelete("employee-contracts/{id}")]
        public async Task<IActionResult> DeleteEmployeeContract(int id) {
            var existing = await _context.EmployeeContracts.FindAsync(id);
            if (existing != null) { _context.EmployeeContracts.Remove(existing); await _context.SaveChangesAsync(); }
            return Ok(new { success = true });
        }

        // --- EMPLOYEE PAYSLIPS ---
        [HttpGet("employee-payslips")]
        public async Task<IActionResult> GetEmployeePayslips()
        {
            var data = await _context.EmployeePayslips.OrderBy(d => d.Id).Take(100).ToListAsync();
            return Ok(data);
        }
        [HttpDelete("employee-payslips/{id}")]
        public async Task<IActionResult> DeleteEmployeePayslip(int id) {
            var existing = await _context.EmployeePayslips.FindAsync(id);
            if (existing != null) { _context.EmployeePayslips.Remove(existing); await _context.SaveChangesAsync(); }
            return Ok(new { success = true });
        }

        // --- PAYSLIPS ---
        [HttpGet("payslips")]
        public async Task<IActionResult> GetPayslips()
        {
            var data = await _context.Payslips.OrderBy(d => d.Id).Take(100).ToListAsync();
            return Ok(data);
        }
        [HttpDelete("payslips/{id}")]
        public async Task<IActionResult> DeletePayslip(int id) {
            var existing = await _context.Payslips.FindAsync(id);
            if (existing != null) { _context.Payslips.Remove(existing); await _context.SaveChangesAsync(); }
            return Ok(new { success = true });
        }

        // --- DNI PHOTOS ---
        [HttpGet("dni-photos")]
        public async Task<IActionResult> GetDniPhotos()
        {
            var data = await _context.DniPhotos.OrderBy(d => d.Id).Take(100).ToListAsync();
            return Ok(data);
        }
        [HttpDelete("dni-photos/{id}")]
        public async Task<IActionResult> DeleteDniPhoto(int id) {
            var existing = await _context.DniPhotos.FindAsync(id);
            if (existing != null) { _context.DniPhotos.Remove(existing); await _context.SaveChangesAsync(); }
            return Ok(new { success = true });
        }

        // --- APP NOTIFICATIONS ---
        [HttpGet("app-notifications")]
        public async Task<IActionResult> GetAppNotifications()
        {
            var data = await _context.AppNotifications.OrderBy(d => d.Id).Take(100).ToListAsync();
            return Ok(data);
        }
        [HttpDelete("app-notifications/{id}")]
        public async Task<IActionResult> DeleteAppNotification(int id) {
            var existing = await _context.AppNotifications.FindAsync(id);
            if (existing != null) { _context.AppNotifications.Remove(existing); await _context.SaveChangesAsync(); }
            return Ok(new { success = true });
        }
    }
}
