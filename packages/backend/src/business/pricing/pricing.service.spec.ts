import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PricingService } from './pricing.service';
import { PrismaService } from '../../prisma/prisma.service';
import { TaskLibraryService } from '../task-library/task-library.service';

/* ---- helpers ---- */
const mockPrisma = () => ({
  service_packages: { findFirst: jest.fn() },
  job_roles: { findFirst: jest.fn() },
  brands: { findUnique: jest.fn() },
});

const mockTaskLib = () => ({
  previewAutoGeneration: jest.fn(),
});

/** Build a minimal package_day_operator fixture */
function makeOp(overrides: Record<string, any> = {}) {
  return {
    position_name: 'Lead',
    hours: 8,
    job_role_id: 1,
    contributor_id: 1,
    contributor: {
      id: 1,
      default_hourly_rate: null,
      contributor_job_roles: [],
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
      package_day_operators: [
        makeOp({ equipment: [sharedEquipment, sharedEquipment] }),
        makeOp({ equipment: [sharedEquipment] }),
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

  /* ----- 4-tier rate fallback ----- */
  describe('crew rate resolution', () => {
    const setupSingleOperator = async (op: ReturnType<typeof makeOp>) => {
      prisma.service_packages.findFirst.mockResolvedValue({
        id: 1,
        name: 'Test',
        package_day_operators: [op],
      });
      prisma.job_roles.findFirst.mockResolvedValue({
        payment_brackets: [{ hourly_rate: 15 }],
      });
      prisma.brands.findUnique.mockResolvedValue({ currency: 'USD' });
      taskLib.previewAutoGeneration.mockResolvedValue({
        summary: { total_generated_tasks: 0, total_estimated_hours: 0, total_estimated_cost: 0 },
        byPhase: {},
      });
      return service.estimatePackagePrice(1, 1, 1);
    };

    it('Tier 1: uses matched-role bracket', async () => {
      const op = makeOp({
        job_role_id: 5,
        contributor: {
          id: 1,
          default_hourly_rate: 10,
          contributor_job_roles: [
            { is_primary: false, job_role_id: 5, payment_bracket: { hourly_rate: 40, day_rate: 0 } },
          ],
        },
      });
      const result = await setupSingleOperator(op);
      expect(result.crew.operators[0].rate).toBe(40);
    });

    it('Tier 2: uses primary role bracket when matched role has no bracket', async () => {
      const op = makeOp({
        job_role_id: 5,
        contributor: {
          id: 1,
          default_hourly_rate: 10,
          contributor_job_roles: [
            { is_primary: false, job_role_id: 5, payment_bracket: null },
            { is_primary: true, job_role_id: 3, payment_bracket: { hourly_rate: 30, day_rate: 0 } },
          ],
        },
      });
      const result = await setupSingleOperator(op);
      expect(result.crew.operators[0].rate).toBe(30);
    });

    it('Tier 3: uses any bracket when primary has none', async () => {
      const op = makeOp({
        job_role_id: 5,
        contributor: {
          id: 1,
          default_hourly_rate: 10,
          contributor_job_roles: [
            { is_primary: true, job_role_id: 3, payment_bracket: null },
            { is_primary: false, job_role_id: 7, payment_bracket: { hourly_rate: 25, day_rate: 0 } },
          ],
        },
      });
      const result = await setupSingleOperator(op);
      expect(result.crew.operators[0].rate).toBe(25);
    });

    it('Tier 4: uses contributor default_hourly_rate as last resort', async () => {
      const op = makeOp({
        job_role_id: null,
        contributor: {
          id: 1,
          default_hourly_rate: 18,
          contributor_job_roles: [],
        },
      });
      const result = await setupSingleOperator(op);
      expect(result.crew.operators[0].rate).toBe(18);
    });

    it('Videographer fallback when no contributor assigned', async () => {
      const op = makeOp({ contributor: null, contributor_id: null });
      const result = await setupSingleOperator(op);
      expect(result.crew.operators[0].rate).toBe(15);
    });

    it('emits warning for $0 rate operator', async () => {
      prisma.job_roles.findFirst.mockResolvedValue(null); // no videographer fallback
      const op = makeOp({ contributor: null, contributor_id: null });
      prisma.service_packages.findFirst.mockResolvedValue({
        id: 1,
        name: 'Test',
        package_day_operators: [op],
      });
      prisma.brands.findUnique.mockResolvedValue({ currency: 'USD' });
      taskLib.previewAutoGeneration.mockResolvedValue({
        summary: { total_generated_tasks: 0, total_estimated_hours: 0, total_estimated_cost: 0 },
        byPhase: {},
      });
      const result = await service.estimatePackagePrice(1, 1, 1);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('0 rate');
    });
  });

  /* ----- Task cost error surfaces as warning ----- */
  it('surfaces task preview errors as warnings', async () => {
    prisma.service_packages.findFirst.mockResolvedValue({
      id: 1,
      name: 'Test',
      package_day_operators: [],
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
    const op = makeOp({
      hours: 10,
      contributor: {
        id: 1,
        default_hourly_rate: 20,
        contributor_job_roles: [],
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
      package_day_operators: [op],
    });
    prisma.job_roles.findFirst.mockResolvedValue(null);
    prisma.brands.findUnique.mockResolvedValue({ currency: 'USD' });
    taskLib.previewAutoGeneration.mockResolvedValue({
      summary: { total_generated_tasks: 5, total_estimated_hours: 10, total_estimated_cost: 300 },
      byPhase: { Post: [{ total_instances: 5, total_hours: 10, estimated_cost: 300 }] },
    });

    const result = await service.estimatePackagePrice(1, 1, 1);
    expect(result.summary.equipmentCost).toBe(100);
    expect(result.summary.crewCost).toBe(200); // 10h × $20
    expect(result.summary.taskCost).toBe(300);
    expect(result.summary.subtotal).toBe(600);
  });

  /* ----- Day rate logic ----- */
  it('uses day rate when hourly is 0', async () => {
    const op = makeOp({
      hours: 8,
      job_role_id: 5,
      contributor: {
        id: 1,
        default_hourly_rate: null,
        contributor_job_roles: [
          { is_primary: false, job_role_id: 5, payment_bracket: { hourly_rate: 0, day_rate: 350 } },
        ],
      },
    });
    prisma.service_packages.findFirst.mockResolvedValue({
      id: 1,
      name: 'Test',
      package_day_operators: [op],
    });
    prisma.job_roles.findFirst.mockResolvedValue(null);
    prisma.brands.findUnique.mockResolvedValue({ currency: 'USD' });
    taskLib.previewAutoGeneration.mockResolvedValue({
      summary: { total_generated_tasks: 0, total_estimated_hours: 0, total_estimated_cost: 0 },
      byPhase: {},
    });

    const result = await service.estimatePackagePrice(1, 1, 1);
    expect(result.crew.operators[0].rate).toBe(350);
    expect(result.crew.operators[0].cost).toBe(2800); // 350 × 8
  });
});
