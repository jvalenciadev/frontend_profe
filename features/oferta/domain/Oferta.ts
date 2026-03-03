export interface Oferta {
  id: string;
  nombre?: string;
  estado: string;
  [key: string]: any; 
}

export interface PaginatedOfertas {
  data: Oferta[];
  total: number;
}
