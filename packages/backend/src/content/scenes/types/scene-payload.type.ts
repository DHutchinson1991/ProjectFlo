import { Prisma } from '@prisma/client';

export type SceneWithDetails = Prisma.FilmSceneGetPayload<{
    include: {
        template: true;
        location_assignment: { include: { location: true } };
        moments: {
            orderBy: { order_index: 'asc' };
            include: {
                recording_setup: {
                    include: { camera_assignments: { include: { track: true } } };
                };
                moment_music: true;
                subjects: {
                    include: { subject: { include: { role_template: true } } };
                };
            };
        };
        beats: {
            orderBy: { order_index: 'asc' };
            include: { recording_setup: true };
        };
        recording_setup: {
            include: { camera_assignments: { include: { track: true } } };
        };
        scene_music: true;
    };
}>;
