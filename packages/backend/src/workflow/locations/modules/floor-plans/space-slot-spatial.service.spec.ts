import { SpaceSlotSpatialSyncService } from './space-slot-spatial-sync.service';

const buildPrisma = () => ({
    spaceSlotObject: {
        findMany: jest.fn().mockResolvedValue([
            { object_type: 'ALTAR', label: 'Ceremony Altar', x: 420, y: 40, width: 160, height: 70, metadata: null },
            { object_type: 'CHAIR_ROW', label: 'L1', x: 80, y: 150, width: 380, height: 30, metadata: { side: 'L', row_index: 0 } },
            { object_type: 'CHAIR_ROW', label: 'R1', x: 540, y: 150, width: 380, height: 30, metadata: { side: 'R', row_index: 0 } },
            { object_type: 'CHAIR_ROW', label: 'L10', x: 80, y: 600, width: 380, height: 30, metadata: { side: 'L', row_index: 9 } },
            { object_type: 'CHAIR_ROW', label: 'R10', x: 540, y: 600, width: 380, height: 30, metadata: { side: 'R', row_index: 9 } },
        ]),
    },
    packageFilmSceneSchedule: {
        findMany: jest.fn().mockResolvedValue([
            { package_film: { film_id: 77 } },
        ]),
    },
    filmTimelineTrack: {
        findMany: jest.fn().mockResolvedValue([
            { id: 101, name: 'Camera 1', order_index: 0, is_unmanned: false, crew_id: 11 },
            { id: 102, name: 'Camera 2', order_index: 1, is_unmanned: false, crew_id: 12 },
            { id: 103, name: 'Camera 3', order_index: 2, is_unmanned: false, crew_id: null },
        ]),
    },
    packageCrewSlotActivity: {
        findMany: jest.fn().mockResolvedValue([
            {
                package_crew_slot_id: 11,
                package_crew_slot: {
                    id: 11,
                    label: 'Lead',
                    order_index: 0,
                    job_role: { name: 'videographer', display_name: 'Videographer' },
                },
            },
            {
                package_crew_slot_id: 12,
                package_crew_slot: {
                    id: 12,
                    label: 'Second',
                    order_index: 1,
                    job_role: { name: 'videographer', display_name: 'Videographer' },
                },
            },
        ]),
    },
    packageCrewSlotEquipment: {
        findMany: jest.fn().mockResolvedValue([]),
    },
    spaceSlotCameraPosition: {
        findMany: jest.fn().mockResolvedValue([
            { id: 1, crew_slot_id: 11, label: 'CAM1 - Lead', order_index: 0, x: 197, y: 425, rotation: 60, fov_angle: null, is_unmanned: false },
            { id: 2, crew_slot_id: 12, label: 'CAM2 - Second', order_index: 1, x: 500, y: 425, rotation: 0, fov_angle: null, is_unmanned: false },
            { id: 3, crew_slot_id: 12, label: 'CAM3 - Extra', order_index: 2, x: 803, y: 425, rotation: 300, fov_angle: null, is_unmanned: false },
            { id: 4, crew_slot_id: 12, label: 'CAM4 - Extra', order_index: 3, x: 400, y: 100, rotation: 0, fov_angle: null, is_unmanned: false },
            { id: 5, crew_slot_id: 12, label: 'CAM5 - Extra', order_index: 4, x: 500, y: 100, rotation: 0, fov_angle: null, is_unmanned: false },
        ]),
        deleteMany: jest.fn().mockResolvedValue({ count: 2 }),
        update: jest.fn().mockResolvedValue(undefined),
        create: jest.fn().mockResolvedValue(undefined),
        count: jest.fn().mockResolvedValue(0),
        aggregate: jest.fn().mockResolvedValue({ _max: { order_index: 4 } }),
    },
    packageDaySubjectActivity: {
        findMany: jest.fn().mockResolvedValue([]),
    },
    spaceSlotSubjectPosition: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue(undefined),
    },
});

describe('SpaceSlotSpatialSyncService', () => {
    it('keeps package floor-plan cameras aligned to linked film tracks', async () => {
        const prisma = buildPrisma();
        const service = new SpaceSlotSpatialSyncService(prisma as never);

        const changed = await service.syncCamerasAndSubjects(99, 123);

        expect(changed).toBe(true);
        expect(prisma.spaceSlotCameraPosition.deleteMany).toHaveBeenCalledWith({
            where: {
                package_space_slot_id: 99,
                id: { in: [4, 5] },
            },
        });
        expect(prisma.spaceSlotCameraPosition.update).toHaveBeenCalledTimes(3);
        expect(prisma.spaceSlotCameraPosition.update).toHaveBeenNthCalledWith(1, {
            where: { id: 1 },
            data: expect.objectContaining({
                label: 'Camera 1',
                crew_slot_id: 11,
                is_unmanned: false,
                x: 500,
                y: 700,
                fov_angle: 72,
                order_index: 0,
            }),
        });
        expect(prisma.spaceSlotCameraPosition.update).toHaveBeenNthCalledWith(2, {
            where: { id: 2 },
            data: expect.objectContaining({
                label: 'Camera 2',
                crew_slot_id: 12,
                is_unmanned: false,
                x: 478,
                y: 245,
                fov_angle: 44,
                order_index: 1,
            }),
        });
        expect(prisma.spaceSlotCameraPosition.update).toHaveBeenNthCalledWith(3, {
            where: { id: 3 },
            data: expect.objectContaining({
                label: 'Camera 3',
                is_unmanned: false,
                x: 522,
                y: 215,
                fov_angle: 28,
                order_index: 2,
            }),
        });
        expect(prisma.spaceSlotCameraPosition.create).not.toHaveBeenCalled();
    });
});
