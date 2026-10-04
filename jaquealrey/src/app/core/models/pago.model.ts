// Respuesta de GET /api/pagos/ingresos.
//
// facturado y cobrado son preguntas distintas. Facturado es lo que las reservas
// confirmadas de este mes van a valer; cobrado es la plata que efectivamente
// entro. Casi nunca dan igual, y la diferencia es justamente lo que hay que ir a
// buscar: anticipos de reservas de meses futuros, o reservas de este mes que
// todavia no se pagaron.
export interface IngresosData {
  facturado_total: number;
  cobrado_total: number;
  a_cobrar_total: number;
  pendiente_confirmar: number;
  por_mes_facturado: IngresosMes[];
  por_mes_cobrado: IngresosMes[];
  saldo_por_reserva: SaldoReserva[];
}

export interface IngresosMes {
  mes: string; // 'YYYY-MM'
  reservas?: number;
  cantidad?: number;
  total: number;
}

export interface SaldoReserva {
  // Sin este id el formulario de cobro del panel mandaba `reserva_id: undefined`,
  // JSON.stringify lo omitía y el backend contestaba 400 siempre. Es el flujo
  // "Reservas con saldo", o sea el que se usa para cobrar.
  id: number;
  codigo: string;
  precio_total: number;
  pagado: number;
  saldo: number;
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
  saldo: number;
}

// Datos de cobro que ve el huesped (alias, banco, titular, anticipo).
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
  saldo: number;
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