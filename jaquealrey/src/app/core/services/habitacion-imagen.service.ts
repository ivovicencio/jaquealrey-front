import { Injectable } from '@angular/core';
import { Habitacion } from '../models/habitacion.model';

/**
 * Imagen de cada habitacion.
 *
 * Antes esto estaba duplicado en cinco componentes (home, list, detail,
 * buscar y reserva-form), cada uno con su propio array de gradientes y su
 * gradientFor(). Cinco copias que se desincronizan solas: cambiar un color en
 * una no lo cambiaba en las otras. Ademas, con las fotos ya en public/assets,
 * los gradientes quedaban de paso.
 *
 * El gradiente se queda de fondo de las fotos como respaldo si una imagen no
 * carga. Las habitaciones sin foto asignada no reutilizan la imagen de otra:
 * muestran un fondo neutro y conservan visible su número.
 */
@Injectable({ providedIn: 'root' })
export class HabitacionImagenService {
  /** Fotos confirmadas, indexadas por el número de habitación. */
  private readonly imagenes: Record<number, string> = {
    1: '/assets/habitacion1.jpeg',
    2: '/assets/habitacion2.jpeg',
    3: '/assets/habitacion3.jpeg',
    4: '/assets/habitacion4.jpeg',
    5: '/assets/habitacion5.jpeg',
  };

  private readonly degradados = [
    'linear-gradient(135deg, #2e241c 0%, #4a3b30 100%)',
    'linear-gradient(135deg, #3d322b 0%, #6b5442 100%)',
    'linear-gradient(135deg, var(--dark) 0%, var(--dark-2) 100%)',
    'linear-gradient(135deg, var(--gold-dark) 0%, var(--gold) 100%)',
    'linear-gradient(135deg, #4a3b30 0%, #8a6a4f 100%)',
  ];

  /**
   * Devuelve solo una foto asignada explícitamente a ese número de habitación.
   */
  imagenPara(h: Habitacion | null | undefined): string {
    return h ? (this.imagenes[Math.abs(h.numero)] || '') : '';
  }

  tieneImagen(h: Habitacion | null | undefined): boolean {
    return this.imagenPara(h) !== '';
  }

  /** Foto con gradiente de respaldo, o fondo neutro cuando no hay foto. */
  fondoPara(h: Habitacion | null | undefined): string {
    const i = h ? Math.abs(h.numero) - 1 : 0;
    const degradado = this.degradados[i % this.degradados.length];
    const imagen = this.imagenPara(h);
    return imagen ? `url('${imagen}') center / cover no-repeat, ${degradado}` : 'var(--warm)';
  }
}
