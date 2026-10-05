// Respuesta de GET /api/pagos/ingresos.
//
// Facturado y cobrado son totales por fechas contables diferentes.
export interface IngresosData {
  facturado_total: number;
  cobrado_total: number;
  pendiente_confirmar: number;
  por_mes_facturado: IngresosMes[];
  por_mes_cobrado: IngresosMes[];
  pagos_incompletos: ReservaPagoIncompleto[];
}

export interface IngresosMes {
  mes: string; // 'YYYY-MM'
  reservas?: number;
  cantidad?: number;
  total: number;
}

export interface ReservaPagoIncompleto {
  id: number;
  codigo: string;
  precio_total: number;
  pagado: number;
  pago_completo: boolean;
  fecha_entrada: string;
  fecha_salida: string;
}

export interface Pago {
  id: number;
  reserva_id: number;
  monto: number;
  metodo: string;
  estado: string;
  referencia: string | null;
  fecha_pago: string | null;
  notas: string | null;
  created_at: string;
  reserva_codigo?: string;
  fecha_entrada?: string;
  fecha_salida?: string;
  habitacion_numero?: number;
  cliente_nombre?: string;
  cliente_apellido?: string;
}

export interface PagosPaginated {
  pagos: Pago[];
  total: number;
  pagina: number;
  total_paginas: number;
}

export interface PagosReserva {
  pagos: Pago[];
  total_reserva: number;
  total_pagado: number;
}

// Configuracion de cobro. La pantalla publica usa el alias y muestra el total;
// el porcentaje de anticipo se conserva para la regla interna hasta confirmarlo.
export interface ConfigCobro {
  alias_bancario: string;
  titular_cuenta: string;
  banco_nombre: string;
  moneda: string;
  anticipo_porcentaje: string;
}

// ------------------------------------------------------------------
// Calendario de ocupacion
// ------------------------------------------------------------------

// Una reserva tal como llega en el mapa de ocupacion. fecha_entrada y
// fecha_salida YA vienen recortadas por el backend y en formato ISO, asi que
// acá no hay que volver a normalizar nada.
export interface OcupacionReserva {
  id: number;
  codigo: string;
  fecha_entrada: string;
  fecha_salida: string;
  estado: string;
  huespedes: number;
  precio_total: number;
  pagado: number;
  cliente: string;
  telefono: string;
}

export interface OcupacionHabitacion {
  id: number;
  numero: number;
  nombre: string;
  tipo: string;
  precio_noche: number;
  capacidad_max: number;
  reservas: OcupacionReserva[];
}

export interface OcupacionData {
  desde: string;
  hasta: string;
  dias: number;
  habitaciones: OcupacionHabitacion[];
  resumen: {
    noches_ocupadas: number;
    noches_posibles: number;
    ocupacion_pct: number;
    reservas_en_rango: number;
  };
}