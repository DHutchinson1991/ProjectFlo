import { Test, TestingModule } from '@nestjs/testing';
import { InquiryWizardConflictService } from './inquiry-wizard-conflict.service';
import { PrismaService } from '../../../platform/prisma/prisma.service';

const weddingDate = new Date('2026-08-15T12:00:00.000Z');

const buildPrisma = () => ({
    inquiry_wizard_submissions: {
        findFirst: jest.fn().mockResolvedValue({
            id: 1,
            brand_id: 10,
            inquiry: { id: 100, wedding_date: weddingDate },
        }),
    },
    inquiries: {
        findMany: jest.fn().mockResolvedValue([]),
    },
    projects: {
        findMany: jest.fn().mockResolvedValue([]),
    },
    brandMember: {
        findMany: jest.fn().mockResolvedValue([{ crew_id: 5 }]),
    },
    calendar_events: {
        findMany: jest.fn().mockResolvedValue([]),
    },
});

describe('InquiryWizardConflictService', () => {
    let service: InquiryWizardConflictService;
    let prisma: ReturnType<typeof buildPrisma>;

    beforeEach(async () => {
        prisma = buildPrisma();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                InquiryWizardConflictService,
                { provide: PrismaService, useValue: prisma },
            ],
        }).compile();

        service = module.get<InquiryWizardConflictService>(InquiryWizardConflictService);
    });

    describe('checkDateConflicts', () => {
        it('scopes inquiry conflicts to the requesting brand', async () => {
            await service.checkDateConflicts(1, 10);

            expect(prisma.inquiries.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        contact: { brand_id: 10 },
                    }),
                }),
            );
        });
    });

    describe('checkCrewConflicts', () => {
        it('only checks calendar events for active brand crew members', async () => {
            await service.checkCrewConflicts(1, 10);

            expect(prisma.brandMember.findMany).toHaveBeenCalledWith({
                where: { brand_id: 10, is_active: true },
                select: { crew_id: true },
            });
            expect(prisma.calendar_events.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        crew_id: { in: [5] },
                    }),
                }),
            );
        });

        it('returns no conflicts when the brand has no active crew', async () => {
            prisma.brandMember.findMany.mockResolvedValue([]);

            const result = await service.checkCrewConflicts(1, 10);

            expect(result).toEqual({ conflicts: [] });
            expect(prisma.calendar_events.findMany).not.toHaveBeenCalled();
        });
    });
});
