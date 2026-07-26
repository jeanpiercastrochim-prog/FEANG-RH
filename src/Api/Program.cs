using QuestPDF.Infrastructure;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using DNIContractApi.Services;
using Microsoft.EntityFrameworkCore;
using DNIContractApi.Data;
using DNIContractApi.Models.Entities;
using DNIContractApi.Models.DTOs;

var builder = WebApplication.CreateBuilder(args);

// Configurar licencia comunitaria de QuestPDF
QuestPDF.Settings.License = QuestPDF.Infrastructure.LicenseType.Community;

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddScoped<IOcrService, OcrService>();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSignalR();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Configure CORS for frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        builder =>
        {
            builder.SetIsOriginAllowed(origin => true)
                   .AllowAnyMethod()
                   .AllowAnyHeader()
                   .AllowCredentials();
        });
});

var app = builder.Build();

// Ensure DB is created (and recreated for schema changes)
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    // db.Database.EnsureDeleted(); // TEMPORAL: Borrar y recrear para desarrollo
    db.Database.EnsureCreated();

    // Seed de las 6 plantillas de contrato
    if (!db.Contracts.Any())
    {
        var templatesFolder = Path.Combine(
            app.Environment.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"),
            "templates");
        if (!Directory.Exists(templatesFolder))
            Directory.CreateDirectory(templatesFolder);

        var templates = new[]
        {
            "Personal de Campo",
            "Desarrollador de Software",
            "Personal Ejecutivo",
            "Practicante",
            "Operario de Limpieza",
            "Analista de Datos"
        };
        
        foreach (var t in templates)
        {
            var fileName = $"{Guid.NewGuid()}_{t.Replace(" ", "_")}.pdf";
            var filePath = Path.Combine(templatesFolder, fileName);
            
            Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(2, Unit.Centimetre);
                    page.PageColor(Colors.White);
                    page.DefaultTextStyle(x => x.FontSize(11));

                    page.Header().Row(row =>
                    {
                        row.RelativeItem().Column(column =>
                        {
                            column.Item().AlignCenter().Text($"CONTRATO INDIVIDUAL DE TRABAJO - {t.ToUpper()}").FontSize(16).SemiBold().FontColor(Colors.Blue.Darken2);
                            column.Item().AlignCenter().Text("A PLAZO INDETERMINADO").FontSize(14);
                        });
                    });

                    page.Content().Column(col => 
                    {
                        for (int i = 0; i < 4; i++)
                        {
                            col.Item().PaddingVertical(1, Unit.Centimetre).Column(column =>
                            {
                                column.Spacing(10);
                                
                                // Texto Introductorio
                                column.Item().Text(text =>
                                {
                                    text.Span("Conste por el presente documento, el Contrato Individual de Trabajo a Plazo Indeterminado que celebran de una parte LA EMPRESA DEMO S.A.C., y de la otra parte el trabajador ");
                                    text.Span("[NOMBRE DEL TRABAJADOR]").SemiBold();
                                    text.Span(", identificado con DNI N° ");
                                    text.Span("[DNI]").SemiBold();
                                    text.Span($", de sexo [SEXO], con fecha de nacimiento [FECHA], con domicilio en ");
                                    text.Span("[DIRECCIÓN]").SemiBold();
                                    text.Span($", a quien en adelante se le denominará EL TRABAJADOR.");
                                });

                                column.Item().PaddingTop(10).Text("CLÁUSULA PRIMERA: DE LA PRESTACIÓN DE SERVICIOS").SemiBold();
                                column.Item().Text($"EL TRABAJADOR prestará sus servicios a LA EMPRESA como {t} en el área correspondiente. Su fecha de inicio de labores será el [FECHA INICIO]. El nivel educativo declarado es [NIVEL].");

                                column.Item().PaddingTop(10).Text("CLÁUSULA SEGUNDA: DE LA JORNADA").SemiBold();
                                column.Item().Text("EL TRABAJADOR cumplirá una jornada de trabajo ordinaria estipulada por la ley peruana, pudiendo LA EMPRESA modificar los horarios según sus necesidades operativas.");

                                column.Item().PaddingTop(10).Text("CLÁUSULA TERCERA: DE LA REMUNERACIÓN").SemiBold();
                                column.Item().Text("Por la prestación de los servicios, EL TRABAJADOR percibirá la remuneración básica pactada, la misma que será abonada mediante depósito en cuenta.");

                                // Firmas y Huella
                                column.Item().PaddingTop(70).Row(row =>
                                {
                                    row.RelativeItem().AlignCenter().Column(c => 
                                    {
                                        c.Item().LineHorizontal(1).LineColor(Colors.Black);
                                        c.Item().AlignCenter().Text("LA EMPRESA").SemiBold();
                                    });
                                    
                                    row.ConstantItem(40);
                                    
                                    row.RelativeItem().AlignCenter().Column(c => 
                                    {
                                        c.Item().LineHorizontal(1).LineColor(Colors.Black);
                                        c.Item().AlignCenter().Text("EL TRABAJADOR").SemiBold();
                                        c.Item().AlignCenter().Text("DNI: [DNI]");
                                    });
                                    
                                    row.ConstantItem(40);
                                    
                                    row.RelativeItem().AlignCenter().Column(c => 
                                    {
                                        c.Item().Height(80).Border(1).BorderColor(Colors.Black);
                                        c.Item().PaddingTop(5).AlignCenter().Text("HUELLA DACTILAR").SemiBold();
                                    });
                                });
                            });

                            if (i < 3) 
                            {
                                col.Item().PageBreak();
                            }
                        }
                    });

                    page.Footer().AlignCenter().Text(x =>
                    {
                        x.Span("Página ");
                        x.CurrentPageNumber();
                        x.Span(" de ");
                        x.TotalPages();
                    });
                });
            }).GeneratePdf(filePath);

            db.Contracts.Add(new Contract { Name = t, FilePath = $"/templates/{fileName}", CreatedAt = DateTime.UtcNow });
        }
        db.SaveChanges();
    }

    if (!db.Employees.Any())
    {
        var random = new Random();
        var firstNames = new[] { "Juan", "Maria", "Carlos", "Luis", "Ana", "Jose", "Rosa", "Pedro", "Laura", "Jorge", "Carmen", "Miguel", "Sofia", "Victor", "Diana", "Raul", "Elena", "Hugo", "Silvia", "David" };
        var lastNames = new[] { "Perez", "Gomez", "Ramos", "Suarez", "Diaz", "Torres", "Luna", "Ruiz", "Castro", "Silva", "Vega", "Peña", "Rios", "Cruz", "Soto", "Ortiz", "Rios", "Rojas", "Paz", "Jara" };

        var targetPeriod = new DateTime(2026, 7, 1);
        var generalPayslip = db.Payslips.FirstOrDefault(p => p.Periodo == targetPeriod);
        if (generalPayslip == null)
        {
            generalPayslip = new Payslip { Month = "Julio", Year = 2026 };
            db.Payslips.Add(generalPayslip);
            db.SaveChanges(); // to get ID
        }

        // SEED REQUIRED USERS
        // 1. Rebeca (RRHH)
        var rebecaEmp = new Employee {
            Nombres = "Rebeca",
            ApellidoPaterno = "Gomez",
            ApellidoMaterno = "RRHH",
            Email = "rebeca@chavin.com",
            Password = "rebeca123",
            Dni = "11111111",
            Position = "Recursos Humanos",
            BaseSalary = 3000,
            HasPrimary = true,
            HasSecondary = true
        };
        DbHelper.ResolveRelationsAsync(db, rebecaEmp).GetAwaiter().GetResult();
        db.Employees.Add(rebecaEmp);

        // 2. Flavio (RRHH)
        var flavioEmp = new Employee {
            Nombres = "Flavio",
            ApellidoPaterno = "Torres",
            ApellidoMaterno = "RRHH",
            Email = "flavio@chavin.com",
            Password = "flavio123",
            Dni = "22222222",
            Position = "Recursos Humanos",
            BaseSalary = 3000,
            HasPrimary = true,
            HasSecondary = true
        };
        DbHelper.ResolveRelationsAsync(db, flavioEmp).GetAwaiter().GetResult();
        db.Employees.Add(flavioEmp);

        // 3. Carlos (Test User 1)
        var carlosEmp = new Employee {
            Nombres = "Carlos",
            ApellidoPaterno = "Prueba",
            ApellidoMaterno = "Uno",
            Email = "carlos@chavin.com",
            Password = "trans123",
            Dni = "33333333",
            Position = "Personal de Campo",
            BaseSalary = 1500,
            HasPrimary = true,
            HasSecondary = true
        };
        DbHelper.ResolveRelationsAsync(db, carlosEmp).GetAwaiter().GetResult();
        db.Employees.Add(carlosEmp);

        // 4. Ana (Test User 2)
        var anaEmp = new Employee {
            Nombres = "Ana",
            ApellidoPaterno = "Prueba",
            ApellidoMaterno = "Dos",
            Email = "ana@chavin.com",
            Password = "trans123",
            Dni = "44444444",
            Position = "Personal de Campo",
            BaseSalary = 1500,
            HasPrimary = true,
            HasSecondary = true
        };
        DbHelper.ResolveRelationsAsync(db, anaEmp).GetAwaiter().GetResult();
        db.Employees.Add(anaEmp);

        // 5. Luis (Test User 3 - Conductor 3)
        var luisEmp = new Employee {
            Nombres = "Luis",
            ApellidoPaterno = "Transporte",
            ApellidoMaterno = "Tres",
            Email = "luis@chavin.com",
            Password = "trans123",
            Dni = "55555555",
            Position = "Personal de Campo",
            BaseSalary = 1500,
            HasPrimary = true,
            HasSecondary = true
        };
        DbHelper.ResolveRelationsAsync(db, luisEmp).GetAwaiter().GetResult();
        db.Employees.Add(luisEmp);
        
        db.SaveChanges();

        // Ensure users for drivers are active and have 'Transportista' role
        var driverDnis = new[] { "33333333", "44444444", "55555555" };
        var driverUsers = db.Users.Where(u => driverDnis.Contains(u.Dni)).ToList();
        foreach (var du in driverUsers)
        {
            du.IsActive = true;
            du.Rol = "Transportista";
        }
        db.SaveChanges();

        // Seed demo payslips for them
        db.EmployeePayslips.Add(new EmployeePayslip {
            EmployeeId = rebecaEmp.Id,
            PayslipId = generalPayslip.Id,
            AmountPaid = 3000 - (3000 * 0.13m),
            Status = "Pendiente"
        });
        db.EmployeePayslips.Add(new EmployeePayslip {
            EmployeeId = flavioEmp.Id,
            PayslipId = generalPayslip.Id,
            AmountPaid = 3000 - (3000 * 0.13m),
            Status = "Pendiente"
        });
        db.EmployeePayslips.Add(new EmployeePayslip {
            EmployeeId = carlosEmp.Id,
            PayslipId = generalPayslip.Id,
            AmountPaid = 1500 - (1500 * 0.13m),
            Status = "Pendiente"
        });
        db.EmployeePayslips.Add(new EmployeePayslip {
            EmployeeId = anaEmp.Id,
            PayslipId = generalPayslip.Id,
            AmountPaid = 1500 - (1500 * 0.13m),
            Status = "Pendiente"
        });
        db.EmployeePayslips.Add(new EmployeePayslip {
            EmployeeId = luisEmp.Id,
            PayslipId = generalPayslip.Id,
            AmountPaid = 1500 - (1500 * 0.13m),
            Status = "Pendiente"
        });


        db.SaveChanges();
    }
}

app.UseStaticFiles(); // For serving uploaded images

// Configure QuestPDF license (Community is free for small companies)
QuestPDF.Settings.License = LicenseType.Community;

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
}

app.UseStaticFiles();
app.UseRouting();
app.UseCors("AllowAll");
app.UseAuthorization();
app.MapControllers();
app.MapHub<DNIContractApi.Hubs.TrackingHub>("/trackingHub");
app.Run("http://localhost:5051");
