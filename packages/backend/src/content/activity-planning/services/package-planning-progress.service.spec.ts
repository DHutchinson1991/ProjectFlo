import { PackagePlanningProgressService } from './package-planning-progress.service';

describe('PackagePlanningProgressService', () => {
  it('updates an existing summary step instead of appending duplicate transitions', () => {
    const planningEvents = { emit: jest.fn() } as any;
    const service = new PackagePlanningProgressService(planningEvents);
    const summary = service.createSummary(42);

    service.recordStep({
      packageId: 42,
      totalSteps: 2,
      summary,
      step: 'descriptions',
      label: 'Enriching activity descriptions',
      status: 'started',
      stepIndex: 0,
    });

    service.recordStep({
      packageId: 42,
      totalSteps: 2,
      summary,
      step: 'descriptions',
      label: 'Enriching activity descriptions',
      status: 'completed',
      stepIndex: 0,
      data: { updatedActivityCount: 3 },
    });

    service.recordStep({
      packageId: 42,
      totalSteps: 2,
      summary,
      step: 'done',
      label: 'Planning complete',
      status: 'completed',
      stepIndex: 0,
    });

    expect(summary.steps).toEqual([
      expect.objectContaining({
        step: 'descriptions',
        status: 'completed',
        stepIndex: 0,
        data: { updatedActivityCount: 3 },
      }),
      expect.objectContaining({
        step: 'done',
        status: 'completed',
        stepIndex: 0,
      }),
    ]);
    expect(planningEvents.emit).toHaveBeenCalledTimes(3);
  });
});