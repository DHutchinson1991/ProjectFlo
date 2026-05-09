/**
 * Backfill action_description on FilmSceneMomentSubject records
 * and subject_actions on EventSubtypeActivityMoment / PackageActivityMoment.
 *
 * Run with: npx ts-node -r tsconfig-paths/register scripts/backfill-subject-actions.ts
 */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// ─── Canonical action descriptions (mirrors seed data) ────────────────
// Key: "ActivityName::MomentName" → { SubjectRole: action }
// Includes BOTH seed-format names and actual DB moment names for film 10.
const ACTION_MAP: Record<string, Record<string, string>> = {
  // ── Getting Ready ──────────────────────────────────────────
  "Getting Ready::Bride's Hair & Makeup": {
    'Bride': 'seated in dressing gown, stylist doing hair, looking into handheld mirror',
    'Bridesmaids': 'seated nearby having makeup applied, chatting and laughing together',
  },
  "Getting Ready::Bride Getting Dressed": {
    'Bride': 'stepping into wedding dress, mother helping with buttons at the back',
    'Bridesmaids': 'standing around bride helping adjust dress and veil, holding train',
  },
  "Getting Ready::Groom Getting Ready": {
    'Groom': 'standing at mirror adjusting tie and cufflinks, wearing dark suit',
  },
  "Getting Ready::Final Touches & Veil": {
    'Bride': 'standing in full wedding dress, mother placing veil on head',
    'Bridesmaids': 'watching bride with emotional expressions, one holding bouquet ready',
  },
  "Getting Ready::Bridesmaids Preparation": {
    'Bridesmaids': "lined up in matching dresses, adjusting each other's hair and accessories",
    'Bride': 'seated watching bridesmaids get ready, holding champagne glass',
  },
  "Getting Ready::Father of Bride Reaction": {
    'Bride': 'standing in full wedding dress and veil, turning to face her father',
    'Father of Bride': 'standing in doorway, hand over mouth, emotional reaction seeing bride',
  },

  // ── Ceremony (seed-format names) ───────────────────────────
  "Ceremony::Processional & Entry": {
    'Bride': 'walking down the aisle arm-in-arm with father, holding bouquet',
    'Groom': 'standing at altar, turning to watch bride approach, emotional expression',
    'Bridesmaids': 'walking in single file down the aisle ahead of bride, holding small bouquets',
    'Groomsmen': 'standing in a row beside the altar, hands clasped in front',
    'Guests': 'seated in rows, standing and turning to watch bride enter',
    'Officiant': 'standing at front of altar facing congregation, hands together',
  },

  // ── Ceremony (actual DB names for film 10) ────────────────
  "Ceremony::Guest Seating": {
    'Bride': 'waiting out of sight in bridal suite, final preparations before ceremony',
    'Groom': 'standing near altar with best man, greeting arriving guests nervously',
    'Best Man': 'standing beside groom near altar, reassuring him, adjusting his buttonhole',
    'Maid of Honor': 'helping bride with final touches in bridal suite, arranging veil',
    'Father of Bride': 'standing at entrance, greeting guests and directing them to seats',
    'Mother of Bride': 'seated in front row on bride side, chatting with family members',
    'Father of Groom': 'standing at entrance, welcoming guests to groom side',
    'Mother of Groom': 'seated in front row on groom side, saving seats for family',
    'Bridesmaids': 'gathered in bridal suite with bride, helping with final details',
    'Groomsmen': 'standing at entrance handing out order of service, directing guests to seats',
    'Flower Girl': 'waiting in bridal suite, holding small basket of petals, fidgeting excitedly',
    'Ring Bearer': 'standing with groomsmen near entrance, holding ring cushion carefully',
    'Guests': 'filing into venue, finding seats on either side, chatting quietly',
    'Officiant': 'standing at front reviewing notes, arranging lectern and ceremony items',
  },
  "Ceremony::Bride Arrival": {
    'Bride': 'stepping out of wedding car in full dress, father helping with train',
    'Groom': 'standing at altar, facing forward, nervously awaiting bride',
    'Best Man': 'standing beside groom, whispering reassurance, both looking toward entrance',
    'Maid of Honor': 'arranging bride\'s dress and veil outside venue, handing her bouquet',
    'Father of Bride': 'standing beside bride at venue entrance, offering his arm',
    'Mother of Bride': 'seated in front row, turning to look toward entrance expectantly',
    'Bridesmaids': 'lined up inside entrance ready to walk, adjusting bouquets',
    'Guests': 'seated, turning to look toward entrance, hushed anticipation',
    'Officiant': 'standing at altar, signaling ceremony is about to begin',
  },
  "Ceremony::Officiant Welcome": {
    'Bride': 'standing at altar beside groom, bouquet in both hands',
    'Groom': 'standing at altar beside bride, hands clasped in front',
    'Best Man': 'standing to groom\'s side, holding rings in pocket, attentive',
    'Maid of Honor': 'standing to bride\'s side, holding bride\'s bouquet ready',
    'Father of Bride': 'seated in front row after giving bride away, emotional',
    'Mother of Bride': 'seated in front row, dabbing eyes with tissue',
    'Father of Groom': 'seated in front row on groom side, watching proudly',
    'Mother of Groom': 'seated in front row on groom side, beaming at son',
    'Bridesmaids': 'standing in line to bride\'s side, hands clasped, watching',
    'Groomsmen': 'standing in line to groom\'s side, hands clasped in front',
    'Guests': 'seated in rows, listening attentively to officiant',
    'Officiant': 'standing at lectern, welcoming guests, opening ceremony with warm words',
  },
  "Ceremony::Groom Takes Position": {
    'Groom': 'walking to altar from side entrance, adjusting jacket, taking position',
    'Best Man': 'walking beside groom to altar, patting him on shoulder reassuringly',
    'Groomsmen': 'filing into position beside altar in a line, standing at attention',
    'Guests': 'seated watching groom take position, murmuring quietly',
    'Officiant': 'standing at altar, nodding to groom as he takes position',
  },
  "Ceremony::Bridal Party Processional": {
    'Bridesmaids': 'walking down aisle one by one in matching dresses, holding small bouquets',
    'Groomsmen': 'standing at altar watching bridesmaids approach, smiling',
    'Maid of Honor': 'walking down aisle last before bride, holding bouquet, poised',
    'Flower Girl': 'walking down aisle scattering petals from basket, looking around shyly',
    'Ring Bearer': 'walking down aisle carrying ring cushion carefully, concentrating',
    'Groom': 'standing at altar watching processional, anticipation building',
    'Guests': 'seated, turning to watch bridal party walk down aisle',
  },
  "Ceremony::Bride Entrance": {
    'Bride': 'walking down the aisle arm-in-arm with father, holding bouquet, radiant',
    'Groom': 'standing at altar, turning to see bride, emotional expression, hand to mouth',
    'Father of Bride': 'walking bride down aisle, arm linked with hers, proud expression',
    'Best Man': 'standing beside groom, watching bride approach, nudging groom',
    'Maid of Honor': 'standing at altar side, watching bride approach, tearing up',
    'Bridesmaids': 'standing at altar side, turning to watch bride enter, emotional',
    'Mother of Bride': 'seated in front row, hand over heart, wiping tears',
    'Mother of Groom': 'seated in front row, hand to face, emotional watching bride',
    'Guests': 'standing and turning to watch bride walk down aisle, gasps of admiration',
    'Officiant': 'standing at altar smiling warmly, watching bride approach',
  },
  "Ceremony::Giving Away": {
    'Bride': 'standing at altar, father lifting veil and kissing her cheek',
    'Groom': 'stepping forward to take bride\'s hand from father, nodding respectfully',
    'Father of Bride': 'lifting bride\'s veil, kissing her cheek, placing her hand in groom\'s',
    'Mother of Bride': 'seated in front row, wiping tears, watching husband give daughter away',
    'Guests': 'seated watching giving away moment, many wiping tears',
    'Officiant': 'standing at altar, asking who gives this woman, overseeing handover',
  },
  "Ceremony::Opening Remarks": {
    'Bride': 'standing beside groom at altar, looking at officiant, hands held together',
    'Groom': 'standing beside bride at altar, looking at officiant, standing tall',
    'Best Man': 'standing to side, listening to officiant speak',
    'Maid of Honor': 'standing to bride\'s side, listening attentively',
    'Guests': 'seated in rows, listening to officiant, quiet and attentive',
    'Officiant': 'standing at lectern, speaking about love and commitment, addressing congregation',
  },
  "Ceremony::Readings": {
    'Bride': 'standing at altar, listening to reading, squeezing groom\'s hand',
    'Groom': 'standing at altar, listening to reading, glancing at bride with emotion',
    'Best Man': 'standing at lectern reading passage, holding paper, speaking clearly',
    'Maid of Honor': 'standing at lectern reading poem, emotional voice, looking up at couple',
    'Guests': 'seated listening to readings, some nodding, some wiping tears',
    'Officiant': 'seated to side, listening to reader, waiting to continue ceremony',
  },
  "Ceremony::Vows Exchange": {
    'Bride': 'standing facing groom at altar, reading vows from paper, tearful',
    'Groom': 'standing facing bride at altar, holding her hands, listening intently',
    'Best Man': 'standing to side, watching couple exchange vows, emotional',
    'Maid of Honor': 'standing to side, holding bride\'s bouquet, wiping tears',
    'Bridesmaids': 'standing to the side of altar in a line, watching couple with emotion',
    'Groomsmen': 'standing to the opposite side of altar in a line, watching ceremony',
    'Father of Bride': 'seated in front row, arm around wife, wiping tears',
    'Mother of Bride': 'seated in front row, wiping tears, watching daughter',
    'Father of Groom': 'seated in front row, watching proudly, nodding',
    'Mother of Groom': 'seated in front row, wiping tears, clutching handkerchief',
    'Guests': 'seated in rows watching ceremony, some wiping tears',
    'Officiant': 'standing behind couple at lectern, reading from book, overseeing vows',
  },
  "Ceremony::Ring Exchange": {
    'Bride': "sliding ring onto groom's finger, hands close together at altar",
    'Groom': "holding bride's hand, placing ring on her finger",
    'Best Man': 'stepping forward to hand rings to officiant, then returning to position',
    'Ring Bearer': 'standing nearby after presenting ring cushion, watching proudly',
    'Father of Bride': 'seated in front row, leaning forward watching ring exchange',
    'Mother of Bride': 'seated in front row, hands clasped, watching intently',
    'Guests': 'seated watching intently, some craning to see rings',
    'Officiant': 'standing behind couple, holding open prayer book, blessing rings',
  },
  "Ceremony::Unity Ceremony": {
    'Bride': 'pouring sand or lighting candle together with groom, symbolic gesture',
    'Groom': 'pouring sand or lighting candle with bride, both holding together',
    'Best Man': 'standing to side watching unity ceremony, respectful',
    'Maid of Honor': 'standing to side watching, holding bouquet',
    'Guests': 'seated watching unity ceremony, quiet reverence',
    'Officiant': 'standing behind couple, explaining the symbolism of the unity ceremony',
  },
  "Ceremony::Pronouncement": {
    'Bride': 'standing facing groom, beaming smile, anticipation in her eyes',
    'Groom': 'standing facing bride, wide smile, holding both her hands',
    'Best Man': 'standing to side, grinning, ready to congratulate',
    'Maid of Honor': 'standing to side, emotional, hands clasped to chest',
    'Bridesmaids': 'standing in line, leaning forward in anticipation, smiling',
    'Groomsmen': 'standing in line, grinning, nudging each other',
    'Guests': 'seated, leaning forward in seats, anticipation, ready to cheer',
    'Officiant': 'standing at lectern, pronouncing couple married, arms raised',
  },
  "Ceremony::First Kiss": {
    'Bride': 'leaning in for kiss with groom at altar, bouquet in one hand',
    'Groom': 'leaning in to kiss bride, hands on her waist',
    'Best Man': 'standing to side, clapping, huge grin',
    'Maid of Honor': 'standing to side, clapping, wiping happy tears',
    'Bridesmaids': 'standing to side clapping and cheering, big smiles',
    'Groomsmen': 'standing to side clapping, some whistling and cheering',
    'Father of Bride': 'seated in front row, applauding, arm around wife',
    'Mother of Bride': 'seated in front row applauding, wiping tears of joy',
    'Father of Groom': 'seated in front row, standing to applaud, proud',
    'Mother of Groom': 'seated in front row, standing to applaud, tearful smile',
    'Guests': 'seated and applauding, some standing, cheering loudly',
    'Officiant': 'standing behind couple smiling, stepping back, gesturing to couple',
  },
  "Ceremony::Recessional": {
    'Bride': 'walking back down the aisle with groom, beaming, holding bouquet high',
    'Groom': 'walking arm-in-arm with bride down the aisle, smiling broadly, waving',
    'Best Man': 'following couple down aisle with maid of honor, arm in arm',
    'Maid of Honor': 'following couple down aisle with best man, both smiling',
    'Bridesmaids': 'following in pairs down the aisle, smiling, clutching bouquets',
    'Groomsmen': 'following in pairs with bridesmaids down the aisle, hands clasped',
    'Guests': 'standing in rows, applauding as wedding party exits',
    'Officiant': 'standing at altar watching couple exit, smiling warmly',
  },
  "Ceremony::Confetti & Celebration": {
    'Bride': 'walking through shower of confetti with groom, laughing, shielding eyes',
    'Groom': 'walking through confetti shower with bride, arm around her, laughing',
    'Best Man': 'throwing confetti at couple, cheering loudly',
    'Maid of Honor': 'throwing confetti, jumping up and down, cheering',
    'Bridesmaids': 'standing in line throwing handfuls of confetti, cheering',
    'Groomsmen': 'standing in line throwing confetti, laughing',
    'Father of Bride': 'standing to side throwing confetti, beaming proudly',
    'Mother of Bride': 'throwing confetti, crying happy tears, hugging husband',
    'Guests': 'lining pathway throwing confetti over couple, cheering and clapping',
    'Flower Girl': 'throwing remaining flower petals at couple, giggling',
    'Ring Bearer': 'standing with groomsmen, throwing confetti, laughing',
  },
  "Ceremony::Receiving Line": {
    'Bride': 'standing in line outside venue, hugging and thanking each guest',
    'Groom': 'standing beside bride in receiving line, shaking hands, embracing guests',
    'Best Man': 'standing in receiving line, greeting guests, shaking hands',
    'Maid of Honor': 'standing in receiving line, hugging guests, chatting',
    'Father of Bride': 'standing in receiving line, shaking hands, beaming proudly',
    'Mother of Bride': 'standing in receiving line, hugging guests, wiping happy tears',
    'Guests': 'filing past couple in line, congratulating, hugging, shaking hands',
  },

  // ── Ceremony (seed-format names, kept for template matching) ───
  "Ceremony::Recessional & Confetti": {
    'Bride': 'walking back down the aisle with groom, laughing, confetti falling',
    'Groom': 'walking arm-in-arm with bride down the aisle, smiling broadly',
    'Bridesmaids': 'following couple down the aisle in pairs, throwing confetti',
    'Groomsmen': 'following couple down the aisle in pairs, throwing confetti',
  },
  "Ceremony::Guests Filing Out": {
    'Guests': 'standing and filing out of rows, chatting, moving toward exits',
  },
  "Confetti & Photos::Confetti Moment": {
    'Bride': 'walking through shower of confetti with groom, laughing, holding bouquet up',
    'Groom': 'walking through confetti shower with bride, arm around her, laughing',
    'Bridesmaids': 'standing in line throwing handfuls of confetti, cheering',
    'Groomsmen': 'standing in line throwing confetti, laughing',
    'Family': 'standing to side throwing confetti, smiling broadly',
    'Guests': 'lining pathway throwing confetti over couple, cheering',
  },
  "Confetti & Photos::Couple Portraits": {
    'Bride': 'standing close to groom in garden, looking into his eyes, holding bouquet',
    'Groom': 'standing with arm around bride in garden setting, gazing at her',
  },
  "Confetti & Photos::Bridal Party Portraits": {
    'Bride': 'standing in center of bridal party group, holding bouquet',
    'Groom': 'standing in center of groomsmen group, hands in pockets',
    'Bridesmaids': 'standing in a line flanking the bride, holding matching bouquets',
    'Groomsmen': 'standing in a line flanking the groom, hands clasped',
  },
  "Confetti & Photos::Family Portraits": {
    'Bride': 'standing with groom, flanked by both families on either side',
    'Groom': 'standing with bride, arm around her waist, families grouped around',
    'Family': 'standing in formal group arranged around the couple, smiling at camera',
  },
  "Reception Entry::Grand Entrance": {
    'Bride': 'entering reception hand-in-hand with groom through main doors, waving',
    'Groom': 'entering reception with bride, raising clasped hands triumphantly',
    'Guests': 'seated at tables, standing and applauding as couple enters',
    'Family': 'seated at head table area, standing to applaud',
  },
  "Reception Entry::Welcome Drinks": {
    'Bride': 'standing holding champagne glass, chatting with guests in reception area',
    'Groom': 'standing with drink, greeting guests, shaking hands',
    'Bridesmaids': 'standing in small group with drinks, chatting and laughing',
    'Groomsmen': 'standing with drinks, mingling with guests',
    'Family': 'standing with drinks, greeting other guests warmly',
    'Guests': 'standing in small groups, holding drinks, chatting and mingling',
  },
  "Reception Entry::Table Seating": {
    'Bride': 'walking to head table with groom, sitting down together',
    'Groom': 'pulling out chair for bride at head table, sitting beside her',
    'Guests': 'finding their seats, reading place cards, sitting down at round tables',
    'Family': 'seated at head table or front tables, settling in',
  },
  "Formal Dinner::Starters Served": {
    'Bride': 'seated at head table, eating starter course, chatting with groom',
    'Groom': 'seated at head table beside bride, eating and talking with neighbours',
    'Guests': 'seated at round tables eating starters, chatting across table',
    'Family': 'seated at front tables, eating and conversing',
  },
  "Formal Dinner::Main Course": {
    'Bride': 'seated at head table eating main course, laughing with bridesmaids',
    'Groom': 'seated at head table eating, leaning over to whisper to bride',
    'Guests': 'seated at tables eating main course, animated table conversation',
    'Family': 'seated at tables enjoying meal, clinking glasses',
  },
  "Formal Dinner::Dessert Service": {
    'Bride': 'seated at head table with dessert, sharing a bite with groom',
    'Groom': 'seated beside bride, feeding her a spoonful of dessert, laughing',
    'Guests': 'seated eating dessert, relaxed and chatting',
  },
  "Cake Cut & Speeches::Cake Cutting": {
    'Bride': 'standing beside wedding cake, holding knife together with groom, cutting first slice',
    'Groom': 'standing beside bride at cake, hand over hers on knife, cutting cake together',
    'Guests': 'seated and standing nearby, watching cake cutting, phones out for photos',
    'Family': 'standing close to couple watching cake cutting, smiling proudly',
  },
  "Cake Cut & Speeches::Best Man Speech": {
    'Groomsmen': 'best man standing at microphone, holding speech notes, gesturing while speaking',
    'Bride': "seated at head table, laughing at best man's jokes, leaning into groom",
    'Groom': 'seated at head table, laughing and covering face with hand, embarrassed',
    'Guests': 'seated at tables, laughing and clapping, watching speaker',
  },
  "Cake Cut & Speeches::Father of Bride Speech": {
    'Family': 'father standing at microphone, reading from paper, wiping eye with handkerchief',
    'Bride': "seated at head table, wiping tears, holding groom's hand under table",
    'Groom': 'seated beside bride, arm around her shoulders, listening respectfully',
    'Guests': 'seated quietly, some wiping tears, listening attentively',
  },
  "Cake Cut & Speeches::Groom Speech": {
    'Groom': 'standing at microphone, holding speech notes, looking at bride with emotion',
    'Bride': 'seated at head table looking up at groom, tearful, hands clasped',
    'Guests': 'seated at tables, listening attentively, some raising glasses',
    'Family': 'seated at front tables, beaming with pride, wiping tears',
  },
  "First Dance & Evening::First Dance": {
    'Bride': 'slow dancing with groom in center of dance floor, one hand on shoulder, swaying',
    'Groom': 'slow dancing with bride, one hand on her waist, leading gently',
    'Guests': 'standing around edge of dance floor watching couple dance, some filming',
    'Family': 'standing at front of crowd watching first dance, emotional',
  },
  "First Dance & Evening::Parent Dances": {
    'Bride': 'dancing with father on dance floor, head on his shoulder',
    'Groom': 'dancing with mother on dance floor, talking quietly',
    'Family': 'father dancing with bride, mother dancing with groom, other parents watching from edge',
    'Guests': 'standing around dance floor watching parent dances, some wiping tears',
  },
  "First Dance & Evening::Open Dancing": {
    'Bride': 'dancing energetically on dance floor, dress swirling, arms up',
    'Groom': 'dancing on dance floor with bride and guests, jacket off, tie loosened',
    'Bridesmaids': 'dancing together in a circle on dance floor, laughing',
    'Groomsmen': 'dancing in group, some doing silly moves, laughing',
    'Guests': 'filling dance floor, dancing in groups, having fun',
    'Family': 'some dancing, some seated at tables watching and clapping along',
  },
  "First Dance & Evening::Sparkler Exit": {
    'Bride': 'walking through tunnel of sparklers with groom, laughing, waving goodbye',
    'Groom': 'walking arm-in-arm with bride through sparkler tunnel, smiling broadly',
    'Guests': 'standing in two lines holding lit sparklers above heads forming tunnel',
    'Family': 'standing in sparkler line, waving goodbye to couple',
  },
};

