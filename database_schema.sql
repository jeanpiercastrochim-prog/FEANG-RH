-- =========================================================================
-- SCRIPT DE CREACIÃ“N DE BASE DE DATOS - SISTEMA RRHH (PRIME_RH / CHAVIN)
-- VERSIÃ“N 4
-- =========================================================================
-- Cambios respecto a v3:
--   1. Se reemplazan los 8 catÃ¡logos dedicados (Genero, EstadoCivil,
--      TipoContrato, EstadoEmpleado, NivelEducacion, Banco, AFP,
--      TipoCuentaBancaria) por UN SOLO catÃ¡logo genÃ©rico:
--         Definiciones      -> la "categorÃ­a" (GENERO, ESTADO_CIVIL, ...)
--         DefinicionDetalle -> los valores de cada categorÃ­a (M/F, etc.)
--
--      Para no perder la integridad referencial real que motivÃ³ no usar
--      EAV en la v3 (un FK genÃ©rico no puede validar por sÃ­ solo que el
--      registro pertenece a la categorÃ­a correcta), cada FK hacia
--      DefinicionDetalle es un FK COMPUESTO contra
--      (DefinicionCodigo, Id), acompaÃ±ado de una columna calculada
--      constante (ej. GeneroDefinicionCodigo = 'GENERO' siempre) en la
--      tabla que referencia. AsÃ­, el motor rechaza a nivel de base de
--      datos cualquier intento de guardar, por ejemplo, el Id de un
--      registro de "BANCO" dentro de GeneroId.
--
--      Costo: una columna calculada (PERSISTED) extra por cada FK.
--      Beneficio: 8 tablas -> 2 tablas, agregar un nuevo catÃ¡logo
--      (ej. "MOTIVO_CESE") no requiere crear tabla ni migraciÃ³n de
--      esquema, solo una fila en Definiciones + filas en
--      DefinicionDetalle.
--
--   2. Se usa Codigo (varchar) como PK natural de Definiciones en vez de
--      un Id identity, para que la constante de las columnas calculadas
--      sea legible y estable ('GENERO' en vez de un nÃºmero mÃ¡gico que
--      dependa del orden de inserciÃ³n de los seeds).
--
--   3. Las columnas "Estado" sueltas (Cargos.Estado, Contracts.Estado,
--      Payslips.Estado, EmployeeContracts.Estado, EmployeePayslips.Estado)
--      NO se tocan: ya eran VARCHAR + CHECK, nunca tuvieron tabla catÃ¡logo
--      propia en v3, asÃ­ que no aplica simplificarlas mÃ¡s.
-- =========================================================================

USE [master];
GO
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = N'RRHHDB')
BEGIN
    CREATE DATABASE [RRHHDB];
END
GO

USE [RRHHDB];
GO
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO


-- =========================================================================
-- LIMPIEZA (orden inverso por dependencias)
-- =========================================================================
IF OBJECT_ID('dbo.AuditLog', 'U') IS NOT NULL DROP TABLE dbo.AuditLog;
IF OBJECT_ID('dbo.DniPhotos', 'U') IS NOT NULL DROP TABLE dbo.DniPhotos;
IF OBJECT_ID('dbo.EmployeeContracts', 'U') IS NOT NULL DROP TABLE dbo.EmployeeContracts;
IF OBJECT_ID('dbo.EmployeePayslips', 'U') IS NOT NULL DROP TABLE dbo.EmployeePayslips;
IF OBJECT_ID('dbo.EmployeeEducation', 'U') IS NOT NULL DROP TABLE dbo.EmployeeEducation;
IF OBJECT_ID('dbo.Employees', 'U') IS NOT NULL DROP TABLE dbo.Employees;
IF OBJECT_ID('dbo.Contracts', 'U') IS NOT NULL DROP TABLE dbo.Contracts;
IF OBJECT_ID('dbo.Payslips', 'U') IS NOT NULL DROP TABLE dbo.Payslips;
IF OBJECT_ID('dbo.Cargos', 'U') IS NOT NULL DROP TABLE dbo.Cargos;
IF OBJECT_ID('dbo.Ubigeo', 'U') IS NOT NULL DROP TABLE dbo.Ubigeo;
IF OBJECT_ID('dbo.Users', 'U') IS NOT NULL DROP TABLE dbo.Users;
-- CatÃ¡logos dedicados de v3 (ya no existen en v4)
IF OBJECT_ID('dbo.Genero', 'U') IS NOT NULL DROP TABLE dbo.Genero;
IF OBJECT_ID('dbo.EstadoCivil', 'U') IS NOT NULL DROP TABLE dbo.EstadoCivil;
IF OBJECT_ID('dbo.TipoContrato', 'U') IS NOT NULL DROP TABLE dbo.TipoContrato;
IF OBJECT_ID('dbo.EstadoEmpleado', 'U') IS NOT NULL DROP TABLE dbo.EstadoEmpleado;
IF OBJECT_ID('dbo.NivelEducacion', 'U') IS NOT NULL DROP TABLE dbo.NivelEducacion;
IF OBJECT_ID('dbo.Banco', 'U') IS NOT NULL DROP TABLE dbo.Banco;
IF OBJECT_ID('dbo.AFP', 'U') IS NOT NULL DROP TABLE dbo.AFP;
IF OBJECT_ID('dbo.TipoCuentaBancaria', 'U') IS NOT NULL DROP TABLE dbo.TipoCuentaBancaria;
-- CatÃ¡logo genÃ©rico de v4
IF OBJECT_ID('dbo.DefinicionDetalle', 'U') IS NOT NULL DROP TABLE dbo.DefinicionDetalle;
IF OBJECT_ID('dbo.Definiciones', 'U') IS NOT NULL DROP TABLE dbo.Definiciones;
GO

