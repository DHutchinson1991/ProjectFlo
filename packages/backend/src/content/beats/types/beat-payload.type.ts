import { Prisma } from '@prisma/client';

export type BeatWithDetails = Prisma.SceneBeatGetPayload<{
  include: {
    recording_setup: true;
  };
}>;
