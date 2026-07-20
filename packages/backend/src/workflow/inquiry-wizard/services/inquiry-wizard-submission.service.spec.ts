import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { InquiryWizardStage } from '@prisma/client';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { InquiryTasksService } from '../../tasks/inquiry/services/inquiry-tasks.service';
import { InquiryWizardEstimateService } from './inquiry-wizard-estimate.service';
import { InquiryWizardLinkService } from './inquiry-wizard-link.service';
import { InquiryWizardSubmissionService } from './inquiry-wizard-submission.service';
import { InquiryWizardTemplateService } from './inquiry-wizard-template.service';

describe('InquiryWizardSubmissionService', () => {
    let service: InquiryWizardSubmissionService;
    let prisma: {
        inquiry_wizard_submissions: {
            findFirst: jest.Mock;
            create: jest.Mock;
            update: jest.Mock;
        };
    };

    beforeEach(async () => {
        prisma = {
            inquiry_wizard_submissions: {
                findFirst: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
            },
        };

        const moduleRef = await Test.createTestingModule({
            providers: [
                InquiryWizardSubmissionService,
                { provide: PrismaService, useValue: prisma },
                { provide: InquiryTasksService, useValue: { autoCompleteByName: jest.fn() } },
                { provide: InquiryWizardTemplateService, useValue: { getTemplateById: jest.fn() } },
                { provide: InquiryWizardEstimateService, useValue: { autoCreateDraftEstimate: jest.fn() } },
                { provide: InquiryWizardLinkService, useValue: { linkToExistingInquiry: jest.fn() } },
            ],
        }).compile();

        service = moduleRef.get(InquiryWizardSubmissionService);
    });

    describe('createDiscoveryCallSubmission (via createSubmission)', () => {
        const templateService = () => service['templateService'] as InquiryWizardTemplateService;

        beforeEach(() => {
            jest.spyOn(templateService(), 'getTemplateById').mockResolvedValue({
                id: 10,
                stage: InquiryWizardStage.DISCOVERY_CALL,
            } as never);
        });

        it('updates existing discovery submission instead of creating a duplicate', async () => {
            const existing = {
                id: 42,
                template: { stage: InquiryWizardStage.DISCOVERY_CALL },
            };
            prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue(existing);
            prisma.inquiry_wizard_submissions.update.mockResolvedValue({
                id: 42,
                call_notes: 'updated',
            });

            const result = await service.createSubmission(
                {
                    template_id: 10,
                    inquiry_id: 5,
                    responses: { q1: 'yes' },
                    call_notes: 'updated',
                },
                1,
            );

            expect(prisma.inquiry_wizard_submissions.create).not.toHaveBeenCalled();
            expect(prisma.inquiry_wizard_submissions.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 42 },
                    data: expect.objectContaining({ call_notes: 'updated' }),
                }),
            );
            expect(result).toEqual({ id: 42, call_notes: 'updated' });
        });
    });

    describe('updateSubmission', () => {
        it('rejects patching INTAKE-stage submissions', async () => {
            prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue({
                id: 1,
                brand_id: 1,
                template: { stage: InquiryWizardStage.INTAKE },
            });

            await expect(
                service.updateSubmission(1, { responses: { wiped: true } }, 1),
            ).rejects.toThrow(BadRequestException);

            expect(prisma.inquiry_wizard_submissions.update).not.toHaveBeenCalled();
        });

        it('allows patching DISCOVERY_CALL-stage submissions', async () => {
            prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue({
                id: 1,
                brand_id: 1,
                template: { stage: InquiryWizardStage.DISCOVERY_CALL },
            });
            prisma.inquiry_wizard_submissions.update.mockResolvedValue({ id: 1, call_notes: 'saved' });

            await service.updateSubmission(1, { call_notes: 'saved' }, 1);

            expect(prisma.inquiry_wizard_submissions.update).toHaveBeenCalled();
        });
    });
});
