import { Prisma } from '@prisma/client';

export type MomentWithDetails = Prisma.SceneMomentGetPayload<{
  include: {
    recording_setup: {
      include: {
        camera_assignments: {
          include: {
            track: true;
          };
        };
      };
    };
    moment_music: true;
    subjects: {
      include: {
        subject: {
          include: {
            role_template: true;
          };
        };
      };
    };
  };
}>;
