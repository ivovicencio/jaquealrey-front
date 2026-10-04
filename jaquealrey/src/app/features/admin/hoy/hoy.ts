import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminService } from '../../../core/services/admin.service';
import {
  Reserva,
  ReservaHoy,
  HabitacionEstado,
  EstadoOperativo,
} from '../../../core/models/reserva.model';
import { NotificationService } from '../../../core/services/notification.service';
import { ToastService } from '../../../shared/services/toast.service';
import { AppModeService } from '../../../core/services/app-mode.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-hoy',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, DatePipe, FormsModule],
  template: `
    <div class="container admin-page">
      @if (appMode.esAppEscritorio()) {
        <div class="app-bar">
          <span class="app-bar-brand"><i class="fas fa-chess-king"></i> Hotel Jaque al Rey</span>
          <span class="app-bar-sep"></span>
          <a routerLink="/admin" class="app-bar-link">Panel</a>
          <a routerLink="/admin/hoy" class="app-bar-link">Hoy</a>
          <a routerLink="/admin/walk-in" class="app-bar-link">Walk-in</a>
          <a routerLink="/admin/reservas" class="app-bar-link">Reservas</a>
          <a routerLink="/admin/pagos" class="app-bar-link">Pagos</a>
          <button type="button" class="app-bar-salir" (click)="logout()">Salir</button>
        </div>
      }

      <div class="admin-header">
        <h1 class="page-title">Hoy</h1>
        <p class="subtitle">{{ fecha() | date: 'fullDate' : undefined : 'es-AR' }}</p>
        <div class="header-actions">
          <a routerLink="/admin/walk-in" class="btn btn-primary">+ Walk-in</a>
          <button type="button" class="btn btn-ghost" (click)="load()" [disabled]="loading()">
            Actualizar
          </button>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Cargando...</p>
        </div>
      } @else {
        <!--
          Confirmación del no-show.

          Va antes de todo lo demás y bloquea con un fondo, porque es la única
          acción de recepción que borra una reserva sin que el huésped la haya
          cancelado. Un confirm() del navegador se quebraba en algunos navegadores móviles
          y no se ve; este se ve siempre y obliga a leer el nombre.

          Se dice explícitamente que se avisa al huésped: la decisión que se está
          tomando no es solo interna.
        -->
        @if (noShowPendiente(); as r) {
          <div class="overlay" (click)="noShowPendiente.set(null)">
            <div class="card modal" (click)="$event.stopPropagation()">
              <h3>¿Marcar como no presentación?</h3>
              <p>
                <strong>{{ r.cliente_nombre }} {{ r.cliente_apellido }}</strong>
                · Hab. {{ r.habitacion_numero }} · {{ r.codigo }}
              </p>
              <p class="modal-texto">
                Se cancela la reserva y se le avisa al huésped por WhatsApp.
                @if (r.estado === 'En_Casa') {
                  La habitación queda en limpieza.
                }
                @if (debeDinero(r)) {
                  <strong>Queda un saldo impago de
                    {{ r.saldo | currency: 'ARS' : 'symbol-narrow' : '1.0-0' : 'es-AR' }}</strong>.
                }
              </p>
              <div class="actions">
                <button type="button" class="btn btn-ghost" (click)="noShowPendiente.set(null)">
                  Volver
                </button>
                <button type="button" class="btn btn-primary btn-peligro-solido" (click)="confirmarNoShow()"
                  [disabled]="busyId() === r.id">
                  {{ busyId() === r.id ? 'Cancelando...' : 'Sí, no se presentó' }}
                </button>
              </div>
            </div>
          </div>
        }

        @if (porVerificar().length > 0) {
          <section class="bloque alerta">
            <h2>Pagos a verificar ({{ porVerificar().length }})</h2>
            <p class="vacio">El huésped avisó que transfirió. Revisá el banco y confirmá el pago.</p>
            @for (r of porVerificar(); track r.id) {
              <div class="card fila">
                <div class="fila-main">
                  <strong>{{ r.codigo }} · Hab. {{ r.habitacion_numero }}</strong>
                  <span>{{ r.cliente_nombre }} {{ r.cliente_apellido }}</span>
                  <span class="muted">
                    {{ r.cliente_telefono }} ·
                    {{ r.precio_total | currency: 'ARS' : 'symbol-narrow' : '1.0-0' : 'es-AR' }}
                  </span>
                </div>
                <a class="btn btn-primary" [routerLink]="['/admin/reservas', r.id]">Revisar</a>
              </div>
            }
          </section>
        }

        <section class="bloque">
          <h2>Llegadas ({{ llegadas().length }})</h2>
          @if (llegadas().length === 0) {
            <p class="vacio">No hay llegadas hoy.</p>
          } @else {
            @for (r of llegadas(); track r.id) {
              <div class="card fila">
                <div class="fila-main">
                  <strong>Hab. {{ r.habitacion_numero }}</strong>
                  <span>{{ r.cliente_nombre }} {{ r.cliente_apellido }}</span>
                  <span class="muted">{{ r.codigo }} · {{ r.huespedes }} pax</span>
                  @if (debeDinero(r)) {
                    <span class="alerta-saldo">
                      Debe {{ r.saldo | currency: 'ARS' : 'symbol-narrow' : '1.0-0' : 'es-AR' }}
                    </span>
                  }
                  @if (hayAvisoHabitacion(r)) {
                    <span class="muted">{{ avisoHabitacion(r) }}</span>
                  }
                </div>
                <div class="fila-acciones">
                  <button
                    type="button"
                    class="btn btn-ghost btn-peligro"
                    (click)="pedirNoShow(r)"
                    [disabled]="busyId() === r.id"
                  >
                    No se presentó
                  </button>
                  <button
                    type="button"
                    class="btn btn-primary"
                    (click)="abrirCheckIn(r)"
                    [disabled]="busyId() === r.id"
                  >
                    Dar llave
                  </button>
                </div>
              </div>

              @if (checkInAbierto() === r.id) {
                <form class="card panel" (ngSubmit)="confirmarCheckIn()">
                  <div class="panel-head">
                    <strong>Check-in · Hab. {{ r.habitacion_numero }} · {{ r.cliente_nombre }}</strong>
                    <button type="button" class="link" (click)="cerrarCheckIn()">Cerrar</button>
                  </div>

                  <div class="grid">
                    <label>Documento *
                      <input
                        [(ngModel)]="checkInForm.documento"
                        name="documento"
                        required
                        minlength="6"
                        autocomplete="off"
                      />
                    </label>
                    <label>Nacionalidad *
                      <input
                        [(ngModel)]="checkInForm.nacionalidad"
                        name="nacionalidad"
                        required
                        autocomplete="country"
                      />
                    </label>
                    <label>Llave entregada a
                      <input
                        [(ngModel)]="checkInForm.entregado_a"
                        name="entregado_a"
                        [placeholder]="nombreHuesped(r)"
                      />
                    </label>
                    <label class="full">Notas
                      <textarea [(ngModel)]="checkInForm.notas" name="notas" rows="2"></textarea>
                    </label>
                  </div>

                  @if (debeDinero(r)) {
                    <label class="check">
                      <input type="checkbox" [(ngModel)]="checkInForm.forzar_sin_pago" name="forzar" />
                      Entra igual dejando un saldo de
                      {{ r.saldo | currency: 'ARS' : 'symbol-narrow' : '1.0-0' : 'es-AR' }}
                    </label>
                  }

                  <div class="actions">
                    <button type="button" class="btn btn-ghost" (click)="cerrarCheckIn()">Cancelar</button>
                    <button type="submit" class="btn btn-primary" [disabled]="busyId() === r.id">
                      {{ busyId() === r.id ? 'Registrando...' : 'Confirmar check-in' }}
                    </button>
                  </div>
                </form>
              }
            }
          }
        </section>

        @if (walkIns().length > 0) {
          <section class="bloque">
            <h2>Walk-ins ({{ walkIns().length }})</h2>
            <p class="vacio">Entraron por recepción. Pediles el documento antes de dar la llave.</p>
            @for (r of walkIns(); track r.id) {
              <div class="card fila">
                <div class="fila-main">
                  <strong>Hab. {{ r.habitacion_numero }}</strong>
                  <span>{{ r.cliente_nombre }} {{ r.cliente_apellido }}</span>
                  <span class="muted">{{ r.codigo }} · {{ r.huespedes }} pax</span>
                  @if (debeDinero(r)) {
                    <span class="alerta-saldo">
                      Debe {{ r.saldo | currency: 'ARS' : 'symbol-narrow' : '1.0-0' : 'es-AR' }}
                    </span>
                  }
                  @if (hayAvisoHabitacion(r)) {
                    <span class="muted">{{ avisoHabitacion(r) }}</span>
                  }
                </div>
                <div class="fila-acciones">
                  <button
                    type="button"
                    class="btn btn-ghost btn-peligro"
                    (click)="pedirNoShow(r)"
                    [disabled]="busyId() === r.id"
                  >
                    No se presentó
                  </button>
                  <button
                    type="button"
                    class="btn btn-primary"
                    (click)="abrirCheckIn(r)"
                    [disabled]="busyId() === r.id"
                  >
                    Dar llave
                  </button>
                </div>
              </div>

              @if (checkInAbierto() === r.id) {
                <form class="card panel" (ngSubmit)="confirmarCheckIn()">
                  <div class="panel-head">
                    <strong>Check-in · Hab. {{ r.habitacion_numero }} · {{ r.cliente_nombre }}</strong>
                    <button type="button" class="link" (click)="cerrarCheckIn()">Cerrar</button>
                  </div>

                  <div class="grid">
                    <label>Documento *
                      <input
                        [(ngModel)]="checkInForm.documento"
                        name="documento"
                        required
                        minlength="6"
                        autocomplete="off"
                      />
                    </label>
                    <label>Nacionalidad *
                      <input
                        [(ngModel)]="checkInForm.nacionalidad"
                        name="nacionalidad"
                        required
                        autocomplete="country"
                      />
                    </label>
                    <label>Llave entregada a
                      <input
                        [(ngModel)]="checkInForm.entregado_a"
                        name="entregado_a"
                        [placeholder]="nombreHuesped(r)"
                      />
                    </label>
                    <label class="full">Notas
                      <textarea [(ngModel)]="checkInForm.notas" name="notas" rows="2"></textarea>
                    </label>
                  </div>

                  <div class="actions">
                    <button type="button" class="btn btn-ghost" (click)="cerrarCheckIn()">Cancelar</button>
                    <button type="submit" class="btn btn-primary" [disabled]="busyId() === r.id">
                      {{ busyId() === r.id ? 'Registrando...' : 'Confirmar check-in' }}
                    </button>
                  </div>
                </form>
              }
            }
          </section>
        }

        <section class="bloque">
          <h2>En casa ({{ enCasa().length }})</h2>
          @if (enCasa().length === 0) {
            <p class="vacio">Nadie en casa.</p>
          } @else {
            @for (r of enCasa(); track r.id) {
              <div class="card fila">
                <div class="fila-main">
                  <strong>Hab. {{ r.habitacion_numero }}</strong>
                  <span>{{ r.cliente_nombre }} {{ r.cliente_apellido }}</span>
                  <span class="muted">hasta {{ r.fecha_salida | date: 'dd/MM' }}</span>
                  @if (debeDinero(r)) {
                    <span class="alerta-saldo">
                      Debe {{ r.saldo | currency: 'ARS' : 'symbol-narrow' : '1.0-0' : 'es-AR' }}
                    </span>
                  }
                </div>
                <div class="fila-acciones">
                  <button
                    type="button"
                    class="btn btn-ghost btn-peligro"
                    (click)="pedirNoShow(r)"
                    [disabled]="busyId() === r.id"
                  >
                    No se presentó
                  </button>
                  @if (esSalidaHoy(r)) {
                    <button
                      type="button"
                      class="btn btn-primary"
                      (click)="pedirCheckOut(r)"
                      [disabled]="busyId() === r.id"
                    >
                      Marcar salida
                    </button>
                  }
                </div>
              </div>

              @if (checkOutAbierto() === r.id) {
                <form class="card panel" (ngSubmit)="confirmarCheckOut()">
                  <div class="panel-head">
                    <strong>Check-out · Hab. {{ r.habitacion_numero }} · {{ r.cliente_nombre }}</strong>
                    <button type="button" class="link" (click)="cerrarCheckOut()">Cerrar</button>
                  </div>

                  <p class="panel-nota">
                    La habitación queda en <strong>limpieza</strong>, no libre. Recién después de
                    "limpieza terminada" vuelve a estar a la venta.
                  </p>

                  <div class="grid">
                    <label class="full">Notas
                      <textarea [(ngModel)]="checkOutForm.notas" name="notas" rows="2"></textarea>
                    </label>
                  </div>

                  @if (debeDinero(r)) {
                    <p class="panel-alerta">
                      Tiene un saldo de
                      {{ r.saldo | currency: 'ARS' : 'symbol-narrow' : '1.0-0' : 'es-AR' }}.
                      Sin la casilla de abajo el check-out se rechaza.
                    </p>
                    <label class="check">
                      <input type="checkbox" [(ngModel)]="checkOutForm.forzar_sin_pago" name="forzar" />
                      Registrar la salida igualmente y dejar la cuenta impaga
                    </label>
                  }

                  <div class="actions">
                    <button type="button" class="btn btn-ghost" (click)="cerrarCheckOut()">Cancelar</button>
                    <button type="submit" class="btn btn-primary" [disabled]="busyId() === r.id">
                      {{ busyId() === r.id ? 'Registrando...' : 'Confirmar check-out' }}
                    </button>
                  </div>
                </form>
              }
            }
          }
        </section>

        <section class="bloque">
          <h2>Salidas de hoy ({{ salidas().length }})</h2>
          @if (salidas().length === 0) {
            <p class="vacio">No hay salidas programadas hoy.</p>
          } @else {
            @for (r of salidas(); track r.id) {
              <div class="card fila">
                <div class="fila-main">
                  <strong>Hab. {{ r.habitacion_numero }}</strong>
                  <span>{{ r.cliente_nombre }} {{ r.cliente_apellido }}</span>
                  <span class="muted">{{ r.codigo }}</span>
                </div>
                <div class="fila-acciones">
                  <button
                    type="button"
                    class="btn btn-primary"
                    (click)="pedirCheckOut(r)"
                    [disabled]="busyId() === r.id"
                  >
                    Marcar salida
                  </button>
                </div>
              </div>

              @if (checkOutAbierto() === r.id) {
                <form class="card panel" (ngSubmit)="confirmarCheckOut()">
                  <div class="panel-head">
                    <strong>Check-out · Hab. {{ r.habitacion_numero }} · {{ r.cliente_nombre }}</strong>
                    <button type="button" class="link" (click)="cerrarCheckOut()">Cerrar</button>
                  </div>

                  <p class="panel-nota">
                    La habitación queda en <strong>limpieza</strong>, no libre. Recién después de
                    "limpieza terminada" vuelve a estar a la venta.
                  </p>

                  <div class="grid">
                    <label class="full">Notas
                      <textarea [(ngModel)]="checkOutForm.notas" name="notas" rows="2"></textarea>
                    </label>
                  </div>

                  @if (debeDinero(r)) {
                    <p class="panel-alerta">
                      Tiene un saldo de
                      {{ r.saldo | currency: 'ARS' : 'symbol-narrow' : '1.0-0' : 'es-AR' }}.
                      Sin la casilla de abajo el check-out se rechaza.
                    </p>
                    <label class="check">
                      <input type="checkbox" [(ngModel)]="checkOutForm.forzar_sin_pago" name="forzar" />
                      Registrar la salida igualmente y dejar la cuenta impaga
                    </label>
                  }

                  <div class="actions">
                    <button type="button" class="btn btn-ghost" (click)="cerrarCheckOut()">Cancelar</button>
                    <button type="submit" class="btn btn-primary" [disabled]="busyId() === r.id">
                      {{ busyId() === r.id ? 'Registrando...' : 'Confirmar check-out' }}
                    </button>
                  </div>
                </form>
              }
            }
          }
        </section>

        <section class="bloque">
          <h2>Habitaciones</h2>
          @if (habitaciones().length === 0) {
            <p class="vacio">No hay habitaciones cargadas.</p>
          } @else {
            <div class="grid-hab">
              @for (h of habitaciones(); track h.id) {
                <div class="card hab" [class]="estadoClase(h.estado_operativo)">
                  <div class="hab-head">
                    <strong>{{ h.numero }}</strong>
                    <span class="badge">{{ etiquetaEstado(h.estado_operativo) }}</span>
                  </div>
                  <span class="muted">{{ h.nombre }}</span>
                  @if (h['huésped_en_casa']) {
                    <span class="muted">{{ h['huésped_en_casa'] }}</span>
                  } @else if (!h.activa) {
                    <span class="muted">Fuera del inventario</span>
                  }

                  <div class="hab-acciones">
                    @if (h.estado_operativo === 'limpieza') {
                      <button
                        type="button"
                        class="btn btn-primary btn-chico"
                        (click)="reactivar(h)"
                        [disabled]="busyId() === h.id"
                      >
                        Limpieza terminada
                      </button>
                    }
                    @if (h.estado_operativo === 'libre' && h.occupied_reservas === 0) {
                      <button
                        type="button"
                        class="btn btn-ghost btn-chico"
                        (click)="ponerEstado(h, 'mantenimiento')"
                        [disabled]="busyId() === h.id"
                      >
                        Mantenimiento
                      </button>
                    }
                    @if (h.estado_operativo === 'mantenimiento') {
                      <button
                        type="button"
                        class="btn btn-ghost btn-chico"
                        (click)="ponerEstado(h, 'libre')"
                        [disabled]="busyId() === h.id"
                      >
                        Volver a la venta
                      </button>
                    }
                    @if (h.estado_operativo === 'ocupada') {
                      <span class="muted">La saca el check-out</span>
                    }
                  </div>
                </div>
              }
            </div>
          }
        </section>
      }
    </div>
  `,
  styles: `
    .admin-page { padding-top: 2rem; padding-bottom: 3rem; }
    .app-bar {
      display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;
      margin: -2rem 0 2rem; padding: 0.85rem 1.25rem; background: var(--dark); color: #fff;
    }
    .app-bar-brand { color: var(--gold-light); font-weight: 600; }
    .app-bar-sep { flex: 1; }
    .app-bar-link { color: rgba(255,255,255,0.85); text-decoration: none; font-size: 0.9rem; }
    .app-bar-salir {
      background: transparent; color: #fff; border: 1.5px solid rgba(255,255,255,0.4);
      border-radius: var(--radius); padding: 0.4rem 0.9rem; cursor: pointer;
    }
    .admin-header { margin-bottom: 1.5rem; }
    .subtitle { color: var(--text-light); margin: 0.25rem 0 1rem; }
    .header-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; }
    .bloque { margin-bottom: 2rem; }
    .bloque h2 { font-size: 1.1rem; margin-bottom: 0.75rem; }
    .bloque.alerta h2 { color: #b45309; }
    .vacio { color: var(--text-light); font-size: 0.95rem; margin-bottom: 0.75rem; }
    .fila {
      display: flex; align-items: center; justify-content: space-between; gap: 1rem;
      padding: 1rem 1.25rem; margin-bottom: 0.5rem; flex-wrap: wrap;
    }
    .fila-main { display: flex; flex-direction: column; gap: 0.2rem; }
    .fila-acciones { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }
    .muted { color: var(--text-light); font-size: 0.85rem; }

    /* Saldo pendiente: solo se pinta cuando hay que cobrar. Con "Saldo: $0"
       en todas las filas el número real se pierde en el ruido. */
    .alerta-saldo {
      color: #b45309; font-size: 0.85rem; font-weight: 700;
    }

    /* Panel de check-in / check-out. Es una card pegada a la fila que explica,
       no un modal: el recepcionista tiene que ver la fila mientras carga el DNI,
       no una pantalla aparte. */
    .panel {
      margin: -0.25rem 0 0.75rem; padding: 1rem 1.25rem;
      border-left: 3px solid var(--gold);
    }
    .panel-head {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 0.9rem;
    }
    .panel-nota { color: var(--text-light); font-size: 0.85rem; margin: 0 0 0.9rem; }
    .panel-alerta {
      color: #b45309; font-size: 0.88rem; margin: 0.9rem 0 0.5rem; font-weight: 600;
    }
    .link {
      background: none; border: none; color: var(--text-light);
      text-decoration: underline; cursor: pointer; font: inherit; font-size: 0.85rem;
    }
    .grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.9rem;
    }
    label { display: flex; flex-direction: column; gap: 0.3rem; font-size: 0.88rem; font-weight: 600; }
    label.full { grid-column: 1 / -1; }
    /* La casilla del override va en fila: es una decisión, no un campo más. */
    label.check {
      flex-direction: row; align-items: center; gap: 0.5rem;
      margin-top: 0.9rem; font-weight: 600;
    }
    input[type='text'], input[type='number'], input[type='date'], input:not([type]), textarea {
      font: inherit; font-weight: 400; padding: 0.5rem 0.65rem;
      border: 1px solid var(--border); border-radius: var(--radius); background: #fff;
    }
    textarea { resize: vertical; }
    .actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.1rem; }

    /* Grid de habitaciones. La tarjeta se tiñe por el borde según el estado: el
       color es lo que se lee de reojo, sin leer la etiqueta. */
    .grid-hab {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 0.75rem;
    }
    .hab { padding: 0.85rem 1rem; border-left: 4px solid var(--border); }
    .hab.libre { border-left-color: #16a34a; }
    .hab.ocupada { border-left-color: #2563eb; }
    .hab.limpieza { border-left-color: var(--gold); }
    .hab.mantenimiento { border-left-color: #dc2626; }
    .hab-head {
      display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.2rem;
    }
    .badge {
      font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.03em;
      color: var(--text-light); font-weight: 700;
    }
    .hab-acciones { margin-top: 0.6rem; display: flex; gap: 0.4rem; flex-wrap: wrap; }

    .btn-chico { padding: 0.35rem 0.7rem; font-size: 0.8rem; }
    /* Rojo solo en el borde: el no-show es una acción destructiva pero es
       normal en recepción, no debería competir con "Dar llave". */
    .btn-peligro { border-color: rgba(220, 38, 38, 0.45); color: #b91c1c; }
    /* Dentro del modal sí va sólido: ahí el botón es la acción principal y el
       usuario ya decidió, solo está confirmando. */
    .btn-peligro-solido { background: #b91c1c; color: #fff; }

    /* Overlay del no-show. Cubre la pantalla entera y cierra al clickear fuera,
       para que un error se pueda volver atrás sin recargar. */
    .overlay {
      position: fixed; inset: 0; z-index: 1000;
      background: rgba(15, 15, 15, 0.55);
      display: flex; align-items: center; justify-content: center; padding: 1rem;
    }
    .modal { padding: 1.25rem 1.5rem; max-width: 30rem; width: 100%; }
    .modal h3 { margin: 0 0 0.6rem; font-size: 1.05rem; }
    .modal p { margin: 0 0 0.5rem; font-size: 0.92rem; }
    .modal-texto { color: var(--text-light); }

    .loading-state {
      display: flex; flex-direction: column; align-items: center; gap: 1rem;
      min-height: 20vh; color: var(--text-light);
    }
    .spinner {
      width: 36px; height: 36px; border-radius: 50%; border: 3px solid var(--border);
      border-top-color: var(--gold); animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .btn {
      border: none; border-radius: var(--radius); padding: 0.55rem 1rem; font-weight: 600;
      cursor: pointer; text-decoration: none; display: inline-flex; align-items: center;
    }
    .btn-primary { background: var(--gold); color: #111; }
    .btn-ghost { background: transparent; border: 1px solid var(--border); color: var(--text); }
    .btn:disabled { opacity: 0.6; cursor: not-allowed; }
  `,
})
export class AdminHoyComponent implements OnInit {
  private adminService = inject(AdminService);
  private toast = inject(ToastService);
  private notifications = inject(NotificationService);
  private destroyRef = inject(DestroyRef);
  readonly appMode = inject(AppModeService);
  private authService = inject(AuthService);
  private router = inject(Router);

