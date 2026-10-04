import { Component, inject, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../core/services/admin.service';
import { ReservaService } from '../../../../core/services/reserva.service';
import { PdfService } from '../../../../core/services/pdf.service';
import { Reserva } from '../../../../core/models/reserva.model';
import { PagosReserva } from '../../../../core/models/pago.model';
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
          <div class="title-row">
            <h1 class="page-title">Detalle de Reserva</h1>
            <button type="button" class="btn btn-outline" (click)="exportarComprobante()">
              <i class="fas fa-file-pdf"></i> Comprobante PDF
            </button>
          </div>
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
                  <div class="info-row">
                    <span class="info-label">Pagado</span>
                    <span class="info-value">{{ (pagos()?.total_pagado ?? 0) | currencyAr }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Saldo</span>
                    <span
                      class="info-value"
                      [class.saldo-pendiente]="(pagos()?.saldo ?? 0) > 0.01"
                    >{{ (pagos()?.saldo ?? 0) | currencyAr }}</span>
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
              @if (nuevoEstado === 'Confirmada' && anticipoFaltante() > 0) {
                <div class="form-group">
                  <label class="check-label">
                    <input type="checkbox" [(ngModel)]="forzarSinPago" />
                    Confirmar sin el anticipo (cortesía o pago en efectivo pendiente)
                  </label>
                  <p class="hint">
                    Falta {{ anticipoFaltante() | currencyAr }}. Queda anotado en la bitácora
                    como “forzado sin pago”.
                  </p>
                </div>
              }
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

        <div class="card status-card">
          <div class="card-header">
            <h3>Pagos</h3>
            <button type="button" class="btn btn-outline btn-sm" (click)="abrirFormPago()">
              <i class="fas fa-plus"></i> Registrar pago
            </button>
          </div>
          <div class="card-body">
            @if (formPagoAbierto()) {
              <div class="pago-form">
                <div class="form-group">
                  <label class="form-label">Monto</label>
                  <input class="form-input" type="number" min="1" step="0.01"
                    [(ngModel)]="pagoMonto" placeholder="0.00" />
                </div>
                <div class="form-group">
                  <label class="form-label">Método</label>
                  <select class="form-select" [(ngModel)]="pagoMetodo">
                    <option value="alias">Transferencia (alias)</option>
                    <option value="efectivo">Efectivo</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Estado</label>
                  <select class="form-select" [(ngModel)]="pagoEstado">
                    <option value="Confirmado">Confirmado</option>
                    <option value="Pendiente">Pendiente</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Referencia (opcional)</label>
                  <input class="form-input" [(ngModel)]="pagoReferencia"
                    placeholder="Nº de comprobante" />
                </div>
                <div class="pago-form-actions">
                  <button type="button" class="btn btn-outline" (click)="formPagoAbierto.set(false)">
                    Cancelar
                  </button>
                  <button type="button" class="btn btn-primary" (click)="guardarPago()" [disabled]="guardandoPago()">
                    {{ guardandoPago() ? 'Guardando...' : 'Guardar pago' }}
                  </button>
                </div>
              </div>
            }

            @if (pagos(); as p) {
              @if (p.pagos.length) {
                <div class="table-responsive">
                  <table class="table table-striped">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Método</th>
                        <th>Referencia</th>
                        <th>Monto</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (pg of p.pagos; track pg.id) {
                        <tr>
                          <td>{{ pg.fecha_pago ? (pg.fecha_pago | date:'dd/MM/yyyy') : '-' }}</td>
                          <td>{{ pg.metodo }}</td>
                          <td>{{ pg.referencia || '-' }}</td>
                          <td>{{ pg.monto | currencyAr }}</td>
                          <td>
                            <span [class]="'badge ' + badgePago(pg.estado)">{{ pg.estado }}</span>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              } @else {
                <p class="sin-datos">Todavia no hay pagos registrados para esta reserva.</p>
              }
            } @else {
              <p class="sin-datos">Cargando pagos...</p>
            }
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
    .status-card .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .status-card .card-header h3 { margin: 0; font-size: 1rem; }

    .title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-top: 0.5rem;
      flex-wrap: wrap;
    }

    .saldo-pendiente { color: #a1443c; font-weight: 700; }

    .check-label {
      display: flex; align-items: center; gap: 0.5rem;
      font-size: 0.85rem; font-weight: 500; cursor: pointer;
    }
    .check-label input { width: auto; margin: 0; }
    .hint { margin: 0.35rem 0 0; font-size: 0.8rem; color: var(--text-light); }
    .sin-datos { color: var(--text-light); font-size: 0.875rem; margin: 0; }
    .table-responsive { overflow-x: auto; }

    .pago-form {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 0.75rem;
      padding-bottom: 1rem;
      margin-bottom: 1rem;
      border-bottom: 1px solid var(--border);
    }
    .pago-form-actions {
      display: flex;
      gap: 0.5rem;
      align-items: flex-end;
      grid-column: 1 / -1;
      justify-content: flex-end;
    }
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
  private pdf = inject(PdfService);
  private toast = inject(ToastService);

  reserva = signal<Reserva | null>(null);
  pagos = signal<PagosReserva | null>(null);
  loading = signal(true);
  updating = signal(false);

  formPagoAbierto = signal(false);
  guardandoPago = signal(false);
  pagoMonto: number | null = null;
  pagoMetodo = 'alias';
  pagoEstado = 'Confirmado';
  pagoReferencia = '';

  nuevoEstado = '';
  notasCambio = '';
  forzarSinPago = false;
  anticipoPct = signal(0);

  estadoOptions = signal<string[]>([]);

  /**
   * Cuánta plata falta para llegar al anticipo que el hotel exige al confirmar.
   *
   * El backend es el que manda: esto solo dibuja el aviso para que el
   * recepcionista active el override a ciegas. Si el número no coincide, el
   * 409 del servidor sigue siendo la respuesta correcta.
   */
  anticipoFaltante(): number {
    const total = this.reserva()?.precio_total ?? 0;
    const pagado = this.pagos()?.total_pagado ?? 0;
    const requerido = (total * this.anticipoPct()) / 100;
    return Math.max(0, Math.round((requerido - pagado) * 100) / 100);
  }

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) this.loadReserva(id);
    this.loadAnticipo();
  }

  private loadAnticipo() {
    this.adminService.getConfigCobro().subscribe({
      next: (res) => {
        if (res.status === '1') {
          this.anticipoPct.set(Number(res.data?.anticipo_porcentaje) || 0);
        }
      },
      error: () => this.anticipoPct.set(0),
    });
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

    // Los pagos se piden en paralelo al detalle: son endpoints distintos y el
    // panel ya muestra el saldo sin esperar a que termine el primero.
    this.loadPagos(id);
  }

  loadPagos(id: number) {
    this.adminService.getPagosReserva(id).subscribe({
      next: (res) => {
        if (res.status === '1') this.pagos.set(res.data);
      },
      error: () => this.toast.error('Error al cargar los pagos'),
    });
  }

  abrirFormPago() {
    const saldo = this.pagos()?.saldo ?? this.reserva()?.precio_total ?? 0;
    this.pagoMonto = saldo > 0 ? Number(saldo) : null;
    this.pagoReferencia = '';
    this.formPagoAbierto.set(true);
  }

  guardarPago() {
    const r = this.reserva();
    const monto = Number(this.pagoMonto);
    if (!r) return;
    if (!Number.isFinite(monto) || monto <= 0) {
      this.toast.error('El monto debe ser mayor a 0');
      return;
    }

    this.guardandoPago.set(true);
    this.adminService
      .createPago({
        reserva_id: r.id,
        monto,
        metodo: this.pagoMetodo,
        estado: this.pagoEstado,
        referencia: this.pagoReferencia || undefined,
      })
      .subscribe({
        next: (res) => {
          if (res.status === '1') {
            this.toast.success('Pago registrado');
            this.formPagoAbierto.set(false);
            this.loadPagos(r.id);
          }
          this.guardandoPago.set(false);
        },
        error: (e) => {
          this.toast.error(e?.error?.msg ?? 'Error al registrar el pago');
          this.guardandoPago.set(false);
        },
      });
  }

  exportarComprobante() {
    const r = this.reserva();
    if (!r) return;
    try {
      this.pdf.exportarComprobanteReserva(r, this.pagos()?.pagos ?? []);
      this.toast.success('Comprobante generado');
    } catch (e: any) {
      this.toast.error('Error al generar el PDF: ' + (e?.message ?? 'desconocido'));
    }
  }

  badgePago(estado: string): string {
    switch (estado) {
      case 'Confirmado': return 'badge-success';
      case 'Pendiente': return 'badge-warning';
      case 'Anulado': return 'badge-danger';
      default: return 'badge';
    }
  }

  updateEstadoOptions(estado: string) {
    // Espejo de la maquina de estados del backend (services/reserva.service.js).
    // Si se desincroniza, el select ofrece transiciones que el backend rechaza
    // con 409 y el panel muestra un error sin explicar por que.
    const transitions: Record<string, string[]> = {
      Pendiente: ['Confirmada', 'Cancelada'],
      Confirmada: ['En_Casa', 'Completada', 'Cancelada'],
      En_Casa: ['Completada'],
      Completada: [],
      Cancelada: [],
    };
    this.estadoOptions.set(transitions[estado] || []);
  }

  updateEstado() {
    const r = this.reserva();
    if (!r || !this.nuevoEstado) return;

    // El override solo viaja si el checkbox está marcado y solo tiene sentido
    // al confirmar: mandarlo siempre sería mandar el flag de "~pago excused"
    // en cada cambio de estado.
    const forzar =
      this.forzarSinPago && this.nuevoEstado === 'Confirmada' ? true : undefined;

    this.updating.set(true);
    this.adminService
      .updateReservaEstado(r.id, this.nuevoEstado, this.notasCambio || undefined, forzar)
      .subscribe({
        next: (res) => {
          if (res.status === '1') {
            this.toast.success('Estado actualizado correctamente');
            this.reserva.set(res.data);
            this.updateEstadoOptions(res.data.estado);
            this.notasCambio = '';
            this.forzarSinPago = false;
            // El saldo no cambia, pero el detalle devuelto por el PUT no trae
            // los joins; recargar la reserva entera lo deja consistente.
            this.loadPagos(r.id);
          } else {
            this.toast.error(res.msg || 'Error al actualizar');
          }
          this.updating.set(false);
        },
        error: (err) => {
          // El backend explica el 409 ("falta el anticipo", transicion
          // invalida). Taparlo con un error generico deja al admin sin salida.
          this.toast.error(err?.error?.msg || 'Error al actualizar el estado');
          this.updating.set(false);
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
}
