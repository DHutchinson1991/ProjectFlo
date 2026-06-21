import { ConflictException } from '@nestjs/common';

/** Returned when branching is blocked because an open DRAFT already exists. */
export class ExistingDraftVersionException extends ConflictException {
  constructor(
    public readonly existingDraftVersionId: number,
    public readonly existingDraftVersionNumber: number,
  ) {
    super({
      message: 'A draft version already exists for this blueprint',
      existing_draft_version_id: existingDraftVersionId,
      existing_draft_version_number: existingDraftVersionNumber,
    });
  }
}
