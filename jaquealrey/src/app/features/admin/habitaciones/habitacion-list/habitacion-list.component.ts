import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HabitacionService } from '../../../../core/services/habitacion.service';
import { AdminService } from '../../../../core/services/admin.service';
import { Habitacion } from '../../../../core/models/habitacion.model';
import { ToastService } from '../../../../shared/services/toast.service';
import { CurrencyArPipe } from '../../../../shared/pipes/currency-ar.pipe';
import { BackButtonComponent } from '../../../../shared/components/back-button/back-button.component';

@Component({
  selector: 'app-habitacion-list',
  standalone: true,
  imports: [RouterLink, CurrencyArPipe, BackButtonComponent],
  template: `
    <div class="container admin-page">
      <div class="admin-header">
        <app-back-button fallbackUrl="/admin" fallbackLabel="Volver al Panel" />
        <div class="header-row">
          <h1 class="page-title">Gestionar Habitaciones</h1>
          <a routerLink="/admin/habitaciones/nueva" [state]="{ returnUrl: '/admin/habitaciones' }"
            class="btn btn-primary">+ Nueva Habitación</a>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Cargando habitaciones...</p>
        </div>
      } @else {
        <div class="card table-card">
          <div class="table-responsive">
            <table class="table table-striped">
              <thead>
                <tr>
                  <th>Número</th>
                  <th>Nombre</th>
                  <th>Tipo</th>
                  <th>Capacidad</th>
                  <th>Precio/Noche</th>
                  <th>Activa</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (hab of habitaciones(); track hab.id) {
                  <tr>
                    <td>{{ hab.numero }}</td>
                    <td>{{ hab.nombre }}</td>
                    <td><span class="badge badge-info">{{ hab.tipo }}</span></td>
                    <td>{{ hab.capacidad_max }} pers.</td>
                    <td>{{ hab.precio_noche | currencyAr }}</td>
                    <td>
                      @if (hab.activa) {
                        <span class="badge badge-success">Sí</span>
                      } @else {
                        <span class="badge badge-danger">No</span>
                      }
                    </td>
                    <td class="actions-cell">
                      <a [routerLink]="['/admin/habitaciones', hab.id]" [state]="{ returnUrl: '/admin/habitaciones' }"
                        class="btn btn-outline btn-sm">Editar</a>
                      <button class="btn btn-danger btn-sm" (click)="confirmDelete(hab)">Eliminar</button>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="7" class="empty-state">No hay habitaciones registradas</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      @if (showModal()) {
        <div class="modal-overlay" (click)="cancelDelete()">
          <div class="card modal-card" (click)="$event.stopPropagation()">
            <div class="card-body">
              <h3>Confirmar Eliminación</h3>
              <p>¿Estás seguro de que deseas eliminar la habitación <strong>{{ deleteTarget()?.nombre }}</strong> (N°{{ deleteTarget()?.numero }})?</p>
              <div class="modal-actions">
                <button class="btn btn-outline" (click)="cancelDelete()">Cancelar</button>
                <button class="btn btn-danger" (click)="deleteHabitacion()">Eliminar</button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    .admin-page { padding-top: 2rem; padding-bottom: 3rem; }
    .admin-header { margin-bottom: 1.5rem; }
    .header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .header-row h1 { font-size: 1.75rem; font-weight: 600; font-family: var(--font-heading); }

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
      width: 36px; height: 36px;
      border-radius: 50%;
      border: 3px solid var(--border);
      border-top-color: var(--gold);
      border-right-color: var(--gold-light);
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .table-card { overflow: hidden; }
    .table-responsive { overflow-x: auto; }
    .empty-state {
      text-align: center;
      color: var(--text-light);
      padding: 2rem 1rem !important;
    }
    .actions-cell {
      display: flex;
      gap: 0.5rem;
      flex-wrap: nowrap;
    }

    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }
    .modal-card {
      width: 100%;
      max-width: 420px;
    }
    .modal-card h3 { margin-bottom: 0.75rem; }
    .modal-card p { color: var(--text-light); margin-bottom: 1.25rem; }
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }

    @media (max-width: 768px) {
      .actions-cell { flex-direction: column; }
    }
  `
})
export class AdminHabitacionListComponent implements OnInit {
  private habitacionService = inject(HabitacionService);
  private adminService = inject(AdminService);
  private toast = inject(ToastService);

  habitaciones = signal<Habitacion[]>([]);
  loading = signal(true);
  showModal = signal(false);
  deleteTarget = signal<Habitacion | null>(null);

  ngOnInit() {
    this.loadHabitaciones();
  }

  loadHabitaciones() {
    this.loading.set(true);
    this.habitacionService.getHabitaciones().subscribe({
      next: (res) => {
        if (res.status === '1') this.habitaciones.set(res.data);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Error al cargar las habitaciones');
        this.loading.set(false);
      },
    });
  }

  confirmDelete(hab: Habitacion) {
    this.deleteTarget.set(hab);
    this.showModal.set(true);
  }

  cancelDelete() {
    this.showModal.set(false);
    this.deleteTarget.set(null);
  }

  deleteHabitacion() {
    const hab = this.deleteTarget();
    if (!hab) return;

    this.adminService.deleteHabitacion(hab.id).subscribe({
      next: (res) => {
        if (res.status === '1') {
          this.toast.success('Habitación eliminada correctamente');
          this.habitaciones.update((list) => list.filter((h) => h.id !== hab.id));
        } else {
          this.toast.error(res.msg || 'Error al eliminar');
        }
        this.cancelDelete();
      },
      error: () => {
        this.toast.error('Error al eliminar la habitación');
        this.cancelDelete();
      },
    });
  }
}
