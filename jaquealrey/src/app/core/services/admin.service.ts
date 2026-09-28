import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { DashboardData } from '../models/dashboard.model';
import { Reserva, ReservaAdminList } from '../models/reserva.model';
import { Habitacion } from '../models/habitacion.model';
import { HistorialPaginado } from '../models/historial.model';
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
}
