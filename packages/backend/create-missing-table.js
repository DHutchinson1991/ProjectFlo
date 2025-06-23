const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function createMissingTable() {
  try {
    console.log("Creating missing task_generation_rules table...");

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS task_generation_rules (
        id SERIAL PRIMARY KEY,
        workflow_stage_id INTEGER NOT NULL,
        task_template_id INTEGER NOT NULL,
        component_type TEXT,
        coverage_scene_id INTEGER,
        is_required BOOLEAN NOT NULL DEFAULT true,
        auto_assign_to_role TEXT,
        conditions JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now(),
        FOREIGN KEY (workflow_stage_id) REFERENCES workflow_stages(id) ON DELETE CASCADE,
        FOREIGN KEY (task_template_id) REFERENCES task_templates(id) ON DELETE CASCADE,
        FOREIGN KEY (coverage_scene_id) REFERENCES coverage_scenes(id)
      );
    `;

    console.log("✅ task_generation_rules table created successfully!");

    // Also create generated_task_log table if it doesn't exist
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS generated_task_log (
        id SERIAL PRIMARY KEY,
        project_id INTEGER NOT NULL,
        task_generation_rule_id INTEGER NOT NULL,
        task_id INTEGER NOT NULL,
        generated_at TIMESTAMP NOT NULL DEFAULT now(),
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
      );
    `;

    console.log("✅ generated_task_log table created successfully!");

    // Add workflow_template_id columns to existing tables
    try {
      await prisma.$executeRaw`
        ALTER TABLE deliverables 
        ADD COLUMN IF NOT EXISTS workflow_template_id INTEGER REFERENCES workflow_templates(id);
      `;
      console.log("✅ Added workflow_template_id to deliverables table");
    } catch (error) {
      console.log(
        "⚠️ workflow_template_id column may already exist in deliverables",
      );
    }

    try {
      await prisma.$executeRaw`
        ALTER TABLE coverage_scenes 
        ADD COLUMN IF NOT EXISTS workflow_template_id INTEGER REFERENCES workflow_templates(id);
      `;
      console.log("✅ Added workflow_template_id to coverage_scenes table");
    } catch (error) {
      console.log(
        "⚠️ workflow_template_id column may already exist in coverage_scenes",
      );
    }

    try {
      await prisma.$executeRaw`
        ALTER TABLE editing_styles 
        ADD COLUMN IF NOT EXISTS workflow_template_id INTEGER REFERENCES workflow_templates(id);
      `;
      console.log("✅ Added workflow_template_id to editing_styles table");
    } catch (error) {
      console.log(
        "⚠️ workflow_template_id column may already exist in editing_styles",
      );
    }
  } catch (error) {
    console.error("Error creating tables:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createMissingTable();