-- =========================================================================
-- CATÃLOGO GENÃ‰RICO (reemplaza a Genero, EstadoCivil, TipoContrato,
-- EstadoEmpleado, NivelEducacion, Banco, AFP, TipoCuentaBancaria)
-- =========================================================================

-- Definiciones = las "categorÃ­as" del catÃ¡logo.
-- Codigo es la PK natural (en mayÃºsculas, sin espacios) para que las
-- columnas calculadas constantes de las tablas hijas sean legibles.
CREATE TABLE [dbo].[Definiciones] (
    [Codigo] VARCHAR(30) NOT NULL,       -- 'GENERO','ESTADO_CIVIL','TIPO_CONTRATO', etc.
    [Nombre] VARCHAR(100) NOT NULL,      -- 'GÃ©nero','Estado Civil','Tipo de Contrato'
    [Descripcion] VARCHAR(255) NULL,
    [Activo] BIT NOT NULL DEFAULT (1),
    [CreatedBy]  INT NULL,
    [CreatedAt]  DATETIME2 NOT NULL DEFAULT (GETUTCDATE()),
    [ModifiedBy] INT NULL,
    [ModifiedAt] DATETIME2 NULL,
    CONSTRAINT [PK_Definiciones] PRIMARY KEY CLUSTERED ([Codigo] ASC)
);
GO

-- DefinicionDetalle = los valores de cada categorÃ­a.
-- UQ_DefinicionDetalle_DefCod_Id es la unique key que habilita que las
-- tablas hijas hagan FK compuesto (DefinicionCodigo, Id) y asÃ­ el motor
-- valide la categorÃ­a correcta, no solo que el Id exista en algÃºn lado.
CREATE TABLE [dbo].[DefinicionDetalle] (
    [Id]               INT IDENTITY(1,1) NOT NULL,
    [DefinicionCodigo] VARCHAR(30) NOT NULL,
    [Codigo]           VARCHAR(30) NOT NULL,   -- 'M','F' / 'SOLTERO','CASADO' / 'BCP','BBVA' ...
    [Nombre]           VARCHAR(100) NOT NULL,
    [Orden]            INT NOT NULL DEFAULT (0),
    [Activo]           BIT NOT NULL DEFAULT (1),
    [CreatedBy]  INT NULL,
    [CreatedAt]  DATETIME2 NOT NULL DEFAULT (GETUTCDATE()),
    [ModifiedBy] INT NULL,
    [ModifiedAt] DATETIME2 NULL,
    CONSTRAINT [PK_DefinicionDetalle] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_DefinicionDetalle_DefCod_Id] UNIQUE ([DefinicionCodigo], [Id]),
    CONSTRAINT [UQ_DefinicionDetalle_DefCod_Codigo] UNIQUE ([DefinicionCodigo], [Codigo]),
    CONSTRAINT [FK_DefinicionDetalle_Definiciones] FOREIGN KEY ([DefinicionCodigo])
        REFERENCES [dbo].[Definiciones]([Codigo])
);
GO

CREATE NONCLUSTERED INDEX [IX_DefinicionDetalle_DefinicionCodigo]
    ON [dbo].[DefinicionDetalle] ([DefinicionCodigo] ASC);
GO

CREATE TABLE [dbo].[Ubigeo] (
    [Id]           INT IDENTITY(1,1) NOT NULL,
    [Departamento] VARCHAR(100) NOT NULL,
    [Provincia]    VARCHAR(100) NOT NULL,
    [Distrito]     VARCHAR(100) NOT NULL,
    CONSTRAINT [PK_Ubigeo] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_Ubigeo] UNIQUE ([Departamento], [Provincia], [Distrito])
);
GO

