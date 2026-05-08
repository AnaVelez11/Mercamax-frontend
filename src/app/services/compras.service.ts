// src/app/services/compras.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  OrdenDeCompra, CrearOrdenPayload, AprobarRechazarPayload,
  RecepcionPayload, FacturaProveedor, FacturaCreatePayload,
  PagoCreatePayload
} from '../interfaces/compra';

@Injectable({ providedIn: 'root' })
export class ComprasService {
  private apiUrl = `${environment.apiUrl}/compras`;

  constructor(private http: HttpClient) {}

  // ── Órdenes ──────────────────────────────────────────────────────────────
  getOrdenes(): Observable<OrdenDeCompra[]> {
    return this.http.get<OrdenDeCompra[]>(`${this.apiUrl}/ordenes/`);
  }

  getOrden(id: number): Observable<OrdenDeCompra> {
    return this.http.get<OrdenDeCompra>(`${this.apiUrl}/ordenes/${id}/`);
  }

  crearOrden(payload: CrearOrdenPayload): Observable<OrdenDeCompra> {
    return this.http.post<OrdenDeCompra>(`${this.apiUrl}/ordenes/crear/`, payload);
  }

  aprobarRechazar(id: number, payload: AprobarRechazarPayload): Observable<OrdenDeCompra> {
    return this.http.post<OrdenDeCompra>(
      `${this.apiUrl}/ordenes/${id}/aprobar-rechazar/`, payload
    );
  }

  recepcionar(id: number, payload: RecepcionPayload): Observable<any> {
    return this.http.post(`${this.apiUrl}/ordenes/${id}/recepcionar/`, payload);
  }

  // ── Facturas y pagos ─────────────────────────────────────────────────────
  getFacturas(): Observable<FacturaProveedor[]> {
    return this.http.get<FacturaProveedor[]>(`${this.apiUrl}/facturas/`);
  }

  crearFactura(payload: FacturaCreatePayload): Observable<FacturaProveedor> {
    return this.http.post<FacturaProveedor>(`${this.apiUrl}/facturas/crear/`, payload);
  }

  registrarPago(facturaId: number, payload: PagoCreatePayload): Observable<FacturaProveedor> {
    return this.http.post<FacturaProveedor>(
      `${this.apiUrl}/facturas/${facturaId}/registrar-pago/`, payload
    );
  }
}
