import { Router, Request, Response } from 'express';
import { authenticateToken, authorizeRoles, AuthRequest } from '../middleware/auth.middleware';
import { executeQuery, executeStoredProcedure } from '../services/database.service';
import { DashboardKPIs, Activo, Responsable, ApiResponse } from '../models/types';

const router = Router();

/**
 * GET /api/dashboard/kpis
 * Obtener KPIs del dashboard ejecutivo
 */
router.get('/kpis', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const kpis = await executeStoredProcedure<DashboardKPIs>('sp_Dashboard_KPIs');
    
    res.json({
      success: true,
      data: kpis[0] || {
        TotalDisponibles: 0,
        TotalAsignados: 0,
        TotalReparacion: 0,
        PrestamosVencidos: 0,
        PendientesRegularizar: 0,
        CostoMantencionesAnio: 0,
      },
    });
  } catch (error) {
    console.error('Error al obtener KPIs:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al obtener indicadores' 
    });
  }
});

/**
 * GET /api/dashboard/activos-por-estado
 * Obtener distribución de activos por estado
 */
router.get('/activos-por-estado', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const resultados = await executeQuery<{ estado: string; cantidad: number }>(
      `SELECT estado, COUNT(*) as cantidad 
       FROM activos 
       GROUP BY estado 
       ORDER BY cantidad DESC`
    );

    res.json({
      success: true,
      data: resultados,
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Error al obtener distribución' 
    });
  }
});

/**
 * GET /api/dashboard/prestamos-vencidos
 * Obtener préstamos vencidos con detalle
 */
router.get('/prestamos-vencidos', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const prestamos = await executeQuery(`
      SELECT 
        m.id_movimiento,
        m.numero_orden,
        m.fecha_limite_devolucion,
        DATEDIFF(day, m.fecha_limite_devolucion, GETDATE()) as dias_vencido,
        r.nombre as responsable_nombre,
        r.rut as responsable_rut,
        a.eqp_code,
        a.tipo_activo,
        a.marca,
        a.modelo
      FROM movimientos m
      INNER JOIN responsables r ON m.id_responsable = r.id_responsable
      INNER JOIN movimiento_detalle md ON m.id_movimiento = md.id_movimiento
      INNER JOIN activos a ON md.id_activo = a.id_activo
      WHERE m.tipo_movimiento = 'Prestamo' 
        AND m.estado_prestamo = 'Vigente'
        AND m.fecha_limite_devolucion < GETDATE()
      ORDER BY m.fecha_limite_devolucion ASC
    `);

    res.json({
      success: true,
      data: prestamos,
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Error al obtener préstamos vencidos' 
    });
  }
});

/**
 * GET /api/dashboard/activos-proximo-fin-garantia
 * Obtener activos próximos a vencer garantía
 */
router.get('/activos-proximo-fin-garantia', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const activos = await executeQuery(`
      SELECT 
        id_activo,
        eqp_code,
        tipo_activo,
        marca,
        modelo,
        serial_number,
        fecha_fin_garantia,
        DATEDIFF(day, GETDATE(), fecha_fin_garantia) as dias_restantes
      FROM activos
      WHERE fecha_fin_garantia IS NOT NULL
        AND fecha_fin_garantia BETWEEN GETDATE() AND DATEADD(month, 3, GETDATE())
      ORDER BY fecha_fin_garantia ASC
    `);

    res.json({
      success: true,
      data: activos,
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Error al obtener activos por garantía' 
    });
  }
});

/**
 * GET /api/dashboard/movimientos-recientes
 * Obtener últimos movimientos
 */
router.get('/movimientos-recientes', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const movimientos = await executeQuery(`
      SELECT TOP 20
        m.id_movimiento,
        m.tipo_movimiento,
        m.numero_orden,
        m.fecha_movimiento,
        r.nombre as responsable_nombre,
        u.nombre_completo as usuario_sistema,
        COUNT(md.id_activo) as cantidad_activos
      FROM movimientos m
      INNER JOIN responsables r ON m.id_responsable = r.id_responsable
      INNER JOIN usuarios u ON m.id_usuario_sistema = u.id_usuario
      LEFT JOIN movimiento_detalle md ON m.id_movimiento = md.id_movimiento
      GROUP BY m.id_movimiento, m.tipo_movimiento, m.numero_orden, m.fecha_movimiento, 
               r.nombre, u.nombre_completo
      ORDER BY m.fecha_movimiento DESC
    `);

    res.json({
      success: true,
      data: movimientos,
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Error al obtener movimientos recientes' 
    });
  }
});

export default router;
