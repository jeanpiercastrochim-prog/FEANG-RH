using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DNIContractApi.Migrations
{
    /// <inheritdoc />
    public partial class AddTransportModels : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "HasBiometrics",
                table: "Employees",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "ProfileImagePath",
                table: "Employees",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "TransViajes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ConductorDni = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UnidadPlaca = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Origen = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Destino = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Estado = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FechaInicio = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaFin = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TransViajes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TransAlertas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ViajeId = table.Column<int>(type: "int", nullable: false),
                    Tipo = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Titulo = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Detalle = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Timestamp = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TransAlertas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TransAlertas_TransViajes_ViajeId",
                        column: x => x.ViajeId,
                        principalTable: "TransViajes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TransUbicaciones",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ViajeId = table.Column<int>(type: "int", nullable: false),
                    Latitud = table.Column<double>(type: "float", nullable: false),
                    Longitud = table.Column<double>(type: "float", nullable: false),
                    Velocidad = table.Column<double>(type: "float", nullable: false),
                    Bateria = table.Column<double>(type: "float", nullable: false),
                    Timestamp = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TransUbicaciones", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TransUbicaciones_TransViajes_ViajeId",
                        column: x => x.ViajeId,
                        principalTable: "TransViajes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TransAlertas_ViajeId",
                table: "TransAlertas",
                column: "ViajeId");

            migrationBuilder.CreateIndex(
                name: "IX_TransUbicaciones_ViajeId",
                table: "TransUbicaciones",
                column: "ViajeId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TransAlertas");

            migrationBuilder.DropTable(
                name: "TransUbicaciones");

            migrationBuilder.DropTable(
                name: "TransViajes");

            migrationBuilder.DropColumn(
                name: "HasBiometrics",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "ProfileImagePath",
                table: "Employees");
        }
    }
}
