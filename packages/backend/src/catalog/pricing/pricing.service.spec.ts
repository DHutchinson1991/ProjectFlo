import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PricingService } from './pricing.service';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { TaskLibraryService } from '../../workflow/task-library/task-library.service';

/* ---- helpers ---- */
const mockPrisma = () => ({
  service_packages: { findFirst: jest.fn() },
  job_roles: { findFirst: jest.fn() },
  brands: { findUnique: jest.fn() },
});

const mockTaskLib = () => ({
  previewAutoGeneration: jest.fn(),
});

/** Build a minimal crew slot fixture */
function makeCrewSlot(overrides: Record<string, any> = {}) {
  return {
    label: 'Lead',
    hours: 8,
    job_role_id: 1,
    crew_id: 1,
    crew: {
      id: 1,
      job_role_assignments: [],
    },
    equipment: [],
    ...overrides,
  };
}

describe('PricingService', () => {
  let service: PricingService;
  let prisma: ReturnType<typeof mockPrisma>;
  let taskLib: ReturnType<typeof mockTaskLib>;

  beforeEach(async () => {
    prisma = mockPrisma();
    taskLib = mockTaskLib();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PricingService,
        { provide: PrismaService, useValue: prisma },
        { provide: TaskLibraryService, useValue: taskLib },
      ],
    }).compile();

    service = module.get<PricingService>(PricingService);
  });

  /* ----- Package not found ----- */
  it('throws NotFoundException when package does not exist', async () => {
    prisma.service_packages.findFirst.mockResolvedValue(null);
    await expect(service.estimatePackagePrice(999, 1, 1)).rejects.toThrow(NotFoundException);
  });

  /* ----- Equipment deduplication ----- */
  it('deduplicates equipment by equipment_id', async () => {
    const sharedEquipment = {
      equipment_id: 10,
      equipment: { id: 10, item_name: 'Sony A7IV', category: 'CAMERA', rental_price_per_day: 50 },
    };
    prisma.service_packages.findFirst.mockResolvedValue({
      id: 1,
      name: 'Gold',
      package_crew_slots: [
        makeCrewSlot({ equipment: [sharedEquipment, sharedEquipment] }),
        makeCrewSlot({ equipment: [sharedEquipment] }),
      ],
    });
    prisma.job_roles.findFirst.mockResolvedValue(null);
    prisma.brands.findUnique.mockResolvedValue({ currency: 'GBP' });
    taskLib.previewAutoGeneration.mockResolvedValue({
      summary: { total_generated_tasks: 0, total_estimated_hours: 0, total_estimated_cost: 0 },
      byPhase: {},
    });

    const result = await service.estimatePackagePrice(1, 1, 1);
    expect(result.equipment.dailyCost).toBe(50); // counted once
    expect(result.equipment.totalItems).toBe(1);
    expect(result.currency).toBe('GBP');
  });

  /* ----- Task cost error surfaces as warning ----- */
  it('surfaces task preview errors as warnings', async () => {
    prisma.service_packages.findFirst.mockResolvedValue({
      id: 1,
      name: 'Test',
      package_crew_slots: [],
    });
    prisma.job_roles.findFirst.mockResolvedValue(null);
    prisma.brands.findUnique.mockResolvedValue({ currency: 'USD' });
    taskLib.previewAutoGeneration.mockRejectedValue(new Error('No task library'));

    const result = await service.estimatePackagePrice(1, 1, 1);
    expect(result.warnings).toContain('Task cost unavailable: No task library');
    expect(result.tasks.totalCost).toBe(0);
  });

  /* ----- Summary arithmetic ----- */
  it('sums equipment + crew + tasks in summary', async () => {
    const op = makeCrewSlot({
      hours: 10,
      crew: {
        id: 1,
        job_role_assignments: [],
      },
      equipment: [
        {
          equipment_id: 1,
          equipment: { id: 1, item_name: 'Cam', category: 'CAMERA', rental_price_per_day: 100 },
        },
      ],
    });
    prisma.service_packages.findFirst.mockResolvedValue({
      id: 1,
      name: 'Test',
      package_crew_slots: [op],
    });
    prisma.job_roles.findFirst.mockResolvedValue(null);
    prisma.brands.findUnique.mockResolvedValue({ currency: 'USD' });
    taskLib.previewAutoGeneration.mockResolvedValue({
      tasks: [{ phase: 'Post', total_instances: 5, total_hours: 10, estimated_cost: 300 }],
      summary: { total_generated_tasks: 5, total_estimated_hours: 10, total_estimated_cost: 300 },
      byPhase: { Post: [{ total_instances: 5, total_hours: 10, estimated_cost: 300 }] },
    });

    const result = await service.estimatePackagePrice(1, 1, 1);
    expect(result.summary.equipmentCost).toBe(100);
    expect(result.summary.crewCost).toBe(300); // task-based: from previewAutoGeneration
    expect(result.summary.subtotal).toBe(400); // 100 equipment + 300 crew/tasks
  });

});
