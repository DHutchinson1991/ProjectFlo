import { PrismaClient } from '@prisma/client';

/**
 * Moment Knowledge Base seed — populates reusable activity-moment templates.
 *
 * Each "base" represents a type+variant of activity (e.g. Ceremony / Traditional).
 * Each "entry" is a moment in that activity's standard sequence, with optional
 * per-role subject_actions (keys are role names like "Bride", "Groom").
 *
 * The planner uses these to auto-create moments when preparing a scene for an activity.
 */

interface KBEntry {
  name: string;
  description?: string;
  order_index: number;
  default_duration_seconds: number;
  min_duration_seconds?: number;
  max_duration_seconds?: number;
  subject_actions?: Record<string, string>;
}

interface KBDefinition {
  category: string;
  variant?: string;
  reference_duration_minutes: number;
  description?: string;
  entries: KBEntry[];
}

// ─── Traditional British Wedding ─────────────────────────────────────

const GETTING_READY: KBDefinition = {
  category: 'Getting Ready',
  variant: 'Traditional',
  reference_duration_minutes: 75,
  description: 'Standard bridal & groom preparation flow',
  entries: [
    { name: "Bride's Hair & Makeup", description: 'Professional stylist applies hair and makeup while bridesmaids get ready nearby.', order_index: 0, default_duration_seconds: 1200, min_duration_seconds: 600, max_duration_seconds: 1800, subject_actions: {
      'Bride': 'seated in dressing gown, stylist doing hair, looking into handheld mirror',
      'Bridesmaids': 'seated nearby having makeup applied, chatting and laughing together',
      'Maid of Honor': 'seated beside bride, having makeup done, chatting and laughing',
    }},
    { name: 'Bride Getting Dressed', description: 'Bride steps into her wedding dress with help from mother and bridesmaids.', order_index: 1, default_duration_seconds: 600, min_duration_seconds: 300, max_duration_seconds: 900, subject_actions: {
      'Bride': 'stepping into wedding dress, mother helping with buttons at the back',
      'Bridesmaids': 'standing around bride helping adjust dress and veil, holding train',
      'Mother of Bride': 'kneeling behind bride fastening buttons on dress, emotional',
      'Maid of Honor': "holding veil ready, adjusting bride's train",
    }},
    { name: 'Groom Getting Ready', description: 'Groom puts on suit, adjusts tie and cufflinks.', order_index: 2, default_duration_seconds: 900, min_duration_seconds: 300, max_duration_seconds: 1200, subject_actions: {
      'Groom': 'standing at mirror adjusting tie and cufflinks, wearing dark suit',
    }},
    { name: 'Final Touches & Veil', description: 'Mother places the veil and makes last adjustments to the dress.', order_index: 3, default_duration_seconds: 300, min_duration_seconds: 120, max_duration_seconds: 600, subject_actions: {
      'Bride': 'standing in full wedding dress, mother placing veil on head',
      'Mother of Bride': 'standing behind bride, carefully placing and adjusting veil',
      'Bridesmaids': 'watching bride with emotional expressions, one holding bouquet ready',
    }},
    { name: 'Bridesmaids Preparation', description: 'Bridesmaids get into matching dresses and help each other with accessories.', order_index: 4, default_duration_seconds: 600, min_duration_seconds: 300, max_duration_seconds: 900, subject_actions: {
      'Bridesmaids': "lined up in matching dresses, adjusting each other's hair and accessories",
      'Maid of Honor': 'helping bridesmaids with final touches, checking everyone looks ready',
      'Bride': 'seated watching bridesmaids get ready, holding champagne glass',
    }},
    { name: 'Father of Bride Reaction', description: 'Father sees the bride in her dress for the first time.', order_index: 5, default_duration_seconds: 300, min_duration_seconds: 120, max_duration_seconds: 600, subject_actions: {
      'Bride': 'standing in full wedding dress and veil, turning to face her father',
      'Father of Bride': 'standing in doorway, hand over mouth, emotional reaction seeing bride',
      'Mother of Bride': 'standing beside husband, hand on his arm, wiping tears',
    }},
  ],
};

