import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { JsonValue } from "@prisma/client/runtime/library";

interface CreateVersionParams {
  contentId: number;
  changeDescription: string;
  changedById: number;
  changeType: string;
  previousVersion?: JsonValue;
  newVersion?: JsonValue;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new version entry when content is modified
   */
  async createContentVersion(params: CreateVersionParams) {
    const {
      contentId,
      changeDescription,
      changedById,
      changeType,
      previousVersion,
      newVersion,
    } = params;

    // Get the current version number for this content
    const latestVersion = await this.prisma.filmVersion.findFirst({
      where: { film_id: contentId },
      orderBy: { version_number: "desc" },
    });

    const nextVersionNum = latestVersion
      ? (parseInt(latestVersion.version_number) + 1).toString()
      : "1";

    // Get current content snapshot
    const content = await this.prisma.filmLibrary.findUnique({
      where: { id: contentId },
    });

    if (!content) {
      throw new Error("Content not found");
    }

    // Create version record
    const version = await this.prisma.filmVersion.create({
      data: {
        film_id: contentId,
        version_number: nextVersionNum,
        change_summary: changeDescription,
        changed_by_id: changedById,
        scenes_snapshot: JSON.parse(JSON.stringify(content)),
        pricing_snapshot: {},
      },
    });

    // Create detailed change log entry
    await this.prisma.filmChangeLog.create({
      data: {
        film_id: contentId,
        change_type: changeType,
        changed_by_id: changedById,
        old_value: previousVersion
          ? JSON.parse(JSON.stringify(previousVersion))
          : null,
        new_value: newVersion ? JSON.parse(JSON.stringify(newVersion)) : null,
      },
    });

    return version;
  }

  /**
   * Get version history for content
   */
  async getContentVersionHistory(contentId: number) {
    return this.prisma.filmVersion.findMany({
      where: { film_id: contentId },
      include: {
        changed_by: {
          select: {
            id: true,
            contact: {
              select: {
                first_name: true,
                last_name: true,
              },
            },
          },
        },
      },
      orderBy: { version_number: "desc" },
    });
  }

  /**
   * Get detailed change log for content
   */
  async getContentChangeLog(contentId: number) {
    return this.prisma.filmChangeLog.findMany({
      where: { film_id: contentId },
      include: {
        changed_by: {
          select: {
            id: true,
            contact: {
              select: {
                first_name: true,
                last_name: true,
              },
            },
          },
        },
      },
      orderBy: { created_at: "desc" },
    });
  }

  /**
   * Get audit statistics for reporting
   */
  async getAuditStats(contentId?: number) {
    const whereClause = contentId ? { film_id: contentId } : {};

    const [totalVersions, totalChanges] = await Promise.all([
      this.prisma.filmVersion.count({ where: whereClause }),
      this.prisma.filmChangeLog.count({ where: whereClause }),
    ]);

    return {
      totalVersions,
      totalChanges,
    };
  }
}
