import { apiClient } from '@/shared/api/client';
import { createEquipmentApi } from "./equipment.api";
import { createEquipmentPresetsApi } from './equipment-presets.api';

export { createEquipmentApi } from "./equipment.api";
export type { EquipmentApi } from "./equipment.api";
export { createEquipmentPresetsApi } from './equipment-presets.api';
export type { EquipmentPresetsApi } from './equipment-presets.api';

export const equipmentApi = createEquipmentApi(apiClient);
export const equipmentPresetsApi = createEquipmentPresetsApi(apiClient);
