/**
 * Configuración de la Base de Datos - SQL Server
 */
export interface DatabaseConfig {
  server: string;
  port: number;
  database: string;
  user: string;
  password: string;
  options: {
    encrypt: boolean;
    trustServerCertificate: boolean;
    connectTimeout: number;
    requestTimeout: number;
  };
}

const dbConfig: DatabaseConfig = {
  server: process.env.DB_SERVER || 'localhost',
  port: parseInt(process.env.DB_PORT || '1433'),
  database: process.env.DB_NAME || 'InventarioESCS',
  user: process.env.DB_USER || 'inventario_user',
  password: process.env.DB_PASSWORD || '',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_CERT === 'true' || true, // Por defecto true para desarrollo
    connectTimeout: 30000,
    requestTimeout: 60000,
  },
};

export default dbConfig;