-- Cargos: sigue con su propio Estado (VARCHAR + CHECK), no es catÃ¡logo
-- del diccionario porque su ciclo de vida/reglas son distintas (ver nota
-- del punto 3 al inicio del script).
CREATE TABLE [dbo].[Cargos] (
    [Id]          INT IDENTITY(1,1) NOT NULL,
    [Nombre]      VARCHAR(100) NOT NULL,
    [Descripcion] VARCHAR(500) NULL,
    [Area]        VARCHAR(100) NULL,
    [Nivel]       VARCHAR(50) NULL,
    [Estado]      VARCHAR(20) NOT NULL DEFAULT ('Activo'),
    [CreatedBy]  INT NULL,
    [CreatedAt]  DATETIME2 NOT NULL DEFAULT (GETUTCDATE()),
    [ModifiedBy] INT NULL,
    [ModifiedAt] DATETIME2 NULL,
    CONSTRAINT [PK_Cargos] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_Cargos_Nombre] UNIQUE ([Nombre]),
    CONSTRAINT [CK_Cargos_Estado] CHECK ([Estado] IN ('Activo','Inactivo'))
);
GO

CREATE TABLE [dbo].[Users] (
    [Id]           INT IDENTITY(1,1) NOT NULL,
    [Dni]          VARCHAR(15) NOT NULL,
    [Email]        VARCHAR(255) NOT NULL,
    [PasswordHash] VARBINARY(256) NOT NULL,
    [PasswordSalt] VARBINARY(128) NOT NULL,
    [Rol]          VARCHAR(30) NOT NULL DEFAULT ('Colaborador'),
    [IsActive]               BIT NOT NULL DEFAULT (1),
    [LastLogin]               DATETIME2 NULL,
    [FailedAttempts]          INT NOT NULL DEFAULT (0),
    [LockedUntil]             DATETIME2 NULL,
    [RefreshTokenHash]        VARBINARY(256) NULL,
    [RefreshTokenExpiration]  DATETIME2 NULL,
    [CreatedBy]  INT NULL,
    [CreatedAt]  DATETIME2 NOT NULL DEFAULT (GETUTCDATE()),
    [ModifiedBy] INT NULL,
    [ModifiedAt] DATETIME2 NULL,
    CONSTRAINT [PK_Users] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_Users_Dni] UNIQUE ([Dni]),
    CONSTRAINT [UQ_Users_Email] UNIQUE ([Email]),
    CONSTRAINT [CK_Users_Rol] CHECK ([Rol] IN ('Administrador','RRHH','Colaborador')),
    CONSTRAINT [CK_Users_FailedAttempts] CHECK ([FailedAttempts] >= 0)
);
GO

-- =========================================================================
-- TABLAS PRINCIPALES
-- =========================================================================

