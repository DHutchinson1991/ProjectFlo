import { FloorPlanObjectType, Prisma, SpaceType } from '@prisma/client';
import type { SandboxRoomLayoutSpec, SandboxRoomObjectType } from '@projectflo/shared';

const OBJECT_TYPE_MAP: Record<SandboxRoomObjectType, keyof typeof FloorPlanObjectType> = {
  LABEL: 'LABEL',
  WALL: 'WALL',
  DOOR: 'DOOR',
  WINDOW: 'WINDOW',
  STAGE: 'STAGE',
  ARCH: 'ARCH',
  ALTAR: 'ALTAR',
  AISLE: 'AISLE',
  CHAIR_ROW: 'CHAIR_ROW',
  TABLE_HEAD: 'TABLE_HEAD',
  TABLE_ROUND: 'TABLE_ROUND',
  TABLE_RECT: 'TABLE_RECT',
  DANCE_FLOOR: 'DANCE_FLOOR',
  DJ_BOOTH: 'DJ_BOOTH',
  BAR: 'BAR',
  FURNITURE: 'FURNITURE',
  DECORATIVE: 'DECORATIVE',
};

const SPACE_TYPE_MAP: Record<string, SpaceType> = {
  CEREMONY_AREA: SpaceType.CEREMONY_AREA,
  RECEPTION_HALL: SpaceType.RECEPTION_HALL,
  BRIDAL_SUITE: SpaceType.BRIDAL_SUITE,
  COCKTAIL_AREA: SpaceType.COCKTAIL_AREA,
  OTHER: SpaceType.OTHER,
};

export function sandboxLayoutToPrismaCreateInputs(layout: SandboxRoomLayoutSpec): {
  description: string;
  typeTags: SpaceType[];
  objects: Prisma.SpaceSlotObjectCreateManySpace_slotInput[];
  zones: Prisma.SpaceSlotZoneCreateManySpace_slotInput[];
} {
  return {
    description: layout.description,
    typeTags: layout.typeTags.map((tag) => SPACE_TYPE_MAP[tag]).filter(Boolean),
    objects: layout.objects.map((object) => ({
      object_type: FloorPlanObjectType[OBJECT_TYPE_MAP[object.object_type]],
      label: object.label,
      x: object.x,
      y: object.y,
      width: object.width,
      height: object.height,
      rotation: object.rotation,
      metadata: object.metadata == null ? undefined : object.metadata as Prisma.InputJsonValue,
      order_index: object.order_index,
    })),
    zones: layout.zones.map((zone) => ({
      name: zone.name,
      label: zone.label,
      polygon: zone.polygon,
      color: zone.color,
      description: zone.description,
      order_index: zone.order_index,
    })),
  };
}
