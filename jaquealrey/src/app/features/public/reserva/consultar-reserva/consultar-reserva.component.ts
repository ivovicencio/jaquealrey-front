import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ReservaService } from '../../../../core/services/reserva.service';
import { ReservaConsulta } from '../../../../core/models/reserva.model';
import { ToastService } from '../../../../shared/services/toast.service';
import { CurrencyArPipe } from '../../../../shared/pipes/currency-ar.pipe';
import { BackButtonComponent } from '../../../../shared/components/back-button/back-button.component';

@Component({
  selector: 'app-consultar-reserva',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe, CurrencyArPipe, BackButtonComponent],
  template: `
    <div class="container page">
      <app-back-button fallbackUrl="/" fallbackLabel="Volver al Inicio" />
      <h1 class="page-title">Consultar mi Reserva</h1>
      <p class="page-subtitle">
        Ingresa el codigo que recibiste al reservar y el email con el que reservaste.
      </p>

      <div class="card">
        <div class="card-body">
          <form (ngSubmit)="buscar()" #f="ngForm" class="row-form">
            <div class="form-group">
              <label class="form-label" for="codigo">Codigo de reserva</label>
              <input
                class="form-input"
                id="codigo"
                type="text"
                name="codigo"
                placeholder="JAR-A1B2C3"
                [ngModel]="codigo()"
                (ngModelChange)="codigo.set($event)"
                required
                minlength="4"
                #codigoField="ngModel"
              />
              @if (codigoField.invalid && codigoField.touched) {
                <span class="form-error">Ingresa el codigo de reserva</span>
              }
            </div>
            <div class="form-group">
              <label class="form-label" for="email">Email con el que reservaste</label>
              <input
                class="form-input"
                id="email"
                type="email"
                name="email"
                placeholder="tu&#64;email.com"
                [ngModel]="email()"
                (ngModelChange)="email.set($event)"
                required
                email
                #emailField="ngModel"
              />
              @if (emailField.invalid && emailField.touched) {
                <span class="form-error">Ingresa un email valido</span>
              }
            </div>
            <div class="form-group form-group-btn">
              <button class="btn btn-primary btn-block" type="submit" [disabled]="loading() || f.invalid">
                @if (loading()) {
                  <span class="spinner"></span> Buscando...
                } @else {
                  Buscar Reserva
                }
              </button>
            </div>
          </form>

          <p class="form-hint legal-hint">
            Usamos el codigo y el email solo para encontrar tu reserva.
            <a routerLink="/privacidad">Como tratamos tus datos</a>.
          </p>
        </div>
      </div>

      @if (buscado() && !reserva()) {
        <div class="card card-empty">
          <div class="card-body">
            <p class="empty-icon"><i class="fas fa-magnifying-glass"></i></p>
            <p>No encontramos ninguna reserva con ese codigo y email.</p>
            <p class="hint">Revisa que el codigo sea correcto. Si no te sirve, llamanos al 02942664320.</p>
          </div>
        </div>
      }

      @if (reserva(); as r) {
        <div class="card result">
          <div class="card-body">
            <div class="result-head">
              <div>
                <span class="result-label">Codigo</span>
                <span class="result-code">{{ r.codigo }}</span>
              </div>
              <span [class]="'badge ' + badgeClass(r.estado)">{{ estadoLabel(r.estado) }}</span>
            </div>

            <dl class="detail-grid">
              <div class="detail">
                <dt>Habitacion</dt>
                <dd>{{ r.habitacion_numero }} - {{ r.habitacion_nombre }}</dd>
              </div>
              <div class="detail">
                <dt>Tipo</dt>
                <dd>{{ r.tipo }}</dd>
              </div>
              <div class="detail">
                <dt>Entrada</dt>
                <dd>{{ r.fecha_entrada | date: 'dd/MM/yyyy' }}</dd>
              </div>
              <div class="detail">
                <dt>Salida</dt>
                <dd>{{ r.fecha_salida | date: 'dd/MM/yyyy' }}</dd>
              </div>
              <div class="detail">
                <dt>Huespedes</dt>
                <dd>{{ r.huespedes }}</dd>
              </div>
              <div class="detail">
                <dt>Total</dt>
                <dd>{{ r.precio_total | currencyAr }}</dd>
              </div>
            </dl>

            @if (r.estado === 'Cancelada') {
              <div class="notice notice-danger">
                Esta reserva esta cancelada. Si no fuiste vos, llamanos al 02942664320.
              </div>
            } @else if (r.puede_cancelar) {
              <div class="notice">
                Para consultar o cambiar algo de tu reserva, llamanos al 02942664320.
              </div>
              <div class="cancel-box">
                <p>Necesitas cancelar?</p>
                <button class="btn btn-outline-danger" (click)="mostrarCancelar.set(!mostrarCancelar())">
                  Cancelar reserva
                </button>
                @if (mostrarCancelar()) {
                  <div class="cancel-confirm">
                    <label class="form-label" for="motivo">Motivo (opcional)</label>
                    <textarea
                      class="form-input"
                      id="motivo"
                      rows="2"
                      [ngModel]="motivo()"
                      (ngModelChange)="motivo.set($event)"
                      placeholder="Contanos brevemente por que cancelas"
                    ></textarea>
                    <div class="cancel-actions">
                      <button class="btn btn-outline" (click)="mostrarCancelar.set(false)">Volver</button>
                      <button
                        class="btn btn-danger"
                        (click)="cancelar()"
                        [disabled]="cancelando()"
                      >
                        @if (cancelando()) {
                          <span class="spinner"></span> Cancelando...
                        } @else {
                          Si, cancelar mi reserva
                        }
                      </button>
                    </div>
                  </div>
                }
              </div>
            } @else {
              <div class="notice notice-warning">
                @if (r.horas_para_cancelar > 0) {
                  Faltan {{ r.horas_para_cancelar }} horas para el check-in, ya no se puede cancelar online.
                } @else {
                  La fecha de entrada ya paso. Para cambios, comunicate al 02942664320.
                }
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    .page { padding: clamp(3rem, 6vw, 5rem) 0; max-width: 760px; }
    .page-title {
      margin-bottom: 0.5rem;
      font-size: clamp(2.35rem, 5vw, 3.2rem);
      font-weight: 500;
      line-height: 1;
    }
    .page-subtitle {
      max-width: 56ch;
      color: var(--text-light);
      margin-bottom: 2rem;
    }
    .card {
      margin-bottom: 1.5rem;
      border: 1px solid var(--border);
      box-shadow: 0 12px 36px rgba(26, 20, 16, 0.05);
    }
    .page > .card:first-of-type .card-body { padding: clamp(1.25rem, 3vw, 2rem); }
    .row-form { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-group-btn { display: flex; align-items: flex-end; }
    .btn-block { width: 100%; justify-content: center; }
    .btn-danger { background: var(--error); color: #fff; border: none; }
    .btn-outline-danger { background: transparent; color: var(--error); border: 1px solid var(--error); }
    .btn-outline-danger:hover { background: var(--error); color: #fff; }
    .card-empty {
      text-align: center;
      border: 0;
      background: var(--warm);
      box-shadow: none;
    }
    .card-empty .card-body { padding: 2rem; }
    .card-empty .empty-icon { color: var(--gold-dark); font-size: 1.5rem; }
    .hint { color: var(--text-light); font-size: 0.9rem; margin-top: 0.5rem; }
    .result {
      border: 0;
      border-top: 2px solid var(--gold);
      border-radius: 0;
      box-shadow: none;
    }
    .result-head {
      display: flex; justify-content: space-between; align-items: center;
      padding-bottom: 1.25rem; margin-bottom: 1.25rem; border-bottom: 1px solid var(--border);
    }
    .result-label {
      display: block; font-size: 0.75rem; text-transform: uppercase;
      letter-spacing: 0.04em; color: var(--text-light); font-weight: 600;
    }
    .result-code {
      font-family: var(--font-heading);
      font-size: 1.8rem;
      font-weight: 600;
      letter-spacing: 0.04em;
      color: var(--gold-dark);
    }
    .detail-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.25rem; margin-bottom: 1.5rem; }
    .detail dt { font-size: 0.8125rem; color: var(--text-light); margin-bottom: 0.25rem; }
    .detail dd { font-weight: 600; }
    .notice {
      background: var(--warm); border-left: 2px solid var(--gold);
      padding: 0.875rem 1rem; border-radius: 0; margin-bottom: 1rem;
      font-size: 0.9rem;
    }
    .notice-danger { border-left-color: var(--error); }
    .notice-warning { border-left-color: #e67e22; }
    .cancel-box { border-top: 1px solid var(--border); padding-top: 1.25rem; }
    .cancel-box p { margin-bottom: 0.75rem; font-weight: 600; }
    .cancel-confirm { margin-top: 1rem; }
    .cancel-actions { display: flex; gap: 0.75rem; margin-top: 1rem; }
    .spinner {
      display: inline-block; width: 1rem; height: 1rem;
      border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff;
      border-radius: 50%; animation: spin 0.6s linear infinite;
    }
    .form-hint { font-size: 0.8125rem; color: var(--text-light); line-height: 1.5; }
    .form-hint a { color: var(--gold-dark); text-decoration: underline; }
    .legal-hint { margin-top: 1rem; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @media (max-width: 640px) {
      .page { padding: 2.75rem 0 3.5rem; }
      .row-form { grid-template-columns: 1fr; }
      .detail-grid { grid-template-columns: 1fr 1fr; }
      .cancel-actions { flex-direction: column; }
    }
  `,
})
export class ConsultarReservaComponent implements OnInit {
  private reservaService = inject(ReservaService);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);

  codigo = signal('');
  email = signal('');
  motivo = signal('');

  loading = signal(false);
  cancelando = signal(false);
  buscado = signal(false);
  mostrarCancelar = signal(false);
  reserva = signal<ReservaConsulta | null>(null);

  ngOnInit() {
    this.codigo.set(this.route.snapshot.queryParamMap.get('codigo') ?? '');
    const emailPre = this.route.snapshot.queryParamMap.get('email');
    if (emailPre) this.email.set(emailPre);
    if (this.codigo() && this.email()) this.buscar();
  }

  buscar(): void {
    if (this.loading()) return;
    this.loading.set(true);
    this.buscado.set(false);
    this.reserva.set(null);
    this.mostrarCancelar.set(false);

    this.reservaService.consultar(this.codigo().trim(), this.email().trim()).subscribe({
      next: (res) => {
        if (res.status === '1') {
          this.reserva.set(res.data);
          this.buscado.set(true);
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.reserva.set(null);
        this.buscado.set(true);
        this.toast.error(err.error?.msg || 'No encontramos esa reserva');
        this.loading.set(false);
      },
    });
  }

  cancelar(): void {
    this.cancelando.set(true);
    this.reservaService.cancelar(this.codigo().trim(), this.email().trim(), this.motivo()).subscribe({
      next: (res) => {
        this.cancelando.set(false);
        this.toast.success(res.msg || 'Reserva cancelada');
        this.mostrarCancelar.set(false);
        this.buscar();
      },
      error: (err) => {
        this.cancelando.set(false);
        this.toast.error(err.error?.msg || 'No se pudo cancelar la reserva');
        this.buscar();
      },
    });
  }

  badgeClass(estado: string): string {
    switch (estado) {
      case 'Confirmada': return 'badge-success';
      case 'En_Casa': return 'badge-success';
      case 'Pendiente': return 'badge-warning';
      case 'Cancelada': return 'badge-danger';
      case 'Completada': return 'badge-info';
      default: return 'badge';
    }
  }

  estadoLabel(estado: string): string {
    return estado === 'En_Casa' ? 'En uso' : estado;
  }
}
