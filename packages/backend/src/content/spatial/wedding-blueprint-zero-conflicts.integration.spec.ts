import { TestingModule } from '@nestjs/testing';
import { ScenePreparationService } from '../scene-preparation/services/scene-preparation.service';
import { PrismaService } from '../../platform/prisma/prisma.service';
import {
  RUN_DB_INTEGRATION,
  bootstrapWeddingCeremonyPackage,
  cleanupWeddingCeremonyPackage,
  createIntegrationModule,
  runCeremonyBlockingPipeline,
  WeddingBlueprintFixture,
} from './wedding-blueprint-integration.harness';

const describeIntegration = RUN_DB_INTEGRATION ? describe : describe.skip;

describeIntegration('wedding blueprint DB integration', () => {
  let bootstrapPrisma: PrismaService;
  let module: TestingModule;
  let prisma: PrismaService;
  let fixture: WeddingBlueprintFixture;

  beforeAll(async () => {
    bootstrapPrisma = new PrismaService();
    await bootstrapPrisma.$connect();
    fixture = await bootstrapWeddingCeremonyPackage(bootstrapPrisma);

    module = await createIntegrationModule(bootstrapPrisma, fixture);
    prisma = module.get(PrismaService);
    await runCeremonyBlockingPipeline(module, fixture);
  }, 300_000);

  afterAll(async () => {
    if (prisma && fixture) {
      await cleanupWeddingCeremonyPackage(prisma, fixture);
    }
    if (module) {
      await module.close();
    }
    if (bootstrapPrisma) {
      await bootstrapPrisma.$disconnect();
    }
  });

  it('reports zero conflicts for every ceremony scene moment', async () => {
    const scenePrep = module.get(ScenePreparationService);
    const sceneMoments = await prisma.sceneMoment.findMany({
      where: { film_scene_id: fixture.sceneId },
      select: { id: true, name: true },
      orderBy: { order_index: 'asc' },
    });

    expect(sceneMoments.length).toBeGreaterThan(0);

    const failures: Array<{ moment: string; conflicts: unknown[] }> = [];

    for (const moment of sceneMoments) {
      const result = await scenePrep.listMomentConflicts(moment.id, 'package');
      if (result.conflicts.length > 0) {
        failures.push({ moment: moment.name ?? `moment-${moment.id}`, conflicts: result.conflicts });
      }
    }

    expect(failures).toEqual([]);
  });
});
