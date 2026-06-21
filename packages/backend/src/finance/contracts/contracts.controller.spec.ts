import { Test, TestingModule } from '@nestjs/testing';
import { ContractsController } from './contracts.controller';
import { ContractsService } from './contracts.service';
import { ContractSigningService } from './services/contract-signing.service';

describe('ContractsController', () => {
  let controller: ContractsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContractsController],
      providers: [
        { provide: ContractsService, useValue: {} },
        { provide: ContractSigningService, useValue: {} },
      ],
    }).compile();

    controller = module.get<ContractsController>(ContractsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
