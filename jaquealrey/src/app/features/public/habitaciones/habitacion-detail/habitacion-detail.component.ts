import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HabitacionService } from '../../../../core/services/habitacion.service';
import { Habitacion } from '../../../../core/models/habitacion.model';
import { CurrencyArPipe } from '../../../../shared/pipes/currency-ar.pipe';

@Component({
  selector: 'app-habitacion-detail',
  standalone: true,
  imports: [RouterLink, CurrencyArPipe],
  template: `
    <div class="container page">
      @if (loading()) {
        <p class="text-center" style="padding:3rem;color:var(--text-light)">Cargando habitacion...</p>
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
    .page { padding: 2rem 0 4rem; }
    .page h1 { margin-bottom: 1.5rem; }
    .back-link {
      display: inline-block;
      margin-bottom: 1.5rem;
      color: var(--text-light);
      font-size: 0.9375rem;
      transition: color 0.2s;
    }
    .back-link:hover { color: var(--gold); }

    .detail-layout {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      align-items: start;
    }
    .detail-image {
      border-radius: var(--radius-lg);
      height: 400px;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 300px;
    }
    .room-number {
      font-size: 5rem;
      font-weight: 800;
      color: rgba(255, 255, 255, 0.6);
    }

    .detail-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    .detail-header h1 { margin: 0; }
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
      margin-bottom: 1.5rem;
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

    .empty { margin-top: 2rem; padding: 3rem; }

    @media (max-width: 768px) {
      .detail-layout { grid-template-columns: 1fr; }
      .detail-image { height: 250px; }
      .room-number { font-size: 3rem; }
      .specs { grid-template-columns: 1fr; }
      .price-row { flex-direction: column; align-items: flex-start; }
    }
  `
})
export class HabitacionDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private habitacionService = inject(HabitacionService);

  habitacion = signal<Habitacion | null>(null);
  loading = signal(true);
  loadError = signal(false);

  private gradients = [
    'linear-gradient(135deg, var(--dark) 0%, var(--dark-2) 100%)',
    'linear-gradient(135deg, var(--gold-dark) 0%, var(--gold) 100%)',
    'linear-gradient(135deg, var(--dark-2) 0%, var(--gold-dark) 100%)',
    'linear-gradient(135deg, var(--gold) 0%, var(--gold-light) 100%)',
    'linear-gradient(135deg, #3d322b 0%, var(--dark) 100%)',
  ];

  gradient(): string {
    const h = this.habitacion();
    return h ? this.gradients[h.numero % this.gradients.length] : this.gradients[0];
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
