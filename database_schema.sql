IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
GO

CREATE TABLE [AppNotifications] (
    [Id] int NOT NULL IDENTITY,
    [EmployeeDni] nvarchar(max) NOT NULL,
    [Title] nvarchar(max) NOT NULL,
    [Message] nvarchar(max) NOT NULL,
    [IsRead] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_AppNotifications] PRIMARY KEY ([Id])
);
GO

CREATE TABLE [Definiciones] (
    [Codigo] nvarchar(450) NOT NULL,
    [Nombre] nvarchar(max) NOT NULL,
    [Descripcion] nvarchar(max) NULL,
    [Activo] bit NOT NULL,
    [CreatedBy] int NULL,
    [CreatedAt] datetime2 NOT NULL,
    [ModifiedBy] int NULL,
    [ModifiedAt] datetime2 NULL,
    CONSTRAINT [PK_Definiciones] PRIMARY KEY ([Codigo])
);
GO

CREATE TABLE [Payslips] (
    [Id] int NOT NULL IDENTITY,
    [Periodo] datetime2 NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_Payslips] PRIMARY KEY ([Id])
);
GO

CREATE TABLE [Ubigeo] (
    [Id] int NOT NULL IDENTITY,
    [Departamento] nvarchar(max) NOT NULL,
    [Provincia] nvarchar(max) NOT NULL,
    [Distrito] nvarchar(max) NOT NULL,
    CONSTRAINT [PK_Ubigeo] PRIMARY KEY ([Id])
);
GO

CREATE TABLE [Users] (
    [Id] int NOT NULL IDENTITY,
    [Dni] nvarchar(max) NOT NULL,
    [Email] nvarchar(max) NOT NULL,
    [PasswordHash] varbinary(max) NOT NULL,
    [PasswordSalt] varbinary(max) NOT NULL,
    [Rol] nvarchar(max) NOT NULL,
    [IsActive] bit NOT NULL,
    [LastLogin] datetime2 NULL,
    [FailedAttempts] int NOT NULL,
    [LockedUntil] datetime2 NULL,
    [RefreshTokenHash] varbinary(max) NULL,
    [RefreshTokenExpiration] datetime2 NULL,
    [CreatedBy] int NULL,
    [CreatedAt] datetime2 NOT NULL,
    [ModifiedBy] int NULL,
    [ModifiedAt] datetime2 NULL,
    CONSTRAINT [PK_Users] PRIMARY KEY ([Id])
);
GO

CREATE TABLE [DefinicionDetalle] (
    [Id] int NOT NULL IDENTITY,
    [DefinicionCodigo] nvarchar(450) NOT NULL,
    [Codigo] nvarchar(max) NOT NULL,
    [Nombre] nvarchar(max) NOT NULL,
    [Orden] int NOT NULL,
    [Activo] bit NOT NULL,
    [CreatedBy] int NULL,
    [CreatedAt] datetime2 NOT NULL,
    [ModifiedBy] int NULL,
    [ModifiedAt] datetime2 NULL,
    CONSTRAINT [PK_DefinicionDetalle] PRIMARY KEY ([Id]),
    CONSTRAINT [AK_DefinicionDetalle_DefinicionCodigo_Id] UNIQUE ([DefinicionCodigo], [Id]),
    CONSTRAINT [FK_DefinicionDetalle_Definiciones_DefinicionCodigo] FOREIGN KEY ([DefinicionCodigo]) REFERENCES [Definiciones] ([Codigo]) ON DELETE CASCADE
);
GO

CREATE TABLE [Cargos] (
    [Id] int NOT NULL IDENTITY,
    [Nombre] nvarchar(max) NOT NULL,
    [Descripcion] nvarchar(max) NULL,
    [AreaDefinicionCodigo] nvarchar(450) NOT NULL,
    [AreaId] int NULL,
    [NivelDefinicionCodigo] nvarchar(450) NOT NULL,
    [NivelId] int NULL,
    [SueldoBase] decimal(18,2) NOT NULL,
    [Estado] nvarchar(max) NOT NULL,
    [CreatedBy] int NULL,
    [CreatedAt] datetime2 NOT NULL,
    [ModifiedBy] int NULL,
    [ModifiedAt] datetime2 NULL,
    CONSTRAINT [PK_Cargos] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Cargos_DefinicionDetalle_AreaDefinicionCodigo_AreaId] FOREIGN KEY ([AreaDefinicionCodigo], [AreaId]) REFERENCES [DefinicionDetalle] ([DefinicionCodigo], [Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Cargos_DefinicionDetalle_NivelDefinicionCodigo_NivelId] FOREIGN KEY ([NivelDefinicionCodigo], [NivelId]) REFERENCES [DefinicionDetalle] ([DefinicionCodigo], [Id]) ON DELETE NO ACTION
);
GO

