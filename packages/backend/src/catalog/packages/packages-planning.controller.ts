import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Header,
  Post,
  Param,
  ParseIntPipe,
  Query,
  ValidationPipe,
  NotFoundException,
  UseGuards,
  HttpCode,
  Sse,
  MessageEvent,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { existsSync, readFileSync } from 'fs';
import { join, resolve } from 'path';
import { Observable, interval, map, merge, takeWhile } from 'rxjs';
import { ActivityPlannerService } from '../../content/activity-planning/services/activity-planner.service';
import { PlanningEventsService } from '../../content/activity-planning/services/planning-events.service';
import { PackageBlueprintResyncService } from './services/package-blueprint-resync.service';
import { PackageBlueprintSpatialService } from './services/package-blueprint-spatial.service';
import { PackagesService } from './packages.service';
import { ResyncPackageBlueprintDto } from './dto/resync-blueprint.dto';
import { GetPlanningLogQueryDto } from './dto/get-planning-log-query.dto';
import { BrandId } from '../../platform/auth/decorators/brand-id.decorator';

function requireBrandId(brandId: number | undefined): number {
  if (!brandId || Number.isNaN(brandId)) {
    throw new NotFoundException('Brand ID is required');
  }
  return brandId;
}

/** Heartbeat frequency for the planning-events SSE stream (ms). */
const PLANNING_SSE_HEARTBEAT_MS = 15_000;

/**
 * Planning ops scoped to an existing service package:
 * - replan activities
 * - resync scheduled scenes
 * - stream planning progress via SSE
 *
 * Split out from PackagesController so the CRUD surface stays
 * focused on package rows + versions + creation proxies.
 */
@Controller('api/packages')
@UseGuards(AuthGuard('jwt'))
export class PackagesPlanningController {
  constructor(
    private readonly activityPlanner: ActivityPlannerService,
    private readonly planningEvents: PlanningEventsService,
    private readonly blueprintResync: PackageBlueprintResyncService,
    private readonly blueprintSpatial: PackageBlueprintSpatialService,
    private readonly packagesService: PackagesService,
  ) {}

  /** Ensures the package exists and belongs to the requesting brand before mutating or streaming. */
  private async assertPackageOwnedByBrand(packageId: number, brandId: number | undefined): Promise<number> {
    const resolvedBrandId = requireBrandId(brandId);
    await this.packagesService.findOne(packageId, resolvedBrandId);
    return resolvedBrandId;
  }

  /**
   * GET /api/packages/:id/blueprint-spatial
   *
   * Blueprint-backed packages: seed moment placements from Day Designer,
   * sync base subject/camera positions, return package space slots.
   */
  @Get(':id/blueprint-spatial')
  async loadBlueprintSpatial(
    @Param('id', ParseIntPipe) id: number,
    @BrandId() brandId: number,
  ) {
    await this.assertPackageOwnedByBrand(id, brandId);
    return this.blueprintSpatial.loadForPackage(id);
  }

  @Post(':id/replan')
  @HttpCode(200)
  async replanActivities(
    @Param('id', ParseIntPipe) id: number,
    @BrandId() brandId: number,
  ) {
    await this.assertPackageOwnedByBrand(id, brandId);
    return this.activityPlanner.replanPackageActivities(id);
  }

  @Post(':id/resync')
  @HttpCode(200)
  async resyncScenes(
    @Param('id', ParseIntPipe) id: number,
    @BrandId() brandId: number,
  ) {
    await this.assertPackageOwnedByBrand(id, brandId);
    return this.activityPlanner.resyncScheduledScenes(id);
  }

  /**
   * GET /api/packages/:id/blueprint-resync-preview
   *
   * Structural comparison between the package's snapshotted blueprint version
   * and the latest published version (for drift UX before confirming resync).
   */
  @Get(':id/blueprint-resync-preview')
  async previewBlueprintResync(@Param('id', ParseIntPipe) id: number, @BrandId() brandId: number) {
    const resolvedBrandId = await this.assertPackageOwnedByBrand(id, brandId);
    return this.blueprintResync.previewResync(id, resolvedBrandId);
  }

