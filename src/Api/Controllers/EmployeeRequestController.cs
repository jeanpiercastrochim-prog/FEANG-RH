using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DNIContractApi.Data;
using DNIContractApi.Models.Entities;

namespace DNIContractApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EmployeeRequestController : ControllerBase
    {
        private readonly AppDbContext _context;

        public EmployeeRequestController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("{employeeId}")]
        public async Task<IActionResult> GetEmployeeRequests(int employeeId)
        {
            var requests = await _context.EmployeeRequests
                .Where(r => r.EmployeeId == employeeId)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();

            return Ok(requests);
        }

        [HttpPost]
        public async Task<IActionResult> CreateEmployeeRequest([FromBody] EmployeeRequest req)
        {
            if (req == null)
                return BadRequest(new { success = false, message = "Datos de solicitud inválidos." });

            // MOCK FOR TESTING: If EmployeeId is 0 (Admin user testing), assign to the first available employee
            if (req.EmployeeId <= 0)
            {
                var firstEmployee = await _context.Employees.FirstOrDefaultAsync();
                if (firstEmployee != null)
                {
                    req.EmployeeId = firstEmployee.Id;
                }
                else
                {
                    return BadRequest(new { success = false, message = "No hay empleados en la base de datos para asignar esta solicitud de prueba." });
                }
            }

            var employee = await _context.Employees.FindAsync(req.EmployeeId);
            if (employee == null)
                return NotFound(new { success = false, message = "Empleado no encontrado." });

            req.Status = "Pendiente";
            req.CreatedAt = DateTime.UtcNow;

            _context.EmployeeRequests.Add(req);
            await _context.SaveChangesAsync();

            // Create AppNotification for the employee to notify them that the request was received
            var notification = new DNIContractApi.Models.AppNotification
            {
                EmployeeDni = employee.Dni,
                Title = "Solicitud Recibida",
                Message = $"Tu solicitud de '{req.Type}' ha sido recibida y está en estado Pendiente.",
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            };
            _context.AppNotifications.Add(notification);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Solicitud enviada correctamente.", request = req });
        }

        [HttpGet("all")]
        public async Task<IActionResult> GetAllRequests()
        {
            var requests = await _context.EmployeeRequests
                .Include(r => r.Employee)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new {
                    r.Id,
                    r.EmployeeId,
                    EmployeeName = r.Employee.FullName,
                    EmployeeDni = r.Employee.Dni,
                    r.Type,
                    r.FormData,
                    r.Status,
                    r.Observations,
                    r.CreatedAt,
                    r.UpdatedAt
                })
                .ToListAsync();

            return Ok(requests);
        }

        public class UpdateRequestStatusDto
        {
            public string Status { get; set; }
            public string Observations { get; set; }
        }

        [HttpPost("{id}/status")]
        public async Task<IActionResult> UpdateRequestStatus(int id, [FromBody] UpdateRequestStatusDto dto)
        {
            var request = await _context.EmployeeRequests
                .Include(r => r.Employee)
                .FirstOrDefaultAsync(r => r.Id == id);
            
            if (request == null)
                return NotFound(new { success = false, message = "Solicitud no encontrada." });

            request.Status = dto.Status;
            request.Observations = dto.Observations;
            request.UpdatedAt = DateTime.UtcNow;

            var notification = new DNIContractApi.Models.AppNotification
            {
                EmployeeDni = request.Employee.Dni,
                Title = "Actualización de Solicitud",
                Message = $"Tu solicitud de '{request.Type}' ahora se encuentra: {dto.Status}.",
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            };
            _context.AppNotifications.Add(notification);

            await _context.SaveChangesAsync();
            return Ok(new { success = true, message = "Estado actualizado correctamente." });
        }
    }
}
