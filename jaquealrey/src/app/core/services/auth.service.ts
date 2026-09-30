import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { AuthResponse, User } from '../models/user.model';

const TOKEN_KEY = 'jar_token';
const USER_KEY = 'jar_user';

interface JwtPayload {
  id: number;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  login(email: string, password: string): Observable<ApiResponse<AuthResponse>> {
    return this.http
      .post<ApiResponse<AuthResponse>>(`${this.apiUrl}/auth/login`, { email, password })
      .pipe(tap((res) => this.storeAuth(res.data)));
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  getUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;
    const payload = this.decodeToken(token);
    if (!payload) return false;
    return payload.exp * 1000 > Date.now();
  }

  isAdmin(): boolean {
    const token = this.getToken();
    if (!token) return false;
    const payload = this.decodeToken(token);
    return payload?.role === 'admin';
  }

  /**
   * Cierra la sesion en el servidor y despues borra el token local.
   *
   * Sin el POST, "salir" era solo limpiar este navegador: el token seguido
   * sirviendo en el back hasta vencer, asi que una copia del localStorage
   * seguía entrando al panel. El backend mueve la marca de revocacion, con lo
   * cual quedan invalidados el token actual y todos los anteriores.
   *
   * El borrado local va en tap, no en finalize: tap corre antes de que el
   * suscriptor reciba el valor, asi que cuando la UI naveja ya no queda token.
   * El interceptor ya manda el header, no hace falta armarlo a mano.
   */
  logout(): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/auth/logout`, {}).pipe(
      map(() => null),
      catchError(() => of(null)),
      tap(() => this.clearSession())
    );
  }

  private clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  private storeAuth(data: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  }

  private decodeToken(token: string): JwtPayload | null {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload)) as JwtPayload;
    } catch {
      return null;
    }
  }
}
