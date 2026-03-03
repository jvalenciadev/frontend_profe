export interface EvaluacionPeriodo {
  id: string;
  nombre?: string;
  estado: string;
  [key: string]: any; 
}

export interface PaginatedEvaluacionPeriodos {
  data: EvaluacionPeriodo[];
  total: number;
}
