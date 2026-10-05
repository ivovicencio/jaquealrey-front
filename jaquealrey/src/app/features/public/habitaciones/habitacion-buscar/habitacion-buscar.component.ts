import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HabitacionService } from '../../../../core/services/habitacion.service';
import { HabitacionImagenService } from '../../../../core/services/habitacion-imagen.service';
import { Habitacion } from '../../../../core/models/habitacion.model';
import { CurrencyArPipe } from '../../../../shared/pipes/currency-ar.pipe';
import { BackButtonComponent } from '../../../../shared/components/back-button/back-button.component';

@Component({
  selector: 'app-habitacion-buscar',
  standalone: true,
  imports: [RouterLink, FormsModule, CurrencyArPipe, BackButtonComponent],
  template: `
    <div class="container page">
      <div class="page-header">
        <app-back-button fallbackUrl="/habitaciones" fallbackLabel="Volver a Habitaciones" />
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
          @if (loading()) {
            <p class="loading-state" role="status">Buscando habitaciones disponibles...</p>
          } @else if (resultados().length === 0) {
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
                  <div
                    class="room-image"
                    [class.sin-foto]="!imagenes.tieneImagen(h)"
                    [style.background]="gradientFor(h)"
                  >
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
                         [state]="{ returnUrl: '/buscar-disponibilidad' }"
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
    .page { padding: clamp(3rem, 6vw, 5rem) 0; }
    .page-header {
      max-width: 760px;
      margin: 0 0 2rem;
      padding-bottom: 1.75rem;
      border-bottom: 1px solid var(--border);
    }
    .page-header h1 {
      margin-bottom: 0.4rem;
      font-size: clamp(2.4rem, 5vw, 3.5rem);
      font-weight: 500;
      line-height: 1;
    }
    .section-tag {
      display: inline-block;
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 2.5px;
      color: var(--gold-dark);
      font-weight: 500;
      margin-bottom: 8px;
    }
    .page-subtitle {
      color: var(--text-light);
      max-width: 52ch;
      font-size: 1rem;
      margin-bottom: 0;
    }
    .search-card {
      margin-bottom: 2.75rem;
      border: 0;
      border-top: 1px solid var(--border-strong);
      border-bottom: 1px solid var(--border);
      border-radius: 0;
      background: transparent;
      box-shadow: none;
    }
    .search-card .card-body { padding: 1.5rem 0; }
    .search-form {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr)) auto;
      gap: 1.25rem;
      align-items: end;
    }
    .search-btn-wrap { display: flex; flex-direction: column; }

    .results-count {
      font-size: 0.875rem;
      color: var(--text-light);
      margin-bottom: 1rem;
    }
    .loading-state {
      padding: 2.5rem 1rem;
      border-block: 1px solid var(--border);
      color: var(--text-light);
      text-align: center;
    }
    .rooms-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      column-gap: clamp(1rem, 3vw, 2.25rem);
      row-gap: 2rem;
    }
    .room-card {
      overflow: hidden;
      border: 0;
      border-bottom: 1px solid var(--border-strong);
      border-radius: 0;
      background: transparent;
      box-shadow: none;
    }
    .room-image {
      height: clamp(170px, 20vw, 230px);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .room-card .card-body { padding: 1rem 0 1.25rem; }
    .room-number {
      font-family: var(--font-heading);
      font-size: 4rem;
      font-weight: 400;
      color: rgba(255, 255, 255, 0.84);
    }
    .room-image.sin-foto .room-number { color: var(--text-light); }
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
    .empty {
      margin-top: 2rem;
      padding: 1rem;
      border: 0;
      border-radius: 0;
      background: var(--warm);
      box-shadow: none;
    }
    .empty .card-body { padding: 1.5rem; }

    @media (max-width: 1024px) {
      .rooms-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 768px) {
      .page { padding: 2.75rem 0 3.5rem; }
      .search-form { grid-template-columns: 1fr; gap: 0.5rem; }
      .rooms-grid { grid-template-columns: 1fr; }
      .room-image { height: 220px; }
    }
  `
})
export class HabitacionBuscarComponent {
  private habitacionService = inject(HabitacionService);
  readonly imagenes = inject(HabitacionImagenService);

  fechaEntrada = '';
  fechaSalida = '';
  capacidad = 0;

  resultados = signal<Habitacion[]>([]);
  filteredResults = signal<Habitacion[]>([]);
  loading = signal(false);
  searched = signal(false);
  error = signal('');

  minDate = new Date().toISOString().split('T')[0];

  gradientFor(h: Habitacion): string {
    return this.imagenes.fondoPara(h);
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
