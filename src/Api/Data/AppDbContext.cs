using Microsoft.EntityFrameworkCore;
using DNIContractApi.Models.Entities;

namespace DNIContractApi.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }

        // Transport/Fleet Models
        public DbSet<TransViaje> TransViajes { get; set; }
        public DbSet<TransUbicacion> TransUbicaciones { get; set; }
        public DbSet<TransAlerta> TransAlertas { get; set; }
        public DbSet<Definicion> Definiciones { get; set; }
        public DbSet<DefinicionDetalle> DefinicionDetalles { get; set; }
        public DbSet<Ubigeo> Ubigeos { get; set; }
        public DbSet<Cargo> Cargos { get; set; }
        public DbSet<Employee> Employees { get; set; }
        public DbSet<EmployeeEducation> EmployeeEducations { get; set; }
        public DbSet<Contract> Contracts { get; set; }
        public DbSet<EmployeeContract> EmployeeContracts { get; set; }
        public DbSet<Payslip> Payslips { get; set; }
        public DbSet<EmployeePayslip> EmployeePayslips { get; set; }
        public DbSet<DniPhoto> DniPhotos { get; set; }
        public DbSet<DNIContractApi.Models.AppNotification> AppNotifications { get; set; }
        public DbSet<EmployeeRequest> EmployeeRequests { get; set; }

        // Almacen Models
        public DbSet<AlmacenUbicacion> AlmacenUbicaciones { get; set; }
        public DbSet<AlmacenProducto> AlmacenProductos { get; set; }
        public DbSet<AlmacenInventario> AlmacenInventarios { get; set; }
        public DbSet<AlmacenMovimiento> AlmacenMovimientos { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Definiciones
            modelBuilder.Entity<Definicion>()
                .ToTable("Definiciones")
                .HasKey(d => d.Codigo);

            // DefinicionDetalle
            modelBuilder.Entity<DefinicionDetalle>()
                .ToTable("DefinicionDetalle")
                .HasKey(dd => dd.Id);

            modelBuilder.Entity<DefinicionDetalle>()
                .HasIndex(dd => new { dd.DefinicionCodigo, dd.Id })
                .IsUnique();

            modelBuilder.Entity<DefinicionDetalle>()
                .HasOne(dd => dd.Definicion)
                .WithMany(d => d.Detalles)
                .HasForeignKey(dd => dd.DefinicionCodigo);

            // Ubigeo
            modelBuilder.Entity<Ubigeo>()
                .ToTable("Ubigeo")
                .HasKey(u => u.Id);

            // Cargo
            modelBuilder.Entity<Cargo>()
                .ToTable("Cargos")
                .HasKey(c => c.Id);

            modelBuilder.Entity<Cargo>()
                .HasOne(c => c.AreaDetalle)
                .WithMany()
                .HasForeignKey(c => new { c.AreaDefinicionCodigo, c.AreaId })
                .HasPrincipalKey(dd => new { dd.DefinicionCodigo, dd.Id })
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Cargo>()
                .HasOne(c => c.NivelDetalle)
                .WithMany()
                .HasForeignKey(c => new { c.NivelDefinicionCodigo, c.NivelId })
                .HasPrincipalKey(dd => new { dd.DefinicionCodigo, dd.Id })
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Cargo>().Property(c => c.AreaDefinicionCodigo).ValueGeneratedOnAddOrUpdate();
            modelBuilder.Entity<Cargo>().Property(c => c.NivelDefinicionCodigo).ValueGeneratedOnAddOrUpdate();

            // User
            modelBuilder.Entity<User>()
                .ToTable("Users", tb => tb.HasTrigger("trg_Users"))
                .HasKey(u => u.Id);

            // Employee
            modelBuilder.Entity<Employee>()
                .ToTable("Employees", tb => tb.HasTrigger("trg_Employees"))
                .HasKey(e => e.Id);

            // Composite Foreign Keys for Employee
            modelBuilder.Entity<Employee>()
                .HasOne(e => e.Genero)
                .WithMany()
                .HasForeignKey(e => new { e.GeneroDefinicionCodigo, e.GeneroId })
                .HasPrincipalKey(dd => new { dd.DefinicionCodigo, dd.Id })
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Employee>()
                .HasOne(e => e.EstadoCivilDetalle)
                .WithMany()
                .HasForeignKey(e => new { e.EstadoCivilDefinicionCodigo, e.EstadoCivilId })
                .HasPrincipalKey(dd => new { dd.DefinicionCodigo, dd.Id })
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Employee>()
                .HasOne(e => e.EstadoEmpleado)
                .WithMany()
                .HasForeignKey(e => new { e.EstadoEmpleadoDefinicionCodigo, e.EstadoEmpleadoId })
                .HasPrincipalKey(dd => new { dd.DefinicionCodigo, dd.Id })
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Employee>()
                .HasOne(e => e.TipoContrato)
                .WithMany()
                .HasForeignKey(e => new { e.TipoContratoDefinicionCodigo, e.TipoContratoId })
                .HasPrincipalKey(dd => new { dd.DefinicionCodigo, dd.Id })
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Employee>()
                .HasOne(e => e.Banco)
                .WithMany()
                .HasForeignKey(e => new { e.BancoDefinicionCodigo, e.BancoId })
                .HasPrincipalKey(dd => new { dd.DefinicionCodigo, dd.Id })
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Employee>()
                .HasOne(e => e.TipoCuentaBancaria)
                .WithMany()
                .HasForeignKey(e => new { e.TipoCuentaBancariaDefinicionCodigo, e.TipoCuentaBancariaId })
                .HasPrincipalKey(dd => new { dd.DefinicionCodigo, dd.Id })
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Employee>()
                .HasOne(e => e.AFP)
                .WithMany()
                .HasForeignKey(e => new { e.AFPDefinicionCodigo, e.AFPId })
                .HasPrincipalKey(dd => new { dd.DefinicionCodigo, dd.Id })
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Employee>()
                .HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Employee>()
                .HasOne(e => e.Cargo)
                .WithMany()
                .HasForeignKey(e => e.CargoId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Employee>()
                .HasOne(e => e.Ubigeo)
                .WithMany()
                .HasForeignKey(e => e.UbigeoId)
                .OnDelete(DeleteBehavior.Restrict);

            // EmployeeRequests
            modelBuilder.Entity<EmployeeRequest>()
                .ToTable("EmployeeRequests")
                .HasKey(er => er.Id);

            modelBuilder.Entity<EmployeeRequest>()
                .HasOne(er => er.Employee)
                .WithMany()
                .HasForeignKey(er => er.EmployeeId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configure calculated persisted columns as database generated
            modelBuilder.Entity<Employee>().Property(e => e.GeneroDefinicionCodigo).ValueGeneratedOnAddOrUpdate();
            modelBuilder.Entity<Employee>().Property(e => e.EstadoCivilDefinicionCodigo).ValueGeneratedOnAddOrUpdate();
            modelBuilder.Entity<Employee>().Property(e => e.EstadoEmpleadoDefinicionCodigo).ValueGeneratedOnAddOrUpdate();
            modelBuilder.Entity<Employee>().Property(e => e.TipoContratoDefinicionCodigo).ValueGeneratedOnAddOrUpdate();
            modelBuilder.Entity<Employee>().Property(e => e.BancoDefinicionCodigo).ValueGeneratedOnAddOrUpdate();
            modelBuilder.Entity<Employee>().Property(e => e.TipoCuentaBancariaDefinicionCodigo).ValueGeneratedOnAddOrUpdate();
            modelBuilder.Entity<Employee>().Property(e => e.AFPDefinicionCodigo).ValueGeneratedOnAddOrUpdate();

            // EmployeeEducation
            modelBuilder.Entity<EmployeeEducation>()
                .ToTable("EmployeeEducation")
                .HasKey(ee => ee.Id);

            modelBuilder.Entity<EmployeeEducation>().Property(ee => ee.NivelEducacionDefinicionCodigo).ValueGeneratedOnAddOrUpdate();

            modelBuilder.Entity<EmployeeEducation>()
                .HasOne(ee => ee.NivelEducacion)
                .WithMany()
                .HasForeignKey(ee => new { ee.NivelEducacionDefinicionCodigo, ee.NivelEducacionId })
                .HasPrincipalKey(dd => new { dd.DefinicionCodigo, dd.Id })
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<EmployeeEducation>()
                .HasOne(ee => ee.Employee)
                .WithMany(e => e.Educations)
                .HasForeignKey(ee => ee.EmployeeId)
                .OnDelete(DeleteBehavior.Cascade);

            // EmployeePayslip Column Mappings
            modelBuilder.Entity<EmployeePayslip>()
                .ToTable("EmployeePayslips")
                .Property(ep => ep.Estado).HasColumnName("Estado");

            modelBuilder.Entity<EmployeePayslip>()
                .Property(ep => ep.SueldoBase)
                .HasColumnType("decimal(18,2)")
                .HasColumnName("SueldoBase");

            // EmployeeContract Column Mappings
            // Contract relationships
            modelBuilder.Entity<Contract>()
                .HasOne(c => c.Cargo)
                .WithMany()
                .HasForeignKey(c => c.CargoId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<EmployeeContract>()
                .ToTable("EmployeeContracts")
                .Property(ec => ec.Status).HasColumnName("Estado");

            // Payslips
            modelBuilder.Entity<Payslip>()
                .ToTable("Payslips")
                .Property(p => p.Periodo).HasColumnName("Periodo");

            // Transport Mappings
            modelBuilder.Entity<TransViaje>()
                .HasMany(tv => tv.Ubicaciones)
                .WithOne(tu => tu.Viaje)
                .HasForeignKey(tu => tu.ViajeId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<TransViaje>()
                .HasMany(tv => tv.Alertas)
                .WithOne(ta => ta.Viaje)
                .HasForeignKey(ta => ta.ViajeId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
