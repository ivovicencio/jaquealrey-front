import { Component, inject, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AdminService } from '../../../core/services/admin.service';
import { PdfService } from '../../../core/services/pdf.service';
import { ToastService } from '../../../shared/services/toast.service';
import { CurrencyArPipe } from '../../../shared/pipes/currency-ar.pipe';
import { ConfigCobro, IngresosData, Pago } from '../../../core/models/pago.model';

// Panel de pagos e ingresos del hotel.
//
// El hotel cobra por transferencia a alias, no por pasarela. Eso cambia el
// modelo entero: no hay webhook que notifique el pago, asi que la confirmacion
// la hace una persona desde este panel. Por eso las dos mitades estan juntas en
// la misma pantalla: se ve cuanto se facturo, cuanto se cobro, y abajo se carga
// el pago que falta.
@Component({
  selector: 'app-pagos',
  standalone: true,
  imports: [FormsModule, CurrencyArPipe, DatePipe],
  template: `
    <div class="container admin-page">
      <div class="admin-header">
        <h1 class="page-title">Pagos e Ingresos</h1>
      </div>

      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Cargando ingresos...</p>
        </div>
      } @else {
        @if (ingresos(); as ing) {
          <div class="resumen-grid">
            <div class="card stat-card">
              <div class="card-body stat-body">
                <div class="stat-icon"><i class="fas fa-file-invoice-dollar"></i></div>
                <div class="stat-value">{{ ing.facturado_total | currencyAr }}</div>
                <div class="stat-label">Facturado total</div>
              </div>
            </div>
            <div class="card stat-card ok">
              <div class="card-body stat-body">
                <div class="stat-icon"><i class="fas fa-sack-dollar"></i></div>
                <div class="stat-value">{{ ing.cobrado_total | currencyAr }}</div>
                <div class="stat-label">Cobrado total</div>
              </div>
            </div>
            <div class="card stat-card aviso">
              <div class="card-body stat-body">
                <div class="stat-icon"><i class="fas fa-hand-holding-dollar"></i></div>
                <div class="stat-value">{{ ing.a_cobrar_total | currencyAr }}</div>
                <div class="stat-label">Falta cobrar</div>
              </div>
            </div>
            <div class="card stat-card">
              <div class="card-body stat-body">
                <div class="stat-icon"><i class="fas fa-hourglass-half"></i></div>
                <div class="stat-value">{{ ing.pendiente_confirmar | currencyAr }}</div>
                <div class="stat-label">Pendiente de confirmar</div>
              </div>
            </div>
          </div>

          <div class="acciones-grid">
            <button type="button" class="btn btn-outline" (click)="exportarIngresosPDF()">
              <i class="fas fa-file-pdf"></i> Exportar reporte de ingresos
            </button>
            <button type="button" class="btn btn-outline" (click)="modalAbierto.set(true)">
              <i class="fas fa-plus"></i> Registrar pago
            </button>
            <button type="button" class="btn btn-outline" (click)="configAbierto.set(!configAbierto())">
              <i class="fas fa-cog"></i> Datos de cobro
            </button>
          </div>

          @if (configAbierto()) {
            <div class="card table-card">
              <div class="card-body">
                <h2 class="card-title">Datos de cobro</h2>
                <p class="hint">
                  Esto es lo que ve el huesped al reservar. El alias, el banco y el
                  titular cambian cada vez que el hotel cambia de cuenta, asi que
                  viven en la base y no hace falta tocar el servidor.
                </p>
                <div class="config-grid">
                  <div class="form-group">
                    <label class="form-label">Alias / CBU</label>
                    <input class="form-input" [(ngModel)]="cfg.alias_bancario" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Banco</label>
                    <input class="form-input" [(ngModel)]="cfg.banco_nombre" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Titular de la cuenta</label>
                    <input class="form-input" [(ngModel)]="cfg.titular_cuenta" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Anticipo (%)</label>
                    <input class="form-input" type="number" min="0" max="100"
                      [(ngModel)]="cfg.anticipo_porcentaje" />
                  </div>
                  <div class="form-group config-acciones">
                    <button type="button" class="btn btn-primary" (click)="guardarConfig()" [disabled]="guardandoConfig()">
                      {{ guardandoConfig() ? 'Guardando...' : 'Guardar datos' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          }

          @if (ing.saldo_por_reserva.length) {
            <div class="card table-card">
              <div class="card-body">
                <h2 class="card-title">Reservas con saldo pendiente</h2>
                <p class="hint">Confirmadas y pagadas por debajo del total. Son las que hay que perseguir.</p>
                <div class="table-responsive">
                  <table class="table table-striped">
                    <thead>
                      <tr>
                        <th>Codigo</th>
                        <th>Entrada</th>
                        <th>Salida</th>
                        <th>Total</th>
                        <th>Pagado</th>
                        <th>Saldo</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (r of ing.saldo_por_reserva; track r.codigo) {
                        <tr>
                          <td><strong>{{ r.codigo }}</strong></td>
                          <td>{{ r.fecha_entrada | date:'dd/MM/yyyy' }}</td>
                          <td>{{ r.fecha_salida | date:'dd/MM/yyyy' }}</td>
                          <td>{{ r.precio_total | currencyAr }}</td>
                          <td>{{ r.pagado | currencyAr }}</td>
                          <td class="saldo-pendiente">{{ r.saldo | currencyAr }}</td>
                          <td>
                            <button type="button" class="btn btn-outline btn-sm"
                              (click)="abrirModal(r.codigo, r.saldo)">
                              Cobrar
                            </button>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          }
        }

        <div class="card filter-bar">
          <div class="card-body filter-body">
            <div class="filter-group">
              <label class="form-label">Estado</label>
              <select class="form-select" [(ngModel)]="filtroEstado" (change)="cargarPagos()">
                <option value="">Todos</option>
                <option value="Pendiente">Pendiente</option>
                <option value="Confirmado">Confirmado</option>
                <option value="Anulado">Anulado</option>
              </select>
            </div>
            <div class="filter-actions">
              <button type="button" class="btn btn-outline btn-sm" (click)="exportarPagosPDF()">
                <i class="fas fa-file-pdf"></i> Exportar pagos
              </button>
            </div>
          </div>
        </div>

        <div class="card table-card">
          <div class="table-responsive">
            <table class="table table-striped">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Reserva</th>
                  <th>Cliente</th>
                  <th>Metodo</th>
                  <th>Referencia</th>
                  <th>Monto</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (p of pagos(); track p.id) {
                  <tr>
                    <td>{{ p.fecha_pago ? (p.fecha_pago | date:'dd/MM/yyyy') : '-' }}</td>
                    <td><strong>{{ p.reserva_codigo }}</strong></td>
                    <td>{{ p.cliente_nombre }} {{ p.cliente_apellido }}</td>
                    <td>{{ p.metodo }}</td>
                    <td>{{ p.referencia || '-' }}</td>
                    <td>{{ p.monto | currencyAr }}</td>
                    <td><span [class]="'badge ' + badgePago(p.estado)">{{ p.estado }}</span></td>
                    <td>
                      @if (p.estado === 'Pendiente') {
                        <button type="button" class="btn btn-outline btn-sm" (click)="confirmar(p)">
                          Confirmar
                        </button>
                      } @else if (p.estado === 'Confirmado') {
                        <button type="button" class="btn btn-outline btn-sm" (click)="anular(p)">
                          Anular
                        </button>
                      }
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="8" class="empty-state">No hay pagos registrados</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      @if (modalAbierto()) {
        <div class="modal-backdrop" (click)="modalAbierto.set(false)">
          <div class="modal" (click)="$event.stopPropagation()">
            <h3>Registrar pago</h3>

            <div class="form-group">
              <label class="form-label">Codigo de reserva</label>
              <input class="form-input" [(ngModel)]="formCodigo" placeholder="JAR-XXXXXX" />
              <button type="button" class="btn btn-outline btn-sm mt" (click)="buscarReserva()">
                Buscar
              </button>
            </div>

            @if (reservaBuscada(); as r) {
              <div class="info-box">
                <div><strong>{{ r.codigo }}</strong> - {{ r.cliente_nombre }} {{ r.cliente_apellido }}</div>
                <div>{{ r.fecha_entrada | date:'dd/MM/yyyy' }} al {{ r.fecha_salida | date:'dd/MM/yyyy' }}</div>
                <div>Total {{ r.precio_total | currencyAr }} - Pagado {{ r.pagado | currencyAr }} - Saldo {{ r.saldo | currencyAr }}</div>
              </div>
            }

            <div class="form-group">
              <label class="form-label">Monto</label>
              <input class="form-input" type="number" [(ngModel)]="formMonto" min="1" step="0.01" />
            </div>

            <div class="form-group">
              <label class="form-label">Metodo</label>
              <select class="form-select" [(ngModel)]="formMetodo">
                <option value="alias">Transferencia (alias)</option>
                <option value="efectivo">Efectivo</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Estado</label>
              <select class="form-select" [(ngModel)]="formEstado">
                <option value="Confirmado">Confirmado</option>
                <option value="Pendiente">Pendiente</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Referencia (opcional)</label>
              <input class="form-input" [(ngModel)]="formReferencia" placeholder="Numero de comprobante" />
            </div>

            <div class="modal-actions">
              <button type="button" class="btn btn-outline" (click)="modalAbierto.set(false)">Cancelar</button>
              <button type="button" class="btn btn-primary" (click)="guardar()" [disabled]="guardando()">
                {{ guardando() ? 'Guardando...' : 'Guardar pago' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    .admin-page { padding-top: 2rem; padding-bottom: 3rem; }
    .admin-header { margin-bottom: 1.5rem; }
    .page-title { font-size: 1.75rem; font-weight: 600; font-family: var(--font-heading); }

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
    .stat-card.ok .stat-value { color: #2e6b3f; }
    .stat-card.aviso .stat-value { color: #a1443c; }

    .acciones-grid { display: flex; gap: 0.75rem; margin-bottom: 1.5rem; flex-wrap: wrap; }

    .config-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 0.75rem;
    }
    .config-acciones { display: flex; align-items: flex-end; }
    .config-acciones .btn { width: 100%; }

    .card-title { font-size: 1.125rem; font-weight: 600; margin-bottom: 0.25rem; }
    .hint { font-size: 0.8125rem; color: var(--text-light); margin-bottom: 0.75rem; }

    .filter-bar { margin-bottom: 1rem; }
    .filter-body { display: flex; gap: 1rem; align-items: flex-end; flex-wrap: wrap; }
    .filter-group { min-width: 160px; }
    .filter-actions { margin-left: auto; }

    .table-card { overflow: hidden; margin-bottom: 1rem; }
    .table-responsive { overflow-x: auto; }
    .empty-state { text-align: center; color: var(--text-light); padding: 2rem 1rem !important; }
    .saldo-pendiente { color: #a1443c; font-weight: 600; }

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

    .modal-backdrop {
      position: fixed; inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex; align-items: center; justify-content: center;
      z-index: 1000; padding: 1rem;
    }
    .modal {
      background: var(--bg, #fff);
      border-radius: 12px;
      padding: 1.5rem;
      width: 100%;
      max-width: 460px;
      max-height: 90vh;
      overflow-y: auto;
    }
    .modal h3 { margin-bottom: 1rem; font-size: 1.25rem; }
    .form-group { margin-bottom: 0.9rem; }
    .mt { margin-top: 0.4rem; }

    .info-box {
      background: rgba(201, 162, 39, 0.1);
      border-left: 3px solid var(--gold);
      padding: 0.7rem;
      border-radius: 4px;
      font-size: 0.875rem;
      margin-bottom: 0.9rem;
    }

    .modal-actions {
      display: flex; justify-content: flex-end; gap: 0.6rem;
      margin-top: 1.25rem;
    }

    @media (max-width: 768px) {
      .filter-body { flex-direction: column; }
      .filter-group { min-width: 100%; }
      .filter-actions { margin-left: 0; width: 100%; }
    }
  `,
})
export class AdminPagosComponent implements OnInit {
  private adminService = inject(AdminService);
  private pdf = inject(PdfService);
  private toast = inject(ToastService);

