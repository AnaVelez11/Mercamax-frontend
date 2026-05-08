// src/app/compras/ordenes-compra/ordenes-compra.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

import { ComprasService } from '../../services/compras.service';
import { AuthService } from '../../services/auth.service';
import { OrdenDeCompra } from '../../interfaces/compra';

@Component({
  selector: 'app-ordenes-compra',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ordenes-compra.component.html',
  styleUrls: ['./ordenes-compra.component.scss']
})
export class OrdenesCompraComponent implements OnInit {

  ordenes: OrdenDeCompra[] = [];
  ordenesFiltradas: OrdenDeCompra[] = [];
  cargando = false;
  filtroEstado = '';
  esGerente = false;

  estadoOpciones = [
    { value: '', label: 'Todos' },
    { value: 'PENDIENTE', label: 'Pendiente' },
    { value: 'APROBADA', label: 'Aprobada' },
    { value: 'RECHAZADA', label: 'Rechazada' },
    { value: 'RECIBIDA', label: 'Recibida' },
    { value: 'PARCIAL', label: 'Parcial' },
    { value: 'CANCELADA', label: 'Cancelada' },
  ];

  constructor(
    private comprasService: ComprasService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.hasRole(['GERENTE_SUPERMERCADO']).subscribe(es => {
      this.esGerente = es;
    });
    this.cargarOrdenes();
  }

  cargarOrdenes(): void {
    this.cargando = true;
    this.comprasService.getOrdenes().subscribe({
      next: (data) => {
        this.ordenes = data;
        this.filtrar();
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
        Swal.fire('Error', 'No se pudieron cargar las órdenes.', 'error');
      }
    });
  }

  filtrar(): void {
    this.ordenesFiltradas = this.filtroEstado
      ? this.ordenes.filter(o => o.estado === this.filtroEstado)
      : [...this.ordenes];
  }

  nuevaOrden(): void {
    this.router.navigate(['/compras/nueva-orden']);
  }

  verOrden(orden: OrdenDeCompra): void {
    this.router.navigate(['/compras/orden', orden.id]);
  }

  getEstadoClass(estado: string): string {
    const clases: Record<string, string> = {
      'PENDIENTE': 'badge-pendiente',
      'APROBADA': 'badge-aprobada',
      'RECHAZADA': 'badge-rechazada',
      'RECIBIDA': 'badge-recibida',
      'PARCIAL': 'badge-parcial',
      'CANCELADA': 'badge-cancelada',
    };
    return clases[estado] || '';
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
