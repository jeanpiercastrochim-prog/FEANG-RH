using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DNIContractApi.Data;
using DNIContractApi.Models.Entities;

namespace DNIContractApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ContractTemplateController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _env;

        public ContractTemplateController(AppDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        // GET /api/contracttemplate
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var templates = await _context.Contracts
                .OrderBy(c => c.Name)
                .Select(c => new {
                    c.Id,
                    c.Name,
                    c.FilePath,
                    c.CreatedAt,
                    FileSize = c.FilePath != null ? GetFileSize(c.FilePath, _env) : "—"
                })
                .ToListAsync();

            return Ok(templates);
        }

        // POST /api/contracttemplate  (multipart: file + name)
        [HttpPost]
        public async Task<IActionResult> Upload([FromForm] IFormFile file, [FromForm] string name)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { error = "Archivo requerido." });
            if (string.IsNullOrWhiteSpace(name))
                return BadRequest(new { error = "Nombre/categoría requerido." });
            if (!file.ContentType.Contains("pdf"))
                return BadRequest(new { error = "Solo se aceptan archivos PDF." });

            var templatesFolder = Path.Combine(
                _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"),
                "templates");
            if (!Directory.Exists(templatesFolder))
                Directory.CreateDirectory(templatesFolder);

            var fileName = $"{Guid.NewGuid()}_{Path.GetFileName(file.FileName)}";
            var filePath = Path.Combine(templatesFolder, fileName);
            using (var stream = new FileStream(filePath, FileMode.Create))
                await file.CopyToAsync(stream);

            var template = new Contract
            {
                Name = name.Trim(),
                FilePath = $"/templates/{fileName}",
                CreatedAt = DateTime.UtcNow
            };
            _context.Contracts.Add(template);
            await _context.SaveChangesAsync();

            return Ok(new {
                template.Id,
                template.Name,
                template.FilePath,
                template.CreatedAt,
                FileSize = FormatSize(file.Length)
            });
        }

        // DELETE /api/contracttemplate/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var template = await _context.Contracts.FindAsync(id);
            if (template == null) return NotFound();

            // Eliminar el archivo físico si existe
            if (!string.IsNullOrEmpty(template.FilePath))
            {
                var webRoot = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
                var fullPath = Path.Combine(webRoot, template.FilePath.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));
                if (System.IO.File.Exists(fullPath))
                    System.IO.File.Delete(fullPath);
            }

            _context.Contracts.Remove(template);
            await _context.SaveChangesAsync();
            return Ok(new { success = true });
        }

        private static string GetFileSize(string filePath, IWebHostEnvironment env)
        {
            try
            {
                var webRoot = env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
                var full = Path.Combine(webRoot, filePath.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));
                if (!System.IO.File.Exists(full)) return "—";
                var bytes = new FileInfo(full).Length;
                return FormatSize(bytes);
            }
            catch { return "—"; }
        }

        private static string FormatSize(long bytes)
        {
            if (bytes < 1024) return $"{bytes} B";
            if (bytes < 1024 * 1024) return $"{bytes / 1024.0:F1} KB";
            return $"{bytes / (1024.0 * 1024):F1} MB";
        }
    }
}
