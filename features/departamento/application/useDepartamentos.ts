import { useState, useCallback } from 'react';
import { DepartamentoApi } from '../infrastructure/DepartamentoApi';
import { Departamento } from '../domain/Departamento';
import { toast } from 'sonner';

export const useDepartamentos = () => {
  const [items, setItems] = useState<Departamento[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadItems = useCallback(async (params: any = {}) => {
    try {
      setLoading(true);
      const data = await DepartamentoApi.getAll(params);
      setItems(data);
    } catch (err: any) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, []);

  const createItem = async (data: Partial<Departamento>) => {
    try {
      setLoading(true);
      await DepartamentoApi.create(data);
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

  const updateItem = async (id: string, data: Partial<Departamento>) => {
    try {
      setLoading(true);
      await DepartamentoApi.update(id, data);
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
      await DepartamentoApi.delete(id);
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
