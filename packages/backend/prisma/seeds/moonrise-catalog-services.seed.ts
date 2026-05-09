/**
 * Moonrise Catalog – Services
 *
 * Consolidated seed that defines all package templates available to the brand:
 *   1. Canonical category package templates with activities, moments, locations, subjects
 *   2. Birthday PackageTemplate (subject roles, day template, and package set)
 *   3. Per-category package_sets with default tier slots
 *
 * Prerequisites:
 *   - moonrise-platform-brand-setup
 *   - moonrise-catalog-event-templates (event days + subject roles)
 */

import { PrismaClient } from '@prisma/client';
import { createSeedLogger, SeedSummary, SeedType, sumSummaries } from '../utils/seed-logger';

let prisma: PrismaClient;
const logger = createSeedLogger(SeedType.MOONRISE);

// ═══════════════════════════════════════════════════════════════════════
// PART 1 — Canonical Wedding PackageTemplate
// ═══════════════════════════════════════════════════════════════════════

interface LocationDef { name: string; location_type: string; order_index: number; is_primary: boolean }
interface SubjectDef { name: string; subject_type: string; typical_count: number; order_index: number; is_primary: boolean }
interface MomentDef { name: string; duration_seconds: number; order_index: number; is_key_moment: boolean; subject_actions?: Record<string, string> }
interface ActivityDef {
  name: string; icon: string; color: string; duration_minutes: number;
  start_time_offset_minutes: number; order_index: number;
  locations: string[]; subjects: string[]; moments: MomentDef[];
}
interface PackageTemplateDef {
  name: string; description: string; total_duration_hours: number;
  event_start_time: string; typical_guest_count: number; key: string;
}

const LOCATIONS_BY_TYPE: Record<string, LocationDef[]> = {
  traditional_british: [
    { name: "Bride's Getting Ready Location", location_type: 'getting_ready', order_index: 0, is_primary: true },
    { name: "Groom's Getting Ready Location", location_type: 'getting_ready', order_index: 1, is_primary: false },
    { name: 'Ceremony Venue', location_type: 'ceremony', order_index: 2, is_primary: false },
    { name: 'Reception Venue/Marquee', location_type: 'reception', order_index: 3, is_primary: false },
    { name: 'Photo Locations (Garden/Grounds)', location_type: 'photo', order_index: 4, is_primary: false },
  ],
  indian_wedding: [
    { name: "Bride's Home (Mehendi/Henna)", location_type: 'getting_ready', order_index: 0, is_primary: true },
    { name: 'Temple/Ceremony Venue', location_type: 'ceremony', order_index: 1, is_primary: false },
    { name: "Groom's Home (Baraat)", location_type: 'ceremony', order_index: 2, is_primary: false },
    { name: 'Reception Venue', location_type: 'reception', order_index: 3, is_primary: false },
    { name: 'Photo Locations', location_type: 'photo', order_index: 4, is_primary: false },
  ],
  pakistani_wedding: [
    { name: "Bride's Home (Mehndi)", location_type: 'getting_ready', order_index: 0, is_primary: true },
    { name: 'Venue (Walima/Reception)', location_type: 'reception', order_index: 1, is_primary: false },
    { name: "Groom's Home", location_type: 'getting_ready', order_index: 2, is_primary: false },
    { name: 'Photo Locations', location_type: 'photo', order_index: 3, is_primary: false },
  ],
  registry_celebration: [
    { name: 'Registry Venue', location_type: 'getting_ready', order_index: 0, is_primary: true },
    { name: 'Celebration Venue', location_type: 'reception', order_index: 1, is_primary: false },
    { name: 'Photo Locations', location_type: 'photo', order_index: 2, is_primary: false },
  ],
  garden_intimate: [
    { name: 'Getting Ready Space', location_type: 'getting_ready', order_index: 0, is_primary: true },
    { name: 'Garden Ceremony Area', location_type: 'ceremony', order_index: 1, is_primary: false },
    { name: 'Reception Area/Marquee', location_type: 'reception', order_index: 2, is_primary: false },
    { name: 'Photo Spots (Garden/Grounds)', location_type: 'photo', order_index: 3, is_primary: false },
  ],
};

const SUBJECTS_BY_TYPE: Record<string, SubjectDef[]> = {
  traditional_british: [
    { name: 'Bride', subject_type: 'couple', typical_count: 1, order_index: 0, is_primary: true },
    { name: 'Groom', subject_type: 'couple', typical_count: 1, order_index: 1, is_primary: true },
    { name: 'Bridesmaids', subject_type: 'wedding_party', typical_count: 4, order_index: 2, is_primary: false },
    { name: 'Groomsmen', subject_type: 'wedding_party', typical_count: 4, order_index: 3, is_primary: false },
    { name: 'Family', subject_type: 'family', typical_count: 10, order_index: 4, is_primary: false },
    { name: 'Guests', subject_type: 'guests', typical_count: 100, order_index: 5, is_primary: false },
  ],
  indian_wedding: [
    { name: 'Bride', subject_type: 'couple', typical_count: 1, order_index: 0, is_primary: true },
    { name: 'Groom', subject_type: 'couple', typical_count: 1, order_index: 1, is_primary: true },
    { name: 'Bridesmaids', subject_type: 'wedding_party', typical_count: 4, order_index: 2, is_primary: false },
    { name: 'Groomsmen', subject_type: 'wedding_party', typical_count: 4, order_index: 3, is_primary: false },
    { name: 'Family', subject_type: 'family', typical_count: 15, order_index: 4, is_primary: false },
    { name: 'Guests', subject_type: 'guests', typical_count: 150, order_index: 5, is_primary: false },
  ],
  pakistani_wedding: [
    { name: 'Bride', subject_type: 'couple', typical_count: 1, order_index: 0, is_primary: true },
    { name: 'Groom', subject_type: 'couple', typical_count: 1, order_index: 1, is_primary: true },
    { name: 'Bridesmaids', subject_type: 'wedding_party', typical_count: 4, order_index: 2, is_primary: false },
    { name: 'Groomsmen', subject_type: 'wedding_party', typical_count: 4, order_index: 3, is_primary: false },
    { name: 'Family', subject_type: 'family', typical_count: 10, order_index: 4, is_primary: false },
    { name: 'Guests', subject_type: 'guests', typical_count: 100, order_index: 5, is_primary: false },
  ],
  registry_celebration: [
    { name: 'Bride', subject_type: 'couple', typical_count: 1, order_index: 0, is_primary: true },
    { name: 'Groom', subject_type: 'couple', typical_count: 1, order_index: 1, is_primary: true },
    { name: 'Family', subject_type: 'family', typical_count: 6, order_index: 2, is_primary: false },
    { name: 'Guests', subject_type: 'guests', typical_count: 70, order_index: 3, is_primary: false },
  ],
  garden_intimate: [
    { name: 'Bride', subject_type: 'couple', typical_count: 1, order_index: 0, is_primary: true },
    { name: 'Groom', subject_type: 'couple', typical_count: 1, order_index: 1, is_primary: true },
    { name: 'Bridesmaids', subject_type: 'wedding_party', typical_count: 2, order_index: 2, is_primary: false },
    { name: 'Groomsmen', subject_type: 'wedding_party', typical_count: 2, order_index: 3, is_primary: false },
    { name: 'Family', subject_type: 'family', typical_count: 8, order_index: 4, is_primary: false },
    { name: 'Guests', subject_type: 'guests', typical_count: 40, order_index: 5, is_primary: false },
  ],
};

