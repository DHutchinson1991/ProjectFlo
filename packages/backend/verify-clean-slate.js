const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const checks = [
    { label: 'Legacy Coverage', model: 'coverage', expected: 0 },
    { label: 'Legacy SceneCoverage', model: 'sceneCoverage', expected: 0 },
    { label: 'Legacy LocalScene Components', model: 'filmLocalSceneMediaComponent', expected: 0 },
    { label: 'Legacy Scene Moments', model: 'sceneMoments', expected: 0 },
    { label: 'Legacy Local Scenes', model: 'filmLocalScenes', expected: 0 },
    { label: 'Legacy Film Assigned Scenes', model: 'filmAssignedScenes', expected: 0 },
    { label: 'Legacy Film Library', model: 'filmLibrary', expected: 0 },

    { label: 'New Films', model: 'film', expected: 0 },
    { label: 'New Film Tracks', model: 'filmTimelineTrack', expected: 0 },
    { label: 'New Film Subjects', model: 'filmSubject', expected: 0 },
    { label: 'New Film Scenes', model: 'filmScene', expected: 0 },
    { label: 'New Scene Moments', model: 'sceneMoment', expected: 0 },
    { label: 'New Recording Setups', model: 'momentRecordingSetup', expected: 0 },
    { label: 'New Camera Assignments', model: 'cameraSubjectAssignment', expected: 0 },

    { label: 'Subject Templates', model: 'subjectTemplate', expected: 24 },
    { label: 'Scene Templates', model: 'sceneTemplate', expected: 3 }
];

function resultLine(label, actual, expected) {
    const pass = actual === expected;
    const status = pass ? '✅' : '❌';
    return `${status} ${label}: ${actual} records (expected: ${expected})`;
}

async function run() {
    console.log('=== Clean Slate Verification ===');
    let allPass = true;

    for (const check of checks) {
        const count = await prisma[check.model].count();
        console.log(resultLine(check.label, count, check.expected));
        if (count !== check.expected) {
            allPass = false;
        }
    }

    const timelineLayers = await prisma.timeline_layers?.count?.();
    if (typeof timelineLayers === 'number') {
        console.log(`ℹ️ Timeline layers: ${timelineLayers} records (system seed)`);
    }

    if (allPass) {
        console.log('\n✅ Clean slate verified! Ready for Phase 2.');
        await prisma.$disconnect();
        process.exit(0);
    }

    console.error('\n❌ Clean slate failed. Review counts above.');
    await prisma.$disconnect();
    process.exit(1);
}

run().catch(async (error) => {
    console.error('❌ Verification failed:', error);
    await prisma.$disconnect();
    process.exit(1);
});
