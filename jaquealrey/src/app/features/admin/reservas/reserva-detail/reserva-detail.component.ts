import { Component, inject, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../core/services/admin.service';
import { ReservaService } from '../../../../core/services/reserva.service';
import { Reserva } from '../../../../core/models/reserva.model';
import { ToastService } from '../../../../shared/services/toast.service';
import { CurrencyArPipe } from '../../../../shared/pipes/currency-ar.pipe';

@Component({
  selector: 'app-reserva-detail',
  standalone: true,
  imports: [FormsModule, RouterLink, CurrencyArPipe, DatePipe],
  template: `
    <div class="container admin-page">
      <div class="admin-header">
        <a routerLink="/admin/reservas" class="back-link"><i class="fas fa-arrow-left"></i> Volver a Reservas</a>
        <h1 class="page-title">Detalle de Reserva</h1>
      </div>

      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Cargando reserva...</p>
        </div>
      } @else if (reserva()) {
        <div class="detail-grid">
          <div class="card info-card">
            <div class="card-header">
              <h3>Información de la Reserva</h3>
              <span [class]="'badge ' + badgeClass(reserva()!.estado)">{{ reserva()!.estado }}</span>
            </div>
            <div class="card-body">
              <div class="info-rows">
                <div class="info-row">
                  <span class="info-label">Código</span>
                  <span class="info-value"><strong>{{ reserva()!.codigo }}</strong></span>
                </div>
                <div class="info-row">
                  <span class="info-label">Fecha de Entrada</span>
                  <span class="info-value">{{ reserva()!.fecha_entrada | date:'dd/MM/yyyy' }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Fecha de Salida</span>
                  <span class="info-value">{{ reserva()!.fecha_salida | date:'dd/MM/yyyy' }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Huéspedes</span>
                  <span class="info-value">{{ reserva()!.huespedes }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Precio Total</span>
                  <span class="info-value price">{{ reserva()!.precio_total | currencyAr }}</span>
                </div>
                @if (reserva()!.notas) {
                  <div class="info-row">
                    <span class="info-label">Notas</span>
                    <span class="info-value">{{ reserva()!.notas }}</span>
                  </div>
                }
              </div>
            </div>
          </div>

          <div class="side-cards">
            <div class="card info-card">
              <div class="card-header"><h3>Cliente</h3></div>
              <div class="card-body">
                <div class="info-rows">
                  <div class="info-row">
                    <span class="info-label">Nombre</span>
                    <span class="info-value">{{ reserva()!.cliente_nombre }} {{ reserva()!.cliente_apellido }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Email</span>
                    <span class="info-value">{{ reserva()!.cliente_email }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Teléfono</span>
                    <span class="info-value">{{ reserva()!.cliente_telefono }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="card info-card">
              <div class="card-header"><h3>Habitación</h3></div>
              <div class="card-body">
                <div class="info-rows">
                  <div class="info-row">
                    <span class="info-label">Número</span>
                    <span class="info-value">{{ reserva()!.habitacion_numero }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Nombre</span>
                    <span class="info-value">{{ reserva()!.habitacion_nombre }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Tipo</span>
                    <span class="info-value">{{ reserva()!.tipo }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="card status-card">
          <div class="card-header"><h3>Actualizar Estado</h3></div>
          <div class="card-body">
            <div class="status-form">
              <div class="form-group">
                <label class="form-label">Nuevo Estado</label>
                <select class="form-select" [(ngModel)]="nuevoEstado">
                  @for (opt of estadoOptions(); track opt) {
                    <option [value]="opt">{{ opt }}</option>
                  }
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Notas (opcional)</label>
                <textarea class="form-textarea" [(ngModel)]="notasCambio" rows="2"
                  placeholder="Motivo o comentario del cambio..."></textarea>
              </div>
              <button class="btn btn-primary" (click)="updateEstado()" [disabled]="updating()">
                @if (updating()) {
                  <span class="spinner-sm"></span> Actualizando...
                } @else {
                  Actualizar Estado
                }
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    .admin-page { padding-top: 2rem; padding-bottom: 3rem; }
    .admin-header { margin-bottom: 1.5rem; }
    .admin-header h1 { font-size: 1.75rem; font-weight: 600; font-family: var(--font-heading); margin-top: 0.5rem; }
    .back-link {
      font-size: 0.875rem;
      color: var(--text-light);
      text-decoration: none;
      font-weight: 500;
    }
    .back-link:hover { color: var(--gold); }

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

    .detail-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.25rem;
      margin-bottom: 1.25rem;
    }
    .side-cards {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .info-card .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .info-card .card-header h3 { margin: 0; font-size: 1rem; }
    .info-rows { display: flex; flex-direction: column; gap: 0.75rem; }
    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 1rem;
    }
    .info-label {
      font-size: 0.8125rem;
      color: var(--text-light);
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.02em;
      flex-shrink: 0;
    }
    .info-value { text-align: right; color: var(--text); }
    .info-value.price {
      font-weight: 700;
      font-size: 1.125rem;
      color: var(--gold-dark);
    }

    .status-card { margin-bottom: 1.25rem; }
    .status-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      max-width: 480px;
    }
    .spinner-sm {
      display: inline-block;
      width: 1rem; height: 1rem;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    @media (max-width: 768px) {
      .detail-grid { grid-template-columns: 1fr; }
    }
  `
})
export class AdminReservaDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private adminService = inject(AdminService);
  private toast = inject(ToastService);

  reserva = signal<Reserva | null>(null);
  loading = signal(true);
  updating = signal(false);

  nuevoEstado = '';
  notasCambio = '';

  estadoOptions = signal<string[]>([]);

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) this.loadReserva(id);
  }

  loadReserva(id: number) {
    this.adminService.getReservaById(id).subscribe({
      next: (res) => {
        if (res.status === '1') {
          const found = res.data;
          this.reserva.set(found);
          this.nuevoEstado = found.estado;
          this.updateEstadoOptions(found.estado);
        }
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Error al cargar la reserva');
        this.loading.set(false);
      },
    });
  }

  updateEstadoOptions(estado: string) {
    const transitions: Record<string, string[]> = {
      Pendiente: ['Confirmada', 'Cancelada'],
      Confirmada: ['Completada', 'Cancelada'],
      Completada: [],
      Cancelada: [],
    };
    this.estadoOptions.set(transitions[estado] || []);
  }

  updateEstado() {
    const r = this.reserva();
    if (!r || !this.nuevoEstado) return;

    this.updating.set(true);
    this.adminService.updateReservaEstado(r.id, this.nuevoEstado, this.notasCambio || undefined).subscribe({
      next: (res) => {
        if (res.status === '1') {
          this.toast.success('Estado actualizado correctamente');
          this.reserva.set(res.data);
          this.updateEstadoOptions(res.data.estado);
          this.notasCambio = '';
        } else {
          this.toast.error(res.msg || 'Error al actualizar');
        }
        this.updating.set(false);
      },
      error: () => {
        this.toast.error('Error al actualizar el estado');
        this.updating.set(false);
      },
    });
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
