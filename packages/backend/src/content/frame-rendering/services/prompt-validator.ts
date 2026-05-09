/**
 * Deterministic post-processor for Gemma-generated SD prompts.
 *
 * Enforces CLIP token budget, strips leaked metadata, validates attention
 * weight syntax, and ensures the 3-section BREAK structure is correct.
 *
 * This is NOT an LLM — it's a rule-based cleanup function.
 */

export interface ValidatedPrompt {
  /** Cleaned prompt ready for CLIP encoding. */
  prompt: string;
  /** Per-section word counts after validation. */
  sectionWordCounts: [number, number, number];
  /** Total word count after validation. */
  totalWords: number;
  /** Warnings generated during validation (for logging). */
  warnings: string[];
  /** Whether the prompt was modified during validation. */
  wasModified: boolean;
}

/** Max words per BREAK section (CLIP truncates at ~77 tokens). */
const MAX_SECTION_WORDS: [number, number, number] = [18, 42, 22];
/** Absolute max total words. */
const MAX_TOTAL_WORDS = 75;

/** Patterns that indicate leaked metadata (should never appear in a CLIP prompt). */
const METADATA_PATTERNS = [
  /\d+\s*units?\s*from\s*subjects?/gi,
  /camera\s*positioned\s*from/gi,
  /focused\s*on\s+[\w\s]+and\s+[\w\s]+and/gi,  // "focused on X and Y and Z..."
  /\d+\s*units?\s*away/gi,
  /floorplan/gi,
  /order_index/gi,
  /source_activity/gi,
  /frameX|frameY|scale:/gi,
  /assignment\s*\d+/gi,
];

/** Style tokens that the pipeline injects separately — should not be duplicated in the prompt. */
const LEAKED_STYLE_TOKENS = [
  /DRAWING_STYLE/gi,
  /\bDRAWING\b(?!\s+(of|style|room|table))/gi,
  /\bSKETCH\b/gi,
  /\bMONOCHROME\b/gi,
  /soft\s+linework/gi,
  /delicate\s+shading/gi,
  /romantic\s+illustration/gi,
  /elegant\s+wedding\s+art/gi,
];

/**
 * Validate and clean a Gemma-generated SD prompt.
 */
export function validatePrompt(raw: string): ValidatedPrompt {
  const warnings: string[] = [];
  let wasModified = false;
  let text = raw.trim();

  // 1. Strip markdown code fences
  if (text.startsWith('```')) {
    text = text.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '').trim();
    wasModified = true;
    warnings.push('Stripped markdown code fences');
  }

  // 2. Strip wrapping quotes
  if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'"))) {
    text = text.slice(1, -1).trim();
    wasModified = true;
  }

  // 3. Remove leaked metadata patterns
  for (const pattern of METADATA_PATTERNS) {
    const before = text;
    text = text.replace(pattern, '').trim();
    if (text !== before) {
      wasModified = true;
      warnings.push(`Stripped metadata pattern: ${pattern.source}`);
    }
  }

  // 4. Remove leaked style tokens
  for (const pattern of LEAKED_STYLE_TOKENS) {
    const before = text;
    text = text.replace(pattern, '').trim();
    if (text !== before) {
      wasModified = true;
      warnings.push(`Stripped leaked style token: ${pattern.source}`);
    }
  }

  // 5. Clean up double commas / spaces from removals
  text = text.replace(/,\s*,+/g, ',').replace(/\s{2,}/g, ' ').replace(/^[,\s]+|[,\s]+$/g, '');

  // 6. Ensure 3-section BREAK structure
  const sections = text.split(/\s*BREAK\s*/);
  if (sections.length < 3) {
    warnings.push(`Only ${sections.length} BREAK section(s) found — expected 3`);
    // Pad with empty sections
    while (sections.length < 3) sections.push('');
  } else if (sections.length > 3) {
    warnings.push(`${sections.length} BREAK sections found — merging extras into section 2`);
    // Merge middle sections
    const merged = sections.slice(1, -1).join(', ');
    sections.splice(1, sections.length - 2, merged);
    wasModified = true;
  }

  // 7. Truncate sections that exceed word budget
  for (let i = 0; i < 3; i++) {
    const words = countWords(sections[i]);
    if (words > MAX_SECTION_WORDS[i]) {
      const trimmed = truncateToWords(sections[i], MAX_SECTION_WORDS[i]);
      warnings.push(`Section ${i + 1}: ${words} words → truncated to ${MAX_SECTION_WORDS[i]}`);
      sections[i] = trimmed;
      wasModified = true;
    }
  }

  // 8. Check total word count
  const totalWords = sections.reduce((sum, s) => sum + countWords(s), 0);
  if (totalWords > MAX_TOTAL_WORDS) {
    // Proportionally trim from the largest section
    warnings.push(`Total ${totalWords} words exceeds ${MAX_TOTAL_WORDS} — trimming largest section`);
    const excess = totalWords - MAX_TOTAL_WORDS;
    const counts = sections.map(countWords);
    const largestIdx = counts.indexOf(Math.max(...counts));
    sections[largestIdx] = truncateToWords(sections[largestIdx], counts[largestIdx] - excess);
    wasModified = true;
  }

  // 9. Validate attention weights — fix common Gemma mistakes
  for (let i = 0; i < 3; i++) {
    sections[i] = fixAttentionWeights(sections[i]);
  }

  // 10. Final cleanup
  const prompt = sections.map((s) => s.trim()).filter(Boolean).join(' BREAK ');
  const sectionWordCounts: [number, number, number] = [
    countWords(sections[0]),
    countWords(sections[1]),
    countWords(sections[2]),
  ];

  return {
    prompt,
    sectionWordCounts,
    totalWords: sectionWordCounts.reduce((a, b) => a + b, 0),
    warnings,
    wasModified,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────

function countWords(text: string): number {
  if (!text || !text.trim()) return 0;
  return text.trim().split(/\s+/).length;
}

function truncateToWords(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text;
  let result = words.slice(0, maxWords).join(' ');
  // Close any open parentheses
  const opens = (result.match(/\(/g) || []).length;
  const closes = (result.match(/\)/g) || []).length;
  if (opens > closes) {
    result += ')'.repeat(opens - closes);
  }
  return result;
}

/**
 * Fix common attention weight issues:
 * - Unclosed parentheses
 * - Weights outside 0.5-1.5 range (SDXL sweet spot)
 * - Nested double-parentheses ((text:1.2)) → (text:1.2)
 */
function fixAttentionWeights(text: string): string {
  // Fix double-nested parens: ((text:1.2)) → (text:1.2)
  let result = text.replace(/\(\(([^()]+:\d+\.?\d*)\)\)/g, '($1)');

  // Clamp weights to 0.5-1.5 range
  result = result.replace(/\(([^()]+):(\d+\.?\d*)\)/g, (_match, content, weight) => {
    const w = parseFloat(weight);
    const clamped = Math.max(0.5, Math.min(1.5, w));
    return `(${content}:${clamped.toFixed(1)})`;
  });

  // Close unclosed parens
  const opens = (result.match(/\(/g) || []).length;
  const closes = (result.match(/\)/g) || []).length;
  if (opens > closes) {
    result += ')'.repeat(opens - closes);
  }

  return result;
}
