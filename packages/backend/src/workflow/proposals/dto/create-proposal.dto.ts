import { IsString, IsOptional, IsInt, Min, IsObject } from 'class-validator';

export class CreateProposalDto {
    @IsString()
    @IsOptional()
    title?: string = 'New Proposal';

    @IsOptional()
    @IsObject()
    content?: Record<string, unknown>;

    @IsString()
    @IsOptional()
    status?: string = 'Draft';

    @IsInt()
    @Min(1)
    @IsOptional()
    version?: number = 1;
}
