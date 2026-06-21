import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { buildSandboxRoomLayout } from '@projectflo/shared';
import { sandboxLayoutToPrismaCreateInputs } from '../../spatial/sandbox-room-layout.mapper';

export interface DayBlueprintSandboxLayout {
  description: string;
  typeTags: import('@prisma/client').SpaceType[];
  objects: Prisma.SpaceSlotObjectCreateManySpace_slotInput[];
  zones: Prisma.SpaceSlotZoneCreateManySpace_slotInput[];
}

@Injectable()
export class DayBlueprintSandboxLayoutService {
  build(params: { label: string; activityName?: string | null; description?: string | null }): DayBlueprintSandboxLayout {
    const spec = buildSandboxRoomLayout(params);
    return sandboxLayoutToPrismaCreateInputs(spec);
  }
}
