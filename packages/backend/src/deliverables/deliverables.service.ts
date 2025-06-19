import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AuditService } from '../audit/audit.service';
import { PricingService } from '../pricing/pricing.service';
import { DeliverableType, MusicType } from '@prisma/client';

interface CreateDeliverableTemplateDto {
  name: string;
  description?: string;
  type: DeliverableType;
  default_music_type?: MusicType;
  delivery_timeline?: number;
  includes_music?: boolean;
  components?: {
    coverage_scene_id?: number;
    default_editing_style_id: number;
    order_index?: number;
    settings?: Record<string, string | number | boolean>;
  }[];
}

interface UpdateDeliverableTemplateDto {
  name?: string;
  description?: string;
  type?: DeliverableType;
  default_music_type?: MusicType;
  delivery_timeline?: number;
  includes_music?: boolean;
  components?: {
    coverage_scene_id?: number;
    default_editing_style_id: number;
    order_index?: number;
    settings?: Record<string, string | number | boolean>;
  }[];
}

@Injectable()
export class DeliverablesService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private pricingService: PricingService
  ) {}

  /**
   * Create a new deliverable template
   */
  async createTemplate(createDto: CreateDeliverableTemplateDto) {
    const { components, ...templateData } = createDto;
    
    const deliverable = await this.prisma.deliverables.create({
      data: {
        ...templateData,
        is_active: true,
        ...(components && components.length > 0 && {
          template_defaults: {
            create: components.map((comp) => ({
              coverage_scene_id: comp.coverage_scene_id || null,
              default_editing_style_id: comp.default_editing_style_id,
              default_target_minutes: comp.settings?.custom_duration as number || null,
              default_is_included: true
            }))
          }
        })
      }
    });

    return this.findTemplate(deliverable.id);
  }

  /**
   * Find all deliverable templates
   */
  async findAllTemplates() {
    return this.prisma.deliverables.findMany({
      where: { is_active: true },
      include: {
        template_defaults: {
          include: {
            coverage_scene: {
              select: {
                id: true,
                name: true,
                description: true
              }
            },
            default_editing_style: {
              select: {
                id: true,
                name: true,
                description: true
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  /**
   * Find a specific deliverable template by ID
   */
  async findTemplate(id: number) {
    const deliverable = await this.prisma.deliverables.findUnique({
      where: { id },
      include: {
        assigned_components: {
          include: {
            component: true
          },
          orderBy: { order_index: 'asc' }
        },
        template_defaults: {
          include: {
            coverage_scene: {
              select: {
                id: true,
                name: true,
                description: true
              }
            },
            default_editing_style: {
              select: {
                id: true,
                name: true,
                description: true
              }
            }
          }
        }
      }
    });

    if (!deliverable) {
      throw new NotFoundException(`Deliverable template with ID ${id} not found`);
    }

    return deliverable;
  }

  /**
   * Update deliverable template
   */
  async updateTemplate(id: number, updateData: UpdateDeliverableTemplateDto) {
    const { components, ...templateData } = updateData;

    // Update the template itself
    await this.prisma.deliverables.update({
      where: { id },
      data: templateData
    });

    // If components are provided, replace all components
    if (components !== undefined) {
      // Delete existing components
      await this.prisma.componentTemplateDefaults.deleteMany({
        where: { deliverable_id: id }
      });

      // Create new components
      if (components.length > 0) {
        await this.prisma.componentTemplateDefaults.createMany({
          data: components.map((comp) => ({
            deliverable_id: id,
            coverage_scene_id: comp.coverage_scene_id || null,
            default_editing_style_id: comp.default_editing_style_id,
            default_target_minutes: comp.settings?.custom_duration as number || null,
            default_is_included: true
          }))
        });
      }
    }

    return this.findTemplate(id);
  }

  /**
   * Delete deliverable template (soft delete)
   */
  async deleteTemplate(id: number) {
    await this.prisma.deliverables.update({
      where: { id },
      data: { is_active: false }
    });

    return { message: 'Deliverable template deactivated successfully' };
  }

  /**
   * Get available video components for configuration
   */
  async getAvailableVideoComponents() {
    return this.prisma.componentLibrary.findMany({
      orderBy: { name: 'asc' }
    });
  }

  /**
   * Get pricing for video components
   */
  async getComponentsPricing(componentIds: number[]): Promise<{
    totalPrice: number;
    pricing: Record<number, unknown>;
    message?: string;
  }> {
    if (!componentIds || componentIds.length === 0) {
      return {
        totalPrice: 0,
        pricing: {},
        message: 'No components specified for pricing'
      };
    }

    const pricingResult = await this.pricingService.calculateComponentPricing({
      component_ids: componentIds,
      component_count: componentIds.length
    });

    return {
      pricing: pricingResult,
      totalPrice: Object.values(pricingResult).reduce((sum, comp) => sum + comp.final_price, 0)
    };
  }

  /**
   * Get template pricing (for templates with default components)
   */
  async getTemplatePricing(templateId: number) {
    const template = await this.findTemplate(templateId);
    
    // For now, return basic template info
    // Future enhancement: calculate pricing based on default components
    return {
      template: {
        id: template.id,
        name: template.name,
        type: template.type,
        delivery_timeline: template.delivery_timeline,
        includes_music: template.includes_music
      },
      defaultComponents: template.template_defaults.length,
      message: 'Template pricing calculation - ready for component-based pricing implementation'
    };
  }

  /**
   * Create build deliverable instance from template
   */
  async createBuildDeliverable(buildId: number, deliverableId: number) {
    const buildDeliverable = await this.prisma.build_deliverables.create({
      data: {
        build_id: buildId,
        deliverable_id: deliverableId
      }
    });

    return this.getBuildDeliverable(buildDeliverable.id);
  }

  /**
   * Get build deliverable by ID
   */
  async getBuildDeliverable(id: number) {
    return this.prisma.build_deliverables.findUnique({
      where: { id },
      include: {
        deliverable: {
          select: {
            id: true,
            name: true,
            description: true,
            type: true,
            delivery_timeline: true,
            includes_music: true
          }
        },
        build_components: {
          include: {
            coverage_scene: {
              select: {
                id: true,
                name: true
              }
            },
            editing_style: {
              select: {
                id: true,
                name: true,
                description: true
              }
            }
          }
        }
      }
    });
  }

  /**
   * Get build deliverables for a specific build
   */
  async getBuildDeliverables(buildId: number) {
    return this.prisma.build_deliverables.findMany({
      where: { build_id: buildId },
      include: {
        deliverable: {
          select: {
            id: true,
            name: true,
            description: true,
            type: true,
            delivery_timeline: true,
            includes_music: true
          }
        },
        build_components: {
          include: {
            coverage_scene: {
              select: {
                id: true,
                name: true
              }
            },
            editing_style: {
              select: {
                id: true,
                name: true,
                description: true
              }
            }
          }
        }
      }
    });
  }

  /**
   * Get version history for a deliverable (using our audit service)
   */
  async getVersionHistory(deliverableId: number) {
    return this.auditService.getDeliverableVersionHistory(deliverableId);
  }

  /**
   * Get change log for a deliverable (using our audit service)
   */
  async getChangeLog(deliverableId: number) {
    return this.auditService.getDeliverableChangeLog(deliverableId);
  }

  /**
   * Update deliverable components (actual project-level components)
   */
  async updateDeliverableComponents(deliverableId: number, components: Array<{
    component_id: number;
    order_index: number;
    editing_style?: string;
    duration_override?: number;
  }>) {
    // Delete existing components
    await this.prisma.deliverableAssignedComponents.deleteMany({
      where: { deliverable_id: deliverableId }
    });

    // Create new components
    if (components.length > 0) {
      await this.prisma.deliverableAssignedComponents.createMany({
        data: components.map((comp) => ({
          deliverable_id: deliverableId,
          component_id: comp.component_id,
          order_index: comp.order_index,
          editing_style: comp.editing_style || null,
          duration_override: comp.duration_override || null
        }))
      });
    }

    return this.findTemplate(deliverableId);
  }

  /**
   * Get deliverable components (actual project-level components)
   */
  async getDeliverableComponents(deliverableId: number) {
    return this.prisma.deliverableAssignedComponents.findMany({
      where: { deliverable_id: deliverableId },
      include: {
        component: true
      },
      orderBy: { order_index: 'asc' }
    });
  }
}