-- Employees: GeneroId, EstadoCivilId, EstadoEmpleadoId, TipoContratoId,
-- BancoId, TipoCuentaBancariaId y AFPId ahora apuntan a DefinicionDetalle.
-- Cada uno trae su columna calculada "...DefinicionCodigo" que fija la
-- categorÃ­a, y el FK real es compuesto contra (DefinicionCodigo, Id).
CREATE TABLE [dbo].[Employees] (
    [Id]      INT IDENTITY(1,1) NOT NULL,
    [UserId]  INT NULL,
    -- Datos Personales
    [Nombres]           VARCHAR(150) NOT NULL,
    [ApellidoPaterno]   VARCHAR(80) NOT NULL,
    [ApellidoMaterno]   VARCHAR(80) NOT NULL,
    [Dni]               VARCHAR(15) NOT NULL,
    [FechaNacimiento]   DATE NOT NULL,
    [GeneroId]              INT NOT NULL,
    [GeneroDefinicionCodigo] AS (CAST('GENERO' AS VARCHAR(30))) PERSISTED,
    [EstadoCivilId]              INT NOT NULL,
    [EstadoCivilDefinicionCodigo] AS (CAST('ESTADO_CIVIL' AS VARCHAR(30))) PERSISTED,
    [Direccion]         VARCHAR(255) NOT NULL,
    [UbigeoId]          INT NOT NULL,
    -- Datos de contacto
    [Telefono]           VARCHAR(20) NULL,
    [CorreoPersonal]     VARCHAR(255) NULL,
    [CorreoCorporativo]  VARCHAR(255) NULL,
    -- Datos Laborales
    [CargoId]           INT NOT NULL,
    [BaseSalary]        DECIMAL(18, 2) NOT NULL,
    [EstadoEmpleadoId]              INT NOT NULL,
    [EstadoEmpleadoDefinicionCodigo] AS (CAST('ESTADO_EMPLEADO' AS VARCHAR(30))) PERSISTED,
    [FechaIngreso]      DATE NOT NULL,
    [FechaCese]         DATE NULL,
    [TipoContratoId]              INT NOT NULL,
    [TipoContratoDefinicionCodigo] AS (CAST('TIPO_CONTRATO' AS VARCHAR(30))) PERSISTED,
    -- Datos bancarios (opcionales -> el FK compuesto se salta si el Id es NULL)
    [BancoId]              INT NULL,
    [BancoDefinicionCodigo] AS (CAST('BANCO' AS VARCHAR(30))) PERSISTED,
    [TipoCuentaBancariaId]              INT NULL,
    [TipoCuentaBancariaDefinicionCodigo] AS (CAST('TIPO_CUENTA_BANCARIA' AS VARCHAR(30))) PERSISTED,
    [NumeroCuenta]         VARCHAR(30) NULL,
    [CCI]                  VARCHAR(30) NULL,
    -- Datos pensionarios
    [AFPId]              INT NULL,
    [AFPDefinicionCodigo] AS (CAST('AFP' AS VARCHAR(30))) PERSISTED,
    [CodigoAFP]  VARCHAR(20) NULL,
    [SignatureImagePath] VARCHAR(255) NULL,
    -- Contacto de emergencia
    [ContactoEmergencia]  VARCHAR(150) NULL,
    [Parentesco]          VARCHAR(50) NULL,
    [TelefonoEmergencia]  VARCHAR(20) NULL,
    -- AuditorÃ­a
    [CreatedBy]  INT NULL,
    [CreatedAt]  DATETIME2 NOT NULL DEFAULT (GETUTCDATE()),
    [ModifiedBy] INT NULL,
    [ModifiedAt] DATETIME2 NULL,

    CONSTRAINT [PK_Employees] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_Employees_Dni] UNIQUE ([Dni]),
    CONSTRAINT [FK_Employees_Users] FOREIGN KEY ([UserId]) REFERENCES [dbo].[Users]([Id]),
    CONSTRAINT [FK_Employees_Ubigeo] FOREIGN KEY ([UbigeoId]) REFERENCES [dbo].[Ubigeo]([Id]),
    CONSTRAINT [FK_Employees_Cargos] FOREIGN KEY ([CargoId]) REFERENCES [dbo].[Cargos]([Id]),
    CONSTRAINT [FK_Employees_Genero] FOREIGN KEY ([GeneroDefinicionCodigo], [GeneroId])
        REFERENCES [dbo].[DefinicionDetalle]([DefinicionCodigo], [Id]),
    CONSTRAINT [FK_Employees_EstadoCivil] FOREIGN KEY ([EstadoCivilDefinicionCodigo], [EstadoCivilId])
        REFERENCES [dbo].[DefinicionDetalle]([DefinicionCodigo], [Id]),
    CONSTRAINT [FK_Employees_EstadoEmpleado] FOREIGN KEY ([EstadoEmpleadoDefinicionCodigo], [EstadoEmpleadoId])
        REFERENCES [dbo].[DefinicionDetalle]([DefinicionCodigo], [Id]),
    CONSTRAINT [FK_Employees_TipoContrato] FOREIGN KEY ([TipoContratoDefinicionCodigo], [TipoContratoId])
        REFERENCES [dbo].[DefinicionDetalle]([DefinicionCodigo], [Id]),
    CONSTRAINT [FK_Employees_Banco] FOREIGN KEY ([BancoDefinicionCodigo], [BancoId])
        REFERENCES [dbo].[DefinicionDetalle]([DefinicionCodigo], [Id]),
    CONSTRAINT [FK_Employees_TipoCuentaBancaria] FOREIGN KEY ([TipoCuentaBancariaDefinicionCodigo], [TipoCuentaBancariaId])
        REFERENCES [dbo].[DefinicionDetalle]([DefinicionCodigo], [Id]),
    CONSTRAINT [FK_Employees_AFP] FOREIGN KEY ([AFPDefinicionCodigo], [AFPId])
        REFERENCES [dbo].[DefinicionDetalle]([DefinicionCodigo], [Id]),
    CONSTRAINT [CK_Employees_BaseSalary] CHECK ([BaseSalary] >= 0),
    CONSTRAINT [CK_Employees_Fechas] CHECK ([FechaCese] IS NULL OR [FechaCese] >= [FechaIngreso])
);
GO

