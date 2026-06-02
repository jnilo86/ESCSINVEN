import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { SnackbarProvider } from 'notistack';

// Páginas
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Activos from './pages/Activos';
import Responsables from './pages/Responsables';
import Movimientos from './pages/Movimientos';
import Solicitudes from './pages/Solicitudes';
import Mantenciones from './pages/Mantenciones';
import QRGenerator from './pages/QRGenerator';
import Reportes from './pages/Reportes';
import AuditoriaMovil from './pages/AuditoriaMovil'; // Nueva página móvil
import Layout from './components/Layout';

// Tema Material UI personalizado ESCS
const theme = createTheme({
  palette: {
    primary: {
      main: '#0033A0', // ESCS Blue
      light: '#335CBB',
      dark: '#002277',
    },
    secondary: {
      main: '#D71920', // ESCS Red
      light: '#E64047',
      dark: '#A81018',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
  },
});

// Hook de autenticación (placeholder)
const useAuth = () => {
  const token = localStorage.getItem('token');
  return { token, isAuthenticated: !!token };
};

// Ruta protegida
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider
        maxSnack={3}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <BrowserRouter>
          <Routes>
            {/* Ruta pública */}
            <Route path="/login" element={<Login />} />
            
            {/* Rutas protegidas con Layout */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="activos" element={<Activos />} />
              <Route path="responsables" element={<Responsables />} />
              <Route path="movimientos" element={<Movimientos />} />
              <Route path="solicitudes" element={<Solicitudes />} />
              <Route path="mantenciones" element={<Mantenciones />} />
              <Route path="qr" element={<QRGenerator />} />
              <Route path="reportes" element={<Reportes />} />
              <Route path="auditoria-movil" element={<AuditoriaMovil />} />
            </Route>
            
            {/* Redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;
