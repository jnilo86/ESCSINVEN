# 🏛️ SISTEMA DE INVENTARIO ESCS v3.0 ENTERPRISE

**Instituto Profesional Del Comercio Spa.**

Sistema integral de gestión patrimonial TI para el control, seguimiento y auditoría de activos tecnológicos institucionales.

---

## 📋 Tabla de Contenidos

- [Características Principales](#-características-principales)
- [Stack Tecnológico](#-stack-tecnológico)
- [Requisitos del Sistema](#-requisitos-del-sistema)
- [Instalación Rápida](#-instalación-rápida)
- [Configuración](#-configuración)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Base de Datos](#-base-de-datos)
- [API Endpoints](#-api-endpoints)
- [Seguridad](#-seguridad)
- [Despliegue en IIS](#-despliegue-en-iis)

---

## ✨ Características Principales

### Módulo de Activos
- Gestión completa de activos tecnológicos (notebooks, desktops, monitores, etc.)
- Control de ciclo de vida: compra, garantía, depreciación
- Estados: Disponible, Asignado, Préstamo, En Reparación, Baja, etc.
- Componentes internos con historial de cambios (RAM, SSD, etc.)

### Movimientos y Trazabilidad
- Entregas con acta PDF oficial
- Devoluciones con estado final por ítem
- Préstamos temporales con fecha límite y alertas de vencimiento
- Regularización de activos históricos

### Importación Masiva CSV (NUEVO v3.0)
- Carga masiva de activos desde archivos CSV
- Importación de responsables, software y componentes
- Validación automática de datos y formatos
- Reporte detallado de errores por fila
- Auditoría completa de cada importación
- Plantillas CSV incluidas en `/docs/csv_templates/`

### Documentación Automática
- Generación de actas de entrega/devolución en PDF
- Códigos QR para etiquetado de activos
- Historial de impresión de etiquetas

### Dashboard Ejecutivo
- KPIs en tiempo real
- Gráficos de distribución por estado
- Alertas de préstamos vencidos
- Activos próximos a fin de garantía

### Seguridad y Auditoría
- Roles granulares: Administrador, Supervisor TI, Técnico, RRHH, Finanzas
- Logs inmutables de todas las operaciones
- Autenticación JWT con bcrypt

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| **Frontend** | React 18 + Vite + TypeScript + TailwindCSS + Material UI |
| **Backend** | Node.js + Express + TypeScript |
| **Base de Datos** | Microsoft SQL Server (T-SQL, Stored Procedures, Triggers) |
| **Servidor Web** | IIS (Reverse Proxy o iisnode) |
| **Librerías Clave** | pdfkit, qrcode, mssql, bcryptjs, jsonwebtoken, multer |

---

## 💻 Requisitos del Sistema

### Mínimos
- Windows Server 2016 o superior
- 4 GB RAM
- 50 GB disco libre
- .NET Core Runtime 8.0
- Node.js 20.x LTS

### Base de Datos
- SQL Server 2016+ (Express o superior)
- Collation: Modern_Spanish_CI_AS

---

## 🚀 Instalación Rápida

### Método Automático (Recomendado)

1. Descargue el código fuente
2. Ejecute como administrador:
   ```batch
   install\instalar_completo.bat
   ```
3. Responda S/N a las preguntas del instalador
4. Configure `backend\.env` con sus credenciales
5. Inicie el servidor:
   ```batch
   cd backend
   npm start
   ```

### Instalación Manual

#### 1. Backend
```bash
cd backend
npm install
copy .env.example .env
# Edite .env con sus credenciales
npm run build
npm start
```

#### 2. Frontend
```bash
cd frontend
npm install
npm run build
# Los archivos compilados estarán en frontend/dist
```

#### 3. Base de Datos
```sql
-- Ejecute en SQL Server Management Studio
USE master;
GO
-- Ejecute el contenido de database/01_master_database.sql
```

---

## ⚙️ Configuración

### Variables de Entorno (backend/.env)

```env
# Servidor
PORT=5000
NODE_ENV=production

# Base de Datos
DB_SERVER=localhost
DB_PORT=1433
DB_NAME=InventarioESCS
DB_USER=inventario_user
DB_PASSWORD=TuPasswordSeguro123!
DB_ENCRYPT=false
DB_TRUST_CERT=true

# Seguridad
JWT_SECRET=TU_CLAVE_SECRETA_MUY_SEGURA_CAMBIAR_EN_PRODUCCION
JWT_EXPIRES_IN=8h
BCRYPT_ROUNDS=10

# CORS
CORS_ORIGIN=https://inventario.instituto.cl
```

---

## 📁 Estructura del Proyecto

```
inventario-escs/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuración DB, constantes
│   │   ├── controllers/     # Lógica de negocio
│   │   ├── middleware/      # Auth, validadores
│   │   ├── models/          # Tipos TypeScript
│   │   ├── routes/          # Endpoints API
│   │   ├── services/        # Servicios DB, PDF, QR
│   │   └── server.ts        # Punto de entrada
│   ├── uploads/             # Archivos subidos
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Componentes React reutilizables
│   │   ├── pages/           # Vistas principales
│   │   ├── hooks/           # Custom hooks
│   │   ├── services/        # llamadas API
│   │   ├── context/         # Estado global
│   │   └── types/           # Tipos TypeScript
│   ├── index.html
│   └── package.json
├── database/
│   └── 01_master_database.sql
├── install/
│   └── instalar_completo.bat
├── docs/                    # Documentación adicional
└── README.md
```

---

## 🗄️ Base de Datos

### Tablas Principales

| Tabla | Descripción |
|-------|-------------|
| `activos` | Activos tecnológicos con ciclo de vida completo |
| `responsables` | Personas o áreas asignatarias (soft delete) |
| `movimientos` | Cabecera de entregas, devoluciones, préstamos |
| `movimiento_detalle` | Detalle de activos por movimiento |
| `componentes_internos` | Historial de cambios de piezas internas |
| `solicitudes_equipamiento` | Flujo de aprobación de solicitudes |
| `mantenciones` | Órdenes de servicio preventivo/correctivo |
| `software_licencias` | Control de licencias de software |
| `adjuntos_fotos` | Fotos y evidencia documental |
| `logs_auditoria` | Registro inmutable de operaciones |
| `qr_historial` | Auditoría de impresión de etiquetas |
| `importaciones_csv` | Auditoría de importaciones masivas (NUEVO) |
| `importaciones_csv_errores` | Errores detallados por fila (NUEVO) |

### Stored Procedures Clave

- `sp_Dashboard_KPIs`: Indicadores ejecutivos
- `sp_Activos_Por_Responsable`: Activos asignados a un RUT
- `sp_Generar_Numero_Orden`: Consecutivo de movimientos
- `sp_Importar_Activos_CSV`: Importación masiva desde JSON (NUEVO)
- `sp_Obtener_Historial_Importaciones`: Consulta historial CSV (NUEVO)
- `sp_Obtener_Errores_Importacion`: Obtiene errores por importación (NUEVO)

### Triggers de Auditoría

- `trg_Auditoria_Activos`: Log automático de cambios en activos

---

## 🔌 API Endpoints

### Autenticación
```
POST   /api/auth/login              - Iniciar sesión
GET    /api/auth/me                 - Usuario actual
GET    /api/auth/test               - Test de autenticación
```

### Dashboard
```
GET    /api/dashboard/kpis                  - KPIs ejecutivos
GET    /api/dashboard/activos-por-estado    - Distribución por estado
GET    /api/dashboard/prestamos-vencidos    - Préstamos vencidos
GET    /api/dashboard/activos-proximo-fin-garantia
GET    /api/dashboard/movimientos-recientes
```

### Activos (CRUD completo en implementación)
```
GET    /api/activos                 - Listar activos (paginado)
GET    /api/activos/:id             - Obtener activo por ID
POST   /api/activos                 - Crear activo
PUT    /api/activos/:id             - Actualizar activo
DELETE /api/activos/:id             - Eliminar activo (lógico)
```

### Movimientos
```
GET    /api/movimientos             - Listar movimientos
POST   /api/movimientos/entrega     - Registrar entrega
POST   /api/movimientos/devolucion  - Registrar devolución
POST   /api/movimientos/prestamo    - Registrar préstamo
```

### Importación CSV (NUEVO)
```
POST   /api/importacion/csv         - Subir y procesar archivo CSV
GET    /api/importacion/historial   - Obtener historial de importaciones
GET    /api/importacion/errores/:id - Obtener errores de importación
POST   /api/importacion/reintentar/:id - Reintentar importación fallida
```

---

## 🔒 Seguridad

### Roles del Sistema

| Rol | Permisos |
|-----|----------|
| Administrador | Acceso total |
| Supervisor TI | Aprueba bajas, ve costos |
| Técnico TI | Operativa diaria |
| RRHH | Solo lectura |
| Finanzas | Lectura, validación de bajas |

### Medidas de Seguridad

- ✅ Passwords hasheados con bcrypt (10 rounds)
- ✅ Tokens JWT con expiración configurable
- ✅ Protección contra inyección SQL (parameterized queries)
- ✅ Validación de tipos de archivo (magic numbers)
- ✅ Rate limiting en endpoints críticos
- ✅ Helmet.js para cabeceras HTTP seguras
- ✅ CORS configurado por origen

---

## 🌐 Despliegue en IIS

### Opción 1: Reverse Proxy (Recomendada)

1. Instale módulo URL Rewrite en IIS
2. Cree sitio web apuntando a `frontend/dist`
3. Configure regla de rewrite para `/api/*` hacia `http://localhost:5000`

### Opción 2: iisnode

1. Instale iisnode desde https://github.com/Azure/iisnode
2. Configure application pool en modo integrado
3. El archivo `server.ts` compilado se ejecuta nativamente

### Configuración de Application Pool

```
Nombre: InventarioESCSAppPool
.NET CLR Version: v4.0
Managed Pipeline Mode: Integrated
Identity: ApplicationPoolIdentity (o usuario específico)
```



---

## 📝 Licencia

© 2026 Instituto Profesional Del Comercio Spa.  
Todos los derechos reservados. Uso interno institucional.

---

**Versión:** 3.0 Enterprise  
**Última actualización:** Enero 2024
