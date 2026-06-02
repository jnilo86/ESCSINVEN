# 📥 GUÍA DE IMPORTACIÓN MASIVA CSV - INVENTARIO ESCS v3.0

## Descripción General

El sistema permite importar masivamente datos desde archivos CSV para las siguientes entidades:
- **Activos** (equipos tecnológicos)
- **Responsables** (personas o áreas)
- **Software y Licencias**
- **Componentes Internos**

---

## 📋 Formatos CSV Requeridos

### 1. Importación de Activos

**Nombre del archivo sugerido:** `activos.csv`

**Columnas requeridas:**

| Columna | Obligatoria | Tipo | Descripción | Ejemplo |
|---------|-------------|------|-------------|---------|
| `eqp_code` | ✅ Sí | Texto | Código interno del equipo | `EQP-0001` |
| `serial_number` | ❌ No | Texto | Número de serie del fabricante | `SNC123456` |
| `tipo_activo` | ❌ No | Texto | Tipo de dispositivo | `Notebook`, `Desktop`, `Monitor` |
| `marca` | ❌ No | Texto | Marca del equipo | `Dell`, `HP`, `Lenovo` |
| `modelo` | ❌ No | Texto | Modelo específico | `Latitude 5420` |
| `descripcion` | ❌ No | Texto | Descripción adicional | `Notebook corporativo TI` |
| `estado` | ❌ No | Texto | Estado inicial | `Disponible`, `Asignado`, `En Reparacion` |
| `fecha_compra` | ❌ No | Fecha | Fecha de compra | `2023-01-15` |
| `valor_compra` | ❌ No | Número | Valor en pesos chilenos | `850000` |
| `vida_util_anios` | ❌ No | Número | Años de vida útil | `5` |
| `proveedor_compra` | ❌ No | Texto | Nombre del proveedor | `TecnoChile S.A.` |
| `numero_orden_compra` | ❌ No | Texto | N° de orden de compra | `OC-2023-001` |
| `ubicacion_fisica` | ❌ No | Texto | Ubicación actual | `Bodega Principal`, `Sala A-101` |
| `observado` | ❌ No | Booleano | ¿Requiere atención? | `0` o `1` |

**Estados válidos:**
- `Disponible`
- `Asignado`
- `Prestamo`
- `En Reparacion`
- `Baja`
- `Robado`
- `Obsoleto`
- `Sin Trazabilidad`
- `Merma`

**Ejemplo de archivo CSV:**
```csv
eqp_code,serial_number,tipo_activo,marca,modelo,descripcion,estado,fecha_compra,valor_compra,vida_util_anios,proveedor_compra,numero_orden_compra,ubicacion_fisica,observado
EQP-0001,SNC123456,Notebook,Dell,Latitude 5420,Notebook corporativo departamento TI,Disponible,2023-01-15,850000,5,TecnoChile S.A.,OC-2023-001,Bodega Principal,0
EQP-0002,SNC123457,Desktop,HP,ProDesk 600 G5,Desktop sala de clases,Disponible,2023-02-20,650000,5,CompuMall Ltda,OC-2023-015,Sala A-101,0
EQP-0003,SNC123458,Monitor,LG,24MK430H,Monitor 24 pulgadas,Disponible,2023-03-10,120000,3,Imperio Digital,OC-2023-022,Oficina 204,0
```

---

### 2. Importación de Responsables

**Nombre del archivo sugerido:** `responsables.csv`

**Columnas requeridas:**

| Columna | Obligatoria | Tipo | Descripción | Ejemplo |
|---------|-------------|------|-------------|---------|
| `rut` | ✅ Sí | Texto | RUT de la persona o área | `12.345.678-9` |
| `nombre` | ✅ Sí | Texto | Nombre completo o nombre del área | `Juan Pérez` |
| `cargo` | ❌ No | Texto | Cargo del responsable | `Analista TI` |
| `area_departamento` | ❌ No | Texto | Departamento o área | `TI`, `Administración` |
| `email` | ❌ No | Email | Correo electrónico | `juan.perez@instituto.cl` |
| `telefono` | ❌ No | Texto | Teléfono de contacto | `+56 9 1234 5678` |
| `tipo` | ❌ No | Texto | Tipo de responsable | `Persona`, `Area`, `Sala` |

