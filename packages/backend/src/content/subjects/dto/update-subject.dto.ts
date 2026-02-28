import { IsString, IsOptional } from 'class-validator';
import { SubjectCategory } from '@prisma/client';

export class UpdateSubjectDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    category?: SubjectCategory;
}
