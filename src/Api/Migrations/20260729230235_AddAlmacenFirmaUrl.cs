using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DNIContractApi.Migrations
{
    /// <inheritdoc />
    public partial class AddAlmacenFirmaUrl : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ModifiedAt",
                table: "Employees");

            migrationBuilder.AddColumn<string>(
                name: "SignatureMetadata",
                table: "Employees",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "BiometricValidation",
                table: "EmployeeContracts",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "RejectionReason",
                table: "EmployeeContracts",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SignatureMetadata",
                table: "EmployeeContracts",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "MotivoObservacion",
                table: "Almacen_Movimiento",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(500)",
                oldMaxLength: 500);

            migrationBuilder.AddColumn<string>(
                name: "FirmaUrl",
                table: "Almacen_Movimiento",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SignatureMetadata",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "BiometricValidation",
                table: "EmployeeContracts");

            migrationBuilder.DropColumn(
                name: "RejectionReason",
                table: "EmployeeContracts");

            migrationBuilder.DropColumn(
                name: "SignatureMetadata",
                table: "EmployeeContracts");

            migrationBuilder.DropColumn(
                name: "FirmaUrl",
                table: "Almacen_Movimiento");

            migrationBuilder.AddColumn<DateTime>(
                name: "ModifiedAt",
                table: "Employees",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "MotivoObservacion",
                table: "Almacen_Movimiento",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(200)",
                oldMaxLength: 200);
        }
    }
}
