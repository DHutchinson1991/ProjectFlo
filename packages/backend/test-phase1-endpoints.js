#!/usr/bin/env node
/**
 * Test script for Phase 1 implementation
 * Tests new film equipment, timeline tracks, and scene management endpoints
 */

const API_BASE = 'http://localhost:3002';

async function testEndpoint(method, url, data = null, description) {
  console.log(`\n🔍 ${description}`);
  console.log(`   ${method} ${url}`);
  
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    
    if (data) {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(`${API_BASE}${url}`, options);
    const result = await response.json();
    
    if (response.ok) {
      console.log(`   ✅ Success:`, JSON.stringify(result, null, 2));
      return result;
    } else {
      console.log(`   ❌ Failed:`, result);
      return null;
    }
  } catch (error) {
    console.log(`   ❌ Error:`, error.message);
    return null;
  }
}

async function runTests() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('🧪 TESTING PHASE 1: Equipment, Tracks & Scene Management');
  console.log('═══════════════════════════════════════════════════════\n');

  const FILM_ID = 1; // Using first film from seed

  // ==================== EQUIPMENT TESTS ====================
  console.log('\n📦 EQUIPMENT TESTS');
  console.log('─────────────────────────────────────────────────────\n');

  // Test 1: Set camera equipment
  await testEndpoint('POST', `/films/${FILM_ID}/equipment`, {
    equipment_type: 'CAMERA',
    quantity: 3,
    notes: 'Sony A7S III cameras'
  }, 'Set 3 cameras for film');

  // Test 2: Set audio equipment
  await testEndpoint('POST', `/films/${FILM_ID}/equipment`, {
    equipment_type: 'AUDIO',
    quantity: 2,
    notes: 'Wireless lavalier mics'
  }, 'Set 2 audio recorders for film');

  // Test 3: Set music track
  await testEndpoint('POST', `/films/${FILM_ID}/equipment`, {
    equipment_type: 'MUSIC',
    quantity: 1
  }, 'Set 1 music track for film');

  // Test 4: Get all equipment
  await testEndpoint('GET', `/films/${FILM_ID}/equipment`, null, 
    'Get all equipment for film');

  // Test 5: Get equipment summary
  const summary = await testEndpoint('GET', `/films/${FILM_ID}/equipment/summary`, null, 
    'Get equipment summary');

  // ==================== TIMELINE TRACKS TESTS ====================
  console.log('\n🎞️  TIMELINE TRACKS TESTS');
  console.log('─────────────────────────────────────────────────────\n');

  // Test 6: Generate tracks from equipment
  const tracks = await testEndpoint('POST', `/films/${FILM_ID}/tracks/generate`, {
    overwrite: true
  }, 'Auto-generate timeline tracks from equipment');

  // Test 7: Get all tracks
  await testEndpoint('GET', `/films/${FILM_ID}/tracks`, null,
    'Get all timeline tracks');

  // Test 8: Get tracks by type
  await testEndpoint('GET', `/films/${FILM_ID}/tracks/by-type`, null,
    'Get tracks grouped by type');

  // Test 9: Get track statistics
  await testEndpoint('GET', `/films/${FILM_ID}/tracks/statistics`, null,
    'Get track statistics');

  // Test 10: Update a track label
  if (tracks && tracks.length > 0) {
    await testEndpoint('PATCH', `/films/${FILM_ID}/tracks/${tracks[1].id}`, {
      track_label: 'Camera 1 (Wide Angle)'
    }, 'Update track label');
  }

  // ==================== SCENE MANAGEMENT TESTS ====================
  console.log('\n🎬 SCENE MANAGEMENT TESTS');
  console.log('─────────────────────────────────────────────────────\n');

  // Test 11: Create scene from template
  const templateScene = await testEndpoint('POST', `/films/${FILM_ID}/scenes/from-template`, {
    template_scene_id: 1, // First Dance from seed
    custom_name: 'First Dance - Test Wedding'
  }, 'Create scene from template');

  // Test 12: Create blank scene
  const blankScene = await testEndpoint('POST', `/films/${FILM_ID}/scenes/blank`, {
    name: 'B-Roll Footage',
    type: 'VIDEO',
    duration_mode: 'FIXED',
    fixed_duration: 30,
    description: 'Additional b-roll and establishing shots'
  }, 'Create blank scene with fixed duration');

  // Test 13: Get scene duration
  if (templateScene) {
    await testEndpoint('GET', `/films/${FILM_ID}/scenes/${templateScene.id}/duration`, null,
      'Calculate scene duration');
  }

  // Test 14: Get all scene durations
  await testEndpoint('GET', `/films/${FILM_ID}/scenes/durations`, null,
    'Get all scene durations for film');

  // Test 15: Update scene duration mode
  if (blankScene) {
    await testEndpoint('PATCH', `/films/${FILM_ID}/scenes/${blankScene.id}/duration-mode`, {
      duration_mode: 'MOMENTS'
    }, 'Switch scene to moments-based duration');
  }

  // ==================== INTEGRATION TEST ====================
  console.log('\n🔗 INTEGRATION TEST');
  console.log('─────────────────────────────────────────────────────\n');

  // Test 16: Full workflow
  console.log('Testing complete film setup workflow:');
  console.log('1. Equipment: 3 cameras, 2 audio, 1 music');
  console.log('2. Auto-generate 7 tracks (1 graphics + 3 video + 2 audio + 1 music)');
  console.log('3. Create 2 scenes (1 from template, 1 blank)');
  console.log('4. Calculate total film duration\n');

  const finalSummary = await testEndpoint('GET', `/films/${FILM_ID}/equipment/summary`, null,
    'Get final equipment summary');

  const finalTracks = await testEndpoint('GET', `/films/${FILM_ID}/tracks/statistics`, null,
    'Get final track statistics');

  const finalDurations = await testEndpoint('GET', `/films/${FILM_ID}/scenes/durations`, null,
    'Get final scene durations');

  // Calculate total duration
  if (finalDurations) {
    const totalDuration = finalDurations.reduce((sum, scene) => 
      sum + scene.calculated_duration, 0);
    console.log(`\n✅ Total film duration: ${Math.floor(totalDuration / 60)} minutes ${totalDuration % 60} seconds`);
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('✅ PHASE 1 TESTS COMPLETE');
  console.log('═══════════════════════════════════════════════════════\n');
}

// Run tests
runTests().catch(console.error);
