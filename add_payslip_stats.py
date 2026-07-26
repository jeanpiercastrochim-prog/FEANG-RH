import re

file_path = r'c:\Users\Lenovo\Desktop\solucion_RH\proyecto\src\Api\Controllers\PayslipController.cs'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

new_method = """
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

"""

# Insert before GetAll
content = content.replace("public async Task<IActionResult> GetAll", new_method + "        [HttpGet]\n        public async Task<IActionResult> GetAll")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