**Tipos válidos:**
- `Persona`
- `Area`
- `Sala`

**Ejemplo de archivo CSV:**
```csv
rut,nombre,cargo,area_departamento,email,telefono,tipo
12.345.678-9,Juan Pérez González,Analista TI,TI,juan.perez@instituto.cl,+56912345678,Persona
13.456.789-0,María López Silva,Jefe RRHH,RRHH,maria.lopez@instituto.cl,+56987654321,Persona
99.999.999-9,Sala de Profesores,,,sala.profesores@instituto.cl,,Sala
```

---

### 3. Importación de Software y Licencias

**Nombre del archivo sugerido:** `software.csv`

**Columnas requeridas:**

| Columna | Obligatoria | Tipo | Descripción | Ejemplo |
|---------|-------------|------|-------------|---------|
| `nombre_software` | ✅ Sí | Texto | Nombre del software | `Microsoft Office 365` |
| `version` | ❌ No | Texto | Versión del software | `2023`, `Pro Plus` |
| `tipo_licencia` | ❌ No | Texto | Tipo de licencia | `OEM`, `Volumen`, `Suscripción` |
| `clave_producto` | ❌ No | Texto | Product Key (se encriptará) | `XXXXX-XXXXX-XXXXX` |
| `fecha_vencimiento` | ❌ No | Fecha | Fecha de vencimiento | `2024-12-31` |
| `cantidad_total` | ❌ No | Número | Cantidad total de licencias | `50` |
| `cantidad_disponible` | ❌ No | Número | Licencias disponibles | `45` |
| `proveedor` | ❌ No | Texto | Proveedor del software | `Microsoft Chile` |
| `costo_anual` | ❌ No | Número | Costo anual en CLP | `500000` |

**Ejemplo de archivo CSV:**
```csv
nombre_software,version,tipo_licencia,clave_producto,fecha_vencimiento,cantidad_total,cantidad_disponible,proveedor,costo_anual
Microsoft Office 365,2023,Suscripción,,2024-12-31,100,95,Microsft Chile,600000
Windows 11 Pro,OEM,XXXXX-XXXXX,,-,50,48,Falabella S.A.,150000
AutoCAD 2023,2023,Volumen,ACAD-2023-KEY,2024-06-30,20,18,Autodesk,1200000
```

---

### 4. Importación de Componentes Internos

**Nombre del archivo sugerido:** `componentes.csv`

**Columnas requeridas:**

| Columna | Obligatoria | Tipo | Descripción | Ejemplo |
|---------|-------------|------|-------------|---------|
| `eqp_code` | ✅ Sí | Texto | Código del equipo padre | `EQP-0001` |
| `tipo_componente` | ✅ Sí | Texto | Tipo de componente | `RAM`, `SSD`, `HDD`, `Batería` |
| `marca_modelo` | ❌ No | Texto | Marca y modelo del componente | `Kingston HyperX` |
| `serial_componente` | ❌ No | Texto | Serial del componente | `KHX123456` |
| `capacidad` | ❌ No | Texto | Capacidad del componente | `16GB`, `512GB` |
| `observacion` | ❌ No | Texto | Observación o motivo | `Upgrade`, `Reemplazo por falla` |
| `es_original` | ❌ No | Booleano | ¿Es componente original? | `0` o `1` |

**Ejemplo de archivo CSV:**
```csv
eqp_code,tipo_componente,marca_modelo,serial_componente,capacidad,observacion,es_original
EQP-0001,RAM,Kingston HyperX,KHX123456,16GB,Upgrade desde 8GB,0
EQP-0001,SSD,Samsung 970 EVO,S97N12345,512GB,Reemplazo HDD original,0
EQP-0002,RAM,Crucial,CRU987654,8GB,,1
```

