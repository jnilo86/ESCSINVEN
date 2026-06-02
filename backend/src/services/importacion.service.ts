/**
 * Servicio de Importación CSV
 * Maneja la carga masiva de activos, responsables y otros datos desde archivos CSV
 */

import { Request, Response } from 'express';
import { pool } from '../config/database';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { v4 as uuidv4 } from 'uuid';

export class ImportacionService {
  
  /**
   * Procesa un archivo CSV y lo importa a la base de datos
   */
  static async importarCSV(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ 
          success: false, 
          message: 'No se encontró ningún archivo CSV' 
        });
        return;
      }

      const { tipo } = req.body; // 'Activos', 'Responsables', 'Software', 'Componentes'
      const archivo = req.file;
      
      if (!tipo || !['Activos', 'Responsables', 'Software', 'Componentes'].includes(tipo)) {
        res.status(400).json({ 
          success: false, 
          message: 'Tipo de importación inválido. Debe ser: Activos, Responsables, Software o Componentes' 
        });
        return;
      }

      // Leer y parsear el CSV
      const resultados: any[] = [];
      let erroresFila: Array<{fila: number, columna: string, valor: string, error: string}> = [];
      
      await new Promise<void>((resolve, reject) => {
        fs.createReadStream(archivo.path)
          .pipe(csv({ separator: ',', mapHeaders: ({ header }) => header.trim().toLowerCase() }))
          .on('data', (data: any) => resultados.push(data))
          .on('end', () => resolve())
          .on('error', (err) => reject(err));
      });

      if (resultados.length === 0) {
        res.status(400).json({ 
          success: false, 
          message: 'El archivo CSV está vacío' 
        });
        return;
      }

      // Crear registro de importación
      const connection = await pool.request();
      const nombreArchivo = archivo.originalname;
      const rutaArchivo = archivo.path;
      const idUsuario = (req as any).usuario?.id_usuario || 1;
      
      const resultadoInsert = await connection.query(`
        INSERT INTO importaciones_csv 
        (nombre_archivo, ruta_archivo, tipo_importacion, id_usuario, total_filas, estado)
        VALUES (@nombreArchivo, @rutaArchivo, @tipo, @idUsuario, @totalFilas, 'Procesando');
        SELECT SCOPE_IDENTITY() AS id_importacion;
      `, {
        nombreArchivo,
        rutaArchivo,
        tipo,
        idUsuario,
        totalFilas: resultados.length
      });

      const idImportacion = resultadoInsert.recordset[0].id_importacion;

      // Convertir CSV a JSON para enviar al Stored Procedure
      let jsonDatos: any[] = [];
      
      if (tipo === 'Activos') {
        jsonDatos = this.procesarActivosCSV(resultados, erroresFila);
      } else if (tipo === 'Responsables') {
        jsonDatos = this.procesarResponsablesCSV(resultados, erroresFila);
      } else if (tipo === 'Software') {
        jsonDatos = this.procesarSoftwareCSV(resultados, erroresFila);
      } else if (tipo === 'Componentes') {
        jsonDatos = this.procesarComponentesCSV(resultados, erroresFila);
      }

      // Ejecutar Stored Procedure de importación
      if (jsonDatos.length > 0) {
        const spResult = await connection.query(`
          EXEC sp_Importar_Activos_CSV @IdImportacion = ${idImportacion}, @JsonDatos = '${JSON.stringify(jsonDatos)}'
        `);
      }

      // Registrar errores si los hay
      if (erroresFila.length > 0) {
        for (const error of erroresFila) {
          await connection.query(`
            INSERT INTO importaciones_csv_errores 
            (id_importacion, numero_fila, columna, valor_invalido, mensaje_error)
            VALUES (${idImportacion}, ${error.fila}, '${error.columna}', '${error.valor}', '${error.error.replace(/'/g, "''")}')
          `);
        }
        
        // Actualizar estado parcial
        await connection.query(`
          UPDATE importaciones_csv 
          SET estado = 'Parcial', filas_erroneas = ${erroresFila.length}
          WHERE id_importacion = ${idImportacion}
        `);
      }

      // Eliminar archivo temporal después de procesar
      fs.unlink(archivo.path, (err) => {
        if (err) console.error('Error eliminando archivo temporal:', err);
      });

      res.json({
        success: true,
        message: erroresFila.length > 0 
          ? `Importación completada con ${erroresFila.length} errores` 
          : 'Importación completada exitosamente',
        data: {
          id_importacion: idImportacion,
          total_filas: resultados.length,
          filas_exitosas: jsonDatos.length,
          filas_erroneas: erroresFila.length,
          errores: erroresFila.slice(0, 10) // Mostrar solo primeros 10 errores
        }
      });

    } catch (error: any) {
      console.error('Error en importación CSV:', error);
      
      res.status(500).json({
        success: false,
        message: 'Error al procesar la importación',
        error: error.message
      });
    }
  }

  /**
   * Procesa filas de CSV de Activos
   */
  private static procesarActivosCSV(
    filas: any[], 
    errores: Array<{fila: number, columna: string, valor: string, error: string}>
  ): any[] {
    const datosValidos: any[] = [];

    filas.forEach((fila, index) => {
      try {
        // Validaciones básicas
        if (!fila.eqp_code) {
          errores.push({
            fila: index + 2, // +2 porque CSV empieza en 1 y hay header
            columna: 'eqp_code',
            valor: fila.eqp_code || '',
            error: 'Código EQP es obligatorio'
          });
          return;
        }

        // Validar formato de fecha si existe
        if (fila.fecha_compra && !this.esFechaValida(fila.fecha_compra)) {
          errores.push({
            fila: index + 2,
            columna: 'fecha_compra',
            valor: fila.fecha_compra,
            error: 'Formato de fecha inválido. Use YYYY-MM-DD'
          });
          return;
        }

        // Validar estado si existe
        const estadosValidos = ['Disponible', 'Asignado', 'Prestamo', 'En Reparacion', 'Baja', 'Robado', 'Obsoleto', 'Sin Trazabilidad', 'Merma'];
        if (fila.estado && !estadosValidos.includes(fila.estado)) {
          errores.push({
            fila: index + 2,
            columna: 'estado',
            valor: fila.estado,
            error: `Estado inválido. Debe ser uno de: ${estadosValidos.join(', ')}`
          });
          return;
        }

        datosValidos.push({
          eqp_code: fila.eqp_code?.trim(),
          serial_number: fila.serial_number?.trim() || '',
          tipo_activo: fila.tipo_activo?.trim() || 'Genérico',
          marca: fila.marca?.trim() || '',
          modelo: fila.modelo?.trim() || '',
          descripcion: fila.descripcion?.trim() || '',
          estado: fila.estado?.trim() || 'Disponible',
          fecha_compra: fila.fecha_compra?.trim() || '',
          valor_compra: fila.valor_compra?.trim() || '0',
          vida_util_anios: fila.vida_util_anios?.trim() || '5',
          proveedor_compra: fila.proveedor_compra?.trim() || '',
          numero_orden_compra: fila.numero_orden_compra?.trim() || '',
          ubicacion_fisica: fila.ubicacion_fisica?.trim() || '',
          observado: fila.observado?.trim() || '0'
        });

      } catch (error: any) {
        errores.push({
          fila: index + 2,
          columna: 'GENERAL',
          valor: JSON.stringify(fila),
          error: error.message
        });
      }
    });

    return datosValidos;
  }

  /**
   * Procesa filas de CSV de Responsables
   */
  private static procesarResponsablesCSV(
    filas: any[], 
    errores: Array<{fila: number, columna: string, valor: string, error: string}>
  ): any[] {
    const datosValidos: any[] = [];

    filas.forEach((fila, index) => {
      try {
        if (!fila.rut || !fila.nombre) {
          errores.push({
            fila: index + 2,
            columna: 'rut,nombre',
            valor: `${fila.rut || ''},${fila.nombre || ''}`,
            error: 'RUT y Nombre son obligatorios'
          });
          return;
        }

        datosValidos.push({
          rut: fila.rut?.trim(),
          nombre: fila.nombre?.trim(),
          cargo: fila.cargo?.trim() || '',
          area_departamento: fila.area_departamento?.trim() || '',
          email: fila.email?.trim() || '',
          telefono: fila.telefono?.trim() || '',
          tipo: fila.tipo?.trim() || 'Persona'
        });

      } catch (error: any) {
        errores.push({
          fila: index + 2,
          columna: 'GENERAL',
          valor: JSON.stringify(fila),
          error: error.message
        });
      }
    });

    return datosValidos;
  }

  /**
   * Procesa filas de CSV de Software
   */
  private static procesarSoftwareCSV(
    filas: any[], 
    errores: Array<{fila: number, columna: string, valor: string, error: string}>
  ): any[] {
    const datosValidos: any[] = [];

    filas.forEach((fila, index) => {
      try {
        if (!fila.nombre_software) {
          errores.push({
            fila: index + 2,
            columna: 'nombre_software',
            valor: fila.nombre_software || '',
            error: 'Nombre del software es obligatorio'
          });
          return;
        }

        datosValidos.push({
          nombre_software: fila.nombre_software?.trim(),
          version: fila.version?.trim() || '',
          tipo_licencia: fila.tipo_licencia?.trim() || 'OEM',
          clave_producto: fila.clave_producto?.trim() || '',
          fecha_vencimiento: fila.fecha_vencimiento?.trim() || '',
          cantidad_total: fila.cantidad_total?.trim() || '1',
          cantidad_disponible: fila.cantidad_disponible?.trim() || fila.cantidad_total || '1',
          proveedor: fila.proveedor?.trim() || '',
          costo_anual: fila.costo_anual?.trim() || '0'
        });

      } catch (error: any) {
        errores.push({
          fila: index + 2,
          columna: 'GENERAL',
          valor: JSON.stringify(fila),
          error: error.message
        });
      }
    });

    return datosValidos;
  }

  /**
   * Procesa filas de CSV de Componentes
   */
  private static procesarComponentesCSV(
    filas: any[], 
    errores: Array<{fila: number, columna: string, valor: string, error: string}>
  ): any[] {
    const datosValidos: any[] = [];

    filas.forEach((fila, index) => {
      try {
        if (!fila.eqp_code || !fila.tipo_componente) {
          errores.push({
            fila: index + 2,
            columna: 'eqp_code,tipo_componente',
            valor: `${fila.eqp_code || ''},${fila.tipo_componente || ''}`,
            error: 'Código EQP y Tipo de Componente son obligatorios'
          });
          return;
        }

        datosValidos.push({
          eqp_code: fila.eqp_code?.trim(),
          tipo_componente: fila.tipo_componente?.trim(),
          marca_modelo: fila.marca_modelo?.trim() || '',
          serial_componente: fila.serial_componente?.trim() || '',
          capacidad: fila.capacidad?.trim() || '',
          observacion: fila.observacion?.trim() || '',
          es_original: fila.es_original === '1' || fila.es_original?.toLowerCase() === 'true' ? '1' : '0'
        });

      } catch (error: any) {
        errores.push({
          fila: index + 2,
          columna: 'GENERAL',
          valor: JSON.stringify(fila),
          error: error.message
        });
      }
    });

    return datosValidos;
  }

  /**
   * Valida si una cadena es una fecha válida
   */
  private static esFechaValida(fecha: string): boolean {
    // Acepta formatos: YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY
    const regexISO = /^\d{4}-\d{2}-\d{2}$/;
    const regexDMY = /^\d{2}\/\d{2}\/\d{4}$/;
    
    if (regexISO.test(fecha)) {
      const d = new Date(fecha);
      return !isNaN(d.getTime());
    }
    
    if (regexDMY.test(fecha)) {
      const [dia, mes, anio] = fecha.split('/').map(Number);
      const d = new Date(anio, mes - 1, dia);
      return d.getFullYear() === anio && d.getMonth() === mes - 1 && d.getDate() === dia;
    }
    
    return false;
  }

  /**
   * Obtiene el historial de importaciones
   */
  static async obtenerHistorial(req: Request, res: Response): Promise<void> {
    try {
      const { topN = 50 } = req.query;
      const connection = await pool.request();
      
      const resultado = await connection.query(`
        EXEC sp_Obtener_Historial_Importaciones @TopN = ${parseInt(topN as string)}
      `);

      res.json({
        success: true,
        data: resultado.recordset
      });

    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener historial de importaciones',
        error: error.message
      });
    }
  }

  /**
   * Obtiene los errores de una importación específica
   */
  static async obtenerErrores(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const connection = await pool.request();
      
      const resultado = await connection.query(`
        EXEC sp_Obtener_Errores_Importacion @IdImportacion = ${id}
      `);

      res.json({
        success: true,
        data: resultado.recordset
      });

    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener errores de importación',
        error: error.message
      });
    }
  }

  /**
   * Reintentar importación fallida
   */
  static async reintentarImportacion(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const connection = await pool.request();
      
      // Verificar si existe la importación
      const checkResult = await connection.query(`
        SELECT * FROM importaciones_csv WHERE id_importacion = ${id}
      `);

      if (checkResult.recordset.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Importación no encontrada'
        });
        return;
      }

      // Leer archivo original si existe
      const importacion = checkResult.recordset[0];
      if (!importacion.ruta_archivo || !fs.existsSync(importacion.ruta_archivo)) {
        res.status(400).json({
          success: false,
          message: 'Archivo original no encontrado. No se puede reintentar.'
        });
        return;
      }

      // Reiniciar proceso de importación
      res.json({
        success: true,
        message: 'Funcionalidad de reintegro en desarrollo'
      });

    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Error al reintentar importación',
        error: error.message
      });
    }
  }
}
