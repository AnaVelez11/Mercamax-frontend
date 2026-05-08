import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterModule} from '@angular/router';
import { AuthService, LoginResponse, TwoFactorResponse } from '../services/auth.service';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit{
  loginForm: FormGroup;
  twoFactorForm: FormGroup;
  roles: {value:string; view_value: string} [] = [];
  errorMessage = '';
  loading = false;
  loadingRoles = true;
  showTwoFactor = false;
  tempToken: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private http: HttpClient
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
      rol: ['', Validators.required]
    });
    this.twoFactorForm = this.fb.group({
      code: ['', [Validators.required, Validators.pattern('^[0-9]{6}$')]], // Valida que sean 6 dígitos
      rememberDevice: [false]
    });
  }

  ngOnInit(): void {
    this.cargarRoles();
    const savedLogin = localStorage.getItem('login_data');
    if (savedLogin) {
      this.loginForm.patchValue(JSON.parse(savedLogin));
    }
    this.cargarRoles();
    }
    cargarRoles(): void{
      this.loadingRoles = true;
      this.http.get<{ value: string; view_value: string }[]>(`${environment.apiUrl}/users/roles/`)
      .subscribe({
        next: (roles) => {
          console.log('Roles cargados:', roles);
          this.roles = roles;
          this.loadingRoles = false;
        },
        error: (error) => {
          this.errorMessage = 'Error al cargar los roles.';
          this.roles = [
            { value: 'CAJERO', view_value: 'Cajero' },
            { value: 'ENCARGADO_INVENTARIO', view_value: 'Encargado de Inventario' },
            { value: 'GERENTE_COMPRAS', view_value: 'Gerente de Compras' },
            { value: 'GERENTE_SUPERMERCADO', view_value: 'Gerente del Supermercado' }
          ];
          this.loadingRoles = false;
        }
      });
  }
  onSubmit(): void {
    if (!this.loginForm.valid) return;
    this.loading = true;

    this.authService.login(this.loginForm.value).subscribe({
      next: (response: LoginResponse) => {
        if (response.step === '2fa_required') {
          this.tempToken = response.token || null;
          this.showTwoFactor = true;
        } else if (response.token) {
          localStorage.setItem('auth_token', response.token);
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          this.redirigirSegunRol(user.rol);
        }
        this.loading = false;
      },
      error: (error) => {
        const status = error.status;
        const detail = error.error?.non_field_errors?.[0]
          || error.error?.detail
          || '';

        if (status === 429 || detail.toLowerCase().includes('bloqueado') || detail.toLowerCase().includes('locked')) {
          this.errorMessage = 'Cuenta bloqueada temporalmente por múltiples intentos fallidos. Intenta de nuevo en 1 hora.';
        } else if (detail.includes('rol')) {
          this.errorMessage = 'El rol seleccionado no corresponde a este usuario. Verifica tu rol e intenta de nuevo.';
        } else if (status === 400) {
          this.errorMessage = 'Usuario o contraseña incorrectos. Verifica tus datos e intenta de nuevo.';
        } else if (status === 0 || status >= 500) {
          this.errorMessage = 'Error de conexión con el servidor. Intenta más tarde.';
        } else {
          this.errorMessage = 'No se pudo iniciar sesión. Verifica tus datos.';
        }

        this.loading = false;
      }
    });
  }

  onSubmitTwoFactor(): void {
    if (this.twoFactorForm.valid && this.tempToken) {
      this.loading = true;
      this.authService.verifyTwoFactor({
        code: this.twoFactorForm.value.code,
        temp_token: this.tempToken
      }).subscribe({
        next: (response: TwoFactorResponse) => {
          Swal.fire({
            title: '¡Éxito!',
            text: 'Autenticación de dos factores completada correctamente.',
            icon: 'success',
            confirmButtonColor: '#00bf63',
            confirmButtonText: 'Continuar'
          }).then(() => {
            localStorage.setItem('auth_token', response.token);
            this.redirigirSegunRol(response.rol);
          });
          this.loading = false;
        },
        error: () => {
          this.errorMessage = 'Código inválido o expirado.';
          this.loading = false;
        }
      });
    }
  }

  backToLogin(): void {
    this.showTwoFactor = false;
    this.twoFactorForm.reset();
    this.errorMessage = '';
  }

  // Método helper para redirigir según rol
  private redirigirSegunRol(rol: string): void {
    const rutas: Record<string, string> = {
      'ENCARGADO_INVENTARIO':  '/inventario/productos',
      'GERENTE_SUPERMERCADO':  '/inventario/productos',
      'CAJERO':                '/ventas/punto-venta',
      'GERENTE_COMPRAS':       '/compras/ordenes',  // placeholder por ahora
    };
    this.router.navigate([rutas[rol] || '/inventario/productos']);
  }
}

