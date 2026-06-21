import { Test, TestingModule } from '@nestjs/testing';
import { EstimatesController } from './estimates.controller';
import { EstimatesService } from './estimates.service';
import { EstimateLifecycleService } from './services/estimate-lifecycle.service';
import { EstimateSnapshotService } from './services/estimate-snapshot.service';

describe('EstimatesController', () => {
  let controller: EstimatesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EstimatesController],
      providers: [
        { provide: EstimatesService, useValue: {} },
        { provide: EstimateLifecycleService, useValue: {} },
        { provide: EstimateSnapshotService, useValue: {} },
      ],
    }).compile();

    controller = module.get<EstimatesController>(EstimatesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
