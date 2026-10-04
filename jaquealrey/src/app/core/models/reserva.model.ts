export interface Reserva {
  id: number;
  codigo: string;
  cliente_id: number;
  habitacion_id: number;
  fecha_entrada: string;
  fecha_salida: string;
  huespedes: number;
  precio_total: number;
  estado: 'Pendiente' | 'Confirmada' | 'En_Casa' | 'Cancelada' | 'Completada';
  // De donde salio la reserva. 'recepcion' es un walk-in: el huesped esta parado
  // en el mostrador. En el listado del panel y en Hoy; el endpoint publico lo
  // fuerza siempre a 'public', asi que no llega por ahi.
  origen?: 'public' | 'recepcion';
  notas: string;
  created_at: string;
  updated_at: string;
  // Los hechos del check-in, que no son lo mismo que el estado. Vienen solo en
  // Hoy: el listado del panel todavia no los trae.
  check_in_at?: string | null;
  check_out_at?: string | null;
  entregado_a?: string | null;
  habitacion_numero?: number;
  habitacion_nombre?: string;
  // Estado operativo de la habitacion, no de la reserva. Viene en Hoy.
  estado_operativo?: 'libre' | 'ocupada' | 'limpieza' | 'mantenimiento';
  tipo?: string;
  cliente_nombre?: string;
  cliente_apellido?: string;
  cliente_email?: string;
  cliente_telefono?: string;
  // Solo vienen en los endpoints de panel (/api/admin/*), no en la consulta
  // publica. Son la suma de los pagos confirmados y lo que queda por cobrar,
  // calculados en el backend para no traer la tabla de pagos entera al listado.
  pagado?: number;
  saldo?: number;
}

export interface ReservaAdminList {
  reservas: Reserva[];
  total: number;
  pagina: number;
  total_paginas: number;
}

// Consulta publica: el huesped se identifica con codigo + email, sin cuenta.
export interface ReservaConsulta extends Reserva {
  puede_cancelar: boolean;
  horas_para_cancelar: number;
}

// Pantalla "Hoy" de recepción. Es una reserva de panel mas lo que hace falta
// para cobrar en el mostrador: lo pagado y el saldo, que el backend calcula en
// el mismo SELECT para no traer la tabla de pagos entera.
export interface ReservaHoy extends Reserva {
  pagado: number;
  saldo: number;
}

export interface HoyData {
  fecha: string;
  llegadas: ReservaHoy[];
  en_casa: ReservaHoy[];
  salidas: ReservaHoy[];
  // Los walk-ins de hoy van aparte porque recepcion los atiende distinto: no
  // vinieron de la web y hay que pedirles documento. Vienen included en `llegadas`
  // tambien, asi que la pantalla tiene que filtrar por `origen` para no mostrar
  // el mismo huesped dos veces.
  walk_ins: ReservaHoy[];
}

// ---------------------------------------------------------------------------
// Recepción: estado de habitaciones y bloqueos
// ---------------------------------------------------------------------------

// Estado operativo de la habitacion. Es distinto del estado de la reserva que
// se queda adentro: una habitacion 'libre' puede tener una reserva 'Confirmada'
// para la noche, y una 'ocupada' tiene una reserva 'En_Casa'. Ojo con no
// confundirlos en la UI.
export type EstadoOperativo = 'libre' | 'ocupada' | 'limpieza' | 'mantenimiento';

export interface HabitacionEstado {
  id: number;
  numero: number;
  nombre: string;
  tipo: string;
  // `activa = false` es una habitación dada de baja del inventario, distinto de
  // estar 'mantenimiento': esa sí existe y puede volver.
  activa: boolean;
  estado_operativo: EstadoOperativo;
  precio_noche: number;
  // Cuantas reservas En_Casa tiene. Tiene que ser 0 o 1; si es >0 la habitacion
  // no puede volver a 'libre'.
  occupied_reservas: number;
  reserva_en_casa: string | null;
  // Con tilde en la clave, tal cual lo devuelve el alias de Postgres. No lo
  // "arregles" a `huesped_en_casa` sin cambiar el SQL: romperia el binding.
  'huésped_en_casa': string | null;
}

export interface Bloqueo {
  id: number;
  habitacion_id: number;
  habitacion_numero: number;
  habitacion_nombre: string;
  desde: string;
  hasta: string;
  motivo: string;
  creado_por: string | null;
  created_at: string;
  // true si el rango agarra hoy. Lo calcula el backend, no el front: comparar
  // fechas en el cliente yafalló una vez con el cruce de medianoche.
  vigente: boolean;
}
