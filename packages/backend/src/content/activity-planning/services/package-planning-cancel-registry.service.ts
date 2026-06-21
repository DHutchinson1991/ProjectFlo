import { Injectable } from '@nestjs/common';

/**
 * Holds an AbortController per in-flight package creation planning pipeline so
 * POST /api/packages/:id/ai-runs/:runId/cancel can abort coarse-grained work
 * (between planner steps / blocking moments).
 */
@Injectable()
export class PackagePlanningCancelRegistryService {
  private readonly controllers = new Map<number, AbortController>();

  attach(packageId: number): AbortSignal {
    this.detach(packageId);
    const controller = new AbortController();
    this.controllers.set(packageId, controller);
    return controller.signal;
  }

  detach(packageId: number): void {
    this.controllers.delete(packageId);
  }

  /** Signal cancellation for the active pipeline session, if any. */
  abort(packageId: number): boolean {
    const controller = this.controllers.get(packageId);
    if (!controller) {
      return false;
    }
    controller.abort();
    return true;
  }
}