  ingresos = signal<IngresosData | null>(null);
  pagos = signal<Pago[]>([]);
  loading = signal(true);
  modalAbierto = signal(false);
  guardando = signal(false);
  configAbierto = signal(false);
  guardandoConfig = signal(false);

  filtroEstado = '';

  cfg: ConfigCobro = {
    alias_bancario: '',
    titular_cuenta: '',
    banco_nombre: '',
    moneda: 'ARS',
    anticipo_porcentaje: '30',
  };

  formCodigo = '';
  formMonto: number | null = null;
  formMetodo = 'alias';
  formEstado = 'Confirmado';
  formReferencia = '';
  reservaBuscada = signal<any | null>(null);

  ngOnInit() {
    this.cargarIngresos();
    this.cargarPagos();
    this.cargarConfig();
  }

  cargarConfig() {
    this.adminService.getConfigCobro().subscribe({
      next: (res) => {
        if (res.status === '1' && res.data) {
          // Merge en vez de asignar: si el backend no manda alguna clave, se
          // conserva el valor por defecto del form y el campo no queda en blanco.
          this.cfg = { ...this.cfg, ...res.data };
        }
      },
      error: () => this.toast.error('Error al cargar los datos de cobro'),
    });
  }

  // Cada clave se guarda por separado porque el endpoint toma una clave por
  // llamada. Van en cadena con concatMap para no disparar las seis en paralelo:
  // si el hotel edita y guarda dos veces seguido, las peticiones cruzadas podrian
  // llegar desordenadas y dejar guardada la version vieja.
  guardarConfig() {
    const claves: (keyof ConfigCobro)[] = [
      'alias_bancario',
      'titular_cuenta',
      'banco_nombre',
      'anticipo_porcentaje',
    ];

    const cambios = claves
      .filter((c) => this.cfg[c] !== undefined && this.cfg[c] !== null)
      .map((clave) =>
        this.adminService.updateConfigCobro(clave, String(this.cfg[clave] ?? '')).pipe(
          map((r) => r.status === '1'),
          catchError((e) => {
            this.guardandoConfig.set(false);
            this.toast.error(e?.error?.message ?? `No se pudo guardar ${clave}`);
            return of(false);
          })
        )
      );

    if (!cambios.length) return;

    this.guardandoConfig.set(true);
    forkJoin(cambios).subscribe((resultados) => {
      this.guardandoConfig.set(false);
      if (resultados.every(Boolean)) {
        this.toast.success('Datos de cobro actualizados');
      }
    });
  }

