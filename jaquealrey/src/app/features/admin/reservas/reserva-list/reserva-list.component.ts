import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminService } from '../../../../core/services/admin.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { Reserva } from '../../../../core/models/reserva.model';
import { ToastService } from '../../../../shared/services/toast.service';
import { CurrencyArPipe } from '../../../../shared/pipes/currency-ar.pipe';

@Component({
  selector: 'app-reserva-list',
  standalone: true,
  imports: [RouterLink, FormsModule, CurrencyArPipe, DatePipe],
  template: `
    <div class="container admin-page">
      <div class="admin-header">
        <h1 class="page-title">Gestionar Reservas</h1>
      </div>

      <div class="card filter-bar">
        <div class="card-body filter-body">
          <div class="filter-group">
            <label class="form-label">Estado</label>
            <select class="form-select" [(ngModel)]="filtroEstado" (change)="applyFilters()">
              <option value="">Todos</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Confirmada">Confirmada</option>
              <option value="Cancelada">Cancelada</option>
              <option value="Completada">Completada</option>
            </select>
          </div>
          <div class="filter-group">
            <label class="form-label">Desde</label>
            <input class="form-input" type="date" [(ngModel)]="filtroDesde" (change)="applyFilters()" />
          </div>
          <div class="filter-group">
            <label class="form-label">Hasta</label>
            <input class="form-input" type="date" [(ngModel)]="filtroHasta" (change)="applyFilters()" />
          </div>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Cargando reservas...</p>
        </div>
      } @else {
        <div class="card table-card">
          <div class="table-responsive">
            <table class="table table-striped">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Cliente</th>
                  <th>Habitación</th>
                  <th>Entrada</th>
                  <th>Salida</th>
                  <th>Huéspedes</th>
                  <th>Precio</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (r of reservas(); track r.id) {
                  <tr class="clickable-row" (click)="goToDetail(r.id)">
                    <td><strong>{{ r.codigo }}</strong></td>
                    <td>{{ r.cliente_nombre }} {{ r.cliente_apellido }}</td>
                    <td>{{ r.habitacion_numero }} - {{ r.habitacion_nombre }}</td>
                    <td>{{ r.fecha_entrada | date:'dd/MM/yyyy' }}</td>
                    <td>{{ r.fecha_salida | date:'dd/MM/yyyy' }}</td>
                    <td>{{ r.huespedes }}</td>
                    <td>{{ r.precio_total | currencyAr }}</td>
                    <td>
                      <span [class]="'badge ' + badgeClass(r.estado)">{{ r.estado }}</span>
                    </td>
                    <td>
                      <a [routerLink]="['/admin/reservas', r.id]" class="btn btn-outline btn-sm"
                        (click)="$event.stopPropagation()">Ver</a>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="9" class="empty-state">No se encontraron reservas</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          @if (totalPaginas() > 1) {
            <div class="pagination">
              <button class="btn btn-outline btn-sm" [disabled]="pagina() <= 1" (click)="goPage(pagina() - 1)">
                <i class="fas fa-arrow-left"></i> Anterior
              </button>
              <span class="page-info">Página {{ pagina() }} de {{ totalPaginas() }}</span>
              <button class="btn btn-outline btn-sm" [disabled]="pagina() >= totalPaginas()" (click)="goPage(pagina() + 1)">
                Siguiente <i class="fas fa-arrow-right"></i>
              </button>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: `
    .admin-page { padding-top: 2rem; padding-bottom: 3rem; }
    .admin-header { margin-bottom: 1.5rem; }
    .admin-header h1 { font-size: 1.75rem; font-weight: 600; font-family: var(--font-heading); }

    .filter-bar { margin-bottom: 1rem; }
    .filter-body {
      display: flex;
      gap: 1rem;
      align-items: flex-end;
      flex-wrap: wrap;
    }
    .filter-group { min-width: 160px; }

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
    .clickable-row { cursor: pointer; transition: background 0.15s; }
    .clickable-row:hover { background: var(--bg); }

    .pagination {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      padding: 1rem;
      border-top: 1px solid var(--border);
    }
    .page-info {
      font-size: 0.875rem;
      color: var(--text-light);
    }

    @media (max-width: 768px) {
      .filter-body { flex-direction: column; }
      .filter-group { min-width: 100%; }
    }
  `
})
export class AdminReservaListComponent implements OnInit {
  private adminService = inject(AdminService);
  private toast = inject(ToastService);
  private notifications = inject(NotificationService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  reservas = signal<Reserva[]>([]);
  loading = signal(true);
  pagina = signal(1);
  totalPaginas = signal(1);

  filtroEstado = '';
  filtroDesde = '';
  filtroHasta = '';

  constructor() {
    this.notifications
      .onNuevaReserva()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((r) => {
        this.toast.info(`Nueva reserva ${r.codigo} - ${r.cliente_nombre ?? ''} ${r.cliente_apellido ?? ''}`.trim());
        this.loadReservas();
      });

    this.notifications
      .onReservaActualizada()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadReservas());

    this.notifications
      .onAdminError()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((err) => this.toast.error(err.message));
  }

  ngOnInit() {
    this.loadReservas();
  }

  loadReservas() {
    this.loading.set(true);
    this.adminService.getReservas({
      estado: this.filtroEstado || undefined,
      desde: this.filtroDesde || undefined,
      hasta: this.filtroHasta || undefined,
      pagina: this.pagina(),
      limite: 10,
    }).subscribe({
      next: (res) => {
        if (res.status === '1') {
          this.reservas.set(res.data.reservas);
          this.totalPaginas.set(res.data.total_paginas);
          this.pagina.set(res.data.pagina);
        }
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Error al cargar las reservas');
        this.loading.set(false);
      },
    });
  }

  applyFilters() {
    this.pagina.set(1);
    this.loadReservas();
  }

  goPage(p: number) {
    this.pagina.set(p);
    this.loadReservas();
  }

  goToDetail(id: number) {
    this.router.navigate(['/admin/reservas', id]);
  }

  badgeClass(estado: string): string {
    switch (estado) {
      case 'Confirmada': return 'badge-success';
      case 'Pendiente': return 'badge-warning';
      case 'Cancelada': return 'badge-danger';
      case 'Completada': return 'badge-info';
      default: return 'badge';
    }
  }
}
