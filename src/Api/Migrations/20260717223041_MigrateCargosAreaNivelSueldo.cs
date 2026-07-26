using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DNIContractApi.Migrations
{
    /// <inheritdoc />
    public partial class MigrateCargosAreaNivelSueldo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AppNotifications",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    EmployeeDni = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Message = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsRead = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppNotifications", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Definiciones",
                columns: table => new
                {
                    Codigo = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Nombre = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Activo = table.Column<bool>(type: "bit", nullable: false),
                    CreatedBy = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModifiedBy = table.Column<int>(type: "int", nullable: true),
                    ModifiedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Definiciones", x => x.Codigo);
                });

            migrationBuilder.CreateTable(
                name: "Payslips",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Periodo = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Payslips", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Ubigeo",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Departamento = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Provincia = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Distrito = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Ubigeo", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Dni = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Email = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PasswordHash = table.Column<byte[]>(type: "varbinary(max)", nullable: false),
                    PasswordSalt = table.Column<byte[]>(type: "varbinary(max)", nullable: false),
                    Rol = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    LastLogin = table.Column<DateTime>(type: "datetime2", nullable: true),
                    FailedAttempts = table.Column<int>(type: "int", nullable: false),
                    LockedUntil = table.Column<DateTime>(type: "datetime2", nullable: true),
                    RefreshTokenHash = table.Column<byte[]>(type: "varbinary(max)", nullable: true),
                    RefreshTokenExpiration = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedBy = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModifiedBy = table.Column<int>(type: "int", nullable: true),
                    ModifiedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "DefinicionDetalle",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DefinicionCodigo = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Codigo = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Nombre = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Orden = table.Column<int>(type: "int", nullable: false),
                    Activo = table.Column<bool>(type: "bit", nullable: false),
                    CreatedBy = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModifiedBy = table.Column<int>(type: "int", nullable: true),
                    ModifiedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DefinicionDetalle", x => x.Id);
                    table.UniqueConstraint("AK_DefinicionDetalle_DefinicionCodigo_Id", x => new { x.DefinicionCodigo, x.Id });
                    table.ForeignKey(
                        name: "FK_DefinicionDetalle_Definiciones_DefinicionCodigo",
                        column: x => x.DefinicionCodigo,
                        principalTable: "Definiciones",
                        principalColumn: "Codigo",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Cargos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nombre = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AreaDefinicionCodigo = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    AreaId = table.Column<int>(type: "int", nullable: true),
                    NivelDefinicionCodigo = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    NivelId = table.Column<int>(type: "int", nullable: true),
                    SueldoBase = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Estado = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedBy = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModifiedBy = table.Column<int>(type: "int", nullable: true),
                    ModifiedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Cargos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Cargos_DefinicionDetalle_AreaDefinicionCodigo_AreaId",
                        columns: x => new { x.AreaDefinicionCodigo, x.AreaId },
                        principalTable: "DefinicionDetalle",
                        principalColumns: new[] { "DefinicionCodigo", "Id" },
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Cargos_DefinicionDetalle_NivelDefinicionCodigo_NivelId",
                        columns: x => new { x.NivelDefinicionCodigo, x.NivelId },
                        principalTable: "DefinicionDetalle",
                        principalColumns: new[] { "DefinicionCodigo", "Id" },
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Contracts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FilePath = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CargoId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Contracts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Contracts_Cargos_CargoId",
                        column: x => x.CargoId,
                        principalTable: "Cargos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Employees",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: true),
                    Nombres = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ApellidoPaterno = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ApellidoMaterno = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Dni = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FechaNacimiento = table.Column<DateTime>(type: "datetime2", nullable: false),
                    GeneroId = table.Column<int>(type: "int", nullable: false),
                    GeneroDefinicionCodigo = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    EstadoCivilId = table.Column<int>(type: "int", nullable: false),
                    EstadoCivilDefinicionCodigo = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Direccion = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UbigeoId = table.Column<int>(type: "int", nullable: false),
                    Telefono = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CorreoPersonal = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CorreoCorporativo = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CargoId = table.Column<int>(type: "int", nullable: false),
                    BaseSalary = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    EstadoEmpleadoId = table.Column<int>(type: "int", nullable: false),
                    EstadoEmpleadoDefinicionCodigo = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    FechaIngreso = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaCese = table.Column<DateTime>(type: "datetime2", nullable: true),
                    TipoContratoId = table.Column<int>(type: "int", nullable: false),
                    TipoContratoDefinicionCodigo = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    BancoId = table.Column<int>(type: "int", nullable: true),
                    BancoDefinicionCodigo = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    TipoCuentaBancariaId = table.Column<int>(type: "int", nullable: true),
                    TipoCuentaBancariaDefinicionCodigo = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    NumeroCuenta = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CCI = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AFPId = table.Column<int>(type: "int", nullable: true),
                    AFPDefinicionCodigo = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    CodigoAFP = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SignatureImagePath = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ContactoEmergencia = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Parentesco = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TelefonoEmergencia = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedBy = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModifiedBy = table.Column<int>(type: "int", nullable: true),
                    ModifiedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Employees", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Employees_Cargos_CargoId",
                        column: x => x.CargoId,
                        principalTable: "Cargos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Employees_DefinicionDetalle_AFPDefinicionCodigo_AFPId",
                        columns: x => new { x.AFPDefinicionCodigo, x.AFPId },
                        principalTable: "DefinicionDetalle",
                        principalColumns: new[] { "DefinicionCodigo", "Id" },
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Employees_DefinicionDetalle_BancoDefinicionCodigo_BancoId",
                        columns: x => new { x.BancoDefinicionCodigo, x.BancoId },
                        principalTable: "DefinicionDetalle",
                        principalColumns: new[] { "DefinicionCodigo", "Id" },
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Employees_DefinicionDetalle_EstadoCivilDefinicionCodigo_EstadoCivilId",
                        columns: x => new { x.EstadoCivilDefinicionCodigo, x.EstadoCivilId },
                        principalTable: "DefinicionDetalle",
                        principalColumns: new[] { "DefinicionCodigo", "Id" },
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Employees_DefinicionDetalle_EstadoEmpleadoDefinicionCodigo_EstadoEmpleadoId",
                        columns: x => new { x.EstadoEmpleadoDefinicionCodigo, x.EstadoEmpleadoId },
                        principalTable: "DefinicionDetalle",
                        principalColumns: new[] { "DefinicionCodigo", "Id" },
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Employees_DefinicionDetalle_GeneroDefinicionCodigo_GeneroId",
                        columns: x => new { x.GeneroDefinicionCodigo, x.GeneroId },
                        principalTable: "DefinicionDetalle",
                        principalColumns: new[] { "DefinicionCodigo", "Id" },
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Employees_DefinicionDetalle_TipoContratoDefinicionCodigo_TipoContratoId",
                        columns: x => new { x.TipoContratoDefinicionCodigo, x.TipoContratoId },
                        principalTable: "DefinicionDetalle",
                        principalColumns: new[] { "DefinicionCodigo", "Id" },
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Employees_DefinicionDetalle_TipoCuentaBancariaDefinicionCodigo_TipoCuentaBancariaId",
                        columns: x => new { x.TipoCuentaBancariaDefinicionCodigo, x.TipoCuentaBancariaId },
                        principalTable: "DefinicionDetalle",
                        principalColumns: new[] { "DefinicionCodigo", "Id" },
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Employees_Ubigeo_UbigeoId",
                        column: x => x.UbigeoId,
                        principalTable: "Ubigeo",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Employees_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "DniPhotos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    EmployeeId = table.Column<int>(type: "int", nullable: false),
                    FrontImagePath = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    BackImagePath = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DniPhotos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DniPhotos_Employees_EmployeeId",
                        column: x => x.EmployeeId,
                        principalTable: "Employees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "EmployeeContracts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EmployeeId = table.Column<int>(type: "int", nullable: false),
                    ContractId = table.Column<int>(type: "int", nullable: false),
                    Estado = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SignedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EmployeeContracts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EmployeeContracts_Contracts_ContractId",
                        column: x => x.ContractId,
                        principalTable: "Contracts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_EmployeeContracts_Employees_EmployeeId",
                        column: x => x.EmployeeId,
                        principalTable: "Employees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "EmployeeEducation",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    EmployeeId = table.Column<int>(type: "int", nullable: false),
                    NivelEducacionId = table.Column<int>(type: "int", nullable: false),
                    NivelEducacionDefinicionCodigo = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Institucion = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Carrera = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    FechaInicio = table.Column<DateTime>(type: "datetime2", nullable: true),
                    FechaFin = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Estado = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedBy = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModifiedBy = table.Column<int>(type: "int", nullable: true),
                    ModifiedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EmployeeEducation", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EmployeeEducation_DefinicionDetalle_NivelEducacionDefinicionCodigo_NivelEducacionId",
                        columns: x => new { x.NivelEducacionDefinicionCodigo, x.NivelEducacionId },
                        principalTable: "DefinicionDetalle",
                        principalColumns: new[] { "DefinicionCodigo", "Id" },
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_EmployeeEducation_Employees_EmployeeId",
                        column: x => x.EmployeeId,
                        principalTable: "Employees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "EmployeePayslips",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    EmployeeId = table.Column<int>(type: "int", nullable: false),
                    PayslipId = table.Column<int>(type: "int", nullable: false),
                    SueldoBase = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    HorasExtras = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Bonificaciones = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Comisiones = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    AFP = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    ONP = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Essalud = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    QuintaCategoria = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    OtrosDescuentos = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    NetoPagar = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Estado = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    GeneratedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EmployeePayslips", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EmployeePayslips_Employees_EmployeeId",
                        column: x => x.EmployeeId,
                        principalTable: "Employees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_EmployeePayslips_Payslips_PayslipId",
                        column: x => x.PayslipId,
                        principalTable: "Payslips",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Cargos_AreaDefinicionCodigo_AreaId",
                table: "Cargos",
                columns: new[] { "AreaDefinicionCodigo", "AreaId" });

            migrationBuilder.CreateIndex(
                name: "IX_Cargos_NivelDefinicionCodigo_NivelId",
                table: "Cargos",
                columns: new[] { "NivelDefinicionCodigo", "NivelId" });

            migrationBuilder.CreateIndex(
                name: "IX_Contracts_CargoId",
                table: "Contracts",
                column: "CargoId");

            migrationBuilder.CreateIndex(
                name: "IX_DefinicionDetalle_DefinicionCodigo_Id",
                table: "DefinicionDetalle",
                columns: new[] { "DefinicionCodigo", "Id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DniPhotos_EmployeeId",
                table: "DniPhotos",
                column: "EmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeContracts_ContractId",
                table: "EmployeeContracts",
                column: "ContractId");

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeContracts_EmployeeId",
                table: "EmployeeContracts",
                column: "EmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeEducation_EmployeeId",
                table: "EmployeeEducation",
                column: "EmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeEducation_NivelEducacionDefinicionCodigo_NivelEducacionId",
                table: "EmployeeEducation",
                columns: new[] { "NivelEducacionDefinicionCodigo", "NivelEducacionId" });

            migrationBuilder.CreateIndex(
                name: "IX_EmployeePayslips_EmployeeId",
                table: "EmployeePayslips",
                column: "EmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_EmployeePayslips_PayslipId",
                table: "EmployeePayslips",
                column: "PayslipId");

            migrationBuilder.CreateIndex(
                name: "IX_Employees_AFPDefinicionCodigo_AFPId",
                table: "Employees",
                columns: new[] { "AFPDefinicionCodigo", "AFPId" });

            migrationBuilder.CreateIndex(
                name: "IX_Employees_BancoDefinicionCodigo_BancoId",
                table: "Employees",
                columns: new[] { "BancoDefinicionCodigo", "BancoId" });

            migrationBuilder.CreateIndex(
                name: "IX_Employees_CargoId",
                table: "Employees",
                column: "CargoId");

            migrationBuilder.CreateIndex(
                name: "IX_Employees_EstadoCivilDefinicionCodigo_EstadoCivilId",
                table: "Employees",
                columns: new[] { "EstadoCivilDefinicionCodigo", "EstadoCivilId" });

            migrationBuilder.CreateIndex(
                name: "IX_Employees_EstadoEmpleadoDefinicionCodigo_EstadoEmpleadoId",
                table: "Employees",
                columns: new[] { "EstadoEmpleadoDefinicionCodigo", "EstadoEmpleadoId" });

            migrationBuilder.CreateIndex(
                name: "IX_Employees_GeneroDefinicionCodigo_GeneroId",
                table: "Employees",
                columns: new[] { "GeneroDefinicionCodigo", "GeneroId" });

            migrationBuilder.CreateIndex(
                name: "IX_Employees_TipoContratoDefinicionCodigo_TipoContratoId",
                table: "Employees",
                columns: new[] { "TipoContratoDefinicionCodigo", "TipoContratoId" });

            migrationBuilder.CreateIndex(
                name: "IX_Employees_TipoCuentaBancariaDefinicionCodigo_TipoCuentaBancariaId",
                table: "Employees",
                columns: new[] { "TipoCuentaBancariaDefinicionCodigo", "TipoCuentaBancariaId" });

            migrationBuilder.CreateIndex(
                name: "IX_Employees_UbigeoId",
                table: "Employees",
                column: "UbigeoId");

            migrationBuilder.CreateIndex(
                name: "IX_Employees_UserId",
                table: "Employees",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AppNotifications");

            migrationBuilder.DropTable(
                name: "DniPhotos");

            migrationBuilder.DropTable(
                name: "EmployeeContracts");

            migrationBuilder.DropTable(
                name: "EmployeeEducation");

            migrationBuilder.DropTable(
                name: "EmployeePayslips");

            migrationBuilder.DropTable(
                name: "Contracts");

            migrationBuilder.DropTable(
                name: "Employees");

            migrationBuilder.DropTable(
                name: "Payslips");

            migrationBuilder.DropTable(
                name: "Cargos");

            migrationBuilder.DropTable(
                name: "Ubigeo");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropTable(
                name: "DefinicionDetalle");

            migrationBuilder.DropTable(
                name: "Definiciones");
        }
    }
}
