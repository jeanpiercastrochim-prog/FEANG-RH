using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DNIContractApi.Migrations
{
    /// <inheritdoc />
    public partial class AlmacenCamposTrazabilidad : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AreaSolicitante",
                table: "Almacen_Movimiento",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CargoSolicitante",
                table: "Almacen_Movimiento",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "DescripcionCarga",
                table: "Almacen_Movimiento",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "EquipoLinea",
                table: "Almacen_Movimiento",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<decimal>(
                name: "Peso",
                table: "Almacen_Movimiento",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Planta",
                table: "Almacen_Movimiento",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Turno",
                table: "Almacen_Movimiento",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "VehiculoAsignado",
                table: "Almacen_Movimiento",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AreaSolicitante",
                table: "Almacen_Movimiento");

            migrationBuilder.DropColumn(
                name: "CargoSolicitante",
                table: "Almacen_Movimiento");

            migrationBuilder.DropColumn(
                name: "DescripcionCarga",
                table: "Almacen_Movimiento");

            migrationBuilder.DropColumn(
                name: "EquipoLinea",
                table: "Almacen_Movimiento");

            migrationBuilder.DropColumn(
                name: "Peso",
                table: "Almacen_Movimiento");

            migrationBuilder.DropColumn(
                name: "Planta",
                table: "Almacen_Movimiento");

            migrationBuilder.DropColumn(
                name: "Turno",
                table: "Almacen_Movimiento");

            migrationBuilder.DropColumn(
                name: "VehiculoAsignado",
                table: "Almacen_Movimiento");
        }
    }
}