const CEREMONY_TRADITIONAL: KBDefinition = {
  category: 'Ceremony',
  variant: 'Traditional',
  reference_duration_minutes: 45,
  description: 'Standard UK church/venue ceremony with full processional',
  entries: [
    { name: 'Guest Seating', description: 'Guests arrive and are directed to their seats while the groom waits at the altar.', order_index: 0, default_duration_seconds: 300, min_duration_seconds: 120, max_duration_seconds: 600, subject_actions: {
      'Bride': 'waiting out of sight in bridal suite, final preparations before ceremony',
      'Groom': 'standing near altar with best man, greeting arriving guests nervously',
      'Best Man': 'standing beside groom near altar, reassuring him, adjusting his buttonhole',
      'Maid of Honor': "arranging bride's dress and veil outside venue, handing her bouquet",
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
    { name: 'Groom Takes Position', description: 'Groom walks to the altar with the best man and groomsmen line up.', order_index: 1, default_duration_seconds: 120, min_duration_seconds: 60, max_duration_seconds: 180, subject_actions: {
      'Groom': 'walking to altar from side entrance, adjusting jacket, taking position',
      'Best Man': 'walking beside groom to altar, patting him on shoulder reassuringly',
      'Groomsmen': 'filing into position beside altar in a line, standing at attention',
      'Guests': 'seated watching groom take position, murmuring quietly',
      'Officiant': 'standing at altar, nodding to groom as he takes position',
    }},
    { name: 'Bridal Party Processional', description: 'Bridesmaids, flower girl and ring bearer walk down the aisle before the bride.', order_index: 2, default_duration_seconds: 180, min_duration_seconds: 120, max_duration_seconds: 300, subject_actions: {
      'Bridesmaids': 'walking down aisle one by one in matching dresses, holding small bouquets',
      'Groomsmen': 'standing at altar watching bridesmaids approach, smiling',
      'Maid of Honor': 'walking down aisle last before bride, holding bouquet, poised',
      'Flower Girl': 'walking down aisle scattering petals from basket, looking around shyly',
      'Ring Bearer': 'walking down aisle carrying ring cushion carefully, concentrating',
      'Groom': 'standing at altar watching processional, anticipation building',
      'Guests': 'seated, turning to watch bridal party walk down aisle',
    }},
    { name: 'Bride Arrival', description: 'Bride arrives at the venue and prepares to walk down the aisle with her father.', order_index: 3, default_duration_seconds: 120, min_duration_seconds: 60, max_duration_seconds: 180, subject_actions: {
      'Bride': 'stepping out of wedding car in full dress, father helping with train',
      'Groom': 'standing at altar, facing forward, nervously awaiting bride',
      'Best Man': 'standing beside groom, whispering reassurance, both looking toward entrance',
      'Maid of Honor': "arranging bride's dress and veil outside venue, handing her bouquet",
      'Father of Bride': 'standing beside bride at venue entrance, offering his arm',
      'Mother of Bride': 'seated in front row, turning to look toward entrance expectantly',
      'Bridesmaids': 'lined up inside entrance ready to walk, adjusting bouquets',
      'Guests': 'seated, turning to look toward entrance, hushed anticipation',
      'Officiant': 'standing at altar, signaling ceremony is about to begin',
    }},
    { name: 'Bride Entrance', description: 'Bride walks down the aisle arm-in-arm with her father as the groom sees her for the first time.', order_index: 4, default_duration_seconds: 180, min_duration_seconds: 120, max_duration_seconds: 300, subject_actions: {
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
    { name: 'Giving Away', description: 'Father lifts the veil and places the bride\'s hand in the groom\'s.', order_index: 5, default_duration_seconds: 120, min_duration_seconds: 60, max_duration_seconds: 180, subject_actions: {
      'Bride': "standing at altar, father lifting veil and kissing her cheek",
      'Groom': "stepping forward to take bride's hand from father, nodding respectfully",
      'Father of Bride': "lifting bride's veil, kissing her cheek, placing her hand in groom's",
      'Mother of Bride': 'seated in front row, wiping tears, watching husband give daughter away',
      'Guests': 'seated watching giving away moment, many wiping tears',
      'Officiant': 'standing at altar, asking who gives this woman, overseeing handover',
    }},
    { name: 'Officiant Welcome', description: 'Officiant opens the ceremony and welcomes the congregation.', order_index: 6, default_duration_seconds: 180, min_duration_seconds: 60, max_duration_seconds: 300, subject_actions: {
      'Bride': 'standing at altar beside groom, bouquet in both hands',
      'Groom': 'standing at altar beside bride, hands clasped in front',
      'Best Man': 'standing to groom\'s side, holding rings in pocket, attentive',
      'Maid of Honor': "standing to bride's side, holding bride's bouquet ready",
      'Father of Bride': 'seated in front row after giving bride away, emotional',
      'Mother of Bride': 'seated in front row, dabbing eyes with tissue',
      'Father of Groom': 'seated in front row on groom side, watching proudly',
      'Mother of Groom': 'seated in front row on groom side, beaming at son',
      'Bridesmaids': "standing in line to bride's side, hands clasped, watching",
      'Groomsmen': "standing in line to groom's side, hands clasped in front",
      'Guests': 'seated in rows, listening attentively to officiant',
      'Officiant': 'standing at lectern, welcoming guests, opening ceremony with warm words',
    }},
    { name: 'Opening Remarks', description: 'Officiant speaks about love and commitment to the couple and guests.', order_index: 7, default_duration_seconds: 300, min_duration_seconds: 120, max_duration_seconds: 600, subject_actions: {
      'Bride': 'standing beside groom at altar, looking at officiant, hands held together',
      'Groom': 'standing beside bride at altar, looking at officiant, standing tall',
      'Best Man': 'standing to side, listening to officiant speak',
      'Maid of Honor': "standing to bride's side, listening attentively",
      'Guests': 'seated in rows, listening to officiant, quiet and attentive',
      'Officiant': 'standing at lectern, speaking about love and commitment, addressing congregation',
    }},
    { name: 'Readings', description: 'Selected readings or poems are shared by members of the wedding party.', order_index: 8, default_duration_seconds: 300, min_duration_seconds: 120, max_duration_seconds: 600, subject_actions: {
      'Bride': "standing at altar, listening to reading, squeezing groom's hand",
      'Groom': 'standing at altar, listening to reading, glancing at bride with emotion',
      'Best Man': 'standing at lectern reading passage, holding paper, speaking clearly',
      'Maid of Honor': 'standing at lectern reading poem, emotional voice, looking up at couple',
      'Guests': 'seated listening to readings, some nodding, some wiping tears',
      'Officiant': 'seated to side, listening to reader, waiting to continue ceremony',
    }},
    { name: 'Vows Exchange', description: 'Bride and groom face each other and read their vows.', order_index: 9, default_duration_seconds: 600, min_duration_seconds: 300, max_duration_seconds: 900, subject_actions: {
      'Bride': 'standing facing groom at altar, reading vows from paper, tearful',
      'Groom': 'standing facing bride at altar, holding her hands, listening intently',
      'Best Man': 'standing to side, watching couple exchange vows, emotional',
      'Maid of Honor': "standing to side, holding bride's bouquet, wiping tears",
      'Bridesmaids': "standing to the side of altar in a line, watching couple with emotion",
      'Groomsmen': 'standing to the opposite side of altar in a line, watching ceremony',
      'Father of Bride': 'seated in front row, arm around wife, wiping tears',
      'Mother of Bride': 'seated in front row, wiping tears, watching daughter',
      'Father of Groom': 'seated in front row, watching proudly, nodding',
      'Mother of Groom': 'seated in front row, wiping tears, clutching handkerchief',
      'Guests': 'seated in rows watching ceremony, some wiping tears',
      'Officiant': 'standing behind couple at lectern, reading from book, overseeing vows',
    }},
    { name: 'Ring Exchange', description: 'Best man presents the rings and the couple exchange wedding bands.', order_index: 10, default_duration_seconds: 180, min_duration_seconds: 60, max_duration_seconds: 300, subject_actions: {
      'Bride': "sliding ring onto groom's finger, hands close together at altar",
      'Groom': "holding bride's hand, placing ring on her finger",
      'Best Man': 'stepping forward to hand rings to officiant, then returning to position',
      'Ring Bearer': 'standing nearby after presenting ring cushion, watching proudly',
      'Father of Bride': 'seated in front row, leaning forward watching ring exchange',
      'Mother of Bride': 'seated in front row, hands clasped, watching intently',
      'Guests': 'seated watching intently, some craning to see rings',
      'Officiant': 'standing behind couple, holding open prayer book, blessing rings',
    }},
    { name: 'Unity Ceremony', description: 'Couple performs a symbolic unity ritual such as lighting a candle or pouring sand.', order_index: 11, default_duration_seconds: 180, min_duration_seconds: 60, max_duration_seconds: 300, subject_actions: {
      'Bride': 'pouring sand or lighting candle together with groom, symbolic gesture',
      'Groom': 'pouring sand or lighting candle with bride, both holding together',
      'Best Man': 'standing to side watching unity ceremony, respectful',
      'Maid of Honor': 'standing to side watching, holding bouquet',
      'Guests': 'seated watching unity ceremony, quiet reverence',
      'Officiant': 'standing behind couple, explaining the symbolism of the unity ceremony',
    }},
    { name: 'Pronouncement', description: 'Officiant declares the couple officially married.', order_index: 12, default_duration_seconds: 60, min_duration_seconds: 30, max_duration_seconds: 120, subject_actions: {
      'Bride': 'standing facing groom, beaming smile, anticipation in her eyes',
      'Groom': 'standing facing bride, wide smile, holding both her hands',
      'Best Man': 'standing to side, grinning, ready to congratulate',
      'Maid of Honor': 'standing to side, emotional, hands clasped to chest',
      'Bridesmaids': 'standing in line, leaning forward in anticipation, smiling',
      'Groomsmen': 'standing in line, grinning, nudging each other',
      'Guests': 'seated, leaning forward in seats, anticipation, ready to cheer',
      'Officiant': 'standing at lectern, pronouncing couple married, arms raised',
    }},
    { name: 'First Kiss', description: 'The couple share their first kiss as a married couple.', order_index: 13, default_duration_seconds: 120, min_duration_seconds: 30, max_duration_seconds: 180, subject_actions: {
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
    { name: 'Recessional', description: 'Couple walks back down the aisle together followed by the wedding party.', order_index: 14, default_duration_seconds: 180, min_duration_seconds: 120, max_duration_seconds: 300, subject_actions: {
      'Bride': 'walking back down the aisle with groom, beaming, holding bouquet high',
      'Groom': 'walking arm-in-arm with bride down the aisle, smiling broadly, waving',
      'Best Man': 'following couple down aisle with maid of honor, arm in arm',
      'Maid of Honor': 'following couple down aisle with best man, both smiling',
      'Bridesmaids': 'following in pairs down the aisle, smiling, clutching bouquets',
      'Groomsmen': 'following in pairs with bridesmaids down the aisle, hands clasped',
      'Guests': 'standing in rows, applauding as wedding party exits',
      'Officiant': 'standing at altar watching couple exit, smiling warmly',
    }},
    { name: 'Confetti & Celebration', description: 'Guests shower the couple with confetti as they exit the venue.', order_index: 15, default_duration_seconds: 300, min_duration_seconds: 120, max_duration_seconds: 600, subject_actions: {
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
    { name: 'Receiving Line', description: 'Couple greets each guest personally outside the venue.', order_index: 16, default_duration_seconds: 600, min_duration_seconds: 300, max_duration_seconds: 900, subject_actions: {
      'Bride': 'standing in line outside venue, hugging and thanking each guest',
      'Groom': 'standing beside bride in receiving line, shaking hands, embracing guests',
      'Best Man': 'standing in receiving line, greeting guests, shaking hands',
      'Maid of Honor': 'standing in receiving line, hugging guests, chatting',
      'Father of Bride': 'standing in receiving line, shaking hands, beaming proudly',
      'Mother of Bride': 'standing in receiving line, hugging guests, wiping happy tears',
      'Guests': 'filing past couple in line, congratulating, hugging, shaking hands',
    }},
  ],
};

const CONFETTI_AND_PHOTOS: KBDefinition = {
  category: 'Confetti & Photos',
  variant: 'Traditional',
  reference_duration_minutes: 30,
  description: 'Post-ceremony confetti, couple & family portraits',
  entries: [
    { name: 'Confetti Moment', description: 'Guests line up and throw confetti over the couple.', order_index: 0, default_duration_seconds: 300, min_duration_seconds: 120, max_duration_seconds: 600, subject_actions: {
      'Bride': 'walking through shower of confetti with groom, laughing, holding bouquet up',
      'Groom': 'walking through confetti shower with bride, arm around her, laughing',
      'Bridesmaids': 'standing in line throwing handfuls of confetti, cheering',
      'Groomsmen': 'standing in line throwing confetti, laughing',
      'Father of Bride': 'standing to side throwing confetti, beaming proudly',
      'Mother of Bride': 'throwing confetti, crying happy tears',
      'Guests': 'lining pathway throwing confetti over couple, cheering',
    }},
    { name: 'Couple Portraits', description: 'Bride and groom pose for formal couple portraits in the venue grounds.', order_index: 1, default_duration_seconds: 900, min_duration_seconds: 300, max_duration_seconds: 1200, subject_actions: {
      'Bride': 'standing close to groom in garden, looking into his eyes, holding bouquet',
      'Groom': 'standing with arm around bride in garden setting, gazing at her',
    }},
    { name: 'Bridal Party Portraits', description: 'Group photos with bridesmaids and groomsmen.', order_index: 2, default_duration_seconds: 900, min_duration_seconds: 300, max_duration_seconds: 1200, subject_actions: {
      'Bride': 'standing in center of bridal party group, holding bouquet',
      'Groom': 'standing in center of groomsmen group, hands in pockets',
      'Best Man': 'standing beside groom in group photo, hand on shoulder',
      'Maid of Honor': 'standing beside bride in group photo, arms linked',
      'Bridesmaids': 'standing in a line flanking the bride, holding matching bouquets',
      'Groomsmen': 'standing in a line flanking the groom, hands clasped',
    }},
    { name: 'Family Portraits', description: 'Formal family group photos with both sides of the family.', order_index: 3, default_duration_seconds: 900, min_duration_seconds: 300, max_duration_seconds: 1200, subject_actions: {
      'Bride': 'standing with groom, flanked by both families on either side',
      'Groom': 'standing with bride, arm around her waist, families grouped around',
      'Father of Bride': 'standing beside bride, arm around her, proud smile',
      'Mother of Bride': 'standing beside bride, holding her hand, beaming',
      'Father of Groom': 'standing beside groom, hand on shoulder, proud',
      'Mother of Groom': 'standing beside groom, arm linked with his, smiling warmly',
    }},
  ],
};

const RECEPTION_ENTRY: KBDefinition = {
  category: 'Reception Entry',
  variant: 'Traditional',
  reference_duration_minutes: 30,
  description: 'Grand entrance, welcome drinks, and seating',
  entries: [
    { name: 'Grand Entrance', description: 'Newlyweds are announced and enter the reception to applause.', order_index: 0, default_duration_seconds: 300, min_duration_seconds: 120, max_duration_seconds: 600, subject_actions: {
      'Bride': 'entering reception hand-in-hand with groom through main doors, waving',
      'Groom': 'entering reception with bride, raising clasped hands triumphantly',
      'Guests': 'seated at tables, standing and applauding as couple enters',
      'Father of Bride': 'seated at head table area, standing to applaud',
      'Mother of Bride': 'seated at head table area, standing to applaud, wiping tears',
      'Father of Groom': 'standing nearby, watching proudly',
      'Mother of Groom': 'standing nearby, clapping, beaming at couple',
    }},
    { name: 'Welcome Drinks', description: 'Guests mingle and enjoy drinks while the couple greets everyone.', order_index: 1, default_duration_seconds: 900, min_duration_seconds: 300, max_duration_seconds: 1800, subject_actions: {
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
    { name: 'Table Seating', description: 'Guests find their assigned tables and take their seats for dinner.', order_index: 2, default_duration_seconds: 600, min_duration_seconds: 300, max_duration_seconds: 900, subject_actions: {
      'Bride': 'walking to head table with groom, sitting down together',
      'Groom': 'pulling out chair for bride at head table, sitting beside her',
      'Guests': 'finding their seats, reading place cards, sitting down at round tables',
      'Father of Bride': 'seated at head table, settling in, chatting with mother of bride',
      'Mother of Bride': 'seated at head table, arranging her place setting',
    }},
  ],
};

const FORMAL_DINNER: KBDefinition = {
  category: 'Formal Dinner',
  variant: 'Traditional',
  reference_duration_minutes: 120,
  description: 'Three-course formal dinner service',
  entries: [
    { name: 'Starters Served', description: 'First course is served and guests begin their meal.', order_index: 0, default_duration_seconds: 900, min_duration_seconds: 600, max_duration_seconds: 1200, subject_actions: {
      'Bride': 'seated at head table, eating starter course, chatting with groom',
      'Groom': 'seated at head table beside bride, eating and talking with neighbours',
      'Guests': 'seated at round tables eating starters, chatting across table',
      'Father of Bride': 'seated at head table, eating and conversing with family',
      'Mother of Bride': 'seated at head table, chatting with mother of groom',
    }},
    { name: 'Main Course', description: 'Main course is served. Relaxed table conversation throughout.', order_index: 1, default_duration_seconds: 1200, min_duration_seconds: 900, max_duration_seconds: 1800, subject_actions: {
      'Bride': 'seated at head table eating main course, laughing with bridesmaids',
      'Groom': 'seated at head table eating, leaning over to whisper to bride',
      'Guests': 'seated at tables eating main course, animated table conversation',
      'Best Man': 'seated at head table, chatting across table, laughing',
      'Maid of Honor': 'seated at head table beside bride, sharing a joke',
      'Father of Bride': 'seated enjoying meal, clinking glasses with father of groom',
      'Mother of Bride': 'seated at table enjoying meal, chatting with guests',
    }},
    { name: 'Dessert Service', description: 'Dessert is served as guests relax between courses.', order_index: 2, default_duration_seconds: 600, min_duration_seconds: 300, max_duration_seconds: 900, subject_actions: {
      'Bride': 'seated at head table with dessert, sharing a bite with groom',
      'Groom': 'seated beside bride, feeding her a spoonful of dessert, laughing',
      'Guests': 'seated eating dessert, relaxed and chatting',
    }},
  ],
};

const CAKE_CUT_AND_SPEECHES: KBDefinition = {
  category: 'Cake Cut & Speeches',
  variant: 'Traditional',
  reference_duration_minutes: 45,
  description: 'Cake cutting followed by traditional speech order',
  entries: [
    { name: 'Cake Cutting', description: 'Couple cuts the wedding cake together.', order_index: 0, default_duration_seconds: 300, min_duration_seconds: 120, max_duration_seconds: 600, subject_actions: {
      'Bride': 'standing beside wedding cake, holding knife together with groom, cutting first slice',
      'Groom': 'standing beside bride at cake, hand over hers on knife, cutting cake together',
      'Guests': 'seated and standing nearby, watching cake cutting, phones out for photos',
      'Father of Bride': 'standing close to couple watching cake cutting, smiling proudly',
      'Mother of Bride': 'standing beside husband, watching cake cutting, emotional',
      'Father of Groom': 'standing nearby, watching proudly, phone out for photos',
      'Mother of Groom': 'standing nearby, clapping, beaming at couple',
    }},
    { name: 'Best Man Speech', description: 'Best man delivers his speech, typically with stories and humour.', order_index: 1, default_duration_seconds: 600, min_duration_seconds: 300, max_duration_seconds: 900, subject_actions: {
      'Best Man': 'standing at microphone, holding speech notes, gesturing while speaking',
      'Bride': "seated at head table, laughing at best man's jokes, leaning into groom",
      'Groom': 'seated at head table, laughing and covering face with hand, embarrassed',
      'Guests': 'seated at tables, laughing and clapping, watching speaker',
      'Groomsmen': 'seated at head table, laughing, nudging each other',
    }},
    { name: 'Father of Bride Speech', description: 'Father of the bride shares memories and welcomes the groom to the family.', order_index: 2, default_duration_seconds: 600, min_duration_seconds: 300, max_duration_seconds: 900, subject_actions: {
      'Father of Bride': 'standing at microphone, reading from paper, wiping eye with handkerchief',
      'Bride': "seated at head table, wiping tears, holding groom's hand under table",
      'Groom': 'seated beside bride, arm around her shoulders, listening respectfully',
      'Mother of Bride': 'seated at head table, wiping tears, watching husband proudly',
      'Guests': 'seated quietly, some wiping tears, listening attentively',
    }},
    { name: 'Groom Speech', description: 'Groom thanks guests and family, and speaks about the bride.', order_index: 3, default_duration_seconds: 600, min_duration_seconds: 300, max_duration_seconds: 900, subject_actions: {
      'Groom': 'standing at microphone, holding speech notes, looking at bride with emotion',
      'Bride': 'seated at head table looking up at groom, tearful, hands clasped',
      'Guests': 'seated at tables, listening attentively, some raising glasses',
      'Father of Bride': 'seated at front table, beaming with pride',
      'Mother of Bride': 'seated at front table, wiping tears',
      'Father of Groom': 'seated at front table, nodding proudly, raising glass',
      'Mother of Groom': 'seated at front table, wiping tears, clutching handkerchief',
    }},
  ],
};

const FIRST_DANCE_AND_EVENING: KBDefinition = {
  category: 'First Dance & Evening',
  variant: 'Traditional',
  reference_duration_minutes: 90,
  description: 'First dance, parent dances, open dancing and send-off',
  entries: [
    { name: 'First Dance', description: 'Couple takes the dance floor for their first dance as a married couple.', order_index: 0, default_duration_seconds: 240, min_duration_seconds: 120, max_duration_seconds: 360, subject_actions: {
      'Bride': 'slow dancing with groom in center of dance floor, one hand on shoulder, swaying',
      'Groom': 'slow dancing with bride, one hand on her waist, leading gently',
      'Guests': 'standing around edge of dance floor watching couple dance, some filming',
      'Father of Bride': 'standing at front of crowd watching first dance, emotional',
      'Mother of Bride': 'standing beside husband, watching first dance, wiping tears',
      'Father of Groom': 'standing at front of crowd, watching proudly',
      'Mother of Groom': 'standing at front of crowd, emotional, clutching handkerchief',
    }},
    { name: 'Parent Dances', description: 'Bride dances with her father, groom dances with his mother.', order_index: 1, default_duration_seconds: 360, min_duration_seconds: 180, max_duration_seconds: 600, subject_actions: {
      'Bride': 'dancing with father on dance floor, head on his shoulder',
      'Groom': 'dancing with mother on dance floor, talking quietly',
      'Father of Bride': 'dancing with bride on dance floor, holding her hand, emotional',
      'Mother of Groom': 'dancing with groom on dance floor, hand on his shoulder, proud',
      'Mother of Bride': 'watching from edge of dance floor, wiping tears, leaning on husband',
      'Father of Groom': 'watching from edge of dance floor, arm around wife, proud',
      'Guests': 'standing around dance floor watching parent dances, some wiping tears',
    }},
    { name: 'Open Dancing', description: 'Dance floor opens to all guests for the rest of the evening.', order_index: 2, default_duration_seconds: 3600, min_duration_seconds: 1800, max_duration_seconds: 7200, subject_actions: {
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
    { name: 'Sparkler Exit', description: 'Guests form a sparkler tunnel for the couple to walk through as they leave.', order_index: 3, default_duration_seconds: 300, min_duration_seconds: 120, max_duration_seconds: 600, subject_actions: {
      'Bride': 'walking through tunnel of sparklers with groom, laughing, waving goodbye',
      'Groom': 'walking arm-in-arm with bride through sparkler tunnel, smiling broadly',
      'Guests': 'standing in two lines holding lit sparklers above heads forming tunnel',
      'Best Man': 'standing at end of sparkler tunnel, cheering couple through',
      'Maid of Honor': 'standing in sparkler line, waving goodbye, emotional',
      'Father of Bride': 'standing in sparkler line, waving goodbye to daughter',
      'Mother of Bride': 'standing in sparkler line, waving, wiping happy tears',
    }},
  ],
};

// ─── Civil Ceremony ──────────────────────────────────────────────────

const CEREMONY_CIVIL: KBDefinition = {
  category: 'Ceremony',
  variant: 'Civil',
  reference_duration_minutes: 20,
  description: 'Short civil/registry ceremony',
  entries: [
    { name: 'Guest Seating', description: 'Guests take their seats in the registry office or ceremony room.', order_index: 0, default_duration_seconds: 180, min_duration_seconds: 60, max_duration_seconds: 300 },
    { name: 'Bride Entrance', description: 'Bride enters the room and walks to the front.', order_index: 1, default_duration_seconds: 120, min_duration_seconds: 60, max_duration_seconds: 180 },
    { name: 'Welcome & Declarations', description: 'Registrar welcomes guests and the couple make their legal declarations.', order_index: 2, default_duration_seconds: 180, min_duration_seconds: 120, max_duration_seconds: 300 },
    { name: 'Readings', description: 'One or two short readings chosen by the couple.', order_index: 3, default_duration_seconds: 180, min_duration_seconds: 60, max_duration_seconds: 300 },
    { name: 'Vows & Ring Exchange', description: 'Couple exchange vows and wedding rings.', order_index: 4, default_duration_seconds: 240, min_duration_seconds: 120, max_duration_seconds: 360 },
    { name: 'Signing of Register', description: 'Couple and witnesses sign the marriage register.', order_index: 5, default_duration_seconds: 180, min_duration_seconds: 120, max_duration_seconds: 240 },
    { name: 'First Kiss & Exit', description: 'Couple share their first kiss and exit the ceremony room together.', order_index: 6, default_duration_seconds: 120, min_duration_seconds: 60, max_duration_seconds: 180 },
  ],
};

// ─── Indian Wedding ──────────────────────────────────────────────────

const CEREMONY_INDIAN: KBDefinition = {
  category: 'Ceremony',
  variant: 'Hindu',
  reference_duration_minutes: 120,
  description: 'Hindu wedding ceremony (Mandap)',
  entries: [
    { name: 'Baraat Procession', description: 'Groom arrives in a lively procession with music, dancing, and family.', order_index: 0, default_duration_seconds: 900, min_duration_seconds: 600, max_duration_seconds: 1200 },
    { name: 'Bride & Groom Meet', description: 'Couple see each other for the first time, often with a Jaimala garland exchange.', order_index: 1, default_duration_seconds: 300, min_duration_seconds: 120, max_duration_seconds: 600 },
    { name: 'Rituals & Vows', description: 'Core ceremony rituals performed around the sacred fire under the Mandap.', order_index: 2, default_duration_seconds: 3000, min_duration_seconds: 1800, max_duration_seconds: 3600 },
    { name: 'First Circumambulation', description: 'Couple walk around the sacred fire together during the Pheras.', order_index: 3, default_duration_seconds: 1200, min_duration_seconds: 600, max_duration_seconds: 1800 },
    { name: 'Final Blessings', description: 'Elders and priest give their blessings to the newly married couple.', order_index: 4, default_duration_seconds: 600, min_duration_seconds: 300, max_duration_seconds: 900 },
  ],
};

const MEHNDI: KBDefinition = {
  category: 'Mehndi',
  variant: 'Indian',
  reference_duration_minutes: 180,
  description: 'Mehendi/henna celebration',
  entries: [
    { name: 'Henna Application Start', description: 'Henna artist begins applying designs to the bride and guests.', order_index: 0, default_duration_seconds: 600, min_duration_seconds: 300, max_duration_seconds: 900 },
    { name: "Bride's Extended Henna", description: 'Bride receives intricate henna designs on hands and feet.', order_index: 1, default_duration_seconds: 3600, min_duration_seconds: 1800, max_duration_seconds: 5400 },
    { name: 'Guest Henna Application', description: 'Guests have simpler henna designs applied while socialising.', order_index: 2, default_duration_seconds: 3600, min_duration_seconds: 1800, max_duration_seconds: 5400 },
    { name: 'Dancing & Celebration', description: 'Music and dancing as guests celebrate together.', order_index: 3, default_duration_seconds: 1200, min_duration_seconds: 600, max_duration_seconds: 1800 },
  ],
};

// ─── Pakistani Wedding ───────────────────────────────────────────────

const CEREMONY_PAKISTANI: KBDefinition = {
  category: 'Ceremony',
  variant: 'Pakistani',
  reference_duration_minutes: 90,
  description: 'Baraat & bride meet groom ceremony',
  entries: [
    { name: 'Baraat Procession Arrival', description: 'Groom arrives with his family in a festive procession.', order_index: 0, default_duration_seconds: 900, min_duration_seconds: 600, max_duration_seconds: 1200 },
    { name: 'Traditional Welcome', description: 'Bride\'s family formally welcomes the groom and his family.', order_index: 1, default_duration_seconds: 600, min_duration_seconds: 300, max_duration_seconds: 900 },
    { name: 'Bride First Appearance', description: 'Bride makes her first appearance to the groom and guests.', order_index: 2, default_duration_seconds: 300, min_duration_seconds: 120, max_duration_seconds: 600 },
    { name: 'Family Rituals', description: 'Traditional family rituals and blessings are performed.', order_index: 3, default_duration_seconds: 1200, min_duration_seconds: 600, max_duration_seconds: 1800 },
    { name: "Couple's Reaction", description: 'Couple share their first private moment together after the ceremony.', order_index: 4, default_duration_seconds: 300, min_duration_seconds: 120, max_duration_seconds: 600 },
  ],
};

// ─── Reception (generic) ─────────────────────────────────────────────

const RECEPTION_GENERIC: KBDefinition = {
  category: 'Reception',
  variant: 'Standard',
  reference_duration_minutes: 240,
  description: 'Standard reception with dinner, speeches and dancing',
  entries: [
    { name: 'Guest Arrival & Seating', description: 'Guests arrive at the reception venue and find their tables.', order_index: 0, default_duration_seconds: 600, min_duration_seconds: 300, max_duration_seconds: 900 },
    { name: "Couple's Entry", description: 'Couple are announced and make their entrance to the reception.', order_index: 1, default_duration_seconds: 300, min_duration_seconds: 120, max_duration_seconds: 600 },
    { name: 'Welcome Speeches', description: 'Opening speeches welcome guests and set the tone for the evening.', order_index: 2, default_duration_seconds: 600, min_duration_seconds: 300, max_duration_seconds: 900 },
    { name: 'Dinner Service', description: 'Main dinner is served and guests enjoy their meal.', order_index: 3, default_duration_seconds: 3600, min_duration_seconds: 1800, max_duration_seconds: 5400 },
    { name: 'Cake Cutting', description: 'Couple cuts the wedding cake together.', order_index: 4, default_duration_seconds: 300, min_duration_seconds: 120, max_duration_seconds: 600 },
    { name: 'First Dance', description: 'Couple takes the floor for their first dance.', order_index: 5, default_duration_seconds: 300, min_duration_seconds: 120, max_duration_seconds: 600 },
    { name: 'Open Dancing', description: 'Dance floor opens to all guests for the evening.', order_index: 6, default_duration_seconds: 3600, min_duration_seconds: 1800, max_duration_seconds: 7200 },
  ],
};

// ─── Garden / Intimate ───────────────────────────────────────────────

const CEREMONY_INTIMATE: KBDefinition = {
  category: 'Ceremony',
  variant: 'Intimate',
  reference_duration_minutes: 30,
  description: 'Small garden or intimate ceremony',
  entries: [
    { name: 'Guests Gather', description: 'Small group of guests gather at the ceremony spot.', order_index: 0, default_duration_seconds: 300, min_duration_seconds: 120, max_duration_seconds: 600 },
    { name: 'Bride Entrance', description: 'Bride walks to the front for the ceremony.', order_index: 1, default_duration_seconds: 120, min_duration_seconds: 60, max_duration_seconds: 180 },
    { name: 'Personal Vows', description: 'Couple share personal, self-written vows with each other.', order_index: 2, default_duration_seconds: 300, min_duration_seconds: 120, max_duration_seconds: 600 },
    { name: 'Ring Exchange', description: 'Couple exchange wedding rings.', order_index: 3, default_duration_seconds: 120, min_duration_seconds: 60, max_duration_seconds: 180 },
    { name: 'First Kiss', description: 'Couple share their first kiss as a married couple.', order_index: 4, default_duration_seconds: 60, min_duration_seconds: 30, max_duration_seconds: 120 },
    { name: 'Celebration', description: 'Guests congratulate the couple with hugs and well-wishes.', order_index: 5, default_duration_seconds: 300, min_duration_seconds: 120, max_duration_seconds: 600 },
  ],
};

// ─── All templates ───────────────────────────────────────────────────

const ALL_KB_DEFINITIONS: KBDefinition[] = [
  GETTING_READY,
  CEREMONY_TRADITIONAL,
  CONFETTI_AND_PHOTOS,
  RECEPTION_ENTRY,
  FORMAL_DINNER,
  CAKE_CUT_AND_SPEECHES,
  FIRST_DANCE_AND_EVENING,
  CEREMONY_CIVIL,
  CEREMONY_INDIAN,
  MEHNDI,
  CEREMONY_PAKISTANI,
  RECEPTION_GENERIC,
  CEREMONY_INTIMATE,
];

// ─── Seed function ───────────────────────────────────────────────────

export async function seedMomentKnowledgeBase(prisma: PrismaClient, brandId?: number) {
  let created = 0;
  let skipped = 0;

  for (const def of ALL_KB_DEFINITIONS) {
    // Upsert: skip if already exists for this brand+category+variant
    const existing = await prisma.momentKnowledgeBase.findFirst({
      where: {
        brand_id: brandId ?? null,
        category: def.category,
        variant: def.variant ?? null,
      },
    });

    if (existing) {
      skipped++;
      continue;
    }

    const base = await prisma.momentKnowledgeBase.create({
      data: {
        brand_id: brandId ?? null,
        category: def.category,
        variant: def.variant ?? null,
        reference_duration_minutes: def.reference_duration_minutes,
        description: def.description ?? null,
        is_active: true,
      },
    });

    for (const entry of def.entries) {
      await prisma.momentKnowledgeEntry.create({
        data: {
          knowledge_base_id: base.id,
          name: entry.name,
          description: entry.description ?? null,
          order_index: entry.order_index,
          default_duration_seconds: entry.default_duration_seconds,
          min_duration_seconds: entry.min_duration_seconds ?? null,
          max_duration_seconds: entry.max_duration_seconds ?? null,
          subject_actions: entry.subject_actions ?? undefined,
        },
      });
    }

    created++;
  }

  console.log(`  Moment Knowledge Base: ${created} created, ${skipped} skipped`);
}
