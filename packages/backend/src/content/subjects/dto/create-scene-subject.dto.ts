import { IsInt, IsOptional, IsString, IsEnum } from "class-validator";
import { SubjectPriority } from "@prisma/client";

export class CreateSceneSubjectDto {
    @IsInt()
    subject_id: number;

    @IsEnum(SubjectPriority)
    @IsOptional()
    priority?: SubjectPriority;

    @IsString()
    @IsOptional()
    notes?: string;
}
