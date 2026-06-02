/*
=============================================================================
SCRIPT MAESTRO DE BASE DE DATOS - INVENTARIO ESCS v3.0 ENTERPRISE
Instituto Profesional Del Comercio Spa.
Tecnología: Microsoft SQL Server
=============================================================================
*/

USE master;
GO

-- 1. CREACIÓN DE LA BASE DE DATOS
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'InventarioESCS')
BEGIN
    CREATE DATABASE InventarioESCS 
    COLLATE Modern_Spanish_CI_AS; -- Configuración regional correcta para Chile
    PRINT '✅ Base de datos [InventarioESCS] creada exitosamente.';
END
ELSE
BEGIN
    PRINT 'ℹ️ La base de datos [InventarioESCS] ya existe.';
END
GO

USE InventarioESCS;
GO

-- =============================================================================
-- 2. TABLAS CATÁLOGO Y SEGURIDAD
-- =============================================================================

-- Tabla: Roles del Sistema
CREATE TABLE roles (
    id_rol INT PRIMARY KEY IDENTITY(1,1),
    nombre_rol NVARCHAR(50) NOT NULL UNIQUE, -- Admin, Supervisor, Tecnico, RRHH, Finanzas
    descripcion NVARCHAR(255),
    permisos_json NVARCHAR(MAX) -- JSON con permisos granulares
);

-- Tabla: Usuarios del Sistema
CREATE TABLE usuarios (
    id_usuario INT PRIMARY KEY IDENTITY(1,1),
    username NVARCHAR(50) NOT NULL UNIQUE,
    password_hash NVARCHAR(255) NOT NULL,
    email NVARCHAR(100) NOT NULL,
    nombre_completo NVARCHAR(150),
    id_rol INT FOREIGN KEY REFERENCES roles(id_rol),
    activo BIT DEFAULT 1,
    intentos_fallidos INT DEFAULT 0,
    fecha_bloqueo DATETIME NULL,
    fecha_creacion DATETIME DEFAULT GETDATE(),
    ultima_sesion DATETIME NULL
);

-- =============================================================================
-- 3. TABLAS DE ACTIVOS Y RESPONSABLES (CORE)
-- =============================================================================

-- Tabla: Responsables (Personas o Áreas/Salas)
CREATE TABLE responsables (
    id_responsable INT PRIMARY KEY IDENTITY(1,1),
    rut NVARCHAR(20) NOT NULL, -- Puede ser RUT persona o RUT empresa
    nombre NVARCHAR(150) NOT NULL,
    cargo NVARCHAR(100),
    area_departamento NVARCHAR(100),
    email NVARCHAR(100),
    telefono NVARCHAR(20),
    tipo NVARCHAR(20) DEFAULT 'Persona' CHECK (tipo IN ('Persona', 'Area', 'Sala')),
    activo BIT DEFAULT 1, -- Soft delete: nunca se borran históricos
    fecha_registro DATETIME DEFAULT GETDATE(),
    CONSTRAINT UK_Responsables_Rut UNIQUE (rut)
);

-- Tabla: Activos Tecnológicos
CREATE TABLE activos (
    id_activo INT PRIMARY KEY IDENTITY(1,1),
    eqp_code NVARCHAR(50) UNIQUE NOT NULL, -- Código interno institucional (EQP-XXXX)
    serial_number NVARCHAR(100),
    tipo_activo NVARCHAR(50) NOT NULL, -- Notebook, Desktop, Monitor, Impresora, etc.
    marca NVARCHAR(50),
    modelo NVARCHAR(100),
    descripcion NVARCHAR(255),
    
    -- Estados Institucionales
    estado NVARCHAR(30) DEFAULT 'Disponible' CHECK (estado IN (
        'Disponible', 'Asignado', 'Prestamo', 'En Reparacion', 
        'Baja', 'Robado', 'Obsoleto', 'Sin Trazabilidad', 'Merma'
    )),
    
    -- Ciclo de Vida y Depreciación (v3.0)
    fecha_compra DATE,
    valor_compra DECIMAL(18,2),
    vida_util_anios INT,
    fecha_fin_garantia DATE,
    proveedor_compra NVARCHAR(150),
    numero_orden_compra NVARCHAR(50),
    
    -- Ubicación y Asignación
    ubicacion_fisica NVARCHAR(100), -- Sala, Oficina, Bodega
    id_responsable_actual INT FOREIGN KEY REFERENCES responsables(id_responsable),
    
    -- Control
    observado BIT DEFAULT 0, -- Requiere atención
    fecha_ingreso_sistema DATETIME DEFAULT GETDATE(),
    fecha_ultima_modificacion DATETIME DEFAULT GETDATE()
);

