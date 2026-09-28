import { Reserva } from './reserva.model';

export interface Cliente {
  id: number;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  created_at: string;
}

export interface ClienteConReservas extends Cliente {
  reservas: Reserva[];
}

export interface ClientesPaginado {
  clientes: Cliente[];
  total: number;
  pagina: number;
  total_paginas: number;
}
