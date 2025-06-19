import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { MusicType, ComponentType } from '@prisma/client';

@Injectable()
export class ComponentsService {
  constructor(private prisma: PrismaService) {}

  async create(createComponentDto: {
    name: string;
    type: ComponentType;
    description?: string;
    complexity_score?: number;
    estimated_duration?: number;
    default_editing_style?: string;
    base_task_hours?: number;
  }) {
    return this.prisma.componentLibrary.create({
      data: createComponentDto,
    });
  }

  async findAll() {
    return this.prisma.componentLibrary.findMany({
      orderBy: { created_at: 'desc' },
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
        coverage_scenes: {
          include: {
            coverage_scene: true,
          },
        },
        music_options: true,
        component_tasks: true,
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
        coverage_scenes: {
          include: {
            coverage_scene: true,
          },
        },
        music_options: true,
        component_tasks: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async update(id: number, updateComponentDto: {
    name?: string;
    type?: ComponentType;
    description?: string;
    complexity_score?: number;
    estimated_duration?: number;
    default_editing_style?: string;
    base_task_hours?: number;
  }) {
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
        OR: [
          { parent_component_id: id },
          { dependent_component_id: id }
        ]
      },
      include: {
        parent_component: {
          select: {
            id: true,
            name: true,
            type: true,
            complexity_score: true
          }
        },
        dependent_component: {
          select: {
            id: true,
            name: true,
            type: true,
            complexity_score: true
          }
        }
      }
    });

    return {
      depends_on: dependencies
        .filter(dep => dep.dependent_component_id === id)
        .map(dep => dep.parent_component),
      depended_by: dependencies
        .filter(dep => dep.parent_component_id === id)
        .map(dep => dep.dependent_component)
    };
  }

  // Coverage Scene Methods
  async getAvailableCoverageScenes() {
    return this.prisma.coverage_scenes.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async addCoverageScenes(componentId: number, coverageScenes: Array<{coverage_scene_id: number}>) {
    await this.findOne(componentId);

    const sceneIds = coverageScenes.map(scene => scene.coverage_scene_id);

    // Remove existing associations
    await this.prisma.componentCoverageScene.deleteMany({
      where: { component_id: componentId },
    });

    // Add new associations
    const associations = sceneIds.map(sceneId => ({
      component_id: componentId,
      coverage_scene_id: sceneId,
    }));

    await this.prisma.componentCoverageScene.createMany({
      data: associations,
    });

    return this.findOneWithRelations(componentId);
  }

  async removeCoverageScene(componentId: number, sceneId: number) {
    await this.findOne(componentId);

    await this.prisma.componentCoverageScene.deleteMany({
      where: {
        component_id: componentId,
        coverage_scene_id: sceneId,
      },
    });

    return this.findOneWithRelations(componentId);
  }

  // Music Option Methods - Using the existing ComponentMusicOption structure
  async getAvailableMusicOptions() {
    // Return available music types since music_options are component-specific
    return [
      { id: 1, name: 'NONE', type: 'NONE' },
      { id: 2, name: 'SCENE_MATCHED', type: 'SCENE_MATCHED' },
      { id: 3, name: 'ORCHESTRAL', type: 'ORCHESTRAL' },
      { id: 4, name: 'PIANO', type: 'PIANO' },
      { id: 5, name: 'MODERN', type: 'MODERN' },
      { id: 6, name: 'VINTAGE', type: 'VINTAGE' },
    ];
  }

  async addMusicOptions(componentId: number, musicOptions: Array<{music_type: MusicType, weight?: number}>) {
    await this.findOne(componentId);

    // Remove existing music options
    await this.prisma.componentMusicOption.deleteMany({
      where: { component_id: componentId },
    });

    // Add new music options
    const musicOptionData = musicOptions.map(option => ({
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

  // Task Recipe Methods - Using the existing ComponentTaskRecipe structure
  async getAvailableTaskRecipes() {
    // Return available task templates
    return this.prisma.task_templates.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async addTaskRecipes(componentId: number, taskRecipes: Array<{task_template_name: string, hours_required: number, order_index?: number}>) {
    await this.findOne(componentId);

    // Remove existing task recipes
    await this.prisma.componentTaskRecipe.deleteMany({
      where: { component_id: componentId },
    });

    // Add new task recipes
    const taskRecipeData = taskRecipes.map((recipe, index) => ({
      component_id: componentId,
      task_template_name: recipe.task_template_name,
      hours_required: recipe.hours_required,
      order_index: recipe.order_index || index,
    }));

    await this.prisma.componentTaskRecipe.createMany({
      data: taskRecipeData,
    });

    return this.findOneWithRelations(componentId);
  }

  async removeTaskRecipe(componentId: number, taskRecipeId: number) {
    await this.findOne(componentId);

    await this.prisma.componentTaskRecipe.delete({
      where: {
        id: taskRecipeId,
        component_id: componentId,
      },
    });

    return this.findOneWithRelations(componentId);
  }

  // Additional methods required by the controller
  async getComponentStats() {
    const totalComponents = await this.prisma.componentLibrary.count();
    const coverageLinkedCount = await this.prisma.componentLibrary.count({
      where: { type: 'COVERAGE_LINKED' },
    });
    const editCount = await this.prisma.componentLibrary.count({
      where: { type: 'EDIT' },
    });

    return {
      total: totalComponents,
      coverageLinked: coverageLinkedCount,
      edit: editCount,
    };
  }

  async findByType(type: string) {
    return this.prisma.componentLibrary.findMany({
      where: { type: type as ComponentType },
      orderBy: { name: 'asc' },
    });
  }

  async getCoverageBasedComponents() {
    return this.findByType('COVERAGE_BASED');
  }

  async getProductionComponents() {
    return this.findByType('PRODUCTION');
  }

  async bulkUpdateTaskHours(updates: Array<{ id: number; base_task_hours: number }>) {
    const updatePromises = updates.map(update =>
      this.prisma.componentLibrary.update({
        where: { id: update.id },
        data: { base_task_hours: update.base_task_hours },
      })
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

  async updateTaskRecipe(recipeId: number, updates: { task_template_name?: string; hours_required?: number; order_index?: number }) {
    const updateData: { hours_required?: number; task_template_name?: string; order_index?: number } = {};
    if (updates.hours_required !== undefined) {
      updateData.hours_required = updates.hours_required;
    }
    if (updates.task_template_name !== undefined) {
      updateData.task_template_name = updates.task_template_name;
    }
    if (updates.order_index !== undefined) {
      updateData.order_index = updates.order_index;
    }

    return this.prisma.componentTaskRecipe.update({
      where: { id: recipeId },
      data: updateData,
    });
  }
}
