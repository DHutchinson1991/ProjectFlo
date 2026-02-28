import { PrismaClient, SceneType } from '@prisma/client';
import { createSeedLogger, SeedSummary, SeedType } from '../utils/seed-logger';

const prisma = new PrismaClient();
const logger = createSeedLogger(SeedType.MOMENTS);

type MomentSeed = {
    name: string;
    order_index: number;
    estimated_duration: number;
};

type SceneSeed = {
    name: string;
    type: SceneType;
    moments: MomentSeed[];
    suggestedSubjects: { name: string; isRequired: boolean }[];
};

const sceneTemplates: SceneSeed[] = [
    {
        name: 'Ceremony',
        type: SceneType.MOMENTS,
        moments: [
            { name: 'Processional', order_index: 1, estimated_duration: 60 },
            { name: 'Vows', order_index: 2, estimated_duration: 45 },
            { name: 'Ring Exchange', order_index: 3, estimated_duration: 30 },
            { name: 'First Kiss', order_index: 4, estimated_duration: 15 },
            { name: 'Recessional', order_index: 5, estimated_duration: 60 }
        ],
        suggestedSubjects: [
            { name: 'Bride', isRequired: true },
            { name: 'Groom', isRequired: true },
            { name: 'Officiant', isRequired: false },
            { name: 'Rings', isRequired: true }
        ]
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
            { name: 'Bouquet Toss', order_index: 6, estimated_duration: 20 }
        ],
        suggestedSubjects: [
            { name: 'Bride', isRequired: true },
            { name: 'Groom', isRequired: true },
            { name: 'Cake', isRequired: false },
            { name: 'Bouquet', isRequired: false }
        ]
    },
    {
        name: 'Getting Ready',
        type: SceneType.MOMENTS,
        moments: [
            { name: 'Bridal Preparation', order_index: 1, estimated_duration: 60 },
            { name: 'Groom Preparation', order_index: 2, estimated_duration: 45 },
            { name: 'Details', order_index: 3, estimated_duration: 30 }
        ],
        suggestedSubjects: [
            { name: 'Bride', isRequired: true },
            { name: 'Groom', isRequired: true },
            { name: 'Dress Details', isRequired: false },
            { name: 'Jewelry', isRequired: false }
        ]
    }
];

async function seedSceneTemplates(): Promise<SeedSummary> {
    logger.sectionHeader('Scene Templates', 'STEP 2/2: Scene Library');
    logger.startTimer('scene-templates-seed');

    let created = 0;
    let updated = 0;
    let skipped = 0;

    const subjectTemplates = await prisma.subjectTemplate.findMany({
        where: {
            name: {
                in: Array.from(new Set(sceneTemplates.flatMap((scene) =>
                    scene.suggestedSubjects.map((subject) => subject.name)
                )))
            }
        }
    });

    const subjectByName = new Map(subjectTemplates.map((subject) => [subject.name, subject]));

    for (const scene of sceneTemplates) {
        const existing = await prisma.sceneTemplate.findUnique({
            where: { name: scene.name }
        });

        let template;
        if (existing) {
            template = await prisma.sceneTemplate.update({
                where: { name: scene.name },
                data: {
                    type: scene.type,
                    updated_at: new Date()
                }
            });
            updated += 1;
            logger.skipped(`Scene template "${scene.name}"`, 'already exists, updated', 'verbose');
        } else {
            template = await prisma.sceneTemplate.create({
                data: {
                    name: scene.name,
                    type: scene.type,
                    created_at: new Date(),
                    updated_at: new Date()
                }
            });
            created += 1;
            logger.created(`Scene template "${scene.name}"`, undefined, 'verbose');
        }

        await prisma.sceneMomentTemplate.deleteMany({
            where: { scene_template_id: template.id }
        });
        await prisma.sceneTemplateSuggestedSubject.deleteMany({
            where: { scene_template_id: template.id }
        });

        if (scene.moments.length > 0) {
            await prisma.sceneMomentTemplate.createMany({
                data: scene.moments.map((moment) => ({
                    scene_template_id: template.id,
                    name: moment.name,
                    order_index: moment.order_index,
                    estimated_duration: moment.estimated_duration,
                    created_at: new Date(),
                    updated_at: new Date()
                }))
            });
        }

        const suggestedSubjects = scene.suggestedSubjects
            .map((subject) => {
                const templateSubject = subjectByName.get(subject.name);
                if (!templateSubject) {
                    logger.warning(`Subject template not found: ${subject.name}`);
                    return null;
                }
                return {
                    scene_template_id: template.id,
                    subject_template_id: templateSubject.id,
                    is_required: subject.isRequired
                };
            })
            .filter((value): value is { scene_template_id: number; subject_template_id: number; is_required: boolean } => Boolean(value));

        if (suggestedSubjects.length > 0) {
            await prisma.sceneTemplateSuggestedSubject.createMany({
                data: suggestedSubjects
            });
        }
    }

    skipped = sceneTemplates.length - (created + updated);
    logger.summary('Scene templates', { created, updated, skipped, total: sceneTemplates.length });
    logger.endTimer('scene-templates-seed', 'Scene templates seeding');

    return { created, updated, skipped, total: sceneTemplates.length };
}

export default seedSceneTemplates;

if (require.main === module) {
    seedSceneTemplates()
        .catch((error) => {
            console.error('❌ Error seeding scene templates:', error);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}
