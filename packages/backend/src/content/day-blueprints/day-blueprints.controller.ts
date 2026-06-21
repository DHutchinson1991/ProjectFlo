import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  MessageEvent,
  Headers,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Sse,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable, interval, map, merge, takeWhile } from 'rxjs';
import {
  ApplyDayBlueprintAiProposalDto,
  CloneDayBlueprintDto,
  CreateDayBlueprintActivityDto,
  CreateDayBlueprintAiProposalDto,
  CreateDayBlueprintDayDto,
  CreateDayBlueprintDto,
  CreateDayBlueprintLocationRoleDto,
  CreateDayBlueprintLockRuleDto,
  CreateDayBlueprintMomentActionDto,
  CreateDayBlueprintMomentDto,
  CreateDayBlueprintMomentPlacementDto,
  CreateDayBlueprintSpaceSlotDto,
  CreateDayBlueprintSubjectRoleDto,
  CreateDayBlueprintVersionDto,
  FinishDayBlueprintAiRunDto,
  GenerateDayBlueprintDayDto,
  GenerateDayBlueprintSpatialDto,
  LinkActivityLocationDto,
  PreviewDayBlueprintAiProposalDto,
  PublishDayBlueprintVersionDto,
  RefineDayBlueprintDayDto,
  StartDayBlueprintAiRunDto,
  UpdateDayBlueprintActivityDto,
  UpdateDayBlueprintDayDto,
  UpdateDayBlueprintDto,
  UpdateDayBlueprintLocationRoleDto,
  UpdateDayBlueprintLockRuleDto,
  UpdateDayBlueprintMomentActionDto,
  UpdateDayBlueprintMomentDto,
  UpdateDayBlueprintMomentPlacementDto,
  UpdateDayBlueprintSpaceSlotDto,
  UpdateDayBlueprintSubjectRoleDto,
} from './dto';
import {
  DayBlueprintAiGeneratorService,
  DayBlueprintAiRefinerService,
  DayBlueprintSpatialGeneratorService,
  DayBlueprintCompletenessService,
  DayBlueprintAiEventsService,
  DayBlueprintAiService,
  DayBlueprintAuthoringService,
  DayBlueprintLocationRolesService,
  DayBlueprintVersionsService,
  DayBlueprintsService,
} from './services';

const DAY_BLUEPRINT_AI_SSE_HEARTBEAT_MS = 15_000;

/**
 * REST surface for Day Designer authoring.
 * Routes are grouped:
 *   /api/day-blueprints                          — blueprint headers
 *   /api/day-blueprints/:id/versions             — version lifecycle
 *   /api/day-blueprints/versions/:versionId/*    — authoring children
 *   /api/day-blueprints/location-roles           — brand vocabulary
 *   /api/day-blueprints/ai/*                     — AI runs + proposals
 */
@Controller('api/day-blueprints')
@UseGuards(AuthGuard('jwt'))
export class DayBlueprintsController {
  constructor(
    private readonly blueprints: DayBlueprintsService,
    private readonly versions: DayBlueprintVersionsService,
    private readonly authoring: DayBlueprintAuthoringService,
    private readonly locationRoles: DayBlueprintLocationRolesService,
    private readonly ai: DayBlueprintAiService,
    private readonly aiGenerator: DayBlueprintAiGeneratorService,
    private readonly aiRefiner: DayBlueprintAiRefinerService,
    private readonly spatialGenerator: DayBlueprintSpatialGeneratorService,
    private readonly completeness: DayBlueprintCompletenessService,
    private readonly aiEvents: DayBlueprintAiEventsService,
  ) {}

  // ─── Location roles (brand vocabulary) ───────────────────────────
  // Declared before `:id` routes so the literal path segment wins.

  @Get('location-roles')
  listLocationRoles(@Headers('x-brand-context') brandHeader: string) {
    return this.locationRoles.findAll(this.brand(brandHeader));
  }