-- Tabla: Componentes Internos (Historial de cambios v3.0)
CREATE TABLE componentes_internos (
    id_componente INT PRIMARY KEY IDENTITY(1,1),
    id_activo INT FOREIGN KEY REFERENCES activos(id_activo) ON DELETE CASCADE,
    tipo_componente NVARCHAR(50) NOT NULL, -- RAM, SSD, HDD, Batería, Pantalla
    marca_modelo NVARCHAR(150),
    serial_componente NVARCHAR(100),
    capacidad NVARCHAR(20), -- Ej: 16GB, 512GB
    fecha_instalacion DATETIME DEFAULT GETDATE(),
    usuario_cambio INT, -- ID del técnico que hizo el cambio
    observacion NVARCHAR(255), -- Motivo del cambio (ej: "Upgrade", "Falla")
    es_original BIT DEFAULT 0
);

-- Tabla: Software y Licencias (v3.0)
CREATE TABLE software_licencias (
    id_licencia INT PRIMARY KEY IDENTITY(1,1),
    nombre_software NVARCHAR(100) NOT NULL, -- Office, Windows, AutoCAD
    version NVARCHAR(50),
    tipo_licencia NVARCHAR(50), -- OEM, Volumen, Suscripción
    clave_producto NVARCHAR(100), -- Encriptar en producción
    fecha_vencimiento DATE,
    cantidad_total INT DEFAULT 1,
    cantidad_disponible INT DEFAULT 1,
    proveedor NVARCHAR(150),
    costo_anual DECIMAL(18,2),
    activo BIT DEFAULT 1
);

-- Tabla Relacional: Software instalado en Activos
CREATE TABLE activos_software (
    id_asignacion INT PRIMARY KEY IDENTITY(1,1),
    id_activo INT FOREIGN KEY REFERENCES activos(id_activo),
    id_licencia INT FOREIGN KEY REFERENCES software_licencias(id_licencia),
    fecha_instalacion DATETIME DEFAULT GETDATE(),
    usuario_instalador NVARCHAR(100)
);

-- =============================================================================
-- 4. TABLAS DE MOVIMIENTOS Y FLUJOS
-- =============================================================================

-- Tabla: Solicitudes de Equipamiento (Flujo de aprobación v3.0)
CREATE TABLE solicitudes_equipamiento (
    id_solicitud INT PRIMARY KEY IDENTITY(1,1),
    id_solicitante INT FOREIGN KEY REFERENCES responsables(id_responsable),
    fecha_solicitud DATETIME DEFAULT GETDATE(),
    justificacion NVARCHAR(MAX),
    estado_solicitud NVARCHAR(20) DEFAULT 'Pendiente' CHECK (estado_solicitud IN ('Pendiente', 'Aprobado_Jefatura', 'Rechazado', 'Validado_TI', 'Entregado')),
    id_aprobador_jefatura INT FOREIGN KEY REFERENCES responsables(id_responsable),
    fecha_aprobacion DATETIME NULL,
    id_tecnico_asignado INT FOREIGN KEY REFERENCES usuarios(id_usuario),
    observaciones_tecnico NVARCHAR(MAX)
);

