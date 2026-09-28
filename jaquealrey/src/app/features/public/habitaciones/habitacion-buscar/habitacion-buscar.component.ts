import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HabitacionService } from '../../../../core/services/habitacion.service';
import { Habitacion } from '../../../../core/models/habitacion.model';
import { CurrencyArPipe } from '../../../../shared/pipes/currency-ar.pipe';

@Component({
  selector: 'app-habitacion-buscar',
  standalone: true,
  imports: [RouterLink, FormsModule, CurrencyArPipe],
  template: `
    <div class="container page">
      <div class="page-header">
        <span class="section-tag">Disponibilidad</span>
        <h1>Buscar Disponibilidad</h1>
        <p class="page-subtitle">Elegí tus fechas y encontrá las mejores opciones para tu viaje</p>
      </div>

      <div class="card search-card">
        <div class="card-body">
          <div class="search-form">
            <div class="form-group">
              <label class="form-label">Fecha de entrada</label>
              <input type="date" class="form-input" [(ngModel)]="fechaEntrada" [min]="minDate" />
            </div>
            <div class="form-group">
              <label class="form-label">Fecha de salida</label>
              <input type="date" class="form-input" [(ngModel)]="fechaSalida" [min]="fechaEntrada || minDate" />
            </div>
            <div class="form-group">
              <label class="form-label">Capacidad</label>
              <select class="form-select" [(ngModel)]="capacidad">
                <option [value]="0">Cualquier capacidad</option>
                <option [value]="1">1 huesped</option>
                <option [value]="2">2 huespedes</option>
                <option [value]="3">3 huespedes</option>
                <option [value]="4">4 huespedes</option>
              </select>
            </div>
            <div class="form-group search-btn-wrap">
              <label class="form-label">&nbsp;</label>
              <button class="btn btn-primary" (click)="buscar()" [disabled]="loading() || !fechaEntrada || !fechaSalida">
                @if (loading()) { Buscando... } @else { Buscar }
              </button>
            </div>
          </div>
          @if (error()) {
            <p class="form-error">{{ error() }}</p>
          }
        </div>
      </div>

      @if (searched()) {
        <div class="results-section">
          @if (resultados().length === 0) {
            <div class="empty card">
              <div class="card-body text-center">
                <p class="empty-icon"><i class="fas fa-face-frown"></i></p>
                <p>No hay habitaciones disponibles para esas fechas.</p>
                <p><small>Probá con otras fechas o capacidades.</small></p>
              </div>
            </div>
          } @else {
            <p class="results-count">{{ resultados().length }} habitacion(es) disponible(s)</p>
            <div class="rooms-grid">
              @for (h of filteredResults(); track h.id) {
                <div class="card room-card">
                  <div class="room-image" [style.background]="gradientFor(h)">
                    <span class="room-number">{{ h.numero }}</span>
                  </div>
                  <div class="card-body">
                    <div class="room-header">
                      <h4>{{ h.nombre }}</h4>
                      <span class="badge badge-success">Disponible</span>
                    </div>
                    <div class="room-meta">
                      <span>Hasta {{ h.capacidad_max }} huespedes</span>
                    </div>
                    <div class="room-footer">
                      <span class="price">{{ h.precio_noche | currencyAr }} <small>/noche</small></span>
                      <a [routerLink]="['/reserva']"
                         [queryParams]="{ habitacion_id: h.id, precio: h.precio_noche, desde: fechaEntrada, hasta: fechaSalida }"
                         class="btn btn-primary btn-sm">
                        Reservar
                      </a>
                    </div>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: `
    .page { padding: 2rem 0 4rem; }
    .page-header {
      text-align: center;
      margin-bottom: 2rem;
    }
    .page-header h1 { margin-bottom: 0.5rem; }
    .section-tag {
      display: inline-block;
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 2.5px;
      color: var(--gold);
      font-weight: 500;
      margin-bottom: 8px;
    }
    .page-subtitle {
      color: var(--text-light);
      font-size: 0.95rem;
      margin-bottom: 0;
    }
    .search-card { margin-bottom: 2rem; }
    .search-form {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr auto;
      gap: 1rem;
      align-items: end;
    }
    .search-btn-wrap { display: flex; flex-direction: column; }

    .results-count {
      font-size: 0.875rem;
      color: var(--text-light);
      margin-bottom: 1rem;
    }
    .rooms-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
    }
    .room-card { overflow: hidden; }
    .room-image {
      height: 160px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .room-number {
      font-size: 2.5rem;
      font-weight: 800;
      color: rgba(255, 255, 255, 0.7);
    }
    .room-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }
    .room-header h4 { margin: 0; }
    .room-meta {
      font-size: 0.875rem;
      color: var(--text-light);
      margin-bottom: 1rem;
    }
    .room-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .price {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--gold-dark);
    }
    .price small {
      font-weight: 400;
      font-size: 0.8125rem;
      color: var(--text-light);
    }
    .empty { margin-top: 2rem; padding: 2rem; }

    @media (max-width: 1024px) {
      .rooms-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 768px) {
      .search-form { grid-template-columns: 1fr; }
      .rooms-grid { grid-template-columns: 1fr; }
    }
  `
})
export class HabitacionBuscarComponent {
  private habitacionService = inject(HabitacionService);

  fechaEntrada = '';
  fechaSalida = '';
  capacidad = 0;

  resultados = signal<Habitacion[]>([]);
  filteredResults = signal<Habitacion[]>([]);
  loading = signal(false);
  searched = signal(false);
  error = signal('');

  minDate = new Date().toISOString().split('T')[0];

  private gradients = [
    'linear-gradient(135deg, var(--dark) 0%, var(--dark-2) 100%)',
    'linear-gradient(135deg, var(--gold-dark) 0%, var(--gold) 100%)',
    'linear-gradient(135deg, var(--dark-2) 0%, var(--gold-dark) 100%)',
    'linear-gradient(135deg, var(--gold) 0%, var(--gold-light) 100%)',
    'linear-gradient(135deg, #3d322b 0%, var(--dark) 100%)',
  ];

  gradientFor(h: Habitacion): string {
    return this.gradients[h.numero % this.gradients.length];
  }

  buscar() {
    this.error.set('');
    if (!this.fechaEntrada || !this.fechaSalida) {
      this.error.set('Seleccioná las fechas de entrada y salida.');
      return;
    }
    if (this.fechaSalida <= this.fechaEntrada) {
      this.error.set('La fecha de salida debe ser posterior a la de entrada.');
      return;
    }

    this.loading.set(true);
    this.searched.set(true);

    this.habitacionService.getDisponibles(this.fechaEntrada, this.fechaSalida).subscribe({
      next: (res) => {
        if (res.status === '1') {
          const data = res.data;
          this.resultados.set(data);
          this.filteredResults.set(
            this.capacidad ? data.filter(h => h.capacidad_max >= this.capacidad) : data
          );
        }
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Error al buscar disponibilidad. Intentá de nuevo.');
        this.loading.set(false);
      },
    });
  }
}
