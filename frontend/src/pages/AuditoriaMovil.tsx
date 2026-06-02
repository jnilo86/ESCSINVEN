import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Paper,
} from '@mui/material';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';

interface ActivoInfo {
  eqp_code: string;
  serial_number: string;
  tipo_activo: string;
  marca: string;
  modelo: string;
  estado: string;
  responsable?: string;
}

const AuditoriaMovil: React.FC = () => {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [activoData, setActivoData] = useState<ActivoInfo | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Simulación de escaneo QR (en producción usar html5-qrcode)
  const handleScanQR = async () => {
    setScanning(true);
    setError('');
    setActivoData(null);

    try {
      // En producción: integrar librería html5-qrcode
      // Por ahora, simulamos con un prompt para testing
      const eqpCode = prompt('Ingrese código EQP (simulación de escaneo QR):');
      
      if (!eqpCode) {
        setScanning(false);
        return;
      }

      setLoading(true);

      // Simular llamada a API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Datos mock para demostración
      const mockData: ActivoInfo = {
        eqp_code: eqpCode.toUpperCase(),
        serial_number: 'SN-2024-001',
        tipo_activo: 'Notebook',
        marca: 'HP',
        modelo: 'ProBook 450',
        estado: 'Asignado',
        responsable: 'Juan Pérez',
      };

      setActivoData(mockData);
      setLoading(false);
      setScanning(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al leer el código QR');
      setLoading(false);
      setScanning(false);
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Disponible': return '#4CAF50';
      case 'Asignado': return '#2196F3';
      case 'Prestamo': return '#FF9800';
      case 'En Reparacion': return '#FF5722';
      case 'Baja': return '#9E9E9E';
      default: return '#757575';
    }
  };

  const handleClose = () => {
    setActivoData(null);
    setError('');
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Encabezado */}
      <Typography 
        variant="h5" 
        gutterBottom 
        fontWeight="bold"
        sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}
      >
        📱 Auditoría Móvil
      </Typography>

      <Typography 
        variant="body2" 
        color="text.secondary" 
        gutterBottom 
        sx={{ mb: 3, fontSize: { xs: '0.875rem', sm: '1rem' } }}
      >
        Escanee códigos QR para verificar activos en terreno
      </Typography>

      {/* Botón de escaneo */}
      <Card sx={{ mb: 3, bgcolor: 'primary.main', color: 'white' }}>
        <CardContent sx={{ textAlign: 'center', p: { xs: 2, sm: 3 } }}>
          <QrCodeScannerIcon sx={{ fontSize: { xs: 48, sm: 64 }, mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Escanear Código QR
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, opacity: 0.9 }}>
            Apunte la cámara al código QR del activo
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={handleScanQR}
            disabled={scanning || loading}
            sx={{ 
              minWidth: { xs: '100%', sm: '200px' },
              py: 1.5,
              fontSize: '1rem',
            }}
          >
            {scanning ? 'Escaneando...' : 'Iniciar Escaneo'}
          </Button>
        </CardContent>
      </Card>

      {/* Loading */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Información del activo escaneado */}
      {activoData && (
        <Card sx={{ mb: 3, borderLeft: `4px solid ${getEstadoColor(activoData.estado)}` }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              {activoData.estado === 'Disponible' ? (
                <CheckCircleIcon sx={{ color: 'success.main', mr: 1 }} />
              ) : (
                <InfoIcon sx={{ color: 'info.main', mr: 1 }} />
              )}
              <Typography variant="h6" fontWeight="bold">
                {activoData.eqp_code}
              </Typography>
            </Box>

            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Tipo
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {activoData.tipo_activo}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Marca
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {activoData.marca}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Modelo
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {activoData.modelo}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Serial
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {activoData.serial_number}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Estado
                  </Typography>
                  <Typography 
                    variant="body1" 
                    fontWeight="bold"
                    sx={{ color: getEstadoColor(activoData.estado) }}
                  >
                    {activoData.estado}
                  </Typography>
                </Box>
                {activoData.responsable && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Responsable
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {activoData.responsable}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>

            {/* Acciones rápidas */}
            <Box sx={{ mt: 3, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1 }}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate(`/activos/${activoData.eqp_code}`)}
                sx={{ py: 1.5 }}
              >
                Ver Detalle Completo
              </Button>
              {activoData.estado === 'Disponible' && (
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => navigate('/movimientos/nueva-entrega', { state: { eqp_code: activoData.eqp_code } })}
                  sx={{ py: 1.5 }}
                >
                  Entregar
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Instrucciones */}
      <Card sx={{ mt: 4 }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            📋 Instrucciones de uso:
          </Typography>
          <Box component="ul" sx={{ pl: 2, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
            <li>Toque "Iniciar Escaneo" para activar la cámara</li>
            <li>Apunte al código QR pegado en el activo</li>
            <li>El sistema mostrará automáticamente la información del equipo</li>
            <li>Desde aquí puede realizar movimientos rápidos o ver el historial completo</li>
          </Box>
        </CardContent>
      </Card>

      {/* Dialog para vista de cámara (futura implementación) */}
      <Dialog open={scanning} onClose={() => setScanning(false)} fullScreen>
        <DialogTitle>Escaneando Código QR</DialogTitle>
        <DialogContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography variant="body1">
              Apunte la cámara al código QR del activo
            </Typography>
            <video 
              ref={videoRef} 
              style={{ width: '100%', maxWidth: '400px', mt: 2, borderRadius: 2 }}
              autoPlay 
              playsInline
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScanning(false)} color="primary">
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AuditoriaMovil;
