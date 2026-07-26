IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='TransViajes' and xtype='U')
BEGIN
    CREATE TABLE TransViajes (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        ConductorDni NVARCHAR(MAX) NOT NULL,
        UnidadPlaca NVARCHAR(MAX) NOT NULL,
        Origen NVARCHAR(MAX) NOT NULL,
        Destino NVARCHAR(MAX) NOT NULL,
        Estado NVARCHAR(MAX) NOT NULL,
        FechaInicio DATETIME2 NOT NULL,
        FechaFin DATETIME2 NULL
    )
END

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='TransUbicaciones' and xtype='U')
BEGIN
    CREATE TABLE TransUbicaciones (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        ViajeId INT NOT NULL FOREIGN KEY REFERENCES TransViajes(Id) ON DELETE CASCADE,
        Latitud FLOAT NOT NULL,
        Longitud FLOAT NOT NULL,
        Velocidad FLOAT NOT NULL,
        Bateria FLOAT NOT NULL,
        Timestamp DATETIME2 NOT NULL
    )
END

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='TransAlertas' and xtype='U')
BEGIN
    CREATE TABLE TransAlertas (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        ViajeId INT NOT NULL FOREIGN KEY REFERENCES TransViajes(Id) ON DELETE CASCADE,
        Tipo NVARCHAR(MAX) NOT NULL,
        Titulo NVARCHAR(MAX) NOT NULL,
        Detalle NVARCHAR(MAX) NOT NULL,
        Timestamp DATETIME2 NOT NULL,
        IsActive BIT NOT NULL
    )
END
