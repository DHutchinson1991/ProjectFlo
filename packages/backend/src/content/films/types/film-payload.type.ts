import { Prisma } from '@prisma/client';

export type FilmWithDetails = Prisma.FilmGetPayload<{
  include: {
    montage_preset: true;
    tracks: {
      include: {
        crew: {
          select: {
            id: true;
            crew_color: true;
            contact: { select: { first_name: true, last_name: true } };
          };
        };
      };
      orderBy: { order_index: 'asc' };
    };
    subjects: true;
    locations: {
      include: { location: true };
    };
    scenes: {
      include: {
        moments: {
          orderBy: { order_index: 'asc' };
          include: {
            subjects: {
              include: {
                subject: {
                  include: {
                    role_template: true;
                  };
                };
              };
            };
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
          };
        };
        beats: {
          orderBy: { order_index: 'asc' };
          include: { recording_setup: true };
        };
        recording_setup: {
          include: {
            camera_assignments: {
              include: {
                track: true;
              };
            };
          };
        };
        scene_music: true;
        audio_sources: {
          orderBy: { order_index: 'asc' };
        };
        location_assignment: {
          include: { location: true };
        };
      };
      orderBy: { order_index: 'asc' };
    };
  };
}>;