  @Post('location-roles')
  createLocationRole(
    @Headers('x-brand-context') brandHeader: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true })) dto: CreateDayBlueprintLocationRoleDto,
  ) {
    return this.locationRoles.create(this.brand(brandHeader), dto);
  }

  @Patch('location-roles/:id')
  updateLocationRole(
    @Headers('x-brand-context') brandHeader: string,
    @Param('id', ParseIntPipe) id: number,
    @Body(new ValidationPipe({ transform: true, whitelist: true })) dto: UpdateDayBlueprintLocationRoleDto,
  ) {
    return this.locationRoles.update(this.brand(brandHeader), id, dto);
  }

  @Delete('location-roles/:id')
  deleteLocationRole(
    @Headers('x-brand-context') brandHeader: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.locationRoles.remove(this.brand(brandHeader), id);
  }

  // ─── Blueprint headers ───────────────────────────────────────────

  @Get()
  list(
    @Headers('x-brand-context') brandHeader: string,
    @Query('include_seeded') includeSeeded?: string,
  ) {
    return this.blueprints.findAll(this.brand(brandHeader), {
      includeSeeded: includeSeeded === '1' || includeSeeded === 'true',
    });
  }

  @Post()
  create(
    @Headers('x-brand-context') brandHeader: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true })) dto: CreateDayBlueprintDto,
  ) {
    return this.blueprints.create(this.brand(brandHeader), dto);
  }

  @Get(':id')
  findOne(
    @Headers('x-brand-context') brandHeader: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.blueprints.findOne(this.brand(brandHeader), id);
  }

  @Patch(':id')
  update(
    @Headers('x-brand-context') brandHeader: string,
    @Param('id', ParseIntPipe) id: number,
    @Body(new ValidationPipe({ transform: true, whitelist: true })) dto: UpdateDayBlueprintDto,
  ) {
    return this.blueprints.update(this.brand(brandHeader), id, dto);
  }

  @Delete(':id')
  remove(
    @Headers('x-brand-context') brandHeader: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.blueprints.remove(this.brand(brandHeader), id);
  }

  @Post(':id/clone')
  clone(
    @Headers('x-brand-context') brandHeader: string,
    @Param('id', ParseIntPipe) id: number,
    @Body(new ValidationPipe({ transform: true, whitelist: true })) dto: CloneDayBlueprintDto,
  ) {
    return this.blueprints.cloneFromBlueprint(this.brand(brandHeader), id, dto);
  }

  // ─── Versions ────────────────────────────────────────────────────

  @Get(':id/versions')
  listVersions(
    @Headers('x-brand-context') brandHeader: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.versions.findAll(this.brand(brandHeader), id);
  }

  @Post(':id/versions')
  createVersion(
    @Headers('x-brand-context') brandHeader: string,
    @Param('id', ParseIntPipe) id: number,
    @Body(new ValidationPipe({ transform: true, whitelist: true })) dto: CreateDayBlueprintVersionDto,
  ) {
    return this.versions.createDraft(this.brand(brandHeader), id, dto);
  }

  @Get(':id/versions/:versionId')
  getVersion(
    @Headers('x-brand-context') brandHeader: string,
    @Param('id', ParseIntPipe) id: number,
    @Param('versionId', ParseIntPipe) versionId: number,
  ) {
    return this.versions.findOne(this.brand(brandHeader), id, versionId);
  }

  @Post(':id/versions/:versionId/publish')
  publishVersion(
    @Headers('x-brand-context') brandHeader: string,
    @Param('id', ParseIntPipe) id: number,
    @Param('versionId', ParseIntPipe) versionId: number,
    @Body(new ValidationPipe({ transform: true, whitelist: true })) dto: PublishDayBlueprintVersionDto,
  ) {
    return this.versions.publish(this.brand(brandHeader), id, versionId, dto);
  }

  @Post(':id/versions/:versionId/archive')
  archiveVersion(
    @Headers('x-brand-context') brandHeader: string,
    @Param('id', ParseIntPipe) id: number,
    @Param('versionId', ParseIntPipe) versionId: number,
  ) {
    return this.versions.archive(this.brand(brandHeader), id, versionId);
  }

  // ─── Authoring: days ─────────────────────────────────────────────

  @Post('versions/:versionId/days')
  createDay(
    @Param('versionId', ParseIntPipe) versionId: number,
    @Body(new ValidationPipe({ transform: true, whitelist: true })) dto: CreateDayBlueprintDayDto,
  ) {
    return this.authoring.createDay(versionId, dto);
  }

  @Patch('days/:dayId')
  updateDay(
    @Param('dayId', ParseIntPipe) dayId: number,
    @Body(new ValidationPipe({ transform: true, whitelist: true })) dto: UpdateDayBlueprintDayDto,
  ) {
    return this.authoring.updateDay(dayId, dto);
  }

  @Delete('days/:dayId')
  deleteDay(@Param('dayId', ParseIntPipe) dayId: number) {
    return this.authoring.deleteDay(dayId);
  }

  // ─── Authoring: activities ───────────────────────────────────────

  @Post('days/:dayId/activities')
  createActivity(
    @Param('dayId', ParseIntPipe) dayId: number,
    @Body(new ValidationPipe({ transform: true, whitelist: true })) dto: CreateDayBlueprintActivityDto,
  ) {
    return this.authoring.createActivity(dayId, dto);
  }

  @Patch('activities/:activityId')
  updateActivity(
    @Param('activityId', ParseIntPipe) activityId: number,
    @Body(new ValidationPipe({ transform: true, whitelist: true })) dto: UpdateDayBlueprintActivityDto,
  ) {
    return this.authoring.updateActivity(activityId, dto);
  }

  @Delete('activities/:activityId')
  deleteActivity(@Param('activityId', ParseIntPipe) activityId: number) {
    return this.authoring.deleteActivity(activityId);
  }

  @Post('activities/:activityId/locations')
  linkActivityLocation(
    @Param('activityId', ParseIntPipe) activityId: number,
    @Body(new ValidationPipe({ transform: true, whitelist: true })) dto: LinkActivityLocationDto,
  ) {
    return this.authoring.linkActivityLocation(activityId, dto);
  }

  @Delete('activity-locations/:linkId')
  unlinkActivityLocation(@Param('linkId', ParseIntPipe) linkId: number) {
    return this.authoring.unlinkActivityLocation(linkId);
  }

  // ─── Authoring: moments ──────────────────────────────────────────

  @Post('activities/:activityId/moments')
  createMoment(
    @Param('activityId', ParseIntPipe) activityId: number,
    @Body(new ValidationPipe({ transform: true, whitelist: true })) dto: CreateDayBlueprintMomentDto,
  ) {
    return this.authoring.createMoment(activityId, dto);
  }

  @Patch('moments/:momentId')
  updateMoment(
    @Param('momentId', ParseIntPipe) momentId: number,
    @Body(new ValidationPipe({ transform: true, whitelist: true })) dto: UpdateDayBlueprintMomentDto,
  ) {
    return this.authoring.updateMoment(momentId, dto);
  }

  @Delete('moments/:momentId')
  deleteMoment(@Param('momentId', ParseIntPipe) momentId: number) {
    return this.authoring.deleteMoment(momentId);
  }

  // ─── Authoring: subject roles ────────────────────────────────────

  @Post('versions/:versionId/subject-roles')
  addSubjectRole(
    @Param('versionId', ParseIntPipe) versionId: number,
    @Body(new ValidationPipe({ transform: true, whitelist: true })) dto: CreateDayBlueprintSubjectRoleDto,
  ) {
    return this.authoring.addSubjectRole(versionId, dto);
  }

  @Patch('subject-roles/:rowId')
  updateSubjectRole(
    @Param('rowId', ParseIntPipe) rowId: number,
    @Body(new ValidationPipe({ transform: true, whitelist: true })) dto: UpdateDayBlueprintSubjectRoleDto,
  ) {
    return this.authoring.updateSubjectRole(rowId, dto);
  }

  @Delete('subject-roles/:rowId')
  removeSubjectRole(@Param('rowId', ParseIntPipe) rowId: number) {
    return this.authoring.removeSubjectRole(rowId);
  }

  // ─── Authoring: space slots ──────────────────────────────────────

  @Post('versions/:versionId/space-slots')
  createSpaceSlot(
    @Param('versionId', ParseIntPipe) versionId: number,
    @Body(new ValidationPipe({ transform: true, whitelist: true })) dto: CreateDayBlueprintSpaceSlotDto,
  ) {
    return this.authoring.createSpaceSlot(versionId, dto);
  }

  @Patch('space-slots/:slotId')
  updateSpaceSlot(
    @Param('slotId', ParseIntPipe) slotId: number,
    @Body(new ValidationPipe({ transform: true, whitelist: true })) dto: UpdateDayBlueprintSpaceSlotDto,
  ) {
    return this.authoring.updateSpaceSlot(slotId, dto);
  }

  @Delete('space-slots/:slotId')
  deleteSpaceSlot(@Param('slotId', ParseIntPipe) slotId: number) {
    return this.authoring.deleteSpaceSlot(slotId);
  }

  // ─── Authoring: moment actions ───────────────────────────────────

  @Post('moments/:momentId/actions')
  createMomentAction(
    @Param('momentId', ParseIntPipe) momentId: number,
    @Body(new ValidationPipe({ transform: true, whitelist: true })) dto: CreateDayBlueprintMomentActionDto,
  ) {
    return this.authoring.createMomentAction(momentId, dto);
  }

  @Patch('moment-actions/:actionId')
  updateMomentAction(
    @Param('actionId', ParseIntPipe) actionId: number,
    @Body(new ValidationPipe({ transform: true, whitelist: true })) dto: UpdateDayBlueprintMomentActionDto,
  ) {
    return this.authoring.updateMomentAction(actionId, dto);
  }

  @Delete('moment-actions/:actionId')
  deleteMomentAction(@Param('actionId', ParseIntPipe) actionId: number) {
    return this.authoring.deleteMomentAction(actionId);
  }

  // ─── Authoring: moment placements ────────────────────────────────

  @Post('moments/:momentId/placements')
  createMomentPlacement(
    @Param('momentId', ParseIntPipe) momentId: number,
    @Body(new ValidationPipe({ transform: true, whitelist: true })) dto: CreateDayBlueprintMomentPlacementDto,
  ) {
    return this.authoring.createMomentPlacement(momentId, dto);
  }

  @Patch('moment-placements/:placementId')
  updateMomentPlacement(
    @Param('placementId', ParseIntPipe) placementId: number,
    @Body(new ValidationPipe({ transform: true, whitelist: true })) dto: UpdateDayBlueprintMomentPlacementDto,
  ) {
    return this.authoring.updateMomentPlacement(placementId, dto);
  }

  @Delete('moment-placements/:placementId')
  deleteMomentPlacement(@Param('placementId', ParseIntPipe) placementId: number) {
    return this.authoring.deleteMomentPlacement(placementId);
  }

  // ─── Authoring: lock rules ───────────────────────────────────────

  @Post('versions/:versionId/lock-rules')
  createLockRule(
    @Param('versionId', ParseIntPipe) versionId: number,
    @Body(new ValidationPipe({ transform: true, whitelist: true })) dto: CreateDayBlueprintLockRuleDto,
  ) {
    return this.authoring.createLockRule(versionId, dto);
  }

  @Patch('lock-rules/:ruleId')
  updateLockRule(
    @Param('ruleId', ParseIntPipe) ruleId: number,
    @Body(new ValidationPipe({ transform: true, whitelist: true })) dto: UpdateDayBlueprintLockRuleDto,
  ) {
    return this.authoring.updateLockRule(ruleId, dto);
  }

  @Delete('lock-rules/:ruleId')
  deleteLockRule(@Param('ruleId', ParseIntPipe) ruleId: number) {
    return this.authoring.deleteLockRule(ruleId);
  }

  // ─── AI runs + proposals ─────────────────────────────────────────

  @Post('versions/:versionId/ai-runs')
  startAiRun(
    @Param('versionId', ParseIntPipe) versionId: number,
    @Body(new ValidationPipe({ transform: true, whitelist: true })) dto: StartDayBlueprintAiRunDto,
  ) {
    return this.ai.startRun(versionId, dto);
  }

  @Get('versions/:versionId/ai-runs')
  listAiRuns(@Param('versionId', ParseIntPipe) versionId: number) {
    return this.ai.listRuns(versionId);
  }

  @Sse('versions/:versionId/ai-events')
  streamAiEvents(@Param('versionId', ParseIntPipe) versionId: number): Observable<MessageEvent> {
    const heartbeat$ = interval(DAY_BLUEPRINT_AI_SSE_HEARTBEAT_MS).pipe(
      map(() => ({ data: { versionId, step: 'heartbeat', status: 'running' } }) as MessageEvent),
    );
    const events$ = this.aiEvents.subscribe(versionId).pipe(
      map((event) => ({ data: event }) as MessageEvent),
    );
    return merge(events$, heartbeat$).pipe(
      takeWhile((msg) => {
        const data = msg.data as { step?: string };
        return !(data.step === 'done' || data.step === 'error');
      }, true),
    );
  }

  @Get('ai-runs/:runId/report')
  getAiRunReport(
    @Headers('x-brand-context') brandHeader: string,
    @Param('runId', ParseIntPipe) runId: number,
  ) {
    return this.ai.getRunReport(runId, this.brand(brandHeader));
  }

  @Get('ai-runs/:runId')
  getAiRun(@Param('runId', ParseIntPipe) runId: number) {
    return this.ai.getRun(runId);
  }

  @Get('versions/:versionId/ai-proposals')
  listAiProposals(@Param('versionId', ParseIntPipe) versionId: number) {
    return this.ai.listProposalsForVersion(versionId);
  }

  @Post('versions/:versionId/ai-preview')
  previewAiProposal(
    @Param('versionId', ParseIntPipe) versionId: number,
    @Body(new ValidationPipe({ transform: true, whitelist: true })) dto: PreviewDayBlueprintAiProposalDto,
  ) {
    return this.ai.previewProposal(versionId, dto.diff_json);
  }

  @Patch('ai-runs/:runId/finish')
  finishAiRun(
    @Param('runId', ParseIntPipe) runId: number,
    @Body(new ValidationPipe({ transform: true, whitelist: true })) dto: FinishDayBlueprintAiRunDto,
  ) {
    return this.ai.finishRun(runId, dto);
  }

  @Post('ai-runs/:runId/cancel')
  cancelAiRun(@Param('runId', ParseIntPipe) runId: number) {
    return this.aiGenerator.cancelRun(runId);
  }

  @Post('ai-proposals')
  createProposal(
    @Body(new ValidationPipe({ transform: true, whitelist: true })) dto: CreateDayBlueprintAiProposalDto,
  ) {
    return this.ai.createProposal(dto);
  }

  @Post('ai-proposals/:proposalId/apply')
  applyProposal(
    @Param('proposalId', ParseIntPipe) proposalId: number,
    @Body(new ValidationPipe({ transform: true, whitelist: true })) dto: ApplyDayBlueprintAiProposalDto,
  ) {
    return this.ai.applyProposal(proposalId, dto);
  }

  @Post('ai-proposals/:proposalId/reject')
  rejectProposal(@Param('proposalId', ParseIntPipe) proposalId: number) {
    return this.ai.rejectProposal(proposalId);
  }

  // ─── AI generator (one-shot day generation) ──────────────────────

  @Post('versions/:versionId/days/:dayId/ai-generate')
  generateDay(
    @Param('versionId', ParseIntPipe) versionId: number,
    @Param('dayId', ParseIntPipe) dayId: number,
    @Body(new ValidationPipe({ transform: true, whitelist: true })) dto: GenerateDayBlueprintDayDto,
  ) {
    return this.aiGenerator.generateDay(versionId, dayId, {
      prompt: dto.prompt,
      activityId: dto.activity_id,
      mode: dto.mode,
    });
  }

  // ─── Simulator: refine + completeness ────────────────────────────

  @Post('versions/:versionId/days/:dayId/ai-refine')
  refineDay(
    @Param('versionId', ParseIntPipe) versionId: number,
    @Param('dayId', ParseIntPipe) dayId: number,
    @Body(new ValidationPipe({ transform: true, whitelist: true })) dto: RefineDayBlueprintDayDto,
  ) {
    return this.aiRefiner.refineDay(versionId, dayId, {
      prompt: dto.prompt,
      assumptions: dto.assumptions,
      focus: dto.focus,
    });
  }

  @Post('versions/:versionId/days/:dayId/spatial-generate')
  generateSpatial(
    @Param('versionId', ParseIntPipe) versionId: number,
    @Param('dayId', ParseIntPipe) dayId: number,
    @Body(new ValidationPipe({ transform: true, whitelist: true })) dto: GenerateDayBlueprintSpatialDto,
  ) {
    return this.spatialGenerator.generateForDay(versionId, dayId, {
      activityId: dto.activity_id,
      momentId: dto.moment_id,
    });
  }

  @Get('versions/:versionId/days/:dayId/completeness')
  getCompleteness(
    @Param('versionId', ParseIntPipe) versionId: number,
    @Param('dayId', ParseIntPipe) dayId: number,
  ) {
    return this.completeness.computeForDay(versionId, dayId);
  }

  // ─── helpers ──────────────────────────────────────────────────────

  private brand(header: string): number {
    const brandId = parseInt(header, 10);
    if (isNaN(brandId)) throw new BadRequestException('Missing or invalid X-Brand-Context header');
    return brandId;
  }
}
