import { Test, TestingModule } from '@nestjs/testing';
import { ContractsService } from './contracts.service';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { ContractTemplateVariablesService } from './services/contract-template-variables.service';
import { InquiryTasksService } from '../../workflow/tasks/inquiry/services/inquiry-tasks.service';

describe('ContractsService', () => {
  let service: ContractsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContractsService,
        { provide: PrismaService, useValue: {} },
        { provide: ContractTemplateVariablesService, useValue: {} },
        { provide: InquiryTasksService, useValue: {} },
      ],
    }).compile();

    service = module.get<ContractsService>(ContractsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
