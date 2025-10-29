import { useMemo, useRef, useState } from 'react';
import debounce from 'lodash.debounce';

/**
 * Hook genérico de auto-save com debounce
 * 
 * Exemplo de uso:
 * const { saving, debouncedSave } = useDebouncedSave(saveFn)
 * debouncedSave({ id, field, value })
 */
export function useDebouncedSave<T>(saveFn: (payload: T) => Promise<void>, delay = 800) {
  const [saving, setSaving] = useState(false);
  const lastPayload = useRef<T | null>(null);

  const debounced = useMemo(
    () =>
      debounce(async (payload: T) => {
        setSaving(true);
        lastPayload.current = payload;
        try {
          await saveFn(payload);
        } catch (err) {
          console.error('Erro ao salvar:', err);
        } finally {
          setSaving(false);
        }
      }, delay),
    [saveFn, delay]
  );

  return { saving, debouncedSave: debounced };
}
