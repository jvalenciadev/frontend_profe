export interface Departamento {
  id: string;
  nombre?: string;
  estado: string;
  [key: string]: any; 
}

export interface PaginatedDepartamentos {
  data: Departamento[];
  total: number;
}
