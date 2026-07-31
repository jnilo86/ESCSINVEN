# 🐳 Guía de Instalación con Docker - Inventario ESCS v3.0

Esta guía explica cómo desplegar el sistema en un servidor Ubuntu utilizando Docker y Docker Compose.

## 📋 Requisitos Previos

- Ubuntu Server 20.04 o superior
- Docker 24.x o superior
- Docker Compose 2.x o superior
- Mínimo 4 GB RAM (8 GB recomendado)
- 50 GB de espacio en disco

---

## 🚀 Instalación Paso a Paso

### 1. Instalar Docker y Docker Compose

```bash
# Actualizar paquetes
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Agregar usuario al grupo docker (opcional, para evitar usar sudo)
sudo usermod -aG docker $USER

# Instalar Docker Compose Plugin
sudo apt-get install docker-compose-plugin -y

# Verificar instalación
docker --version
docker compose version
```

### 2. Clonar/Descargar el Proyecto

```bash
# Navegar al directorio del proyecto
cd /workspace

# Si usas git:
# git clone <tu-repositorio> .
```

### 3. Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar con tus valores (RECOMENDADO cambiar contraseñas)
nano .env
```

**Variables importantes a configurar:**
- `DB_SA_PASSWORD`: Contraseña del administrador de SQL Server
- `JWT_SECRET`: Clave secreta para tokens JWT (usar una cadena larga y aleatoria)

### 4. Iniciar los Contenedores

```bash
# Construir e iniciar todos los servicios
docker compose up -d --build

# Ver logs en tiempo real (opcional)
docker compose logs -f
```

### 5. Verificar Estado

```bash
# Ver contenedores corriendo
docker compose ps

# Ver logs específicos
docker compose logs db
docker compose logs backend
docker compose logs frontend
```

---

## 🌐 Acceso al Sistema

Una vez iniciado:

| Servicio | URL | Descripción |
|----------|-----|-------------|
| **Frontend** | http://tu-servidor:8080/ | Interfaz web del sistema |
| **Backend API** | http://tu-servidor:8080/api | API REST |
| **SQL Server** | localhost:1433 | Base de datos (solo acceso interno) |

> **Nota:** El puerto por defecto es `8080` para evitar conflictos con otros servicios. Puedes cambiarlo editando `APP_PORT` en el archivo `.env`.

---

## 🔌 Configuración de Puertos

El sistema usa el puerto **8080** por defecto para evitar conflictos con otros servicios.

### Cambiar el Puerto

1. Edita el archivo `.env`:
   ```bash
   nano .env
   ```

2. Modifica la variable `APP_PORT`:
   ```env
   APP_PORT=9000
   ```

3. Reinicia los contenedores:
   ```bash
   docker compose down
   docker compose up -d
   ```

4. Accede usando el nuevo puerto: `http://tu-servidor:9000/`

### Verificar Puertos en Uso

Antes de elegir un puerto, verifica cuáles están ocupados:
```bash
sudo netstat -tulpn | grep LISTEN
# o
sudo ss -tulpn
```

Puertos comunes a evitar: 80 (HTTP), 443 (HTTPS), 22 (SSH), 3306 (MySQL), 5432 (PostgreSQL)

---

## 🔧 Comandos Útiles

### Gestión de Contenedores

```bash
# Detener todos los servicios
docker compose down

# Detener y eliminar volúmenes (¡CUIDADO! se borran los datos)
docker compose down -v

# Reiniciar servicios
docker compose restart

# Reconstruir imágenes
docker compose build --no-cache

# Ver logs en tiempo real
docker compose logs -f

# Ver logs de un servicio específico
docker compose logs -f backend
```

### Acceder a la Base de Datos

```bash
# Conectar al contenedor de SQL Server
docker exec -it escs_db bash

# Ejecutar comandos SQL
/opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P 'YourStrong@Passw0rd!' -Q "SELECT @@VERSION"

# Salir
exit
```

### Ejecutar Script de Base de Datos Manualmente

El script `01_master_database.sql` se monta automáticamente, pero si necesitas ejecutarlo manualmente:

```bash
docker exec -i escs_db /opt/mssql-tools/bin/sqlcmd \
  -S localhost \
  -U sa \
  -P 'YourStrong@Passw0rd!' \
  -d master \
  -i /scripts/01_master_database.sql
```

---

## 📁 Volúmenes Persistentes

Los datos se guardan en volúmenes Docker:

| Volumen | Ubicación | Descripción |
|---------|-----------|-------------|
| `sqlserver_data` | Gestionado por Docker | Datos de SQL Server |
| `backend_uploads` | Gestionado por Docker | Archivos subidos (PDFs, fotos, CSVs) |

Para respaldar los datos:

```bash
# Backup de volúmenes
docker run --rm \
  -v escs_sqlserver_data:/data/source \
  -v $(pwd)/backup:/data/backup \
  alpine tar czf /data/backup/sqlserver-backup.tar.gz -C /data/source .
```

---

## 🔒 Consideraciones de Seguridad

### Producción

1. **Cambiar contraseñas por defecto** en el archivo `.env`
2. **Usar HTTPS** con un reverse proxy (Nginx, Traefik, Caddy)
3. **Restringir CORS** en el backend cambiando `CORS_ORIGIN=*` por tu dominio
4. **Configurar firewall**:
   ```bash
   sudo ufw allow 8080/tcp    # Puerto de la aplicación (HTTP)
   sudo ufw allow 443/tcp     # HTTPS (recomendado si usas reverse proxy)
   sudo ufw deny 1433/tcp     # Bloquear SQL Server externo
   ```
   
   > Si cambias el puerto en `.env`, ajusta el comando `ufw` accordingly.

### Generar JWT_SECRET Seguro

```bash
# Generar clave aleatoria
openssl rand -base64 64
```

---

## 🛠️ Solución de Problemas

### El backend no conecta a la base de datos

```bash
# Verificar que DB esté healthy
docker compose ps

# Ver logs del backend
docker compose logs backend

# Esperar a que SQL Server esté listo (puede tardar 1-2 minutos)
```

### Error de permisos en uploads

```bash
# Reiniciar el contenedor del backend
docker compose restart backend
```

### SQL Server no inicia

Verificar memoria disponible:
```bash
free -h
```

SQL Server requiere mínimo 2GB RAM.

### Limpiar y reiniciar desde cero

```bash
# ⚠️ ADVERTENCIA: Esto elimina TODOS los datos
docker compose down -v
docker system prune -a
docker compose up -d --build
```

---

## 📊 Monitoreo

### Uso de recursos

```bash
# Ver uso de CPU/RAM por contenedor
docker stats
```

### Espacio en disco

```bash
# Ver uso de discos Docker
docker system df

# Limpiar imágenes/volúmenes no usados
docker system prune
```

---

## 🔄 Actualizaciones

Para actualizar el sistema:

```bash
# Detener servicios
docker compose down

# Actualizar código (si usas git)
git pull

# Reconstruir e iniciar
docker compose up -d --build
```

---

## 📞 Soporte

Para problemas específicos del sistema, revisar:
- Logs de contenedores: `docker compose logs -f`
- Documentación en `/docs`
- README.md principal

---

**Versión:** 3.0 Enterprise  
**Última actualización:** 2026
