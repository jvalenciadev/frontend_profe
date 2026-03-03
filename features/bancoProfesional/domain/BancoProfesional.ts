export interface BancoProfesional {
  id: string;
  nombre?: string;
  estado: string;
  [key: string]: any; 
}

export interface PaginatedBancoProfesionals {
  data: BancoProfesional[];
  total: number;
}
