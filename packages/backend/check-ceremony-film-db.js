#!/usr/bin/env node

/**
 * Check Database State for Ceremony Film
 * Inspects what data currently exists in the database
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const FILM_ID = 2; // Ceremony Film

async function main() {
  try {
    console.log('\n🔍 === Ceremony Film Database Inspection ===\n');

    // 1. Film info
    console.log('📽️  Film Information:');
    const film = await prisma.filmLibrary.findUnique({
      where: { id: FILM_ID },
      include: {
        local_scenes: {
          include: {
            media_components: true,
          },
        },
        timeline_tracks: true,
      },
    });

    if (!film) {
      console.log('   ❌ Film with ID 2 not found');
      return;
    }

    console.log(`   Name: ${film.name}`);
    console.log(`   ID: ${film.id}`);
    console.log(`   Brand ID: ${film.brand_id}`);
    console.log(`   Description: ${film.description}`);

    // 2. Local scenes
    console.log('\n📹 Film Local Scenes:');
    if (film.local_scenes.length === 0) {
      console.log('   ❌ NO LOCAL SCENES FOUND (this is why timeline is empty!)');
    } else {
      film.local_scenes.forEach(scene => {
        console.log(`\n   Scene: "${scene.name}" (ID: ${scene.id})`);
        console.log(`   - Type: ${scene.type}`);
        console.log(`   - Order: ${scene.order_index}`);
        console.log(`   - Duration Mode: ${scene.duration_mode}`);
        console.log(`   - Media Components: ${scene.media_components.length}`);
        
        if (scene.media_components.length > 0) {
          scene.media_components.forEach(comp => {
            console.log(`     • ${comp.media_type}: ${comp.duration_seconds}s`);
          });
        }
      });
    }

    // 3. Moments
    console.log('\n⏱️  Moments in Film Local Scenes:');
    const moments = await prisma.sceneMoments.findMany({
      where: {
        scene_id: { in: film.local_scenes.map(s => s.id) },
      },
      include: {
        coverage_items: {
          include: {
            coverage: true,
          },
        },
      },
    });

    if (moments.length === 0) {
      console.log('   ❌ NO MOMENTS FOUND');
    } else {
      moments.forEach(moment => {
        console.log(`\n   Moment: "${moment.name}" (ID: ${moment.id})`);
        console.log(`   - Duration: ${moment.duration}s`);
        console.log(`   - Order: ${moment.order_index}`);
        console.log(`   - Coverage Items: ${moment.coverage_items.length}`);
        
        if (moment.coverage_items.length > 0) {
          moment.coverage_items.forEach(cov => {
            console.log(`     • ${cov.coverage.name} (ID: ${cov.coverage_id})`);
          });
        } else {
          console.log('     ⚠️  No coverage assigned to this moment');
        }
      });
    }

    // 4. Timeline tracks
    console.log('\n🎵 Timeline Tracks for Film:');
    if (film.timeline_tracks.length === 0) {
      console.log('   ❌ NO TRACKS FOUND');
    } else {
      film.timeline_tracks.forEach(track => {
        console.log(`   ${track.order_index}. ${track.track_type}: "${track.track_label}" (ID: ${track.id})`);
      });
    }

    // 5. Coverage library
    console.log('\n📚 Available Coverage in Database:');
    const allCoverage = await prisma.coverage.findMany({
      take: 20,
    });

    if (allCoverage.length === 0) {
      console.log('   ❌ NO COVERAGE RECORDS FOUND');
    } else {
      console.log(`   Found ${allCoverage.length} coverage records:`);
      allCoverage.forEach(cov => {
        console.log(`   - "${cov.name}" (ID: ${cov.id}, Type: ${cov.type})`);
      });
    }

    // 6. Original Ceremony scene
    console.log('\n📖 Original Ceremony Scene in Library:');
    const originalScene = await prisma.scenesLibrary.findFirst({
      where: { name: 'Ceremony' },
      include: {
        coverage: true,
      },
    });

    if (!originalScene) {
      console.log('   ❌ No Ceremony scene found in ScenesLibrary');
    } else {
      console.log(`   Scene: "${originalScene.name}" (ID: ${originalScene.id})`);
      console.log(`   - Coverage items: ${originalScene.coverage.length}`);
      if (originalScene.coverage.length > 0) {
        originalScene.coverage.forEach(cov => {
          console.log(`     • ${cov.coverage_name || cov.name} (ID: ${cov.id})`);
        });
      }
    }

    console.log('\n✅ === Database Inspection Complete ===\n');

  } catch (error) {
    console.error('❌ Error during inspection:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
