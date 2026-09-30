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
 * El gradiente no se tira, se queda DE FONDO de la foto: si una imagen no
 * carga, se ve el gradiente y no un rectangulo vacio.
 */
@Injectable({ providedIn: 'root' })
export class HabitacionImagenService {
  /** Fotos de habitacion, en public/assets. Con slash inicial: se sirven
   *  desde la raiz y asi el bundler de Angular no las busca ni las duplica.
   *  Son 10 fotos para 10 habitaciones, una para cada una. */
  private readonly imagenes = [
    '/assets/habitacion1.jpeg',
    '/assets/habitacion2.jpeg',
    '/assets/habitacion3.jpeg',
    '/assets/habitacion4.jpeg',
    '/assets/habitacion5.jpeg',
    '/assets/habitacion7.jpeg',
    '/assets/departamento.jpeg',
    '/assets/mismodepartamento.jpeg',
    '/assets/nosequehabitaciones1.jpeg',
    '/assets/nosequehabitaciones3.jpeg',
  ];

  private readonly degradados = [
    'linear-gradient(135deg, #2e241c 0%, #4a3b30 100%)',
    'linear-gradient(135deg, #3d322b 0%, #6b5442 100%)',
    'linear-gradient(135deg, var(--dark) 0%, var(--dark-2) 100%)',
    'linear-gradient(135deg, var(--gold-dark) 0%, var(--gold) 100%)',
    'linear-gradient(135deg, #4a3b30 0%, #8a6a4f 100%)',
  ];

  /**
   * Una foto por habitacion, por numero: la 1 siempre cae en la misma foto y no
   * cambia entre recargas. El -1 es para que la habitacion 1 sea la primera de
   * la lista y no la segunda.
   */
  imagenPara(h: Habitacion | null | undefined): string {
    if (!h) return this.imagenes[0];
    const i = (Math.abs(h.numero) - 1 + this.imagenes.length * 2) % this.imagenes.length;
    return this.imagenes[i];
  }

  /** Foto + gradiente de respaldo, listo para [style.background]. */
  fondoPara(h: Habitacion | null | undefined): string {
    const i = h ? Math.abs(h.numero) - 1 : 0;
    const degradado = this.degradados[i % this.degradados.length];
    return `url('${this.imagenPara(h)}') center / cover no-repeat, ${degradado}`;
  }
}
