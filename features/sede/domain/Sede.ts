export interface Sede {
  id: string;
  nombre?: string;
  estado: string;
  [key: string]: any; 
}

export interface PaginatedSedes {
  data: Sede[];
  total: number;
}