  /**
   * POST /api/packages/:id/resync-blueprint
   *
   * Re-materializes the latest published Day Blueprint version into the
   * package's activity/moment/space-slot rows. Takes a safety PackageVersion
   * snapshot first so the studio can roll back. Returns `already_current: true`
   * when the package is already on the latest version.
   */
  @Post(':id/resync-blueprint')
  @HttpCode(200)
  async resyncBlueprint(
    @Param('id', ParseIntPipe) id: number,
    @BrandId() brandId: number,
    @Body(new ValidationPipe({ transform: true, whitelist: true })) dto: ResyncPackageBlueprintDto,
  ) {
    const resolvedBrandId = await this.assertPackageOwnedByBrand(id, brandId);
    return this.blueprintResync.resyncToLatestBlueprint(id, resolvedBrandId, dto);
  }

  @Get(':id/planning-log')
  @Header('Content-Type', 'text/plain; charset=utf-8')
  async findPlanningLog(
    @Param('id', ParseIntPipe) id: number,
    @BrandId() brandId: number,
    @Query(new ValidationPipe({ transform: true })) query: GetPlanningLogQueryDto,
  ): Promise<string> {
    await this.assertPackageOwnedByBrand(id, brandId);
    const filePath = resolvePlanningLogPath(query.path);
    if (!existsSync(filePath)) {
      throw new NotFoundException('Planning log not found');
    }
    return readFileSync(filePath, 'utf8');
  }

  @Sse(':id/planning-events')
  async streamPlanningEvents(
    @Param('id', ParseIntPipe) id: number,
    @BrandId() brandId: number,
  ): Promise<Observable<MessageEvent>> {
    await this.assertPackageOwnedByBrand(id, brandId);
    // Keep-alive heartbeat so proxies and browsers don't kill the stream
    // during long LLM phases (e.g. casting, which can exceed 6 minutes).
    // The client ignores heartbeat frames (step === 'heartbeat').
    const heartbeat$ = interval(PLANNING_SSE_HEARTBEAT_MS).pipe(
      map(
        () =>
          ({
            data: { packageId: id, step: 'heartbeat', status: 'running' },
          }) as MessageEvent,
      ),
    );

    const events$ = this.planningEvents.subscribe(id).pipe(
      map((event) => ({ data: event }) as MessageEvent),
    );

    return merge(events$, heartbeat$).pipe(
      takeWhile((msg) => {
        const data = msg.data as { step?: string; status?: string };
        return !(data.step === 'done' || data.step === 'error');
      }, true),
    );
  }
}

function resolvePlanningLogPath(requestedPath: string): string {
  const backendRoot = resolveBackendRoot();
  const logsRoot = join(backendRoot, 'logs');
  const candidate = resolve(requestedPath);
  const normalizedLogsRoot = `${resolve(logsRoot)}${process.platform === 'win32' ? '\\' : '/'}`.toLowerCase();
  const normalizedCandidate = candidate.toLowerCase();

  if (!normalizedCandidate.startsWith(normalizedLogsRoot) && normalizedCandidate !== resolve(logsRoot).toLowerCase()) {
    throw new BadRequestException('Planning log path must resolve under backend logs');
  }

  return candidate;
}

function resolveBackendRoot(): string {
  const cwd = process.cwd();
  if (existsSync(join(cwd, 'src')) && existsSync(join(cwd, 'prisma'))) {
    return cwd;
  }

  const nestedBackend = join(cwd, 'packages', 'backend');
  if (existsSync(join(nestedBackend, 'src')) && existsSync(join(nestedBackend, 'prisma'))) {
    return nestedBackend;
  }

  return cwd;
}
