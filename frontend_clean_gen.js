const fs = require('fs');
const path = require('path');

function generateFrontendCleanModule(baseDir, moduleName, entityName, routeNameOverride) {
  const EntityC = entityName;
  const Entityl = entityName.charAt(0).toLowerCase() + entityName.slice(1);
  const srcDir = path.join(baseDir, 'features', Entityl);
  const route = routeNameOverride || `${Entityl.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()}s-clean`;

  const dirs = [
    'domain',
    'infrastructure',
    'application',
    'presentation'
  ];

  dirs.forEach(d => fs.mkdirSync(path.join(srcDir, d), { recursive: true }));

  // 1. Domain
  const domainCode = `export interface ${EntityC} {
  id: string;
  nombre?: string;
  estado: string;
  [key: string]: any; 
}

export interface Paginated${EntityC}s {
  data: ${EntityC}[];
  total: number;
}
`;
  fs.writeFileSync(path.join(srcDir, `domain/${EntityC}.ts`), domainCode);

  // 2. Infrastructure (API)
  const isSingleton = entityName === 'Profe';

  let apiCode = '';
  if (isSingleton) {
    apiCode = `import api from '@/lib/api';
import { ${EntityC} } from '../domain/${EntityC}';

export const ${EntityC}Api = {
  get: async (): Promise<${EntityC} | null> => {
    const response = await api.get<${EntityC}>('/profe-clean');
    return response.data;
  },

  create: async (data: Partial<${EntityC}>): Promise<${EntityC}> => {
    const response = await api.post<${EntityC}>('/profe-clean', data);
    return response.data;
  },

  update: async (id: string, data: Partial<${EntityC}>): Promise<${EntityC}> => {
    const response = await api.put<${EntityC}>(\`/profe-clean/\${id}\`, data);
    return response.data;
  }
};
`;
  } else {
    apiCode = `import api from '@/lib/api';
import { ${EntityC}, Paginated${EntityC}s } from '../domain/${EntityC}';

export const ${EntityC}Api = {
  getAll: async (params?: any): Promise<${EntityC}[]> => {
    const response = await api.get<Paginated${EntityC}s>('/${route}', { params });
    return Array.isArray(response.data.data) ? response.data.data : (Array.isArray(response.data) ? response.data : []); 
  },

  getById: async (id: string): Promise<${EntityC}> => {
    const response = await api.get<${EntityC}>(\`/${route}/\${id}\`);
    return response.data;
  },

  create: async (data: Partial<${EntityC}>): Promise<${EntityC}> => {
    const response = await api.post<${EntityC}>('/${route}', data);
    return response.data;
  },

  update: async (id: string, data: Partial<${EntityC}>): Promise<${EntityC}> => {
    const response = await api.put<${EntityC}>(\`/${route}/\${id}\`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(\`/${route}/\${id}\`);
  }
};
`;
  }
  fs.writeFileSync(path.join(srcDir, `infrastructure/${EntityC}Api.ts`), apiCode);

  // 3. Application (Hook)
  let hookCode = '';
  if (isSingleton) {
    hookCode = `import { useState, useCallback } from 'react';
import { ${EntityC}Api } from '../infrastructure/${EntityC}Api';
import { ${EntityC} } from '../domain/${EntityC}';
import { toast } from 'sonner';

export const use${EntityC} = () => {
  const [data, setData] = useState<${EntityC} | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const result = await ${EntityC}Api.get();
      setData(result);
    } catch (err: any) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, []);

  const save = async (formData: Partial<${EntityC}>) => {
    try {
      setLoading(true);
      if (data && data.id) {
        await ${EntityC}Api.update(data.id, formData);
      } else {
        await ${EntityC}Api.create(formData);
      }
      toast.success('Guardado correctamente');
      await load();
      return true;
    } catch (err) {
      toast.error('Error al guardar');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, load, save };
};
`;
  } else {
    hookCode = `import { useState, useCallback } from 'react';
import { ${EntityC}Api } from '../infrastructure/${EntityC}Api';
import { ${EntityC} } from '../domain/${EntityC}';
import { toast } from 'sonner';

export const use${EntityC}s = () => {
  const [items, setItems] = useState<${EntityC}[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadItems = useCallback(async (params: any = {}) => {
    try {
      setLoading(true);
      const data = await ${EntityC}Api.getAll(params);
      setItems(data);
    } catch (err: any) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, []);

  const createItem = async (data: Partial<${EntityC}>) => {
    try {
      setLoading(true);
      await ${EntityC}Api.create(data);
      toast.success('Creado exitosamente');
      await loadItems();
      return true;
    } catch (err) {
      toast.error('Error al crear');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateItem = async (id: string, data: Partial<${EntityC}>) => {
    try {
      setLoading(true);
      await ${EntityC}Api.update(id, data);
      toast.success('Actualizado exitosamente');
      await loadItems();
      return true;
    } catch (err) {
      toast.error('Error al actualizar');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (id: string) => {
    try {
      setLoading(true);
      await ${EntityC}Api.delete(id);
      toast.success('Eliminado exitosamente');
      await loadItems();
    } catch (err) {
      toast.error('No se pudo eliminar');
    } finally {
      setLoading(false);
    }
  };

  return { items, loading, loadItems, createItem, updateItem, deleteItem };
};
`;
  }

  fs.writeFileSync(path.join(srcDir, `application/use${isSingleton ? EntityC : EntityC + 's'}.ts`), hookCode);
}

const baseDir = 'C:\\Users\\PROFE-JP\\Desktop\\PROYECTO\\profe\\frontend';

generateFrontendCleanModule(baseDir, 'territorial', 'Distrito', 'distritos-clean');
generateFrontendCleanModule(baseDir, 'territorial', 'Departamento', 'departamentos-clean');
generateFrontendCleanModule(baseDir, 'academic', 'Comunicado', 'comunicados-clean');
generateFrontendCleanModule(baseDir, 'users', 'Profe'); // isSingleton internal logic
generateFrontendCleanModule(baseDir, 'academic', 'EvaluacionPeriodo', 'evaluacion-periodos-clean');
generateFrontendCleanModule(baseDir, 'territorial', 'Sede', 'sedes-clean');
generateFrontendCleanModule(baseDir, 'academic', 'Programa', 'programas-clean');
generateFrontendCleanModule(baseDir, 'users', 'Role', 'roles');
generateFrontendCleanModule(baseDir, 'users', 'Permission', 'permissions');
generateFrontendCleanModule(baseDir, 'users', 'User', 'users-clean');
generateFrontendCleanModule(baseDir, 'professional', 'BancoProfesional', 'banco-profesional-clean');
generateFrontendCleanModule(baseDir, 'academic', 'Inscripcion', 'inscripciones-clean');
generateFrontendCleanModule(baseDir, 'academic', 'Oferta', 'ofertas-clean');