CREATE TABLE [Contracts] (
    [Id] int NOT NULL IDENTITY,
    [Name] nvarchar(max) NOT NULL,
    [FilePath] nvarchar(max) NULL,
    [CreatedAt] datetime2 NOT NULL,
    [CargoId] int NULL,
    CONSTRAINT [PK_Contracts] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Contracts_Cargos_CargoId] FOREIGN KEY ([CargoId]) REFERENCES [Cargos] ([Id]) ON DELETE NO ACTION
);
GO

CREATE TABLE [Employees] (
    [Id] int NOT NULL IDENTITY,
    [UserId] int NULL,
    [Nombres] nvarchar(max) NOT NULL,
    [ApellidoPaterno] nvarchar(max) NOT NULL,
    [ApellidoMaterno] nvarchar(max) NOT NULL,
    [Dni] nvarchar(max) NOT NULL,
    [FechaNacimiento] datetime2 NOT NULL,
    [GeneroId] int NOT NULL,
    [GeneroDefinicionCodigo] nvarchar(450) NOT NULL,
    [EstadoCivilId] int NOT NULL,
    [EstadoCivilDefinicionCodigo] nvarchar(450) NOT NULL,
    [Direccion] nvarchar(max) NOT NULL,
    [UbigeoId] int NOT NULL,
    [Telefono] nvarchar(max) NULL,
    [CorreoPersonal] nvarchar(max) NULL,
    [CorreoCorporativo] nvarchar(max) NULL,
    [CargoId] int NOT NULL,
    [BaseSalary] decimal(18,2) NOT NULL,
    [EstadoEmpleadoId] int NOT NULL,
    [EstadoEmpleadoDefinicionCodigo] nvarchar(450) NOT NULL,
    [FechaIngreso] datetime2 NOT NULL,
    [FechaCese] datetime2 NULL,
    [TipoContratoId] int NOT NULL,
    [TipoContratoDefinicionCodigo] nvarchar(450) NOT NULL,
    [BancoId] int NULL,
    [BancoDefinicionCodigo] nvarchar(450) NOT NULL,
    [TipoCuentaBancariaId] int NULL,
    [TipoCuentaBancariaDefinicionCodigo] nvarchar(450) NOT NULL,
    [NumeroCuenta] nvarchar(max) NULL,
    [CCI] nvarchar(max) NULL,
    [AFPId] int NULL,
    [AFPDefinicionCodigo] nvarchar(450) NOT NULL,
    [CodigoAFP] nvarchar(max) NULL,
    [SignatureImagePath] nvarchar(max) NULL,
    [ContactoEmergencia] nvarchar(max) NULL,
    [Parentesco] nvarchar(max) NULL,
    [TelefonoEmergencia] nvarchar(max) NULL,
    [CreatedBy] int NULL,
    [CreatedAt] datetime2 NOT NULL,
    [ModifiedBy] int NULL,
    [ModifiedAt] datetime2 NULL,
    CONSTRAINT [PK_Employees] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Employees_Cargos_CargoId] FOREIGN KEY ([CargoId]) REFERENCES [Cargos] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Employees_DefinicionDetalle_AFPDefinicionCodigo_AFPId] FOREIGN KEY ([AFPDefinicionCodigo], [AFPId]) REFERENCES [DefinicionDetalle] ([DefinicionCodigo], [Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Employees_DefinicionDetalle_BancoDefinicionCodigo_BancoId] FOREIGN KEY ([BancoDefinicionCodigo], [BancoId]) REFERENCES [DefinicionDetalle] ([DefinicionCodigo], [Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Employees_DefinicionDetalle_EstadoCivilDefinicionCodigo_EstadoCivilId] FOREIGN KEY ([EstadoCivilDefinicionCodigo], [EstadoCivilId]) REFERENCES [DefinicionDetalle] ([DefinicionCodigo], [Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Employees_DefinicionDetalle_EstadoEmpleadoDefinicionCodigo_EstadoEmpleadoId] FOREIGN KEY ([EstadoEmpleadoDefinicionCodigo], [EstadoEmpleadoId]) REFERENCES [DefinicionDetalle] ([DefinicionCodigo], [Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Employees_DefinicionDetalle_GeneroDefinicionCodigo_GeneroId] FOREIGN KEY ([GeneroDefinicionCodigo], [GeneroId]) REFERENCES [DefinicionDetalle] ([DefinicionCodigo], [Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Employees_DefinicionDetalle_TipoContratoDefinicionCodigo_TipoContratoId] FOREIGN KEY ([TipoContratoDefinicionCodigo], [TipoContratoId]) REFERENCES [DefinicionDetalle] ([DefinicionCodigo], [Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Employees_DefinicionDetalle_TipoCuentaBancariaDefinicionCodigo_TipoCuentaBancariaId] FOREIGN KEY ([TipoCuentaBancariaDefinicionCodigo], [TipoCuentaBancariaId]) REFERENCES [DefinicionDetalle] ([DefinicionCodigo], [Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Employees_Ubigeo_UbigeoId] FOREIGN KEY ([UbigeoId]) REFERENCES [Ubigeo] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Employees_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE SET NULL
);
GO

CREATE TABLE [DniPhotos] (
    [Id] int NOT NULL IDENTITY,
    [EmployeeId] int NOT NULL,
    [FrontImagePath] nvarchar(max) NULL,
    [BackImagePath] nvarchar(max) NULL,
    CONSTRAINT [PK_DniPhotos] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_DniPhotos_Employees_EmployeeId] FOREIGN KEY ([EmployeeId]) REFERENCES [Employees] ([Id]) ON DELETE CASCADE
);
GO

CREATE TABLE [EmployeeContracts] (
    [Id] uniqueidentifier NOT NULL,
    [EmployeeId] int NOT NULL,
    [ContractId] int NOT NULL,
    [Estado] nvarchar(max) NOT NULL,
    [SignedAt] datetime2 NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_EmployeeContracts] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_EmployeeContracts_Contracts_ContractId] FOREIGN KEY ([ContractId]) REFERENCES [Contracts] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_EmployeeContracts_Employees_EmployeeId] FOREIGN KEY ([EmployeeId]) REFERENCES [Employees] ([Id]) ON DELETE CASCADE
);
GO

CREATE TABLE [EmployeeEducation] (
    [Id] int NOT NULL IDENTITY,
    [EmployeeId] int NOT NULL,
    [NivelEducacionId] int NOT NULL,
    [NivelEducacionDefinicionCodigo] nvarchar(450) NOT NULL,
    [Institucion] nvarchar(max) NOT NULL,
    [Carrera] nvarchar(max) NULL,
    [FechaInicio] datetime2 NULL,
    [FechaFin] datetime2 NULL,
    [Estado] nvarchar(max) NOT NULL,
    [CreatedBy] int NULL,
    [CreatedAt] datetime2 NOT NULL,
    [ModifiedBy] int NULL,
    [ModifiedAt] datetime2 NULL,
    CONSTRAINT [PK_EmployeeEducation] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_EmployeeEducation_DefinicionDetalle_NivelEducacionDefinicionCodigo_NivelEducacionId] FOREIGN KEY ([NivelEducacionDefinicionCodigo], [NivelEducacionId]) REFERENCES [DefinicionDetalle] ([DefinicionCodigo], [Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_EmployeeEducation_Employees_EmployeeId] FOREIGN KEY ([EmployeeId]) REFERENCES [Employees] ([Id]) ON DELETE CASCADE
);
GO

CREATE TABLE [EmployeePayslips] (
    [Id] int NOT NULL IDENTITY,
    [EmployeeId] int NOT NULL,
    [PayslipId] int NOT NULL,
    [SueldoBase] decimal(18,2) NOT NULL,
    [HorasExtras] decimal(18,2) NOT NULL,
    [Bonificaciones] decimal(18,2) NOT NULL,
    [Comisiones] decimal(18,2) NOT NULL,
    [AFP] decimal(18,2) NOT NULL,
    [ONP] decimal(18,2) NOT NULL,
    [Essalud] decimal(18,2) NOT NULL,
    [QuintaCategoria] decimal(18,2) NOT NULL,
    [OtrosDescuentos] decimal(18,2) NOT NULL,
    [NetoPagar] decimal(18,2) NOT NULL,
    [Estado] nvarchar(max) NOT NULL,
    [GeneratedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_EmployeePayslips] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_EmployeePayslips_Employees_EmployeeId] FOREIGN KEY ([EmployeeId]) REFERENCES [Employees] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_EmployeePayslips_Payslips_PayslipId] FOREIGN KEY ([PayslipId]) REFERENCES [Payslips] ([Id]) ON DELETE CASCADE
);
GO

