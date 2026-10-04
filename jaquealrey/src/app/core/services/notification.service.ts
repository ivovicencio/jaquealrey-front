import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { Reserva } from '../models/reserva.model';

export interface SocketAdminError {
  code: string;
  message: string;
}

let instancia: NotificationService | null = null;

export function obtenerNotificaciones(): NotificationService | null {
  return instancia;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private socket: Socket | null = null;

  private nuevaReserva$ = new Subject<Reserva>();
  private reservaActualizada$ = new Subject<Reserva>();
  private adminError$ = new Subject<SocketAdminError>();
  private sesionRevocada$ = new Subject<string>();

  constructor() {
    instancia = this;
  }

  /**
   * El socket se arma en el primer `joinAdmin`, no en el constructor.
   *
   * Con el socket en el constructor, el servicio (que es root) abria una
   * conexion para todos los visitantes del sitio, sin token, y `disconnect()`
   * completaba los Subjects: en el mismo SPA, un logout seguido de un login
   * nuevo dejaba el servicio mudo para siempre, porque los Subjects ya estaban
   * completados y no se puede volver a emitir en ellos.
   */
  private asegurarSocket(): Socket {
    if (this.socket) return this.socket;

    const socket = io(environment.apiUrl.replace('/api', ''), {
      transports: ['websocket', 'polling'],
    });

    socket.on('nueva-reserva', (data: Reserva) => {
      this.nuevaReserva$.next(data);
    });

    socket.on('reserva-actualizada', (data: Reserva) => {
      this.reservaActualizada$.next(data);
    });

    socket.on('admin-error', (err: SocketAdminError) => {
      this.adminError$.next(err);
    });

    // El back corta la conexion cuando el token queda revocado. Si el back se
    // reinicio, o el token vencio de otra sesion, este evento es la unica
    // senal de que esta pestana ya no deberia seguir operando el panel.
    socket.on('session-revoked', (payload: { message?: string } | string) => {
      const mensaje =
        typeof payload === 'string' ? payload : payload?.message || 'Sesion revocada';
      this.sesionRevocada$.next(mensaje);
    });

    this.socket = socket;
    return socket;
  }

  joinAdmin(token: string): void {
    const socket = this.asegurarSocket();
    socket.auth = { token };
    socket.emit('join-admin', { token });
  }

  onNuevaReserva(): Observable<Reserva> {
    return this.nuevaReserva$.asObservable();
  }

  onReservaActualizada(): Observable<Reserva> {
    return this.reservaActualizada$.asObservable();
  }

  onAdminError(): Observable<SocketAdminError> {
    return this.adminError$.asObservable();
  }

  onSesionRevocada(): Observable<string> {
    return this.sesionRevocada$.asObservable();
  }

  /**
   * Cierra la conexion sin tocar los Subjects.
   *
   * Completarlos era irreversible: despues de un logout, un login en la misma
   * pestana se quedaba sin notificaciones en vivo. El socket es lo unico que
   * hay que tirar; los flujos siguen vivos para la proxima sesion.
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    if (instancia === this) {
      instancia = null;
    }
  }
}
