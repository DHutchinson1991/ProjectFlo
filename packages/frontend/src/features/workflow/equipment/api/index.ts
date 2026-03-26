import { apiClient } from "@/lib/api";
import type { ApiClient } from "@/lib/api/api-client.types";
import { createEquipmentApi } from "./equipment.api";

export { createEquipmentApi } from "./equipment.api";
export type { EquipmentApi } from "./equipment.api";

export const equipmentApi = createEquipmentApi(apiClient as unknown as ApiClient);
