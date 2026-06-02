/**
 * Rutas para importación CSV
 */

import { Router } from 'express';
import { ImportacionService } from '../services/importacion.service';
import { authMiddleware } from '../middleware/auth.middleware';
import multer from 'multer';
import path from 'path';

const router = Router();

// Configurar multer para uploads temporales
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/csv'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `import_${uniqueSuffix}_${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB máximo
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos CSV'));
    }
  }
});

// POST /api/importacion/csv - Subir y procesar archivo CSV
router.post('/csv', 
  authMiddleware, 
  upload.single('archivo'), 
  ImportacionService.importarCSV
);

// GET /api/importacion/historial - Obtener historial de importaciones
router.get('/historial', 
  authMiddleware, 
  ImportacionService.obtenerHistorial
);

// GET /api/importacion/errores/:id - Obtener errores de una importación específica
router.get('/errores/:id', 
  authMiddleware, 
  ImportacionService.obtenerErrores
);

// POST /api/importacion/reintentar/:id - Reintentar importación fallida
router.post('/reintentar/:id', 
  authMiddleware, 
  ImportacionService.reintentarImportacion
);

export default router;