CREATE INDEX [IX_Cargos_AreaDefinicionCodigo_AreaId] ON [Cargos] ([AreaDefinicionCodigo], [AreaId]);
GO

CREATE INDEX [IX_Cargos_NivelDefinicionCodigo_NivelId] ON [Cargos] ([NivelDefinicionCodigo], [NivelId]);
GO

CREATE INDEX [IX_Contracts_CargoId] ON [Contracts] ([CargoId]);
GO

CREATE UNIQUE INDEX [IX_DefinicionDetalle_DefinicionCodigo_Id] ON [DefinicionDetalle] ([DefinicionCodigo], [Id]);
GO

CREATE INDEX [IX_DniPhotos_EmployeeId] ON [DniPhotos] ([EmployeeId]);
GO

CREATE INDEX [IX_EmployeeContracts_ContractId] ON [EmployeeContracts] ([ContractId]);
GO

CREATE INDEX [IX_EmployeeContracts_EmployeeId] ON [EmployeeContracts] ([EmployeeId]);
GO

CREATE INDEX [IX_EmployeeEducation_EmployeeId] ON [EmployeeEducation] ([EmployeeId]);
GO

CREATE INDEX [IX_EmployeeEducation_NivelEducacionDefinicionCodigo_NivelEducacionId] ON [EmployeeEducation] ([NivelEducacionDefinicionCodigo], [NivelEducacionId]);
GO

