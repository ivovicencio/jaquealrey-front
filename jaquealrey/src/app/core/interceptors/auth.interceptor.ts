import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();
  // Solo se adjunta a nuestra API. Un token en un pedido a un tercero
  // (fuentes, iconos, etc.) lo filtra.
  const esApi = req.url.startsWith('/api') || req.url.includes('/api/');
  if (token && esApi) {
    req = req.clone({ setHeaders: { 'x-access-token': token } });
  }
  return next(req);
};
