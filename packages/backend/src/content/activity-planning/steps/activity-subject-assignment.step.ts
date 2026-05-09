import { Injectable, Logger } from '@nestjs/common';
import { GemmaService } from '../../../ai/gemma/gemma.service';
import { SkillLoaderService } from '../../../ai/gemma/skill-loader.service';
import { StepLogger } from '../../../ai/orchestration/pipeline-logger';
import { PipelineStep } from '../../../ai/orchestration/pipeline.interfaces';

// ─── Public types ────────────────────────────────────────────────────

export interface SubjectAssignmentInput {
  eventType: string;
  activities: Array<{
    id: number;
    name: string;
    description?: string;
    durationMinutes?: number;
  }>;
  subjects: Array<{
    name: string;
    role: string | null;
    isGroup: boolean;
  }>;
}

export interface ActivitySubjectAssignment {
  activityId: number;
  activityName: string;
  reasoning: string;
  assignedSubjects: string[];
}

export interface SubjectAssignmentResult {
  activities: ActivitySubjectAssignment[];
}

// ─── Service ─────────────────────────────────────────────────────────

@Injectable()
export class ActivitySubjectAssignmentStep implements PipelineStep<SubjectAssignmentInput, SubjectAssignmentResult> {
  readonly name = 'ActivitySubjectAssignment';
  readonly type = 'llm' as const;
  private readonly logger = new Logger(ActivitySubjectAssignmentStep.name);
  private readonly skillPrompt: string;

  constructor(
    private readonly gemma: GemmaService,
    private readonly skills: SkillLoaderService,
  ) {
    this.skillPrompt = skills.load('planning/activity-subject-assignment.md');
    this.logger.log(`Loaded skill: planning/activity-subject-assignment.md (${this.skillPrompt.length} chars)`);
  }

  /**
   * Determine which subjects should be assigned to each activity.
   * Returns a list of activity → subject name[] assignments.
   */
  async execute(input: SubjectAssignmentInput, stepHandle?: StepLogger): Promise<SubjectAssignmentResult> {
    const userMessage = JSON.stringify(input, null, 2);
    const userContent = `Assign subjects to activities for this event. Return ONLY valid JSON matching the output schema.\n\n${userMessage}`;

    // Token budget: ~30 tokens per activity × subject (name + reasoning)
    const maxTokens = Math.min(7096, 256 + input.activities.length * input.subjects.length * 30);

    this.logger.log(
      `SubjectAssignment: ${input.activities.length} activities, ${input.subjects.length} subjects, maxTokens=${maxTokens}`,
    );

    stepHandle?.input({
      activityCount: input.activities.length,
      subjectCount: input.subjects.length,
      maxTokens,
    });

    const { reply, model, usage } = await this.gemma.chat({
      messages: [
        { role: 'system', content: this.skillPrompt },
        { role: 'user', content: userContent },
      ],
      maxTokens,
      temperature: 0.2,
      responseFormat: { type: 'json_object' },
    });

    stepHandle?.llmCall({
      skill: 'activity-subject-assignment',
      model,
      promptLength: userContent.length,
      responseLength: reply.length,
      usage: usage as any,
      rawPrompt: userContent,
      rawResponse: reply,
    });

    const result = this.parseResponse(reply, input);

    this.logger.log(
      `SubjectAssignment (${model}): assigned subjects to ${result.activities.length}/${input.activities.length} activities`,
    );

    stepHandle?.output({
      activityCount: result.activities.length,
      activities: result.activities.map((activity) => ({
        activityId: activity.activityId,
        activityName: activity.activityName,
        assignedSubjectCount: activity.assignedSubjects.length,
        assignedSubjects: activity.assignedSubjects,
      })),
    });
    stepHandle?.complete(`${result.activities.length} activities assigned`);

    return result;
  }

