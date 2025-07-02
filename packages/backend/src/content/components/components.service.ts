import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { MusicType, ComponentType } from "@prisma/client";

@Injectable()
export class ComponentsService {
  constructor(private prisma: PrismaService) { }

  async create(createComponentDto: {
    name: string;
    type: ComponentType;
    description?: string;
    complexity_score?: number;
    estimated_duration?: number;
    default_editing_style?: string;
    base_task_hours?: number;
  }) {
    const { name, type, description, complexity_score, estimated_duration, default_editing_style, base_task_hours } = createComponentDto;
    if (!name || typeof name !== "string") {
      throw new BadRequestException("Component 'name' is required and must be a string.");
    }
    if (!type || !Object.values(ComponentType).includes(type as ComponentType)) {
      throw new BadRequestException(
        `Component 'type' is required and must be one of: ${Object.values(ComponentType).join(", ")}`
      );
    }
    const data: any = {
      name,
      type: type as ComponentType,
      description,
      complexity_score,
      estimated_duration,
      default_editing_style,
      base_task_hours,
    };
    Object.keys(data).forEach((key) => data[key] === undefined && delete data[key]);
    return this.prisma.componentLibrary.create({ data });
  }

  async findAll() {
    return this.prisma.componentLibrary.findMany({
      orderBy: { created_at: "desc" },
    });
  }

  async findOne(id: number) {
    const component = await this.prisma.componentLibrary.findUnique({
      where: { id },
    });

    if (!component) {
      throw new NotFoundException(`Component with ID ${id} not found`);
    }

    return component;
  }

  async findOneWithRelations(id: number) {
    const component = await this.prisma.componentLibrary.findUnique({
      where: { id },
      include: {
        coverage: {
          include: {
            coverage: true,
          },
        },
        music_options: true,
      },
    });

    if (!component) {
      throw new NotFoundException(`Component with ID ${id} not found`);
    }

    return component;
  }

  async findAllWithRelations() {
    return this.prisma.componentLibrary.findMany({
      include: {
        coverage: {
          include: {
            coverage: true,
          },
        },
        music_options: true,
      },
      orderBy: { created_at: "desc" },
    });
  }