CREATE INDEX [IX_EmployeePayslips_EmployeeId] ON [EmployeePayslips] ([EmployeeId]);
GO

CREATE INDEX [IX_EmployeePayslips_PayslipId] ON [EmployeePayslips] ([PayslipId]);
GO

CREATE INDEX [IX_Employees_AFPDefinicionCodigo_AFPId] ON [Employees] ([AFPDefinicionCodigo], [AFPId]);
GO

CREATE INDEX [IX_Employees_BancoDefinicionCodigo_BancoId] ON [Employees] ([BancoDefinicionCodigo], [BancoId]);
GO

CREATE INDEX [IX_Employees_CargoId] ON [Employees] ([CargoId]);
GO

CREATE INDEX [IX_Employees_EstadoCivilDefinicionCodigo_EstadoCivilId] ON [Employees] ([EstadoCivilDefinicionCodigo], [EstadoCivilId]);
GO

CREATE INDEX [IX_Employees_EstadoEmpleadoDefinicionCodigo_EstadoEmpleadoId] ON [Employees] ([EstadoEmpleadoDefinicionCodigo], [EstadoEmpleadoId]);
GO

CREATE INDEX [IX_Employees_GeneroDefinicionCodigo_GeneroId] ON [Employees] ([GeneroDefinicionCodigo], [GeneroId]);
GO

CREATE INDEX [IX_Employees_TipoContratoDefinicionCodigo_TipoContratoId] ON [Employees] ([TipoContratoDefinicionCodigo], [TipoContratoId]);
GO

CREATE INDEX [IX_Employees_TipoCuentaBancariaDefinicionCodigo_TipoCuentaBancariaId] ON [Employees] ([TipoCuentaBancariaDefinicionCodigo], [TipoCuentaBancariaId]);
GO

CREATE INDEX [IX_Employees_UbigeoId] ON [Employees] ([UbigeoId]);
GO

CREATE INDEX [IX_Employees_UserId] ON [Employees] ([UserId]);
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260717223041_MigrateCargosAreaNivelSueldo', N'8.0.0');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

CREATE TABLE [EmployeeRequests] (
    [Id] int NOT NULL IDENTITY,
    [EmployeeId] int NOT NULL,
    [Type] nvarchar(max) NOT NULL,
    [FormData] nvarchar(max) NOT NULL,
    [Status] nvarchar(max) NOT NULL,
    [Observations] nvarchar(max) NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    CONSTRAINT [PK_EmployeeRequests] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_EmployeeRequests_Employees_EmployeeId] FOREIGN KEY ([EmployeeId]) REFERENCES [Employees] ([Id]) ON DELETE CASCADE
);
GO

CREATE INDEX [IX_EmployeeRequests_EmployeeId] ON [EmployeeRequests] ([EmployeeId]);
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260717231139_AddEmployeeRequests', N'8.0.0');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

ALTER TABLE [Employees] ADD [HasBiometrics] bit NOT NULL DEFAULT CAST(0 AS bit);
GO

