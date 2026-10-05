import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HabitacionService } from '../../../../core/services/habitacion.service';
import { HabitacionImagenService } from '../../../../core/services/habitacion-imagen.service';
import { Habitacion } from '../../../../core/models/habitacion.model';
import { CurrencyArPipe } from '../../../../shared/pipes/currency-ar.pipe';

@Component({
  selector: 'app-habitacion-detail',
  standalone: true,
  imports: [RouterLink, CurrencyArPipe],
  template: `
    <div class="container page">
      @if (loading()) {
        <p class="loading-state" role="status">Cargando habitacion...</p>
      } @else if (loadError()) {
        <div class="empty card">
          <div class="card-body text-center">
            <p class="empty-icon"><i class="fas fa-plug-circle-xmark"></i></p>
            <p>No pudimos cargar la habitacion.</p>
            <p><small>Revisa la conexion con el servidor.</small></p>
          </div>
        </div>
      } @else if (!habitacion()) {
        <div class="empty card">
          <div class="card-body text-center">
            <p class="empty-icon"><i class="fas fa-magnifying-glass"></i></p>
            <p>Habitacion no encontrada.</p>
            <a routerLink="/habitaciones" class="btn btn-outline mt-2">Volver a Habitaciones</a>
          </div>
        </div>
      } @else {
        <a routerLink="/habitaciones" class="back-link">&larr; Volver a Habitaciones</a>

        <div class="detail-layout">
          <div class="detail-image" [style.background]="gradient()">
            <span class="room-number">{{ habitacion()!.numero }}</span>
          </div>

          <div class="detail-info">
            <div class="card">
              <div class="card-body">
                <div class="detail-header">
                  <h1>{{ habitacion()!.nombre }}</h1>
                  <span class="badge badge-info">{{ habitacion()!.tipo }}</span>
                </div>

                <p class="description">{{ habitacion()!.descripcion }}</p>

                <div class="specs">
                  <div class="spec">
                    <span class="spec-label">Capacidad</span>
                    <span class="spec-value">Hasta {{ habitacion()!.capacidad_max }} huespedes</span>
                  </div>
                  <div class="spec">
                    <span class="spec-label">Camas individuales</span>
                    <span class="spec-value">{{ habitacion()!.camas_individuales }}</span>
                  </div>
                  <div class="spec">
                    <span class="spec-label">Camas matrimoniales</span>
                    <span class="spec-value">{{ habitacion()!.camas_matrimoniales }}</span>
                  </div>
                </div>

                <div class="price-row">
                  <div class="price-display">
                    <span class="price-value">{{ habitacion()!.precio_noche | currencyAr }}</span>
                    <span class="price-unit">por noche</span>
                  </div>
                  <a [routerLink]="['/reserva']"
                     [queryParams]="{ habitacion_id: habitacion()!.id, precio: habitacion()!.precio_noche }"
                     class="btn btn-primary btn-lg">
                    Reservar esta habitacion
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    .page { padding: clamp(3rem, 6vw, 5rem) 0; }
    .loading-state {
      padding: 2.5rem 1rem;
      border-block: 1px solid var(--border);
      color: var(--text-light);
      text-align: center;
    }
    .back-link {
      display: inline-block;
      margin-bottom: 1.75rem;
      color: var(--text-light);
      font-size: 0.9375rem;
      transition: color 0.2s;
    }
    .back-link:hover { color: var(--gold); }

    .detail-layout {
      display: grid;
      grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
      gap: clamp(2rem, 5vw, 4.5rem);
      align-items: center;
    }
    .detail-image {
      height: min(62vw, 520px);
      min-height: 360px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .room-number {
      font-family: var(--font-heading);
      font-size: clamp(5rem, 10vw, 8rem);
      font-weight: 400;
      color: rgba(255, 255, 255, 0.78);
    }
    .detail-info .card {
      border: 0;
      border-radius: 0;
      background: transparent;
      box-shadow: none;
    }
    .detail-info .card-body { padding: 0; }

    .detail-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    .detail-header h1 {
      margin: 0;
      font-size: clamp(2.3rem, 4.5vw, 3.4rem);
      font-weight: 500;
      line-height: 1;
    }
    .description {
      color: var(--text-light);
      line-height: 1.7;
      margin-bottom: 1.5rem;
    }

    .specs {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      padding: 1.25rem 0;
      border-top: 1px solid var(--border);
      border-bottom: 1px solid var(--border);
      margin-bottom: 1.75rem;
    }
    .spec-label {
      display: block;
      font-size: 0.8125rem;
      color: var(--text-light);
      margin-bottom: 0.25rem;
    }
    .spec-value {
      font-weight: 600;
      font-size: 1.125rem;
    }

    .price-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding-top: 0.25rem;
    }
    .price-value {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--gold-dark);
    }
    .price-unit {
      display: block;
      font-size: 0.875rem;
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

    @media (max-width: 768px) {
      .page { padding: 2.75rem 0 3.5rem; }
      .detail-layout { grid-template-columns: 1fr; gap: 1.75rem; }
      .detail-image { height: 270px; min-height: 270px; }
      .room-number { font-size: 3rem; }
      .specs { grid-template-columns: 1fr; }
      .price-row { flex-direction: column; align-items: flex-start; }
    }
  `
})
export class HabitacionDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private habitacionService = inject(HabitacionService);
  private imagenes = inject(HabitacionImagenService);

  habitacion = signal<Habitacion | null>(null);
  loading = signal(true);
  loadError = signal(false);

  gradient(): string {
    return this.imagenes.fondoPara(this.habitacion());
  }

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) { this.loading.set(false); return; }

    this.habitacionService.getHabitacion(id).subscribe({
      next: (res) => {
        if (res.status === '1') this.habitacion.set(res.data);
        else this.loadError.set(true);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set(true);
        this.loading.set(false);
      },
    });
  }
}
