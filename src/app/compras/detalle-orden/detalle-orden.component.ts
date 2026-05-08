// src/app/compras/detalle-orden/detalle-orden.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';

import { ComprasService } from '../../services/compras.service';
import { AuthService } from '../../services/auth.service';
import {
  OrdenDeCompra, DetalleRecepcion,
  RecepcionPayload, FacturaCreatePayload, PagoCreatePayload
} from '../../interfaces/compra';

@Component({
  selector: 'app-detalle-orden',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './detalle-orden.component.html',
  styleUrls: ['./detalle-orden.component.scss']
})
export class DetalleOrdenComponent implements OnInit {

  orden: OrdenDeCompra | null = null;
  cargando = true;
  esGerente = false;
  esGerenteCompras = false;
  procesando = false;

  // Panel activo
  panelActivo: 'recepcionar' | 'factura' | 'pago' | null = null;

  // Recepción
  recepcionDetalles: {
    detalle_orden_id: number;
    producto_nombre: string;
    cantidad_solicitada: number;
    cantidad_recibida: number;
    estado: 'CONFORME' | 'NO_CONFORME';
    observacion: string;
    fecha_caducidad: string;
  }[] = [];
  facturaRecepcion = '';
  notasRecepcion = '';

  // Factura
  facturaNumero = '';
  facturaFechaEmision = '';
  facturaFechaVencimiento = '';
  facturaMontoTotal = 0;

