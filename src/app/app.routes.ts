// src/app/app.routes.ts
import { Routes, UrlSegment, UrlMatchResult } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegistrationComponent } from './registration/registration.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { ResetPasswordConfirmComponent } from './reset-password-confirm/reset-password-confirm.component';
import { InviteUserComponent } from './invite-user/invite-user.component';
import { UbicacionesComponent } from './ubicaciones/ubicaciones.component';
import { LayoutComponent } from './layout/layout.component';
import { ProductsComponent } from './products/products.component';
import { AjusteInventarioComponent } from './ajuste-inventario/ajuste-inventario.component';
import { ReportesComponent } from './reportes/reportes.component';
import { AdminGuard } from './guards/admin.guard';
import { LotesComponent } from './lotes/lotes.component';
import { StockComponent } from './stock/stock.component';
import { PuntoVentaComponent } from './punto-venta/punto-venta.component';
import { HistorialVentasComponent } from './historial-ventas/historial-ventas.component';
import { OrdenesCompraComponent } from './compras/ordenes-compra/ordenes-compra.component';
import { CrearOrdenComponent } from './compras/crear-orden/crear-orden.component';
import { DetalleOrdenComponent } from './compras/detalle-orden/detalle-orden.component';
import { FacturasComprasComponent } from './compras/facturas-compras/facturas-compras.component';
import { AuthGuard } from './guards/auth.guard';

export function activateAccountMatcher(segments: UrlSegment[]): UrlMatchResult | null {
    if (segments.length === 3 && segments[0].path === 'activar-cuenta') {
        const uid = segments[1].path;
        const token = segments[2].path;
        return {
            consumed: segments,
            posParams: {
                uid: new UrlSegment(uid, {}),
                token: new UrlSegment(token, {})
            }
        };
    }
    return null;
}

const children: Routes = [
  { path: 'inventario/productos', component: ProductsComponent, canActivate: [AuthGuard] },
  { path: 'inventario/ubicaciones', component: UbicacionesComponent, canActivate: [AuthGuard] },
  { path: 'inventario/lotes', component: LotesComponent, canActivate: [AuthGuard] },
  { path: 'inventario/stock', component: StockComponent, canActivate: [AuthGuard] },
  { path: 'inventario/ajustes', component: AjusteInventarioComponent, canActivate: [AuthGuard] },
  { path: 'inventario/reportes', component: ReportesComponent, canActivate: [AuthGuard] },
  { path: 'ventas/punto-venta', component: PuntoVentaComponent, canActivate: [AuthGuard] },
  { path: 'ventas/historial', component: HistorialVentasComponent, canActivate: [AuthGuard] },
  { path: 'admin/invite-user', component: InviteUserComponent, canActivate: [AdminGuard] },
  { path: 'compras/ordenes', component: OrdenesCompraComponent, canActivate: [AuthGuard] },
  { path: 'compras/nueva-orden', component: CrearOrdenComponent, canActivate: [AuthGuard] },
  { path: 'compras/orden/:id', component: DetalleOrdenComponent, canActivate: [AuthGuard] },
  { path: 'compras/facturas', component: FacturasComprasComponent, canActivate: [AuthGuard] },
];

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'forgot-password', component: ForgotPasswordComponent },
    { matcher: activateAccountMatcher, component: RegistrationComponent },
    { path: 'reset-password-confirm/:uid/:token', component: ResetPasswordConfirmComponent },
    { path: '', redirectTo: '/login', pathMatch: 'full' },
    { path: '', component: LayoutComponent, children },
];