CREATE TABLE [dbo].[EmployeeEducation] (
    [Id]              INT IDENTITY(1,1) NOT NULL,
    [EmployeeId]      INT NOT NULL,
    [NivelEducacionId]              INT NOT NULL,
    [NivelEducacionDefinicionCodigo] AS (CAST('NIVEL_EDUCACION' AS VARCHAR(30))) PERSISTED,
    [Institucion]     VARCHAR(150) NOT NULL,
    [Carrera]         VARCHAR(150) NULL,
    [FechaInicio]     DATE NULL,
    [FechaFin]        DATE NULL,
    [Estado]          VARCHAR(20) NOT NULL DEFAULT ('En curso'),
    [CreatedBy]  INT NULL,
    [CreatedAt]  DATETIME2 NOT NULL DEFAULT (GETUTCDATE()),
    [ModifiedBy] INT NULL,
    [ModifiedAt] DATETIME2 NULL,
    [IsDeleted]  BIT NOT NULL DEFAULT (0),
    [DeletedBy]  INT NULL,
    [DeletedAt]  DATETIME2 NULL,

    CONSTRAINT [PK_EmployeeEducation] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_EmployeeEducation_Employees] FOREIGN KEY ([EmployeeId]) REFERENCES [dbo].[Employees]([Id]),
    CONSTRAINT [FK_EmployeeEducation_NivelEducacion] FOREIGN KEY ([NivelEducacionDefinicionCodigo], [NivelEducacionId])
        REFERENCES [dbo].[DefinicionDetalle]([DefinicionCodigo], [Id]),
    CONSTRAINT [CK_EmployeeEducation_Estado] CHECK ([Estado] IN ('En curso','Concluido','Truncado')),
    CONSTRAINT [CK_EmployeeEducation_Fechas] CHECK ([FechaFin] IS NULL OR [FechaInicio] IS NULL OR [FechaFin] >= [FechaInicio])
);
GO

CREATE TABLE [dbo].[Contracts] (
    [Id]              INT IDENTITY(1,1) NOT NULL,
    [Name]            VARCHAR(100) NOT NULL,
    [FilePath]        VARCHAR(500) NULL,
    [TipoContratoId]              INT NULL,
    [TipoContratoDefinicionCodigo] AS (CAST('TIPO_CONTRATO' AS VARCHAR(30))) PERSISTED,
    [Version]         INT NOT NULL DEFAULT (1),
    [FechaInicio]     DATE NULL,
    [FechaFin]        DATE NULL,
    [Estado]          VARCHAR(20) NOT NULL DEFAULT ('Vigente'),
    [Observacion]     VARCHAR(500) NULL,
    [CreatedBy]  INT NULL,
    [CreatedAt]  DATETIME2 NOT NULL DEFAULT (GETUTCDATE()),
    [ModifiedBy] INT NULL,
    [ModifiedAt] DATETIME2 NULL,
    [IsDeleted]  BIT NOT NULL DEFAULT (0),
    [DeletedBy]  INT NULL,
    [DeletedAt]  DATETIME2 NULL,

    CONSTRAINT [PK_Contracts] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_Contracts_Name] UNIQUE ([Name]),
    CONSTRAINT [FK_Contracts_TipoContrato] FOREIGN KEY ([TipoContratoDefinicionCodigo], [TipoContratoId])
        REFERENCES [dbo].[DefinicionDetalle]([DefinicionCodigo], [Id]),
    CONSTRAINT [CK_Contracts_Estado] CHECK ([Estado] IN ('Vigente','Vencido','Anulado')),
    CONSTRAINT [CK_Contracts_Fechas] CHECK ([FechaFin] IS NULL OR [FechaInicio] IS NULL OR [FechaFin] >= [FechaInicio])
);
GO

CREATE TABLE [dbo].[EmployeeContracts] (
    [Id]          UNIQUEIDENTIFIER NOT NULL DEFAULT (NEWID()),
    [EmployeeId]  INT NOT NULL,
    [ContractId]  INT NOT NULL,
    [Estado]      VARCHAR(20) NOT NULL DEFAULT ('Pendiente'),
    [SignedAt]    DATETIME2 NULL,
    [CreatedBy]  INT NULL,
    [CreatedAt]  DATETIME2 NOT NULL DEFAULT (GETUTCDATE()),
    [ModifiedBy] INT NULL,
    [ModifiedAt] DATETIME2 NULL,
    [IsDeleted]  BIT NOT NULL DEFAULT (0),
    [DeletedBy]  INT NULL,
    [DeletedAt]  DATETIME2 NULL,

    CONSTRAINT [PK_EmployeeContracts] PRIMARY KEY NONCLUSTERED ([Id] ASC),
    CONSTRAINT [FK_EmployeeContracts_Employees] FOREIGN KEY ([EmployeeId]) REFERENCES [dbo].[Employees]([Id]),
    CONSTRAINT [FK_EmployeeContracts_Contracts] FOREIGN KEY ([ContractId]) REFERENCES [dbo].[Contracts]([Id]),
    CONSTRAINT [CK_EmployeeContracts_Estado] CHECK ([Estado] IN ('Pendiente','Firmado','Anulado'))
);
GO

