import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ClientPortalActionsService } from './client-portal-actions.service';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { ProposalLifecycleService } from '../../proposals/services/proposal-lifecycle.service';

const buildPrisma = () => ({
    inquiries: {
        findFirst: jest.fn(),
    },
    service_packages: {
        findFirst: jest.fn(),
    },
    package_requests: {
        create: jest.fn(),
    },
});

describe('ClientPortalActionsService', () => {
    let service: ClientPortalActionsService;
    let prisma: ReturnType<typeof buildPrisma>;

    beforeEach(async () => {
        prisma = buildPrisma();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ClientPortalActionsService,
                { provide: PrismaService, useValue: prisma },
                { provide: ProposalLifecycleService, useValue: {} },
            ],
        }).compile();
        service = module.get(ClientPortalActionsService);
    });

    describe('submitPackageRequest', () => {
        it('rejects package IDs from another brand', async () => {
            prisma.inquiries.findFirst.mockResolvedValue({
                id: 10,
                contact: { brand_id: 1 },
            });
            prisma.service_packages.findFirst.mockResolvedValue(null);

            await expect(
                service.submitPackageRequest('portal-token', { selected_package_id: 99 }),
            ).rejects.toThrow(BadRequestException);
            expect(prisma.package_requests.create).not.toHaveBeenCalled();
        });

        it('accepts package IDs that belong to the inquiry brand', async () => {
            prisma.inquiries.findFirst.mockResolvedValue({
                id: 10,
                contact: { brand_id: 1 },
            });
            prisma.service_packages.findFirst.mockResolvedValue({ id: 5 });
            prisma.package_requests.create.mockResolvedValue({ id: 1 });

            await service.submitPackageRequest('portal-token', { selected_package_id: 5 });

            expect(prisma.package_requests.create).toHaveBeenCalledWith({
                data: {
                    inquiry_id: 10,
                    selected_package_id: 5,
                    customisations: Prisma.DbNull,
                    notes: null,
                },
            });
        });

        it('throws when portal token is invalid', async () => {
            prisma.inquiries.findFirst.mockResolvedValue(null);

            await expect(
                service.submitPackageRequest('bad-token', { selected_package_id: 5 }),
            ).rejects.toThrow(NotFoundException);
        });
    });
});
