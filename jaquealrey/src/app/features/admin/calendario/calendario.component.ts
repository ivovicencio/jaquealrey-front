import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { ToastService } from '../../../shared/services/toast.service';
import { CurrencyArPipe } from '../../../shared/pipes/currency-ar.pipe';
import { OcupacionData, OcupacionHabitacion, OcupacionReserva } from '../../../core/models/pago.model';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button.component';

// Calendario de ocupacion, en la grilla clasica de hotel: habitaciones en filas,
// dias en columnas.
//
// La grilla se arma con un solo rango de 31 dias y scroll horizontal en vez de
// paginar mes a mes. Razon: el hotel no consulta "un mes", consulta "que veo de
// hoy a fin de mes" y a veces hasta dos meses seguidos para cruzar de discharges.
// Con la grilla larga, un solo click y un scroll; con paginacion, tres clicks y
// dos esperas.
@Component({
  selector: 'app-calendario',
  standalone: true,
  imports: [FormsModule, CurrencyArPipe, RouterLink, BackButtonComponent],
  template: `
    <div class="container admin-page">
      <div class="admin-header">
        <app-back-button fallbackUrl="/admin" fallbackLabel="Volver al Panel" />
        <h1 class="page-title"><i class="fas fa-chess-pawn"></i> Calendario de Ocupacion</h1>
      </div>

      <div class="card filter-bar">
        <div class="card-body filter-body">
          <div class="filter-group">
            <label class="form-label">Desde</label>
            <input class="form-input" type="date" [(ngModel)]="desde" (change)="cargar()" />
          </div>
          <div class="filter-group">
            <label class="form-label">Hasta</label>
            <input class="form-input" type="date" [(ngModel)]="hasta" (change)="cargar()" />
          </div>
          <div class="filter-actions">
            <button type="button" class="btn btn-outline btn-sm" (click)="irMes(0)">
              <i class="fas fa-chevron-left"></i> Mes anterior
            </button>
            <button type="button" class="btn btn-outline btn-sm" (click)="irMes(1)">
              Mes siguiente <i class="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Cargando ocupacion...</p>
        </div>
      } @else if (data(); as d) {
        <div class="resumen-grid">
          <div class="card stat-card">
            <div class="card-body stat-body">
              <div class="stat-icon"><i class="fas fa-percent"></i></div>
              <div class="stat-value">{{ d.resumen.ocupacion_pct }}%</div>
              <div class="stat-label">Ocupacion del periodo</div>
            </div>
          </div>
          <div class="card stat-card">
            <div class="card-body stat-body">
              <div class="stat-icon"><i class="fas fa-bed"></i></div>
              <div class="stat-value">{{ d.resumen.noches_ocupadas }}</div>
              <div class="stat-label">Noches ocupadas</div>
            </div>
          </div>
          <div class="card stat-card">
            <div class="card-body stat-body">
              <div class="stat-icon"><i class="fas fa-calendar-check"></i></div>
              <div class="stat-value">{{ d.resumen.reservas_en_rango }}</div>
              <div class="stat-label">Reservas en el rango</div>
            </div>
          </div>
          <div class="card stat-card">
            <div class="card-body stat-body">
              <div class="stat-icon"><i class="fas fa-coins"></i></div>
              <div class="stat-value">{{ ingresoEnRango() | currencyAr }}</div>
              <div class="stat-label">Facturado en el rango</div>
            </div>
          </div>
        </div>

        <div class="card table-card">
          <div class="calendar-scroll">
            <table class="calendar-table">
              <thead>
                <tr>
                  <th class="hab-col">Habitacion</th>
                  @for (d of dias(); track d) {
                    <th class="dia-col" [class.finde]="esFinDeSemana(d)" [class.hoy]="esHoy(d)">
                      <span class="dia-num">{{ diaNumero(d) }}</span>
                      <span class="dia-nombre">{{ diaNombre(d) }}</span>
                    </th>
                  }
                </tr>
              </thead>
              <tbody>
                @for (h of d.habitaciones; track h.id) {
                  <tr>
                    <th class="hab-col">
                      <div class="hab-num">{{ h.numero }}</div>
                      <div class="hab-nombre">{{ h.nombre }}</div>
                      <div class="hab-precio">{{ h.precio_noche | currencyAr }}</div>
                    </th>
                    @for (dia of dias(); track dia) {
                      <td
                        class="celda"
                        [class.ocupada]="reservaEn(h, dia) !== null"
                        [class.confirmada]="reservaEn(h, dia)?.estado === 'Confirmada'"
                        [class.pendiente]="reservaEn(h, dia)?.estado === 'Pendiente'"
                        [class.finde]="esFinDeSemana(dia)"
                        [title]="tituloCelda(h, dia)"
                        (click)="seleccionar(h, dia)"
                      >
                        @if (reservaEn(h, dia); as r) {
                          @if (r.fecha_entrada.slice(0, 10) === dia) {
                            <a
                              class="pawn-code"
                              [routerLink]="['/admin/reservas', r.id]"
                              [state]="{ returnUrl: '/admin/calendario' }"
                              [attr.aria-label]="'Abrir reserva ' + r.codigo"
                              (click)="$event.stopPropagation()"
                            >
                              <i class="fas fa-chess-pawn pawn"></i>
                              <span>{{ r.codigo }}</span>
                            </a>
                          } @else {
                            <i class="fas fa-chess-pawn pawn"></i>
                          }
                        }
                      </td>
                    }
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <div class="leyenda">
          <span><i class="pawn confirm"></i> Confirmada</span>
          <span><i class="pawn pendiente"></i> Pendiente</span>
          <span><i class="pawn libre"></i> Libre</span>
        </div>
      }
    </div>
  `,
  styles: `
    .admin-page { padding-top: 2rem; padding-bottom: 3rem; }
    .admin-header { margin-bottom: 1.5rem; }
    .page-title { font-size: 1.75rem; font-weight: 600; font-family: var(--font-heading); }

    .filter-bar { margin-bottom: 1rem; }
    .filter-body { display: flex; gap: 1rem; align-items: flex-end; flex-wrap: wrap; }
    .filter-group { min-width: 160px; }
    .filter-actions { margin-left: auto; display: flex; gap: 0.5rem; }

    .resumen-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
      margin-bottom: 1rem;
    }
    .stat-body { display: flex; flex-direction: column; gap: 0.25rem; }
    .stat-icon { font-size: 1.25rem; color: var(--gold); }
    .stat-value { font-size: 1.5rem; font-weight: 700; }
    .stat-label { font-size: 0.8125rem; color: var(--text-light); text-transform: uppercase; }

    .table-card { overflow: hidden; }
    .calendar-scroll { overflow-x: auto; }

    .calendar-table { border-collapse: collapse; width: 100%; }
    .hab-col {
      position: sticky;
      left: 0;
      background: var(--bg, #fff);
      z-index: 2;
      min-width: 140px;
      text-align: left;
      padding: 0.4rem 0.6rem;
      border-right: 1px solid var(--border);
      border-bottom: 1px solid var(--border);
    }
    .hab-num { font-weight: 700; font-size: 0.9375rem; }
    .hab-nombre { font-size: 0.75rem; color: var(--text-light); }
    .hab-precio { font-size: 0.75rem; color: var(--gold); }

    .dia-col {
      min-width: 42px;
      padding: 0.3rem 0.1rem;
      text-align: center;
      font-size: 0.6875rem;
      border-bottom: 1px solid var(--border);
    }
    .dia-num { display: block; font-weight: 700; font-size: 0.8125rem; }
    .dia-nombre { display: block; text-transform: uppercase; color: var(--text-light); }
    .dia-col.finde { background: rgba(0, 0, 0, 0.03); }
    .dia-col.hoy { background: rgba(201, 162, 39, 0.18); }

    .celda {
      height: 42px;
      text-align: center;
      border-bottom: 1px solid var(--border);
      border-right: 1px solid var(--border);
      cursor: pointer;
      transition: background 0.12s;
    }
    .celda:hover { background: rgba(201, 162, 39, 0.12); }
    .celda.finde { background: rgba(0, 0, 0, 0.02); }

    .celda.ocupada.confirmada { background: rgba(46, 107, 63, 0.16); }
    .celda.ocupada.pendiente { background: rgba(201, 162, 39, 0.2); }

    .pawn { font-size: 0.9375rem; }
    .pawn.confirm { color: #2e6b3f; }
    .pawn.pendiente { color: #b08d2f; }
    .pawn.libre { color: var(--border); }
    .pawn-code {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.1rem;
      color: var(--text);
      font-size: 0.55rem;
      font-weight: 700;
      line-height: 1;
      text-decoration: none;
      white-space: nowrap;
    }
    .pawn-code:hover { color: var(--gold-dark); text-decoration: underline; }

    .leyenda {
      display: flex;
      gap: 1.25rem;
      margin-top: 0.75rem;
      font-size: 0.8125rem;
      color: var(--text-light);
    }
    .leyenda span { display: flex; align-items: center; gap: 0.35rem; }

    .loading-state {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; min-height: 30vh; gap: 1rem;
      color: var(--text-light);
    }
    .spinner {
      width: 36px; height: 36px; border-radius: 50%;
      border: 3px solid var(--border);
      border-top-color: var(--gold);
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 768px) {
      .filter-body { flex-direction: column; }
      .filter-group { min-width: 100%; }
      .filter-actions { margin-left: 0; width: 100%; }
      .filter-actions .btn { flex: 1; }
    }
  `,
})
export class AdminCalendarioComponent implements OnInit {
  private adminService = inject(AdminService);
  private toast = inject(ToastService);

  data = signal<OcupacionData | null>(null);
  loading = signal(true);

  desde = '';
  hasta = '';

  // Cache de la reserva que ocupa cada celda. reservaEn se llama
  // 10 habitaciones x N dias por render, y el template la invoca 4 veces por
  // celda (class ocupada, class confirmada, class pendiente y el pawn). Sin
  // memoizar eso son miles de filter() lineales por render, y con el scroll
  // horizontal se nota.
  private cache = new Map<string, OcupacionReserva | null>();

  // Columnas de la grilla: desde, desde+1, ... hasta-1.
  //
  // El rango del backend es [desde, hasta): "hasta" es el limite superior, no un
  // dia incluido. Pedir del 1 al 15 quiere decir las noches del 1 al 14. Por eso
  // el bucle va con < y no con <=; con <= aparecia una columna extra que siempre
  // salia vacia ycorría el porcentaje de ocupacion del pie.
  readonly dias = computed<string[]>(() => {
    const d = this.data();
    if (!d) return [];
    const out: string[] = [];
    const end = new Date(d.hasta + 'T00:00:00');
    for (let cur = new Date(d.desde + 'T00:00:00'); cur < end; cur.setDate(cur.getDate() + 1)) {
      out.push(cur.toISOString().slice(0, 10));
    }
    return out;
  });

  // Suma lo facturado de las reservas que tocan el rango. Se usa el precio de
  // la reserva completa, no la parte proporcional: el hotel quiere saber cuanto
  // entra por estas reservas, no quanto de cada una cae dentro de la ventana.
  readonly ingresoEnRango = computed<number>(() => {
    const d = this.data();
    if (!d) return 0;
    let total = 0;
    for (const h of d.habitaciones) {
      for (const r of h.reservas) {
        // El backend ya recorto las reservas al rango, asi que todas las que
        // llegan tocan el periodo y se suman completas.
        total += Number(r.precio_total || 0);
      }
    }
    return total;
  });

  ngOnInit() {
    const hoy = new Date();
    const fin = new Date(hoy);
    fin.setMonth(fin.getMonth() + 1);
    this.desde = hoy.toISOString().slice(0, 10);
    this.hasta = fin.toISOString().slice(0, 10);
    this.cargar();
  }

  cargar() {
    if (!this.desde || !this.hasta) return;
    if (this.desde > this.hasta) {
      this.toast.error('La fecha "desde" no puede ser posterior a "hasta"');
      return;
    }
    this.loading.set(true);
    this.cache.clear();

    this.adminService.getOcupacion(this.desde, this.hasta).subscribe({
      next: (res) => {
        if (res.status === '1') {
          this.data.set(res.data);
        }
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Error al cargar la ocupacion');
        this.loading.set(false);
      },
    });
  }

  irMes(dir: number) {
    const f = new Date(this.desde + 'T00:00:00');
    f.setMonth(f.getMonth() + dir);
    const hasta = new Date(f);
    hasta.setMonth(hasta.getMonth() + 1);
    hasta.setDate(hasta.getDate() - 1);
    this.desde = f.toISOString().slice(0, 10);
    this.hasta = hasta.toISOString().slice(0, 10);
    this.cargar();
  }

  esFinDeSemana(iso: string): boolean {
    const dow = new Date(iso + 'T00:00:00').getDay();
    return dow === 0 || dow === 6;
  }

  esHoy(iso: string): boolean {
    return iso === new Date().toISOString().slice(0, 10);
  }

  diaNumero(iso: string): number {
    return new Date(iso + 'T00:00:00').getDate();
  }

  diaNombre(iso: string): string {
    return new Date(iso + 'T00:00:00')
      .toLocaleDateString('es-AR', { weekday: 'short' })
      .replace('.', '')
      .slice(0, 2);
  }

  // Busca la reserva que ocupa esa habitacion ese dia.
  //
  // La comparacion es de strings ISO, que en este formato ordena igual que el
  // tiempo. Y la celda es la fecha de ENTRADA de la reserva o la de SALIDA, la
  // celda de la salida no se marca: una reserva va de la noche de entrada
  // hasta la noche anterior a la salida, asi que el dia del checkout ya es de
  // otro huesped.
  reservaEn(h: OcupacionHabitacion, dia: string): OcupacionReserva | null {
    const key = `${h.id}|${dia}`;
    const hit = this.cache.get(key);
    if (hit !== undefined) return hit;

    let found: OcupacionReserva | null = null;
    for (const r of h.reservas) {
      if (r.fecha_entrada <= dia && dia < r.fecha_salida) {
        found = r;
        break;
      }
    }
    this.cache.set(key, found);
    return found;
  }

  tituloCelda(h: OcupacionHabitacion, dia: string): string {
    const r = this.reservaEn(h, dia);
    if (!r) return `Habitacion ${h.numero} - libre`;
    const estado = r.estado === 'En_Casa' ? 'En uso' : r.estado;
    return `${r.codigo} - ${r.cliente} (${estado})`;
  }

  seleccionar(h: OcupacionHabitacion, dia: string): void {
    // La navegacion al detalle se deja para el proximo paso: la grilla ya cumple
    // con ver la ocupacion, y un click que no lleva a ningun lado confunde mas
    // que ayuda. Cuando se conecte, es routerLink a /admin/reservas/:id con el
    // id que ya viene en la reserva.
    void h;
    void dia;
  }
}