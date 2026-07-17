import { Test } from '@nestjs/testing';
import { FloorPlanObjectType } from '@prisma/client';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { GeocodingService } from '../locations/geocoding.service';
import { ProjectFilmCloneService } from './project-film-clone.service';
import { ProjectPackageCloneService } from './project-package-clone.service';

describe('ProjectPackageCloneService spatial clone', () => {
  let service: ProjectPackageCloneService;
  let projectSpaceSlotObjectCreate: jest.Mock;
  let projectSpaceSlotCameraCreate: jest.Mock;
  let projectSpaceSlotSubjectCreate: jest.Mock;
  let projectSpaceSlotCreate: jest.Mock;

  beforeEach(async () => {
    projectSpaceSlotObjectCreate = jest.fn().mockImplementation(({ data }) =>
      Promise.resolve({ id: 900 + data.order_index }),
    );
    projectSpaceSlotCameraCreate = jest.fn().mockResolvedValue({ id: 1 });
    projectSpaceSlotSubjectCreate = jest.fn().mockResolvedValue({ id: 1 });
    projectSpaceSlotCreate = jest.fn().mockResolvedValue({ id: 50 });

    const prisma = {
      service_packages: {
        findUnique: jest.fn().mockResolvedValue({ id: 1, contents: { items: [] }, brand_id: 1 }),
      },
      packageEventDay: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 10,
            event_day_template_id: 100,
            order_index: 0,
            event_day: { name: 'Wedding Day' },
          },
        ]),
      },
      projectEventDay: {
        create: jest.fn().mockResolvedValue({ id: 200 }),
      },
      packageActivity: { findMany: jest.fn().mockResolvedValue([]) },
      packageActivityMoment: { findMany: jest.fn().mockResolvedValue([]) },
      packageDaySubject: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 30,
            event_day_template_id: 100,
            order_index: 0,
            name: 'Bride',
            count: null,
            notes: null,
            role_template_id: 1,
            role_template: { is_group: false, role_name: 'Bride' },
          },
        ]),
      },
      projectDaySubject: {
        create: jest.fn().mockResolvedValue({ id: 300 }),
      },
      packageLocationSlot: { findMany: jest.fn().mockResolvedValue([]) },
      packageSpaceSlot: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 40,
            event_day_template_id: 100,
            label: 'Ceremony Space',
            location_slot_id: null,
            location_space_id: null,
            canvas_width: 1200,
            canvas_height: 800,
            layout_json: { version: 1 },
            type_tags: [],
            objects: [
              {
                id: 401,
                object_type: FloorPlanObjectType.ALTAR,
                label: 'Altar',
                x: 10,
                y: 20,
                width: 50,
                height: 50,
                rotation: 0,
                metadata: null,
                order_index: 0,
              },
            ],
            subject_positions: [
              {
                id: 501,
                day_subject_id: 30,
                label: 'Bride',
                x: 100,
                y: 200,
                order_index: 0,
                bound_object_id: 401,
              },
            ],
            camera_positions: [
              {
                id: 601,
                crew_slot_id: 70,
                label: 'Main Cam',
                x: 300,
                y: 400,
                rotation: 45,
                focal_length_mm: 35,
                is_unmanned: false,
                order_index: 0,
              },
            ],
          },
        ]),
      },
      projectSpaceSlot: {
        create: projectSpaceSlotCreate,
      },
      projectSpaceSlotObject: {
        create: projectSpaceSlotObjectCreate,
      },
      projectSpaceSlotSubject: {
        create: projectSpaceSlotSubjectCreate,
      },
      projectSpaceSlotCamera: {
        create: projectSpaceSlotCameraCreate,
      },
      packageCrewSlot: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 70,
            package_event_day: { event_day_template_id: 100 },
            crew_id: null,
            job_role_id: 1,
            hours: 8,
            label: 'Lead',
            order_index: 0,
            equipment: [],
          },
        ]),
      },
      projectCrewSlot: {
        create: jest.fn().mockResolvedValue({ id: 700 }),
      },
      packageFilm: { findMany: jest.fn().mockResolvedValue([]) },
      packageCrewSlotActivity: { findMany: jest.fn().mockResolvedValue([]) },
      packageDaySubjectActivity: { findMany: jest.fn().mockResolvedValue([]) },
      locationActivityAssignment: { findMany: jest.fn().mockResolvedValue([]) },
      spaceActivityAssignment: { findMany: jest.fn().mockResolvedValue([]) },
      inquiry_wizard_submissions: { findFirst: jest.fn().mockResolvedValue(null) },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ProjectPackageCloneService,
        { provide: PrismaService, useValue: prisma },
        { provide: ProjectFilmCloneService, useValue: { cloneFilmContent: jest.fn() } },
        { provide: GeocodingService, useValue: { geocode: jest.fn() } },
      ],
    }).compile();

    service = moduleRef.get(ProjectPackageCloneService);
  });

  it('copies floor-plan layout, objects, subjects, and cameras into inquiry snapshots', async () => {
    await service.clonePackageToInquiry(5, 1);

    expect(projectSpaceSlotCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          inquiry_id: 5,
          canvas_width: 1200,
          canvas_height: 800,
          layout_json: { version: 1 },
          label: 'Ceremony Space',
        }),
      }),
    );

    expect(projectSpaceSlotObjectCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        project_space_slot_id: 50,
        object_type: FloorPlanObjectType.ALTAR,
        label: 'Altar',
        x: 10,
        y: 20,
      }),
    });

    expect(projectSpaceSlotSubjectCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        project_space_slot_id: 50,
        project_day_subject_id: 300,
        label: 'Bride',
        x: 100,
        y: 200,
      }),
    });

    expect(projectSpaceSlotCameraCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        project_space_slot_id: 50,
        project_crew_slot_id: 700,
        label: 'Main Cam',
        x: 300,
        y: 400,
        rotation: 45,
        focal_length_mm: 35,
      }),
    });
  });
});
