-- DropForeignKey
ALTER TABLE "contributor_skill_rates" DROP CONSTRAINT "contributor_skill_rates_contributor_id_fkey";

-- DropForeignKey
ALTER TABLE "contributor_skill_rates" DROP CONSTRAINT "contributor_skill_rates_task_template_id_fkey";

-- DropForeignKey
ALTER TABLE "contributor_task_benchmarks" DROP CONSTRAINT "contributor_task_benchmarks_contributor_id_fkey";

-- DropForeignKey
ALTER TABLE "contributor_task_benchmarks" DROP CONSTRAINT "contributor_task_benchmarks_task_template_id_fkey";

-- DropForeignKey
ALTER TABLE "entity_default_tasks" DROP CONSTRAINT "entity_default_tasks_task_template_id_fkey";

-- DropForeignKey
ALTER TABLE "generated_task_log" DROP CONSTRAINT "generated_task_log_project_id_fkey";

-- DropForeignKey
ALTER TABLE "generated_task_log" DROP CONSTRAINT "generated_task_log_task_id_fkey";

-- DropForeignKey
ALTER TABLE "task_comments" DROP CONSTRAINT "task_comments_contributor_id_fkey";

-- DropForeignKey
ALTER TABLE "task_comments" DROP CONSTRAINT "task_comments_task_id_fkey";

-- DropForeignKey
ALTER TABLE "task_dependencies" DROP CONSTRAINT "task_dependencies_blocking_task_id_fkey";

-- DropForeignKey
ALTER TABLE "task_dependencies" DROP CONSTRAINT "task_dependencies_dependent_task_id_fkey";

-- DropForeignKey
ALTER TABLE "task_generation_rules" DROP CONSTRAINT "task_generation_rules_coverage_id_fkey";

-- DropForeignKey
ALTER TABLE "task_generation_rules" DROP CONSTRAINT "task_generation_rules_task_template_id_fkey";

-- DropForeignKey
ALTER TABLE "task_generation_rules" DROP CONSTRAINT "task_generation_rules_workflow_stage_id_fkey";

-- DropForeignKey
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_assigned_to_contributor_id_fkey";

-- DropForeignKey
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_build_scene_id_fkey";

-- DropForeignKey
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_project_id_fkey";

-- DropForeignKey
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_task_template_id_fkey";

-- DropForeignKey
ALTER TABLE "workflow_stages" DROP CONSTRAINT "workflow_stages_workflow_template_id_fkey";

-- DropTable
DROP TABLE "contributor_skill_rates";

-- DropTable
DROP TABLE "contributor_task_benchmarks";

-- DropTable
DROP TABLE "entity_default_tasks";

-- DropTable
DROP TABLE "generated_task_log";

-- DropTable
DROP TABLE "task_comments";

-- DropTable
DROP TABLE "task_dependencies";

-- DropTable
DROP TABLE "task_generation_rules";

-- DropTable
DROP TABLE "task_templates";

-- DropTable
DROP TABLE "tasks";

-- DropTable
DROP TABLE "workflow_stages";

-- DropEnum
DROP TYPE "task_comment_visibility";
