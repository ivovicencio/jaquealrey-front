import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { AuthResponse, User } from '../models/user.model';
import { NotificationService } from './notification.service';

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
  private notificaciones = inject(NotificationService);
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
   * Es imperativo a proposito, y no un Observable que el llamador tenga que
   * suscribir. Antes devolvia el Observable y tres de los cuatro llamadores
   * (dashboard, hoy y walk-in) lo invocaban sin suscribirse: sin suscriptor no
   * hay peticion, asi que el POST nunca salia y el logout no revocaba nada. Un
   * metodo que se puede llamar "en serio" sin hacer nada es una trampa; este se
   * suscribe solo y por eso no puede quedar colgado.
   *
   * El socket se cierra antes de borrar el token: si se tirara despues, el
   * backend cortaria la conexion por su cuenta, pero al revés la pestana puede
   * seguir recibiendo eventos en los milisegundos entre la respuesta y el
   * borrado.
   */
  logout(): void {
    this.notificaciones.disconnect();
    this.clearSession();

    this.http.post(`${this.apiUrl}/auth/logout`, {}).subscribe({
      next: () => undefined,
      // Si el POST falla, la sesion local ya esta limpia. Un logout que no
      // borra el token porque la red cayo seria peor que un token sin revocar.
      error: () => undefined,
    });
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
