import { Router } from 'express';
import authRoutes from './auth.routes';
import dashboardRoutes from './dashboard.routes';
import importacionRoutes from './importacion.routes';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Rutas públicas
router.use('/auth', authRoutes);

// Rutas protegidas
router.use('/dashboard', authenticateToken, dashboardRoutes);
router.use('/importacion', authenticateToken, importacionRoutes);

// Ruta de health check
router.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Inventario ESCS API v3.0 - Running',
    timestamp: new Date().toISOString(),
  });
});

export default router;
