import { IsObject } from 'class-validator';

export class UpdateSubmissionResponsesDto {
    @IsObject()
    responses: Record<string, unknown>;
}
