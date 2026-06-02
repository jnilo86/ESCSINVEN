import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import BuildIcon from '@mui/icons-material/Build';
import QrCodeIcon from '@mui/icons-material/QrCode';
import AssessmentIcon from '@mui/icons-material/Assessment';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner'; // Icono para auditoría móvil

const DRAWER_WIDTH = 260;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Activos', icon: <InventoryIcon />, path: '/activos' },
  { text: 'Responsables', icon: <PeopleIcon />, path: '/responsables' },
  { text: 'Movimientos', icon: <AssignmentIcon />, path: '/movimientos' },
  { text: 'Solicitudes', icon: <RequestQuoteIcon />, path: '/solicitudes' },
  { text: 'Mantenciones', icon: <BuildIcon />, path: '/mantenciones' },
  { text: 'Generar QR', icon: <QrCodeIcon />, path: '/qr' },
  { text: 'Auditoría Móvil', icon: <QrCodeScannerIcon />, path: '/auditoria-movil' },
  { text: 'Reportes', icon: <AssessmentIcon />, path: '/reportes' },
];

const Layout: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  const rol = JSON.parse(localStorage.getItem('rol') || '{}');

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    localStorage.removeItem('rol');
    navigate('/login');
  };

  const drawer = (
    <Box>
      <Toolbar sx={{ bgcolor: 'primary.main', color: 'white' }}>
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
          Inventario ESCS
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton onClick={() => navigate(item.path)}>
              <ListItemIcon sx={{ color: 'primary.main' }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <Box sx={{ p: 2, bgcolor: 'grey.100' }}>
        <Typography variant="caption" color="text.secondary">
          Usuario: {usuario.nombre_completo || 'N/A'}
        </Typography>
        <Typography variant="caption" display="block" color="text.secondary">
          Rol: {rol.nombre_rol || 'N/A'}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          bgcolor: 'primary.main',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Instituto Profesional Del Comercio Spa.
          </Typography>
          <IconButton color="inherit" onClick={handleMenuOpen}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
              {usuario.nombre_completo?.charAt(0) || <AccountCircleIcon />}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem disabled>
              <Typography variant="body2">{usuario.nombre_completo}</Typography>
            </MenuItem>
            <MenuItem disabled>
              <Typography variant="caption" color="text.secondary">
                {rol.nombre_rol}
              </Typography>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Cerrar Sesión
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        {isMobile ? (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{ keepMounted: true }}
            sx={{
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
            }}
          >
            {drawer}
          </Drawer>
        ) : (
          <Drawer
            variant="permanent"
            sx={{
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
            }}
            open
          >
            {drawer}
          </Drawer>
        )}
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          mt: 8,
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;