  private parseResponse(reply: string, input: SubjectAssignmentInput): SubjectAssignmentResult {
    const parsed = JSON.parse(reply);
    const activities: ActivitySubjectAssignment[] = [];
    const validSubjectNames = new Set(input.subjects.map((s) => s.name));
    const validSubjectNamesLower = new Map(input.subjects.map((s) => [s.name.toLowerCase(), s.name]));

    for (const inputAct of input.activities) {
      const matched = parsed.activities?.find(
        (a: any) => a.activityId === inputAct.id || a.activityName === inputAct.name,
      );

      const rawNames: string[] = matched?.assignedSubjects ?? [];
      const resolved = rawNames
        .map((n) => validSubjectNames.has(n) ? n : validSubjectNamesLower.get(n.toLowerCase()))
        .filter((n): n is string => n != null);

      const assignedSubjects = this.normalizeAssignedSubjects(inputAct, input.subjects, resolved);

      activities.push({
        activityId: inputAct.id,
        activityName: inputAct.name,
        reasoning: matched?.reasoning ?? 'Fallback — all subjects assigned',
        assignedSubjects,
      });
    }

    return { activities };
  }

  private normalizeAssignedSubjects(
    activity: SubjectAssignmentInput['activities'][number],
    subjects: SubjectAssignmentInput['subjects'],
    resolved: string[],
  ): string[] {
    const activityText = `${activity.name} ${activity.description ?? ''}`.toLowerCase();
    const allSubjectNames = subjects.map((subject) => subject.name);

    if (this.isUniversalActivity(activityText)) {
      return allSubjectNames;
    }

    let assigned = resolved.length > 0 ? resolved : allSubjectNames;

    if (this.isBridalPrepActivity(activityText)) {
      const brideSide = subjects
        .filter((subject) => this.isBrideSideSubject(subject.name, subject.role))
        .map((subject) => subject.name);
      if (brideSide.length > 0) {
        assigned = brideSide;
      }
    } else if (this.isGroomPrepActivity(activityText)) {
      const groomSide = subjects
        .filter((subject) => this.isGroomSideSubject(subject.name, subject.role))
        .map((subject) => subject.name);
      if (groomSide.length > 0) {
        assigned = groomSide;
      }
    }

    return this.expandGroupedAssignments(assigned, subjects);
  }

  private expandGroupedAssignments(
    assigned: string[],
    subjects: SubjectAssignmentInput['subjects'],
  ): string[] {
    const assignedLower = new Set(assigned.map((name) => name.toLowerCase()));
    const expanded = [...assigned];

    const addMatches = (matcher: (subject: SubjectAssignmentInput['subjects'][number]) => boolean) => {
      for (const subject of subjects) {
        if (!matcher(subject) || assignedLower.has(subject.name.toLowerCase())) {
          continue;
        }
        assignedLower.add(subject.name.toLowerCase());
        expanded.push(subject.name);
      }
    };

    if (assigned.some((name) => /bridesmaids?|bridal party/.test(name.toLowerCase()))) {
      addMatches((subject) => this.isBrideSideSubject(subject.name, subject.role));
    }

    if (assigned.some((name) => /groomsmen|groom party/.test(name.toLowerCase()))) {
      addMatches((subject) => this.isGroomSideSubject(subject.name, subject.role));
    }

    return expanded;
  }

  private isUniversalActivity(text: string): boolean {
    return /ceremony|reception|speeches|toasts?|dinner|first dance|cocktail hour/.test(text);
  }

  private isBridalPrepActivity(text: string): boolean {
    return /bridal prep|bride prep|bride's getting ready|getting ready \(bride\)/.test(text);
  }

  private isGroomPrepActivity(text: string): boolean {
    return /groom prep|groom's getting ready|getting ready \(groom\)/.test(text);
  }

  private isBrideSideSubject(name: string, role: string | null): boolean {
    const text = `${name} ${role ?? ''}`.toLowerCase();
    return /bride|bridesmaid|maid of honor|mother of bride|father of bride|flower girl/.test(text);
  }

  private isGroomSideSubject(name: string, role: string | null): boolean {
    const text = `${name} ${role ?? ''}`.toLowerCase();
    return /groom|groomsmen|best man|mother of groom|father of groom|ring bearer/.test(text);
  }
}
