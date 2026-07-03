import {
    IsBoolean,
    IsInt,
    IsObject,
    IsOptional,
    IsString,
} from 'class-validator';

export class InquiryWizardQuestionDto {
    @IsInt()
    order_index: number;

    @IsString()
    prompt: string;

    @IsString()
    field_type: string;

    @IsOptional()
    @IsString()
    field_key?: string;

    @IsOptional()
    @IsBoolean()
    required?: boolean;

    @IsOptional()
    @IsObject()
    options?: Record<string, unknown>;

    @IsOptional()
    @IsObject()
    condition_json?: Record<string, unknown>;

    @IsOptional()
    @IsString()
    help_text?: string;

    @IsOptional()
    @IsString()
    category?: string;

    /** DISCOVERY_CALL-stage only: groups questions into script sections (e.g. "The Connection"). */
    @IsOptional()
    @IsString()
    section?: string;

    /** DISCOVERY_CALL-stage only: suggested talk-track text shown to the studio user next to the prompt. */
    @IsOptional()
    @IsString()
    script_hint?: string;

    /** DISCOVERY_CALL-stage only: `both` | `internal` — whether the client can see this question if the guide is shared. */
    @IsOptional()
    @IsString()
    visibility?: string;
}
