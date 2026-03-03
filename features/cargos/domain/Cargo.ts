export interface Cargo {
    id: string;
    nombre: string;
    estado: string;
}

// Así es como el backend nos devuelve una lista paginada
export interface PaginatedCargos {
    data: Cargo[];
    total: number;
}
