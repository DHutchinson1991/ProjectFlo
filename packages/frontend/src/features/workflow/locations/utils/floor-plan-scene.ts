import type { FloorPlanSceneViewModel } from '@projectflo/shared';
import type { PackageSpaceSlot, SpaceSlotObject, SpaceSlotZone } from '../types/floor-plan.types';

export function packageSpaceSlotToScene(slot: PackageSpaceSlot): FloorPlanSceneViewModel {
  return {
    label: slot.label,
    description: slot.description,
    canvasSize: { width: slot.canvas_width, height: slot.canvas_height },
    objects: (slot.objects ?? []).map((object) => ({
      object_type: object.object_type,
      label: object.label ?? '',
      x: object.x,
      y: object.y,
      width: object.width,
      height: object.height,
      rotation: object.rotation,
      order_index: object.order_index,
      metadata: (object.metadata as Record<string, unknown> | null) ?? null,
    })),
    zones: (slot.zones ?? []).map((zone) => ({
      name: zone.name,
      label: zone.label ?? zone.name,
      polygon: zone.polygon as Array<{ x: number; y: number }>,
      color: zone.color ?? 'rgba(167,139,250,0.09)',
      description: zone.description ?? '',
      order_index: zone.order_index,
    })),
    subjects: (slot.subject_positions ?? []).map((subject) => ({
      id: subject.id,
      label: subject.label ?? subject.day_subject?.name ?? 'Subject',
      x: subject.x,
      y: subject.y,
      rotation: subject.rotation,
      roleId: subject.day_subject_id ?? undefined,
      roleName: subject.day_subject?.name ?? null,
    })),
    cameras: (slot.camera_positions ?? []).map((camera) => ({
      id: camera.id,
      label: camera.label ?? 'Camera',
      x: camera.x,
      y: camera.y,
      rotation: camera.rotation,
      fovAngle: camera.fov_angle,
    })),
  };
}

/** Adapts a scene view model to the legacy PackageSpaceSlot shape expected by SpaceSlotOverlay. */
export function sceneToPackageSpaceSlot(
  scene: FloorPlanSceneViewModel,
  slotMeta: {
    id: number;
    label: string;
    description?: string | null;
    packageId?: number;
    eventDayTemplateId?: number;
  },
  subjectPositions: PackageSpaceSlot['subject_positions'],
): PackageSpaceSlot {
  const objects: SpaceSlotObject[] = scene.objects.map((object, index) => ({
    id: -(index + 1),
    package_space_slot_id: slotMeta.id,
    object_type: object.object_type as SpaceSlotObject['object_type'],
    label: object.label,
    x: object.x,
    y: object.y,
    width: object.width,
    height: object.height,
    rotation: object.rotation,
    order_index: object.order_index,
    metadata: object.metadata ?? null,
    created_at: '',
    updated_at: '',
  }));

  const zones: SpaceSlotZone[] = scene.zones.map((zone, index) => ({
    id: -(index + 1),
    package_space_slot_id: slotMeta.id,
    name: zone.name,
    label: zone.label,
    polygon: zone.polygon,
    color: zone.color,
    description: zone.description,
    order_index: zone.order_index,
    created_at: '',
    updated_at: '',
  }));

  return {
    id: slotMeta.id,
    package_id: slotMeta.packageId ?? 0,
    event_day_template_id: slotMeta.eventDayTemplateId ?? 0,
    label: slotMeta.label,
    description: slotMeta.description ?? null,
    location_slot_id: null,
    location_space_id: null,
    preset_id: null,
    canvas_width: scene.canvasSize.width,
    canvas_height: scene.canvasSize.height,
    layout_json: null,
    created_at: '',
    updated_at: '',
    objects,
    camera_positions: [],
    subject_positions: subjectPositions,
    zones,
    type_tags: [],
  };
}
