import { Component, inject, signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <span class="auth-icon"><i class="fas fa-chess-king"></i></span>
        <h1 class="auth-title">Iniciar Sesion</h1>
        <p class="auth-subtitle">Bienvenido de vuelta</p>
        <form (ngSubmit)="onSubmit()" #loginForm="ngForm">
          <div class="form-group">
            <label class="form-label" for="email"><i class="fas fa-envelope"></i> Correo Electronico</label>
            <input
              class="form-input"
              id="email"
              type="email"
              name="email"
              placeholder="tu&#64;email.com"
              [(ngModel)]="email"
              required
              email
              #emailField="ngModel"
            />
            @if (emailField.invalid && emailField.touched) {
              <span class="form-error">Ingrese un correo valido</span>
            }
          </div>
          <div class="form-group">
            <label class="form-label" for="password"><i class="fas fa-lock"></i> Contrasena</label>
            <input
              class="form-input"
              id="password"
              type="password"
              name="password"
              placeholder="••••••••"
              [(ngModel)]="password"
              required
              minlength="6"
              #passwordField="ngModel"
            />
            @if (passwordField.invalid && passwordField.touched) {
              <span class="form-error">La contrasena es requerida</span>
            }
          </div>
          <button
            class="btn btn-primary btn-block"
            type="submit"
            [disabled]="loading() || loginForm.invalid"
          >
            @if (loading()) {
              <span class="spinner"></span> Cargando...
            } @else {
              Iniciar Sesion
            }
          </button>
        </form>
        <p class="auth-footer">
          Este acceso es solo para el personal del hotel.<br />
          Si sos huesped, no necesitas cuenta: consultá tu reserva con el código JAR y el
          correo con el que reservaste.
        </p>
      </div>
    </div>
  `,
  styles: `
    .auth-page {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 2rem 1rem;
      background: linear-gradient(135deg, var(--dark) 0%, var(--dark-2) 100%);
    }
    .auth-card {
      width: 100%;
      max-width: 400px;
      background: var(--surface);
      border-radius: var(--radius);
      padding: 40px;
      box-shadow: var(--shadow-lg);
      text-align: center;
    }
    .auth-icon {
      font-size: 3rem;
      color: var(--gold);
      display: block;
      margin-bottom: 8px;
    }
    .auth-title {
      font-size: 1.5rem;
      margin-bottom: 4px;
    }
    .auth-subtitle {
      color: var(--text-light);
      font-size: 0.85rem;
      margin-bottom: 28px;
    }
    .auth-card .form-group {
      text-align: left;
    }
    .auth-card .form-group input {
      width: 100%;
    }
    .auth-card .btn-block {
      width: 100%;
      margin-top: 8px;
    }
    .auth-footer {
      text-align: center;
      margin-top: 1.5rem;
      font-size: 0.85rem;
      color: var(--text-light);
    }
    .spinner {
      display: inline-block;
      width: 1rem;
      height: 1rem;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `
})
export class LoginComponent {
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  email = '';
  password = '';
  loading = signal(false);

  onSubmit(): void {
    if (!this.email || !this.password) return;

    this.loading.set(true);
    this.authService.login(this.email, this.password).subscribe({
      next: () => {
        this.toastService.success('Sesión iniciada correctamente');
        // Si el guard nos mando acá con returnUrl, volvemos a donde estabamos.
        const pedido = this.route.snapshot.queryParamMap.get('returnUrl');
        const destino = pedido && pedido.startsWith('/') ? pedido : '/admin';
        this.router.navigateByUrl(this.authService.isAdmin() ? destino : '/');
      },
      error: (err) => {
        this.loading.set(false);
        this.toastService.error(err.error?.msg || 'Credenciales incorrectas');
      }
    });
  }
}