  loading = signal(true);
  busyId = signal<number | null>(null);
  fecha = signal<string>('');
  llegadas = signal<ReservaHoy[]>([]);
  enCasa = signal<ReservaHoy[]>([]);
  salidas = signal<ReservaHoy[]>([]);
  walkIns = signal<ReservaHoy[]>([]);
  porVerificar = signal<Reserva[]>([]);
  habitaciones = signal<HabitacionEstado[]>([]);

  // Id de la reserva con el panel de check-in / check-out abierto, o null.
  // Es un id y no un objeto a propósito: si el socket recarga la lista en medio
  // del ingreso, el objeto viejo quedaría apuntando a datos viejos y el panel
  // enviaría el DNI de una fila que ya no está.
  checkInAbierto = signal<number | null>(null);
  checkOutAbierto = signal<number | null>(null);
  noShowPendiente = signal<ReservaHoy | null>(null);

  checkInForm = {
    documento: '',
    nacionalidad: '',
    entregado_a: '',
    notas: '',
    forzar_sin_pago: false,
  };

  checkOutForm = {
    notas: '',
    forzar_sin_pago: false,
  };

  constructor() {
    this.notifications
      .onReservaActualizada()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.load());
    this.notifications
      .onNuevaReserva()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.load());

    // El token pudo quedar revocado desde otra pestana (otro logout, un
    // reinicio del back). Esta pantalla queda inservible en ese estado, asi que
    // se sale igual que con el boton de Salir.
    this.notifications
      .onSesionRevocada()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.authService.logout();
        this.router.navigate(['/login']);
      });
  }

  ngOnInit() {
    this.load();
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  esSalidaHoy(r: ReservaHoy): boolean {
    return String(r.fecha_salida).slice(0, 10) === this.fecha();
  }

  load() {
    this.loading.set(true);

    this.adminService.getHoy().subscribe({
      next: (res) => {
        if (res.status === '1') {
          this.fecha.set(res.data.fecha);
          this.enCasa.set(res.data.en_casa || []);
          this.salidas.set(res.data.salidas || []);
          // `llegadas` y `walk_ins` se solapan: un walk-in de hoy es tambien una
          // llegada. Filtrar por origen aca evita que el mismo huesped aparezca
          // dos veces en la misma pantalla.
          this.walkIns.set(res.data.walk_ins || []);
          this.llegadas.set(
            (res.data.llegadas || []).filter((r) => r.origen !== 'recepcion')
          );
        }
        this.loading.set(false);
      },
      error: (err) => {
        // El mensaje del backend dice por que fallo (404 de ruta vieja, 401 de
        // sesion, 429 del limite). "No se pudo cargar" sin mas no deja arreglar nada.
        this.toast.error(err?.error?.msg || 'No se pudo cargar el día');
        this.loading.set(false);
      },
    });

    this.adminService.getPorVerificar().subscribe({
      next: (res) => {
        if (res.status === '1') {
          this.porVerificar.set(res.data || []);
        }
      },
      error: () => {
        // No bloqueamos la pantalla Hoy si falla esta lista
        this.porVerificar.set([]);
      },
    });

    this.cargarHabitaciones();
  }

  /**
   * Las habitaciones van en su propia llamada y no en `getHoy`.
   *
   * `/admin/hoy` es la pantalla de las reservas del día; el estado del
   * inventario es otra cosa y grows con el hotel, no con el día. Meterlo ahí
   * hacía que recargar por un check-out recargara también 40 habitaciones, y
   * hacía imposible mostrar el estado de una habitación cuando el endpoint de
   * reservas estaba caído.
   *
   * Un fallo acá no bloquea la pantalla: las reservas son lo urgente.
   */
  private cargarHabitaciones() {
    this.adminService.getEstadoHabitaciones().subscribe({
      next: (res) => {
        if (res.status === '1') {
          this.habitaciones.set(res.data || []);
        }
      },
      error: () => this.habitaciones.set([]),
    });
  }

  // ------------------------------------------------------------------
  // Check-in
  // ------------------------------------------------------------------
  //
  // Abre el panel y precarga lo que reception ya sabe, para que el DNI sea lo
  // unico que hay que tipear. Previa si el mismo huesped volvio antes: el
  // backend pisa documento y nacionalidad con lo que mande el check-in, asi que
  // un valor viejo queda desactualizado sin avisar.

  abrirCheckIn(r: ReservaHoy) {
    this.checkInAbierto.set(r.id);
    this.noShowPendiente.set(null);
    this.checkInForm = {
      documento: '',
      nacionalidad: '',
      entregado_a: this.nombreHuesped(r),
      notas: '',
      forzar_sin_pago: false,
    };
  }

  cerrarCheckIn() {
    this.checkInAbierto.set(null);
  }

  confirmarCheckIn() {
    const id = this.checkInAbierto();
    if (id === null) return;

    const documento = this.checkInForm.documento.trim();
    const nacionalidad = this.checkInForm.nacionalidad.trim();

    // Se valida aca y no solo en el backend para no gastar un request en un 400
    // que ya se sabe. El backend igual lo valida: esta es la copia comoda, no la
    // unica linea de defensa.
    if (documento.length < 6) {
      this.toast.error('El documento tiene que tener al menos 6 caracteres');
      return;
    }
    if (!nacionalidad) {
      this.toast.error('Falta la nacionalidad');
      return;
    }

    this.busyId.set(id);
    this.adminService
      .checkIn(id, {
        documento,
        nacionalidad,
        entregado_a: this.checkInForm.entregado_a.trim() || undefined,
        notas: this.checkInForm.notas.trim() || undefined,
        forzar_sin_pago: this.checkInForm.forzar_sin_pago,
      })
      .subscribe({
        next: (res) => {
          this.busyId.set(null);
          if (res.status === '1') {
            this.toast.success('Check-in registrado');
            this.cerrarCheckIn();
            this.load();
          } else {
            this.toast.error(res.msg || 'No se pudo hacer check-in');
          }
        },
        error: (err) => {
          this.busyId.set(null);
          this.toast.error(err?.error?.msg || 'Error en check-in');
        },
      });
  }

  // ------------------------------------------------------------------
  // Check-out
  // ------------------------------------------------------------------

  pedirCheckOut(r: ReservaHoy) {
    this.checkOutAbierto.set(r.id);
    this.checkOutForm = { notas: '', forzar_sin_pago: false };
  }

  cerrarCheckOut() {
    this.checkOutAbierto.set(null);
  }

  confirmarCheckOut() {
    const id = this.checkOutAbierto();
    if (id === null) return;

    // El backend devuelve 409 con el monto si debe plata. Se pide la
    // confirmacion antes de gastar el request, no despues del error.
    this.busyId.set(id);
    this.adminService
      .checkOut(id, {
        notas: this.checkOutForm.notas.trim() || undefined,
        forzar_sin_pago: this.checkOutForm.forzar_sin_pago,
      })
      .subscribe({
        next: (res) => {
          this.busyId.set(null);
          if (res.status === '1') {
            this.toast.success('Check-out registrado. La habitación queda en limpieza.');
            this.cerrarCheckOut();
            this.load();
          } else {
            this.toast.error(res.msg || 'No se pudo hacer check-out');
          }
        },
        error: (err) => {
          this.busyId.set(null);
          this.toast.error(err?.error?.msg || 'Error en check-out');
        },
      });
  }

  // ------------------------------------------------------------------
  // No se presentó
  // ------------------------------------------------------------------

  pedirNoShow(r: ReservaHoy) {
    this.noShowPendiente.set(r);
  }

  confirmarNoShow() {
    const r = this.noShowPendiente();
    if (!r) return;

    this.busyId.set(r.id);
    this.adminService.noShow(r.id).subscribe({
      next: (res) => {
        this.busyId.set(null);
        this.noShowPendiente.set(null);
        if (res.status === '1') {
          this.toast.success('Reserva cancelada por no presentación');
          this.load();
        } else {
          this.toast.error(res.msg || 'No se pudo marcar');
        }
      },
      error: (err) => {
        this.busyId.set(null);
        this.noShowPendiente.set(null);
        this.toast.error(err?.error?.msg || 'Error al marcar la no presentación');
      },
    });
  }

  // ------------------------------------------------------------------
  // Habitaciones
  // ------------------------------------------------------------------

  reactivar(h: HabitacionEstado) {
    this.busyId.set(h.id);
    this.adminService.reactivarHabitacion(h.id).subscribe({
      next: (res) => {
        this.busyId.set(null);
        if (res.status === '1') {
          this.toast.success(`Habitación ${h.numero} lista`);
          this.cargarHabitaciones();
        } else {
          this.toast.error(res.msg || 'No se pudo reactivar');
        }
      },
      error: (err) => {
        this.busyId.set(null);
        this.toast.error(err?.error?.msg || 'Error al reactivar la habitación');
      },
    });
  }

  ponerEstado(h: HabitacionEstado, estado: Exclude<EstadoOperativo, 'ocupada'>) {
    this.busyId.set(h.id);
    this.adminService.updateEstadoHabitacion(h.id, estado).subscribe({
      next: (res) => {
        this.busyId.set(null);
        if (res.status === '1') {
          this.toast.success(`Habitación ${h.numero}: ${this.etiquetaEstado(estado)}`);
          this.cargarHabitaciones();
        } else {
          this.toast.error(res.msg || 'No se pudo cambiar el estado');
        }
      },
      error: (err) => {
        this.busyId.set(null);
        this.toast.error(err?.error?.msg || 'Error al cambiar el estado');
      },
    });
  }

  etiquetaEstado(e: EstadoOperativo): string {
    switch (e) {
      case 'libre':
        return 'Libre';
      case 'ocupada':
        return 'Ocupada';
      case 'limpieza':
        return 'Limpieza';
      case 'mantenimiento':
        return 'Mantenimiento';
    }
  }

  estadoClase(e: EstadoOperativo): string {
    return e;
  }

  // ------------------------------------------------------------------
  // Helpers de template
  // ------------------------------------------------------------------

  /**
   * Saldo pendiente real, con la misma tolerancia que el backend.
   *
   * Sin esto, un pago de $100.000 contra un total de $100.000 deja un saldo de
   * 0,0000001 por redondeo de float y la pantalla muestra "Debe $0" con la
   * casilla de "entra igual debiendo" activada. Es el mismo EPSILON de
   * pago.service.js: si cambia uno, cambia el otro.
   */
  debeDinero(r: ReservaHoy | null | undefined): boolean {
    if (!r) return false;
    return Number(r.saldo || 0) > 0.05;
  }

  nombreHuesped(r: ReservaHoy | null | undefined): string {
    if (!r) return '';
    return `${r.cliente_nombre || ''} ${r.cliente_apellido || ''}`.trim();
  }

  hayAvisoHabitacion(r: ReservaHoy | null | undefined): boolean {
    if (!r) return false;
    return r.estado_operativo === 'mantenimiento' || r.estado_operativo === 'limpieza';
  }

  avisoHabitacion(r: ReservaHoy | null | undefined): string {
    if (!r) return '';
    if (r.estado_operativo === 'mantenimiento') return 'La habitación está en mantenimiento';
    if (r.estado_operativo === 'limpieza') return 'Falta la limpieza: marcala antes de dar la llave';
    return '';
  }
}