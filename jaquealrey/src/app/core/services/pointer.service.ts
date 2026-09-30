import { DestroyRef, Injectable, inject, signal } from '@angular/core';

/**
 * Como maneja el dispositivo el puntero y las animaciones.
 *
 * El FlowingMenu se revela con hover, y el celu no tiene hover: en un iPhone
 * `(hover: hover)` da false. Sin esto, en el celu el menu abria pero el reveal
 * no se veia nunca y solo quedaban cuatro textos pelados.
 */
@Injectable({ providedIn: 'root' })
export class PointerService {
  private readonly motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  /** true con mouse/trackpad. false en celu y tablet. */
  readonly canHover = signal(window.matchMedia('(hover: hover) and (pointer: fine)').matches);

  /** El usuario pidio menos movimiento: no hay reveal, pero la foto se ve. */
  readonly reduceMotion = signal(this.motionQuery.matches);

  constructor() {
    const hover = window.matchMedia('(hover: hover) and (pointer: fine)');
    const sync = () => this.canHover.set(hover.matches);
    const syncMotion = () => this.reduceMotion.set(this.motionQuery.matches);

    // Un laptop con touchscreen pasa a false/true segun mouse conectado.
    hover.addEventListener('change', sync);
    this.motionQuery.addEventListener('change', syncMotion);

    inject(DestroyRef).onDestroy(() => {
      hover.removeEventListener('change', sync);
      this.motionQuery.removeEventListener('change', syncMotion);
    });
  }
}
