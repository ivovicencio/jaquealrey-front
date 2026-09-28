export interface ApiResponse<T> {
  status: '1' | '0';
  msg: string;
  data: T;
}

export interface PaginatedData<T> {
  total: number;
  pagina: number;
  total_paginas: number;
  [key: string]: T[] | number;
}