CREATE TABLE [dbo].[Payslips] (
    [Id]               INT IDENTITY(1,1) NOT NULL,
    [Periodo]          DATE NOT NULL,
    [FechaGeneracion]  DATETIME2 NOT NULL DEFAULT (GETUTCDATE()),
    [FechaPago]        DATE NULL,
    [Estado]           VARCHAR(20) NOT NULL DEFAULT ('Pendiente'),
    [Observacion]      VARCHAR(500) NULL,
    [CreatedBy]  INT NULL,
    [CreatedAt]  DATETIME2 NOT NULL DEFAULT (GETUTCDATE()),
    [ModifiedBy] INT NULL,
    [ModifiedAt] DATETIME2 NULL,
    [IsDeleted]  BIT NOT NULL DEFAULT (0),
    [DeletedBy]  INT NULL,
    [DeletedAt]  DATETIME2 NULL,

    CONSTRAINT [PK_Payslips] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_Payslips_Periodo] UNIQUE ([Periodo]),
    CONSTRAINT [CK_Payslips_Estado] CHECK ([Estado] IN ('Pendiente','Generado','Pagado','Anulado'))
);
GO

CREATE TABLE [dbo].[EmployeePayslips] (
    [Id]          INT IDENTITY(1,1) NOT NULL,
    [EmployeeId]  INT NOT NULL,
    [PayslipId]   INT NOT NULL,
    [SueldoBase]     DECIMAL(18, 2) NOT NULL DEFAULT (0),
    [HorasExtras]    DECIMAL(18, 2) NOT NULL DEFAULT (0),
    [Bonificaciones] DECIMAL(18, 2) NOT NULL DEFAULT (0),
    [Comisiones]     DECIMAL(18, 2) NOT NULL DEFAULT (0),
    [AFP]              DECIMAL(18, 2) NOT NULL DEFAULT (0),
    [ONP]              DECIMAL(18, 2) NOT NULL DEFAULT (0),
    [Essalud]          DECIMAL(18, 2) NOT NULL DEFAULT (0),
    [QuintaCategoria]  DECIMAL(18, 2) NOT NULL DEFAULT (0),
    [OtrosDescuentos]  DECIMAL(18, 2) NOT NULL DEFAULT (0),
    [NetoPagar] AS (
        ([SueldoBase] + [HorasExtras] + [Bonificaciones] + [Comisiones])
        - ([AFP] + [ONP] + [Essalud] + [QuintaCategoria] + [OtrosDescuentos])
    ) PERSISTED,
    [Estado]       VARCHAR(20) NOT NULL DEFAULT ('Pendiente'),
    [FechaEnvio]   DATETIME2 NULL,
    [GeneratedAt]  DATETIME2 NOT NULL DEFAULT (GETUTCDATE()),
    [CreatedBy]  INT NULL,
    [CreatedAt]  DATETIME2 NOT NULL DEFAULT (GETUTCDATE()),
    [ModifiedBy] INT NULL,
    [ModifiedAt] DATETIME2 NULL,
    [IsDeleted]  BIT NOT NULL DEFAULT (0),
    [DeletedBy]  INT NULL,
    [DeletedAt]  DATETIME2 NULL,

    CONSTRAINT [PK_EmployeePayslips] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_EmployeePayslips_Employees] FOREIGN KEY ([EmployeeId]) REFERENCES [dbo].[Employees]([Id]),
    CONSTRAINT [FK_EmployeePayslips_Payslips] FOREIGN KEY ([PayslipId]) REFERENCES [dbo].[Payslips]([Id]),
    CONSTRAINT [CK_EmployeePayslips_Estado] CHECK ([Estado] IN ('Pendiente','Enviado')),
    CONSTRAINT [CK_EmployeePayslips_Montos] CHECK (
        [SueldoBase] >= 0 AND [HorasExtras] >= 0 AND [Bonificaciones] >= 0 AND [Comisiones] >= 0
        AND [AFP] >= 0 AND [ONP] >= 0 AND [Essalud] >= 0 AND [QuintaCategoria] >= 0 AND [OtrosDescuentos] >= 0
    )
);
GO

CREATE TABLE [dbo].[DniPhotos] (
    [Id]             INT IDENTITY(1,1) NOT NULL,
    [EmployeeId]     INT NOT NULL,
    [FrontImagePath] VARCHAR(500) NULL,
    [BackImagePath]  VARCHAR(500) NULL,
    [Validated]      BIT NOT NULL DEFAULT (0),
    [ValidatedBy]    INT NULL,
    [ValidatedAt]    DATETIME2 NULL,
    [Observation]    VARCHAR(500) NULL,
    [CreatedBy]  INT NULL,
    [CreatedAt]  DATETIME2 NOT NULL DEFAULT (GETUTCDATE()),
    [ModifiedBy] INT NULL,
    [ModifiedAt] DATETIME2 NULL,

    CONSTRAINT [PK_DniPhotos] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_DniPhotos_Employees] FOREIGN KEY ([EmployeeId]) REFERENCES [dbo].[Employees]([Id]) ON DELETE CASCADE
);
GO

