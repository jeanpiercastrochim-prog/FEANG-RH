using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DNIContractApi.Data;
using DNIContractApi.Models;
using System;
using System.Threading.Tasks;
using System.Linq;

namespace DNIContractApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AppNotificationController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AppNotificationController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("{dni}")]
        public async Task<IActionResult> GetNotifications(string dni)
        {
            var notifications = await _context.AppNotifications
                .Where(n => n.EmployeeDni == dni)
                .OrderByDescending(n => n.CreatedAt)
                .ToListAsync();

            return Ok(notifications);
        }

        [HttpPost]
        public async Task<IActionResult> CreateNotification([FromBody] AppNotification notification)
        {
            if (string.IsNullOrEmpty(notification.EmployeeDni))
                return BadRequest("DNI is required.");

            notification.CreatedAt = DateTime.Now;
            notification.IsRead = false;

            _context.AppNotifications.Add(notification);
            await _context.SaveChangesAsync();

            return Ok(notification);
        }

        [HttpPut("{id}/read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            var notification = await _context.AppNotifications.FindAsync(id);
            if (notification == null) return NotFound();

            notification.IsRead = true;
            await _context.SaveChangesAsync();

            return Ok(notification);
        }
    }
}
