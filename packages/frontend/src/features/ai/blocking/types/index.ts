export interface GenerateBlockingRequest {
  sceneMomentId: number;
  spaceSlotId: number;
  activityId?: number;
}

export interface BlockingSubjectResult {
  name: string;
  x: number;
  y: number;
  rotation: number;
  actionDescription: string;
  positionId: number;
  daySubjectId: number;
}

export interface BlockingCameraResult {
  label: string;
  x: number;
  y: number;
  rotation: number;
  subjectNames: string[];
  cameraPositionId: number;
}

export interface GenerateBlockingResponse {
  momentDescription: string;
  durationSeconds: number;
  subjects: BlockingSubjectResult[];
  cameras: BlockingCameraResult[];
  model: string;
}

export interface GenerateSceneBlockingRequest {
  filmSceneId: number;
  spaceSlotId: number;
  activityId?: number;
}

export interface SceneBlockingMomentResult {
  sceneMomentId: number;
  momentName: string;
  status: 'completed' | 'failed';
  error?: string;
  result?: GenerateBlockingResponse;
}

export interface GenerateSceneBlockingResponse {
  filmSceneId: number;
  total: number;
  completed: number;
  failed: number;
  moments: SceneBlockingMomentResult[];
}
