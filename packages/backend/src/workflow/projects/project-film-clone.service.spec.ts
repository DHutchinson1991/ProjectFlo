import { Test } from '@nestjs/testing';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { ProjectFilmCloneService } from './project-film-clone.service';

describe('ProjectFilmCloneService', () => {
  let service: ProjectFilmCloneService;
  let prisma: {
    projectFilm: { findUnique: jest.Mock };
    packageFilm: { findUnique: jest.Mock };
    packageDaySubject: { findMany: jest.Mock };
    filmTimelineTrack: { findMany: jest.Mock };
    projectFilmTimelineTrack: { create: jest.Mock };
    projectFilmSubject: { create: jest.Mock };
    filmLocation: { findMany: jest.Mock };
    filmEquipmentAssignment: { findMany: jest.Mock };
    filmScene: { findMany: jest.Mock };
    projectFilmSceneSchedule: { findMany: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      projectFilm: {
        findUnique: jest.fn().mockResolvedValue({ package_film_id: 11 }),
      },
      packageFilm: {
        findUnique: jest.fn().mockResolvedValue({ package_id: 42 }),
      },
      packageDaySubject: {
        findMany: jest.fn().mockResolvedValue([
          { id: 100, name: 'Bride', role_template_id: 1 },
        ]),
      },
      filmTimelineTrack: { findMany: jest.fn().mockResolvedValue([]) },
      projectFilmTimelineTrack: { create: jest.fn() },
      projectFilmSubject: {
        create: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({ id: 500, ...data }),
        ),
      },
      filmLocation: { findMany: jest.fn().mockResolvedValue([]) },
      filmEquipmentAssignment: { findMany: jest.fn().mockResolvedValue([]) },
      filmScene: { findMany: jest.fn().mockResolvedValue([]) },
      projectFilmSceneSchedule: { findMany: jest.fn().mockResolvedValue([]) },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ProjectFilmCloneService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = moduleRef.get(ProjectFilmCloneService);
  });

  it('loads PackageDaySubject rows from the originating package_film, not any film_id match', async () => {
    await service.cloneFilmContent(
      { projectId: 1, projectFilmId: 7 },
      99,
      prisma as unknown as Parameters<typeof service.cloneFilmContent>[2],
    );

    expect(prisma.projectFilm.findUnique).toHaveBeenCalledWith({
      where: { id: 7 },
      select: { package_film_id: true },
    });
    expect(prisma.packageFilm.findUnique).toHaveBeenCalledWith({
      where: { id: 11 },
      select: { package_id: true },
    });
    expect(prisma.packageDaySubject.findMany).toHaveBeenCalledWith({
      where: { package_id: 42 },
      orderBy: { id: 'asc' },
    });
    expect(prisma.projectFilmSubject.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        project_film_id: 7,
        source_subject_id: 100,
        name: 'Bride',
      }),
    });
  });
});
