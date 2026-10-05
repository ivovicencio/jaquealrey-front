import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminService } from '../../../../core/services/admin.service';
import { ReservaService } from '../../../../core/services/reserva.service';
import { ConfigCobro } from '../../../../core/models/pago.model';
import { CurrencyArPipe } from '../../../../shared/pipes/currency-ar.pipe';
import { ToastService } from '../../../../shared/services/toast.service';

/**
 * Paso 2 de la reserva: el huesped ve los datos de la cuenta y avisa que ya
 * transfirio.
 *
 * Es un paso aparte porque el hotel cobra por transferencia, no por pasarela:
 * no hay boton de "pagar con tarjeta" ni webhook que esperar. El huesped ve el
 * alias, transfiere por su cuenta y apretal boton.
 *
 * Lo que NO hace ese boton: no confirma la reserva. Sigue en `Pendiente` hasta
 * que el admin vea la plata en el banco y la confirme desde el panel. Si este
 * boton confirmara, cualquiera podria reservar sin.transferir nunca.
 *
 * El email y el total llegan por el estado del router, no por la URL: la ruta
 * es indexable y el email en una query string se va al historial y al referer.
 */
@Component({
  selector: 'app-pagar-reserva',
  standalone: true,
  imports: [RouterLink, CurrencyArPipe, FormsModule],
  template: `
    <div class="container page">
      <div class="pay-card card">
        <div class="card-body">
          <span class="step">{{ yaAviso() ? 'Paso 3 de 3' : 'Paso 2 de 3' }}</span>
          <h1>{{ yaAviso() ? 'Aviso enviado' : 'Pagar Reserva' }}</h1>
          @if (yaAviso()) {
            <p class="lead">Tu último paso es esperar la verificación del hotel.</p>
          } @else {
            <p class="lead">
              Transferí al alias y después apretá el botón para avisarle al hotel.
            </p>
          }

          @if (cargando()) {
            <div class="estado">Cargando los datos de la cuenta…</div>
          } @else if (error()) {
            <div class="estado error">{{ error() }}</div>
            <div class="acciones">
              <a
                [routerLink]="['/consultar-reserva']"
                [queryParams]="{ codigo: codigo() }"
                class="btn btn-outline"
                >Consultar mi reserva</a
              >
            </div>
          } @else {
            <div class="alias-box">
              <span class="alias-label">Alias para transferir</span>
              <span class="alias-value" data-testid="alias">{{ cfg()?.alias_bancario }}</span>
              <button
                type="button"
                class="btn-copiar"
                (click)="copiar()"
                [attr.aria-label]="'Copiar el alias'"
              >
                {{ copiado() ? 'Copiado' : 'Copiar' }}
              </button>
            </div>

            <dl class="datos">
              <div>
                <dt>Total de la reserva</dt>
                <dd class="total" data-testid="total">{{ total() | currencyAr }}</dd>
              </div>
            </dl>

            @if (yaAviso()) {
              <div class="aviso-ok" data-testid="aviso-ok">
                Le avisamos al hotel que transferiste. Tu reserva queda
                <strong>pendiente</strong> hasta que el hotel confirme que la plata
                llegó. Podés verificarlo cuando quieras con tu código.
              </div>
            } @else {
              <form class="acciones" (ngSubmit)="confirmar()" #pagoForm="ngForm">
                <label class="campo-transferencia">
                  Número de operación
                  <input
                    class="form-input"
                    type="text"
                    name="numeroOperacion"
                    id="pago-numero-operacion"
                    [(ngModel)]="numeroOperacion"
                    maxlength="80"
                    autocomplete="off"
                    required
                  />
                </label>
                <label class="campo-transferencia">
                  Referencia de la transferencia
                  <input
                    class="form-input"
                    type="text"
                    name="referencia"
                    id="pago-referencia"
                    [(ngModel)]="referencia"
                    maxlength="80"
                    autocomplete="off"
                    required
                  />
                </label>
                <label class="campo-transferencia">
                  Fecha de la transferencia
                  <input
                    class="form-input"
                    type="date"
                    name="fechaTransferencia"
                    id="pago-fecha-transferencia"
                    [(ngModel)]="fechaTransferencia"
                    [max]="fechaMaxima"
                    required
                  />
                </label>
                <p class="ayuda">
                  No adjuntes fotos ni comprobantes. El hotel verificará la transferencia en su cuenta.
                  El aviso no confirma la reserva.
                </p>
                <button
                  type="submit"
                  class="btn btn-primary btn-lg"
                  [disabled]="enviando() || pagoForm.invalid"
                >
                  {{ enviando() ? 'Avisando…' : 'Ya transferí, avisar al hotel' }}
                </button>
              </form>
            }

            <p class="ayuda">
              Poner el código <strong>{{ codigo() }}</strong> como referencia en la
              transferencia ayuda a encontrar tu pago.
            </p>
          }
        </div>
      </div>
    </div>
  `,
  styles: `
    .page {
      padding: 3rem 0 4rem;
      display: flex;
      justify-content: center;
    }
    .pay-card {
      max-width: 560px;
      width: 100%;
    }
    .card-body {
      padding: 2.5rem 2rem;
    }
    .step {
      display: inline-block;
      font-size: 0.8125rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--gold-dark);
      margin-bottom: 0.5rem;
    }
    h1 {
      margin-bottom: 0.75rem;
    }
    .lead {
      color: var(--text-light);
      margin-bottom: 1.75rem;
    }
    .campo-transferencia {
      display: grid;
      gap: 0.4rem;
      width: 100%;
      color: var(--text);
      font-weight: 600;
      text-align: left;
    }
    .campo-transferencia .form-input {
      width: 100%;
    }
    .estado {
      padding: 1rem;
      border-radius: var(--radius);
      background: var(--bg);
      text-align: center;
      color: var(--text-light);
    }
    .estado.error {
      color: #c0392b;
      font-weight: 600;
    }
    .alias-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 1.75rem 1.25rem;
      background: var(--bg);
      border-radius: var(--radius-lg);
      border: 2px dashed var(--border);
      margin-bottom: 1.5rem;
    }
    .alias-label {
      font-size: 0.8125rem;
      color: var(--text-light);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      font-weight: 600;
    }
    .alias-value {
      font-size: 1.75rem;
      font-weight: 800;
      color: var(--gold-dark);
      word-break: break-all;
      text-align: center;
      user-select: all;
    }
    .btn-copiar {
      border: 1px solid var(--border);
      background: transparent;
      color: var(--text-light);
      border-radius: 999px;
      padding: 0.25rem 0.875rem;
      font-size: 0.8125rem;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-copiar:hover {
      color: var(--text);
      border-color: var(--gold);
    }
    .datos {
      display: grid;
      gap: 0.75rem;
      margin: 0 0 1.5rem;
    }
    .datos > div {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--border);
    }
    dt {
      color: var(--text-light);
      font-size: 0.9375rem;
    }
    dd {
      margin: 0;
      font-weight: 600;
      text-align: right;
    }
    dd.total {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--gold-dark);
    }
    .aviso-ok {
      padding: 1rem 1.125rem;
      border-radius: var(--radius);
      background: var(--bg);
      border-left: 4px solid var(--gold);
    }
    .acciones {
      margin-top: 1.5rem;
      display: flex;
      gap: 0.75rem;
      justify-content: center;
      flex-wrap: wrap;
    }
    .acciones button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .ayuda {
      margin-top: 1.5rem;
      font-size: 0.875rem;
      color: var(--text-light);
      text-align: center;
    }
    @media (max-width: 480px) {
      .card-body {
        padding: 2rem 1.25rem;
      }
      .alias-value {
        font-size: 1.375rem;
      }
    }
  `,
})
export class PagarReservaComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private adminService = inject(AdminService);
  private reservaService = inject(ReservaService);
  private toast = inject(ToastService);

  codigo = signal('');
  // El anticipo sigue configurado internamente, pero no se muestra al huésped
  // hasta que el hotel confirme su política de cobro.
  cfg = signal<ConfigCobro | null>(null);
  total = signal(0);

  cargando = signal(true);
  error = signal('');
  enviando = signal(false);
  yaAviso = signal(false);
  copiado = signal(false);
  numeroOperacion = '';
  referencia = '';
  fechaTransferencia = '';
  readonly fechaMaxima = this.fechaLocal();

  private email = '';

  ngOnInit() {
    this.codigo.set(this.route.snapshot.paramMap.get('codigo') ?? '');

    const estado = (this.router.getCurrentNavigation()?.extras.state ?? history.state) as {
      email?: string;
      precio_total?: number;
    };
    this.email = estado?.email ?? '';
    if (typeof estado?.precio_total === 'number') {
      this.total.set(estado.precio_total);
    }

    if (!this.codigo()) {
      this.error.set('No encontramos el código de tu reserva.');
      this.cargando.set(false);
      return;
    }

    this.adminService.getConfigCobro().subscribe({
      next: (res) => {
        if (res.status === '1' && res.data) {
          this.cfg.set(res.data);
        } else {
          this.error.set(res.msg || 'No pudimos cargar los datos de la cuenta.');
        }
        this.cargando.set(false);
      },
      error: () => {
        this.error.set(
          'No pudimos cargar los datos de la cuenta. Probá de nuevo en un momento.'
        );
        this.cargando.set(false);
      },
    });
  }

  copiar() {
    const alias = this.cfg()?.alias_bancario;
    if (!alias) return;

    // clipboard no existe si el sitio se abre sin HTTPS, y en ese caso el huesped
    // igual puede seleccionar el alias a mano (esta en user-select: all).
    if (!navigator.clipboard) {
      this.toast.error('Copiá el alias a mano.');
      return;
    }

    navigator.clipboard.writeText(alias).then(
      () => {
        this.copiado.set(true);
        setTimeout(() => this.copiado.set(false), 2000);
      },
      () => this.toast.error('No pudimos copiar. Copiá el alias a mano.')
    );
  }

  confirmar() {
    if (this.enviando()) return;

    // Sin el email no se puede avisar: la ruta lo identifica con codigo + email,
    // igual que consultar y cancelar. Si se recargó la pagina se perdio.
    if (!this.email) {
      this.error.set(
        'Se nos perdió tu email al recargar la página. Volvé a hacer la reserva o consultá tu código.'
      );
      return;
    }

    if (!this.numeroOperacion.trim() || !this.referencia.trim() || !this.fechaTransferencia) {
      this.error.set('Ingresá el número de operación, la referencia y la fecha de la transferencia.');
      return;
    }

    this.enviando.set(true);
    this.reservaService
      .reportarPago(
        this.codigo(),
        this.email,
        this.numeroOperacion.trim(),
        this.referencia.trim(),
        this.fechaTransferencia
      )
      .subscribe({
      next: (res) => {
        this.enviando.set(false);
        if (res.status === '1') {
          this.yaAviso.set(true);
          this.toast.success('Avisamos al hotel que transferiste.');
        } else {
          this.error.set(res.msg || 'No pudimos registrar el aviso.');
        }
      },
      error: (err) => {
        this.enviando.set(false);
        this.error.set(err?.error?.msg || 'No pudimos registrar el aviso.');
      },
      });
  }

  private fechaLocal(): string {
    const hoy = new Date();
    return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
  }
}