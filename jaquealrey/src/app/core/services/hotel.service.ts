import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Hotel } from '../models/hotel.model';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class HotelService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = environment.apiUrl;

  getHotel(): Observable<ApiResponse<Hotel>> {
    return this.http.get<ApiResponse<Hotel>>(`${this.apiUrl}/hotel`);
  }

  updateHotel(data: Partial<Hotel>): Observable<ApiResponse<Hotel>> {
    const headers = new HttpHeaders({ 'x-access-token': this.authService.getToken() ?? '' });
    return this.http.put<ApiResponse<Hotel>>(`${this.apiUrl}/hotel`, data, { headers });
  }
}
