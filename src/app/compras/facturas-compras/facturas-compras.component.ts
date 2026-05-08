// src/app/compras/facturas-compras/facturas-compras.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

import { ComprasService } from '../../services/compras.service';
import { AuthService } from '../../services/auth.service';
import { FacturaProveedor, PagoCreatePayload } from '../../interfaces/compra';

@Component({
  selector: 'app-facturas-compras',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './facturas-compras.component.html',
  styleUrls: ['./facturas-compras.component.scss']
})
export class FacturasComprasComponent implements OnInit {

  facturas: FacturaProveedor[] = [];
  facturaSeleccionada: FacturaProveedor | null = null;
  cargando = false;
  procesando = false;
  mostrarModalPago = false;

  // Pago
  pagoMonto = 0;
  pagoMetodo: 'EFECTIVO' | 'TRANSFERENCIA' | 'CHEQUE' = 'TRANSFERENCIA';
  pagoComprobante = '';
  pagoNotas = '';

  metodosPago = [
    { value: 'EFECTIVO', label: '💵 Efectivo' },
    { value: 'TRANSFERENCIA', label: '🏦 Transferencia Bancaria' },
    { value: 'CHEQUE', label: '📄 Cheque' },
  ];

  constructor(
    private comprasService: ComprasService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.cargarFacturas();
  }

  cargarFacturas(): void {
    this.cargando = true;
    this.comprasService.getFacturas().subscribe({
      next: (data) => { this.facturas = data; this.cargando = false; },
      error: () => {
        this.cargando = false;
        Swal.fire('Error', 'No se pudieron cargar las facturas.', 'error');
      }
    });
  }

  abrirPago(factura: FacturaProveedor): void {
    this.facturaSeleccionada = factura;
    this.pagoMonto = Number(factura.monto_pendiente);
    this.pagoMetodo = 'TRANSFERENCIA';
    this.pagoComprobante = '';
    this.pagoNotas = '';
    this.mostrarModalPago = true;
  }

  cerrarModal(): void {
    this.mostrarModalPago = false;
    this.facturaSeleccionada = null;
  }

  registrarPago(): void {
    if (!this.pagoMonto || !this.pagoComprobante) {
      Swal.fire({ toast: true, position: 'top-end', icon: 'warning',
        title: 'Completa monto y número de comprobante.',
        showConfirmButton: false, timer: 2500 });
      return;
    }

    if (this.pagoMonto > Number(this.facturaSeleccionada!.monto_pendiente)) {
      Swal.fire({ toast: true, position: 'top-end', icon: 'warning',
        title: `Monto excede el saldo pendiente (${this.fmt(this.facturaSeleccionada!.monto_pendiente)})`,
        showConfirmButton: false, timer: 3000 });
      return;
    }

    const payload: PagoCreatePayload = {
      monto: this.pagoMonto,
      metodo_pago: this.pagoMetodo,
      numero_comprobante: this.pagoComprobante,
      notas: this.pagoNotas
    };

    this.procesando = true;
    this.comprasService.registrarPago(this.facturaSeleccionada!.id, payload).subscribe({
      next: () => {
        this.procesando = false;
        this.cerrarModal();
        Swal.fire({ toast: true, position: 'top-end', icon: 'success',
          title: 'Pago registrado exitosamente', showConfirmButton: false, timer: 2500 });
        this.cargarFacturas();
      },
      error: (err) => {
        this.procesando = false;
        Swal.fire('Error', err.error?.error || 'No se pudo registrar el pago.', 'error');
      }
    });
  }

  getEstadoClass(estado: string): string {
    const c: Record<string, string> = {
      'PENDIENTE': 'badge-pendiente',
      'PARCIAL': 'badge-parcial',
      'PAGADA': 'badge-pagada'
    };
    return c[estado] || '';
  }

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
}
