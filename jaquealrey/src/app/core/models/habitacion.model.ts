export interface Habitacion {
  id: number;
  numero: number;
  nombre: string;
  descripcion: string;
  camas_individuales: number;
  camas_matrimoniales: number;
  capacidad_max: number;
  tipo: 'Doble' | 'Triple' | 'Cuádruple';
  precio_noche: number;
  activa: boolean;
  created_at: string;
}
