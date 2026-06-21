/** True when blueprint was created via the blank Day Designer wizard (not cloned from a template). */
export function isBlankAuthoringBlueprint(variant_tags?: Record<string, unknown> | null): boolean {
  return variant_tags?.blank_authoring === true;
}
