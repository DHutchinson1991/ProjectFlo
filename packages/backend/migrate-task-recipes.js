const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function migrateTaskRecipesToWorkflows() {
  try {
    console.log("🔄 Migrating Task Recipes to Workflow Templates...\n");

    // Step 1: Get all existing task recipes for components
    const componentTaskRecipes = await prisma.componentTaskRecipe.findMany({
      include: {
        component: true,
      },
    });

    console.log(`Found ${componentTaskRecipes.length} component task recipes`);

    // Step 2: Group by component and create workflow templates
    const componentGroups = {};
    componentTaskRecipes.forEach((recipe) => {
      const componentId = recipe.component_id;
      if (!componentGroups[componentId]) {
        componentGroups[componentId] = {
          component: recipe.component,
          recipes: [],
        };
      }
      componentGroups[componentId].recipes.push(recipe);
    });

    // Step 3: Create workflow templates for each component that has task recipes
    for (const [componentId, group] of Object.entries(componentGroups)) {
      const component = group.component;

      // Create workflow template with unique name
      const workflowName = `${component.name} Tasks (ID: ${componentId})`;
      const workflowTemplate = await prisma.workflow_templates.create({
        data: {
          name: workflowName,
          description: `Auto-migrated workflow for ${component.name} component tasks`,
          is_active: true,
        },
      });

      console.log(`✅ Created workflow template: "${workflowTemplate.name}"`);

      // Create workflow stages for each task recipe
      for (const recipe of group.recipes) {
        // Create workflow stage
        const workflowStage = await prisma.workflow_stages.create({
          data: {
            workflow_template_id: workflowTemplate.id,
            name: recipe.task_template_name,
            description: `Task: ${recipe.task_template_name}`,
            order_index: recipe.order_index,
            is_active: true,
          },
        });

        // Find or create task template for this recipe
        let taskTemplate = await prisma.task_templates.findFirst({
          where: { name: recipe.task_template_name },
        });

        if (!taskTemplate) {
          // Create task template if it doesn't exist
          taskTemplate = await prisma.task_templates.create({
            data: {
              name: recipe.task_template_name,
              effort_hours: recipe.hours_required,
              pricing_type: "Hourly",
            },
          });
        }

        // Create task generation rule linking the stage to the task template
        await prisma.task_generation_rules.create({
          data: {
            workflow_stage_id: workflowStage.id,
            task_template_id: taskTemplate.id,
            is_required: true,
            component_type: component.type,
          },
        });
      }

      // Update component to link to the new workflow template
      await prisma.componentLibrary.update({
        where: { id: parseInt(componentId) },
        data: { workflow_template_id: workflowTemplate.id },
      });

      console.log(`   📋 Created ${group.recipes.length} workflow stages`);
      console.log(`   🔗 Linked component "${component.name}" to workflow\n`);
    }

    // Step 4: Handle other task recipes (deliverables, coverage scenes, editing styles)
    const otherTaskRecipes = await prisma.component_task_recipes.findMany({
      include: {
        deliverable: true,
        coverage_scene: true,
        editing_style: true,
        task_template: true,
      },
    });

    console.log(`Found ${otherTaskRecipes.length} other entity task recipes`);

    // Group by entity type and ID
    const entityGroups = {
      deliverable: {},
      coverage_scene: {},
      editing_style: {},
    };

    otherTaskRecipes.forEach((recipe) => {
      if (recipe.deliverable_id) {
        const id = recipe.deliverable_id;
        if (!entityGroups.deliverable[id]) {
          entityGroups.deliverable[id] = {
            entity: recipe.deliverable,
            recipes: [],
          };
        }
        entityGroups.deliverable[id].recipes.push(recipe);
      } else if (recipe.coverage_scene_id) {
        const id = recipe.coverage_scene_id;
        if (!entityGroups.coverage_scene[id]) {
          entityGroups.coverage_scene[id] = {
            entity: recipe.coverage_scene,
            recipes: [],
          };
        }
        entityGroups.coverage_scene[id].recipes.push(recipe);
      } else if (recipe.editing_style_id) {
        const id = recipe.editing_style_id;
        if (!entityGroups.editing_style[id]) {
          entityGroups.editing_style[id] = {
            entity: recipe.editing_style,
            recipes: [],
          };
        }
        entityGroups.editing_style[id].recipes.push(recipe);
      }
    });

    // Create workflows for each entity type
    for (const [entityType, groups] of Object.entries(entityGroups)) {
      for (const [entityId, group] of Object.entries(groups)) {
        if (group.recipes.length === 0) continue;

        const entity = group.entity;

        // Create workflow template with unique name
        const workflowName = `${entity.name} Tasks (${entityType.toUpperCase()}: ${entityId})`;
        const workflowTemplate = await prisma.workflow_templates.create({
          data: {
            name: workflowName,
            description: `Auto-migrated workflow for ${entity.name} ${entityType} tasks`,
            is_active: true,
          },
        });

        console.log(
          `✅ Created workflow template: "${workflowTemplate.name}" for ${entityType}`,
        );

        // Create workflow stages
        for (const recipe of group.recipes) {
          // Create workflow stage
          const workflowStage = await prisma.workflow_stages.create({
            data: {
              workflow_template_id: workflowTemplate.id,
              name: recipe.task_template.name,
              description: `Task: ${recipe.task_template.name}`,
              order_index: recipe.priority || 0,
              is_active: true,
            },
          });

          // Create task generation rule linking the stage to the existing task template
          await prisma.task_generation_rules.create({
            data: {
              workflow_stage_id: workflowStage.id,
              task_template_id: recipe.task_template.id,
              is_required: true,
            },
          });
        }

        // Update entity to link to workflow template
        const entityIdInt = parseInt(entityId);
        if (entityType === "deliverable") {
          await prisma.deliverable_templates.update({
            where: { id: entityIdInt },
            data: { workflow_template_id: workflowTemplate.id },
          });
        } else if (entityType === "coverage_scene") {
          await prisma.coverage_scenes.update({
            where: { id: entityIdInt },
            data: { workflow_template_id: workflowTemplate.id },
          });
        } else if (entityType === "editing_style") {
          await prisma.editing_styles.update({
            where: { id: entityIdInt },
            data: { workflow_template_id: workflowTemplate.id },
          });
        }

        console.log(`   📋 Created ${group.recipes.length} workflow stages`);
        console.log(
          `   🔗 Linked ${entityType} "${entity.name}" to workflow\n`,
        );
      }
    }

    console.log("✅ Migration completed successfully!");
    console.log("\n📊 Summary:");
    console.log(
      `   - Migrated ${componentTaskRecipes.length} component task recipes`,
    );
    console.log(
      `   - Migrated ${otherTaskRecipes.length} other entity task recipes`,
    );
    console.log(
      `   - Created ${Object.keys(componentGroups).length} component workflows`,
    );
    console.log(
      `   - Created workflows for deliverables, coverage scenes, and editing styles`,
    );
  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateTaskRecipesToWorkflows();
