import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HabitacionService } from '../../../../core/services/habitacion.service';
import { HabitacionImagenService } from '../../../../core/services/habitacion-imagen.service';
import { ReservaService } from '../../../../core/services/reserva.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { Habitacion } from '../../../../core/models/habitacion.model';
import { CurrencyArPipe } from '../../../../shared/pipes/currency-ar.pipe';
import { TERMINOS_VERSION } from '../../legal/legal-content';

@Component({
  selector: 'app-reserva-form',
  standalone: true,
  imports: [RouterLink, FormsModule, CurrencyArPipe],
  template: `
    <div class="container page">
      <h1>Reservar Habitacion</h1>

      @if (loading()) {
        <p class="text-center" style="padding:3rem;color:var(--text-light)">Cargando informacion...</p>
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
            <p>No se pudo cargar la habitacion.</p>
            <a routerLink="/habitaciones" class="btn btn-outline mt-2">Ver Habitaciones</a>
          </div>
        </div>
      } @else {
        <div class="form-layout">
          <div class="card">
            <div class="card-body">
              <h3>Datos de la Reserva</h3>

              <div class="room-summary">
                <div class="room-badge" [style.background]="gradient()">
                  <span>{{ habitacion()!.numero }}</span>
                </div>
                <div>
                  <strong>{{ habitacion()!.nombre }}</strong>
                  <br />
                  <small>{{ habitacion()!.tipo }} - Hasta {{ habitacion()!.capacidad_max }} huespedes</small>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label" for="res-nombre">Nombre</label>
                  <input type="text" id="res-nombre" class="form-input" name="nombre" [(ngModel)]="form.nombre" placeholder="Tu nombre" autocomplete="given-name" required />
                  @if (submitted() && !form.nombre) {
                    <p class="form-error">El nombre es obligatorio</p>
                  }
                </div>
                <div class="form-group">
                  <label class="form-label" for="res-apellido">Apellido</label>
                  <input type="text" id="res-apellido" class="form-input" name="apellido" [(ngModel)]="form.apellido" placeholder="Tu apellido" autocomplete="family-name" required />
                  @if (submitted() && !form.apellido) {
                    <p class="form-error">El apellido es obligatorio</p>
                  }
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label" for="res-email">Email</label>
                  <input type="email" id="res-email" class="form-input" name="email" [(ngModel)]="form.email" placeholder="tu&#64;email.com" autocomplete="email" required />
                  <p class="form-hint">Te lo usamos para mandarte la confirmacion y para que puedas consultar o cancelar la reserva.</p>
                  @if (submitted() && !form.email) {
                    <p class="form-error">El email es obligatorio</p>
                  }
                </div>
                <div class="form-group">
                  <label class="form-label" for="res-telefono">Telefono</label>
                  <input type="tel" id="res-telefono" class="form-input" name="telefono" [(ngModel)]="form.telefono" placeholder="Tu telefono" autocomplete="tel" required />
                  <p class="form-hint">Solo para coordinar el ingreso a la habitacion.</p>
                  @if (submitted() && !form.telefono) {
                    <p class="form-error">El telefono es obligatorio</p>
                  }
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label" for="res-entrada">Fecha de entrada</label>
                  <input type="date" id="res-entrada" class="form-input" name="fecha_entrada" [(ngModel)]="form.fecha_entrada" [min]="minDate" required />
                  @if (submitted() && !form.fecha_entrada) {
                    <p class="form-error">Requerido</p>
                  }
                </div>
                <div class="form-group">
                  <label class="form-label" for="res-salida">Fecha de salida</label>
                  <input type="date" id="res-salida" class="form-input" name="fecha_salida" [(ngModel)]="form.fecha_salida" [min]="form.fecha_entrada || minDate" required />
                  @if (submitted() && !form.fecha_salida) {
                    <p class="form-error">Requerido</p>
                  }
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" for="res-huespedes">Cantidad de huespedes</label>
                <select class="form-select" id="res-huespedes" name="huespedes" [(ngModel)]="form.huespedes">
                  @for (n of huespedesOptions(); track n) {
                    <option [value]="n">{{ n }}</option>
                  }
                </select>
              </div>

              <div class="form-group">
                <label class="form-label" for="res-notas">Notas (opcional)</label>
                <textarea id="res-notas" class="form-textarea" name="notas" [(ngModel)]="form.notas" placeholder="Peticiones especiales, horario de llegada, etc." rows="3" maxlength="500"></textarea>
                <p class="form-hint">Opcional. No escribas datos de pago ni documentos.</p>
              </div>

              <div class="consent">
                <label class="consent-label" for="res-consent">
                  <input
                    type="checkbox"
                    id="res-consent"
                    name="consentimiento"
                    [(ngModel)]="consentimiento"
                    required
                  />
                  <span>
                    He leido y acepto la
                    <a routerLink="/terminos" target="_blank" rel="noopener">Politica de Terminos y Condiciones</a>
                    y la
                    <a routerLink="/privacidad" target="_blank" rel="noopener">Politica de Privacidad</a>,
                    y autorizo al hotel a tratar mis datos personales para gestionar mi reserva.
                  </span>
                </label>
                @if (submitted() && !consentimiento) {
                  <p class="form-error">Necesitamos tu aceptacion para continuar</p>
                }
              </div>

              <p class="form-hint cancel-note">
                Al reservar aceptas la
                <a routerLink="/reembolsos" target="_blank" rel="noopener">politica de cancelacion y reembolso</a>:
                podés cancelar hasta 24 horas antes de la entrada.
              </p>

              @if (error()) {
                <p class="form-error mb-2" role="alert">{{ error() }}</p>
              }

              <button class="btn btn-primary btn-lg" style="width:100%" (click)="submit()" [disabled]="submitting()">
                @if (submitting()) { Procesando... } @else { Confirmar Reserva }
              </button>
            </div>
          </div>

          <div class="summary-card card">
            <div class="card-body">
              <h4>Resumen</h4>
              <div class="summary-row">
                <span>Precio por noche</span>
                <span>{{ precioNoche() | currencyAr }}</span>
              </div>
              <div class="summary-row">
                <span>Noches</span>
                <span>{{ noches() }}</span>
              </div>
              @if (noches() > 0) {
                <div class="summary-total">
                  <span>Total</span>
                  <span class="total-value">{{ total() | currencyAr }}</span>
                </div>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    .form-hint {
      font-size: 0.8125rem;
      color: var(--text-light);
      margin-top: 0.375rem;
      line-height: 1.5;
    }
    .form-hint a, .consent-label a {
      color: var(--gold-dark);
      text-decoration: underline;
    }
    .cancel-note { margin: 0 0 1rem; }
    .consent {
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 1rem;
      margin-bottom: 1rem;
      background: var(--bg);
    }
    .consent-label {
      display: flex;
      gap: 0.75rem;
      align-items: flex-start;
      cursor: pointer;
      font-size: 0.875rem;
      line-height: 1.6;
      color: var(--text);
    }
    .consent-label input[type='checkbox'] {
      width: 1.15rem;
      height: 1.15rem;
      margin-top: 0.15rem;
      flex-shrink: 0;
      accent-color: var(--gold-dark);
      cursor: pointer;
    }
    .page { padding: 2rem 0 4rem; }
    .page h1 { margin-bottom: 1.5rem; }
    .form-layout {
      display: grid;
      grid-template-columns: 1fr 320px;
      gap: 1.5rem;
      align-items: start;
    }
    .room-summary {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: var(--bg);
      border-radius: var(--radius);
      margin-bottom: 1.5rem;
    }
    .room-badge {
      width: 56px;
      height: 56px;
      border-radius: var(--radius);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-weight: 800;
      font-size: 1.25rem;
      flex-shrink: 0;
    }
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .summary-card { position: sticky; top: 5.5rem; }
    .summary-card h4 { margin-bottom: 1rem; }
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 0.625rem 0;
      border-bottom: 1px solid var(--border);
      font-size: 0.9375rem;
    }
    .summary-row span:last-child { font-weight: 500; }
    .summary-total {
      display: flex;
      justify-content: space-between;
      padding-top: 1rem;
      margin-top: 0.5rem;
      font-size: 1.25rem;
      font-weight: 700;
    }
    .total-value {
      color: var(--gold-dark);
    }

    .empty { margin-top: 2rem; padding: 3rem; }

    @media (max-width: 768px) {
      .form-layout { grid-template-columns: 1fr; }
      .form-row { grid-template-columns: 1fr; }
      .summary-card { position: static; }
    }
  `
})
export class ReservaFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private habitacionService = inject(HabitacionService);
  private imagenes = inject(HabitacionImagenService);
  private reservaService = inject(ReservaService);
  private toast = inject(ToastService);

  habitacion = signal<Habitacion | null>(null);
  loading = signal(true);
  loadError = signal(false);
  submitted = signal(false);
  submitting = signal(false);
  error = signal('');

  precioNoche = signal(0);
  minDate = new Date().toISOString().split('T')[0];

  form = {
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    fecha_entrada: '',
    fecha_salida: '',
    huespedes: 1,
    notas: '',
  };

  // Consentimiento explicito exigido por la Ley 25.326: sin marcarlo no se reserva.
  consentimiento = false;

  gradient(): string {
    return this.imagenes.fondoPara(this.habitacion());
  }

  // Metodos y NO computed: form es un objeto plano, no una señal, y un
  // computed solo se invalida cuando cambia una de las señales que leyo. Como
  // esto no lee ninguna, el valor se cacheaba para siempre en 0 y la reserva
  // era imposible de completar: el huesped elegia fechas, el resumen de total
  // no se actualizaba y el submit rebotaba con "Las fechas no son validas".
  // Un metodo se recalcula en cada ciclo de deteccion de cambios y siempre ve
  // el estado real. gradient() mas abajo ya usa este mismo patron.
  noches(): number {
    if (!this.form.fecha_entrada || !this.form.fecha_salida) return 0;
    const d1 = new Date(this.form.fecha_entrada);
    const d2 = new Date(this.form.fecha_salida);
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 0;
    const diff = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  }

  total(): number {
    return this.noches() * this.precioNoche();
  }

  huespedesOptions = computed(() => {
    const max = this.habitacion()?.capacidad_max ?? 4;
    return Array.from({ length: max }, (_, i) => i + 1);
  });

  ngOnInit() {
    const params = this.route.snapshot.queryParamMap;
    const habitacionId = Number(params.get('habitacion_id'));
    const precio = Number(params.get('precio'));

    if (params.get('desde')) this.form.fecha_entrada = params.get('desde')!;
    if (params.get('hasta')) this.form.fecha_salida = params.get('hasta')!;

    if (!habitacionId) {
      this.loading.set(false);
      return;
    }

    this.habitacionService.getHabitacion(habitacionId).subscribe({
      next: (res) => {
        if (res.status === '1') {
          this.habitacion.set(res.data);
          this.precioNoche.set(precio || res.data.precio_noche);
          // Math.min(2, capacidad): con un 1 primero el Math.min daba 1 para
          // cualquier habitacion, asi que una de 4 personas arrancaba con un
          // solo huesped. El 2 es un default razonable y nunca excede la
          // capacidad real de la habitacion.
          this.form.huespedes = Math.max(1, Math.min(2, res.data.capacidad_max));
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

  submit() {
    this.submitted.set(true);
    this.error.set('');

    const h = this.habitacion();
    if (!h) return;
    if (!this.form.nombre || !this.form.apellido || !this.form.email || !this.form.telefono) {
      this.error.set('Completa todos los campos obligatorios.');
      return;
    }
    if (!this.form.fecha_entrada || !this.form.fecha_salida) {
      this.error.set('Seleccioná las fechas de entrada y salida.');
      return;
    }
    if (this.noches() <= 0) {
      this.error.set('Las fechas no son validas.');
      return;
    }
    if (!this.consentimiento) {
      this.error.set('Necesitamos que aceptes los terminos y la politica de privacidad para reservar.');
      return;
    }

    this.submitting.set(true);

    this.reservaService.createReserva({
      nombre: this.form.nombre,
      apellido: this.form.apellido,
      email: this.form.email,
      telefono: this.form.telefono,
      habitacion_id: h.id,
      fecha_entrada: this.form.fecha_entrada,
      fecha_salida: this.form.fecha_salida,
      huespedes: this.form.huespedes,
      notas: this.form.notas || undefined,
      acepta_terminos: this.consentimiento,
      terminos_version: TERMINOS_VERSION,
    }).subscribe({
      next: (res) => {
        if (res.status === '1' && res.data?.codigo) {
          this.toast.success('¡Reserva creada exitosamente!');
          // El hotel cobra por transferencia, asi que despues del formulario va
          // el paso de pago: ahi ve el alias y avisa que ya transfirio. El email
          // y el total van por el estado del router y no por la query string, para
          // no dejar el email en el historial del navegador ni en el referer.
          this.router.navigate(['/reserva/pagar', res.data.codigo], {
            state: {
              email: this.form.email,
              precio_total: Number(res.data.precio_total ?? 0),
            },
          });
        } else {
          this.error.set(res.msg || 'Error al crear la reserva.');
          this.toast.error('Error al crear la reserva.');
          this.submitting.set(false);
        }
      },
      error: (err) => {
        this.error.set(err?.error?.msg || 'Error al conectar con el servidor.');
        this.toast.error('Error al conectar con el servidor.');
        this.submitting.set(false);
      },
    });
  }
}
