import sql, { ConnectionPool, ISqlType } from 'mssql';
import dbConfig from '../config/database';
import { ApiResponse } from '../models/types';

let pool: ConnectionPool | null = null;

/**
 * Obtener conexión a la base de datos (Singleton)
 */
export async function getDbConnection(): Promise<ConnectionPool> {
  if (pool) {
    return pool;
  }

  try {
    pool = await sql.connect({
      server: dbConfig.server,
      port: dbConfig.port,
      database: dbConfig.database,
      user: dbConfig.user,
      password: dbConfig.password,
      options: dbConfig.options,
    });

    console.log('✅ Conexión a SQL Server establecida correctamente');
    return pool;
  } catch (error) {
    console.error('❌ Error al conectar con SQL Server:', error);
    throw new Error('No se pudo establecer conexión con la base de datos');
  }
}

/**
 * Cerrar conexión a la base de datos
 */
export async function closeDbConnection(): Promise<void> {
  if (pool) {
    await pool.close();
    pool = null;
    console.log('🔒 Conexión a SQL Server cerrada');
  }
}

/**
 * Ejecutar query simple
 */
export async function executeQuery<T>(query: string, params?: Record<string, unknown>): Promise<T[]> {
  const conn = await getDbConnection();
  const request = conn.request();

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      request.input(key, value as ISqlType & any);
    }
  }

  const result = await request.query(query);
  return result.recordset as T[];
}

/**
 * Ejecutar Stored Procedure
 */
export async function executeStoredProcedure<T>(
  procedureName: string,
  params?: Record<string, { value: unknown; type?: ISqlType }>
): Promise<T[]> {
  const conn = await getDbConnection();
  const request = conn.request();

  if (params) {
    for (const [key, config] of Object.entries(params)) {
      if (config.type) {
        request.input(key, config.type, config.value);
      } else {
        request.input(key, config.value as ISqlType & any);
      }
    }
  }

  const result = await request.execute(procedureName);
  return result.recordset as T[];
}

/**
 * Ejecutar transacción
 */
export async function executeTransaction<T>(
  callback: (transaction: sql.Transaction) => Promise<T>
): Promise<T> {
  const conn = await getDbConnection();
  const transaction = new sql.Transaction(conn);

  try {
    await transaction.begin();
    const result = await callback(transaction);
    await transaction.commit();
    return result;
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Transacción fallida, rollback ejecutado:', error);
    throw error;
  }
}

/**
 * Verificar conexión
 */
export async function testConnection(): Promise<ApiResponse<boolean>> {
  try {
    const conn = await getDbConnection();
    await conn.query('SELECT 1');
    return { success: true, data: true, message: 'Conexión exitosa' };
  } catch (error) {
    return { 
      success: false, 
      error: 'Error de conexión',
      message: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}
