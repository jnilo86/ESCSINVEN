import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import {
  Container,
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

interface LoginFormData {
  username: string;
  password: string;
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/auth/login', data);

      if (response.data.success && response.data.data) {
        const { token, usuario, rol } = response.data.data;

        // Guardar en localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('usuario', JSON.stringify(usuario));
        localStorage.setItem('rol', JSON.stringify(rol));

        // Configurar axios para futuras peticiones
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        // Redirigir al dashboard
        navigate('/');
      } else {
        setError(response.data.error || 'Credenciales inválidas');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          'Error de conexión. Verifique que el servidor esté corriendo.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ height: '100vh', display: 'flex', alignItems: 'center' }}>
      <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <LockOutlinedIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />

          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
            Inventario ESCS
          </Typography>

          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            Instituto Profesional Del Comercio Spa.
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            v3.0 Enterprise
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ width: '100%' }}>
            <TextField
              fullWidth
              label="Usuario"
              margin="normal"
              {...register('username', {
                required: 'El usuario es requerido',
                minLength: { value: 3, message: 'Mínimo 3 caracteres' },
              })}
              error={!!errors.username}
              helperText={errors.username?.message}
              disabled={loading}
            />

            <TextField
              fullWidth
              label="Contraseña"
              type="password"
              margin="normal"
              {...register('password', {
                required: 'La contraseña es requerida',
                minLength: { value: 6, message: 'Mínimo 6 caracteres' },
              })}
              error={!!errors.password}
              helperText={errors.password?.message}
              disabled={loading}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Iniciar Sesión'}
            </Button>

            <Typography variant="caption" color="text.secondary" align="center" sx={{ display: 'block' }}>
              Usuario por defecto: admin / admin123
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;
