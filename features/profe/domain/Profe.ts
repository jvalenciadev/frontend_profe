export interface Profe {
  id: string;
  nombre?: string;
  estado: string;
  [key: string]: any; 
}

export interface PaginatedProfes {
  data: Profe[];
  total: number;
}
