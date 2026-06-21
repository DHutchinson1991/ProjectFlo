import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../../platform/prisma/prisma.service';
import { CameraAimService } from './camera-aim.service';
import { CameraFramingService } from './camera-framing.service';

describe('CameraAimService', () => {
  let service: CameraAimService;
  let prisma: {
    sceneMoment: { findUnique: jest.Mock };
    spaceSlotCameraPosition: { findMany: jest.Mock; update: jest.Mock };
    spaceSlotMomentCamera: { upsert: jest.Mock };
    packageActivityMoment: { findUnique: jest.Mock };
    spaceActivityAssignment: { findMany: jest.Mock };
  };
  let cameraFraming: { loadFramingSubjects: jest.Mock };

  beforeEach(async () => {
    prisma = {
      sceneMoment: { findUnique: jest.fn() },
      spaceSlotCameraPosition: { findMany: jest.fn(), update: jest.fn() },
      spaceSlotMomentCamera: { upsert: jest.fn() },
      packageActivityMoment: { findUnique: jest.fn() },
      spaceActivityAssignment: { findMany: jest.fn() },
    };
    cameraFraming = {
      loadFramingSubjects: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CameraAimService,
        { provide: PrismaService, useValue: prisma },
        { provide: CameraFramingService, useValue: cameraFraming },
      ],
    }).compile();

    service = module.get(CameraAimService);
    jest.clearAllMocks();
  });

  it('aims manned cameras with assignments toward focal subjects', async () => {
    prisma.sceneMoment.findUnique.mockResolvedValue({
      id: 9,
      package_activity_moment_id: 42,
      recording_setup: {
        camera_assignments: [
          {
            subject_ids: [101],
            track: { name: 'Camera 2' },
          },
        ],
      },
    });
    prisma.packageActivityMoment.findUnique.mockResolvedValue({
      package_activity_id: 7,
    });
    prisma.spaceActivityAssignment.findMany.mockResolvedValue([
      { package_space_slot_id: 3 },
    ]);
    prisma.spaceSlotCameraPosition.findMany.mockResolvedValue([
      {
        id: 22,
        order_index: 1,
        x: 200,
        y: 500,
        rotation: 180,
        fov_angle: 60,
        is_unmanned: false,
        package_space_slot_id: 3,
        moment_overrides: [{ x: 200, y: 500, rotation: 180, fov_angle: 60 }],
      },
    ]);
    cameraFraming.loadFramingSubjects.mockResolvedValue([
      { id: 101, x: 500, y: 300, name: 'Officiant' },
    ]);

    const result = await service.aimCamerasForSceneMoment(9);

    expect(result.updatedCameraPositionIds).toEqual([22]);
    expect(prisma.spaceSlotMomentCamera.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ rotation: 56 }),
      }),
    );
  });

  it('skips unmanned cameras', async () => {
    prisma.sceneMoment.findUnique.mockResolvedValue({
      id: 9,
      package_activity_moment_id: 42,
      recording_setup: {
        camera_assignments: [
          {
            subject_ids: [101],
            track: { name: 'Camera 1' },
          },
        ],
      },
    });
    prisma.packageActivityMoment.findUnique.mockResolvedValue({
      package_activity_id: 7,
    });
    prisma.spaceActivityAssignment.findMany.mockResolvedValue([
      { package_space_slot_id: 3 },
    ]);
    prisma.spaceSlotCameraPosition.findMany.mockResolvedValue([
      {
        id: 21,
        order_index: 0,
        x: 100,
        y: 500,
        rotation: 90,
        fov_angle: 60,
        is_unmanned: true,
        package_space_slot_id: 3,
        moment_overrides: [],
      },
    ]);

    const result = await service.aimCamerasForSceneMoment(9);

    expect(result.updatedCameraPositionIds).toEqual([]);
    expect(prisma.spaceSlotMomentCamera.upsert).not.toHaveBeenCalled();
  });
});
