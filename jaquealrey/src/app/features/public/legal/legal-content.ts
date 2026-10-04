export interface LegalSection {
  titulo: string;
  cuerpo: string[];
}

export interface LegalDoc {
  titulo: string;
  actualizado: string;
  intro: string;
  secciones: LegalSection[];
}

export const TERMINOS_VERSION = '1.0.0';

/** Datos publicos que se pueden corroborar. Sin email ni redes inventadas. */
export const DATOS_RESPONSABLE = {
  nombre: 'Hotel Jaque al Rey',
  domicilio: 'Julio Argentino Roca, Piedra del Aguila, Neuquen',
  telefono: '02942 664-320',
  telefonoHref: 'tel:+5492942664320',
  whatsappHref: 'https://wa.me/5492942664320',
};

export const DOCUMENTOS: Record<string, LegalDoc> = {
  privacidad: {
    titulo: 'Politica de Privacidad',
    actualizado: 'Ultima actualizacion: octubre de 2026',
    intro:
      'Explica que datos pedimos para una reserva en ' +
      DATOS_RESPONSABLE.nombre +
      ' y para que los usamos. El tratamiento se rige por la Ley 25.326 de Proteccion de Datos Personales.',
    secciones: [
      {
        titulo: '1. Responsable',
        cuerpo: [
          `${DATOS_RESPONSABLE.nombre}, ${DATOS_RESPONSABLE.domicilio}. Telefono ${DATOS_RESPONSABLE.telefono}.`,
          'Para consultas sobre tus datos, llama a ese numero.',
        ],
      },
      {
        titulo: '2. Datos que pedimos',
        cuerpo: [
          'Solo los necesarios para gestionar la reserva: nombre, apellido, correo, telefono, fechas, cantidad de huespedes, habitacion y, si queres, un comentario.',
          'No pedimos documento ni datos de tarjeta por este sitio.',
        ],
      },
      {
        titulo: '3. Uso',
        cuerpo: [
          'Usamos esos datos para reservar, confirmar, consultar o cancelar tu estadia y para contactarte por ese motivo.',
          'No los vendemos ni los usamos para publicidad.',
        ],
      },
      {
        titulo: '4. Conservacion y acceso',
        cuerpo: [
          'Los guardamos mientras dure la reserva y el plazo legal aplicable al hotel.',
          'Pueden verlos el personal del hotel y, si corresponde, una autoridad con orden valida.',
        ],
      },
      {
        titulo: '5. Tus derechos',
        cuerpo: [
          'Podes pedir acceso, correccion o baja de tus datos llamando al hotel.',
          'Si no te responden, podes reclamar ante la Agencia de Acceso a la Informacion Publica (Ley 25.326).',
        ],
      },
    ],
  },

  terminos: {
    titulo: 'Terminos y Condiciones',
    actualizado: 'Ultima actualizacion: octubre de 2026',
    intro:
      'Reglas simples para reservar en ' +
      DATOS_RESPONSABLE.nombre +
      '. Al enviar el formulario las aceptas.',
    secciones: [
      {
        titulo: '1. Reserva',
        cuerpo: [
          'Podes reservar siendo mayor de 18 anos. Recibis un codigo (JAR-XXXXXX). Con ese codigo y tu correo podes consultar o cancelar, sin crear cuenta.',
          'La reserva queda pendiente hasta que el hotel la confirma.',
        ],
      },
      {
        titulo: '2. Precios y pago',
        cuerpo: [
          'Los precios son por habitacion y por noche, en pesos argentinos, segun lo publicado al reservar.',
          'El hotel cobra por transferencia (alias) o en efectivo. Nunca te vamos a pedir el numero de una tarjeta ni claves por mensaje.',
        ],
      },
      {
        titulo: '3. Cancelacion',
        cuerpo: [
          'Podes cancelar desde Consultar mi Reserva hasta 24 horas antes de la fecha de entrada. Para cancelaciones con menos anticipacion, comunicate con el hotel. Consulta Reembolsos y Cancelaciones para mas informacion.',
        ],
      },
      {
        titulo: '4. Estadía',
        cuerpo: [
          'Capacidad maxima y tarifas adicionales, si las hay, figuran en cada habitacion o se informan al consultar.',
          'El huesped responde por danos que cause y debe respetar las normas de convivencia del hotel.',
        ],
      },
      {
        titulo: '5. Ley',
        cuerpo: [
          'Estos terminos se rigen por la legislacion argentina. Defensa del Consumidor: Ley 24.240.',
        ],
      },
    ],
  },

  cookies: {
    titulo: 'Politica de Cookies',
    actualizado: 'Ultima actualizacion: octubre de 2026',
    intro: 'Este sitio no usa cookies de publicidad ni de seguimiento.',
    secciones: [
      {
        titulo: '1. Que usamos',
        cuerpo: [
          'No instalamos cookies publicitarias ni herramientas de medicion (Analytics, pixels, etc.).',
          'El panel del hotel guarda el inicio de sesion en el almacenamiento local del navegador. Se borra al cerrar sesion o al limpiar los datos del sitio.',
        ],
      },
      {
        titulo: '2. Tipografias e iconos',
        cuerpo: [
          'La pagina carga tipografias e iconos desde servidores externos. Eso puede registrar tu visita en esos servicios. No es publicidad nuestra.',
        ],
      },
    ],
  },

  reembolsos: {
    titulo: 'Reembolsos y Cancelaciones',
    actualizado: 'Ultima actualizacion: octubre de 2026',
    intro:
      'Politica de cancelacion de ' +
      DATOS_RESPONSABLE.nombre +
      '. Vale para las reservas hechas por este sitio.',
    secciones: [
      {
        titulo: '1. Cancelacion hasta 24 horas antes',
        cuerpo: [
          'Podes cancelar desde Consultar mi Reserva hasta 24 horas antes de la fecha de entrada, con el codigo y el correo de la reserva.',
          'La cancelacion queda registrada en el momento.',
        ],
      },
      {
        titulo: '2. Si no te presentas',
        cuerpo: [
          'Si no llegas y no avisaste, la habitacion puede liberarse y no hay reembolso automatico.',
        ],
      },
      {
        titulo: '3. Si cancela el hotel',
        cuerpo: [
          'Si cancelamos nosotros, te avisamos y se devuelve lo que hayas pagado por esa reserva.',
        ],
      },
      {
        titulo: '4. Devoluciones',
        cuerpo: [
          'Si corresponde un reembolso, se hace por el mismo medio de pago (transferencia o efectivo), en los plazos que permita ese medio.',
        ],
      },
    ],
  },
};
