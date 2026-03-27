-- Rename is_stage → is_task_group and drop stage_color on task_library
ALTER TABLE "task_library" RENAME COLUMN "is_stage" TO "is_task_group";
ALTER TABLE "task_library" DROP COLUMN "stage_color";

-- Rename is_stage → is_task_group and drop stage_color on inquiry_tasks
ALTER TABLE "inquiry_tasks" RENAME COLUMN "is_stage" TO "is_task_group";
ALTER TABLE "inquiry_tasks" DROP COLUMN "stage_color";
