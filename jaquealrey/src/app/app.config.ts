import { ApplicationConfig, isDevMode, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideServiceWorker } from '@angular/service-worker';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideBrowserGlobalErrorListeners(),
    // Sin esto el router no toca el scroll y cada navegacion del panel arranca
    // donde estaba la anterior: se entra a "Hoy" o a "Walk-in" desde el final de
    // una lista larga y aparece a media pagina, con la cabecera fuera de vista.
    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'enabled',
        anchorScrolling: 'enabled',
      })
    ),
    provideHttpClient(withInterceptors([authInterceptor])),
    // La PWA de escritorio solo cachea en produccion: en desarrollo
    // el service worker sirve bundles viejos y confunde.
    // registerImmediately: si esperamos a que la app se estabilice, el icono
    // de instalar tarda 30 s en aparecer y parece que no funciona.
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerImmediately',
    }),
  ],
};