  cargarIngresos() {
    this.adminService.getIngresos().subscribe({
      next: (res) => {
        if (res.status === '1') this.ingresos.set(res.data);
      },
      error: () => this.toast.error('Error al cargar los ingresos'),
    });
  }

  cargarPagos() {
    this.adminService.getPagos({
      estado: this.filtroEstado || undefined,
      limite: 50,
    }).subscribe({
      next: (res) => {
        if (res.status === '1') this.pagos.set(res.data.pagos);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Error al cargar los pagos');
        this.loading.set(false);
      },
    });
  }

  buscarReserva() {
    const codigo = (this.formCodigo || '').trim().toUpperCase();
    if (!codigo) {
      this.toast.error('Ingresa el codigo de la reserva');
      return;
    }

    const encontrada = this.ingresos()?.saldo_por_reserva.find((r) => r.codigo === codigo);
    if (encontrada) {
      this.reservaBuscada.set(encontrada);
      this.formMonto = encontrada.saldo;
      return;
    }

    // Si no esta en la lista de saldos, se busca en el listado de reservas.
    this.adminService.getReservas({ limite: 100 }).subscribe({
      next: (res) => {
        if (res.status === '1') {
          const r = res.data.reservas.find((x: any) => x.codigo === codigo);
          if (r) {
            this.reservaBuscada.set(r);
            this.formMonto = Math.max(0, Number(r.saldo ?? r.precio_total));
          } else {
            this.reservaBuscada.set(null);
            this.toast.error('No se encontro ninguna reserva con ese codigo');
          }
        }
      },
      error: () => this.toast.error('Error al buscar la reserva'),
    });
  }

