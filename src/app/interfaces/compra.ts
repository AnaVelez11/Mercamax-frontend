// src/app/interfaces/compra.ts

export interface DetalleOrden {
  id?: number;
  producto: number;
  producto_nombre?: string;
  cantidad_solicitada: number;
  cantidad_recibida?: number;
  costo_unitario: number;
  subtotal?: number;
}

export interface OrdenDeCompra {
  id: number;
  numero_orden: string;
  proveedor: number;
  proveedor_nombre: string;
  creado_por_nombre: string;
  aprobado_por_nombre: string | null;
  fecha_creacion: string;
  fecha_estimada_entrega: string;
  fecha_aprobacion: string | null;
  fecha_recepcion: string | null;
  estado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'RECIBIDA' | 'PARCIAL' | 'CANCELADA';
  motivo_rechazo: string | null;
  notas: string;
  total: number;
  detalles: DetalleOrden[];
  tiene_factura?: boolean;
  estado_pago?: 'PENDIENTE' | 'PARCIAL' | 'PAGADA' | null;
}

export interface CrearOrdenPayload {
  proveedor: number;
  fecha_estimada_entrega: string;
  notas: string;
  detalles: {
    producto: number;
    cantidad_solicitada: number;
    costo_unitario: number;
  }[];
}

export interface AprobarRechazarPayload {
  accion: 'APROBAR' | 'RECHAZAR';
  motivo_rechazo?: string;
}

export interface DetalleRecepcion {
  detalle_orden_id: number;
  cantidad_recibida: number;
  estado: 'CONFORME' | 'NO_CONFORME';
  observacion?: string;
}

export interface RecepcionPayload {
  factura_proveedor?: string;
  notas?: string;
  detalles: DetalleRecepcion[];
}

export interface PagoProveedor {
  id: number;
  fecha_pago: string;
  monto: number;
  metodo_pago: string;
  numero_comprobante: string;
  notas: string;
  registrado_por_nombre: string;
}

export interface FacturaProveedor {
  id: number;
  orden: number;
  proveedor_nombre: string;
  numero_factura: string;
  fecha_emision: string;
  fecha_vencimiento: string | null;
  monto_total: number;
  monto_pagado: number;
  monto_pendiente: number;
  estado: 'PENDIENTE' | 'PARCIAL' | 'PAGADA';
  pagos: PagoProveedor[];
}

export interface FacturaCreatePayload {
  orden_id: number;
  numero_factura: string;
  fecha_emision: string;
  fecha_vencimiento?: string;
  monto_total: number;
}

export interface PagoCreatePayload {
  monto: number;
  metodo_pago: 'EFECTIVO' | 'TRANSFERENCIA' | 'CHEQUE';
  numero_comprobante: string;
  notas?: string;
}
