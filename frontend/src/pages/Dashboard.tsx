import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory';
import AssignmentIcon from '@mui/icons-material/Assignment';
import WarningIcon from '@mui/icons-material/Warning';

interface KPIs {
  TotalDisponibles: number;
  TotalAsignados: number;
  TotalReparacion: number;
  PrestamosVencidos: number;
  PendientesRegularizar: number;
  CostoMantencionesAnio: number;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        const response = await axios.get('/api/dashboard/kpis');
        if (response.data.success) {
          setKpis(response.data.data);
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'Error al cargar indicadores');
      } finally {
        setLoading(false);
      }
    };

    fetchKPIs();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  const kpiCards = [
    {
      title: 'Activos Disponibles',
      value: kpis?.TotalDisponibles || 0,
      icon: <InventoryIcon fontSize="large" />,
      color: '#4CAF50',
      bgColor: '#E8F5E9',
    },
    {
      title: 'Activos Asignados',
      value: kpis?.TotalAsignados || 0,
      icon: <AssignmentIcon fontSize="large" />,
      color: '#2196F3',
      bgColor: '#E3F2FD',
    },
    {
      title: 'En Reparación',
      value: kpis?.TotalReparacion || 0,
      icon: <DashboardIcon fontSize="large" />,
      color: '#FF9800',
      bgColor: '#FFF3E0',
    },
    {
      title: 'Préstamos Vencidos',
      value: kpis?.PrestamosVencidos || 0,
      icon: <WarningIcon fontSize="large" />,
      color: '#F44336',
      bgColor: '#FFEBEE',
      alert: true,
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography variant="h4" gutterBottom fontWeight="bold" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
        Dashboard Ejecutivo
      </Typography>

      <Typography 
        variant="subtitle1" 
        color="text.secondary" 
        gutterBottom 
        sx={{ mb: 3, fontSize: { xs: '0.875rem', sm: '1rem' } }}
      >
        Instituto Profesional Del Comercio Spa. - Inventario v3.0
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {kpis?.PrestamosVencidos > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          ⚠️ Hay {kpis.PrestamosVencidos} préstamo(s) vencido(s). Revise el módulo de Movimientos.
        </Alert>
      )}

      {kpis?.PendientesRegularizar > 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          ℹ️ Hay {kpis.PendientesRegularizar} activo(s) pendientes de regularización.
        </Alert>
      )}

      <Grid container spacing={{ xs: 2, sm: 3 }}>
        {kpiCards.map((kpi, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              sx={{
                height: '100%',
                backgroundColor: kpi.bgColor,
                borderLeft: `4px solid ${kpi.color}`,
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6,
                },
              }}
            >
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      gutterBottom
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    >
                      {kpi.title}
                    </Typography>
                    <Typography 
                      variant="h3" 
                      fontWeight="bold" 
                      sx={{ 
                        color: kpi.color,
                        fontSize: { xs: '1.5rem', sm: '2rem', md: '3rem' }
                      }}
                    >
                      {kpi.value}
                    </Typography>
                  </Box>
                  <Box sx={{ color: kpi.color }}>{kpi.icon}</Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Sección de Accesos Rápidos */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          Accesos Rápidos
        </Typography>
        <Grid container spacing={{ xs: 1, sm: 2 }} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={4}>
            <Box
              sx={{
                p: 2,
                bgcolor: 'primary.main',
                color: 'white',
                borderRadius: 1,
                cursor: 'pointer',
                '&:hover': { bgcolor: 'primary.dark' },
                textAlign: 'center',
              }}
              onClick={() => navigate('/activos')}
            >
              <Typography variant="body2">Gestionar Activos</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box
              sx={{
                p: 2,
                bgcolor: 'secondary.main',
                color: 'white',
                borderRadius: 1,
                cursor: 'pointer',
                '&:hover': { bgcolor: 'secondary.dark' },
                textAlign: 'center',
              }}
              onClick={() => navigate('/movimientos')}
            >
              <Typography variant="body2">Nuevo Movimiento</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box
              sx={{
                p: 2,
                bgcolor: 'info.main',
                color: 'white',
                borderRadius: 1,
                cursor: 'pointer',
                '&:hover': { bgcolor: 'info.dark' },
                textAlign: 'center',
              }}
              onClick={() => navigate('/qr')}
            >
              <Typography variant="body2">Generar QR</Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default Dashboard;
