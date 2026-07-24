import { ForbiddenException } from '@nestjs/common';
import { ProjectsService } from './projects.service';

describe('ProjectsService.revertToInquiry', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalRevertFlag = process.env.ENABLE_DEV_PROJECT_REVERT;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    if (originalRevertFlag === undefined) {
      delete process.env.ENABLE_DEV_PROJECT_REVERT;
    } else {
      process.env.ENABLE_DEV_PROJECT_REVERT = originalRevertFlag;
    }
  });

  function createService() {
    const prisma = {
      $transaction: jest.fn(),
    };
    return new ProjectsService(prisma as never);
  }

  it('blocks revert in production unless explicitly enabled', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.ENABLE_DEV_PROJECT_REVERT;
    const service = createService();

    await expect(service.revertToInquiry(1, 10)).rejects.toBeInstanceOf(ForbiddenException);
    expect(prismaTransactionMock(service)).not.toHaveBeenCalled();
  });

  it('allows revert in production when ENABLE_DEV_PROJECT_REVERT is true', async () => {
    process.env.NODE_ENV = 'production';
    process.env.ENABLE_DEV_PROJECT_REVERT = 'true';
    const service = createService();
    const prisma = (service as unknown as { prisma: { $transaction: jest.Mock } }).prisma;
    prisma.$transaction.mockImplementation(async (fn: (tx: unknown) => unknown) =>
      fn({
        projects: {
          findFirst: jest.fn().mockResolvedValue(null),
        },
      }),
    );

    await expect(service.revertToInquiry(1, 10)).rejects.toThrow('Project 1 not found');
  });
});

function prismaTransactionMock(service: ProjectsService) {
  return (service as unknown as { prisma: { $transaction: jest.Mock } }).prisma.$transaction;
}
