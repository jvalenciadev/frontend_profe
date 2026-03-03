export interface User {
  id: string;
  nombre?: string;
  estado: string;
  [key: string]: any; 
}

export interface PaginatedUsers {
  data: User[];
  total: number;
}
