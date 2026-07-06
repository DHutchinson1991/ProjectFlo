/**
 * Builds a human-readable project name from contact names and event category.
 * Used when converting an inquiry to a project.
 */
export function buildInquiryProjectName(
  firstName: string | null,
  lastName: string | null,
  eventCategory: string | null,
): string {
  const name = [firstName, lastName].filter(Boolean).join(' & ');
  const category = eventCategory?.trim() || 'Wedding';
  return `${name}'s ${category}`;
}
