export interface Permission {
  id: string;
  nombre?: string;
  estado: string;
  [key: string]: any; 
}

export interface PaginatedPermissions {
  data: Permission[];
  total: number;
}
