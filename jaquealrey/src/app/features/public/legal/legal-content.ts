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

// Datos del responsable.
export const DATOS_RESPONSABLE = {
  nombre: 'Hotel Jaque al Rey',
  domicilio: 'Julio Argentino Roca s/n, Piedra del Aguila, Provincia de Neuquen',
  telefono: '02942664320',
  email: 'info@jaquealrey.com',
};

export const DOCUMENTOS: Record<string, LegalDoc> = {
  privacidad: {
    titulo: 'Politica de Privacidad',
    actualizado: 'Ultima actualizacion: septiembre de 2026',
    intro:
      'Esta politica explica que datos personales recopilamos cuando usas este sitio, para que se los tratamento segun la Ley 25.326 de Proteccion de Datos Personales de la Republica Argentina.',
    secciones: [
      {
        titulo: '1. Quien es el responsable',
        cuerpo: [
          `El responsable del tratamiento es ${DATOS_RESPONSABLE.nombre}, con domicilio en ${DATOS_RESPONSABLE.domicilio}, telefono ${DATOS_RESPONSABLE.telefono} y correo electronico ${DATOS_RESPONSABLE.email}.`,
          'Ante cualquier consulta sobre esta politica podes escribir a ese correo o llamar al telefono indicado.',
        ],
      },
      {
        titulo: '2. Que datos recopilamos',
        cuerpo: [
          'Solo pedimos los datos indispensables para gestionar tu reserva:',
          'Nombre y apellido: para identificar la reserva.',
          'Correo electronico: para que puedas consultar o cancelar tu reserva con el código.',
          'Telefono: para coordinar el ingreso a la habitacion y para avisarte por WhatsApp cuando el hotel confirme tu reserva.',
          'Fechas de entrada y salida, cantidad de huespedes y habitacion elegida: para reservar.',
          'Observaciones: un campo opcional que solo usas si queres dejar alguna peticion especial.',
          'No pedimos documentos de identidad, numero de tarjeta, fecha de nacimiento ni datos de salud. Si alguna vez te solicitamos algo de eso, no es nuestro hotel y podes denunciarlo.',
        ],
      },
      {
        titulo: '3. Para que los usamos y con que base legal',
        cuerpo: [
          'Usamos tus datos unicamente para reservar, confirmar, modificar o cancelar tu estadia y para contactarte por ese motivo.',
          'La base legal es tu consentimiento inequivoco al marcar la casilla de aceptacion antes de reservar, conforme al articulo 5 de la Ley 25.326, y la ejecucion de la relacion hotelera acordada.',
          'No usamos tus datos para perfiles, publicidad, venta a terceros ni decisiones automatizadas.',
        ],
      },
      {
        titulo: '4. Durante cuanto tiempo los conservamos',
        cuerpo: [
          'Guardamos los datos de la reserva mientras dure la relacion hotelera y por el plazo legal aplicable al registro de documentacion de los establecimientos hoteleros, y despues se eliminan o anonimizan.',
          'Si solo consultaste una reserva y no reservaste, no guardamos registro permanente de esa consulta.',
        ],
      },
      {
        titulo: '5. A quien los revelamos',
        cuerpo: [
          'No vendemos ni alquilamos tus datos. No cedemos tus datos a terceros con fines comerciales.',
          'Solo podrian acceder al equipo del hotel y, en caso de ser necesario por una orden judicial o un reclamo legitimo, a las autoridades competente.',
          'El sitio carga tipografias e iconos desde servidores externos de Google y cdnjs, que pueden ver tu direccion IP al cargar la pagina. No es posible evitarlo mientras el sitio no aloje esos archivos en nuestro propio servidor.',
        ],
      },
      {
        titulo: '6. Seguridad',
        cuerpo: [
          'La informacion viaja cifrada por HTTPS. El acceso a los datos esta restringido al personal del hotel que lo necesita y las contrasenas se guardan cifradas.',
          'Nadie que use este sitio puede ver las reservas de otros huespedes sin conocer el codigo y el correo con el que se hizo la reserva.',
        ],
      },
      {
        titulo: '7. Tus derechos',
        cuerpo: [
          'Podes pedir acceder a tus datos, rectificarlos si son incorrectos, actualizarlos, suprimirlos u oponerte a su tratamiento, en forma gratuita, escribiendo a ' + DATOS_RESPONSABLE.email + '.',
          'Tambien podes revocar tu consentimiento en cualquier momento, sin que esto afecte la licitud del tratamiento previo.',
          'Si consideras que no fue tratada tu solicitud, podes presentar un reclamo ante la Agencia de Acceso a la Informacion Publica, autoridad de control de la Ley 25.326.',
        ],
      },
      {
        titulo: '8. Cambios en esta politica',
        cuerpo: [
          'Si cambiamos esta politica, actualizaremos la fecha del inicio y te lo informaremos mediante un aviso visible en el sitio.',
        ],
      },
    ],
  },

  terminos: {
    titulo: 'Terminos y Condiciones',
    actualizado: 'Ultima actualizacion: septiembre de 2026',
    intro:
      'Estos terminos regulan el uso de este sitio y la reserva de habitaciones en ' + DATOS_RESPONSABLE.nombre + '. Al completar una reserva aceptas lo que se escribe aqui.',
    secciones: [
      {
        titulo: '1. Quien puede reservar',
        cuerpo: [
          'Cualquier persona mayor de 18 anos puede reservar. Si la reserva es para menores, debe realizarla y firmarla una persona mayor de edad a nombre del menor.',
        ],
      },
      {
        titulo: '2. Como se hace una reserva',
        cuerpo: [
          'Completas el formulario con tus datos y las fechas, y el sitio te devuelve un codigo con el formato JAR-XXXXXX. Ese codigo es tu comprobante.',
          'No necesitás crear una cuenta ni registrarte. Para consultar o cancelar despues usas ese codigo junto con el correo electronico con el que reservaste.',
          'La reserva queda registrada en estado Pendiente hasta que el hotel la confirma. Cuando eso ocurre te mandamos un WhatsApp al teléfono que dejaste, con el código, la habitación y las fechas.',
        ],
      },
      {
        titulo: '3. Precios y forma de pago',
        cuerpo: [
          'Los precios publicados son por habitacion y por noche, en pesos argentinos, e incluyen los servicios indicados en la pagina de la habitacion.',
          'Los adicionales que no figuren publicados, como el desayuno, se cobran al momento del ingreso.',
          'El hotel cobra por transferencia bancaria (alias) o en efectivo al momento del ingreso o de la salida. No aceptamos tarjeta y nunca te vamos a pedir el numero de tarjeta ni la clave de la misma por correo, mensaje o telefono.',
          'Cuando registras un pago por alias, el hotel lo verifica y te confirmamos por WhatsApp. Recien ahi la reserva queda cubierta.',
          'Los precios pueden variar. La tarifa que te aplica es la que estaba publicada en el momento en que confirmaste la reserva.',
        ],
      },
      {
        titulo: '4. Ingreso, salida y estadia minima',
        cuerpo: [
          'El ingreso se realiza a partir de las 14:00 horas y la salida antes de las 10:00 horas, salvo que acordemos otra cosa por escrito.',
          'La estadia minima y la cantidad maxima de huespedes por habitacion se indican en cada ficha de habitacion.',
          'El horario de salida puede extenderse segun disponibilidad del dia y se cobra una tarifa adicional que se informa antes de aceptarla.',
        ],
      },
      {
        titulo: '5. Cancelacion y reembolsos',
        cuerpo: [
          'La politica concreta de cancelacion y reembolso esta detallada en la pagina de Reembolsos y Cancelaciones.',
          'En resumen: podés cancelar sin costo hasta 24 horas antes de la fecha de entrada. Pasadas las 24 horas, la cancelacion debe gestionarse por telefono y queda sujeta a evaluacion.',
        ],
      },
      {
        titulo: '6. Conducta del huesped',
        cuerpo: [
          'El huesped se compromete a respetar las reglas de convivencia, a no fumar en las habitaciones, a no utilizar el WIFI para actividades ilicitas y a responder por los danos que cause.',
          'El hotel puede cancelar la estadia sin reembolso si el huesped causa falta de respeto a otros huespedes o al personal.',
        ],
      },
      {
        titulo: '7. Responsabilidad',
        cuerpo: [
          'El hotel responde por la prestacion del servicio contratado y por la seguridad de las instalaciones.',
          'No responde por danos derivados de caso fortuito o fuerza mayor, ni por la perdida de objetos personales. Se recomienda no dejar objetos de valor en la habitacion.',
        ],
      },
      {
        titulo: '8. Ley aplicable',
        cuerpo: [
          'Estos terminos se rigen por la legislacion de la Republica Argentina. Cualquier controversia se somete a los tribunales ordinarios del lugar donde se encuentra el hotel.',
          'El hotel adhiere a la Ley 24.241 de Defensa del Consumidor, por lo que podes presentar tu reclamo ante la autoridad competente si consideras que no fuiste atendido como corresponde.',
        ],
      },
    ],
  },

  cookies: {
    titulo: 'Politica de Cookies',
    actualizado: 'Ultima actualizacion: septiembre de 2026',
    intro:
      'Esta politica explica que tecnologias de rastreo usa este sitio. La respuesta corta: no usamos cookies publicitarias ni de seguimiento.',
    secciones: [
      {
        titulo: '1. Que son las cookies y las tecnologias similares',
        cuerpo: [
          'Son pequenos archivos que el navegador guarda en tu dispositivo para recordar informacion sobre tu visita. Bajo el mismo criterio informamos tambien sobre el almacenamiento local del navegador.',
        ],
      },
      {
        titulo: '2. Cookies que usamos: ninguna',
        cuerpo: [
          'Este sitio no instala cookies. No hay cookies publicitarias, de seguimiento, de perfiles de comportamiento ni de terceros que te sigan entre sitios.',
          'Por lo tanto no tenes que aceptar ni rechazar banners de cookies, y no desplegamos aviso de consentimiento por cookies.',
        ],
      },
      {
        titulo: '3. Almacenamiento local que si usamos',
        cuerpo: [
          'El panel interno del hotel guarda el token de inicio de sesion en el almacenamiento local del navegador. Ese dato se usa unicamente para saber quien sos y se elimina al cerrar sesion.',
          'Este dato no se comparte con terceros, no se utiliza para publicidad y no permite identificarte fuera de este sitio.',
          'El sitio tambien guarda la preferencia de que abriste el menu en dispositivos moviles. Es funcional y no te identifica.',
          'Como no usamos cookies, este almacenamiento local es estrictamente necesario para que el panel funcione y no se activa de forma opcional.',
        ],
      },
      {
        titulo: '4. Herramientas de terceros',
        cuerpo: [
          'No cargamos Google Analytics, ni Meta Pixel, ni Hotjar, ni ninguna otra herramienta de medicion o publicidad. No hay rastreo publicitario de tu navegacion en este sitio.',
          'Si en el futuro se incorpora alguna, esta politica se actualizara y se mostrara un aviso de consentimiento previo.',
        ],
      },
      {
        titulo: '5. Como borrar el almacenamiento local',
        cuerpo: [
          'Puedes borrar los datos del sitio desde los ajustes de tu navegador, en la seccion de datos de sitios o almacenamiento. Esto cierra la sesion del panel interno.',
        ],
      },
    ],
  },

  reembolsos: {
    titulo: 'Reembolsos y Cancelaciones',
    actualizado: 'Ultima actualizacion: septiembre de 2026',
    intro:
      'Esta es la politica de cancelacion y reembolso de ' + DATOS_RESPONSABLE.nombre + '. Leela antes de reservar: es la unica version que se aplica a todas las reservas.',
    secciones: [
      {
        titulo: '1. Cancelacion online sin cargo',
        cuerpo: [
          'Podés cancelar tu reserva sin costo hasta 24 horas antes de la fecha de entrada, desde la pagina Consultar mi Reserva, usando el codigo y el correo con el que reservaste.',
          'La cancelacion se refleja en el momento y recibes la confirmacion en pantalla.',
        ],
      },
      {
        titulo: '2. Cancelacion dentro de las 24 horas previas',
        cuerpo: [
          'Pasadas las 24 horas antes de la fecha de entrada, la cancelacion ya no puede hacerse online y debe gestionarse por telefono al ' + DATOS_RESPONSABLE.telefono + '.',
          'En ese caso el hotel evalua cada caso segun las circunstancias: motivo de la cancelacion, temporada alta o baja, anticipacion de la reserva y disponibilidad para reubicar la fecha. La decision es siempre del hotel y se te informa antes de cobrar nada.',
          'Si la reserva ya fue abonada, la evaluacion puede incluir el reembolso total, parcial o la perdida del importe, segon corresponda.',
        ],
      },
      {
        titulo: '3. No-show y llegada sin aviso',
        cuerpo: [
          'Si no te presentas a la hora de entrada y no avisaste, se registra la falta de presentacion y la habitacion queda liberada. En ese caso no hay reembolso.',
          'Si avisaste con anticipacion y acordaste una llegada mas tarde, se respeta lo acordado.',
        ],
      },
      {
        titulo: '4. Cambios de fechas',
        cuerpo: [
          'Los cambios de fecha se tratan como una cancelacion y una nueva reserva. Depende de la disponibilidad y de la tarifa vigente en la nueva fecha.',
          'El cambio no tiene costo si se hace con mas de 24 horas de anticipacion y hay disponibilidad equivalente.',
        ],
      },
      {
        titulo: '5. Cancelacion por parte del hotel',
        cuerpo: [
          'Si el hotel cancela tu reserva, no tenes por que pagar nada y se te ofrece una alternativa o el reembolso total de lo abonado, segun elijas.',
          'Este hotel no cobra penalizacion por cancelacion del huésped dentro del plazo del punto 1, y no cobra por cancelacion del hotel.',
        ],
      },
      {
        titulo: '6. Plazos de los reembolsos',
        cuerpo: [
          'Los reembolsos se efectuan con el mismo metodo de pago con el que abonaste.',
          'El plazo depende de la entidad: hasta 10 dias habiles en tarjeta y hasta 5 dias habiles en transferencia, contados desde la aprobacion por el hotel.',
          'El hotel no retiene ni cobra comisiones por el reembolso.',
          'Como solo aceptamos alias o efectivo, el reembolso se hace por transferencia a la misma cuenta de la que recibiste el pago.',
        ],
      },
      {
        titulo: '7. Facturacion y consumos',
        cuerpo: [
          'El consumo del minibar, room service y otros adicionales se cobra al momento del ingreso y no es reembolsable una vez prestado el servicio.',
        ],
      },
    ],
  },
};
