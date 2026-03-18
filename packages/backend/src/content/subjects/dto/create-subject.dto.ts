import { IsString, IsOptional, IsNumber, IsNotEmpty, IsBoolean } from 'class-validator';
import { SubjectCategory } from '@prisma/client';

export class CreateSubjectDto {
    @IsNumber()
    @IsOptional() // Optional in DTO - set by controller from URL
    film_id?: number;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    category: SubjectCategory;

    @IsOptional()
    @IsNumber()
    role_template_id?: number; // Link to a specific role template

    @IsBoolean()
    @IsOptional()
    is_custom?: boolean;
}