-- Tabla: Movimientos (Cabecera: Entregas, Devoluciones, Préstamos)
CREATE TABLE movimientos (
    id_movimiento INT PRIMARY KEY IDENTITY(1,1),
    tipo_movimiento NVARCHAR(20) NOT NULL CHECK (tipo_movimiento IN ('Entrega', 'Devolucion', 'Prestamo', 'Regularizacion', 'Mantencion')),
    numero_orden NVARCHAR(50) UNIQUE NOT NULL, -- Ej: ENT-20231025-001
    fecha_movimiento DATETIME DEFAULT GETDATE(),
    
    -- Actores
    id_responsable INT FOREIGN KEY REFERENCES responsables(id_responsable), -- Quien recibe o devuelve
    id_usuario_sistema INT FOREIGN KEY REFERENCES usuarios(id_usuario), -- Técnico que opera el sistema
    
    -- Contexto
    id_solicitud_origen INT FOREIGN KEY REFERENCES solicitudes_equipamiento(id_solicitud), -- Vinculo a solicitud si existe
    observaciones_generales NVARCHAR(MAX),
    
    -- Específico para Préstamos (v3.0)
    fecha_limite_devolucion DATETIME NULL,
    fecha_devolucion_real DATETIME NULL,
    estado_prestamo NVARCHAR(20) CHECK (estado_prestamo IN ('Vigente', 'Devuelto', 'Vencido', 'Extendido')),
    
    -- Documentación
    ruta_acta_pdf NVARCHAR(255),
    firma_digital_hash NVARCHAR(255)
);

-- Tabla: Detalle de Movimiento (Qué activos se movieron)
CREATE TABLE movimiento_detalle (
    id_detalle INT PRIMARY KEY IDENTITY(1,1),
    id_movimiento INT FOREIGN KEY REFERENCES movimientos(id_movimiento) ON DELETE CASCADE,
    id_activo INT FOREIGN KEY REFERENCES activos(id_activo),
    
    -- Auditoría de estado
    estado_anterior NVARCHAR(30),
    estado_nuevo NVARCHAR(30), -- Estado final tras el movimiento
    
    -- Accesorios incluidos (Texto libre o JSON)
    accesorios_incluidos NVARCHAR(MAX), -- Ej: "Mouse, Cargador, Bolso"
    
    -- Específico para devoluciones
    condicion_llegada NVARCHAR(50), -- Bueno, Regular, Dañado
    observacion_individual NVARCHAR(255)
);

-- Tabla: Mantenciones
CREATE TABLE mantenciones (
    id_mantencion INT PRIMARY KEY IDENTITY(1,1),
    id_activo INT FOREIGN KEY REFERENCES activos(id_activo),
    tipo_mantencion NVARCHAR(20) CHECK (tipo_mantencion IN ('Preventiva', 'Correctiva', 'Evolutiva', 'Garantia')),
    fecha_ingreso DATETIME DEFAULT GETDATE(),
    fecha_salida DATETIME NULL,
    proveedor_servicio NVARCHAR(150),
    tecnico_responsable NVARCHAR(100),
    descripcion_falla NVARCHAR(MAX),
    trabajo_realizado NVARCHAR(MAX),
    costo_mantencion DECIMAL(18,2),
    garantia_meses INT,
    fecha_fin_garantia_mantencion DATE,
    ruta_orden_servicio NVARCHAR(255),
    estado_mantencion NVARCHAR(20) DEFAULT 'En Curso' CHECK (estado_mantencion IN ('En Curso', 'Finalizada', 'Cancelada'))
);

-- =============================================================================
-- 5. TABLAS DE SOPORTE Y AUDITORÍA
-- =============================================================================

