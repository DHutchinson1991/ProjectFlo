import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SceneType } from '@prisma/client';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { CreateSceneDto } from './dto/create-scene.dto';
import { ScenesCrudService } from './services/scenes-crud.service';

const mockPrisma = {
  film: {
    findUnique: jest.fn(),
  },
  sceneTemplate: {
    findUnique: jest.fn(),
  },
  filmScene: {
    count: jest.fn(),
    create: jest.fn(),
  },
};

describe('ScenesCrudService', () => {
  let service: ScenesCrudService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScenesCrudService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ScenesCrudService>(ScenesCrudService);
    jest.clearAllMocks();
  });

  it('creates a scene with valid data', async () => {
    const now = new Date('2026-04-20T00:00:00.000Z');
    const dto: CreateSceneDto = {
      film_id: 7,
      name: 'UnitTest Scene',
    };

    mockPrisma.film.findUnique.mockResolvedValue({ id: 7, name: 'Demo Film' });
    mockPrisma.filmScene.count.mockResolvedValue(0);
    mockPrisma.filmScene.create.mockResolvedValue({
      id: 1,
      film_id: 7,
      name: 'UnitTest Scene',
      mode: SceneType.MOMENTS,
      scene_template_id: null,
      shot_count: null,
      duration_seconds: null,
      montage_style: null,
      montage_bpm: null,
      order_index: 0,
      created_at: now,
      updated_at: now,
    });

    const result = await service.create(dto);

    expect(result).toEqual(
      expect.objectContaining({
        id: 1,
        film_id: 7,
        name: 'UnitTest Scene',
        mode: SceneType.MOMENTS,
      }),
    );
    expect(mockPrisma.filmScene.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        film_id: 7,
        name: 'UnitTest Scene',
        mode: SceneType.MOMENTS,
        order_index: 0,
      }),
    });
  });

  it('throws when the film does not exist', async () => {
    const dto: CreateSceneDto = {
      film_id: 999,
      name: 'Missing Film Scene',
    };

    mockPrisma.film.findUnique.mockResolvedValue(null);

    await expect(service.create(dto)).rejects.toThrow(NotFoundException);
  });
});
