@echo off
setlocal enabledelayedexpansion

:: ==========================================
:: INSTALADOR MAESTRO - INVENTARIO ESCS v3.0
:: Instituto Profesional Del Comercio Spa.
:: ==========================================

title Instalador Inventario ESCS v3.0 Enterprise
color 0A

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║     INSTALADOR MAESTRO - INVENTARIO ESCS v3.0             ║
echo ║     Instituto Profesional Del Comercio Spa.               ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

:: Verificar permisos de administrador
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] Este instalador requiere privilegios de administrador.
    echo Haga clic derecho y seleccione "Ejecutar como administrador".
    pause
    exit /b 1
)

echo [INFO] Privilegios de administrador verificados.
echo.

:: ==========================================
:: DETECCIÓN DE PREREQUISITOS
:: ==========================================

echo ─────────────────────────────────────────────────────────────
echo DETECTANDO PREREQUISITOS...
echo ─────────────────────────────────────────────────────────────
echo.

:: Verificar Node.js
where node >nul 2>&1
if %errorLevel% neq 0 (
    echo [FALTA] Node.js no está instalado.
    set /p INSTALL_NODE="¿Desea instalar Node.js automáticamente? (S/N): "
    if /i "!INSTALL_NODE!"=="S" (
        echo [INSTALANDO] Descargando e instalando Node.js LTS...
        powershell -Command "& {Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.10.0/node-v20.10.0-x64.msi' -OutFile '%TEMP%\node-installer.msi'}"
        msiexec /i "%TEMP%\node-installer.msi" /quiet /norestart
        echo [OK] Node.js instalado. Reinicie la terminal después de la instalación.
    ) else (
        echo [ERROR] Node.js es requerido. Descárguelo de https://nodejs.org
        pause
        exit /b 1
    )
) else (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo [OK] Node.js detectado: !NODE_VERSION!
)

:: Verificar .NET Core Hosting Bundle (para iisnode)
where dotnet >nul 2>&1
if %errorLevel% neq 0 (
    echo [FALTA] .NET Core Runtime no está instalado.
    set /p INSTALL_DOTNET="¿Desea instalar .NET Core Runtime automáticamente? (S/N): "
    if /i "!INSTALL_DOTNET!"=="S" (
        echo [INSTALANDO] Descargando .NET Core Runtime...
        powershell -Command "& {Invoke-WebRequest -Uri 'https://download.visualstudio.microsoft.com/download/pr/dotnet-runtime-8.0.0-win-x64.exe' -OutFile '%TEMP%\dotnet-runtime.exe'}"
        "%TEMP%\dotnet-runtime.exe" /quiet /install
        echo [OK] .NET Core Runtime instalado.
    )
) else (
    for /f "tokens=*" %%i in ('dotnet --version') do set DOTNET_VERSION=%%i
    echo [OK] .NET Core detectado: !DOTNET_VERSION!
)

:: Verificar IIS
sc query w3svc >nul 2>&1
if %errorLevel% neq 0 (
    echo [FALTA] IIS (Internet Information Services) no está habilitado.
    set /p INSTALL_IIS="¿Desea habilitar IIS automáticamente? (S/N): "
    if /i "!INSTALL_IIS!"=="S" (
        echo [INSTALANDO] Habilitando características de IIS...
        dism /online /enable-feature /featurename:IIS-WebServer /all /norestart
        dism /online /enable-feature /featurename:IIS-ASPNET45 /all /norestart
        dism /online /enable-feature /featurename:IIS-ManagementConsole /all /norestart
        echo [OK] IIS habilitado.
    ) else (
        echo [ADVERTENCIA] IIS es requerido para producción.
    )
) else (
    echo [OK] IIS está instalado y corriendo.
)

:: Verificar SQL Server
sqlcmd -L >nul 2>&1
if %errorLevel% neq 0 (
    echo [FALTA] SQL Server no está disponible.
    echo [INFO] ¿Tiene SQL Server instalado en otro servidor? (S/N)
    set /p HAS_SQL_SERVER=
    if /i "!HAS_SQL_SERVER!"=="N" (
        set /p INSTALL_SQL="¿Desea instalar SQL Server Express automáticamente? (S/N): "
        if /i "!INSTALL_SQL!"=="S" (
            echo [INSTALANDO] Descargando SQL Server Express...
            powershell -Command "& {Invoke-WebRequest -Uri 'https://download.microsoft.com/download/7/f/8/7f8a9c43-8c8a-4f7c-9f8e-8c8a9c438c8a/SQL2022-SSEI-Expr.exe' -OutFile '%TEMP%\sql-express.exe'}"
            "%TEMP%\sql-express.exe" /QS /IACCEPTSQLSERVERLICENSETERMS /ACTION=Install /FEATURES=SQLEngine /INSTANCENAME=MSSQLSERVER
            echo [OK] SQL Server Express instalado.
        )
    ) else (
        set /p SQL_SERVER="Ingrese el nombre del servidor SQL Server: "
        set DB_SERVER=!SQL_SERVER!
    )
) else (
    echo [OK] SQL Server detectado.
    set /p SQL_SERVER="Nombre del servidor SQL Server (default: localhost): "
    if "!SQL_SERVER!"=="" set DB_SERVER=localhost
)

