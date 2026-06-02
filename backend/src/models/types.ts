/**
 * Modelos de Tipos - Inventario ESCS v3.0
 */

// ==========================================
// USUARIOS Y ROLES
// ==========================================
export interface Usuario {
  id_usuario: number;
  username: string;
  email: string;
  nombre_completo: string;
  id_rol: number;
  activo: boolean;
  fecha_creacion: Date;
  ultima_sesion?: Date;
}

export interface Rol {
  id_rol: number;
  nombre_rol: string;
  descripcion: string;
  permisos_json?: string;
}

// ==========================================
// RESPONSABLES
// ==========================================
export type TipoResponsable = 'Persona' | 'Area' | 'Sala';

export interface Responsable {
  id_responsable: number;
  rut: string;
  nombre: string;
  cargo?: string;
  area_departamento?: string;
  email?: string;
  telefono?: string;
  tipo: TipoResponsable;
  activo: boolean;
  fecha_registro: Date;
}

// ==========================================
// ACTIVOS
// ==========================================
export type EstadoActivo = 
  | 'Disponible'
  | 'Asignado'
  | 'Prestamo'
  | 'En Reparacion'
  | 'Baja'
  | 'Robado'
  | 'Obsoleto'
  | 'Sin Trazabilidad'
  | 'Merma';

export interface Activo {
  id_activo: number;
  eqp_code: string;
  serial_number?: string;
  tipo_activo: string;
  marca?: string;
  modelo?: string;
  descripcion?: string;
  estado: EstadoActivo;
  fecha_compra?: Date;
  valor_compra?: number;
  vida_util_anios?: number;
  fecha_fin_garantia?: Date;
  proveedor_compra?: string;
  numero_orden_compra?: string;
  ubicacion_fisica?: string;
  id_responsable_actual?: number;
  observado: boolean;
  fecha_ingreso_sistema: Date;
  fecha_ultima_modificacion: Date;
}

// ==========================================
// COMPONENTES INTERNOS
// ==========================================
export interface ComponenteInterno {
  id_componente: number;
  id_activo: number;
  tipo_componente: string; // RAM, SSD, HDD, Batería, Pantalla
  marca_modelo?: string;
  serial_componente?: string;
  capacidad?: string;
  fecha_instalacion: Date;
  usuario_cambio?: number;
  observacion?: string;
  es_original: boolean;
}

// ==========================================
// MOVIMIENTOS
// ==========================================
export type TipoMovimiento = 'Entrega' | 'Devolucion' | 'Prestamo' | 'Regularizacion' | 'Mantencion';
export type EstadoPrestamo = 'Vigente' | 'Devuelto' | 'Vencido' | 'Extendido';

export interface Movimiento {
  id_movimiento: number;
  tipo_movimiento: TipoMovimiento;
  numero_orden: string;
  fecha_movimiento: Date;
  id_responsable: number;
  id_usuario_sistema: number;
  id_solicitud_origen?: number;
  observaciones_generales?: string;
  fecha_limite_devolucion?: Date;
  fecha_devolucion_real?: Date;
  estado_prestamo?: EstadoPrestamo;
  ruta_acta_pdf?: string;
  firma_digital_hash?: string;
}

export interface MovimientoDetalle {
  id_detalle: number;
  id_movimiento: number;
  id_activo: number;
  estado_anterior?: string;
  estado_nuevo?: string;
  accesorios_incluidos?: string;
  condicion_llegada?: string;
  observacion_individual?: string;
}

// ==========================================
// SOLICITUDES
// ==========================================
export type EstadoSolicitud = 
  | 'Pendiente'
  | 'Aprobado_Jefatura'
  | 'Rechazado'
  | 'Validado_TI'
  | 'Entregado';

export interface SolicitudEquipamiento {
  id_solicitud: number;
  id_solicitante: number;
  fecha_solicitud: Date;
  justificacion: string;
  estado_solicitud: EstadoSolicitud;
  id_aprobador_jefatura?: number;
  fecha_aprobacion?: Date;
  id_tecnico_asignado?: number;
  observaciones_tecnico?: string;
}

// ==========================================
// MANTENCIONES
// ==========================================
export type TipoMantencion = 'Preventiva' | 'Correctiva' | 'Evolutiva' | 'Garantia';
export type EstadoMantencion = 'En Curso' | 'Finalizada' | 'Cancelada';

export interface Mantencion {
  id_mantencion: number;
  id_activo: number;
  tipo_mantencion: TipoMantencion;
  fecha_ingreso: Date;
  fecha_salida?: Date;
  proveedor_servicio?: string;
  tecnico_responsable?: string;
  descripcion_falla?: string;
  trabajo_realizado?: string;
  costo_mantencion?: number;
  garantia_meses?: number;
  fecha_fin_garantia_mantencion?: Date;
  ruta_orden_servicio?: string;
  estado_mantencion: EstadoMantencion;
}

// ==========================================
// SOFTWARE Y LICENCIAS
// ==========================================
export interface SoftwareLicencia {
  id_licencia: number;
  nombre_software: string;
  version?: string;
  tipo_licencia?: string;
  clave_producto?: string;
  fecha_vencimiento?: Date;
  cantidad_total: number;
  cantidad_disponible: number;
  proveedor?: string;
  costo_anual?: number;
  activo: boolean;
}

// ==========================================
// ADJUNTOS Y FOTOS
// ==========================================
export type TipoFoto = 'Frontal' | 'Posterior' | 'Serial' | 'Daño' | 'Acta_Firmada' | 'Otro';

export interface AdjuntoFoto {
  id_foto: number;
  id_activo: number;
  id_movimiento?: number;
  ruta_archivo: string;
  tipo_foto: TipoFoto;
  descripcion?: string;
  fecha_subida: Date;
  id_usuario_subida: number;
}

// ==========================================
// AUDITORÍA
// ==========================================
export interface LogAuditoria {
  id_log: number;
  fecha_evento: Date;
  id_usuario?: number;
  accion_realizada: string;
  tabla_afectada: string;
  registro_id_afectado?: number;
  detalles_cambios?: string;
  ip_origen?: string;
}

// ==========================================
// PETICIONES API
// ==========================================
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  usuario: Usuario;
  rol: Rol;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ==========================================
// DASHBOARD KPIs
// ==========================================
export interface DashboardKPIs {
  TotalDisponibles: number;
  TotalAsignados: number;
  TotalReparacion: number;
  PrestamosVencidos: number;
  PendientesRegularizar: number;
  CostoMantencionesAnio: number;
}
