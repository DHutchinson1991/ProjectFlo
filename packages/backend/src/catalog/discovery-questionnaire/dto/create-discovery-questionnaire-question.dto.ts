import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateDiscoveryQuestionnaireQuestionDto {
    @IsInt() order_index: number;
    @IsOptional() @IsString() section?: string;
    @IsString() prompt: string;
    @IsOptional() @IsString() script_hint?: string;
    @IsString() field_type: string;
    @IsOptional() @IsString() field_key?: string;
    @IsOptional() @IsBoolean() required?: boolean;
    @IsOptional() options?: Record<string, unknown>;
    @IsOptional() @IsString() visibility?: string;
}
