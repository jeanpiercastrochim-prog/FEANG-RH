using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DNIContractApi.Migrations
{
    /// <inheritdoc />
    public partial class InitialAlmacen : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "FotoBase64",
                table: "TransAlertas",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Type",
                table: "EmployeeRequests",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "EmployeeRequests",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "Observations",
                table: "EmployeeRequests",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "FormData",
                table: "EmployeeRequests",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.CreateTable(
                name: "Almacen_Producto",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Codigo = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Nombre = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    UnidadMedida = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    StockMinimo = table.Column<int>(type: "int", nullable: false),
                    ControlaVencimiento = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Almacen_Producto", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Almacen_Ubicacion",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Zona = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Rack = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Nivel = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Posicion = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    CapacidadMaxima = table.Column<int>(type: "int", nullable: false),
                    Estado = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Almacen_Ubicacion", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Almacen_Inventario",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProductoId = table.Column<int>(type: "int", nullable: false),
                    UbicacionId = table.Column<int>(type: "int", nullable: false),
                    Lote = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    FechaVencimiento = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CantidadDisponible = table.Column<int>(type: "int", nullable: false),
                    LastUpdated = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Almacen_Inventario", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Almacen_Inventario_Almacen_Producto_ProductoId",
                        column: x => x.ProductoId,
                        principalTable: "Almacen_Producto",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Almacen_Inventario_Almacen_Ubicacion_UbicacionId",
                        column: x => x.UbicacionId,
                        principalTable: "Almacen_Ubicacion",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Almacen_Movimiento",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TipoMovimiento = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    InventarioId = table.Column<int>(type: "int", nullable: false),
                    Cantidad = table.Column<int>(type: "int", nullable: false),
                    DocumentoReferencia = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Responsable = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    Solicitante = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    MotivoObservacion = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    FechaMovimiento = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Almacen_Movimiento", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Almacen_Movimiento_Almacen_Inventario_InventarioId",
                        column: x => x.InventarioId,
                        principalTable: "Almacen_Inventario",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Almacen_Inventario_ProductoId",
                table: "Almacen_Inventario",
                column: "ProductoId");

            migrationBuilder.CreateIndex(
                name: "IX_Almacen_Inventario_UbicacionId",
                table: "Almacen_Inventario",
                column: "UbicacionId");

            migrationBuilder.CreateIndex(
                name: "IX_Almacen_Movimiento_InventarioId",
                table: "Almacen_Movimiento",
                column: "InventarioId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Almacen_Movimiento");

            migrationBuilder.DropTable(
                name: "Almacen_Inventario");

            migrationBuilder.DropTable(
                name: "Almacen_Producto");

            migrationBuilder.DropTable(
                name: "Almacen_Ubicacion");

            migrationBuilder.DropColumn(
                name: "FotoBase64",
                table: "TransAlertas");

            migrationBuilder.AlterColumn<string>(
                name: "Type",
                table: "EmployeeRequests",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "EmployeeRequests",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Observations",
                table: "EmployeeRequests",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "FormData",
                table: "EmployeeRequests",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);
        }
    }
}
