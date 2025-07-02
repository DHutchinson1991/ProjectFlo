import { Test, TestingModule } from '@nestjs/testing';
import { ComponentsService } from './components.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ComponentType } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';

const mockPrisma = {
    componentLibrary: {
        create: jest.fn(),
    },
};

describe('ComponentsService', () => {
    let service: ComponentsService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ComponentsService,
                { provide: PrismaService, useValue: mockPrisma },
            ],
        }).compile();
        service = module.get<ComponentsService>(ComponentsService);
        jest.clearAllMocks();
    });

    it('should create a component with valid data', async () => {
        const dto = {
            name: 'UnitTest Component',
            type: ComponentType.VIDEO,
            description: 'desc',
            complexity_score: 1,
            estimated_duration: 10,
            default_editing_style: 'Standard',
            base_task_hours: 2,
        };
        const created = { id: 1, ...dto };
        mockPrisma.componentLibrary.create.mockResolvedValue(created);
        const result = await service.create(dto);
        expect(result).toEqual(created);
        expect(mockPrisma.componentLibrary.create).toHaveBeenCalledWith({ data: dto });
    });

    it('should throw BadRequestException if name is missing', async () => {
        await expect(
            service.create({ type: ComponentType.VIDEO } as any)
        ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if type is invalid', async () => {
        await expect(
            service.create({ name: 'Test', type: 'INVALID' as any })
        ).rejects.toThrow(BadRequestException);
    });
});