  // Pago
  pagoMonto = 0;
  pagoMetodo: 'EFECTIVO' | 'TRANSFERENCIA' | 'CHEQUE' = 'TRANSFERENCIA';
  pagoComprobante = '';
  pagoNotas = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private comprasService: ComprasService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.hasRole(['GERENTE_SUPERMERCADO']).subscribe(es => this.esGerente = es);
    this.authService.hasRole(['GERENTE_COMPRAS', 'GERENTE_SUPERMERCADO']).subscribe(es => this.esGerenteCompras = es);

    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.cargarOrden(id);
  }

  cargarOrden(id: number): void {
    this.cargando = true;
    this.comprasService.getOrden(id).subscribe({
      next: (orden) => {
        this.orden = orden;
        this.cargando = false;
        // Pre-llenar detalles de recepción
        this.recepcionDetalles = orden.detalles.map(d => ({
          detalle_orden_id: d.id!,
          producto_nombre: d.producto_nombre || '',
          cantidad_solicitada: d.cantidad_solicitada,
          cantidad_recibida: d.cantidad_solicitada - (d.cantidad_recibida || 0),
          estado: 'CONFORME' as const,
          observacion: '',
          fecha_caducidad: ''
        }));
        // Pre-llenar monto factura con total de la orden
        this.facturaMontoTotal = orden.total;
        this.facturaFechaEmision = new Date().toISOString().split('T')[0];
      },
      error: () => {
        this.cargando = false;
        Swal.fire('Error', 'No se pudo cargar la orden.', 'error');
        this.router.navigate(['/compras/ordenes']);
      }
    });
  }

  // ── RF-P02: Aprobar / Rechazar ────────────────────────────────────────────
  aprobar(): void {
    Swal.fire({
      title: '¿Aprobar esta orden?',
      html: `<p>Orden: <strong>${this.orden?.numero_orden}</strong></p>
             <p>Total: <strong>${this.fmt(this.orden?.total || 0)}</strong></p>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, aprobar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#1a56db'
    }).then(result => {
      if (!result.isConfirmed) return;
      this.procesando = true;
      this.comprasService.aprobarRechazar(this.orden!.id, { accion: 'APROBAR' }).subscribe({
        next: (orden) => {
          this.orden = orden;
          this.procesando = false;
          Swal.fire({ toast: true, position: 'top-end', icon: 'success',
            title: 'Orden aprobada exitosamente', showConfirmButton: false, timer: 2500 });
        },
        error: (err) => {
          this.procesando = false;
          Swal.fire('Error', err.error?.error || 'No se pudo aprobar.', 'error');
        }
      });
    });
  }

  rechazar(): void {
    Swal.fire({
      title: 'Rechazar orden',
      input: 'textarea',
      inputLabel: 'Motivo del rechazo (obligatorio)',
      inputPlaceholder: 'Explica por qué se rechaza esta orden...',
      showCancelButton: true,
      confirmButtonText: 'Rechazar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#e74c3c',
      inputValidator: (value) => {
        if (!value?.trim()) return 'El motivo es obligatorio';
        return null;
      }
    }).then(result => {
      if (!result.isConfirmed) return;
      this.procesando = true;
      this.comprasService.aprobarRechazar(this.orden!.id, {
        accion: 'RECHAZAR',
        motivo_rechazo: result.value
      }).subscribe({
        next: (orden) => {
          this.orden = orden;
          this.procesando = false;
          Swal.fire({ toast: true, position: 'top-end', icon: 'info',
            title: 'Orden rechazada', showConfirmButton: false, timer: 2500 });
        },
        error: (err) => {
          this.procesando = false;
          Swal.fire('Error', err.error?.error || 'No se pudo rechazar.', 'error');
        }
      });
    });
  }

  // ── RF-P03: Recepcionar ───────────────────────────────────────────────────
  abrirRecepcionar(): void { this.panelActivo = 'recepcionar'; }

  guardarRecepcion(): void {
    const hayInvalido = this.recepcionDetalles.some(
      d => d.estado === 'NO_CONFORME' && !d.observacion.trim()
    );
    if (hayInvalido) {
      Swal.fire({ toast: true, position: 'top-end', icon: 'warning',
        title: 'Agrega observación para los productos no conformes.',
        showConfirmButton: false, timer: 2500 });
      return;
    }

    const payload: RecepcionPayload = {
      factura_proveedor: this.facturaRecepcion,
      notas: this.notasRecepcion,
      detalles: this.recepcionDetalles.map(d => ({
        detalle_orden_id: d.detalle_orden_id,
        cantidad_recibida: d.cantidad_recibida,
        estado: d.estado,
        observacion: d.observacion,
        fecha_caducidad: d.fecha_caducidad || null
      }))
    };

    this.procesando = true;
    this.comprasService.recepcionar(this.orden!.id, payload).subscribe({
      next: () => {
        this.procesando = false;
        this.panelActivo = null;
        Swal.fire({
          icon: 'success', title: '¡Recepción registrada!',
          text: 'El inventario fue actualizado automáticamente con los productos conformes.',
          confirmButtonColor: '#1a56db'
        }).then(() => this.cargarOrden(this.orden!.id));
      },
      error: (err) => {
        this.procesando = false;
        Swal.fire('Error', err.error?.error || 'No se pudo registrar la recepción.', 'error');
      }
    });
  }

  // ── RF-P05: Factura ───────────────────────────────────────────────────────
  abrirFactura(): void {
    this.facturaMontoTotal = this.orden!.detalles.reduce((acc, d) => {
      return acc + ((d.cantidad_recibida || 0) * d.costo_unitario);
    }, 0);
    this.facturaFechaEmision = new Date().toISOString().split('T')[0];
    this.panelActivo = 'factura';
  }

  guardarFactura(): void {
    if (!this.facturaNumero || !this.facturaFechaEmision || !this.facturaMontoTotal) {
      Swal.fire({ toast: true, position: 'top-end', icon: 'warning',
        title: 'Completa todos los campos de la factura.', showConfirmButton: false, timer: 2500 });
      return;
    }

    const payload: FacturaCreatePayload = {
      orden_id: this.orden!.id,
      numero_factura: this.facturaNumero,
      fecha_emision: this.facturaFechaEmision,
      fecha_vencimiento: this.facturaFechaVencimiento || undefined,
      monto_total: this.facturaMontoTotal
    };

    this.procesando = true;
    this.comprasService.crearFactura(payload).subscribe({
      next: () => {
        this.procesando = false;
        this.panelActivo = null;
        Swal.fire({ toast: true, position: 'top-end', icon: 'success',
          title: 'Factura registrada', showConfirmButton: false, timer: 2500 });
        this.cargarOrden(this.orden!.id);
      },
      error: (err) => {
        this.procesando = false;
        Swal.fire('Error', err.error?.error || 'No se pudo registrar la factura.', 'error');
      }
    });
  }

  cerrarPanel(): void { this.panelActivo = null; }

  // ── Helpers ───────────────────────────────────────────────────────────────
  getEstadoClass(estado: string): string {
    const clases: Record<string, string> = {
      'PENDIENTE': 'badge-pendiente', 'APROBADA': 'badge-aprobada',
      'RECHAZADA': 'badge-rechazada', 'RECIBIDA': 'badge-recibida',
      'PARCIAL': 'badge-parcial', 'CANCELADA': 'badge-cancelada',
    };
    return clases[estado] || '';
  }

  volver(): void { this.router.navigate(['/compras/ordenes']); }

  fmt(valor: number | string): string {
    return Number(valor).toLocaleString('es-CO', {
      style: 'currency', currency: 'COP', minimumFractionDigits: 0
    });
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return '—';
    return new Date(fecha).toLocaleDateString('es-CO', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  }

  get hoy(): string {
    return new Date().toISOString().split('T')[0];
  }
}
