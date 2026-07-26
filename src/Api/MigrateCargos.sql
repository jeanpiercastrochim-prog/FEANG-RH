-- 1. Alter Contracts: drop SueldoBase
IF COL_LENGTH('Contracts', 'SueldoBase') IS NOT NULL
BEGIN
    ALTER TABLE Contracts DROP COLUMN SueldoBase;
END
GO

-- 2. Alter Cargos: drop Area, Nivel, add AreaDefinicionCodigo, AreaId, NivelDefinicionCodigo, NivelId, SueldoBase
IF COL_LENGTH('Cargos', 'Area') IS NOT NULL
BEGIN
    ALTER TABLE Cargos DROP COLUMN Area;
END
GO

IF COL_LENGTH('Cargos', 'Nivel') IS NOT NULL
BEGIN
    ALTER TABLE Cargos DROP COLUMN Nivel;
END
GO

IF COL_LENGTH('Cargos', 'AreaDefinicionCodigo') IS NULL
BEGIN
    ALTER TABLE Cargos ADD AreaDefinicionCodigo nvarchar(450) DEFAULT 'AREA' NOT NULL;
END
GO

IF COL_LENGTH('Cargos', 'AreaId') IS NULL
BEGIN
    ALTER TABLE Cargos ADD AreaId int NULL;
END
GO

IF COL_LENGTH('Cargos', 'NivelDefinicionCodigo') IS NULL
BEGIN
    ALTER TABLE Cargos ADD NivelDefinicionCodigo nvarchar(450) DEFAULT 'NIVEL' NOT NULL;
END
GO

IF COL_LENGTH('Cargos', 'NivelId') IS NULL
BEGIN
    ALTER TABLE Cargos ADD NivelId int NULL;
END
GO

IF COL_LENGTH('Cargos', 'SueldoBase') IS NULL
BEGIN
    ALTER TABLE Cargos ADD SueldoBase decimal(18,2) DEFAULT 0 NOT NULL;
END
GO

-- 3. Ensure Definiciones "AREA" and "NIVEL" exist
IF NOT EXISTS (SELECT 1 FROM Definiciones WHERE Codigo = 'AREA')
BEGIN
    INSERT INTO Definiciones (Codigo, Nombre, Descripcion, Activo, CreatedAt)
    VALUES ('AREA', 'Áreas de la Empresa', 'Departamentos y áreas', 1, GETUTCDATE());
END
GO

IF NOT EXISTS (SELECT 1 FROM Definiciones WHERE Codigo = 'NIVEL')
BEGIN
    INSERT INTO Definiciones (Codigo, Nombre, Descripcion, Activo, CreatedAt)
    VALUES ('NIVEL', 'Niveles Jerárquicos', 'Niveles de los cargos', 1, GETUTCDATE());
END
GO

-- 4. Seed areas y niveles por defecto (ejemplo)
IF NOT EXISTS (SELECT 1 FROM DefinicionDetalle WHERE DefinicionCodigo = 'AREA' AND Nombre = 'Tecnología')
BEGIN
    INSERT INTO DefinicionDetalle (DefinicionCodigo, Nombre, Activo, Orden, CreatedAt) VALUES ('AREA', 'Tecnología', 1, 1, GETUTCDATE());
    INSERT INTO DefinicionDetalle (DefinicionCodigo, Nombre, Activo, Orden, CreatedAt) VALUES ('AREA', 'Recursos Humanos', 1, 2, GETUTCDATE());
    INSERT INTO DefinicionDetalle (DefinicionCodigo, Nombre, Activo, Orden, CreatedAt) VALUES ('AREA', 'Operaciones', 1, 3, GETUTCDATE());
    INSERT INTO DefinicionDetalle (DefinicionCodigo, Nombre, Activo, Orden, CreatedAt) VALUES ('AREA', 'Ejecutiva', 1, 4, GETUTCDATE());
    
    INSERT INTO DefinicionDetalle (DefinicionCodigo, Nombre, Activo, Orden, CreatedAt) VALUES ('NIVEL', 'Analista', 1, 1, GETUTCDATE());
    INSERT INTO DefinicionDetalle (DefinicionCodigo, Nombre, Activo, Orden, CreatedAt) VALUES ('NIVEL', 'Desarrollador', 1, 2, GETUTCDATE());
    INSERT INTO DefinicionDetalle (DefinicionCodigo, Nombre, Activo, Orden, CreatedAt) VALUES ('NIVEL', 'Operario', 1, 3, GETUTCDATE());
    INSERT INTO DefinicionDetalle (DefinicionCodigo, Nombre, Activo, Orden, CreatedAt) VALUES ('NIVEL', 'Ejecutivo', 1, 4, GETUTCDATE());
    INSERT INTO DefinicionDetalle (DefinicionCodigo, Nombre, Activo, Orden, CreatedAt) VALUES ('NIVEL', 'Practicante', 1, 5, GETUTCDATE());
END
GO

-- 5. Seed cargos de la captura
MERGE Cargos AS target
USING (
    SELECT 'Analista de Datos' AS Nombre, 'Tecnología' AS Area, 'Analista' AS Nivel
    UNION ALL SELECT 'Desarrollador de Software', 'Tecnología', 'Desarrollador'
    UNION ALL SELECT 'Operario de Limpieza', 'Operaciones', 'Operario'
    UNION ALL SELECT 'Personal Ejecutivo', 'Ejecutiva', 'Ejecutivo'
    UNION ALL SELECT 'Personal de Campo', 'Operaciones', 'Operario'
    UNION ALL SELECT 'Practicante', 'Tecnología', 'Practicante'
) AS source
ON target.Nombre = source.Nombre
WHEN NOT MATCHED THEN
    INSERT (Nombre, Descripcion, AreaDefinicionCodigo, AreaId, NivelDefinicionCodigo, NivelId, SueldoBase, Estado, CreatedAt)
    VALUES (
        source.Nombre, 
        'Cargo: ' + source.Nombre, 
        'AREA', 
        (SELECT TOP 1 Id FROM DefinicionDetalle WHERE DefinicionCodigo = 'AREA' AND Nombre = source.Area),
        'NIVEL', 
        (SELECT TOP 1 Id FROM DefinicionDetalle WHERE DefinicionCodigo = 'NIVEL' AND Nombre = source.Nivel),
        1000.00, 
        'Activo', 
        GETUTCDATE()
    );
GO
