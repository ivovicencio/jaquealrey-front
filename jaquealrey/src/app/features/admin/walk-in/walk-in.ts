import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { HabitacionService } from '../../../core/services/habitacion.service';
import { ToastService } from '../../../shared/services/toast.service';
import { AppModeService } from '../../../core/services/app-mode.service';
import { AuthService } from '../../../core/services/auth.service';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button.component';

@Component({
  selector: 'app-admin-walk-in',
  standalone: true,
  imports: [RouterLink, FormsModule, BackButtonComponent],
  template: `
    <div class="container admin-page">
      @if (appMode.esAppEscritorio()) {
        <div class="app-bar">
          <span class="app-bar-brand"><i class="fas fa-chess-king"></i> Hotel Jaque al Rey</span>
          <span class="app-bar-sep"></span>
          <a routerLink="/admin/hoy" class="app-bar-link">Hoy</a>
          <a routerLink="/admin/walk-in" class="app-bar-link">Walk-in</a>
          <a routerLink="/admin/reservas" class="app-bar-link">Reservas</a>
          <button type="button" class="app-bar-salir" (click)="logout()">Salir</button>
        </div>
      }

      <div class="admin-header">
        <app-back-button fallbackUrl="/admin/hoy" fallbackLabel="Volver a Hoy" />
        <h1 class="page-title">Nueva reserva (walk-in)</h1>
        <p class="subtitle">Al crearla queda confirmada y pagada por el total de la estadía.</p>
      </div>

      <form class="card form" (ngSubmit)="guardar()">
        <div class="grid">
          <label>Nombre *
            <input [(ngModel)]="form.nombre" name="nombre" required />
          </label>
          <label>Apellido
            <input [(ngModel)]="form.apellido" name="apellido" />
          </label>
          <label>Teléfono *
            <input [(ngModel)]="form.telefono" name="telefono" required />
          </label>
          <label>Email *
            <input type="email" [(ngModel)]="form.email" name="email" required />
          </label>
          <label>Habitación *
            <select [(ngModel)]="form.habitacion_id" name="habitacion_id" required>
              <option [ngValue]="0" disabled>Elegir...</option>
              @for (h of habitaciones(); track h.id) {
                <option [ngValue]="h.id">{{ h.numero }} — {{ h.nombre }} ({{ h.tipo }})</option>
              }
            </select>
          </label>
          <label>Huéspedes *
            <input type="number" min="1" [(ngModel)]="form.huespedes" name="huespedes" required />
          </label>
          <label>Entrada *
            <input type="date" [(ngModel)]="form.fecha_entrada" name="fecha_entrada" required />
          </label>
          <label>Salida *
            <input type="date" [(ngModel)]="form.fecha_salida" name="fecha_salida" required />
          </label>
          <label class="full">Notas
            <textarea [(ngModel)]="form.notas" name="notas" rows="2"></textarea>
          </label>
        </div>

        <div class="actions">
          <a routerLink="/admin/hoy" class="btn btn-ghost">Cancelar</a>
          <button type="submit" class="btn btn-primary" [disabled]="saving()">
            {{ saving() ? 'Guardando...' : 'Crear reserva' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: `
    .admin-page { padding-top: 2rem; padding-bottom: 3rem; }
    .app-bar {
      display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;
      margin: -2rem 0 2rem; padding: 0.85rem 1.25rem; background: var(--dark); color: #fff;
    }
    .app-bar-brand { color: var(--gold-light); font-weight: 600; }
    .app-bar-sep { flex: 1; }
    .app-bar-link { color: rgba(255,255,255,0.85); text-decoration: none; }
    .app-bar-salir {
      background: transparent; color: #fff; border: 1.5px solid rgba(255,255,255,0.4);
      border-radius: var(--radius); padding: 0.4rem 0.9rem; cursor: pointer;
    }
    .subtitle { color: var(--text-light); margin-bottom: 1.25rem; }
    .form { padding: 1.25rem; }
    .grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem;
    }
    label { display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.9rem; font-weight: 600; }
    label.full { grid-column: 1 / -1; }
    input, select, textarea {
      font: inherit; font-weight: 400; padding: 0.55rem 0.7rem;
      border: 1px solid var(--border); border-radius: var(--radius); background: #fff;
    }
    .actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.25rem; }
    .btn {
      border: none; border-radius: var(--radius); padding: 0.55rem 1rem; font-weight: 600;
      cursor: pointer; text-decoration: none; display: inline-flex; align-items: center;
    }
    .btn-primary { background: var(--gold); color: #111; }
    .btn-ghost { background: transparent; border: 1px solid var(--border); color: var(--text); }
    .btn:disabled { opacity: 0.6; }
  `,
})
export class AdminWalkInComponent implements OnInit {
  private adminService = inject(AdminService);
  private habitacionService = inject(HabitacionService);
  private toast = inject(ToastService);
  private router = inject(Router);
  readonly appMode = inject(AppModeService);
  private authService = inject(AuthService);

  saving = signal(false);
  habitaciones = signal<any[]>([]);

  form = {
    nombre: '',
    apellido: '',
    telefono: '',
    email: '',
    habitacion_id: 0,
    fecha_entrada: '',
    fecha_salida: '',
    huespedes: 1,
    notas: '',
  };

  ngOnInit() {
    // Un walk-in entra hoy y, si no dice nada, se va mañana. Dejarlo en blanco
    // obliga al recepcionista a tocar el calendario para el caso mas comun.
    const hoy = this.hoyLocal();
    this.form.fecha_entrada = hoy;
    this.form.fecha_salida = this.desplazar(hoy, 1);

    this.habitacionService.getHabitaciones().subscribe({
      next: (res) => {
        if (res.status === '1') {
          const data = Array.isArray(res.data) ? res.data : (res.data as any)?.habitaciones || [];
          this.habitaciones.set(data);
        }
      },
      error: () => this.toast.error('No se pudieron cargar las habitaciones'),
    });
  }

  private hoyLocal(): string {
    const d = new Date();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mes}-${dia}`;
  }

  private desplazar(iso: string, dias: number): string {
    const [a, m, d] = iso.split('-').map(Number);
    const f = new Date(a, m - 1, d + dias);
    const mes = String(f.getMonth() + 1).padStart(2, '0');
    const dia = String(f.getDate()).padStart(2, '0');
    return `${f.getFullYear()}-${mes}-${dia}`;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  guardar() {
    if (!this.form.habitacion_id) {
      this.toast.error('Elegí una habitación');
      return;
    }
    if (this.form.fecha_salida <= this.form.fecha_entrada) {
      this.toast.error('La salida tiene que ser posterior a la entrada');
      return;
    }
    this.saving.set(true);
    this.adminService.createWalkIn({
      ...this.form,
      habitacion_id: Number(this.form.habitacion_id),
      huespedes: Number(this.form.huespedes),
    }).subscribe({
      next: (res) => {
        this.saving.set(false);
        if (res.status === '1') {
          this.toast.success(`Reserva ${res.data.codigo} creada`);
          this.router.navigate(['/admin/hoy']);
        } else {
          this.toast.error(res.msg || 'No se pudo crear');
        }
      },
      error: (err) => {
        this.saving.set(false);
        this.toast.error(err?.error?.msg || 'Error al crear la reserva');
      },
    });
  }
}