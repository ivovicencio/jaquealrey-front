import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Habitacion } from '../models/habitacion.model';

@Injectable({ providedIn: 'root' })
export class HabitacionService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getHabitaciones(filters?: {
    tipo?: string;
    capacidad_min?: number;
    precio_max?: number;
    disponible_desde?: string;
    disponible_hasta?: string;
  }): Observable<ApiResponse<Habitacion[]>> {
    let params = new HttpParams();
    if (filters) {
      if (filters.tipo) params = params.set('tipo', filters.tipo);
      if (filters.capacidad_min != null) params = params.set('capacidad_min', String(filters.capacidad_min));
      if (filters.precio_max != null) params = params.set('precio_max', String(filters.precio_max));
      if (filters.disponible_desde) params = params.set('disponible_desde', filters.disponible_desde);
      if (filters.disponible_hasta) params = params.set('disponible_hasta', filters.disponible_hasta);
    }
    return this.http.get<ApiResponse<Habitacion[]>>(`${this.apiUrl}/habitaciones`, { params });
  }

  getHabitacion(id: number): Observable<ApiResponse<Habitacion>> {
    return this.http.get<ApiResponse<Habitacion>>(`${this.apiUrl}/habitaciones/${id}`);
  }

  getDisponibles(desde: string, hasta: string): Observable<ApiResponse<Habitacion[]>> {
    const params = new HttpParams().set('desde', desde).set('hasta', hasta);
    return this.http.get<ApiResponse<Habitacion[]>>(`${this.apiUrl}/habitaciones/disponibles`, { params });
  }
}