---

## 🔧 Uso de la API

### Endpoint de Importación

**URL:** `POST /api/importacion/csv`

**Headers:**
```
Authorization: Bearer <TOKEN_JWT>
Content-Type: multipart/form-data
```

**Body (FormData):**
```
archivo: <archivo.csv>
tipo: "Activos" | "Responsables" | "Software" | "Componentes"
```

**Respuesta Exitosa:**
```json
{
  "success": true,
  "message": "Importación completada exitosamente",
  "data": {
    "id_importacion": 1,
    "total_filas": 100,
    "filas_exitosas": 98,
    "filas_erroneas": 2,
    "errores": [
      {
        "fila": 15,
        "columna": "eqp_code",
        "valor": "",
        "error": "Código EQP es obligatorio"
      }
    ]
  }
}
```

### Consultar Historial de Importaciones

**URL:** `GET /api/importacion/historial?topN=50`

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id_importacion": 1,
      "nombre_archivo": "activos_2024.csv",
      "tipo_importacion": "Activos",
      "fecha_importacion": "2024-01-15T10:30:00",
      "estado": "Completado",
      "total_filas": 100,
      "filas_exitosas": 98,
      "filas_erroneas": 2,
      "duracion_segundos": 3.45,
      "usuario_responsable": "Administrador Sistema"
    }
  ]
}
```

### Consultar Errores de una Importación

**URL:** `GET /api/importacion/errores/:id`

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "numero_fila": 15,
      "columna": "eqp_code",
      "valor_invalido": "",
      "mensaje_error": "Código EQP es obligatorio",
      "datos_fila_completos": "{\"serial_number\":\"SNC999\",\"tipo_activo\":\"Notebook\"}"
    }
  ]
}
```

---

## ⚠️ Consideraciones Importantes

### Validaciones Automáticas

El sistema realiza las siguientes validaciones durante la importación:

1. **Campos Obligatorios**: Verifica que los campos marcados como obligatorios no estén vacíos
2. **Formato de Fechas**: Acepta formatos `YYYY-MM-DD` o `DD/MM/YYYY`
3. **Estados Válidos**: Verifica que los estados correspondan a los valores permitidos
4. **Tipos de Datos**: Valida que números sean numéricos y booleanos sean 0/1 o true/false
5. **Duplicados**: El campo `eqp_code` debe ser único en la base de datos

### Manejo de Errores

- **Errores por Fila**: Cada fila con errores se registra individualmente
- **Importación Parcial**: Las filas válidas se importan aunque otras fallen
- **Reporte Detallado**: Se genera un reporte con número de fila, columna y mensaje de error
- **Auditoría Completa**: Toda importación queda registrada en la tabla `logs_auditoria`

### Límites del Sistema

- **Tamaño Máximo de Archivo**: 10 MB
- **Tipo de Archivo**: Solo `.csv`
- **Codificación**: UTF-8 recomendado
- **Separador**: Coma (`,`)
- **Encabezados**: La primera fila debe contener los nombres de columnas

---

## 📊 Flujo de Trabajo Recomendado

1. **Preparar Datos**: Exportar datos desde sistema heredado o planilla Excel
2. **Limpiar Datos**: Eliminar filas duplicadas, completar campos obligatorios
3. **Guardar como CSV**: Exportar en formato CSV con codificación UTF-8
4. **Validar Formato**: Usar plantilla de ejemplo como referencia
5. **Subir al Sistema**: Usar interfaz web o API
6. **Revisar Resultados**: Verificar reporte de importación
7. **Corregir Errores**: Descargar reporte de errores y corregir CSV
8. **Reintentar**: Volver a subir solo filas corregidas si es necesario

---

## 🛠️ Soporte

Para asistencia con importaciones masivas o problemas técnicos, contactar a:
- **Dirección de TI** - Instituto Profesional Del Comercio Spa.
- Email: ti@instituto.cl