CREATE TABLE [dbo].[AuditLog] (
    [Id]         BIGINT IDENTITY(1,1) NOT NULL,
    [TableName]  VARCHAR(100) NOT NULL,
    [RecordId]   VARCHAR(100) NOT NULL,
    [Action]     VARCHAR(10) NOT NULL,
    [ChangedBy]  INT NULL,
    [ChangedAt]  DATETIME2 NOT NULL DEFAULT (GETUTCDATE()),
    [OldValues]  NVARCHAR(MAX) NULL,
    [NewValues]  NVARCHAR(MAX) NULL,
    [IpAddress]        VARCHAR(45) NULL,
    [UserAgent]        VARCHAR(500) NULL,
    [Module]           VARCHAR(100) NULL,
    [Device]           VARCHAR(100) NULL,
    [Browser]          VARCHAR(100) NULL,
    [OperatingSystem]  VARCHAR(100) NULL,
    [RequestId]        UNIQUEIDENTIFIER NULL,

    CONSTRAINT [PK_AuditLog] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [CK_AuditLog_Action] CHECK ([Action] IN ('INSERT','UPDATE','DELETE'))
);
GO

-- =========================================================================
-- ÃNDICES
-- =========================================================================
CREATE NONCLUSTERED INDEX [IX_Employees_Dni] ON [dbo].[Employees] ([Dni] ASC);
CREATE NONCLUSTERED INDEX [IX_Users_Dni] ON [dbo].[Users] ([Dni] ASC);
CREATE NONCLUSTERED INDEX [IX_EmployeeContracts_EmployeeId] ON [dbo].[EmployeeContracts] ([EmployeeId] ASC);
CREATE NONCLUSTERED INDEX [IX_EmployeeContracts_ContractId] ON [dbo].[EmployeeContracts] ([ContractId] ASC);
CREATE NONCLUSTERED INDEX [IX_EmployeePayslips_EmployeeId] ON [dbo].[EmployeePayslips] ([EmployeeId] ASC);
CREATE NONCLUSTERED INDEX [IX_EmployeePayslips_PayslipId] ON [dbo].[EmployeePayslips] ([PayslipId] ASC);
CREATE NONCLUSTERED INDEX [IX_DniPhotos_EmployeeId] ON [dbo].[DniPhotos] ([EmployeeId] ASC);
CREATE NONCLUSTERED INDEX [IX_AuditLog_TableRecord] ON [dbo].[AuditLog] ([TableName], [RecordId]);

CREATE NONCLUSTERED INDEX [IX_Employees_CargoId] ON [dbo].[Employees] ([CargoId] ASC);
CREATE NONCLUSTERED INDEX [IX_Employees_EstadoEmpleadoId] ON [dbo].[Employees] ([EstadoEmpleadoId] ASC);
CREATE NONCLUSTERED INDEX [IX_Employees_FechaIngreso] ON [dbo].[Employees] ([FechaIngreso] ASC);
CREATE NONCLUSTERED INDEX [IX_Employees_UbigeoId] ON [dbo].[Employees] ([UbigeoId] ASC);

CREATE NONCLUSTERED INDEX [IX_Users_Email] ON [dbo].[Users] ([Email] ASC);
CREATE NONCLUSTERED INDEX [IX_Users_Rol] ON [dbo].[Users] ([Rol] ASC);

CREATE NONCLUSTERED INDEX [IX_EmployeeContracts_Estado] ON [dbo].[EmployeeContracts] ([Estado] ASC);

CREATE NONCLUSTERED INDEX [IX_EmployeePayslips_Estado] ON [dbo].[EmployeePayslips] ([Estado] ASC);
CREATE NONCLUSTERED INDEX [IX_EmployeePayslips_GeneratedAt] ON [dbo].[EmployeePayslips] ([GeneratedAt] ASC);

CREATE NONCLUSTERED INDEX [IX_AuditLog_ChangedAt] ON [dbo].[AuditLog] ([ChangedAt] ASC);

CREATE NONCLUSTERED INDEX [IX_EmployeeEducation_EmployeeId] ON [dbo].[EmployeeEducation] ([EmployeeId] ASC);
GO

