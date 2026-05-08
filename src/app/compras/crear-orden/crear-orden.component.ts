// src/app/compras/crear-orden/crear-orden.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

import { ComprasService } from '../../services/compras.service';
import { ProductsService } from '../../services/products.service';
import { Proveedor } from '../../interfaces/proveedor';
import { Product } from '../../interfaces/producto';
import { CrearOrdenPayload } from '../../interfaces/compra';

interface ItemOrden {
  producto: number;
  producto_nombre: string;
  cantidad_solicitada: number;
  costo_unitario: number;
}

@Component({
  selector: 'app-crear-orden',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './crear-orden.component.html',
  styleUrls: ['./crear-orden.component.scss']
})
export class CrearOrdenComponent implements OnInit {

  proveedores: Proveedor[] = [];
  productos: Product[] = [];
  guardando = false;
  productosFiltrados: Product[] = [];

  // Formulario principal
  proveedorSeleccionado: number | null = null;
  fechaEstimadaEntrega = '';
  notas = '';

  // Agregar producto al detalle
  productoSeleccionado: number | null = null;
  cantidadItem = 1;
  costoItem = 0;
  items: ItemOrden[] = [];

  constructor(
    private comprasService: ComprasService,
    private productsService: ProductsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.productsService.getProveedor().subscribe({
      next: (data) => this.proveedores = data,
      error: () => Swal.fire('Error', 'No se pudieron cargar los proveedores.', 'error')
    });

    this.productsService.getProducts().subscribe({
      next: (data) => this.productos = data,
      error: () => Swal.fire('Error', 'No se pudieron cargar los productos.', 'error')
    });
  }

  onProveedorChange(): void {
    if (this.proveedorSeleccionado) {
      this.productosFiltrados = this.productos.filter(
        p => p.proveedor === Number(this.proveedorSeleccionado)
      );
    } else {
      this.productosFiltrados = [];
    }
    this.items = [];
  }

  agregarItem(): void {
    if (!this.productoSeleccionado || this.cantidadItem < 1 || this.costoItem <= 0) {
      Swal.fire({ toast: true, position: 'top-end', icon: 'warning',
        title: 'Completa todos los campos del producto.', showConfirmButton: false, timer: 2500 });
      return;
    }

    const productoId = Number(this.productoSeleccionado);
    const existente = this.items.find(i => i.producto === productoId);
    if (existente) {
      Swal.fire({ toast: true, position: 'top-end', icon: 'warning',
        title: 'Este producto ya está en la orden.', showConfirmButton: false, timer: 2500 });
      return;
    }

    const prod = this.productos.find(p => p.id === productoId);
    this.items.push({
      producto: productoId,
      producto_nombre: prod?.nombre || '',
      cantidad_solicitada: this.cantidadItem,
      costo_unitario: this.costoItem
    });

    // Limpiar campos
    this.productoSeleccionado = null;
    this.cantidadItem = 1;
    this.costoItem = 0;
  }

  eliminarItem(index: number): void {
    this.items.splice(index, 1);
  }

  get totalOrden(): number {
    return this.items.reduce((acc, i) => acc + (i.cantidad_solicitada * i.costo_unitario), 0);
  }

  guardar(): void {
    if (!this.proveedorSeleccionado) {
      Swal.fire({ toast: true, position: 'top-end', icon: 'warning',
        title: 'Selecciona un proveedor.', showConfirmButton: false, timer: 2500 }); return;
    }
    if (!this.fechaEstimadaEntrega) {
      Swal.fire({ toast: true, position: 'top-end', icon: 'warning',
        title: 'Indica la fecha estimada de entrega.', showConfirmButton: false, timer: 2500 }); return;
    }
    if (this.items.length === 0) {
      Swal.fire({ toast: true, position: 'top-end', icon: 'warning',
        title: 'Agrega al menos un producto.', showConfirmButton: false, timer: 2500 }); return;
    }

    this.guardando = true;
    const payload: CrearOrdenPayload = {
      proveedor: Number(this.proveedorSeleccionado),
      fecha_estimada_entrega: this.fechaEstimadaEntrega,
      notas: this.notas,
      detalles: this.items.map(i => ({
        producto: i.producto,
        cantidad_solicitada: i.cantidad_solicitada,
        costo_unitario: i.costo_unitario
      }))
    };

    this.comprasService.crearOrden(payload).subscribe({
      next: (orden) => {
        this.guardando = false;
        Swal.fire({
          icon: 'success', title: '¡Orden creada!',
          text: `${orden.numero_orden} creada exitosamente. Pendiente de aprobación.`,
          confirmButtonColor: '#1a56db'
        }).then(() => this.router.navigate(['/compras/ordenes']));
      },
      error: (err) => {
        this.guardando = false;
        Swal.fire('Error', err.error?.error || 'No se pudo crear la orden.', 'error');
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/compras/ordenes']);
  }

  fmt(valor: number): string {
    return valor.toLocaleString('es-CO', {
      style: 'currency', currency: 'COP', minimumFractionDigits: 0
    });
  }

  get fechaMinima(): string {
    return new Date().toISOString().split('T')[0];
  }

  onProductoChange(): void {
    if (this.productoSeleccionado) {
      const prod = this.productos.find(p => p.id === Number(this.productoSeleccionado));
      if (prod) {
        this.costoItem = prod.costo_promedio_ponderado || 0;
      }
    }
  }
}
