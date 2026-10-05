import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Reserva, ReservaConsulta } from '../models/reserva.model';

interface CreateReservaPayload {
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  habitacion_id: number;
  fecha_entrada: string;
  fecha_salida: string;
  huespedes: number;
  notas?: string;
  acepta_terminos: boolean;
  terminos_version: string;
}

@Injectable({ providedIn: 'root' })
export class ReservaService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  createReserva(data: CreateReservaPayload): Observable<ApiResponse<Reserva>> {
    return this.http.post<ApiResponse<Reserva>>(`${this.apiUrl}/reservas`, data);
  }

  consultar(codigo: string, email: string): Observable<ApiResponse<ReservaConsulta>> {
    const params = new HttpParams().set('codigo', codigo).set('email', email);
    return this.http.get<ApiResponse<ReservaConsulta>>(`${this.apiUrl}/reservas/consultar`, { params });
  }

  cancelar(codigo: string, email: string, motivo?: string): Observable<ApiResponse<Reserva>> {
    return this.http.put<ApiResponse<Reserva>>(`${this.apiUrl}/reservas/cancelar`, {
      codigo,
      email,
      motivo,
    });
  }

  /**
   * Avisa que ya transfirio al alias. NO confirma la reserva: eso lo hace el
   * admin cuando ve la plata. Solo deja el aviso para que el hotel sepa que
   * tiene una reserva que revisar.
   */
  reportarPago(
    codigo: string,
    email: string,
    numeroOperacion: string,
    referencia: string,
    fechaTransferencia: string
  ): Observable<ApiResponse<Reserva>> {
    return this.http.put<ApiResponse<Reserva>>(`${this.apiUrl}/reservas/reportar-pago`, {
      codigo,
      email,
      numero_operacion: numeroOperacion,
      referencia,
      fecha_transferencia: fechaTransferencia,
    });
  }
}
