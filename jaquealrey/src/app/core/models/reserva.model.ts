export interface Reserva {
  id: number;
  codigo: string;
  cliente_id: number;
  habitacion_id: number;
  fecha_entrada: string;
  fecha_salida: string;
  huespedes: number;
  precio_total: number;
  estado: 'Pendiente' | 'Confirmada' | 'Cancelada' | 'Completada';
  notas: string;
  created_at: string;
  updated_at: string;
  habitacion_numero?: number;
  habitacion_nombre?: string;
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
