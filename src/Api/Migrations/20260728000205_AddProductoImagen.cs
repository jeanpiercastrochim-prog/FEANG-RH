using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DNIContractApi.Migrations
{
    /// <inheritdoc />
    public partial class AddProductoImagen : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ImagenUrl",
                table: "Almacen_Producto",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ImagenUrl",
                table: "Almacen_Producto");
        }
    }
}