async function main() {
  console.log('=== Backfill subject action descriptions ===\n');

  // ── 1. Update EventSubtypeActivityMoment.subject_actions ──────────
  let templateUpdated = 0;
  const eventActivities = await prisma.eventSubtypeActivity.findMany({
    include: { moments: true },
  });
  for (const activity of eventActivities) {
    for (const moment of activity.moments) {
      const key = `${activity.name}::${moment.name}`;
      const actions = ACTION_MAP[key];
      if (actions) {
        await prisma.eventSubtypeActivityMoment.update({
          where: { id: moment.id },
          data: { subject_actions: actions },
        });
        templateUpdated++;
      }
    }
  }
  console.log(`[1/4] EventSubtypeActivityMoment: updated ${templateUpdated} records`);

  // ── 2. Update PackageActivityMoment.subject_actions ──────────────
  let pkgMomentUpdated = 0;
  const pkgActivities = await prisma.packageActivity.findMany({
    include: { moments: true },
  });
  for (const activity of pkgActivities) {
    for (const moment of activity.moments) {
      const key = `${activity.name}::${moment.name}`;
      const actions = ACTION_MAP[key];
      if (actions) {
        await prisma.packageActivityMoment.update({
          where: { id: moment.id },
          data: { subject_actions: actions },
        });
        pkgMomentUpdated++;
      }
    }
  }
  console.log(`[2/4] PackageActivityMoment: updated ${pkgMomentUpdated} records`);

  // ── 3. Backfill FilmSceneMomentSubject.action_description ────────
  // Strategy: FilmScene → PackageFilmSceneSchedule → PackageActivity.name
  // This works even when SceneMoment.source_activity_id is null.
  const scenes = await prisma.filmScene.findMany({
    include: {
      package_schedules: {
        include: { package_activity: { select: { id: true, name: true } } },
      },
      moments: {
        include: {
          subjects: {
            include: {
              subject: { include: { role_template: true } },
            },
          },
        },
      },
    },
  });

  let junctionUpdated = 0;
  let junctionSkipped = 0;
  let momentsSourceFixed = 0;
  for (const scene of scenes) {
    // Find the activity name for this scene via the schedule
    const schedule = scene.package_schedules.find(s => s.package_activity_id != null);
    const activityName = schedule?.package_activity?.name;
    if (!activityName) continue;
    const activityId = schedule!.package_activity_id!;

    for (const moment of scene.moments) {
      // Also fix source_activity_id if missing
      if (!moment.source_activity_id) {
        await prisma.sceneMoment.update({
          where: { id: moment.id },
          data: { source_activity_id: activityId },
        });
        momentsSourceFixed++;
      }

      const key = `${activityName}::${moment.name}`;
      const actions = ACTION_MAP[key];
      if (!actions) continue;

      for (const ms of moment.subjects) {
        const roleName = ms.subject.role_template?.role_name || ms.subject.name;
        const actionDesc = actions[roleName];
        if (actionDesc && ms.action_description !== actionDesc) {
          await prisma.filmSceneMomentSubject.update({
            where: { id: ms.id },
            data: { action_description: actionDesc },
          });
          junctionUpdated++;
        } else {
          junctionSkipped++;
        }
      }
    }
  }
  console.log(`[3/4] FilmSceneMomentSubject: updated ${junctionUpdated}, skipped ${junctionSkipped}`);
  console.log(`      Also fixed source_activity_id on ${momentsSourceFixed} SceneMoments`);

  // ── 4. Backfill ProjectFilmSceneMomentSubject.action_description ─
  // Use source_moment → scene → schedule path
  const projectMoments = await prisma.projectFilmSceneMoment.findMany({
    where: { source_moment_id: { not: null } },
    include: {
      source_moment: {
        include: {
          film_scene: {
            include: {
              package_schedules: {
                include: { package_activity: { select: { name: true } } },
              },
            },
          },
        },
      },
      subjects: {
        include: {
          project_subject: { include: { role_template: true } },
        },
      },
    },
  });

  let projUpdated = 0;
  for (const pm of projectMoments) {
    const srcScene = pm.source_moment?.film_scene;
    const schedule = srcScene?.package_schedules?.find((s: any) => s.package_activity_id != null);
    const activityName = schedule?.package_activity?.name;
    if (!activityName) continue;

    const momentName = pm.source_moment?.name || pm.name;
    const key = `${activityName}::${momentName}`;
    const actions = ACTION_MAP[key];
    if (!actions) continue;

    for (const ms of pm.subjects) {
      const roleName = ms.project_subject?.role_template?.role_name || ms.project_subject?.name || '';
      const actionDesc = actions[roleName];
      if (actionDesc && ms.action_description !== actionDesc) {
        await prisma.projectFilmSceneMomentSubject.update({
          where: { id: ms.id },
          data: { action_description: actionDesc },
        });
        projUpdated++;
      }
    }
  }
  console.log(`[4/4] ProjectFilmSceneMomentSubject: updated ${projUpdated}`);

  console.log('\n=== Done ===');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
