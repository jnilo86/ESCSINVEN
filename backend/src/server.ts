/**
 * Servidor Principal - Inventario ESCS v3.0 Enterprise
 * Instituto Profesional Del Comercio Spa.
 */

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';

// Importar configuración y rutas
import dbConfig from './config/database';
import { getDbConnection, closeDbConnection } from './services/database.service';
import routes from './routes';

// Cargar variables de entorno
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// ==========================================
// MIDDLEWARE
// ==========================================

// Seguridad HTTP
app.use(helmet());

// CORS configurado
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Parseo de JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Carpeta de archivos estáticos para uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ==========================================
// RUTAS
// ==========================================

app.use('/api', routes);

// Ruta raíz
app.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Inventario ESCS API v3.0 Enterprise',
    institucion: 'Instituto Profesional Del Comercio Spa.',
    endpoints: {
      auth: '/api/auth',
      dashboard: '/api/dashboard',
      health: '/api/health',
    },
  });
});

// Manejo de rutas no encontradas
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint no encontrado',
    message: `La ruta ${req.method} ${req.path} no existe`,
  });
});

// Manejo global de errores
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('Error no manejado:', err);
  
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ==========================================
// INICIO DEL SERVIDOR
// ==========================================

async function startServer() {
  try {
    // Intentar conectar a la base de datos
    await getDbConnection();
    console.log('✅ Base de datos conectada');
  } catch (error) {
    console.warn('⚠️ No se pudo conectar a la base de datos. El servidor iniciará igual.');
    console.warn('   Configure las variables de entorno en .env');
  }

  app.listen(PORT, () => {
    console.log('');
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║     INVENTARIO ESCS v3.0 ENTERPRISE                       ║');
    console.log('║     Instituto Profesional Del Comercio Spa.               ║');
    console.log('╠═══════════════════════════════════════════════════════════╣');
    console.log(`║     Servidor corriendo en puerto ${PORT}`);
    console.log(`║     Entorno: ${process.env.NODE_ENV || 'development'}`);
    console.log(`║     API: http://localhost:${PORT}/api`);
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log('');
  });
}

// Manejo de cierre graceful
process.on('SIGTERM', async () => {
  console.log('\n🛑 Señal SIGTERM recibida, cerrando servidor...');
  await closeDbConnection();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n🛑 Señal SIGINT recibida, cerrando servidor...');
  await closeDbConnection();
  process.exit(0);
});

// Iniciar servidor
startServer().catch(console.error);

export default app;
