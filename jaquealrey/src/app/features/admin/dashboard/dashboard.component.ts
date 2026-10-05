import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminService } from '../../../core/services/admin.service';
import { NotificationService } from '../../../core/services/notification.service';
import { DashboardData } from '../../../core/models/dashboard.model';
import { ToastService } from '../../../shared/services/toast.service';
import { AppModeService } from '../../../core/services/app-mode.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="container admin-page">
      @if (appMode.esAppEscritorio()) {
        <div class="app-bar">
          <span class="app-bar-brand">
            <i class="fas fa-chess-king"></i> Hotel Jaque al Rey
          </span>
          <span class="app-bar-sep"></span>
          <a routerLink="/admin" class="app-bar-link">Panel</a>
          <a routerLink="/admin/hoy" class="app-bar-link">Hoy</a>
          <a routerLink="/admin/walk-in" class="app-bar-link">Walk-in</a>
          <a routerLink="/admin/reservas" class="app-bar-link">Reservas</a>
          <a routerLink="/admin/calendario" class="app-bar-link">Calendario</a>
          <a routerLink="/admin/pagos" class="app-bar-link">Pagos</a>
          <a routerLink="/admin/habitaciones" class="app-bar-link">Habitaciones</a>
          <a routerLink="/admin/historial" class="app-bar-link">Historial</a>
          <button type="button" class="app-bar-salir" (click)="logout()">Salir</button>
        </div>
      }

      <div class="admin-header">
        <h1 class="page-title">Panel de Administracion</h1>
      </div>

      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Cargando datos...</p>
        </div>
      } @else if (data()) {
        <div class="stats-grid">
          @for (stat of stats(); track stat.label) {
            <div class="card stat-card">
              <div class="card-body stat-body">
                <div class="stat-icon"><i [class]="stat.icon"></i></div>
                <div class="stat-value">{{ stat.value }}</div>
                <div class="stat-label">{{ stat.label }}</div>
              </div>
            </div>
          }
        </div>

        <div class="quick-actions">
          <h2>Acciones Rapidas</h2>
          <div class="actions-grid">
            <a routerLink="/admin/hoy" class="card action-card">
              <div class="card-body action-body">
                <span class="action-icon"><i class="fas fa-sun"></i></span>
                <span class="action-label">Hoy (recepción)</span>
              </div>
            </a>
            <a routerLink="/admin/walk-in" [state]="{ returnUrl: '/admin' }" class="card action-card">
              <div class="card-body action-body">
                <span class="action-icon"><i class="fas fa-user-plus"></i></span>
                <span class="action-label">Walk-in</span>
              </div>
            </a>
            <a routerLink="/admin/reservas" class="card action-card">
              <div class="card-body action-body">
                <span class="action-icon"><i class="fas fa-clipboard-list"></i></span>
                <span class="action-label">Ver Reservas</span>
              </div>
            </a>
            <a routerLink="/admin/calendario" class="card action-card">
              <div class="card-body action-body">
                <span class="action-icon"><i class="fas fa-chess-pawn"></i></span>
                <span class="action-label">Calendario</span>
              </div>
            </a>
            <a routerLink="/admin/pagos" class="card action-card">
              <div class="card-body action-body">
                <span class="action-icon"><i class="fas fa-money-bill-transfer"></i></span>
                <span class="action-label">Pagos e Ingresos</span>
              </div>
            </a>
            <a routerLink="/admin/habitaciones" class="card action-card">
              <div class="card-body action-body">
                <span class="action-icon"><i class="fas fa-bed"></i></span>
                <span class="action-label">Habitaciones</span>
              </div>
            </a>
            <a routerLink="/admin/historial" class="card action-card">
              <div class="card-body action-body">
                <span class="action-icon"><i class="fas fa-clock-rotate-left"></i></span>
                <span class="action-label">Historial</span>
              </div>
            </a>
          </div>
        </div>
      } @else {
        <div class="card" role="alert">
          <div class="card-body">
            <p>{{ loadError() }}</p>
            <button type="button" class="btn btn-primary" (click)="load()">Reintentar</button>
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    .admin-page { padding-top: 2rem; padding-bottom: 3rem; }

    .app-bar {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      flex-wrap: wrap;
      margin: -2rem 0 2rem;
      padding: 0.85rem 1.25rem;
      background: var(--dark);
      color: #fff;
    }
    .app-bar-brand {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-family: var(--font-heading);
      font-weight: 600;
      color: var(--gold-light);
    }
    .app-bar-sep { flex: 1; }
    .app-bar-link {
      color: rgba(255, 255, 255, 0.85);
      text-decoration: none;
      font-size: 0.9rem;
    }
    .app-bar-link:hover { color: var(--gold-light); text-decoration: underline; }
    .app-bar-salir {
      background: transparent;
      color: #fff;
      border: 1.5px solid rgba(255, 255, 255, 0.4);
      border-radius: var(--radius);
      padding: 0.4rem 0.9rem;
      font-size: 0.85rem;
      cursor: pointer;
    }
    .app-bar-salir:hover { background: rgba(255, 255, 255, 0.12); }

    .admin-header { margin-bottom: 2rem; }
    .admin-header h1 { font-size: 1.75rem; font-weight: 600; font-family: var(--font-heading); }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 30vh;
      gap: 1rem;
      color: var(--text-light);
    }
    .spinner {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: 3px solid var(--border);
      border-top-color: var(--gold);
      border-right-color: var(--gold-light);
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2.5rem;
    }
    .stat-card { transition: transform 0.15s; }
    .stat-card:hover { transform: translateY(-2px); }
    .stat-body { text-align: center; padding: 1.5rem 1rem; }
    .stat-icon { font-size: 2rem; margin-bottom: 0.5rem; }
    .stat-value {
      font-size: 1.75rem;
      font-weight: 700;
      font-family: var(--font-heading);
      color: var(--gold-dark);
      margin-bottom: 0.25rem;
    }
    .stat-label {
      font-size: 0.8125rem;
      color: var(--text-light);
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .quick-actions h2 {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 1rem;
    }
    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
    }
    .action-card {
      text-decoration: none;
      transition: transform 0.15s, box-shadow 0.15s;
    }
    .action-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }
    .action-body {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1.25rem;
    }
    .action-icon { font-size: 1.5rem; }
    .action-label {
      font-weight: 600;
      color: var(--text);
    }

    @media (max-width: 640px) {
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
      .actions-grid { grid-template-columns: 1fr; }
    }
  `,
})
export class DashboardComponent implements OnInit {
  private adminService = inject(AdminService);
  private toast = inject(ToastService);
  private notifications = inject(NotificationService);
  private destroyRef = inject(DestroyRef);
  readonly appMode = inject(AppModeService);
  private authService = inject(AuthService);
  private router = inject(Router);

  data = signal<DashboardData | null>(null);
  loading = signal(true);
  loadError = signal('No se pudieron cargar los datos del panel.');

  stats = signal<{ icon: string; value: string | number; label: string }[]>([]);

  constructor() {
    this.notifications
      .onNuevaReserva()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.load());

    this.notifications
      .onReservaActualizada()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.load());

    this.notifications
      .onSesionRevocada()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.authService.logout();
        this.router.navigate(['/login']);
      });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.adminService.getDashboard().subscribe({
      next: (res) => {
        if (res.status === '1') {
          this.data.set(res.data);
          this.stats.set([
            { icon: 'fas fa-clipboard-list', value: res.data.reservas_activas, label: 'Reservas Activas' },
            { icon: 'fas fa-calendar-days', value: res.data.reservas_proximas_7_dias, label: 'Próximos 7 días' },
            {
              icon: 'fas fa-file-invoice-dollar',
              value: '$' + res.data.facturado_mes_actual.toLocaleString('es-AR'),
              label: 'Facturado del Mes',
            },
            {
              icon: 'fas fa-sack-dollar',
              value: '$' + res.data.cobrado_mes_actual.toLocaleString('es-AR'),
              label: 'Cobrado del Mes',
            },
            { icon: 'fas fa-users', value: res.data.total_clientes, label: 'Total Clientes' },
            { icon: 'fas fa-bed', value: res.data.habitaciones_activas, label: 'Habitaciones Activas' },
          ]);
        } else {
          this.loadError.set(res.msg || 'No se pudieron cargar los datos del panel.');
        }
        this.loading.set(false);
      },
      error: (error: { status?: number; error?: { msg?: string } }) => {
        const message =
          error.error?.msg ||
          (error.status === 429
            ? 'Hay muchas solicitudes recientes. Esperá un momento y reintentá.'
            : 'No se pudieron cargar los datos del panel.');
        this.loadError.set(message);
        this.toast.error(message);
        this.loading.set(false);
      },
    });
  }
}