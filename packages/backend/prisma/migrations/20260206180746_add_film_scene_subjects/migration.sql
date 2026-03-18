-- CreateTable
CREATE TABLE "film_scene_subjects" (
    "id" SERIAL NOT NULL,
    "scene_id" INTEGER NOT NULL,
    "subject_id" INTEGER NOT NULL,
    "priority" "SubjectPriority" NOT NULL DEFAULT 'BACKGROUND',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "film_scene_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "film_scene_subjects_scene_id_idx" ON "film_scene_subjects"("scene_id");

-- CreateIndex
CREATE INDEX "film_scene_subjects_subject_id_idx" ON "film_scene_subjects"("subject_id");

-- CreateIndex
CREATE UNIQUE INDEX "film_scene_subjects_scene_id_subject_id_key" ON "film_scene_subjects"("scene_id", "subject_id");

-- AddForeignKey
ALTER TABLE "film_scene_subjects" ADD CONSTRAINT "film_scene_subjects_scene_id_fkey" FOREIGN KEY ("scene_id") REFERENCES "film_scenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_scene_subjects" ADD CONSTRAINT "film_scene_subjects_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "film_subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
