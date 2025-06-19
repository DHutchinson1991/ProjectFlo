#!/usr/bin/env node

// Seed Task Templates for Phase 2A
// Create useful task templates for component task recipes

const BASE_URL = 'http://localhost:3002';

console.log('🌱 Seeding Task Templates for Phase 2A');
console.log('=====================================\n');

const taskTemplates = [
    // Video Editing Tasks
    {
        name: 'Rough Cut Assembly',
        phase: 'EDITING',
        effort_hours: 4.0,
        pricing_type: 'Hourly',
        average_duration_hours: 3.5
    },
    {
        name: 'Fine Cut Editing',
        phase: 'EDITING',
        effort_hours: 6.0,
        pricing_type: 'Hourly',
        average_duration_hours: 5.5
    },
    {
        name: 'Color Correction',
        phase: 'POST_PRODUCTION',
        effort_hours: 2.5,
        pricing_type: 'Hourly',
        average_duration_hours: 2.0
    },
    {
        name: 'Color Grading',
        phase: 'POST_PRODUCTION',
        effort_hours: 4.0,
        pricing_type: 'Hourly',
        average_duration_hours: 3.5
    },
    {
        name: 'Audio Sync',
        phase: 'EDITING',
        effort_hours: 1.5,
        pricing_type: 'Hourly',
        average_duration_hours: 1.0
    },
    {
        name: 'Audio Mixing',
        phase: 'POST_PRODUCTION',
        effort_hours: 3.0,
        pricing_type: 'Hourly',
        average_duration_hours: 2.5
    },
    {
        name: 'Transition Creation',
        phase: 'EDITING',
        effort_hours: 2.0,
        pricing_type: 'Hourly',
        average_duration_hours: 1.5
    },
    {
        name: 'Graphics Creation',
        phase: 'POST_PRODUCTION',
        effort_hours: 3.5,
        pricing_type: 'Hourly',
        average_duration_hours: 3.0
    },
    {
        name: 'Title Animation',
        phase: 'POST_PRODUCTION',
        effort_hours: 2.5,
        pricing_type: 'Hourly',
        average_duration_hours: 2.0
    },
    {
        name: 'Export & Delivery',
        phase: 'DELIVERY',
        effort_hours: 1.0,
        pricing_type: 'Fixed',
        fixed_price: 50.00,
        average_duration_hours: 0.5
    },
    // Coverage-based tasks
    {
        name: 'Ceremony Editing',
        phase: 'EDITING',
        effort_hours: 8.0,
        pricing_type: 'Hourly',
        average_duration_hours: 7.0
    },
    {
        name: 'Reception Highlights',
        phase: 'EDITING',
        effort_hours: 6.0,
        pricing_type: 'Hourly',
        average_duration_hours: 5.5
    },
    {
        name: 'Getting Ready Montage',
        phase: 'EDITING',
        effort_hours: 4.0,
        pricing_type: 'Hourly',
        average_duration_hours: 3.5
    },
    {
        name: 'Speech Integration',
        phase: 'EDITING',
        effort_hours: 2.0,
        pricing_type: 'Hourly',
        average_duration_hours: 1.5
    },
    {
        name: 'Music Sync & Timing',
        phase: 'POST_PRODUCTION',
        effort_hours: 3.0,
        pricing_type: 'Hourly',
        average_duration_hours: 2.5
    }
];

async function seedTaskTemplates() {
    console.log(`Creating ${taskTemplates.length} task templates...\n`);

    const createdTemplates = [];

    for (const template of taskTemplates) {
        try {
            console.log(`Creating: ${template.name}`);
            const response = await fetch(`${BASE_URL}/task-templates`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(template)
            });

            if (response.ok) {
                const created = await response.json();
                createdTemplates.push(created);
                console.log(`✅ Created: ${created.name} (ID: ${created.id})`);
            } else {
                const error = await response.text();
                console.log(`❌ Failed to create ${template.name}: ${response.status} - ${error}`);
            }
        } catch (error) {
            console.log(`❌ Error creating ${template.name}:`, error.message);
        }
    }

    console.log(`\n🎉 Created ${createdTemplates.length} task templates successfully!`);

    // Show summary
    console.log('\n📊 Task Templates Summary:');
    console.log('==========================');

    const byPhase = createdTemplates.reduce((acc, template) => {
        const phase = template.phase || 'UNKNOWN';
        acc[phase] = (acc[phase] || 0) + 1;
        return acc;
    }, {});

    for (const [phase, count] of Object.entries(byPhase)) {
        console.log(`${phase}: ${count} templates`);
    }

    const totalHours = createdTemplates.reduce((sum, template) => {
        return sum + (parseFloat(template.effort_hours) || 0);
    }, 0);

    console.log(`\nTotal estimated hours across all templates: ${totalHours.toFixed(1)} hours`);

    return createdTemplates;
}

// Run the seeding
seedTaskTemplates().then(() => {
    console.log('\n✅ Task Template seeding complete!');
    console.log('Ready to test component task recipe assignments.');
});