const WEDDING_TYPE_TEMPLATES: (PackageTemplateDef & { activities: ActivityDef[] })[] = [
  {
    name: '🇬🇧 Traditional British Wedding',
    description: 'Classic British wedding with ceremony and reception',
    total_duration_hours: 10, event_start_time: '14:00', typical_guest_count: 100, key: 'traditional_british',
    activities: [
      {
        name: 'Getting Ready', icon: 'glam', color: '#ec4899', duration_minutes: 75, start_time_offset_minutes: 0, order_index: 0,
        locations: ["Bride's Getting Ready Location", "Groom's Getting Ready Location"],
        subjects: ['Bride', 'Groom', 'Bridesmaids', 'Maid of Honor', 'Father of Bride', 'Mother of Bride'],
        moments: [
          { name: "Bride's Hair & Makeup", duration_seconds: 1200, order_index: 0, is_key_moment: false, subject_actions: {
            'Bride': 'seated in dressing gown, stylist doing hair, looking into handheld mirror',
            'Bridesmaids': 'seated nearby having makeup applied, chatting and laughing together',
            'Maid of Honor': 'seated beside bride, having makeup done, chatting and laughing',
          }},
          { name: 'Bride Getting Dressed', duration_seconds: 600, order_index: 1, is_key_moment: false, subject_actions: {
            'Bride': 'stepping into wedding dress, mother helping with buttons at the back',
            'Bridesmaids': 'standing around bride helping adjust dress and veil, holding train',
            'Mother of Bride': 'kneeling behind bride fastening buttons on dress, emotional',
            'Maid of Honor': 'holding veil ready, adjusting bride\'s train',
          }},
          { name: 'Groom Getting Ready', duration_seconds: 900, order_index: 2, is_key_moment: false, subject_actions: {
            'Groom': 'standing at mirror adjusting tie and cufflinks, wearing dark suit',
          }},
          { name: 'Final Touches & Veil', duration_seconds: 300, order_index: 3, is_key_moment: false, subject_actions: {
            'Bride': 'standing in full wedding dress, mother placing veil on head',
            'Mother of Bride': 'standing behind bride, carefully placing and adjusting veil',
            'Bridesmaids': 'watching bride with emotional expressions, one holding bouquet ready',
          }},
          { name: 'Bridesmaids Preparation', duration_seconds: 600, order_index: 4, is_key_moment: false, subject_actions: {
            'Bridesmaids': 'lined up in matching dresses, adjusting each other\'s hair and accessories',
            'Maid of Honor': 'helping bridesmaids with final touches, checking everyone looks ready',
            'Bride': 'seated watching bridesmaids get ready, holding champagne glass',
          }},
          { name: 'Father of Bride Reaction', duration_seconds: 300, order_index: 5, is_key_moment: true, subject_actions: {
            'Bride': 'standing in full wedding dress and veil, turning to face her father',
            'Father of Bride': 'standing in doorway, hand over mouth, emotional reaction seeing bride',
            'Mother of Bride': 'standing beside husband, hand on his arm, wiping tears',
          }},
        ],
      },
      {
        name: 'Ceremony', icon: 'heart', color: '#f59e0b', duration_minutes: 45, start_time_offset_minutes: 75, order_index: 1,
        locations: ['Ceremony Venue'],
        subjects: ['Bride', 'Groom', 'Best Man', 'Maid of Honor', 'Father of Bride', 'Mother of Bride', 'Father of Groom', 'Mother of Groom', 'Bridesmaids', 'Groomsmen', 'Flower Girl', 'Ring Bearer', 'Guests', 'Officiant'],
        moments: [
          { name: 'Guest Seating', duration_seconds: 300, order_index: 0, is_key_moment: false, subject_actions: {
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
          }},
          { name: 'Groom Takes Position', duration_seconds: 120, order_index: 1, is_key_moment: false, subject_actions: {
            'Groom': 'walking to altar from side entrance, adjusting jacket, taking position',
            'Best Man': 'walking beside groom to altar, patting him on shoulder reassuringly',
            'Groomsmen': 'filing into position beside altar in a line, standing at attention',
            'Guests': 'seated watching groom take position, murmuring quietly',
            'Officiant': 'standing at altar, nodding to groom as he takes position',
          }},
          { name: 'Bridal Party Processional', duration_seconds: 180, order_index: 2, is_key_moment: false, subject_actions: {
            'Bridesmaids': 'walking down aisle one by one in matching dresses, holding small bouquets',
            'Groomsmen': 'standing at altar watching bridesmaids approach, smiling',
            'Maid of Honor': 'walking down aisle last before bride, holding bouquet, poised',
            'Flower Girl': 'walking down aisle scattering petals from basket, looking around shyly',
            'Ring Bearer': 'walking down aisle carrying ring cushion carefully, concentrating',
            'Groom': 'standing at altar watching processional, anticipation building',
            'Guests': 'seated, turning to watch bridal party walk down aisle',
          }},
          { name: 'Bride Arrival', duration_seconds: 120, order_index: 3, is_key_moment: true, subject_actions: {
            'Bride': 'stepping out of wedding car in full dress, father helping with train',
            'Groom': 'standing at altar, facing forward, nervously awaiting bride',
            'Best Man': 'standing beside groom, whispering reassurance, both looking toward entrance',
            'Maid of Honor': 'arranging bride\'s dress and veil outside venue, handing her bouquet',
            'Father of Bride': 'standing beside bride at venue entrance, offering his arm',
            'Mother of Bride': 'seated in front row, turning to look toward entrance expectantly',
            'Bridesmaids': 'lined up inside entrance ready to walk, adjusting bouquets',
            'Guests': 'seated, turning to look toward entrance, hushed anticipation',
            'Officiant': 'standing at altar, signaling ceremony is about to begin',
          }},
          { name: 'Bride Entrance', duration_seconds: 180, order_index: 4, is_key_moment: true, subject_actions: {
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
          }},
          { name: 'Giving Away', duration_seconds: 120, order_index: 5, is_key_moment: true, subject_actions: {
            'Bride': 'standing at altar, father lifting veil and kissing her cheek',
            'Groom': 'stepping forward to take bride\'s hand from father, nodding respectfully',
            'Father of Bride': 'lifting bride\'s veil, kissing her cheek, placing her hand in groom\'s',
            'Mother of Bride': 'seated in front row, wiping tears, watching husband give daughter away',
            'Guests': 'seated watching giving away moment, many wiping tears',
            'Officiant': 'standing at altar, asking who gives this woman, overseeing handover',
          }},
          { name: 'Officiant Welcome', duration_seconds: 180, order_index: 6, is_key_moment: false, subject_actions: {
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
          }},
          { name: 'Opening Remarks', duration_seconds: 300, order_index: 7, is_key_moment: false, subject_actions: {
            'Bride': 'standing beside groom at altar, looking at officiant, hands held together',
            'Groom': 'standing beside bride at altar, looking at officiant, standing tall',
            'Best Man': 'standing to side, listening to officiant speak',
            'Maid of Honor': 'standing to bride\'s side, listening attentively',
            'Guests': 'seated in rows, listening to officiant, quiet and attentive',
            'Officiant': 'standing at lectern, speaking about love and commitment, addressing congregation',
          }},
          { name: 'Readings', duration_seconds: 300, order_index: 8, is_key_moment: false, subject_actions: {
            'Bride': 'standing at altar, listening to reading, squeezing groom\'s hand',
            'Groom': 'standing at altar, listening to reading, glancing at bride with emotion',
            'Best Man': 'standing at lectern reading passage, holding paper, speaking clearly',
            'Maid of Honor': 'standing at lectern reading poem, emotional voice, looking up at couple',
            'Guests': 'seated listening to readings, some nodding, some wiping tears',
            'Officiant': 'seated to side, listening to reader, waiting to continue ceremony',
          }},
          { name: 'Vows Exchange', duration_seconds: 600, order_index: 9, is_key_moment: true, subject_actions: {
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
          }},
          { name: 'Ring Exchange', duration_seconds: 180, order_index: 10, is_key_moment: true, subject_actions: {
            'Bride': 'sliding ring onto groom\'s finger, hands close together at altar',
            'Groom': 'holding bride\'s hand, placing ring on her finger',
            'Best Man': 'stepping forward to hand rings to officiant, then returning to position',
            'Ring Bearer': 'standing nearby after presenting ring cushion, watching proudly',
            'Father of Bride': 'seated in front row, leaning forward watching ring exchange',
            'Mother of Bride': 'seated in front row, hands clasped, watching intently',
            'Guests': 'seated watching intently, some craning to see rings',
            'Officiant': 'standing behind couple, holding open prayer book, blessing rings',
          }},
          { name: 'Unity Ceremony', duration_seconds: 180, order_index: 11, is_key_moment: false, subject_actions: {
            'Bride': 'pouring sand or lighting candle together with groom, symbolic gesture',
            'Groom': 'pouring sand or lighting candle with bride, both holding together',
            'Best Man': 'standing to side watching unity ceremony, respectful',
            'Maid of Honor': 'standing to side watching, holding bouquet',
            'Guests': 'seated watching unity ceremony, quiet reverence',
            'Officiant': 'standing behind couple, explaining the symbolism of the unity ceremony',
          }},
          { name: 'Pronouncement', duration_seconds: 60, order_index: 12, is_key_moment: true, subject_actions: {
            'Bride': 'standing facing groom, beaming smile, anticipation in her eyes',
            'Groom': 'standing facing bride, wide smile, holding both her hands',
            'Best Man': 'standing to side, grinning, ready to congratulate',
            'Maid of Honor': 'standing to side, emotional, hands clasped to chest',
            'Bridesmaids': 'standing in line, leaning forward in anticipation, smiling',
            'Groomsmen': 'standing in line, grinning, nudging each other',
            'Guests': 'seated, leaning forward in seats, anticipation, ready to cheer',
            'Officiant': 'standing at lectern, pronouncing couple married, arms raised',
          }},
          { name: 'First Kiss', duration_seconds: 120, order_index: 13, is_key_moment: true, subject_actions: {
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
          }},
          { name: 'Recessional', duration_seconds: 180, order_index: 14, is_key_moment: true, subject_actions: {
            'Bride': 'walking back down the aisle with groom, beaming, holding bouquet high',
            'Groom': 'walking arm-in-arm with bride down the aisle, smiling broadly, waving',
            'Best Man': 'following couple down aisle with maid of honor, arm in arm',
            'Maid of Honor': 'following couple down aisle with best man, both smiling',
            'Bridesmaids': 'following in pairs down the aisle, smiling, clutching bouquets',
            'Groomsmen': 'following in pairs with bridesmaids down the aisle, hands clasped',
            'Guests': 'standing in rows, applauding as wedding party exits',
            'Officiant': 'standing at altar watching couple exit, smiling warmly',
          }},
          { name: 'Confetti & Celebration', duration_seconds: 300, order_index: 15, is_key_moment: true, subject_actions: {
            'Bride': 'walking through shower of confetti with groom, laughing, shielding eyes',
            'Groom': 'walking through confetti shower with bride, arm around her, laughing',
            'Best Man': 'throwing confetti at couple, cheering loudly',
            'Maid of Honor': 'throwing confetti, jumping up and down, cheering',
            'Bridesmaids': 'standing in line throwing handfuls of confetti, cheering',
            'Groomsmen': 'standing in line throwing confetti, laughing',
            'Father of Bride': 'standing to side throwing confetti, beaming proudly',
            'Mother of Bride': 'throwing confetti, crying happy tears, hugging husband',
            'Flower Girl': 'throwing remaining flower petals at couple, giggling',
            'Ring Bearer': 'standing with groomsmen, throwing confetti, laughing',
            'Guests': 'lining pathway throwing confetti over couple, cheering and clapping',
          }},
          { name: 'Receiving Line', duration_seconds: 600, order_index: 16, is_key_moment: false, subject_actions: {
            'Bride': 'standing in line outside venue, hugging and thanking each guest',
            'Groom': 'standing beside bride in receiving line, shaking hands, embracing guests',
            'Best Man': 'standing in receiving line, greeting guests, shaking hands',
            'Maid of Honor': 'standing in receiving line, hugging guests, chatting',
            'Father of Bride': 'standing in receiving line, shaking hands, beaming proudly',
            'Mother of Bride': 'standing in receiving line, hugging guests, wiping happy tears',
            'Guests': 'filing past couple in line, congratulating, hugging, shaking hands',
          }},
        ],
      },
      {
        name: 'Confetti & Photos', icon: 'sparkles', color: '#10b981', duration_minutes: 30, start_time_offset_minutes: 120, order_index: 2,
        locations: ['Ceremony Venue', 'Photo Locations (Garden/Grounds)'],
        subjects: ['Bride', 'Groom', 'Best Man', 'Maid of Honor', 'Bridesmaids', 'Groomsmen', 'Father of Bride', 'Mother of Bride', 'Father of Groom', 'Mother of Groom', 'Guests'],
        moments: [
          { name: 'Confetti Moment', duration_seconds: 300, order_index: 0, is_key_moment: true, subject_actions: {
            'Bride': 'walking through shower of confetti with groom, laughing, holding bouquet up',
            'Groom': 'walking through confetti shower with bride, arm around her, laughing',
            'Bridesmaids': 'standing in line throwing handfuls of confetti, cheering',
            'Groomsmen': 'standing in line throwing confetti, laughing',
            'Father of Bride': 'standing to side throwing confetti, beaming proudly',
            'Mother of Bride': 'throwing confetti, crying happy tears',
            'Guests': 'lining pathway throwing confetti over couple, cheering',
          }},
          { name: 'Couple Portraits', duration_seconds: 900, order_index: 1, is_key_moment: true, subject_actions: {
            'Bride': 'standing close to groom in garden, looking into his eyes, holding bouquet',
            'Groom': 'standing with arm around bride in garden setting, gazing at her',
          }},
          { name: 'Bridal Party Portraits', duration_seconds: 900, order_index: 2, is_key_moment: false, subject_actions: {
            'Bride': 'standing in center of bridal party group, holding bouquet',
            'Groom': 'standing in center of groomsmen group, hands in pockets',
            'Best Man': 'standing beside groom in group photo, hand on shoulder',
            'Maid of Honor': 'standing beside bride in group photo, arms linked',
            'Bridesmaids': 'standing in a line flanking the bride, holding matching bouquets',
            'Groomsmen': 'standing in a line flanking the groom, hands clasped',
          }},
          { name: 'Family Portraits', duration_seconds: 900, order_index: 3, is_key_moment: false, subject_actions: {
            'Bride': 'standing with groom, flanked by both families on either side',
            'Groom': 'standing with bride, arm around her waist, families grouped around',
            'Father of Bride': 'standing beside bride, arm around her, proud smile',
            'Mother of Bride': 'standing beside bride, holding her hand, beaming',
            'Father of Groom': 'standing beside groom, hand on shoulder, proud',
            'Mother of Groom': 'standing beside groom, arm linked with his, smiling warmly',
          }},
        ],
      },
      {
        name: 'Reception Entry', icon: 'door', color: '#6366f1', duration_minutes: 30, start_time_offset_minutes: 150, order_index: 3,
        locations: ['Reception Venue/Marquee'],
        subjects: ['Bride', 'Groom', 'Best Man', 'Maid of Honor', 'Bridesmaids', 'Groomsmen', 'Father of Bride', 'Mother of Bride', 'Father of Groom', 'Mother of Groom', 'Guests'],
        moments: [
          { name: 'Grand Entrance', duration_seconds: 300, order_index: 0, is_key_moment: true, subject_actions: {
            'Bride': 'entering reception hand-in-hand with groom through main doors, waving',
            'Groom': 'entering reception with bride, raising clasped hands triumphantly',
            'Guests': 'seated at tables, standing and applauding as couple enters',
            'Father of Bride': 'seated at head table area, standing to applaud',
            'Mother of Bride': 'seated at head table area, standing to applaud, wiping tears',
            'Father of Groom': 'seated at head table area, standing to applaud proudly',
            'Mother of Groom': 'seated at head table area, standing to applaud, beaming',
          }},
          { name: 'Welcome Drinks', duration_seconds: 900, order_index: 1, is_key_moment: false, subject_actions: {
            'Bride': 'standing holding champagne glass, chatting with guests in reception area',
            'Groom': 'standing with drink, greeting guests, shaking hands',
            'Bridesmaids': 'standing in small group with drinks, chatting and laughing',
            'Groomsmen': 'standing with drinks, mingling with guests',
            'Best Man': 'standing with groom, drink in hand, introducing guests',
            'Maid of Honor': 'standing with bride, chatting with guests, holding champagne',
            'Father of Bride': 'standing with drink, greeting guests warmly, shaking hands',
            'Mother of Bride': 'standing with drink, chatting with family and friends',
            'Guests': 'standing in small groups, holding drinks, chatting and mingling',
          }},
          { name: 'Table Seating', duration_seconds: 600, order_index: 2, is_key_moment: false, subject_actions: {
            'Bride': 'walking to head table with groom, sitting down together',
            'Groom': 'pulling out chair for bride at head table, sitting beside her',
            'Guests': 'finding their seats, reading place cards, sitting down at round tables',
            'Father of Bride': 'seated at head table, settling in, chatting with mother of bride',
            'Mother of Bride': 'seated at head table, arranging her place setting',
          }},
        ],
      },
      {
        name: 'Formal Dinner', icon: 'utensils', color: '#0ea5e9', duration_minutes: 120, start_time_offset_minutes: 180, order_index: 4,
        locations: ['Reception Venue/Marquee'],
        subjects: ['Bride', 'Groom', 'Best Man', 'Maid of Honor', 'Bridesmaids', 'Groomsmen', 'Father of Bride', 'Mother of Bride', 'Father of Groom', 'Mother of Groom', 'Guests'],
        moments: [
          { name: 'Starters Served', duration_seconds: 900, order_index: 0, is_key_moment: false, subject_actions: {
            'Bride': 'seated at head table, eating starter course, chatting with groom',
            'Groom': 'seated at head table beside bride, eating and talking with neighbours',
            'Guests': 'seated at round tables eating starters, chatting across table',
            'Father of Bride': 'seated at head table, eating and conversing with family',
            'Mother of Bride': 'seated at head table, chatting with mother of groom',
          }},
          { name: 'Main Course', duration_seconds: 1200, order_index: 1, is_key_moment: false, subject_actions: {
            'Bride': 'seated at head table eating main course, laughing with bridesmaids',
            'Groom': 'seated at head table eating, leaning over to whisper to bride',
            'Guests': 'seated at tables eating main course, animated table conversation',
            'Best Man': 'seated at head table, chatting across table, laughing',
            'Maid of Honor': 'seated at head table beside bride, sharing a joke',
            'Father of Bride': 'seated enjoying meal, clinking glasses with father of groom',
            'Mother of Bride': 'seated at table enjoying meal, chatting with guests',
          }},
          { name: 'Dessert Service', duration_seconds: 600, order_index: 2, is_key_moment: false, subject_actions: {
            'Bride': 'seated at head table with dessert, sharing a bite with groom',
            'Groom': 'seated beside bride, feeding her a spoonful of dessert, laughing',
            'Guests': 'seated eating dessert, relaxed and chatting',
          }},
        ],
      },
      {
        name: 'Cake Cut & Speeches', icon: 'cake', color: '#8b5cf6', duration_minutes: 45, start_time_offset_minutes: 300, order_index: 5,
        locations: ['Reception Venue/Marquee'],
        subjects: ['Bride', 'Groom', 'Best Man', 'Maid of Honor', 'Groomsmen', 'Father of Bride', 'Mother of Bride', 'Father of Groom', 'Mother of Groom', 'Guests'],
        moments: [
          { name: 'Cake Cutting', duration_seconds: 300, order_index: 0, is_key_moment: true, subject_actions: {
            'Bride': 'standing beside wedding cake, holding knife together with groom, cutting first slice',
            'Groom': 'standing beside bride at cake, hand over hers on knife, cutting cake together',
            'Guests': 'seated and standing nearby, watching cake cutting, phones out for photos',
            'Father of Bride': 'standing close to couple watching cake cutting, smiling proudly',
            'Mother of Bride': 'standing beside husband, watching cake cutting, emotional',
            'Father of Groom': 'standing nearby, watching proudly, phone out for photos',
            'Mother of Groom': 'standing nearby, clapping, beaming at couple',
          }},
          { name: 'Best Man Speech', duration_seconds: 600, order_index: 1, is_key_moment: true, subject_actions: {
            'Best Man': 'standing at microphone, holding speech notes, gesturing while speaking',
            'Bride': 'seated at head table, laughing at best man\'s jokes, leaning into groom',
            'Groom': 'seated at head table, laughing and covering face with hand, embarrassed',
            'Guests': 'seated at tables, laughing and clapping, watching speaker',
            'Groomsmen': 'seated at head table, laughing, nudging each other',
          }},
          { name: 'Father of Bride Speech', duration_seconds: 600, order_index: 2, is_key_moment: true, subject_actions: {
            'Father of Bride': 'standing at microphone, reading from paper, wiping eye with handkerchief',
            'Bride': 'seated at head table, wiping tears, holding groom\'s hand under table',
            'Groom': 'seated beside bride, arm around her shoulders, listening respectfully',
            'Mother of Bride': 'seated at head table, wiping tears, watching husband proudly',
            'Guests': 'seated quietly, some wiping tears, listening attentively',
          }},
          { name: 'Groom Speech', duration_seconds: 600, order_index: 3, is_key_moment: true, subject_actions: {
            'Groom': 'standing at microphone, holding speech notes, looking at bride with emotion',
            'Bride': 'seated at head table looking up at groom, tearful, hands clasped',
            'Guests': 'seated at tables, listening attentively, some raising glasses',
            'Father of Bride': 'seated at front table, beaming with pride',
            'Mother of Bride': 'seated at front table, wiping tears',
            'Father of Groom': 'seated at front table, nodding proudly, raising glass',
            'Mother of Groom': 'seated at front table, wiping tears, clutching handkerchief',
          }},
        ],
      },
      {
        name: 'First Dance & Evening', icon: 'music', color: '#ec4899', duration_minutes: 90, start_time_offset_minutes: 345, order_index: 6,
        locations: ['Reception Venue/Marquee'],
        subjects: ['Bride', 'Groom', 'Best Man', 'Maid of Honor', 'Bridesmaids', 'Groomsmen', 'Father of Bride', 'Mother of Bride', 'Father of Groom', 'Mother of Groom', 'Guests'],
        moments: [
          { name: 'First Dance', duration_seconds: 240, order_index: 0, is_key_moment: true, subject_actions: {
            'Bride': 'slow dancing with groom in center of dance floor, one hand on shoulder, swaying',
            'Groom': 'slow dancing with bride, one hand on her waist, leading gently',
            'Guests': 'standing around edge of dance floor watching couple dance, some filming',
            'Father of Bride': 'standing at front of crowd watching first dance, emotional',
            'Mother of Bride': 'standing beside husband, watching first dance, wiping tears',
            'Father of Groom': 'standing at front of crowd, watching proudly',
            'Mother of Groom': 'standing at front of crowd, emotional, clutching handkerchief',
          }},
          { name: 'Parent Dances', duration_seconds: 360, order_index: 1, is_key_moment: true, subject_actions: {
            'Bride': 'dancing with father on dance floor, head on his shoulder',
            'Groom': 'dancing with mother on dance floor, talking quietly',
            'Father of Bride': 'dancing with bride on dance floor, holding her hand, emotional',
            'Mother of Groom': 'dancing with groom on dance floor, hand on his shoulder, proud',
            'Mother of Bride': 'watching from edge of dance floor, wiping tears, leaning on husband',
            'Father of Groom': 'watching from edge of dance floor, arm around wife, proud',
            'Guests': 'standing around dance floor watching parent dances, some wiping tears',
          }},
          { name: 'Open Dancing', duration_seconds: 3600, order_index: 2, is_key_moment: false, subject_actions: {
            'Bride': 'dancing energetically on dance floor, dress swirling, arms up',
            'Groom': 'dancing on dance floor with bride and guests, jacket off, tie loosened',
            'Bridesmaids': 'dancing together in a circle on dance floor, laughing',
            'Groomsmen': 'dancing in group, some doing silly moves, laughing',
            'Best Man': 'dancing near groom, leading group dance moves, laughing',
            'Maid of Honor': 'dancing with bride and bridesmaids, arms around each other',
            'Guests': 'filling dance floor, dancing in groups, having fun',
            'Father of Bride': 'seated at table watching and clapping along, tapping foot',
            'Mother of Bride': 'dancing with friends, laughing, having fun',
          }},
          { name: 'Sparkler Exit', duration_seconds: 300, order_index: 3, is_key_moment: true, subject_actions: {
            'Bride': 'walking through tunnel of sparklers with groom, laughing, waving goodbye',
            'Groom': 'walking arm-in-arm with bride through sparkler tunnel, smiling broadly',
            'Guests': 'standing in two lines holding lit sparklers above heads forming tunnel',
            'Best Man': 'standing at end of sparkler tunnel, cheering couple through',
            'Maid of Honor': 'standing in sparkler line, waving goodbye, emotional',
            'Father of Bride': 'standing in sparkler line, waving goodbye to daughter',
            'Mother of Bride': 'standing in sparkler line, waving, wiping happy tears',
          }},
        ],
      },
    ],
  },
  {
    name: '🇮🇳 Indian Wedding',
    description: 'Multi-day Indian wedding celebration',
    total_duration_hours: 14, event_start_time: '12:00', typical_guest_count: 150, key: 'indian_wedding',
    activities: [
      {
        name: 'Mehendi (Henna)', icon: 'sparkles', color: '#06b6d4', duration_minutes: 180, start_time_offset_minutes: 0, order_index: 0,
        locations: ["Bride's Home (Mehendi/Henna)"], subjects: ['Bride', 'Bridesmaids', 'Family'],
        moments: [
          { name: 'Henna Application Start', duration_seconds: 600, order_index: 0, is_key_moment: false },
          { name: "Bride's Extended Henna", duration_seconds: 3600, order_index: 1, is_key_moment: true },
          { name: 'Guest Henna Application', duration_seconds: 3600, order_index: 2, is_key_moment: false },
          { name: 'Dancing & Celebration', duration_seconds: 1200, order_index: 3, is_key_moment: true },
        ],
      },
      {
        name: 'Wedding Ceremony (Mandap)', icon: 'heart', color: '#f59e0b', duration_minutes: 120, start_time_offset_minutes: 360, order_index: 1,
        locations: ['Temple/Ceremony Venue'], subjects: ['Bride', 'Groom', 'Family', 'Guests'],
        moments: [
          { name: 'Baraat Procession', duration_seconds: 900, order_index: 0, is_key_moment: true },
          { name: 'Bride & Groom Meet', duration_seconds: 300, order_index: 1, is_key_moment: true },
          { name: 'Rituals & Vows', duration_seconds: 3000, order_index: 2, is_key_moment: true },
          { name: 'First Circumambulation', duration_seconds: 1200, order_index: 3, is_key_moment: true },
          { name: 'Final Blessings', duration_seconds: 600, order_index: 4, is_key_moment: true },
        ],
      },
      {
        name: 'Reception & Dinner', icon: 'cake', color: '#8b5cf6', duration_minutes: 240, start_time_offset_minutes: 600, order_index: 2,
        locations: ['Reception Venue'], subjects: ['Bride', 'Groom', 'Bridesmaids', 'Groomsmen', 'Family', 'Guests'],
        moments: [
          { name: 'Guest Arrival & Seating', duration_seconds: 600, order_index: 0, is_key_moment: false },
          { name: "Couple's Entry", duration_seconds: 300, order_index: 1, is_key_moment: true },
          { name: 'Blessings from Elders', duration_seconds: 900, order_index: 2, is_key_moment: true },
          { name: 'Dinner Service', duration_seconds: 3600, order_index: 3, is_key_moment: false },
          { name: 'First Dance Variation', duration_seconds: 600, order_index: 4, is_key_moment: true },
          { name: 'Dancing & Celebration', duration_seconds: 3600, order_index: 5, is_key_moment: false },
        ],
      },
    ],
  },
  {
    name: '🇵🇰 Pakistani Wedding',
    description: 'Traditional Pakistani wedding with Mehndi',
    total_duration_hours: 12, event_start_time: '16:00', typical_guest_count: 120, key: 'pakistani_wedding',
    activities: [
      {
        name: 'Mehndi (Henna Celebration)', icon: 'sparkles', color: '#ec4899', duration_minutes: 180, start_time_offset_minutes: 0, order_index: 0,
        locations: ["Bride's Home (Mehndi)"], subjects: ['Bride', 'Bridesmaids', 'Family'],
        moments: [
          { name: 'Henna Artists Begin', duration_seconds: 600, order_index: 0, is_key_moment: false },
          { name: "Bride's Henna Session", duration_seconds: 3600, order_index: 1, is_key_moment: true },
          { name: 'Guests Getting Henna', duration_seconds: 3000, order_index: 2, is_key_moment: false },
          { name: 'Music & Dancing', duration_seconds: 1200, order_index: 3, is_key_moment: true },
        ],
      },
      {
        name: 'Baraat & Bride Meet Groom', icon: 'heart', color: '#f59e0b', duration_minutes: 90, start_time_offset_minutes: 360, order_index: 1,
        locations: ["Groom's Home", "Bride's Home (Mehndi)"], subjects: ['Bride', 'Groom', 'Groomsmen', 'Family'],
        moments: [
          { name: 'Baraat Procession Arrival', duration_seconds: 900, order_index: 0, is_key_moment: true },
          { name: 'Traditional Welcome', duration_seconds: 600, order_index: 1, is_key_moment: false },
          { name: 'Bride First Appearance', duration_seconds: 300, order_index: 2, is_key_moment: true },
          { name: 'Family Rituals', duration_seconds: 1200, order_index: 3, is_key_moment: false },
          { name: "Couple's Reaction", duration_seconds: 300, order_index: 4, is_key_moment: true },
        ],
      },
      {
        name: 'Walima (Reception Dinner)', icon: 'cake', color: '#8b5cf6', duration_minutes: 240, start_time_offset_minutes: 570, order_index: 2,
        locations: ['Venue (Walima/Reception)'], subjects: ['Bride', 'Groom', 'Bridesmaids', 'Groomsmen', 'Family', 'Guests'],
        moments: [
          { name: 'Guest Arrival', duration_seconds: 600, order_index: 0, is_key_moment: false },
          { name: "Couple's Entry & Sitting", duration_seconds: 300, order_index: 1, is_key_moment: true },
          { name: 'Formal Blessings', duration_seconds: 900, order_index: 2, is_key_moment: true },
          { name: 'Dinner Service', duration_seconds: 4200, order_index: 3, is_key_moment: false },
          { name: 'Dancing & Celebration', duration_seconds: 3600, order_index: 4, is_key_moment: true },
          { name: 'Farewell Toast', duration_seconds: 600, order_index: 5, is_key_moment: true },
        ],
      },
    ],
  },
  {
    name: '📋 Registry + Celebration',
    description: 'Registry ceremony and celebration',
    total_duration_hours: 8, event_start_time: '16:00', typical_guest_count: 70, key: 'registry_celebration',
    activities: [
      {
        name: 'Registry Ceremony', icon: 'heart', color: '#f59e0b', duration_minutes: 60, start_time_offset_minutes: 0, order_index: 0,
        locations: ['Registry Venue'], subjects: ['Bride', 'Groom', 'Family'],
        moments: [
          { name: 'Guest Arrival & Seating', duration_seconds: 600, order_index: 0, is_key_moment: false },
          { name: 'Couple Arrival', duration_seconds: 300, order_index: 1, is_key_moment: true },
          { name: 'Official Ceremony', duration_seconds: 900, order_index: 2, is_key_moment: true },
          { name: 'Signing Documents', duration_seconds: 600, order_index: 3, is_key_moment: true },
          { name: 'Photos & Celebratory Moment', duration_seconds: 600, order_index: 4, is_key_moment: true },
        ],
      },
      {
        name: 'Celebration & Reception', icon: 'cake', color: '#8b5cf6', duration_minutes: 240, start_time_offset_minutes: 120, order_index: 1,
        locations: ['Celebration Venue'], subjects: ['Bride', 'Groom', 'Family', 'Guests'],
        moments: [
          { name: 'Welcome Drinks & Canapés', duration_seconds: 900, order_index: 0, is_key_moment: false },
          { name: 'First Dance', duration_seconds: 300, order_index: 1, is_key_moment: true },
          { name: 'Toasts & Speeches', duration_seconds: 1200, order_index: 2, is_key_moment: true },
          { name: 'Dinner Service', duration_seconds: 2400, order_index: 3, is_key_moment: false },
          { name: 'Cake Cutting', duration_seconds: 300, order_index: 4, is_key_moment: true },
          { name: 'Dancing & Entertainment', duration_seconds: 3600, order_index: 5, is_key_moment: false },
        ],
      },
    ],
  },
  {
    name: '🌳 Garden/Intimate Wedding',
    description: 'Intimate garden ceremony and celebration',
    total_duration_hours: 8, event_start_time: '15:00', typical_guest_count: 40, key: 'garden_intimate',
    activities: [
      {
        name: 'Getting Ready', icon: 'glam', color: '#ec4899', duration_minutes: 60, start_time_offset_minutes: 0, order_index: 0,
        locations: ['Getting Ready Space'], subjects: ['Bride', 'Groom', 'Bridesmaids', 'Groomsmen'],
        moments: [
          { name: 'Hair & Makeup', duration_seconds: 1200, order_index: 0, is_key_moment: false },
          { name: 'Bride Getting Dressed', duration_seconds: 600, order_index: 1, is_key_moment: false },
          { name: 'Groom Preparation', duration_seconds: 600, order_index: 2, is_key_moment: false },
          { name: 'Final Preparations', duration_seconds: 600, order_index: 3, is_key_moment: false },
        ],
      },
      {
        name: 'Intimate Ceremony', icon: 'heart', color: '#f59e0b', duration_minutes: 45, start_time_offset_minutes: 90, order_index: 1,
        locations: ['Garden Ceremony Area'], subjects: ['Bride', 'Groom', 'Bridesmaids', 'Groomsmen', 'Family', 'Guests'],
        moments: [
          { name: 'Guest Arrival in Garden', duration_seconds: 600, order_index: 0, is_key_moment: false },
          { name: "Bride's Walk Down Aisle", duration_seconds: 300, order_index: 1, is_key_moment: true },
          { name: 'Vows & Rings', duration_seconds: 900, order_index: 2, is_key_moment: true },
          { name: 'First Kiss', duration_seconds: 180, order_index: 3, is_key_moment: true },
          { name: 'Recessional', duration_seconds: 300, order_index: 4, is_key_moment: false },
        ],
      },
      {
        name: 'Reception & Celebration', icon: 'cake', color: '#8b5cf6', duration_minutes: 180, start_time_offset_minutes: 195, order_index: 2,
        locations: ['Reception Area/Marquee'], subjects: ['Bride', 'Groom', 'Bridesmaids', 'Groomsmen', 'Family', 'Guests'],
        moments: [
          { name: 'Cocktails & Mingling', duration_seconds: 900, order_index: 0, is_key_moment: false },
          { name: 'First Dance', duration_seconds: 300, order_index: 1, is_key_moment: true },
          { name: 'Toasts & Blessings', duration_seconds: 900, order_index: 2, is_key_moment: true },
          { name: 'Intimate Dinner', duration_seconds: 2400, order_index: 3, is_key_moment: false },
          { name: 'Cake Cutting', duration_seconds: 300, order_index: 4, is_key_moment: true },
          { name: 'Dancing Celebration', duration_seconds: 1800, order_index: 5, is_key_moment: false },
        ],
      },
    ],
  },
];

