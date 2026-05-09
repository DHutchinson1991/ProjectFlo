import { IsEnum, IsInt, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';
import { DayBlueprintAiProposalStatus, DayBlueprintAiRunKind } from '@prisma/client';

export class StartDayBlueprintAiRunDto {
  @IsEnum(DayBlueprintAiRunKind) run_kind!: DayBlueprintAiRunKind;
  @IsOptional() @IsString() @MaxLength(2000) prompt_summary?: string;
  @IsOptional() @IsString() @MaxLength(120) run_key?: string;
}

export class FinishDayBlueprintAiRunDto {
  @IsOptional() @IsString() @MaxLength(2000) error?: string;
}

export class CreateDayBlueprintAiProposalDto {
  @IsInt() day_blueprint_ai_run_id!: number;
  @IsObject() diff_json!: Record<string, unknown>;
  @IsOptional() @IsString() @MaxLength(4000) rationale_text?: string;
}

export class ApplyDayBlueprintAiProposalDto {
  @IsOptional() @IsEnum(DayBlueprintAiProposalStatus) status?: DayBlueprintAiProposalStatus;
  @IsOptional() @IsInt() applied_by_user_id?: number;
}

export class PreviewDayBlueprintAiProposalDto {
  @IsObject() diff_json!: Record<string, unknown>;
}
