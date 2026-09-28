export interface HistorialReserva {
  id: number;
  reserva_id: number;
  reserva_codigo?: string;
  accion: string;
  detalle: string;
  realizada_por: string;
  ip_address: string;
  created_at: string;
}

export interface HistorialPaginado {
  historial: HistorialReserva[];
  total: number;
  pagina: number;
  total_paginas: number;
}
