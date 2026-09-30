export interface Resenia {
  autor: string;
  estrellas: number;
  texto: string;
}

/**
 * Reseñas de Google Maps.
 *
 * IMPORTANTE — los textos de abajo son una BASE REDACTADA, no una copia
 * literal de las reseñas reales de Google. Antes de publicar hay que:
 *   1. abrir el perfil de Google Maps del hotel,
 *   2. copiar el texto EXACTO de cada reseña elegida (con sus errores y todo),
 *   3. reemplazar lo que está acá y borrar las reseñas que no se encuentren.
 *
 * El atributo `autor` y `estrellas` sí se tomaron de las reseñas vistas.
 * No inventar ni completar reseñas: si no se puede copiar el texto real,
 * dejar la reseña afuera.
 */
export const RESENIAS: Resenia[] = [
  {
    autor: 'Caju Rava',
    estrellas: 5,
    texto:
      'Por el precio está bárbaro, la habitación estaba impecable y la atención de Belen fue excelente. Excelente ubicación y la dueña es un amor.',
  },
  {
    autor: 'Julian Grossi',
    estrellas: 5,
    texto:
      'Excelente hotel al paso. Te dejan el desayuno en la habitación para que puedas desayunar temprano. Cuentan con garaje para el auto y están sobre la ruta.',
  },
  {
    autor: 'Enzo Cantero',
    estrellas: 5,
    texto:
      'Excelente ubicación y atención. Muy cerca de todo. El hotel cuenta con habitaciones limpias y ordenadas, con un balcón con vista a la montaña.',
  },
  {
    autor: 'Karina Cont',
    estrellas: 5,
    texto:
      'Nos alojamos con mi familia y nos trataron muy bien. El check-in fue muy rápido. La habitación era amplia, limpia y cómoda.',
  },
  {
    autor: 'Vanesa P',
    estrellas: 5,
    texto:
      'Paramos en el hotel por problemas en el auto. Iván, el dueño, muy atento y siempre dispuesto a ayudar. Las habitaciones están equipadas y limpias.',
  },
  {
    autor: 'Roxana KC',
    estrellas: 5,
    texto:
      'Un lugar ideal para descansar y conocer la zona. Muy buena ubicación, sobre la ruta y cerca de todo. Las habitaciones limpias y cómodas, y el personal muy amable.',
  },
  {
    autor: 'Martin Luquez',
    estrellas: 5,
    texto:
      'Hospedaje en excelente ubicación, a metros de la ruta. Las habitaciones están bien equipadas, limpias y cómodas. Very good people, always ready to help.',
  },
  {
    autor: 'Miranda Jara',
    estrellas: 5,
    texto:
      'Un lugar perfecto para parar a dormir cuando estás de paso por la zona. Limpio, ordenado, con buena atención y un precio más que razonable.',
  },
  {
    autor: 'Andrea Vaccari',
    estrellas: 4,
    texto:
      'Nos alojamos un fin de semana y nos encantó la experiencia. La habitación era amplia, el baño estaba impecable y todo muy limpio.',
  },
  {
    autor: 'Lucas Nieva',
    estrellas: 4,
    texto:
      'Buen lugar para pasar la noche, con todas las comodidades básicas. La habitación estaba limpia y la atención fue cordial.',
  },
];
