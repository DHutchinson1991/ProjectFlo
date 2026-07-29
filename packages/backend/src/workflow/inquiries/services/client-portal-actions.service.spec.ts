import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ClientPortalActionsService } from './client-portal-actions.service';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { ProposalLifecycleService } from '../../proposals/services/proposal-lifecycle.service';

describe('ClientPortalActionsService', () => {
  let service: ClientPortalActionsService;
  let prisma: {
    inquiries: { findFirst: jest.Mock; update: jest.Mock };
    projects: { findFirst: jest.Mock };
    service_packages: { findMany: jest.Mock };
    proposals: { findFirst: jest.Mock };
    package_requests: { create: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      inquiries: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      projects: {
        findFirst: jest.fn(),
      },
      service_packages: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      proposals: {
        findFirst: jest.fn(),
      },
      package_requests: {
        create: jest.fn().mockResolvedValue({ id: 1 }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientPortalActionsService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: ProposalLifecycleService,
          useValue: { respondToProposal: jest.fn().mockResolvedValue({ ok: true }) },
        },
      ],
    }).compile();

    service = module.get(ClientPortalActionsService);
  });

  it('resolves package options via project portal token after conversion', async () => {
    prisma.inquiries.findFirst.mockResolvedValue(null);
    prisma.projects.findFirst.mockResolvedValue({ inquiry_id: 55, brand_id: 3 });

    await service.getPackageOptions('project-portal-token');

    expect(prisma.service_packages.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ brand_id: 3 }),
      }),
    );
  });

  it('submits package requests via project portal token after conversion', async () => {
    prisma.inquiries.findFirst.mockResolvedValue(null);
    prisma.projects.findFirst.mockResolvedValue({ inquiry_id: 55, brand_id: 3 });

    await service.submitPackageRequest('project-portal-token', { notes: 'hello' });

    expect(prisma.package_requests.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ inquiry_id: 55 }),
    });
  });

  it('throws when portal token is unknown', async () => {
    prisma.inquiries.findFirst.mockResolvedValue(null);
    prisma.projects.findFirst.mockResolvedValue(null);

    await expect(service.getPackageOptions('missing-token')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
