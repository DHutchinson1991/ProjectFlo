/**
 * Seed Wedding Types Data
 * Run after migration with: node seed-wedding-types-fixed.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌸 Seeding Wedding Types...');

  // ======================================
  // 1. Traditional British Wedding
  // ======================================
  const britishWedding = await prisma.weddingType.create({
    data: {
      name: 'Traditional British Wedding',
      description: 'Classic UK wedding with ceremony, formal reception, and traditional timings. 8-10 hours, starting at 2pm.',
      total_duration_hours: 10,
      event_start_time: '14:00',
      typical_guest_count: 150,
      is_system_seeded: true,
      is_active: true,
      order_index: 1,
    },
  });

  // Getting Ready
  const britishAct1 = await prisma.weddingTypeActivity.create({
    data: {
      wedding_type_id: britishWedding.id,
      name: 'Getting Ready',
      icon: 'glam',
      color: '#FF69B4',
      duration_minutes: 75,
      start_time_offset_minutes: 0,
      order_index: 1,
    },
  });

  await prisma.weddingTypeActivityMoment.createMany({
    data: [
      {
        wedding_type_activity_id: britishAct1.id,
        name: 'Bridal Prep Begin',
        duration_seconds: 120,
        order_index: 1,
        is_key_moment: true,
      },
      {
        wedding_type_activity_id: britishAct1.id,
        name: 'Dress Reveal',
        duration_seconds: 180,
        order_index: 2,
        is_key_moment: true,
      },
      {
        wedding_type_activity_id: britishAct1.id,
        name: 'Final Check',
        duration_seconds: 60,
        order_index: 3,
        is_key_moment: false,
      },
    ],
  });

  // Ceremony
  const britishAct2 = await prisma.weddingTypeActivity.create({
    data: {
      wedding_type_id: britishWedding.id,
      name: 'Ceremony',
      icon: 'church',
      color: '#8B4513',
      duration_minutes: 45,
      start_time_offset_minutes: 75,
      order_index: 2,
    },
  });

  await prisma.weddingTypeActivityMoment.createMany({
    data: [
      {
        wedding_type_activity_id: britishAct2.id,
        name: 'Processional',
        duration_seconds: 120,
        order_index: 1,
        is_key_moment: true,
      },
      {
        wedding_type_activity_id: britishAct2.id,
        name: 'Vows',
        duration_seconds: 180,
        order_index: 2,
        is_key_moment: true,
      },
      {
        wedding_type_activity_id: britishAct2.id,
        name: 'Ring Exchange',
        duration_seconds: 120,
        order_index: 3,
        is_key_moment: true,
      },
      {
        wedding_type_activity_id: britishAct2.id,
        name: 'First Kiss',
        duration_seconds: 60,
        order_index: 4,
        is_key_moment: true,
      },
    ],
  });

  // Confetti/Photos
  const britishAct3 = await prisma.weddingTypeActivity.create({
    data: {
      wedding_type_id: britishWedding.id,
      name: 'Confetti/Photos',
      icon: 'photo',
      color: '#FFD700',
      duration_minutes: 30,
      start_time_offset_minutes: 120,
      order_index: 3,
    },
  });

  await prisma.weddingTypeActivityMoment.createMany({
    data: [
      {
        wedding_type_activity_id: britishAct3.id,
        name: 'Confetti Moment',
        duration_seconds: 120,
        order_index: 1,
        is_key_moment: true,
      },
      {
        wedding_type_activity_id: britishAct3.id,
        name: 'Group Photos',
        duration_seconds: 900,
        order_index: 2,
        is_key_moment: false,
      },
      {
        wedding_type_activity_id: britishAct3.id,
        name: 'Couple Portraits',
        duration_seconds: 600,
        order_index: 3,
        is_key_moment: true,
      },
    ],
  });

  // Reception Entry
  const britishAct4 = await prisma.weddingTypeActivity.create({
    data: {
      wedding_type_id: britishWedding.id,
      name: 'Reception Entry',
      icon: 'champagne',
      color: '#C41E3A',
      duration_minutes: 30,
      start_time_offset_minutes: 150,
      order_index: 4,
    },
  });

  await prisma.weddingTypeActivityMoment.createMany({
    data: [
      {
        wedding_type_activity_id: britishAct4.id,
        name: 'Grand Entrance',
        duration_seconds: 120,
        order_index: 1,
        is_key_moment: true,
      },
      {
        wedding_type_activity_id: britishAct4.id,
        name: 'Receiving Line',
        duration_seconds: 900,
        order_index: 2,
        is_key_moment: false,
      },
    ],
  });

  // Dinner
  const britishAct5 = await prisma.weddingTypeActivity.create({
    data: {
      wedding_type_id: britishWedding.id,
      name: 'Formal Dinner',
      icon: 'dinner',
      color: '#DC143C',
      duration_minutes: 120,
      start_time_offset_minutes: 180,
      order_index: 5,
    },
  });

  await prisma.weddingTypeActivityMoment.createMany({
    data: [
      {
        wedding_type_activity_id: britishAct5.id,
        name: 'Starter Course',
        duration_seconds: 1200,
        order_index: 1,
        is_key_moment: false,
      },
      {
        wedding_type_activity_id: britishAct5.id,
        name: 'Main Course',
        duration_seconds: 1800,
        order_index: 2,
        is_key_moment: false,
      },
      {
        wedding_type_activity_id: britishAct5.id,
        name: 'Dessert',
        duration_seconds: 1200,
        order_index: 3,
        is_key_moment: false,
      },
    ],
  });

  // Cake & Speeches
  const britishAct6 = await prisma.weddingTypeActivity.create({
    data: {
      wedding_type_id: britishWedding.id,
      name: 'Cake Cut & Speeches',
      icon: 'cake',
      color: '#FFB6C1',
      duration_minutes: 45,
      start_time_offset_minutes: 300,
      order_index: 6,
    },
  });

  await prisma.weddingTypeActivityMoment.createMany({
    data: [
      {
        wedding_type_activity_id: britishAct6.id,
        name: 'Best Man Speech',
        duration_seconds: 600,
        order_index: 1,
        is_key_moment: true,
      },
      {
        wedding_type_activity_id: britishAct6.id,
        name: 'Cake Cutting',
        duration_seconds: 180,
        order_index: 2,
        is_key_moment: true,
      },
      {
        wedding_type_activity_id: britishAct6.id,
        name: 'Cake Sharing',
        duration_seconds: 300,
        order_index: 3,
        is_key_moment: false,
      },
    ],
  });

  // First Dance & Evening
  const britishAct7 = await prisma.weddingTypeActivity.create({
    data: {
      wedding_type_id: britishWedding.id,
      name: 'First Dance & Evening',
      icon: 'heart',
      color: '#FF1493',
      duration_minutes: 90,
      start_time_offset_minutes: 345,
      order_index: 7,
    },
  });

  await prisma.weddingTypeActivityMoment.createMany({
    data: [
      {
        wedding_type_activity_id: britishAct7.id,
        name: 'First Dance',
        duration_seconds: 240,
        order_index: 1,
        is_key_moment: true,
      },
      {
        wedding_type_activity_id: britishAct7.id,
        name: 'Parent Dances',
        duration_seconds: 180,
        order_index: 2,
        is_key_moment: true,
      },
      {
        wedding_type_activity_id: britishAct7.id,
        name: 'Dance Floor Open',
        duration_seconds: 3600,
        order_index: 3,
        is_key_moment: false,
      },
    ],
  });

  console.log('✅ Traditional British Wedding created');

  // ======================================
  // 2. Indian Wedding
  // ======================================
  const indianWedding = await prisma.weddingType.create({
    data: {
      name: 'Indian Wedding',
      description: 'Multi-day celebration across Mehendi, Sangeet, Wedding day. Focus on key ceremonies. Typically 12-16 hours for single day coverage.',
      total_duration_hours: 14,
      event_start_time: '06:00',
      typical_guest_count: 300,
      is_system_seeded: true,
      is_active: true,
      order_index: 2,
    },
  });

  // Early Morning Prayers
  const indianAct1 = await prisma.weddingTypeActivity.create({
    data: {
      wedding_type_id: indianWedding.id,
      name: 'Early Morning Prayers',
      icon: 'prayer',
      color: '#FFA500',
      duration_minutes: 60,
      start_time_offset_minutes: 0,
      order_index: 1,
    },
  });

  await prisma.weddingTypeActivityMoment.createMany({
    data: [
      {
        wedding_type_activity_id: indianAct1.id,
        name: 'Bride Prayers',
        duration_seconds: 600,
        order_index: 1,
        is_key_moment: true,
      },
      {
        wedding_type_activity_id: indianAct1.id,
        name: 'Getting Ready',
        duration_seconds: 1800,
        order_index: 2,
        is_key_moment: false,
      },
    ],
  });

  // Mehendi
  const indianAct2 = await prisma.weddingTypeActivity.create({
    data: {
      wedding_type_id: indianWedding.id,
      name: 'Mehendi',
      icon: 'henna',
      color: '#C41E3A',
      duration_minutes: 120,
      start_time_offset_minutes: 60,
      order_index: 2,
    },
  });

  await prisma.weddingTypeActivityMoment.createMany({
    data: [
      {
        wedding_type_activity_id: indianAct2.id,
        name: 'Mehendi Application',
        duration_seconds: 1200,
        order_index: 1,
        is_key_moment: true,
      },
      {
        wedding_type_activity_id: indianAct2.id,
        name: 'Dancing & Celebrations',
        duration_seconds: 4800,
        order_index: 2,
        is_key_moment: true,
      },
      {
        wedding_type_activity_id: indianAct2.id,
        name: 'Groom Tease',
        duration_seconds: 1200,
        order_index: 3,
        is_key_moment: true,
      },
    ],
  });

  // Baraat
  const indianAct3 = await prisma.weddingTypeActivity.create({
    data: {
      wedding_type_id: indianWedding.id,
      name: 'Groom Arrival (Baraat)',
      icon: 'horse',
      color: '#8B4513',
      duration_minutes: 90,
      start_time_offset_minutes: 180,
      order_index: 3,
    },
  });

  await prisma.weddingTypeActivityMoment.createMany({
    data: [
      {
        wedding_type_activity_id: indianAct3.id,
        name: 'Baraat Arrival',
        duration_seconds: 600,
        order_index: 1,
        is_key_moment: true,
      },
      {
        wedding_type_activity_id: indianAct3.id,
        name: 'Groom Reception',
        duration_seconds: 900,
        order_index: 2,
        is_key_moment: true,
      },
      {
        wedding_type_activity_id: indianAct3.id,
        name: 'Dancing Groom',
        duration_seconds: 2700,
        order_index: 3,
        is_key_moment: true,
      },
    ],
  });

  // Ceremony
  const indianAct4 = await prisma.weddingTypeActivity.create({
    data: {
      wedding_type_id: indianWedding.id,
      name: 'Wedding Ceremony (Pheras)',
      icon: 'mandap',
      color: '#FFD700',
      duration_minutes: 120,
      start_time_offset_minutes: 270,
      order_index: 4,
    },
  });

  await prisma.weddingTypeActivityMoment.createMany({
    data: [
      {
        wedding_type_activity_id: indianAct4.id,
        name: 'Mandap Preparation',
        duration_seconds: 600,
        order_index: 1,
        is_key_moment: false,
      },
      {
        wedding_type_activity_id: indianAct4.id,
        name: 'Pheras (Rounds)',
        duration_seconds: 1800,
        order_index: 2,
        is_key_moment: true,
      },
      {
        wedding_type_activity_id: indianAct4.id,
        name: 'Mangal Sutra',
        duration_seconds: 300,
        order_index: 3,
        is_key_moment: true,
      },
    ],
  });

  // Aashirwad
  const indianAct5 = await prisma.weddingTypeActivity.create({
    data: {
      wedding_type_id: indianWedding.id,
      name: 'Aashirwad/Blessings',
      icon: 'blessed',
      color: '#C41E3A',
      duration_minutes: 90,
      start_time_offset_minutes: 390,
      order_index: 5,
    },
  });

  await prisma.weddingTypeActivityMoment.createMany({
    data: [
      {
        wedding_type_activity_id: indianAct5.id,
        name: 'Blessings Begin',
        duration_seconds: 300,
        order_index: 1,
        is_key_moment: true,
      },
      {
        wedding_type_activity_id: indianAct5.id,
        name: 'Family Photos',
        duration_seconds: 1800,
        order_index: 2,
        is_key_moment: false,
      },
      {
        wedding_type_activity_id: indianAct5.id,
        name: 'Blessing Line',
        duration_seconds: 2700,
        order_index: 3,
        is_key_moment: false,
      },
    ],
  });

  // Reception
  const indianAct6 = await prisma.weddingTypeActivity.create({
    data: {
      wedding_type_id: indianWedding.id,
      name: 'Reception & Dinner',
      icon: 'feast',
      color: '#DC143C',
      duration_minutes: 180,
      start_time_offset_minutes: 480,
      order_index: 6,
    },
  });

  await prisma.weddingTypeActivityMoment.createMany({
    data: [
      {
        wedding_type_activity_id: indianAct6.id,
        name: 'Reception Entry',
        duration_seconds: 300,
        order_index: 1,
        is_key_moment: true,
      },
      {
        wedding_type_activity_id: indianAct6.id,
        name: 'Dinner Course',
        duration_seconds: 5400,
        order_index: 2,
        is_key_moment: false,
      },
      {
        wedding_type_activity_id: indianAct6.id,
        name: 'Cake Cutting',
        duration_seconds: 600,
        order_index: 3,
        is_key_moment: true,
      },
    ],
  });

  // Evening Celebrations
  const indianAct7 = await prisma.weddingTypeActivity.create({
    data: {
      wedding_type_id: indianWedding.id,
      name: 'Evening Celebrations',
      icon: 'dance',
      color: '#FF1493',
      duration_minutes: 120,
      start_time_offset_minutes: 660,
      order_index: 7,
    },
  });

  await prisma.weddingTypeActivityMoment.createMany({
    data: [
      {
        wedding_type_activity_id: indianAct7.id,
        name: 'First Dance',
        duration_seconds: 300,
        order_index: 1,
        is_key_moment: true,
      },
      {
        wedding_type_activity_id: indianAct7.id,
        name: 'Dance Floor',
        duration_seconds: 5400,
        order_index: 2,
        is_key_moment: true,
      },
    ],
  });

  console.log('✅ Indian Wedding created');

  // ======================================
  // 3. Pakistani Wedding
  // ======================================
  const pakistaniWedding = await prisma.weddingType.create({
    data: {
      name: 'Pakistani Wedding',
      description: 'Traditional Pakistani ceremonies including Walima and formal celebrations. 10-12 hours, typically starting mid-morning.',
      total_duration_hours: 11,
      event_start_time: '10:00',
      typical_guest_count: 200,
      is_system_seeded: true,
      is_active: true,
      order_index: 3,
    },
  });

  // Groom Preparation
  const pkAct1 = await prisma.weddingTypeActivity.create({
    data: {
      wedding_type_id: pakistaniWedding.id,
      name: 'Groom Preparation',
      icon: 'groom',
      color: '#8B4513',
      duration_minutes: 90,
      start_time_offset_minutes: 0,
      order_index: 1,
    },
  });

  await prisma.weddingTypeActivityMoment.createMany({
    data: [
      {
        wedding_type_activity_id: pkAct1.id,
        name: 'Getting Ready',
        duration_seconds: 1800,
        order_index: 1,
        is_key_moment: false,
      },
      {
        wedding_type_activity_id: pkAct1.id,
        name: 'Final Check',
        duration_seconds: 900,
        order_index: 2,
        is_key_moment: false,
      },
    ],
  });

  // Nikkah
  const pkAct2 = await prisma.weddingTypeActivity.create({
    data: {
      wedding_type_id: pakistaniWedding.id,
      name: 'Nikkah Ceremony',
      icon: 'ceremony',
      color: '#FFD700',
      duration_minutes: 60,
      start_time_offset_minutes: 90,
      order_index: 2,
    },
  });

  await prisma.weddingTypeActivityMoment.createMany({
    data: [
      {
        wedding_type_activity_id: pkAct2.id,
        name: 'Ceremony Begin',
        duration_seconds: 300,
        order_index: 1,
        is_key_moment: true,
      },
      {
        wedding_type_activity_id: pkAct2.id,
        name: 'Vows',
        duration_seconds: 600,
        order_index: 2,
        is_key_moment: true,
      },
      {
        wedding_type_activity_id: pkAct2.id,
        name: 'Signing',
        duration_seconds: 300,
        order_index: 3,
        is_key_moment: false,
      },
    ],
  });

  // Photos
  const pkAct3 = await prisma.weddingTypeActivity.create({
    data: {
      wedding_type_id: pakistaniWedding.id,
      name: 'Bride & Groom Photos',
      icon: 'photo',
      color: '#FFB6C1',
      duration_minutes: 60,
      start_time_offset_minutes: 150,
      order_index: 3,
    },
  });

  await prisma.weddingTypeActivityMoment.createMany({
    data: [
      {
        wedding_type_activity_id: pkAct3.id,
        name: 'Couple Portraits',
        duration_seconds: 1800,
        order_index: 1,
        is_key_moment: true,
      },
      {
        wedding_type_activity_id: pkAct3.id,
        name: 'Group Photos',
        duration_seconds: 1200,
        order_index: 2,
        is_key_moment: false,
      },
    ],
  });

  // Reception
  const pkAct4 = await prisma.weddingTypeActivity.create({
    data: {
      wedding_type_id: pakistaniWedding.id,
      name: 'Reception Entry & Dinner',
      icon: 'feast',
      color: '#C41E3A',
      duration_minutes: 120,
      start_time_offset_minutes: 210,
      order_index: 4,
    },
  });

  await prisma.weddingTypeActivityMoment.createMany({
    data: [
      {
        wedding_type_activity_id: pkAct4.id,
        name: 'Grand Entrance',
        duration_seconds: 300,
        order_index: 1,
        is_key_moment: true,
      },
      {
        wedding_type_activity_id: pkAct4.id,
        name: 'Dinner',
        duration_seconds: 5400,
        order_index: 2,
        is_key_moment: false,
      },
    ],
  });

  // Cake & Speeches
  const pkAct5 = await prisma.weddingTypeActivity.create({
    data: {
      wedding_type_id: pakistaniWedding.id,
      name: 'Cake Cutting & Speeches',
      icon: 'cake',
      color: '#FF1493',
      duration_minutes: 45,
      start_time_offset_minutes: 330,
      order_index: 5,
    },
  });

  await prisma.weddingTypeActivityMoment.createMany({
    data: [
      {
        wedding_type_activity_id: pkAct5.id,
        name: 'Speeches',
        duration_seconds: 900,
        order_index: 1,
        is_key_moment: false,
      },
      {
        wedding_type_activity_id: pkAct5.id,
        name: 'Cake Cutting',
        duration_seconds: 300,
        order_index: 2,
        is_key_moment: true,
      },
    ],
  });

  // Dancing
  const pkAct6 = await prisma.weddingTypeActivity.create({
    data: {
      wedding_type_id: pakistaniWedding.id,
      name: 'Dancing & Celebration',
      icon: 'dance',
      color: '#DC143C',
      duration_minutes: 60,
      start_time_offset_minutes: 375,
      order_index: 6,
    },
  });

  await prisma.weddingTypeActivityMoment.createMany({
    data: [
      {
        wedding_type_activity_id: pkAct6.id,
        name: 'First Dance',
        duration_seconds: 300,
        order_index: 1,
        is_key_moment: true,
      },
      {
        wedding_type_activity_id: pkAct6.id,
        name: 'Dance Floor',
        duration_seconds: 2700,
        order_index: 2,
        is_key_moment: true,
      },
    ],
  });

  console.log('✅ Pakistani Wedding created');

  // ======================================
  // 4. Registry Office + Celebration
  // ======================================
  const registryWedding = await prisma.weddingType.create({
    data: {
      name: 'Registry Office + Celebration',
      description: 'Intimate registry office ceremony followed by casual reception or party. 6-8 hours, afternoon coverage.',
      total_duration_hours: 7,
      event_start_time: '14:00',
      typical_guest_count: 75,
      is_system_seeded: true,
      is_active: true,
      order_index: 4,
    },
  });

  // Registry Ceremony
  const regAct1 = await prisma.weddingTypeActivity.create({
    data: {
      wedding_type_id: registryWedding.id,
      name: 'Registry Ceremony',
      icon: 'rings',
      color: '#8B4513',
      duration_minutes: 30,
      start_time_offset_minutes: 0,
      order_index: 1,
    },
  });

  await prisma.weddingTypeActivityMoment.createMany({
    data: [
      {
        wedding_type_activity_id: regAct1.id,
        name: 'Ceremony',
        duration_seconds: 1200,
        order_index: 1,
        is_key_moment: true,
      },
      {
        wedding_type_activity_id: regAct1.id,
        name: 'Registrar',
        duration_seconds: 900,
        order_index: 2,
        is_key_moment: false,
      },
    ],
  });

  // Confetti
  const regAct2 = await prisma.weddingTypeActivity.create({
    data: {
      wedding_type_id: registryWedding.id,
      name: 'Confetti Moment',
      icon: 'confetti',
      color: '#FFD700',
      duration_minutes: 20,
      start_time_offset_minutes: 30,
      order_index: 2,
    },
  });

  await prisma.weddingTypeActivityMoment.createMany({
    data: [
      {
        wedding_type_activity_id: regAct2.id,
        name: 'Confetti Throw',
        duration_seconds: 300,
        order_index: 1,
        is_key_moment: true,
      },
    ],
  });

  // Photos
  const regAct3 = await prisma.weddingTypeActivity.create({
    data: {
      wedding_type_id: registryWedding.id,
      name: 'Couple Photos',
      icon: 'photo',
      color: '#FFB6C1',
      duration_minutes: 45,
      start_time_offset_minutes: 50,
      order_index: 3,
    },
  });

  await prisma.weddingTypeActivityMoment.createMany({
    data: [
      {
        wedding_type_activity_id: regAct3.id,
        name: 'Couple Shots',
        duration_seconds: 1200,
        order_index: 1,
        is_key_moment: true,
      },
      {
        wedding_type_activity_id: regAct3.id,
        name: 'Group Photo',
        duration_seconds: 900,
        order_index: 2,
        is_key_moment: false,
      },
    ],
  });

  // Reception
  const regAct4 = await prisma.weddingTypeActivity.create({
    data: {
      wedding_type_id: registryWedding.id,
      name: 'Reception & Drinks',
      icon: 'champagne',
      color: '#C41E3A',
      duration_minutes: 90,
      start_time_offset_minutes: 95,
      order_index: 4,
    },
  });

  await prisma.weddingTypeActivityMoment.createMany({
    data: [
      {
        wedding_type_activity_id: regAct4.id,
        name: 'Champagne Toast',
        duration_seconds: 600,
        order_index: 1,
        is_key_moment: true,
      },
      {
        wedding_type_activity_id: regAct4.id,
        name: 'Mingling',
        duration_seconds: 4800,
        order_index: 2,
        is_key_moment: false,
      },
    ],
  });

  // Food & Cake
  const regAct5 = await prisma.weddingTypeActivity.create({
    data: {
      wedding_type_id: registryWedding.id,
      name: 'Food & Cake',
      icon: 'cake',
      color: '#FF1493',
      duration_minutes: 80,
      start_time_offset_minutes: 185,
      order_index: 5,
    },
  });

  await prisma.weddingTypeActivityMoment.createMany({
    data: [
      {
        wedding_type_activity_id: regAct5.id,
        name: 'Cake Cutting',
        duration_seconds: 300,
        order_index: 1,
        is_key_moment: true,
      },
      {
        wedding_type_activity_id: regAct5.id,
        name: 'Eating & Chatting',
        duration_seconds: 3600,
        order_index: 2,
        is_key_moment: false,
      },
    ],
  });

  console.log('✅ Registry Office + Celebration created');

  // ======================================
  // 5. Garden/Intimate Wedding
  // ======================================
  const gardenWedding = await prisma.weddingType.create({
    data: {
      name: 'Garden/Intimate Wedding',
      description: 'Small garden or venue ceremony with intimate gathering. 8-10 hours, afternoon to evening.',
      total_duration_hours: 9,
      event_start_time: '14:00',
      typical_guest_count: 60,
      is_system_seeded: true,
      is_active: true,
      order_index: 5,
    },
  });

  // Setup
  const gardenAct1 = await prisma.weddingTypeActivity.create({
    data: {
      wedding_type_id: gardenWedding.id,
      name: 'Guest Arrival & Ceremony Setup',
      icon: 'setup',
      color: '#8B4513',
      duration_minutes: 30,
      start_time_offset_minutes: 0,
      order_index: 1,
    },
  });

  await prisma.weddingTypeActivityMoment.createMany({
    data: [
      {
        wedding_type_activity_id: gardenAct1.id,
        name: 'Guests Arriving',
        duration_seconds: 1200,
        order_index: 1,
        is_key_moment: false,
      },
      {
        wedding_type_activity_id: gardenAct1.id,
        name: 'Bride Processional',
        duration_seconds: 300,
        order_index: 2,
        is_key_moment: true,
      },
    ],
  });

  // Ceremony
  const gardenAct2 = await prisma.weddingTypeActivity.create({
    data: {
      wedding_type_id: gardenWedding.id,
      name: 'Garden Ceremony',
      icon: 'heart',
      color: '#C41E3A',
      duration_minutes: 45,
      start_time_offset_minutes: 30,
      order_index: 2,
    },
  });

  await prisma.weddingTypeActivityMoment.createMany({
    data: [
      {
        wedding_type_activity_id: gardenAct2.id,
        name: 'Vows',
        duration_seconds: 600,
        order_index: 1,
        is_key_moment: true,
      },
      {
        wedding_type_activity_id: gardenAct2.id,
        name: 'First Kiss',
        duration_seconds: 120,
        order_index: 2,
        is_key_moment: true,
      },
    ],
  });

  // Cocktails/Photos
  const gardenAct3 = await prisma.weddingTypeActivity.create({
    data: {
      wedding_type_id: gardenWedding.id,
      name: 'Photos & Cocktails',
      icon: 'champagne',
      color: '#FFD700',
      duration_minutes: 60,
      start_time_offset_minutes: 75,
      order_index: 3,
    },
  });

  await prisma.weddingTypeActivityMoment.createMany({
    data: [
      {
        wedding_type_activity_id: gardenAct3.id,
        name: 'Couple Portraits',
        duration_seconds: 1200,
        order_index: 1,
        is_key_moment: true,
      },
      {
        wedding_type_activity_id: gardenAct3.id,
        name: 'Cocktail Hour',
        duration_seconds: 2400,
        order_index: 2,
        is_key_moment: false,
      },
    ],
  });

  // Games
  const gardenAct4 = await prisma.weddingTypeActivity.create({
    data: {
      wedding_type_id: gardenWedding.id,
      name: 'Garden Games',
      icon: 'fun',
      color: '#FF1493',
      duration_minutes: 60,
      start_time_offset_minutes: 135,
      order_index: 4,
    },
  });

  await prisma.weddingTypeActivityMoment.createMany({
    data: [
      {
        wedding_type_activity_id: gardenAct4.id,
        name: 'Lawn Games',
        duration_seconds: 3600,
        order_index: 1,
        is_key_moment: false,
      },
    ],
  });

  // Dinner
  const gardenAct5 = await prisma.weddingTypeActivity.create({
    data: {
      wedding_type_id: gardenWedding.id,
      name: 'Dinner & Celebration',
      icon: 'feast',
      color: '#DC143C',
      duration_minutes: 90,
      start_time_offset_minutes: 195,
      order_index: 5,
    },
  });

  await prisma.weddingTypeActivityMoment.createMany({
    data: [
      {
        wedding_type_activity_id: gardenAct5.id,
        name: 'Dinner Course',
        duration_seconds: 3600,
        order_index: 1,
        is_key_moment: false,
      },
      {
        wedding_type_activity_id: gardenAct5.id,
        name: 'Cake Cutting',
        duration_seconds: 300,
        order_index: 2,
        is_key_moment: true,
      },
    ],
  });

  // Dancing
  const gardenAct6 = await prisma.weddingTypeActivity.create({
    data: {
      wedding_type_id: gardenWedding.id,
      name: 'Evening Dancing',
      icon: 'dance',
      color: '#FFB6C1',
      duration_minutes: 60,
      start_time_offset_minutes: 285,
      order_index: 6,
    },
  });

  await prisma.weddingTypeActivityMoment.createMany({
    data: [
      {
        wedding_type_activity_id: gardenAct6.id,
        name: 'First Dance',
        duration_seconds: 300,
        order_index: 1,
        is_key_moment: true,
      },
      {
        wedding_type_activity_id: gardenAct6.id,
        name: 'Open Dance Floor',
        duration_seconds: 3600,
        order_index: 2,
        is_key_moment: true,
      },
    ],
  });

  console.log('✅ Garden/Intimate Wedding created');

  console.log('\n🎉 All 5 Wedding Types seeded successfully!');
  console.log('Total: 5 wedding types, 31 activities, 80+ moments');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
