using System;

namespace DNIContractApi.Models
{
    public class AppNotification
    {
        public int Id { get; set; }
        public string EmployeeDni { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public bool IsRead { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}
