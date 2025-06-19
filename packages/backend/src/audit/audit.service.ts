import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { JsonValue } from '@prisma/client/runtime/library';

interface CreateVersionParams {
  deliverableId: number;
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
   * Create a new version entry when a deliverable is modified
   */
  async createDeliverableVersion(params: CreateVersionParams) {
    const { deliverableId, changeDescription, changedById, changeType, previousVersion, newVersion } = params;

    // Get the current version number for this deliverable
    const latestVersion = await this.prisma.deliverableVersion.findFirst({
      where: { deliverable_id: deliverableId },
      orderBy: { version_number: 'desc' }
    });

    const nextVersionNum = latestVersion ? 
      (parseInt(latestVersion.version_number) + 1).toString() : 
      '1';

    // Get current deliverable snapshot
    const deliverable = await this.prisma.deliverables.findUnique({
      where: { id: deliverableId }
    });

    if (!deliverable) {
      throw new Error('Deliverable not found');
    }

    // Create version record
    const version = await this.prisma.deliverableVersion.create({
      data: {
        deliverable_id: deliverableId,
        version_number: nextVersionNum,
        change_summary: changeDescription,
        changed_by_id: changedById,
        components_snapshot: JSON.parse(JSON.stringify(deliverable)),
        pricing_snapshot: {}
      }
    });

    // Create detailed change log entry
    await this.prisma.deliverableChangeLog.create({
      data: {
        deliverable_id: deliverableId,
        change_type: changeType,
        changed_by_id: changedById,
        old_value: previousVersion ? JSON.parse(JSON.stringify(previousVersion)) : null,
        new_value: newVersion ? JSON.parse(JSON.stringify(newVersion)) : null
      }
    });

    return version;
  }

  /**
   * Get version history for a deliverable
   */
  async getDeliverableVersionHistory(deliverableId: number) {
    return this.prisma.deliverableVersion.findMany({
      where: { deliverable_id: deliverableId },
      include: {
        changed_by: {
          select: {
            id: true,
            contact: {
              select: {
                first_name: true,
                last_name: true
              }
            }
          }
        }
      },
      orderBy: { version_number: 'desc' }
    });
  }

  /**
   * Get detailed change log for a deliverable
   */
  async getDeliverableChangeLog(deliverableId: number) {
    return this.prisma.deliverableChangeLog.findMany({
      where: { deliverable_id: deliverableId },
      include: {
        changed_by: {
          select: {
            id: true,
            contact: {
              select: {
                first_name: true,
                last_name: true
              }
            }
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });
  }

  /**
   * Get audit statistics for reporting
   */
  async getAuditStats(deliverableId?: number) {
    const whereClause = deliverableId ? { deliverable_id: deliverableId } : {};

    const [totalVersions, totalChanges] = await Promise.all([
      this.prisma.deliverableVersion.count({ where: whereClause }),
      this.prisma.deliverableChangeLog.count({ where: whereClause })
    ]);

    return {
      totalVersions,
      totalChanges
    };
  }
}
