/**
 * Filter discriminator: exactly one key is set.
 * Used by all project-snapshot services to identify the owning entity.
 */
export type OwnerFilter =
  | { projectId: number; inquiryId?: never }
  | { inquiryId: number; projectId?: never };
