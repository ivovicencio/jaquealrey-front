import { Injectable, signal } from '@angular/core';

/**
 * Detecta si la app se esta ejecutando instalada como PWA (standalone).
 *
 * Cuando es true se oculta la barra de navegacion y el pie publicos para que
 * la app de escritorio muestre unicamente el panel. En el navegador normal
 * el sitio publico se ve completo.
 */
@Injectable({ providedIn: 'root' })
export class AppModeService {
  readonly esAppEscritorio = signal(this.detectar());

  constructor() {
    // Que el sitio sea instalable hace que Chrome muestre el mini-banner
    // "Instalar" a cualquier visitante. Un huesped que solo quiere reservar
    // no necesita esa app, asi que se descarta el evento: no aparece el
    // banner y el huesped nunca ve una opcion que no le sirve.
    // El personal sigue pudiendo instalarla desde el menu del navegador
    // (... > Aplicaciones > Instalar este sitio como aplicacion).
    window.addEventListener('beforeinstallprompt', (event) => event.preventDefault());
  }

  private detectar(): boolean {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: window-controls-overlay)').matches ||
      // Safari en iPadOS reporta el modo instalado con esta propiedad
      (window.navigator as unknown as { standalone?: boolean }).standalone === true
    );
  }
}
