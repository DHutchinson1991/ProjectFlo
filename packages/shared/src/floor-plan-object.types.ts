/** Minimal floor-plan object shape for placement resolution (canvas 1000×1000). */
export interface FloorPlanChairObject {
  object_type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  metadata?: Record<string, unknown> | null;
}
