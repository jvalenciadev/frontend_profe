import { useState, useCallback } from 'react';
import { EvaluacionPeriodoApi } from '../infrastructure/EvaluacionPeriodoApi';
import { EvaluacionPeriodo } from '../domain/EvaluacionPeriodo';
import { toast } from 'sonner';

export const useEvaluacionPeriodos = () => {
  const [items, setItems] = useState<EvaluacionPeriodo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadItems = useCallback(async (params: any = {}) => {
    try {
      setLoading(true);
      const data = await EvaluacionPeriodoApi.getAll(params);
      setItems(data);
    } catch (err: any) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, []);

  const createItem = async (data: Partial<EvaluacionPeriodo>) => {
    try {
      setLoading(true);
      await EvaluacionPeriodoApi.create(data);
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

  const updateItem = async (id: string, data: Partial<EvaluacionPeriodo>) => {
    try {
      setLoading(true);
      await EvaluacionPeriodoApi.update(id, data);
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
      await EvaluacionPeriodoApi.delete(id);
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
