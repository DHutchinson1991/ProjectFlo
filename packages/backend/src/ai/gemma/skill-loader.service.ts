import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Loads and caches Gemma skill prompt files from assets/gemma-skills/.
 * Resolves paths relative to __dirname — immune to process.cwd() changes.
 * Inject this instead of manually reading skill files in each service.
 */
@Injectable()
export class SkillLoaderService {
  private readonly logger = new Logger(SkillLoaderService.name);
  private readonly cache = new Map<string, string>();
  private readonly skillDir: string;
  private conventions: string | null = null;

  constructor() {
    // __dirname = .../src/ai/gemma → go up 3 levels to packages/backend/, then into assets/
    this.skillDir = path.resolve(__dirname, '..', '..', '..', 'assets', 'gemma-skills');
  }

  private getConventions(): string {
    if (this.conventions !== null) return this.conventions;
    const convPath = path.join(this.skillDir, '_conventions.md');
    try {
      this.conventions = fs.readFileSync(convPath, 'utf8').trim();
      this.logger.debug(`Loaded shared conventions (${this.conventions.length} chars)`);
    } catch {
      this.conventions = '';
    }
    return this.conventions;
  }

  /**
   * Load a skill prompt file by path relative to gemma-skills/
   * (e.g. 'planning/activity-casting.md').
   * Auto-prepends _conventions.md if present.
   * Caches on first read — subsequent calls for the same file return instantly.
   */
  load(filename: string): string {
    const cached = this.cache.get(filename);
    if (cached) return cached;

    const fullPath = path.join(this.skillDir, filename);
    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      const conventions = this.getConventions();
      const result = conventions ? `${conventions}\n\n---\n\n${content}` : content;
      this.cache.set(filename, result);
      this.logger.debug(`Loaded skill: ${filename} (${content.length} chars, +${conventions.length} conventions)`);
      return result;
    } catch (err) {
      this.logger.error(`Failed to load skill file: ${filename} at ${fullPath}`);
      throw err;
    }
  }
}
