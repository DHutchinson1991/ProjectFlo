/**
 * Moments API
 *
 * Moments are sub-resources of scenes, so CRUD lives in the scenes API factory.
 * This barrel re-exports the scenes API for moment-specific consumers and
 * provides a convenience `createMomentsApi` wrapper.
 */

import type { ApiClient } from '@/lib/api/api-client.types';
import { createScenesApi, type ScenesApi } from '@/features/content/scenes/api';

export const createMomentsApi = (client: ApiClient) =>
  createScenesApi(client).moments;

export type MomentsApi = ScenesApi['moments'];