const CANONICAL_WEDDING_TEMPLATE: PackageTemplateDef & { activities: ActivityDef[] } = {
  ...WEDDING_TYPE_TEMPLATES[0],
  name: 'Wedding',
  description: 'Full wedding day coverage',
  total_duration_hours: 10,
  event_start_time: '08:00',
  typical_guest_count: 150,
};

const DEFAULT_SLOT_TIERS = ['Budget', 'Basic', 'Standard', 'Premium'] as const;

const BIRTHDAY_ROLES = [
  { role_name: 'Birthday Person', order_index: 0, never_group: true, is_group: false },
  { role_name: 'Partner', order_index: 1, never_group: true, is_group: false },
  { role_name: 'Parents', order_index: 2, never_group: false, is_group: true },
  { role_name: 'Close Friends', order_index: 3, never_group: false, is_group: true },
  { role_name: 'Guests', order_index: 4, never_group: false, is_group: true },
];

// ═══════════════════════════════════════════════════════════════════════
// PackageTemplate persistence — wedding templates
// ═══════════════════════════════════════════════════════════════════════

async function seedWeddingTemplates(brandId: number): Promise<SeedSummary> {
  logger.sectionHeader('Wedding PackageTemplate');

  let created = 0;
  let skipped = 0;

  // Reset child moments for any system-seeded wedding templates (idempotent re-seed)
  await prisma.packageTemplateMoment.deleteMany({
    where: {
      package_template_activity: {
        package_template: { is_system_seeded: true, event_category: 'Wedding' },
      },
    },
  });

  for (const template of [CANONICAL_WEDDING_TEMPLATE]) {
    const existing = await prisma.packageTemplate.findFirst({
      where: { name: template.name, is_system_seeded: true },
    });

    if (existing) {
      skipped++;
      logger.skipped(`Wedding template "${template.name}"`, 'already exists');
      continue;
    }

    const packageTemplate = await prisma.packageTemplate.create({
      data: {
        brand_id: null, // system-seeded
        name: template.name,
        event_category: 'Wedding',
        description: template.description,
        total_duration_hours: template.total_duration_hours,
        event_start_time: template.event_start_time,
        typical_guest_count: template.typical_guest_count,
        is_system_seeded: true,
        is_active: true,
        order_index: 0,
      },
    });

    // Locations
    const locationMap: Record<string, number> = {};
    for (const loc of (LOCATIONS_BY_TYPE[template.key] ?? [])) {
      const row = await prisma.packageTemplateLocation.create({
        data: {
          package_template_id: packageTemplate.id,
          name: loc.name,
          location_type: loc.location_type,
          order_index: loc.order_index,
          is_primary: loc.is_primary,
        },
      });
      locationMap[loc.name] = row.id;
    }

    // Subjects
    const subjectMap: Record<string, number> = {};
    for (const subj of (SUBJECTS_BY_TYPE[template.key] ?? [])) {
      const row = await prisma.packageTemplateSubject.create({
        data: {
          package_template_id: packageTemplate.id,
          name: subj.name,
          subject_type: subj.subject_type,
          typical_count: subj.typical_count,
          order_index: subj.order_index,
          is_primary: subj.is_primary,
        },
      });
      subjectMap[subj.name] = row.id;
    }

    // Activities with moments + junction links
    for (const activity of template.activities) {
      const createdActivity = await prisma.packageTemplateActivity.create({
        data: {
          package_template_id: packageTemplate.id,
          name: activity.name,
          icon: activity.icon,
          color: activity.color,
          duration_minutes: activity.duration_minutes,
          start_time_offset_minutes: activity.start_time_offset_minutes,
          order_index: activity.order_index,
          description: `${activity.name} – ${activity.duration_minutes} minutes`,
        },
      });

      for (const moment of activity.moments) {
        await prisma.packageTemplateMoment.create({
          data: {
            package_template_activity_id: createdActivity.id,
            name: moment.name,
            duration_seconds: moment.duration_seconds,
            order_index: moment.order_index,
            is_key_moment: moment.is_key_moment,
            subject_actions: moment.subject_actions ?? undefined,
          },
        });
      }

      for (const locName of activity.locations) {
        if (locationMap[locName]) {
          await prisma.packageTemplateActivityLocation.create({
            data: {
              package_template_activity_id: createdActivity.id,
              package_template_location_id: locationMap[locName],
            },
          });
        }
      }

      for (let si = 0; si < activity.subjects.length; si++) {
        const subjName = activity.subjects[si];
        if (subjectMap[subjName]) {
          await prisma.packageTemplateActivitySubject.create({
            data: {
              package_template_activity_id: createdActivity.id,
              package_template_subject_id: subjectMap[subjName],
              presence_percentage: 80,
              is_primary_focus: si < 2,
            },
          });
        }
      }
    }

    // Link Wedding Day event-day template
    const weddingDay = await prisma.eventDay.findFirst({ where: { brand_id: brandId, name: 'Wedding Day' } });
    if (weddingDay) {
      await prisma.packageTemplateDay.create({
        data: {
          package_template_id: packageTemplate.id,
          event_day_template_id: weddingDay.id,
          order_index: 0,
          is_default: true,
        },
      });
    }

    created++;
    const locations = LOCATIONS_BY_TYPE[template.key] ?? [];
    const subjects = SUBJECTS_BY_TYPE[template.key] ?? [];
    logger.created(`"${template.name}" (${template.activities.length} activities, ${locations.length} locations, ${subjects.length} subjects)`);
  }

  const total = created + skipped;
  logger.summary('Wedding template', { created, updated: 0, skipped, total });
  return { created, updated: 0, skipped, total };
}

