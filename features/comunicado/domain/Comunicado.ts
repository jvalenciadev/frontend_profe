export interface Comunicado {
  id: string;
  nombre?: string;
  estado: string;
  [key: string]: any; 
}

export interface PaginatedComunicados {
  data: Comunicado[];
  total: number;
}
