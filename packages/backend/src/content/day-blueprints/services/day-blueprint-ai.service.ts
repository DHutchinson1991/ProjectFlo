import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { DayBlueprintDiffApplier, assertDiffShape } from '../diff';
import { DayBlueprintGuardrailsService } from './day-blueprint-guardrails.service';
import { DayBlueprintVersionsService } from './day-blueprint-versions.service';
import {
  ApplyDayBlueprintAiProposalDto,
  CreateDayBlueprintAiProposalDto,
  FinishDayBlueprintAiRunDto,
  StartDayBlueprintAiRunDto,
} from '../dto';
import { DayBlueprintAiRunsService } from './day-blueprint-ai-runs.service';

/**
 * Day Designer AI run + proposal surface.
 *
 * Mirrors the package AI run pattern: runs are rows with status, the
 * actual prompt/response transcripts live on disk. Proposals are
 * diff-first — this service records them and enforces guardrails on
 * apply. The concrete LLM integration is out of scope for this
 * scaffold and will hang off an existing AI runner module.
 */
@Injectable()
export class DayBlueprintAiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly guardrails: DayBlueprintGuardrailsService,
    private readonly versions: DayBlueprintVersionsService,
    private readonly applier: DayBlueprintDiffApplier,
    private readonly aiRuns: DayBlueprintAiRunsService,
  ) {}

  startRun(versionId: number, dto: StartDayBlueprintAiRunDto) {
    return this.prisma.dayBlueprintAiRun.create({
      data: {
        day_blueprint_version_id: versionId,
        run_kind: dto.run_kind,
        status: 'RUNNING',
        run_key: dto.run_key,
        prompt_summary: dto.prompt_summary,
        started_at: new Date(),
      },
    });
  }

  async finishRun(runId: number, dto: FinishDayBlueprintAiRunDto) {
    const run = await this.prisma.dayBlueprintAiRun.findUnique({ where: { id: runId } });
    if (!run) throw new NotFoundException('AI run not found');
    return this.prisma.dayBlueprintAiRun.update({
      where: { id: runId },
      data: {
        status: dto.error ? 'FAILED' : 'SUCCESS',
        error: dto.error,
        finished_at: new Date(),
      },
    });
  }

  async listRuns(versionId: number) {
    return this.prisma.dayBlueprintAiRun.findMany({
      where: { day_blueprint_version_id: versionId },
      orderBy: { created_at: 'desc' },
      include: { proposals: true },
    });
  }

  async getRun(runId: number) {
    const run = await this.prisma.dayBlueprintAiRun.findUnique({
      where: { id: runId },
      include: { proposals: { orderBy: { created_at: 'desc' } } },
    });
    if (!run) throw new NotFoundException('AI run not found');
    return run;
  }

  async getRunReport(runId: number, brandId: number) {
    return this.aiRuns.getRunReport(runId, brandId);
  }

  async listProposalsForVersion(versionId: number) {
    return this.prisma.dayBlueprintAiProposal.findMany({
      where: { ai_run: { day_blueprint_version_id: versionId } },
      orderBy: { created_at: 'desc' },
      include: { ai_run: true },
    });
  }

  /**
   * Preflight a diff without persisting anything. Returns structured
   * violations so the review dialog can show blocking issues before
   * the user commits. Shape errors are surfaced as violations, not
   * thrown, so the UI can render them inline.
   */
  async previewProposal(versionId: number, diff: unknown): Promise<{ violations: string[] }> {
    const violations = await this.guardrails.evaluateProposal(versionId, diff);
    return { violations };
  }

  async createProposal(dto: CreateDayBlueprintAiProposalDto) {
    const run = await this.prisma.dayBlueprintAiRun.findUnique({
      where: { id: dto.day_blueprint_ai_run_id },
    });
    if (!run) throw new NotFoundException('AI run not found');
    // Shape-validate on write so bad payloads never enter the table.
    assertDiffShape(dto.diff_json);
    return this.prisma.dayBlueprintAiProposal.create({
      data: {
        day_blueprint_ai_run_id: dto.day_blueprint_ai_run_id,
        diff_json: dto.diff_json as object,
        rationale_text: dto.rationale_text,
        status: 'PROPOSED',
      },
    });
  }

  async applyProposal(proposalId: number, dto: ApplyDayBlueprintAiProposalDto) {
    const proposal = await this.prisma.dayBlueprintAiProposal.findUnique({
      where: { id: proposalId },
      include: { ai_run: true },
    });
    if (!proposal) throw new NotFoundException('Proposal not found');
    if (proposal.status !== 'PROPOSED') {
      throw new BadRequestException('Proposal already resolved');
    }

    const versionId = proposal.ai_run.day_blueprint_version_id;
    const diff = assertDiffShape(proposal.diff_json);
    const violations = await this.guardrails.evaluateProposal(versionId, diff);
    if (violations.length > 0) {
      throw new BadRequestException(`Proposal blocked by guardrails: ${violations.join('; ')}`);
    }
    await this.versions.assertDraft(versionId);

    return this.prisma.$transaction(async (tx) => {
      await this.applier.apply(versionId, diff, tx);
      return tx.dayBlueprintAiProposal.update({
        where: { id: proposalId },
        data: {
          status: dto.status ?? 'APPLIED',
          applied_at: new Date(),
          applied_by_user_id: dto.applied_by_user_id,
        },
      });
    });
  }

  async rejectProposal(proposalId: number) {
    const proposal = await this.prisma.dayBlueprintAiProposal.findUnique({ where: { id: proposalId } });
    if (!proposal) throw new NotFoundException('Proposal not found');
    if (proposal.status !== 'PROPOSED') throw new BadRequestException('Proposal already resolved');
    return this.prisma.dayBlueprintAiProposal.update({
      where: { id: proposalId },
      data: { status: 'REJECTED' },
    });
  }
}
