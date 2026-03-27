import { apiClient } from '@/shared/api/client';
import type { ApiClient } from '@/shared/api/client';
import { createEquipmentApi } from "./equipment.api";

export { createEquipmentApi } from "./equipment.api";
export type { EquipmentApi } from "./equipment.api";

export const equipmentApi = createEquipmentApi(apiClient);
