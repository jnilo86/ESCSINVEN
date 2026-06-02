import { Router } from 'express';
import { login, authenticateToken, authorizeRoles, AuthRequest } from '../middleware/auth.middleware';
import { ApiResponse } from '../models/types';

const router = Router();

/**
 * POST /api/auth/login
 * Iniciar sesión
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ 
        success: false, 
        error: 'Username y password son requeridos' 
      });
      return;
    }

    const result = await login({ username, password });
    
    if (result.success && result.data) {
      res.json(result);
    } else {
      res.status(401).json(result);
    }
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

/**
 * GET /api/auth/me
 * Obtener usuario actual
 */
router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.usuario) {
      res.status(401).json({ success: false, error: 'No autenticado' });
      return;
    }

    res.json({
      success: true,
      data: req.usuario,
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Error al obtener usuario' 
    });
  }
});

/**
 * GET /api/auth/test
 * Endpoint de prueba para verificar autenticación
 */
router.get('/test', authenticateToken, authorizeRoles('Administrador', 'Supervisor TI'), (req: AuthRequest, res) => {
  res.json({
    success: true,
    message: 'Acceso autorizado',
    data: {
      usuario: req.usuario?.username,
      rol: (req.usuario as any)?.nombre_rol,
      timestamp: new Date().toISOString(),
    },
  });
});

export default router;
