using System;

namespace DNIContractApi.Models.Entities
{
    public class User
    {
        public int Id { get; set; }
        public string Dni { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public byte[] PasswordHash { get; set; } = Array.Empty<byte>();
        public byte[] PasswordSalt { get; set; } = Array.Empty<byte>();
        public string Rol { get; set; } = "Colaborador";
        public bool IsActive { get; set; } = true;
        public DateTime? LastLogin { get; set; }
        public int FailedAttempts { get; set; }
        public DateTime? LockedUntil { get; set; }
        public byte[]? RefreshTokenHash { get; set; }
        public DateTime? RefreshTokenExpiration { get; set; }
        public int? CreatedBy { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public int? ModifiedBy { get; set; }
        public DateTime? ModifiedAt { get; set; }
    }
}
