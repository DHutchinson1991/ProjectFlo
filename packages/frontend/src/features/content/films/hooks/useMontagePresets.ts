import { useCallback, useEffect, useState } from 'react';
import type { MontagePreset } from '@/features/content/films/types/montage-presets';
import { montagePresetsApi } from '@/features/content/montage-presets/api';

export const useMontagePresets = (brandId?: number) => {
  const [presets, setPresets] = useState<MontagePreset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPresets = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await montagePresetsApi.getAll(brandId);
      setPresets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load montage presets');
    } finally {
      setIsLoading(false);
    }
  }, [brandId]);

  useEffect(() => {
    loadPresets();
  }, [loadPresets]);

  return { presets, isLoading, error, reload: loadPresets };
};
