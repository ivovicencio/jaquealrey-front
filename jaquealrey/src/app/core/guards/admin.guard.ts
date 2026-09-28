import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  if (token && authService.isLoggedIn() && authService.isAdmin()) {
    inject(NotificationService).joinAdmin(token);
    return true;
  }
  // Va a /login, no a la home: en el sitio publico ya no hay ningun enlace
  // al panel, asi que mandar a / deja al usuario sin forma de entrar.
  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};
