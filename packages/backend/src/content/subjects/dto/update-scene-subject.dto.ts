import { IsEnum, IsOptional, IsString } from "class-validator";
import { SubjectPriority } from "@prisma/client";

export class UpdateSceneSubjectDto {
    @IsEnum(SubjectPriority)
    @IsOptional()
    priority?: SubjectPriority;

    @IsString()
    @IsOptional()
    notes?: string;
}
