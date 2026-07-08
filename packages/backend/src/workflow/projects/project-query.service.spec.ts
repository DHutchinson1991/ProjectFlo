import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ProjectQueryService } from './project-query.service';
import { PrismaService } from '../../platform/prisma/prisma.service';

describe('ProjectQueryService', () => {
    let service: ProjectQueryService;
    const prisma = {
        projects: {
            findFirst: jest.fn(),
            findMany: jest.fn(),
        },
    };

    beforeEach(async () => {
        jest.clearAllMocks();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ProjectQueryService,
                { provide: PrismaService, useValue: prisma },
            ],
        }).compile();

        service = module.get(ProjectQueryService);
    });

    describe('assertProjectOwnedByBrand', () => {
        it('passes when project belongs to brand', async () => {
            prisma.projects.findFirst.mockResolvedValue({ id: 1 });

            await expect(service.assertProjectOwnedByBrand(1, 10)).resolves.toBeUndefined();

            expect(prisma.projects.findFirst).toHaveBeenCalledWith({
                where: { id: 1, archived_at: null, brand_id: 10 },
                select: { id: true },
            });
        });

        it('throws when project is outside brand', async () => {
            prisma.projects.findFirst.mockResolvedValue(null);

            await expect(service.assertProjectOwnedByBrand(99, 10)).rejects.toThrow(NotFoundException);
        });
    });

    describe('getAllProjects', () => {
        it('always filters by brand_id', async () => {
            prisma.projects.findMany.mockResolvedValue([]);

            await service.getAllProjects(10);

            expect(prisma.projects.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { brand_id: 10, archived_at: null },
                }),
            );
        });
    });

    describe('getProjectById', () => {
        it('scopes lookup by brand_id', async () => {
            prisma.projects.findFirst.mockResolvedValue({ id: 1, brand_id: 10 });

            await service.getProjectById(1, 10);

            expect(prisma.projects.findFirst).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 1, brand_id: 10, archived_at: null },
                }),
            );
        });

        it('throws when project is outside brand', async () => {
            prisma.projects.findFirst.mockResolvedValue(null);

            await expect(service.getProjectById(99, 10)).rejects.toThrow(NotFoundException);
        });
    });
});