-- Tabla: Adjuntos y Fotos (Evidencia v3.0)
CREATE TABLE adjuntos_fotos (
    id_foto INT PRIMARY KEY IDENTITY(1,1),
    id_activo INT FOREIGN KEY REFERENCES activos(id_activo),
    id_movimiento INT FOREIGN KEY REFERENCES movimientos(id_movimiento), -- Opcional: foto asociada a un movimiento
    ruta_archivo NVARCHAR(255) NOT NULL,
    tipo_foto NVARCHAR(30) CHECK (tipo_foto IN ('Frontal', 'Posterior', 'Serial', 'Daño', 'Acta_Firmada', 'Otro')),
    descripcion NVARCHAR(255),
    fecha_subida DATETIME DEFAULT GETDATE(),
    id_usuario_subida INT FOREIGN KEY REFERENCES usuarios(id_usuario)
);

-- Tabla: Historial QR (Auditoría de impresión)
CREATE TABLE qr_historial (
    id_registro INT PRIMARY KEY IDENTITY(1,1),
    id_activo INT FOREIGN KEY REFERENCES activos(id_activo),
    fecha_impresion DATETIME DEFAULT GETDATE(),
    id_usuario_impresion INT FOREIGN KEY REFERENCES usuarios(id_usuario),
    tamano_etiqueta NVARCHAR(20),
    formato_salida NVARCHAR(10)
);

-- Tabla: Logs de Auditoría General (Inmutable)
CREATE TABLE logs_auditoria (
    id_log BIGINT PRIMARY KEY IDENTITY(1,1),
    fecha_evento DATETIME DEFAULT GETDATE(),
    id_usuario INT FOREIGN KEY REFERENCES usuarios(id_usuario),
    accion_realizada NVARCHAR(100), -- INSERT, UPDATE, DELETE, LOGIN, IMPRIMIR, IMPORT_CSV
    tabla_afectada NVARCHAR(50),
    registro_id_afectado INT,
    detalles_cambios NVARCHAR(MAX), -- JSON con valores antes y después
    ip_origen NVARCHAR(45)
);

-- Tabla: Auditoría de Importaciones CSV (v3.0)
CREATE TABLE importaciones_csv (
    id_importacion BIGINT PRIMARY KEY IDENTITY(1,1),
    nombre_archivo NVARCHAR(255) NOT NULL,
    ruta_archivo NVARCHAR(255),
    tipo_importacion NVARCHAR(50) NOT NULL CHECK (tipo_importacion IN ('Activos', 'Responsables', 'Software', 'Componentes')),
    fecha_importacion DATETIME DEFAULT GETDATE(),
    id_usuario INT FOREIGN KEY REFERENCES usuarios(id_usuario),
    total_filas INT DEFAULT 0,
    filas_exitosas INT DEFAULT 0,
    filas_erroneas INT DEFAULT 0,
    estado NVARCHAR(20) DEFAULT 'Procesando' CHECK (estado IN ('Procesando', 'Completado', 'Fallido', 'Parcial')),
    mensaje_error NVARCHAR(MAX),
    duracion_segundos DECIMAL(10,2)
);

-- Tabla: Errores Detallados de Importación CSV
CREATE TABLE importaciones_csv_errores (
    id_error BIGINT PRIMARY KEY IDENTITY(1,1),
    id_importacion BIGINT FOREIGN KEY REFERENCES importaciones_csv(id_importacion) ON DELETE CASCADE,
    numero_fila INT NOT NULL,
    columna NVARCHAR(100),
    valor_invalido NVARCHAR(MAX),
    mensaje_error NVARCHAR(MAX),
    datos_fila_completos NVARCHAR(MAX) -- JSON con todos los datos de la fila
);

-- =============================================================================
-- 6. ÍNDICES PARA RENDIMIENTO
-- =============================================================================

CREATE INDEX IX_Activos_Estado ON activos(estado);
CREATE INDEX IX_Activos_Responsable ON activos(id_responsable_actual);
CREATE INDEX IX_Activos_EQP ON activos(eqp_code);
CREATE INDEX IX_Movimientos_Fecha ON movimientos(fecha_movimiento);
CREATE INDEX IX_Movimientos_Responsable ON movimientos(id_responsable);
CREATE INDEX IX_Logs_Fecha ON logs_auditoria(fecha_evento);