ALTER TABLE [Employees] ADD [ProfileImagePath] nvarchar(max) NULL;
GO

CREATE TABLE [TransViajes] (
    [Id] int NOT NULL IDENTITY,
    [ConductorDni] nvarchar(max) NOT NULL,
    [UnidadPlaca] nvarchar(max) NOT NULL,
    [Origen] nvarchar(max) NOT NULL,
    [Destino] nvarchar(max) NOT NULL,
    [Estado] nvarchar(max) NOT NULL,
    [FechaInicio] datetime2 NOT NULL,
    [FechaFin] datetime2 NULL,
    CONSTRAINT [PK_TransViajes] PRIMARY KEY ([Id])
);
GO

CREATE TABLE [TransAlertas] (
    [Id] int NOT NULL IDENTITY,
    [ViajeId] int NOT NULL,
    [Tipo] nvarchar(max) NOT NULL,
    [Titulo] nvarchar(max) NOT NULL,
    [Detalle] nvarchar(max) NOT NULL,
    [Timestamp] datetime2 NOT NULL,
    [IsActive] bit NOT NULL,
    CONSTRAINT [PK_TransAlertas] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_TransAlertas_TransViajes_ViajeId] FOREIGN KEY ([ViajeId]) REFERENCES [TransViajes] ([Id]) ON DELETE CASCADE
);
GO

CREATE TABLE [TransUbicaciones] (
    [Id] int NOT NULL IDENTITY,
    [ViajeId] int NOT NULL,
    [Latitud] float NOT NULL,
    [Longitud] float NOT NULL,
    [Velocidad] float NOT NULL,
    [Bateria] float NOT NULL,
    [Timestamp] datetime2 NOT NULL,
    CONSTRAINT [PK_TransUbicaciones] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_TransUbicaciones_TransViajes_ViajeId] FOREIGN KEY ([ViajeId]) REFERENCES [TransViajes] ([Id]) ON DELETE CASCADE
);
GO

CREATE INDEX [IX_TransAlertas_ViajeId] ON [TransAlertas] ([ViajeId]);
GO

CREATE INDEX [IX_TransUbicaciones_ViajeId] ON [TransUbicaciones] ([ViajeId]);
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260719214647_AddTransportModels', N'8.0.0');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

ALTER TABLE [TransAlertas] ADD [FotoBase64] nvarchar(max) NULL;
GO

DECLARE @var0 sysname;
SELECT @var0 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[EmployeeRequests]') AND [c].[name] = N'Type');
IF @var0 IS NOT NULL EXEC(N'ALTER TABLE [EmployeeRequests] DROP CONSTRAINT [' + @var0 + '];');
ALTER TABLE [EmployeeRequests] ALTER COLUMN [Type] nvarchar(max) NULL;
GO

DECLARE @var1 sysname;
SELECT @var1 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[EmployeeRequests]') AND [c].[name] = N'Status');
IF @var1 IS NOT NULL EXEC(N'ALTER TABLE [EmployeeRequests] DROP CONSTRAINT [' + @var1 + '];');
ALTER TABLE [EmployeeRequests] ALTER COLUMN [Status] nvarchar(max) NULL;
GO

DECLARE @var2 sysname;
SELECT @var2 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[EmployeeRequests]') AND [c].[name] = N'Observations');
IF @var2 IS NOT NULL EXEC(N'ALTER TABLE [EmployeeRequests] DROP CONSTRAINT [' + @var2 + '];');
ALTER TABLE [EmployeeRequests] ALTER COLUMN [Observations] nvarchar(max) NULL;
GO

DECLARE @var3 sysname;
SELECT @var3 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[EmployeeRequests]') AND [c].[name] = N'FormData');
IF @var3 IS NOT NULL EXEC(N'ALTER TABLE [EmployeeRequests] DROP CONSTRAINT [' + @var3 + '];');
ALTER TABLE [EmployeeRequests] ALTER COLUMN [FormData] nvarchar(max) NULL;
GO

CREATE TABLE [Almacen_Producto] (
    [Id] int NOT NULL IDENTITY,
    [Codigo] nvarchar(100) NOT NULL,
    [Nombre] nvarchar(255) NOT NULL,
    [UnidadMedida] nvarchar(50) NOT NULL,
    [StockMinimo] int NOT NULL,
    [ControlaVencimiento] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_Almacen_Producto] PRIMARY KEY ([Id])
);
GO

