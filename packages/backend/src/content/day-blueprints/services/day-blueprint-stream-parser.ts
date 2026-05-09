/**
 * Incremental parser for the streaming Day-Plan JSON the LLM emits.
 *
 * The LLM returns one JSON document of the shape:
 *   { "activities": [ { "name": "...", "moments": [ { "name": "...", ... }, ... ] } ] }
 *
 * As text streams in token-by-token, callers feed each new chunk to
 * `feed(text)` and receive callbacks the moment a new activity name
 * or moment name becomes visible — well before the full document is
 * parseable.
 */

export interface DayPlanStreamCallbacks {
  onActivityStart?(activity: { index: number; name: string }): void;
  onMomentStart?(moment: { activityIndex: number; activityName: string; index: number; name: string }): void;
}

interface StackFrame {
  kind: '{' | '[';
  /** For arrays: the key on the parent object that opened this array. For objects: the key that opened this object on the parent. */
  parentKey: string | null;
  /** Running index inside this array, if `kind === '['`. */
  arrayIndex: number;
}

export class DayPlanStreamParser {
  private buffer = '';
  private cursor = 0;
  private readonly stack: StackFrame[] = [];
  private inString = false;
  private stringStart = -1;
  private escaping = false;
  /** Pending key for the topmost object — the most recently parsed string-key not yet matched to a value. */
  private pendingKey: string | null = null;
  /** A closed string awaiting classification (key vs value). Holds the decoded text. */
  private pendingString: string | null = null;

  private currentActivityIndex = -1;
  private currentActivityName = '';
  private currentMomentIndex = -1;

  constructor(private readonly callbacks: DayPlanStreamCallbacks) {}

  feed(chunk: string): void {
    if (!chunk) return;
    this.buffer += chunk;
    this.scan();
  }

  private scan(): void {
    while (this.cursor < this.buffer.length) {
      // If we have a string awaiting classification, try to classify it before doing anything else.
      if (this.pendingString !== null) {
        if (!this.tryClassifyPending()) return;
      }

      const ch = this.buffer[this.cursor];

      if (this.inString) {
        if (this.escaping) {
          this.escaping = false;
          this.cursor += 1;
          continue;
        }
        if (ch === '\\') {
          this.escaping = true;
          this.cursor += 1;
          continue;
        }
        if (ch === '"') {
          const raw = this.buffer.slice(this.stringStart + 1, this.cursor);
          this.inString = false;
          this.stringStart = -1;
          this.cursor += 1;
          this.pendingString = decodeJsonString(raw);
          continue;
        }
        this.cursor += 1;
        continue;
      }

      switch (ch) {
        case '"':
          this.inString = true;
          this.stringStart = this.cursor;
          this.cursor += 1;
          continue;
        case '{':
        case '[':
          this.openContainer(ch);
          this.cursor += 1;
          continue;
        case '}':
        case ']':
          this.closeContainer();
          this.cursor += 1;
          continue;
        default:
          this.cursor += 1;
          continue;
      }
    }
  }

  /**
   * Attempt to classify a closed string as either a key (followed by `:`) or
   * a value. Returns true once classification succeeds (or fails terminally),
   * false when we need more buffer to decide.
   */
  private tryClassifyPending(): boolean {
    let lookahead = this.cursor;
    while (lookahead < this.buffer.length && /\s/.test(this.buffer[lookahead])) lookahead += 1;
    if (lookahead >= this.buffer.length) return false;

    const value = this.pendingString!;
    this.pendingString = null;

    if (this.buffer[lookahead] === ':') {
      this.pendingKey = value;
      return true;
    }

    // It's a value — consult pendingKey.
    const key = this.pendingKey;
    this.pendingKey = null;
    if (key !== 'name') return true;

    const top = this.stack[this.stack.length - 1];
    const parentArray = this.stack[this.stack.length - 2];
    if (!top || top.kind !== '{' || !parentArray || parentArray.kind !== '[') return true;

    if (parentArray.parentKey === 'activities') {
      if (this.currentActivityIndex >= 0 && !this.currentActivityName) {
        this.currentActivityName = value;
        this.callbacks.onActivityStart?.({ index: this.currentActivityIndex, name: value });
      }
    } else if (parentArray.parentKey === 'moments') {
      if (this.currentMomentIndex >= 0) {
        this.callbacks.onMomentStart?.({
          activityIndex: this.currentActivityIndex,
          activityName: this.currentActivityName,
          index: this.currentMomentIndex,
          name: value,
        });
      }
    }
    return true;
  }

  private openContainer(ch: '{' | '['): void {
    if (ch === '[') {
      this.stack.push({ kind: '[', parentKey: this.pendingKey, arrayIndex: -1 });
      this.pendingKey = null;
      return;
    }

    const parent = this.stack[this.stack.length - 1];
    let indexInArray = -1;
    let parentKey: string | null = this.pendingKey;

    if (parent?.kind === '[') {
      parent.arrayIndex += 1;
      indexInArray = parent.arrayIndex;
      parentKey = parent.parentKey;
    }

    this.stack.push({ kind: '{', parentKey, arrayIndex: -1 });
    this.pendingKey = null;

    if (parent?.kind === '[' && parent.parentKey === 'activities') {
      this.currentActivityIndex = indexInArray;
      this.currentActivityName = '';
      this.currentMomentIndex = -1;
    } else if (parent?.kind === '[' && parent.parentKey === 'moments') {
      this.currentMomentIndex = indexInArray;
    }
  }

  private closeContainer(): void {
    this.stack.pop();
    this.pendingKey = null;
  }
}

function decodeJsonString(raw: string): string {
  if (!raw.includes('\\')) return raw;
  try {
    return JSON.parse(`"${raw}"`) as string;
  } catch {
    return raw;
  }
}
