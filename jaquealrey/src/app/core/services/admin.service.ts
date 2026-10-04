import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { DashboardData } from '../models/dashboard.model';
import { Reserva, ReservaAdminList, HoyData, HabitacionEstado, Bloqueo } from '../models/reserva.model';
import { Habitacion } from '../models/habitacion.model';
import { HistorialPaginado } from '../models/historial.model';
import {
  ConfigCobro,
  IngresosData,
  Pago,
  PagosPaginated,
  PagosReserva,
  OcupacionData,
} from '../models/pago.model';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = environment.apiUrl;

  private adminHeaders(): HttpHeaders {
    return new HttpHeaders({ 'x-access-token': this.authService.getToken() ?? '' });
  }

  getDashboard(): Observable<ApiResponse<DashboardData>> {
    return this.http.get<ApiResponse<DashboardData>>(`${this.apiUrl}/admin/dashboard`, {
      headers: this.adminHeaders(),
    });
  }

  getReservas(filters?: {
    estado?: string;
    desde?: string;
    hasta?: string;
    pagina?: number;
    limite?: number;
  }): Observable<ApiResponse<ReservaAdminList>> {
    let params = new HttpParams();
    if (filters) {
      if (filters.estado) params = params.set('estado', filters.estado);
      if (filters.desde) params = params.set('desde', filters.desde);
      if (filters.hasta) params = params.set('hasta', filters.hasta);
      if (filters.pagina != null) params = params.set('pagina', String(filters.pagina));
      if (filters.limite != null) params = params.set('limite', String(filters.limite));
    }
    return this.http.get<ApiResponse<ReservaAdminList>>(`${this.apiUrl}/admin/reservas`, {
      headers: this.adminHeaders(),
      params,
    });
  }

  updateReservaEstado(
    id: number,
    estado: string,
    notas?: string,
    forzar_sin_pago?: boolean
  ): Observable<ApiResponse<Reserva>> {
    return this.http.put<ApiResponse<Reserva>>(
      `${this.apiUrl}/admin/reservas/${id}/estado`,
      { estado, notas, forzar_sin_pago },
      { headers: this.adminHeaders() }
    );
  }

  getReservaById(id: number): Observable<ApiResponse<Reserva>> {
    return this.http.get<ApiResponse<Reserva>>(`${this.apiUrl}/admin/reservas/${id}`, {
      headers: this.adminHeaders(),
    });
  }

  getHistorial(filters?: { pagina?: number; limite?: number }): Observable<ApiResponse<HistorialPaginado>> {
    let params = new HttpParams();
    if (filters) {
      if (filters.pagina != null) params = params.set('pagina', String(filters.pagina));
      if (filters.limite != null) params = params.set('limite', String(filters.limite));
    }
    return this.http.get<ApiResponse<HistorialPaginado>>(`${this.apiUrl}/admin/historial`, {
      headers: this.adminHeaders(),
      params,
    });
  }

  createHabitacion(data: Partial<Habitacion>): Observable<ApiResponse<Habitacion>> {
    return this.http.post<ApiResponse<Habitacion>>(`${this.apiUrl}/admin/habitaciones`, data, {
      headers: this.adminHeaders(),
    });
  }

  updateHabitacion(id: number, data: Partial<Habitacion>): Observable<ApiResponse<Habitacion>> {
    return this.http.put<ApiResponse<Habitacion>>(`${this.apiUrl}/admin/habitaciones/${id}`, data, {
      headers: this.adminHeaders(),
    });
  }

  deleteHabitacion(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/admin/habitaciones/${id}`, {
      headers: this.adminHeaders(),
    });
  }

  // ------------------------------------------------------------------
  // Pagos, ingresos y calendario
  // ------------------------------------------------------------------

  // Publico: el huesped necesita el alias para transferir.
  getConfigCobro(): Observable<ApiResponse<ConfigCobro>> {
    return this.http.get<ApiResponse<ConfigCobro>>(`${this.apiUrl}/pagos/configuracion`);
  }

  updateConfigCobro(clave: string, valor: string): Observable<ApiResponse<{ clave: string; valor: string }>> {
    return this.http.put<ApiResponse<{ clave: string; valor: string }>>(
      `${this.apiUrl}/pagos/configuracion`,
      { clave, valor },
      { headers: this.adminHeaders() }
    );
  }

  getIngresos(desde?: string): Observable<ApiResponse<IngresosData>> {
    let params = new HttpParams();
    if (desde) params = params.set('desde', desde);
    return this.http.get<ApiResponse<IngresosData>>(`${this.apiUrl}/pagos/ingresos`, {
      headers: this.adminHeaders(),
      params,
    });
  }

  getPagos(filters?: {
    reserva_id?: number;
    estado?: string;
    metodo?: string;
    desde?: string;
    hasta?: string;
    pagina?: number;
    limite?: number;
  }): Observable<ApiResponse<PagosPaginated>> {
    let params = new HttpParams();
    if (filters) {
      if (filters.reserva_id != null) params = params.set('reserva_id', String(filters.reserva_id));
      if (filters.estado) params = params.set('estado', filters.estado);
      if (filters.metodo) params = params.set('metodo', filters.metodo);
      if (filters.desde) params = params.set('desde', filters.desde);
      if (filters.hasta) params = params.set('hasta', filters.hasta);
      if (filters.pagina != null) params = params.set('pagina', String(filters.pagina));
      if (filters.limite != null) params = params.set('limite', String(filters.limite));
    }
    return this.http.get<ApiResponse<PagosPaginated>>(`${this.apiUrl}/pagos`, {
      headers: this.adminHeaders(),
      params,
    });
  }

  createPago(data: {
    reserva_id: number;
    monto: number;
    metodo?: string;
    estado?: string;
    referencia?: string;
    fecha_pago?: string;
    notas?: string;
  }): Observable<ApiResponse<Pago>> {
    return this.http.post<ApiResponse<Pago>>(`${this.apiUrl}/pagos`, data, {
      headers: this.adminHeaders(),
    });
  }

  // Un pago nunca se borra: se anula. Por eso esto es un PUT de estado y no un
  // DELETE, y el backend tiene el DELETE revocado a proposito.
  updatePagoEstado(
    id: number,
    estado: string,
    extra?: { referencia?: string; fecha_pago?: string; notas?: string }
  ): Observable<ApiResponse<Pago>> {
    return this.http.put<ApiResponse<Pago>>(
      `${this.apiUrl}/pagos/${id}/estado`,
      { estado, ...extra },
      { headers: this.adminHeaders() }
    );
  }

  getPagosReserva(reservaId: number): Observable<ApiResponse<PagosReserva>> {
    return this.http.get<ApiResponse<PagosReserva>>(`${this.apiUrl}/pagos/reserva/${reservaId}`, {
      headers: this.adminHeaders(),
    });
  }

  // Mapa de ocupacion por habitacion para el calendario. El backend ya recorta
  // las reservas al rango y devuelve las fechas en ISO, asi que el front solo
  // tiene que pintar la grilla sin volver a recortar nada.
  getOcupacion(desde: string, hasta: string): Observable<ApiResponse<OcupacionData>> {
    const params = new HttpParams().set('desde', desde).set('hasta', hasta);
    return this.http.get<ApiResponse<OcupacionData>>(`${this.apiUrl}/admin/ocupacion`, {
      headers: this.adminHeaders(),
      params,
    });
  }

    // ------------------------------------------------------------------
  // Recepción: Hoy, walk-in, check-in / check-out
  // ------------------------------------------------------------------

  getHoy(): Observable<ApiResponse<HoyData>> {
    return this.http.get<ApiResponse<HoyData>>(`${this.apiUrl}/admin/hoy`, {
      headers: this.adminHeaders(),
    });
  }

  createWalkIn(data: {
    nombre: string;
    apellido?: string;
    telefono: string;
    email: string;
    habitacion_id: number;
    fecha_entrada: string;
    fecha_salida: string;
    huespedes: number;
    notas?: string;
  }): Observable<ApiResponse<Reserva>> {
    return this.http.post<ApiResponse<Reserva>>(`${this.apiUrl}/admin/reservas`, data, {
      headers: this.adminHeaders(),
    });
  }

  /**
   * Check-in.
   *
   * `documento` y `nacionalidad` son obligatorios en la API. Es a propósito: en
   * recepción el DNI está a la vista, así que no cuesta nada, y la web NO los
   * pide (PASOS.md 24.1). El tipo los marca como tales para que el formulario no
   * los pueda mandar por olvido y se lleve un 400 del servidor.
   */
  checkIn(
    id: number,
    data: {
      documento: string;
      nacionalidad: string;
      entregado_a?: string;
      notas?: string;
      forzar_sin_pago?: boolean;
    }
  ): Observable<ApiResponse<Reserva>> {
    return this.http.post<ApiResponse<Reserva>>(
      `${this.apiUrl}/admin/reservas/${id}/check-in`,
      data,
      { headers: this.adminHeaders() }
    );
  }

  checkOut(
    id: number,
    data?: { notas?: string; forzar_sin_pago?: boolean }
  ): Observable<ApiResponse<Reserva>> {
    return this.http.post<ApiResponse<Reserva>>(
      `${this.apiUrl}/admin/reservas/${id}/check-out`,
      data || {},
      { headers: this.adminHeaders() }
    );
  }

  /**
   * No presentación. Cancela la reserva, avisa al huésped y, si estaba En_Casa,
   * manda la habitación a 'limpieza'.
   *
   * El botón tiene que pedir confirmación: es la única acción de recepción que
   * destruye una reserva sin que el huésped la cancele, y desde el botón de la
   * tabla el error de un click se paga con plata.
   */
  noShow(id: number): Observable<ApiResponse<Reserva>> {
    return this.http.post<ApiResponse<Reserva>>(
      `${this.apiUrl}/admin/reservas/${id}/no-se-presento`,
      {},
      { headers: this.adminHeaders() }
    );
  }

  // ------------------------------------------------------------------
  // Habitaciones: estado operativo y bloqueos
  // ------------------------------------------------------------------

  getEstadoHabitaciones(): Observable<ApiResponse<HabitacionEstado[]>> {
    return this.http.get<ApiResponse<HabitacionEstado[]>>(`${this.apiUrl}/admin/habitaciones/estado`, {
      headers: this.adminHeaders(),
    });
  }

  updateEstadoHabitacion(
    id: number,
    estado_operativo: 'libre' | 'limpieza' | 'mantenimiento'
  ): Observable<ApiResponse<HabitacionEstado>> {
    return this.http.put<ApiResponse<HabitacionEstado>>(
      `${this.apiUrl}/admin/habitaciones/${id}/estado`,
      { estado_operativo },
      { headers: this.adminHeaders() }
    );
  }

  /** "Limpieza terminada": de 'limpieza' a 'libre'. */
  reactivarHabitacion(id: number): Observable<ApiResponse<HabitacionEstado>> {
    return this.http.post<ApiResponse<HabitacionEstado>>(
      `${this.apiUrl}/admin/habitaciones/${id}/reactivar`,
      {},
      { headers: this.adminHeaders() }
    );
  }

  getBloqueos(habitacionId?: number, soloVigentes = false): Observable<ApiResponse<Bloqueo[]>> {
    let params = new HttpParams().set('solo_vigentes', soloVigentes ? 'true' : 'false');
    if (habitacionId !== undefined) params = params.set('habitacion_id', String(habitacionId));

    return this.http.get<ApiResponse<Bloqueo[]>>(`${this.apiUrl}/admin/bloqueos`, {
      headers: this.adminHeaders(),
      params,
    });
  }

  crearBloqueo(data: {
    habitacion_id: number;
    desde: string;
    hasta: string;
    motivo: string;
  }): Observable<ApiResponse<Bloqueo>> {
    return this.http.post<ApiResponse<Bloqueo>>(`${this.apiUrl}/admin/bloqueos`, data, {
      headers: this.adminHeaders(),
    });
  }

  levantarBloqueo(id: number): Observable<ApiResponse<Bloqueo>> {
    return this.http.delete<ApiResponse<Bloqueo>>(`${this.apiUrl}/admin/bloqueos/${id}`, {
      headers: this.adminHeaders(),
    });
  }

  getPorVerificar(horas = 0): Observable<ApiResponse<Reserva[]>> {
    const params = new HttpParams().set('horas', String(horas));
    return this.http.get<ApiResponse<Reserva[]>>(`${this.apiUrl}/admin/reservas/por-verificar`, {
      headers: this.adminHeaders(),
      params,
    });
  }
}