CREATE TABLE [Almacen_Ubicacion] (
    [Id] int NOT NULL IDENTITY,
    [Zona] nvarchar(50) NOT NULL,
    [Rack] nvarchar(50) NOT NULL,
    [Nivel] nvarchar(50) NOT NULL,
    [Posicion] nvarchar(50) NOT NULL,
    [CapacidadMaxima] int NOT NULL,
    [Estado] nvarchar(20) NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_Almacen_Ubicacion] PRIMARY KEY ([Id])
);
GO

CREATE TABLE [Almacen_Inventario] (
    [Id] int NOT NULL IDENTITY,
    [ProductoId] int NOT NULL,
    [UbicacionId] int NOT NULL,
    [Lote] nvarchar(50) NOT NULL,
    [FechaVencimiento] datetime2 NULL,
    [CantidadDisponible] int NOT NULL,
    [LastUpdated] datetime2 NOT NULL,
    CONSTRAINT [PK_Almacen_Inventario] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Almacen_Inventario_Almacen_Producto_ProductoId] FOREIGN KEY ([ProductoId]) REFERENCES [Almacen_Producto] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_Almacen_Inventario_Almacen_Ubicacion_UbicacionId] FOREIGN KEY ([UbicacionId]) REFERENCES [Almacen_Ubicacion] ([Id]) ON DELETE CASCADE
);
GO

CREATE TABLE [Almacen_Movimiento] (
    [Id] int NOT NULL IDENTITY,
    [TipoMovimiento] nvarchar(20) NOT NULL,
    [InventarioId] int NOT NULL,
    [Cantidad] int NOT NULL,
    [DocumentoReferencia] nvarchar(100) NOT NULL,
    [Responsable] nvarchar(255) NOT NULL,
    [Solicitante] nvarchar(255) NOT NULL,
    [MotivoObservacion] nvarchar(500) NOT NULL,
    [FechaMovimiento] datetime2 NOT NULL,
    CONSTRAINT [PK_Almacen_Movimiento] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Almacen_Movimiento_Almacen_Inventario_InventarioId] FOREIGN KEY ([InventarioId]) REFERENCES [Almacen_Inventario] ([Id]) ON DELETE CASCADE
);
GO

CREATE INDEX [IX_Almacen_Inventario_ProductoId] ON [Almacen_Inventario] ([ProductoId]);
GO

CREATE INDEX [IX_Almacen_Inventario_UbicacionId] ON [Almacen_Inventario] ([UbicacionId]);
GO

CREATE INDEX [IX_Almacen_Movimiento_InventarioId] ON [Almacen_Movimiento] ([InventarioId]);
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260724210949_InitialAlmacen', N'8.0.0');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

ALTER TABLE [Almacen_Movimiento] ADD [AreaSolicitante] nvarchar(100) NOT NULL DEFAULT N'';
GO

ALTER TABLE [Almacen_Movimiento] ADD [CargoSolicitante] nvarchar(100) NOT NULL DEFAULT N'';
GO

ALTER TABLE [Almacen_Movimiento] ADD [DescripcionCarga] nvarchar(1000) NOT NULL DEFAULT N'';
GO

ALTER TABLE [Almacen_Movimiento] ADD [EquipoLinea] nvarchar(100) NOT NULL DEFAULT N'';
GO

ALTER TABLE [Almacen_Movimiento] ADD [Peso] decimal(18,2) NULL;
GO

ALTER TABLE [Almacen_Movimiento] ADD [Planta] nvarchar(100) NOT NULL DEFAULT N'';
GO

ALTER TABLE [Almacen_Movimiento] ADD [Turno] nvarchar(50) NOT NULL DEFAULT N'';
GO

ALTER TABLE [Almacen_Movimiento] ADD [VehiculoAsignado] nvarchar(50) NOT NULL DEFAULT N'';
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260726190947_AlmacenCamposTrazabilidad', N'8.0.0');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

CREATE TABLE [Almacen_Rack] (
    [Id] int NOT NULL IDENTITY,
    [Codigo] nvarchar(50) NOT NULL,
    [PosicionX] int NOT NULL,
    [PosicionY] int NOT NULL,
    [NumeroColumnas] int NOT NULL,
    [NumeroNiveles] int NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_Almacen_Rack] PRIMARY KEY ([Id])
);
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260726192344_AlmacenMapEditor', N'8.0.0');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

ALTER TABLE [Almacen_Producto] ADD [ImagenUrl] nvarchar(500) NULL;
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260728000205_AddProductoImagen', N'8.0.0');
GO

COMMIT;
GO

