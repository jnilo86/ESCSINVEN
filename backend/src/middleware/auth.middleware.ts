import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Usuario, Rol, LoginRequest, LoginResponse, ApiResponse } from '../models/types';
import { executeQuery, executeStoredProcedure } from '../services/database.service';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_change_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

/**
 * Middleware de autenticación
 */
export interface AuthRequest extends Request {
  usuario?: Usuario;
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({ success: false, error: 'Token no proporcionado' });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id_usuario: number };
    
    // Obtener usuario desde la base de datos
    const usuarios = await executeQuery<Usuario & { nombre_rol: string }>(
      `SELECT u.*, r.nombre_rol 
       FROM usuarios u 
       INNER JOIN roles r ON u.id_rol = r.id_rol 
       WHERE u.id_usuario = @id_usuario AND u.activo = 1`,
      { id_usuario: decoded.id_usuario }
    );

    if (usuarios.length === 0) {
      res.status(401).json({ success: false, error: 'Usuario no encontrado o inactivo' });
      return;
    }

    req.usuario = usuarios[0];
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(403).json({ success: false, error: 'Token inválido' });
    } else if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ success: false, error: 'Token expirado' });
    } else {
      res.status(500).json({ success: false, error: 'Error de autenticación' });
    }
  }
};

/**
 * Middleware de autorización por rol
 */
export const authorizeRoles = (...rolesPermitidos: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.usuario) {
      res.status(401).json({ success: false, error: 'No autenticado' });
      return;
    }

    const usuarioConRol = req.usuario as Usuario & { nombre_rol: string };
    
    if (!rolesPermitidos.includes(usuarioConRol.nombre_rol)) {
      res.status(403).json({ 
        success: false, 
        error: 'No tiene permisos suficientes para realizar esta acción' 
      });
      return;
    }

    next();
  };
};

/**
 * Login de usuario
 */
export const login = async (credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
  try {
    const { username, password } = credentials;

    // Buscar usuario
    const usuarios = await executeQuery<Usuario & { password_hash: string; nombre_rol: string }>(
      `SELECT u.*, r.nombre_rol 
       FROM usuarios u 
       INNER JOIN roles r ON u.id_rol = r.id_rol 
       WHERE u.username = @username AND u.activo = 1`,
      { username }
    );

    if (usuarios.length === 0) {
      return { success: false, error: 'Credenciales inválidas' };
    }

    const usuario = usuarios[0];

    // Verificar contraseña
    const passwordValido = await bcrypt.compare(password, usuario.password_hash);
    
    if (!passwordValido) {
      // Incrementar intentos fallidos
      await executeQuery(
        `UPDATE usuarios SET intentos_fallidos = intentos_fallidos + 1 WHERE id_usuario = @id`,
        { id: usuario.id_usuario }
      );
      
      return { success: false, error: 'Credenciales inválidas' };
    }

    // Resetear intentos fallidos
    await executeQuery(
      `UPDATE usuarios SET intentos_fallidos = 0, ultima_sesion = GETDATE() WHERE id_usuario = @id`,
      { id: usuario.id_usuario }
    );

    // Generar token JWT
    const token = jwt.sign(
      { id_usuario: usuario.id_usuario, username: usuario.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const { password_hash, ...usuarioSinPassword } = usuario;
    const rol: Rol = { id_rol: usuario.id_rol, nombre_rol: usuario.nombre_rol, descripcion: '' };

    return {
      success: true,
      data: {
        token,
        usuario: usuarioSinPassword,
        rol,
      },
    };
  } catch (error) {
    console.error('Error en login:', error);
    return { 
      success: false, 
      error: 'Error interno del servidor',
      message: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
};

/**
 * Hash de contraseña
 */
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '10');
  return bcrypt.hash(password, saltRounds);
};

/**
 * Verificar contraseña
 */
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};