// ═══════════════════════════════════════════════════════════════════════
// Birthday PackageTemplate (simpler — no activity tree yet)
// ═══════════════════════════════════════════════════════════════════════

async function seedBirthdayTemplate(brandId: number): Promise<SeedSummary> {
  logger.sectionHeader('Birthday PackageTemplate');

  let created = 0;
  let skipped = 0;

  // 1. Ensure birthday subject roles
  for (const roleData of BIRTHDAY_ROLES) {
    const existing = await prisma.subjectRole.findFirst({ where: { brand_id: brandId, role_name: roleData.role_name } });
    if (!existing) {
      await prisma.subjectRole.create({ data: { brand_id: brandId, ...roleData } });
      created++;
    }
  }

  // 2. Ensure Birthday Day template
  let birthdayDay = await prisma.eventDay.findFirst({ where: { brand_id: brandId, name: 'Birthday Day' } });
  if (!birthdayDay) {
    birthdayDay = await prisma.eventDay.create({
      data: { brand_id: brandId, name: 'Birthday Day', description: 'The main birthday party — arrival, cake, speeches, dancing', order_index: 10, is_active: true },
    });
    created++;
  }

  // 3. Ensure Birthday PackageTemplate
  const existing = await prisma.packageTemplate.findFirst({
    where: { brand_id: brandId, name: 'Birthday', event_category: 'Birthday' },
  });

  if (existing) {
    logger.skipped('Birthday PackageTemplate', 'already exists');
    skipped++;
    return { created, updated: 0, skipped, total: created + skipped };
  }

  const template = await prisma.packageTemplate.create({
    data: {
      brand_id: brandId,
      name: 'Birthday',
      event_category: 'Birthday',
      description: 'Birthday party and celebration coverage',
      icon: '🎂',
      color: '#f59e0b',
      total_duration_hours: 5,
      event_start_time: '16:00',
      typical_guest_count: 50,
      is_system_seeded: false,
      is_active: true,
      order_index: 1,
    },
  });
  created++;

  // Link Birthday Day
  await prisma.packageTemplateDay.create({
    data: {
      package_template_id: template.id,
      event_day_template_id: birthdayDay.id,
      order_index: 0,
      is_default: true,
    },
  });

  // Seed template subjects from brand's birthday subject roles
  const brandRoles = await prisma.subjectRole.findMany({
    where: { brand_id: brandId, role_name: { in: BIRTHDAY_ROLES.map(r => r.role_name) } },
    orderBy: { order_index: 'asc' },
  });
  for (let i = 0; i < brandRoles.length; i++) {
    const role = brandRoles[i];
    await prisma.packageTemplateSubject.create({
      data: {
        package_template_id: template.id,
        name: role.role_name,
        subject_role_id: role.id,
        order_index: i,
        is_primary: i < 2,
      },
    });
  }

  logger.success(`Birthday PackageTemplate created (${created} records)`);
  return { created, updated: 0, skipped, total: created + skipped };
}

