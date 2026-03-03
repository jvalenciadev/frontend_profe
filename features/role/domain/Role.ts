export interface Role {
  id: string;
  nombre?: string;
  estado: string;
  [key: string]: any; 
}

export interface PaginatedRoles {
  data: Role[];
  total: number;
}
