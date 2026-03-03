import { useState, useCallback } from 'react';
import { ProfeApi } from '../infrastructure/ProfeApi';
import { Profe } from '../domain/Profe';
import { toast } from 'sonner';

export const useProfe = () => {
  const [data, setData] = useState<Profe | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const result = await ProfeApi.get();
      setData(result);
    } catch (err: any) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, []);

  const save = async (formData: Partial<Profe>) => {
    try {
      setLoading(true);
      if (data && data.id) {
        await ProfeApi.update(data.id, formData);
      } else {
        await ProfeApi.create(formData);
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
