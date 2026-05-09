/**
 * Template description resolver for activity/moment descriptions.
 *
 * Descriptions may contain {{variable}} placeholders that resolve to
 * real subject names, location labels, or venue names at runtime.
 *
 * Supported variables (by convention):
 *   {{bride}}, {{groom}}, {{best_man}}, {{maid_of_honor}},
 *   {{father_of_bride}}, {{mother_of_bride}}, {{father_of_groom}}, {{mother_of_groom}},
 *   {{location}}, {{location_label}}
 *
 * Fallback: if a variable has no entry in the map, it is title-cased
 * from the key itself (e.g. "bride" → "Bride").
 */

const VAR_PATTERN = /\{\{(\w+)\}\}/g;

/** Title-case a snake_case or lowercase key: "maid_of_honor" → "Maid of Honor" */
function titleCase(key: string): string {
  return key
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * Resolve a template string by replacing `{{key}}` placeholders with values
 * from the provided variable map.
 *
 * @param template  - The raw template, e.g. "{{bride}} walks down the aisle"
 * @param variables - Map of variable name → resolved value, e.g. { bride: "Sarah" }
 * @returns Resolved string. Unknown variables fall back to their title-cased key name.
 *
 * @example
 * resolveTemplate("{{bride}} and {{groom}} share their first dance", { bride: "Sarah", groom: "Michael" })
 * // → "Sarah and Michael share their first dance"
 *
 * resolveTemplate("{{bride}} walks down the aisle", {})
 * // → "Bride walks down the aisle"
 */
export function resolveTemplate(
  template: string,
  variables: Record<string, string>,
): string {
  return template.replace(VAR_PATTERN, (_match, key: string) => {
    return variables[key] ?? titleCase(key);
  });
}

/**
 * Check whether a string contains any `{{variable}}` placeholders.
 */
export function hasTemplatePlaceholders(text: string): boolean {
  return VAR_PATTERN.test(text);
}