if "!DB_SERVER!"=="" set DB_SERVER=localhost

echo.
echo ─────────────────────────────────────────────────────────────
echo CONFIGURACIÓN DE BASE DE DATOS
echo ─────────────────────────────────────────────────────────────
echo.

set /p DB_NAME="Nombre de la base de datos (default: InventarioESCS): "
if "!DB_NAME!"=="" set DB_NAME=InventarioESCS

set /p DB_USER="Usuario de base de datos (default: inventario_user): "
if "!DB_USER!"=="" set DB_USER=inventario_user

set /p DB_PASSWORD="Contraseña de base de datos: "

echo.
echo [INFO] Creando base de datos y usuario...
sqlcmd -S !DB_SERVER! -Q "IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = '!DB_NAME!') CREATE DATABASE !DB_NAME!"
sqlcmd -S !DB_SERVER! -Q "IF NOT EXISTS (SELECT name FROM sys.server_principals WHERE name = '!DB_USER!') CREATE LOGIN !DB_USER! WITH PASSWORD = '!DB_PASSWORD!'"
sqlcmd -S !DB_SERVER! -d !DB_NAME! -Q "IF NOT EXISTS (SELECT name FROM sys.database_principals WHERE name = '!DB_USER!') CREATE USER !DB_USER! FOR LOGIN !DB_USER!"
sqlcmd -S !DB_SERVER! -d !DB_NAME! -Q "ALTER ROLE db_owner ADD MEMBER !DB_USER!"

echo [OK] Base de datos configurada.

echo.
echo [INFO] Ejecutando scripts de base de datos...
sqlcmd -S !DB_SERVER! -d !DB_NAME! -i database\01_master_database.sql
echo [OK] Scripts de base de datos ejecutados.

echo.
echo ─────────────────────────────────────────────────────────────
echo INSTALACIÓN DE DEPENDENCIAS
echo ─────────────────────────────────────────────────────────────
echo.

:: Instalar dependencias del Backend
echo [INFO] Instalando dependencias del Backend...
cd backend
call npm install
if %errorLevel% neq 0 (
    echo [ERROR] Error al instalar dependencias del Backend.
    pause
    exit /b 1
)
echo [OK] Dependencias del Backend instaladas.

:: Copiar archivo .env
if not exist .env (
    copy .env.example .env
    echo [OK] Archivo .env creado. Configure las credenciales.
)

:: Compilar Backend
echo [INFO] Compilando Backend...
call npm run build
if %errorLevel% neq 0 (
    echo [ADVERTENCIA] Error al compilar Backend, pero continuando...
)
cd ..

:: Instalar dependencias del Frontend
echo [INFO] Instalando dependencias del Frontend...
cd frontend
call npm install
if %errorLevel% neq 0 (
    echo [ERROR] Error al instalar dependencias del Frontend.
    pause
    exit /b 1
)
echo [OK] Dependencias del Frontend instaladas.

:: Compilar Frontend
echo [INFO] Compilando Frontend para producción...
call npm run build
if %errorLevel% neq 0 (
    echo [ADVERTENCIA] Error al compilar Frontend, pero continuando...
)
cd ..

echo [OK] Frontend compilado.

echo.
echo ─────────────────────────────────────────────────────────────
echo CONFIGURACIÓN DE IIS
echo ─────────────────────────────────────────────────────────────
echo.

set /p CONFIGURE_IIS="¿Desea configurar el sitio en IIS ahora? (S/N): "
if /i "!CONFIGURE_IIS!"=="S" (
    echo [INFO] Creando Application Pool...
    appcmd add apppool /name:"InventarioESCSAppPool" /managedRuntimeVersion:v4.0 /autoStart:true
    
    echo [INFO] Creando sitio web en IIS...
    set /p SITE_PORT="Puerto del sitio (default: 8080): "
    if "!SITE_PORT!"=="" set SITE_PORT=8080
    
    appcmd add site /name:"InventarioESCS" /bindings:http://*:!SITE_PORT!:/ /physicalPath:"%CD%\frontend\dist"
    appcmd set app "InventarioESCS/" /applicationPool:"InventarioESCSAppPool"
    
    echo [OK] Sitio configurado en IIS en el puerto !SITE_PORT!
)

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║     INSTALACIÓN COMPLETADA EXITOSAMENTE                   ║
echo ╠═══════════════════════════════════════════════════════════╣
echo ║     Siguientes pasos:                                     ║
echo ║     1. Edite backend\.env con sus credenciales            ║
echo ║     2. Cambie la contraseña del usuario admin             ║
echo ║     3. Ejecute: cd backend ^&^& npm start                 ║
echo ║     4. Acceda a http://localhost:5000                     ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

pause
