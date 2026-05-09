import { Injectable, NotFoundException } from '@nestjs/common';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { DayBlueprintAiKnowledgeReport } from './day-blueprint-ai-run-logger';

@Injectable()
export class DayBlueprintAiRunsService {
  constructor(private readonly prisma: PrismaService) {}

  async getRunReport(runId: number, brandId: number): Promise<DayBlueprintAiKnowledgeReport | null> {
    const run = await this.prisma.dayBlueprintAiRun.findFirst({
      where: {
        id: runId,
        version: {
          day_blueprint: {
            brand_id: brandId,
          },
        },
      },
      select: {
        id: true,
        run_key: true,
      },
    });

    if (!run) {
      throw new NotFoundException('AI run not found');
    }

    if (!run.run_key) {
      return null;
    }

    const runDirectory = this.findRunDirectory(run.run_key);
    if (!runDirectory) {
      return null;
    }

    return this.readJson<DayBlueprintAiKnowledgeReport>(join(runDirectory, 'report.json'));
  }

  private findRunDirectory(runKey: string): string | null {
    if (!isSafeRunKey(runKey)) {
      return null;
    }

    const logRoot = join(resolveBackendRoot(), 'logs', 'day-designer-ai');
    if (!existsSync(logRoot)) {
      return null;
    }

    for (const dateDirectory of readdirSync(logRoot, { withFileTypes: true })) {
      if (!dateDirectory.isDirectory()) {
        continue;
      }

      const candidate = join(logRoot, dateDirectory.name, runKey);
      if (existsSync(candidate)) {
        return candidate;
      }
    }

    return null;
  }

  private readJson<T>(filePath: string): T | null {
    if (!existsSync(filePath)) {
      return null;
    }

    try {
      return JSON.parse(readFileSync(filePath, 'utf8')) as T;
    } catch {
      return null;
    }
  }
}

function isSafeRunKey(runKey: string): boolean {
  return /^[a-zA-Z0-9-]+$/.test(runKey);
}

function resolveBackendRoot(): string {
  const cwd = process.cwd();
  const nestedBackend = join(cwd, 'packages', 'backend');

  if (existsSync(join(cwd, 'src')) && existsSync(join(cwd, 'prisma'))) {
    return cwd;
  }

  if (existsSync(join(nestedBackend, 'src')) && existsSync(join(nestedBackend, 'prisma'))) {
    return nestedBackend;
  }

  return cwd;
}