  async update(
    id: number,
    updateComponentDto: {
      name?: string;
      type?: ComponentType;
      description?: string;
      complexity_score?: number;
      estimated_duration?: number;
      default_editing_style?: string;
      base_task_hours?: number;
    },
  ) {
    await this.findOne(id);

    return this.prisma.componentLibrary.update({
      where: { id },
      data: updateComponentDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.componentLibrary.delete({
      where: { id },
    });
  }

  async getComponentDependencies(id: number) {
    await this.findOne(id); // Validate component exists

    const dependencies = await this.prisma.componentDependency.findMany({
      where: {
        OR: [{ parent_component_id: id }, { dependent_component_id: id }],
      },
      include: {
        parent_component: {
          select: {
            id: true,
            name: true,
            type: true,
            complexity_score: true,
          },
        },
        dependent_component: {
          select: {
            id: true,
            name: true,
            type: true,
            complexity_score: true,
          },
        },
      },
    });

    return {
      depends_on: dependencies
        .filter((dep) => dep.dependent_component_id === id)
        .map((dep) => dep.parent_component),
      depended_by: dependencies
        .filter((dep) => dep.parent_component_id === id)
        .map((dep) => dep.dependent_component),
    };
  }

  // Coverage Scene Methods
  async getAvailableCoverageScenes() {
    return this.prisma.coverage.findMany({
      orderBy: { name: "asc" },
    });
  }

  async addCoverageScenes(
    componentId: number,
    coverageScenes: Array<{ coverage_scene_id: number }>,
  ) {
    await this.findOne(componentId);

    const sceneIds = coverageScenes.map((scene) => scene.coverage_scene_id);

    // Remove existing associations
    await this.prisma.componentCoverage.deleteMany({
      where: { component_id: componentId },
    });

    // Add new associations
    const associations = sceneIds.map((sceneId) => ({
      component_id: componentId,
      coverage_id: sceneId,
    }));

    await this.prisma.componentCoverage.createMany({
      data: associations,
    });

    return this.findOneWithRelations(componentId);
  }

  async removeCoverageScene(componentId: number, sceneId: number) {
    await this.findOne(componentId);

    await this.prisma.componentCoverage.deleteMany({
      where: {
        component_id: componentId,
        coverage_id: sceneId,
      },
    });

    return this.findOneWithRelations(componentId);
  }

  // Music Option Methods - Using the existing ComponentMusicOption structure
  async getAvailableMusicOptions() {
    // Return available music types since music_options are component-specific
    return [
      { id: 1, name: "NONE", type: "NONE" },
      { id: 2, name: "SCENE_MATCHED", type: "SCENE_MATCHED" },
      { id: 3, name: "ORCHESTRAL", type: "ORCHESTRAL" },
      { id: 4, name: "PIANO", type: "PIANO" },
      { id: 5, name: "MODERN", type: "MODERN" },
      { id: 6, name: "VINTAGE", type: "VINTAGE" },
    ];
  }

  async addMusicOptions(
    componentId: number,
    musicOptions: Array<{ music_type: MusicType; weight?: number }>,
  ) {
    await this.findOne(componentId);

    // Remove existing music options
    await this.prisma.componentMusicOption.deleteMany({
      where: { component_id: componentId },
    });

    // Add new music options
    const musicOptionData = musicOptions.map((option) => ({
      component_id: componentId,
      music_type: option.music_type,
      weight: option.weight || 5,
    }));

    await this.prisma.componentMusicOption.createMany({
      data: musicOptionData,
    });

    return this.findOneWithRelations(componentId);
  }

  async removeMusicOption(componentId: number, optionId: number) {
    await this.findOne(componentId);

    await this.prisma.componentMusicOption.delete({
      where: {
        id: optionId,
        component_id: componentId,
      },
    });

    return this.findOneWithRelations(componentId);
  }

  // Additional methods required by the controller
  async getComponentStats() {
    const totalComponents = await this.prisma.componentLibrary.count();
    const coverageLinkedCount = await this.prisma.componentLibrary.count({
      where: { is_coverage_linked: true },
    });
    const videoCount = await this.prisma.componentLibrary.count({
      where: { type: ComponentType.VIDEO },
    });
    const graphicsCount = await this.prisma.componentLibrary.count({
      where: { type: ComponentType.GRAPHICS },
    });
    const audioCount = await this.prisma.componentLibrary.count({
      where: { type: ComponentType.AUDIO },
    });
    const musicCount = await this.prisma.componentLibrary.count({
      where: { type: ComponentType.MUSIC },
    });

    return {
      total: totalComponents,
      coverageLinked: coverageLinkedCount,
      video: videoCount,
      byType: {
        [ComponentType.VIDEO]: videoCount,
        [ComponentType.GRAPHICS]: graphicsCount,
        [ComponentType.AUDIO]: audioCount,
        [ComponentType.MUSIC]: musicCount,
      }
    };
  }

  async findByType(type: string) {
    if (!type || !Object.values(ComponentType).includes(type as ComponentType)) {
      throw new BadRequestException(
        `Invalid component type. Must be one of: ${Object.values(ComponentType).join(", ")}`
      );
    }
    return this.prisma.componentLibrary.findMany({
      where: { type: type as ComponentType },
      orderBy: { name: "asc" },
    });
  }

  async getCoverageBasedComponents() {
    // Use VIDEO as a fallback since COVERAGE_BASED doesn't exist in the enum
    return this.findByType(ComponentType.VIDEO);
  }

  async getProductionComponents() {
    // Use GRAPHICS as a fallback since PRODUCTION doesn't exist in the enum
    return this.findByType(ComponentType.GRAPHICS);
  }

  async bulkUpdateTaskHours(
    updates: Array<{ id: number; base_task_hours: number }>,
  ) {
    const updatePromises = updates.map((update) =>
      this.prisma.componentLibrary.update({
        where: { id: update.id },
        data: { base_task_hours: update.base_task_hours },
      }),
    );

    await Promise.all(updatePromises);
    return { updated: updates.length };
  }

  async updateMusicOptionWeight(optionId: number, weight: number) {
    return this.prisma.componentMusicOption.update({
      where: { id: optionId },
      data: { weight },
    });
  }
}
