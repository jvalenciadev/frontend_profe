export interface Programa {
  id: string;
  nombre?: string;
  estado: string;
  [key: string]: any; 
}

export interface PaginatedProgramas {
  data: Programa[];
  total: number;
}