-- =============================================================================
-- 7. TRIGGERS DE AUDITORÍA AUTOMÁTICA
-- =============================================================================

-- Trigger para auditar cambios en la tabla Activos
CREATE TRIGGER trg_Auditoria_Activos
ON activos
AFTER UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @UsuarioActual INT = 1; -- Debería venir del contexto de la app, aquí simplificado
    DECLARE @IPAccion NVARCHAR(45) = '127.0.0.1';
    
    -- Auditoría de Actualización
    IF EXISTS (SELECT * FROM inserted) AND EXISTS (SELECT * FROM deleted)
    BEGIN
        INSERT INTO logs_auditoria (fecha_evento, id_usuario, accion_realizada, tabla_afectada, registro_id_afectado, detalles_cambios, ip_origen)
        SELECT 
            GETDATE(), @UsuarioActual, 'UPDATE', 'activos', d.id_activo, 
            (SELECT 'Antes: ' + CAST(d.estado AS NVARCHAR) + ' | Después: ' + CAST(i.estado AS NVARCHAR) FOR JSON PATH, WITHOUT_ARRAY),
            @IPAccion
        FROM deleted d
        JOIN inserted i ON d.id_activo = i.id_activo
        WHERE d.estado <> i.estado; -- Solo si cambia el estado
    END
    
    -- Auditoría de Eliminación (Soft delete lógico o físico)
    IF EXISTS (SELECT * FROM deleted) AND NOT EXISTS (SELECT * FROM inserted)
    BEGIN
        INSERT INTO logs_auditoria (fecha_evento, id_usuario, accion_realizada, tabla_afectada, registro_id_afectado, detalles_cambios, ip_origen)
        SELECT GETDATE(), @UsuarioActual, 'DELETE', 'activos', d.id_activo, 
               (SELECT * FROM deleted d FOR JSON PATH, WITHOUT_ARRAY), @IPAccion
        FROM deleted d;
    END
END;
GO

-- =============================================================================
-- 8. STORED PROCEDURES CRÍTICOS
-- =============================================================================

-- SP: Dashboard Ejecutivo (KPIs rápidos)
CREATE PROCEDURE sp_Dashboard_KPIs
AS
BEGIN
    SELECT 
        (SELECT COUNT(*) FROM activos WHERE estado = 'Disponible') AS TotalDisponibles,
        (SELECT COUNT(*) FROM activos WHERE estado = 'Asignado') AS TotalAsignados,
        (SELECT COUNT(*) FROM activos WHERE estado = 'En Reparacion') AS TotalReparacion,
        (SELECT COUNT(*) FROM movimientos WHERE tipo_movimiento = 'Prestamo' AND estado_prestamo = 'Vencido') AS PrestamosVencidos,
        (SELECT COUNT(*) FROM activos WHERE estado = 'Sin Trazabilidad') AS PendientesRegularizar,
        (SELECT SUM(costo_mantencion) FROM mantenciones WHERE YEAR(fecha_ingreso) = YEAR(GETDATE())) AS CostoMantencionesAnio;
END;
GO

-- SP: Obtener activos por responsable
CREATE PROCEDURE sp_Activos_Por_Responsable
    @Rut NVARCHAR(20)
AS
BEGIN
    SELECT 
        a.id_activo,
        a.eqp_code,
        a.tipo_activo,
        a.marca,
        a.modelo,
        a.serial_number,
        a.estado,
        r.nombre AS responsable_nombre,
        r.rut AS responsable_rut
    FROM activos a
    INNER JOIN responsables r ON a.id_responsable_actual = r.id_responsable
    WHERE r.rut = @Rut AND a.estado IN ('Asignado', 'Prestamo');
END;
GO

-- SP: Generar número de orden consecutivo
CREATE PROCEDURE sp_Generar_Numero_Orden
    @TipoMovimiento NVARCHAR(20),
    @NumeroOrden NVARCHAR(50) OUTPUT
