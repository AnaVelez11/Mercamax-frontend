// src/app/side-bar/side-bar.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable } from 'rxjs';

interface MenuItem {
  label: string;
  icon: string;
  path?: string;
  submenu?: MenuItem[];
  roles: string[];
}

@Component({
  selector: 'app-side-bar',
  standalone: true,
  imports: [CommonModule, MatSidenavModule, MatListModule, MatIconModule, RouterModule],
  templateUrl: './side-bar.component.html',
  styleUrls: ['./side-bar.component.scss']
})
export class SideBarComponent implements OnInit {
  activeSubmenu: string | null = null;

  menuItems: MenuItem[] = [
    {
      label: 'Gestión de Inventario',
      icon: 'inventory',
      roles: ['ENCARGADO_INVENTARIO', 'GERENTE_SUPERMERCADO'],
      submenu: [
        { label: 'Productos', icon: 'inventory_2', path: '/inventario/productos', roles: ['ENCARGADO_INVENTARIO', 'GERENTE_SUPERMERCADO'] },
        { label: 'Ubicaciones', icon: 'store', path: '/inventario/ubicaciones', roles: ['ENCARGADO_INVENTARIO', 'GERENTE_SUPERMERCADO'] },
        { label: 'Lotes', icon: 'sell', path: '/inventario/lotes', roles: ['ENCARGADO_INVENTARIO', 'GERENTE_SUPERMERCADO'] },
        { label: 'Stock', icon: 'storage', path: '/inventario/stock', roles: ['ENCARGADO_INVENTARIO', 'GERENTE_SUPERMERCADO'] },
        { label: 'Ajuste de Inventario', icon: 'tune', path: '/inventario/ajustes', roles: ['ENCARGADO_INVENTARIO', 'GERENTE_SUPERMERCADO'] },
        { label: 'Reportes', icon: 'assessment', path: '/inventario/reportes', roles: ['ENCARGADO_INVENTARIO', 'GERENTE_SUPERMERCADO'] }
      ]
    },
    {
      label: 'Gestión de Ventas',
      icon: 'point_of_sale',
      roles: ['CAJERO', 'GERENTE_SUPERMERCADO'],
      submenu: [
        {
          label: 'Punto de Venta',
          icon: 'shopping_cart',
          path: '/ventas/punto-venta',
          roles: ['CAJERO', 'GERENTE_SUPERMERCADO']
        },
        {
          label: 'Historial de Ventas',
          icon: 'receipt_long',
          path: '/ventas/historial',
          roles: ['CAJERO', 'GERENTE_SUPERMERCADO']
        }
      ]
    },
    {
      label: 'Gestión de Compras',
      icon: 'shopping_bag',
      roles: ['GERENTE_COMPRAS', 'GERENTE_SUPERMERCADO'],
      submenu: [
        { label: 'Órdenes de Compra', icon: 'receipt', path: '/compras/ordenes', roles: ['GERENTE_COMPRAS', 'GERENTE_SUPERMERCADO'] },
        { label: 'Proveedores', icon: 'local_shipping', path: '/compras/facturas', roles: ['GERENTE_COMPRAS', 'GERENTE_SUPERMERCADO'] }
      ]
    },
    {
      label: 'Administración',
      icon: 'admin_panel_settings',
      roles: ['GERENTE_SUPERMERCADO'],
      submenu: [
        { label: 'Registrar Usuarios', icon: 'person_add', path: '/admin/invite-user', roles: ['GERENTE_SUPERMERCADO'] }
      ]
    }
  ];

  constructor(private authService: AuthService) {}

  ngOnInit(): void {}

  toggleSubmenu(submenuName: string): void {
    this.activeSubmenu = this.activeSubmenu === submenuName ? null : submenuName;
  }

  isVisible(item: MenuItem): Observable<boolean> {
    return this.authService.hasRole(item.roles);
  }
}
