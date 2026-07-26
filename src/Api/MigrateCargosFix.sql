-- 1. Drop Default Constraint for Contracts.SueldoBase
DECLARE @ConstraintName nvarchar(200)
SELECT @ConstraintName = d.name
FROM sys.tables t
JOIN sys.default_constraints d ON d.parent_object_id = t.object_id
JOIN sys.columns c ON c.object_id = t.object_id AND c.column_id = d.parent_column_id
WHERE t.name = 'Contracts' AND c.name = 'SueldoBase'

IF @ConstraintName IS NOT NULL
BEGIN
    EXEC('ALTER TABLE Contracts DROP CONSTRAINT ' + @ConstraintName)
END
GO

IF COL_LENGTH('Contracts', 'SueldoBase') IS NOT NULL
BEGIN
    ALTER TABLE Contracts DROP COLUMN SueldoBase;
END
GO

-- 4. Seed areas y niveles por defecto (ejemplo)
-- Asignamos un Codigo como UPPER(SUBSTRING(Nombre, 1, 10))
IF NOT EXISTS (SELECT 1 FROM DefinicionDetalle WHERE DefinicionCodigo = 'AREA' AND Nombre = 'Tecnología')
BEGIN
    INSERT INTO DefinicionDetalle (Codigo, DefinicionCodigo, Nombre, Activo, Orden, CreatedAt) VALUES ('AREA_TEC', 'AREA', 'Tecnología', 1, 1, GETUTCDATE());
    INSERT INTO DefinicionDetalle (Codigo, DefinicionCodigo, Nombre, Activo, Orden, CreatedAt) VALUES ('AREA_RRHH', 'AREA', 'Recursos Humanos', 1, 2, GETUTCDATE());
    INSERT INTO DefinicionDetalle (Codigo, DefinicionCodigo, Nombre, Activo, Orden, CreatedAt) VALUES ('AREA_OPE', 'AREA', 'Operaciones', 1, 3, GETUTCDATE());
    INSERT INTO DefinicionDetalle (Codigo, DefinicionCodigo, Nombre, Activo, Orden, CreatedAt) VALUES ('AREA_EJE', 'AREA', 'Ejecutiva', 1, 4, GETUTCDATE());
    
    INSERT INTO DefinicionDetalle (Codigo, DefinicionCodigo, Nombre, Activo, Orden, CreatedAt) VALUES ('NIV_ANA', 'NIVEL', 'Analista', 1, 1, GETUTCDATE());
    INSERT INTO DefinicionDetalle (Codigo, DefinicionCodigo, Nombre, Activo, Orden, CreatedAt) VALUES ('NIV_DEV', 'NIVEL', 'Desarrollador', 1, 2, GETUTCDATE());
    INSERT INTO DefinicionDetalle (Codigo, DefinicionCodigo, Nombre, Activo, Orden, CreatedAt) VALUES ('NIV_OPE', 'NIVEL', 'Operario', 1, 3, GETUTCDATE());
    INSERT INTO DefinicionDetalle (Codigo, DefinicionCodigo, Nombre, Activo, Orden, CreatedAt) VALUES ('NIV_EJE', 'NIVEL', 'Ejecutivo', 1, 4, GETUTCDATE());
    INSERT INTO DefinicionDetalle (Codigo, DefinicionCodigo, Nombre, Activo, Orden, CreatedAt) VALUES ('NIV_PRA', 'NIVEL', 'Practicante', 1, 5, GETUTCDATE());
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
