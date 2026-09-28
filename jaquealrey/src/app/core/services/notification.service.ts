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
  private socket: Socket;

  private nuevaReserva$ = new Subject<Reserva>();
  private reservaActualizada$ = new Subject<Reserva>();
  private adminError$ = new Subject<SocketAdminError>();

  constructor() {
    instancia = this;
    this.socket = io(environment.apiUrl.replace('/api', ''), {
      transports: ['websocket', 'polling'],
    });

    this.socket.on('nueva-reserva', (data: Reserva) => {
      this.nuevaReserva$.next(data);
    });

    this.socket.on('reserva-actualizada', (data: Reserva) => {
      this.reservaActualizada$.next(data);
    });

    this.socket.on('admin-error', (err: SocketAdminError) => {
      this.adminError$.next(err);
    });
  }

  joinAdmin(token: string): void {
    this.socket.auth = { token };
    this.socket.emit('join-admin', { token });
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

  disconnect(): void {
    this.socket.removeAllListeners();
    this.socket.disconnect();
    this.nuevaReserva$.complete();
    this.reservaActualizada$.complete();
    this.adminError$.complete();
    if (instancia === this) {
      instancia = null;
    }
  }
}
