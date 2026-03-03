export interface Distrito {
  id: string;
  nombre?: string;
  estado: string;
  [key: string]: any; 
}

export interface PaginatedDistritos {
  data: Distrito[];
  total: number;
}
