import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HabitacionService } from '../../../../core/services/habitacion.service';
import { HabitacionImagenService } from '../../../../core/services/habitacion-imagen.service';
import { Habitacion } from '../../../../core/models/habitacion.model';
import { CurrencyArPipe } from '../../../../shared/pipes/currency-ar.pipe';

@Component({
  selector: 'app-habitacion-list',
  standalone: true,
  imports: [RouterLink, FormsModule, CurrencyArPipe],
  template: `
    <div class="container page">
      <div class="page-header">
        <span class="section-tag">Explora</span>
        <h1>Nuestras Habitaciones</h1>
        <p class="page-subtitle">Encontrá la habitación perfecta para tu estadía en la Patagonia</p>
      </div>

      <div class="layout">
        <aside class="sidebar card">
          <div class="card-body">
            <h4>Filtros</h4>

            <div class="filter-group">
              <span class="form-label">Tipo</span>
              @for (t of tipos; track t) {
                <label class="checkbox">
                  <input type="checkbox" [value]="t" (change)="onTipoChange(t, $event)" />
                  <span>{{ t }}</span>
                </label>
              }
            </div>

            <div class="form-group">
              <label class="form-label">Capacidad minima</label>
              <select class="form-select" (change)="onCapacidadChange($event)">
                <option [value]="0">Cualquier capacidad</option>
                <option [value]="1">1 huesped</option>
                <option [value]="2">2 huespedes</option>
                <option [value]="3">3 huespedes</option>
                <option [value]="4">4 huespedes</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Precio maximo: {{ precioMax() === 0 ? 'Sin limite' : precioMax() | currencyAr }}</label>
              <input type="range" class="range-input" min="0" [max]="maxPrice" step="500"
                     [value]="precioMax()" (input)="onPrecioChange($event)" />
            </div>

            <button class="btn btn-outline" style="width:100%" (click)="clearFilters()">Limpiar filtros</button>
          </div>
        </aside>

        <div class="content">
          @if (loading()) {
            <p class="loading-state" role="status">Cargando habitaciones...</p>
          } @else if (loadError()) {
            <div class="empty card">
              <div class="card-body text-center">
                <p class="empty-icon"><i class="fas fa-plug-circle-xmark"></i></p>
                <p>No pudimos cargar las habitaciones.</p>
                <p><small>Revisa la conexion con el servidor y volve a intentar.</small></p>
                <button class="btn btn-primary mt-2" (click)="cargar()">Reintentar</button>
              </div>
            </div>
          } @else if (filtered().length === 0) {
            <div class="empty card">
              <div class="card-body text-center">
                <p class="empty-icon"><i class="fas fa-bed"></i></p>
                <p>No se encontraron habitaciones con los filtros seleccionados.</p>
                <button class="btn btn-outline mt-2" (click)="clearFilters()">Limpiar filtros</button>
              </div>
            </div>
          } @else {
            <p class="results-count">{{ filtered().length }} habitacion(es) encontrada(s)</p>
            <div class="rooms-grid">
              @for (h of filtered(); track h.id) {
                <div class="card room-card">
                  <div class="room-image" [style.background]="gradientFor(h)">
                    <span class="room-number">{{ h.numero }}</span>
                  </div>
                  <div class="card-body">
                    <div class="room-header">
                      <h4>{{ h.nombre }}</h4>
                      <span class="badge badge-info">{{ h.tipo }}</span>
                    </div>
                    <div class="room-meta">
                      <span>Hasta {{ h.capacidad_max }} huespedes</span>
                    </div>
                    <div class="room-footer">
                      <span class="price">{{ h.precio_noche | currencyAr }} <small>/noche</small></span>
                      <a [routerLink]="['/habitaciones', h.id]" class="btn btn-primary btn-sm">Ver Detalle</a>
                    </div>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: `
    .page { padding: clamp(3rem, 6vw, 5rem) 0; }
    .page-header {
      max-width: 760px;
      margin: 0 0 2.5rem;
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

    .layout {
      display: grid;
      grid-template-columns: 230px minmax(0, 1fr);
      gap: clamp(1.5rem, 4vw, 3.5rem);
      align-items: start;
    }
    .sidebar.card {
      position: sticky;
      top: 5.5rem;
      border: 0;
      border-right: 1px solid var(--border-strong);
      border-radius: 0;
      background: transparent;
      box-shadow: none;
    }
    .sidebar .card-body { padding: 0 1.5rem 0 0; }
    .sidebar h4 { margin-bottom: 1rem; }
    .filter-group { margin-bottom: 1.25rem; }
    .checkbox {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.375rem 0;
      font-size: 0.9375rem;
      cursor: pointer;
    }
    .checkbox input { accent-color: var(--gold); }
    .range-input {
      width: 100%;
      accent-color: var(--gold);
    }

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
      position: relative;
    }
    .room-card .card-body { padding: 1rem 0 1.25rem; }
    .room-number {
      font-family: var(--font-heading);
      font-size: 4rem;
      font-weight: 400;
      color: rgba(255, 255, 255, 0.84);
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
    .empty {
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
      .layout { grid-template-columns: 1fr; gap: 1.75rem; }
      .sidebar.card {
        position: static;
        border-right: 0;
        border-bottom: 1px solid var(--border-strong);
        padding-bottom: 1.25rem;
      }
      .sidebar .card-body { padding: 0; }
      .rooms-grid { grid-template-columns: 1fr; }
      .room-image { height: 220px; }
    }
  `
})
export class HabitacionListComponent implements OnInit {
  private habitacionService = inject(HabitacionService);
  private imagenes = inject(HabitacionImagenService);

  habitaciones = signal<Habitacion[]>([]);
  filtered = signal<Habitacion[]>([]);
  loading = signal(true);
  loadError = signal(false);

  tipos = ['Doble', 'Triple', 'Cuádruple'];
  selectedTipos = new Set<string>();
  capacidadMin = signal(0);
  precioMax = signal(0);
  maxPrice = 50000;

  gradientFor(h: Habitacion): string {
    return this.imagenes.fondoPara(h);
  }

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.loading.set(true);
    this.loadError.set(false);
    this.habitacionService.getHabitaciones().subscribe({
      next: (res) => {
        if (res.status === '1') {
          const data = res.data;
          this.habitaciones.set(data);
          this.filtered.set(data);
          if (data.length) {
            this.maxPrice = Math.ceil(Math.max(...data.map(h => h.precio_noche)) / 1000) * 1000;
          }
        } else {
          this.loadError.set(true);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set(true);
        this.loading.set(false);
      },
    });
  }

  onTipoChange(tipo: string, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) this.selectedTipos.add(tipo);
    else this.selectedTipos.delete(tipo);
    this.applyFilters();
  }

  onCapacidadChange(event: Event) {
    this.capacidadMin.set(Number((event.target as HTMLSelectElement).value));
    this.applyFilters();
  }

  onPrecioChange(event: Event) {
    this.precioMax.set(Number((event.target as HTMLInputElement).value));
    this.applyFilters();
  }

  clearFilters() {
    this.selectedTipos.clear();
    this.capacidadMin.set(0);
    this.precioMax.set(0);
    this.filtered.set(this.habitaciones());
  }

  private applyFilters() {
    const result = this.habitaciones().filter(h => {
      if (this.selectedTipos.size && !this.selectedTipos.has(h.tipo)) return false;
      if (this.capacidadMin() && h.capacidad_max < this.capacidadMin()) return false;
      if (this.precioMax() && h.precio_noche > this.precioMax()) return false;
      return true;
    });
    this.filtered.set(result);
  }
}
