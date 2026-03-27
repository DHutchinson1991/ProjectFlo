import { IsString, IsOptional, IsInt, Min, IsObject } from 'class-validator';

export class UpdateProposalDto {
    @IsString()
    @IsOptional()
    title?: string;

    @IsOptional()
    @IsObject()
    content?: Record<string, unknown>;

    @IsString()
    @IsOptional()
    status?: string;

    @IsInt()
    @Min(1)
    @IsOptional()
    version?: number;
}
