import { PrismaClient, SceneType } from '@prisma/client';
import { SeedSummary } from '../utils/seed-logger';

const prisma = new PrismaClient();

const sceneTemplates = [
    {
        name: 'Ceremony',
        type: SceneType.MOMENTS,
        moments: [
            { name: 'Processional', order_index: 1, estimated_duration: 60 },
            { name: 'Vows', order_index: 2, estimated_duration: 45 },
            { name: 'Ring Exchange', order_index: 3, estimated_duration: 30 },
            { name: 'First Kiss', order_index: 4, estimated_duration: 15 },
            { name: 'Recessional', order_index: 5, estimated_duration: 60 },
        ],
        suggestedSubjects: [
            { name: 'Bride', isRequired: true },
            { name: 'Groom', isRequired: true },
            { name: 'Officiant', isRequired: false },
            { name: 'Rings', isRequired: true },
        ],
    },
    {
        name: 'Reception',
        type: SceneType.MOMENTS,
        moments: [
            { name: 'Grand Entrance', order_index: 1, estimated_duration: 45 },
            { name: 'First Dance', order_index: 2, estimated_duration: 120 },
            { name: 'Parent Dances', order_index: 3, estimated_duration: 90 },
            { name: 'Toasts', order_index: 4, estimated_duration: 60 },
            { name: 'Cake Cutting', order_index: 5, estimated_duration: 30 },
            { name: 'Bouquet Toss', order_index: 6, estimated_duration: 20 },
        ],
        suggestedSubjects: [
            { name: 'Bride', isRequired: true },
            { name: 'Groom', isRequired: true },
            { name: 'Cake', isRequired: false },
            { name: 'Bouquet', isRequired: false },
        ],
    },
    {
        name: 'Getting Ready',
        type: SceneType.MOMENTS,
        moments: [
            { name: 'Bridal Preparation', order_index: 1, estimated_duration: 60 },
            { name: 'Groom Preparation', order_index: 2, estimated_duration: 45 },
            { name: 'Details', order_index: 3, estimated_duration: 30 },
        ],
        suggestedSubjects: [
            { name: 'Bride', isRequired: true },
            { name: 'Groom', isRequired: true },
            { name: 'Dress Details', isRequired: false },
            { name: 'Jewelry', isRequired: false },
        ],
    },
];

async function seedSceneTemplates(): Promise<SeedSummary> {
    console.log('[MoonriseSceneTemplates] Seeding scene templates');

    const brand = await prisma.brands.findFirst({ where: { name: 'Moonrise Films' } });
    if (!brand) {
        throw new Error('Moonrise Films brand not found');
    }

    let created = 0;
    let updated = 0;
    let skipped = 0;

    const subjectTemplates = await prisma.subjectTemplate.findMany({
        where: {
            brand_id: brand.id,
            name: {
                in: Array.from(new Set(sceneTemplates.flatMap((scene) =>
                    scene.suggestedSubjects.map((subject) => subject.name),
                ))),
            },
        },
    });

    const subjectByName = new Map(subjectTemplates.map((subject) => [subject.name, subject]));

    for (const scene of sceneTemplates) {
        const existing = await prisma.sceneTemplate.findFirst({
            where: { brand_id: brand.id, name: scene.name },
        });

        let template;
        if (existing) {
            template = await prisma.sceneTemplate.update({
                where: { id: existing.id },
                data: {
                    brand_id: brand.id,
                    type: scene.type,
                    updated_at: new Date(),
                },
            });
            updated += 1;
        } else {
            template = await prisma.sceneTemplate.create({
                data: {
                    brand_id: brand.id,
                    name: scene.name,
                    type: scene.type,
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            });
            created += 1;
        }

        await prisma.sceneMomentTemplate.deleteMany({
            where: { scene_template_id: template.id },
        });
        await prisma.sceneTemplateSuggestedSubject.deleteMany({
            where: { scene_template_id: template.id },
        });

        if (scene.moments.length > 0) {
            await prisma.sceneMomentTemplate.createMany({
                data: scene.moments.map((moment) => ({
                    scene_template_id: template.id,
                    name: moment.name,
                    order_index: moment.order_index,
                    estimated_duration: moment.estimated_duration,
                    created_at: new Date(),
                    updated_at: new Date(),
                })),
            });
        }

        const suggestedSubjects = scene.suggestedSubjects
            .map((subject) => {
                const templateSubject = subjectByName.get(subject.name);
                if (!templateSubject) {
                    console.warn(`[MoonriseSceneTemplates] Missing subject template: ${subject.name}`);
                    return null;
                }

                return {
                    scene_template_id: template.id,
                    subject_template_id: templateSubject.id,
                    is_required: subject.isRequired,
                };
            })
            .filter((value): value is { scene_template_id: number; subject_template_id: number; is_required: boolean } => Boolean(value));

        if (suggestedSubjects.length > 0) {
            await prisma.sceneTemplateSuggestedSubject.createMany({
                data: suggestedSubjects,
            });
        }
    }

    skipped = sceneTemplates.length - (created + updated);
    console.log(`[MoonriseSceneTemplates] Done. Created: ${created}, Updated: ${updated}, Skipped: ${skipped}`);

    return { created, updated, skipped, total: sceneTemplates.length };
}

export default seedSceneTemplates;

if (require.main === module) {
    seedSceneTemplates()
        .catch((error) => {
            console.error('[MoonriseSceneTemplates] Seed failed:', error);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}
