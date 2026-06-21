/** Canvas-agnostic floor plan scene for Day Designer and package overlays. */
export interface FloorPlanSceneCanvasSize {
  width: number;
  height: number;
}

export interface FloorPlanSceneObject {
  object_type: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  order_index: number;
  metadata?: Record<string, unknown> | null;
}

export interface FloorPlanSceneZone {
  name: string;
  label: string;
  polygon: Array<{ x: number; y: number }>;
  color: string;
  description: string;
  order_index: number;
}

export interface FloorPlanSceneSubject {
  id: number | string;
  label: string;
  x: number;
  y: number;
  rotation: number;
  roleId?: number;
  roleName?: string | null;
  actionText?: string | null;
  placementId?: number | null;
  copyIndex?: number;
  isPlaced?: boolean;
}

export interface FloorPlanSceneCamera {
  id: number | string;
  label: string;
  x: number;
  y: number;
  rotation: number;
  fovAngle?: number | null;
}

export interface FloorPlanSceneViewModel {
  canvasSize: FloorPlanSceneCanvasSize;
  objects: FloorPlanSceneObject[];
  zones: FloorPlanSceneZone[];
  subjects: FloorPlanSceneSubject[];
  cameras?: FloorPlanSceneCamera[];
  label?: string;
  description?: string | null;
}