-- =========================================================================
-- TRIGGER DE AUDITORÃA (igual que en v3)
-- =========================================================================
CREATE OR ALTER TRIGGER [trg_Employees_Audit_Update]
ON [dbo].[Employees]
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO [dbo].[AuditLog] ([TableName],[RecordId],[Action],[ChangedBy],[OldValues],[NewValues])
    SELECT
        'Employees',
        CAST(i.Id AS VARCHAR(100)),
        'UPDATE',
        i.ModifiedBy,
        (SELECT d.* FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
        (SELECT i.* FOR JSON PATH, WITHOUT_ARRAY_WRAPPER)
    FROM inserted i
    JOIN deleted d ON d.Id = i.Id;
END
GO

-- =========================================================================
-- SEEDS DEL CATÃLOGO GENÃ‰RICO
-- =========================================================================

INSERT INTO [dbo].[Definiciones] ([Codigo], [Nombre]) VALUES
    ('GENERO', 'GÃ©nero'),
    ('ESTADO_CIVIL', 'Estado Civil'),
    ('TIPO_CONTRATO', 'Tipo de Contrato'),
    ('ESTADO_EMPLEADO', 'Estado del Empleado'),
    ('NIVEL_EDUCACION', 'Nivel de EducaciÃ³n'),
    ('BANCO', 'Banco'),
    ('AFP', 'AFP'),
    ('TIPO_CUENTA_BANCARIA', 'Tipo de Cuenta Bancaria');
GO

INSERT INTO [dbo].[DefinicionDetalle] ([DefinicionCodigo], [Codigo], [Nombre], [Orden]) VALUES
    -- GENERO
    ('GENERO', 'M', 'Masculino', 1),
    ('GENERO', 'F', 'Femenino', 2),
    -- ESTADO_CIVIL
    ('ESTADO_CIVIL', 'SOLTERO', 'Soltero(a)', 1),
    ('ESTADO_CIVIL', 'CASADO', 'Casado(a)', 2),
    ('ESTADO_CIVIL', 'DIVORCIADO', 'Divorciado(a)', 3),
    ('ESTADO_CIVIL', 'VIUDO', 'Viudo(a)', 4),
    -- TIPO_CONTRATO
    ('TIPO_CONTRATO', 'PLAZO_FIJO', 'Plazo Fijo', 1),
    ('TIPO_CONTRATO', 'INDEFINIDO', 'Plazo Indefinido', 2),
    ('TIPO_CONTRATO', 'LOCACION', 'LocaciÃ³n de Servicios', 3),
    ('TIPO_CONTRATO', 'PRACTICAS', 'PrÃ¡cticas', 4),
    ('TIPO_CONTRATO', 'PARCIAL', 'Tiempo Parcial', 5),
    -- ESTADO_EMPLEADO
    ('ESTADO_EMPLEADO', 'PENDIENTE', 'Pendiente', 1),
    ('ESTADO_EMPLEADO', 'ACTIVO', 'Activo', 2),
    ('ESTADO_EMPLEADO', 'INACTIVO', 'Inactivo', 3),
    ('ESTADO_EMPLEADO', 'CESADO', 'Cesado', 4),
    -- NIVEL_EDUCACION
    ('NIVEL_EDUCACION', 'PRIMARIA', 'Primaria', 1),
    ('NIVEL_EDUCACION', 'SECUNDARIA', 'Secundaria', 2),
    ('NIVEL_EDUCACION', 'TECNICA', 'TÃ©cnica', 3),
    ('NIVEL_EDUCACION', 'SUPERIOR', 'Superior Universitaria', 4),
    ('NIVEL_EDUCACION', 'POSTGRADO', 'Postgrado', 5),
    -- BANCO (ajustar segÃºn bancos con los que trabaje la empresa)
    ('BANCO', 'BCP', 'Banco de CrÃ©dito del PerÃº', 1),
    ('BANCO', 'BBVA', 'BBVA PerÃº', 2),
    ('BANCO', 'INTERBANK', 'Interbank', 3),
    ('BANCO', 'SCOTIABANK', 'Scotiabank PerÃº', 4),
    -- AFP (las 4 que operan en PerÃº)
    ('AFP', 'INTEGRA', 'AFP Integra', 1),
    ('AFP', 'PRIMA', 'Prima AFP', 2),
    ('AFP', 'PROFUTURO', 'Profuturo AFP', 3),
    ('AFP', 'HABITAT', 'AFP Habitat', 4),
    -- TIPO_CUENTA_BANCARIA
    ('TIPO_CUENTA_BANCARIA', 'AHORROS', 'Cuenta de Ahorros', 1),
    ('TIPO_CUENTA_BANCARIA', 'CORRIENTE', 'Cuenta Corriente', 2);
GO

PRINT 'Script RRHHDB v4 ejecutado. CatÃ¡logo genÃ©rico Definiciones/DefinicionDetalle sembrado. Falta insertar seeds de Ubigeo y Cargos antes de poblar Employees.';
GO
-- Agregado para soportar foto de perfil en el nuevo modal de Configuración de Perfil
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Users]') AND name = 'FotoUrl')
BEGIN
    ALTER TABLE [dbo].[Users] ADD [FotoUrl] VARCHAR(MAX) NULL;
END
GO

