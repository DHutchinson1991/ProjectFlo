import { Test, TestingModule } from '@nestjs/testing';
import { InquiryWizardStage } from '@prisma/client';
import { ProjectPackagePrefillService } from './project-package-prefill.service';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { GeocodingService } from '../locations/geocoding.service';

const buildPrisma = () => ({
  inquiry_wizard_submissions: { findFirst: jest.fn() },
  inquiries: { findUnique: jest.fn() },
  projectLocationSlot: { findMany: jest.fn(), update: jest.fn() },
  locationsLibrary: { findFirst: jest.fn(), create: jest.fn() },
  projectDaySubject: { findMany: jest.fn(), update: jest.fn() },
});

describe('ProjectPackagePrefillService', () => {
  let service: ProjectPackagePrefillService;
  let prisma: ReturnType<typeof buildPrisma>;
  let geocoding: { geocodeAddress: jest.Mock };

  beforeEach(async () => {
    prisma = buildPrisma();
    geocoding = { geocodeAddress: jest.fn().mockResolvedValue(null) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectPackagePrefillService,
        { provide: PrismaService, useValue: prisma },
        { provide: GeocodingService, useValue: geocoding },
      ],
    }).compile();

    service = module.get(ProjectPackagePrefillService);
  });

  it('prefills ceremony location slot from INTAKE wizard responses', async () => {
    prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue({
      responses: { ceremony_location: '  St Marys Church  ' },
    });
    prisma.inquiries.findUnique.mockResolvedValue({
      contact: { first_name: 'Alex', last_name: 'Smith' },
    });
    prisma.projectLocationSlot.findMany.mockResolvedValue([
      {
        id: 11,
        activity_assignments: [{ project_activity: { name: 'Ceremony' } }],
      },
    ]);
    prisma.locationsLibrary.findFirst.mockResolvedValue({ id: 99 });
    prisma.projectLocationSlot.update.mockResolvedValue({});

    await service.prefillFromInquiryWizard(prisma as unknown as PrismaService, 5, 1);

    expect(prisma.inquiry_wizard_submissions.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          inquiry_id: 5,
          template: { stage: InquiryWizardStage.INTAKE },
        }),
      }),
    );
    expect(prisma.projectLocationSlot.update).toHaveBeenCalledWith({
      where: { id: 11 },
      data: { location_id: 99, name: 'St Marys Church' },
    });
  });

  it('maps bride/groom subject roles from wizard responses', async () => {
    prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue({
      responses: {
        contact_role: 'Bride',
        contact_first_name: 'Alex',
        contact_last_name: 'Smith',
        partner_name: 'Jordan Lee',
      },
    });
    prisma.inquiries.findUnique.mockResolvedValue({
      contact: { first_name: 'Ignored', last_name: 'Contact' },
    });
    prisma.projectLocationSlot.findMany.mockResolvedValue([]);
    prisma.projectDaySubject.findMany.mockResolvedValue([
      { id: 1, name: 'Bride', order_index: 0 },
      { id: 2, name: 'Groom', order_index: 1 },
    ]);
    prisma.projectDaySubject.update.mockResolvedValue({});

    await service.prefillFromInquiryWizard(prisma as unknown as PrismaService, 5, null);

    expect(prisma.projectDaySubject.update).toHaveBeenCalledTimes(2);
    expect(prisma.projectDaySubject.update).toHaveBeenNthCalledWith(1, {
      where: { id: 1 },
      data: { real_name: 'Alex Smith' },
    });
    expect(prisma.projectDaySubject.update).toHaveBeenNthCalledWith(2, {
      where: { id: 2 },
      data: { real_name: 'Jordan Lee' },
    });
  });

  it('skips subject prefill when contact role is prefer not to say', async () => {
    prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue({
      responses: { contact_role: 'prefer not to say', contact_first_name: 'Alex' },
    });
    prisma.inquiries.findUnique.mockResolvedValue({
      contact: { first_name: 'Alex', last_name: 'Smith' },
    });
    prisma.projectLocationSlot.findMany.mockResolvedValue([]);

    await service.prefillFromInquiryWizard(prisma as unknown as PrismaService, 5, 1);

    expect(prisma.projectDaySubject.findMany).not.toHaveBeenCalled();
  });
});
