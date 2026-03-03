export interface Inscripcion {
  id: string;
  nombre?: string;
  estado: string;
  [key: string]: any; 
}

export interface PaginatedInscripcions {
  data: Inscripcion[];
  total: number;
}
