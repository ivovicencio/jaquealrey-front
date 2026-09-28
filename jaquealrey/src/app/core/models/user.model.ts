export interface User {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  created_at: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