// ═══════════════════════════════════════════════════════════════════════
// Package sets — one per event_category, with default tier slots
// ═══════════════════════════════════════════════════════════════════════

interface PackageSetDef {
  event_category: string;
  name: string;
  description: string;
  emoji: string;
  order_index: number;
}

const PACKAGE_SETS: PackageSetDef[] = [
  {
    event_category: 'Wedding',
    name: 'Wedding Packages',
    description: 'Our wedding videography packages',
    emoji: '💒',
    order_index: 0,
  },
  {
    event_category: 'Birthday',
    name: 'Birthday Packages',
    description: 'Our birthday celebration packages',
    emoji: '🎂',
    order_index: 1,
  },
];

async function seedPackageSets(brandId: number): Promise<SeedSummary> {
  logger.sectionHeader('Package Sets');

  let created = 0;
  let skipped = 0;

  for (const def of PACKAGE_SETS) {
    const existing = await prisma.package_sets.findFirst({
      where: { brand_id: brandId, name: def.name },
    });
    if (existing) {
      skipped++;
      logger.skipped(`Package set "${def.name}"`, 'already exists');
      continue;
    }

    const packageSet = await prisma.package_sets.create({
      data: {
        brand_id: brandId,
        name: def.name,
        description: def.description,
        emoji: def.emoji,
        event_category: def.event_category,
        is_active: true,
        order_index: def.order_index,
      },
    });

    for (let i = 0; i < DEFAULT_SLOT_TIERS.length; i++) {
      await prisma.package_set_slots.create({
        data: {
          package_set_id: packageSet.id,
          slot_label: DEFAULT_SLOT_TIERS[i],
          order_index: i,
        },
      });
    }

    created++;
    logger.created(`Package set "${def.name}"`);
  }

  const total = created + skipped;
  logger.summary('Package sets', { created, updated: 0, skipped, total });
  return { created, updated: 0, skipped, total };
}

// ═══════════════════════════════════════════════════════════════════════
// Main — runs all parts in sequence
// ═══════════════════════════════════════════════════════════════════════

async function seedServices(db: PrismaClient): Promise<SeedSummary> {
  prisma = db;
  logger.sectionHeader('Catalog: Services', 'Package templates + package sets');
  logger.startTimer('services');

  const brand = await prisma.brands.findFirst({ where: { name: 'Moonrise Films' } });
  if (!brand) {
    logger.warning('Moonrise Films brand not found, skipping services.');
    return { created: 0, updated: 0, skipped: 0, total: 0 };
  }

  const weddingSummary = await seedWeddingTemplates(brand.id);
  const birthdaySummary = await seedBirthdayTemplate(brand.id);
  const setsSummary = await seedPackageSets(brand.id);

  const aggregate = sumSummaries(sumSummaries(weddingSummary, birthdaySummary), setsSummary);
  logger.summary('Services (total)', aggregate);
  logger.endTimer('services', 'Services seeding');
  return aggregate;
}

// Export data constants for potential reuse
export { WEDDING_TYPE_TEMPLATES, LOCATIONS_BY_TYPE, SUBJECTS_BY_TYPE, BIRTHDAY_ROLES };

export default seedServices;