  abrirModal(codigo: string, saldo: number) {
    this.formCodigo = codigo;
    this.formMonto = saldo;
    this.reservaBuscada.set({ codigo, saldo });
    this.modalAbierto.set(true);
  }

  guardar() {
    const r = this.reservaBuscada();
    const monto = Number(this.formMonto);

    if (!r) {
      this.toast.error('Busca la reserva primero');
      return;
    }
    if (!Number.isFinite(monto) || monto <= 0) {
      this.toast.error('El monto debe ser mayor a 0');
      return;
    }

    this.guardando.set(true);
    this.adminService
      .createPago({
        reserva_id: r.id,
        monto,
        metodo: this.formMetodo,
        estado: this.formEstado,
        referencia: this.formReferencia || undefined,
      })
      .subscribe({
        next: (res) => {
          if (res.status === '1') {
            this.toast.success('Pago registrado');
            this.modalAbierto.set(false);
            this.formCodigo = '';
            this.formMonto = null;
            this.formReferencia = '';
            this.reservaBuscada.set(null);
            this.cargarIngresos();
            this.cargarPagos();
          }
          this.guardando.set(false);
        },
        error: (e) => {
          this.toast.error(e?.error?.message ?? 'Error al registrar el pago');
          this.guardando.set(false);
        },
      });
  }

  confirmar(p: Pago) {
    this.adminService.updatePagoEstado(p.id, 'Confirmado').subscribe({
      next: () => {
        this.toast.success('Pago confirmado');
        this.cargarIngresos();
        this.cargarPagos();
      },
      error: (e) => this.toast.error(e?.error?.message ?? 'Error al confirmar'),
    });
  }

  anular(p: Pago) {
    if (!confirm('Anular este pago? La reserva quedara con saldo pendiente de nuevo.')) return;
    this.adminService.updatePagoEstado(p.id, 'Anulado').subscribe({
      next: () => {
        this.toast.success('Pago anulado');
        this.cargarIngresos();
        this.cargarPagos();
      },
      error: (e) => this.toast.error(e?.error?.message ?? 'Error al anular'),
    });
  }

  exportarIngresosPDF() {
    const ing = this.ingresos();
    if (!ing) return;
    try {
      this.pdf.exportarIngresos(ing);
      this.toast.success('Reporte generado');
    } catch (e: any) {
      this.toast.error('Error al generar el PDF: ' + (e?.message ?? 'desconocido'));
    }
  }

  exportarPagosPDF() {
    const lista = this.pagos();
    if (!lista.length) {
      this.toast.info('No hay pagos para exportar');
      return;
    }
    try {
      this.pdf.exportarPagos(lista);
      this.toast.success('PDF generado');
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
}