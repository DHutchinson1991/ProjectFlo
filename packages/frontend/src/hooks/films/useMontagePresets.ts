import { useCallback, useEffect, useState } from 'react';
import type { MontagePreset } from '../../lib/types/domains/montage-presets';
import { request } from '../utils/api';

export const useMontagePresets = (brandId?: number) => {
  const [presets, setPresets] = useState<MontagePreset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPresets = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const query = brandId ? `?brandId=${brandId}` : '';
      const data = await request<MontagePreset[]>(`/montage-presets${query}`);
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
