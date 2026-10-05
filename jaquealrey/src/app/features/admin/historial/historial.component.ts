import { Component, inject, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';
import { HistorialReserva } from '../../../core/models/historial.model';
import { ToastService } from '../../../shared/services/toast.service';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button.component';

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [DatePipe, BackButtonComponent],
  template: `
    <div class="container admin-page">
      <div class="admin-header">
        <app-back-button fallbackUrl="/admin" fallbackLabel="Volver al Panel" />
        <h1 class="page-title">Historial de Cambios</h1>
      </div>

      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Cargando historial...</p>
        </div>
      } @else {
        <div class="card table-card">
          <div class="table-responsive">
            <table class="table table-striped">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Reserva</th>
                  <th>Acción</th>
                  <th>Detalle</th>
                  <th>Realizada por</th>
                </tr>
              </thead>
              <tbody>
                @for (h of historial(); track h.id) {
                  <tr>
                    <td>{{ h.created_at | date:'dd/MM/yyyy HH:mm' }}</td>
                    <td><strong>{{ h.reserva_codigo || '#' + h.reserva_id }}</strong></td>
                    <td>
                      <span [class]="'badge ' + accionBadge(h.accion)">{{ h.accion }}</span>
                    </td>
                    <td>{{ h.detalle }}</td>
                    <td>{{ h.realizada_por }}</td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="5" class="empty-state">No hay registros en el historial</td>
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
  `
})
export class HistorialComponent implements OnInit {
  private adminService = inject(AdminService);
  private toast = inject(ToastService);

  historial = signal<HistorialReserva[]>([]);
  loading = signal(true);
  pagina = signal(1);
  totalPaginas = signal(1);

  ngOnInit() {
    this.loadHistorial();
  }

  loadHistorial() {
    this.loading.set(true);
    this.adminService.getHistorial({ pagina: this.pagina(), limite: 15 }).subscribe({
      next: (res) => {
        if (res.status === '1') {
          this.historial.set(res.data.historial);
          this.totalPaginas.set(res.data.total_paginas);
          this.pagina.set(res.data.pagina);
        }
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Error al cargar el historial');
        this.loading.set(false);
      },
    });
  }

  goPage(p: number) {
    this.pagina.set(p);
    this.loadHistorial();
  }

  accionBadge(accion: string): string {
    const lower = accion.toLowerCase();
    if (lower.includes('crear') || lower.includes('create')) return 'badge-success';
    if (lower.includes('cancel')) return 'badge-danger';
    if (lower.includes('confirm')) return 'badge-info';
    if (lower.includes('complet')) return 'badge-success';
    if (lower.includes('actualiz') || lower.includes('update')) return 'badge-warning';
    return 'badge';
  }
}