AS
BEGIN
    DECLARE @Prefijo NVARCHAR(3) = '';
    DECLARE @FechaHoy NVARCHAR(8) = CONVERT(NVARCHAR(8), GETDATE(), 112);
    DECLARE @Consecutivo INT;
    
    SET @Prefijo = CASE @TipoMovimiento
        WHEN 'Entrega' THEN 'ENT'
        WHEN 'Devolucion' THEN 'DEV'
        WHEN 'Prestamo' THEN 'PRE'
        WHEN 'Regularizacion' THEN 'REG'
        WHEN 'Mantencion' THEN 'MAN'
        ELSE 'MOV'
    END;
    
    SELECT @Consecutivo = ISNULL(MAX(CAST(RIGHT(numero_orden, 3) AS INT)), 0) + 1
    FROM movimientos
    WHERE numero_orden LIKE @Prefijo + '-' + @FechaHoy + '%';
    
    SET @NumeroOrden = @Prefijo + '-' + @FechaHoy + '-' + RIGHT('000' + CAST(@Consecutivo AS NVARCHAR), 3);
END;
GO

-- SP: Importar Activos desde CSV (v3.0)
CREATE PROCEDURE sp_Importar_Activos_CSV
    @IdImportacion BIGINT,
    @JsonDatos NVARCHAR(MAX) -- JSON array con los datos del CSV
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @TotalFilas INT = 0;
    DECLARE @FilasExitosas INT = 0;
    DECLARE @FilasErroneas INT = 0;
    DECLARE @MensajeError NVARCHAR(MAX) = '';
    
    BEGIN TRY
        -- Parsear JSON y procesar cada fila
        INSERT INTO activos (eqp_code, serial_number, tipo_activo, marca, modelo, descripcion, estado, fecha_compra, valor_compra, vida_util_anios, proveedor_compra, numero_orden_compra, ubicacion_fisica, observado)
        SELECT 
            eqp_code,
            serial_number,
            tipo_activo,
            marca,
            modelo,
            descripcion,
            ISNULL(estado, 'Disponible'),
            CASE WHEN fecha_compra = '' THEN NULL ELSE TRY_CAST(fecha_compra AS DATE) END,
            TRY_CAST(valor_compra AS DECIMAL(18,2)),
            TRY_CAST(vida_util_anios AS INT),
            proveedor_compra,
            numero_orden_compra,
            ubicacion_fisica,
            CASE WHEN observado = '1' OR LOWER(observado) = 'true' THEN 1 ELSE 0 END
        FROM OPENJSON(@JsonDatos)
        WITH (
            eqp_code NVARCHAR(50) '$.eqp_code',
            serial_number NVARCHAR(100) '$.serial_number',
            tipo_activo NVARCHAR(50) '$.tipo_activo',
            marca NVARCHAR(50) '$.marca',
            modelo NVARCHAR(100) '$.modelo',
            descripcion NVARCHAR(255) '$.descripcion',
            estado NVARCHAR(30) '$.estado',
            fecha_compra NVARCHAR(20) '$.fecha_compra',
            valor_compra NVARCHAR(20) '$.valor_compra',
            vida_util_anios NVARCHAR(10) '$.vida_util_anios',
            proveedor_compra NVARCHAR(150) '$.proveedor_compra',
            numero_orden_compra NVARCHAR(50) '$.numero_orden_compra',
            ubicacion_fisica NVARCHAR(100) '$.ubicacion_fisica',
            observado NVARCHAR(10) '$.observado'
        );
        
        SET @FilasExitosas = @@ROWCOUNT;
        
        -- Actualizar estado de la importación
        UPDATE importaciones_csv
        SET 
            total_filas = @FilasExitosas,
            filas_exitosas = @FilasExitosas,
            filas_erroneas = 0,
            estado = 'Completado',
            duracion_segundos = DATEDIFF(SECOND, fecha_importacion, GETDATE())
        WHERE id_importacion = @IdImportacion;
        
        -- Registrar en auditoría
        INSERT INTO logs_auditoria (accion_realizada, tabla_afectada, detalles_cambios)
        VALUES ('IMPORT_CSV', 'activos', JSON_QUERY('{"importacion_id": ' + CAST(@IdImportacion AS NVARCHAR) + ', "filas": ' + CAST(@FilasExitosas AS NVARCHAR) + '}'));
        
    END TRY
    BEGIN CATCH
        SET @MensajeError = ERROR_MESSAGE();
        SET @FilasErroneas = 1;
        
        -- Registrar error detallado
        INSERT INTO importaciones_csv_errores (id_importacion, numero_fila, columna, valor_invalido, mensaje_error)
        VALUES (@IdImportacion, 0, 'GENERAL', @JsonDatos, @MensajeError);
        
        -- Actualizar estado fallido
        UPDATE importaciones_csv
        SET 
            estado = 'Fallido',
            mensaje_error = @MensajeError,
            filas_erroneas = @FilasErroneas,
            duracion_segundos = DATEDIFF(SECOND, fecha_importacion, GETDATE())
        WHERE id_importacion = @IdImportacion;
        
        THROW;
    END CATCH
