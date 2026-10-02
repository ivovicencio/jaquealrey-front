import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { DashboardData } from '../models/dashboard.model';
import { Reserva, ReservaAdminList } from '../models/reserva.model';
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

  updateReservaEstado(id: number, estado: string, notas?: string): Observable<ApiResponse<Reserva>> {
    return this.http.put<ApiResponse<Reserva>>(
      `${this.apiUrl}/admin/reservas/${id}/estado`,
      { estado, notas },
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
}