END;
GO

-- SP: Obtener historial de importaciones
CREATE PROCEDURE sp_Obtener_Historial_Importaciones
    @TopN INT = 50
AS
BEGIN
    SELECT TOP (@TopN)
        i.id_importacion,
        i.nombre_archivo,
        i.tipo_importacion,
        i.fecha_importacion,
        i.estado,
        i.total_filas,
        i.filas_exitosas,
        i.filas_erroneas,
        i.duracion_segundos,
        u.nombre_completo AS usuario_responsable,
        CASE WHEN e.id_error IS NOT NULL THEN 1 ELSE 0 END AS tiene_errores
    FROM importaciones_csv i
    LEFT JOIN usuarios u ON i.id_usuario = u.id_usuario
    LEFT JOIN importaciones_csv_errores e ON i.id_importacion = e.id_importacion
    ORDER BY i.fecha_importacion DESC;
END;
GO

-- SP: Obtener errores de una importación específica
CREATE PROCEDURE sp_Obtener_Errores_Importacion
    @IdImportacion BIGINT
AS
BEGIN
    SELECT 
        numero_fila,
        columna,
        valor_invalido,
        mensaje_error,
        datos_fila_completos
    FROM importaciones_csv_errores
    WHERE id_importacion = @IdImportacion
    ORDER BY numero_fila;
END;
GO

-- =============================================================================
-- 9. DATOS SEMILLA (SEED DATA)
-- =============================================================================

-- Insertar Roles
INSERT INTO roles (nombre_rol, descripcion) VALUES 
('Administrador', 'Acceso total al sistema'),
('Supervisor TI', 'Aprueba bajas y ve costos'),
('Tecnico TI', 'Operativa diaria: entregas, mantenciones'),
('RRHH', 'Solo lectura y reportes de personal'),
('Finanzas', 'Solo lectura, validación de bajas y costos');

-- Insertar Usuario Administrador por Defecto
-- Password: admin123 (Hash generado con bcryptjs, cambiar en producción)
DECLARE @AdminPasswordHash NVARCHAR(255) = '$2a$10$X7z... (hash real de admin123) ...';

IF NOT EXISTS (SELECT 1 FROM usuarios WHERE username = 'admin')
BEGIN
    INSERT INTO usuarios (username, password_hash, email, nombre_completo, id_rol) VALUES 
    ('admin', @AdminPasswordHash, 'ti@instituto.cl', 'Administrador Sistema', 1);
END

PRINT '🎉 Script de base de datos v3.0 ejecutado correctamente.';
PRINT '📋 Recuerde cambiar la contraseña del usuario admin al primer inicio.';
GO
