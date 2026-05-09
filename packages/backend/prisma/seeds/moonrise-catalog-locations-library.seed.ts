// Moonrise Films Locations Library - Shropshire Wedding Venues
// Creates: 5 premium Shropshire wedding venues with detailed information and example spaces
// Seeds comprehensive room attributes (dimensions, environment, design) for AI-driven assignments
import { PrismaClient, SpaceType, IndoorOutdoor, NaturalLight } from "@prisma/client";
import { createSeedLogger, SeedType } from '../utils/seed-logger';

const prisma = new PrismaClient();
const logger = createSeedLogger(SeedType.MOONRISE);

// Map free-text space_type strings to SpaceType enum tags (with per-tag descriptions)
interface TagDef { type: SpaceType; description?: string }
const SPACE_TAG_MAP: Record<string, TagDef[]> = {
    'Ceremony Area':  [{ type: SpaceType.CEREMONY_AREA }],
    'Reception Hall': [{ type: SpaceType.RECEPTION_HALL }],
    'Bridal Suite':   [{ type: SpaceType.BRIDAL_SUITE }],
    'Outdoor Space':  [{ type: SpaceType.OUTDOOR_AREA }],
    'Private Room':   [{ type: SpaceType.PRIVATE_ROOM }],
    'Chapel':         [{ type: SpaceType.CHAPEL }],
    'Garden':         [{ type: SpaceType.GARDEN }],
    'Terrace':        [{ type: SpaceType.TERRACE }],
    'Library':        [{ type: SpaceType.LIBRARY }],
    'Lounge':         [{ type: SpaceType.LOUNGE }],
};

export async function seedMoonriseLocationsLibrary() {
    logger.sectionHeader('Locations Library - Shropshire Wedding Venues');

    // First, get the Moonrise Films brand ID
    const moonriseBrand = await prisma.brands.findUnique({
        where: { name: "Moonrise Films" }
    });

    if (!moonriseBrand) {
        logger.warning('Moonrise Films brand not found. Please run moonrise-brand-setup first.');
        return;
    }

    logger.success(`Found Moonrise Films brand (ID: ${moonriseBrand.id})`);

    // Define the 5 Shropshire wedding venues with comprehensive space data
    const shropshireVenues = [
        {
            name: "Combermere Abbey Estate",
            address_line1: "Whitchurch Road",
            address_line2: "Combermere",
            city: "Whitchurch",
            state: "Shropshire",
            country: "United Kingdom",
            postal_code: "SY13 4AJ",
            lat: 52.9771,
            lng: -2.6656,
            contact_name: "Sarah Henderson",
            contact_phone: "+44 1948 871154",
            contact_email: "weddings@combermereabbey.co.uk",
            capacity: 200,
            notes: "Historic 12th century Cistercian Abbey with stunning lakeside views. Features gothic architecture, manicured gardens, and the famous Combermere Lake. Perfect for intimate ceremonies and grand receptions.",
            spaces: [
                {
                    name: "The Abbey Ruins",
                    space_type: "Ceremony Area",
                    capacity: 120,
                    dimensions_length: 30.0,
                    dimensions_width: 20.0,
                    dimensions_height: undefined,
                    description: "Open-air ceremony space set within the dramatic stone ruins of the original 12th-century Cistercian abbey. Ancient stone archways frame the altar area creating a natural focal point. The aisle runs between two rows of crumbling walls covered in ivy, with the Combermere Lake visible through gaps in the stonework behind the couple.",
                    indoor_outdoor: IndoorOutdoor.OUTDOOR,
                    natural_light: NaturalLight.ABUNDANT,
                    flooring: "Grass and ancient flagstone",
                    ceiling_style: "Open sky with partial stone archway canopy",
                    key_features: "12th-century stone archways, ivy-covered walls, lake backdrop, natural amphitheatre shape",
                    accessibility_notes: "Grass surface, wheelchair access via gravel path from main car park. Temporary matting available.",
                    notes: "Magical outdoor ceremony space within the ancient abbey ruins, perfect for romantic vows with dramatic stone archways as backdrop.",
                    tags: [
                        { type: SpaceType.CEREMONY_AREA, description: "Chairs arranged in two rows of 10 either side of a central grass aisle facing the principal archway. Couple stands on raised flagstone platform beneath the tallest arch. String quartet positioned to the left behind a low wall." },
                    ],
                },
                {
                    name: "The Orangery",
                    space_type: "Reception Hall",
                    capacity: 150,
                    dimensions_length: 40.0,
                    dimensions_width: 25.0,
                    dimensions_height: 12.0,
                    description: "Grand Victorian glass orangery with a cast-iron frame and floor-to-ceiling windows on three sides. The space has a long, rectangular layout with a single open-plan floor. High glass ceiling panels allow abundant natural light throughout the day, transitioning to a warm candlelit ambience in the evening.",
                    indoor_outdoor: IndoorOutdoor.INDOOR,
                    natural_light: NaturalLight.ABUNDANT,
                    flooring: "Polished limestone tile",
                    ceiling_style: "Glass and cast-iron Victorian conservatory roof, 12m at apex",
                    key_features: "Floor-to-ceiling windows on 3 sides, panoramic lake and garden views, crystal chandeliers, integrated fairy-light canopy",
                    accessibility_notes: "Ground floor, level entry from courtyard, wide double doors. Accessible WC adjacent.",
                    notes: "Elegant glass orangery with panoramic views of the gardens and lake. Ideal for wedding breakfasts and evening receptions with natural light throughout the day.",
                    tags: [
                        { type: SpaceType.RECEPTION_HALL, description: "Round tables of 10 arranged in three rows with a central dance floor area at the far end. Top table positioned against the window wall overlooking the lake. Built-in PA system and mood lighting. Evening layout clears centre tables for dancing." },
                    ],
                },
            ]
        },
        {
            name: "Iscoyd Park",
            address_line1: "Iscoyd Park",
            city: "Whitchurch",
            state: "Shropshire",
            country: "United Kingdom",
            postal_code: "SY13 3AT",
            lat: 52.9541,
            lng: -2.8288,
            contact_name: "Emma Godsal",
            contact_phone: "+44 1948 780785",
            contact_email: "events@iscoydpark.com",
            capacity: 180,
            notes: "Stunning 18th-century Georgian mansion set in 27 acres of beautiful Shropshire countryside. Features elegant reception rooms, manicured gardens, and a charming chapel.",
            spaces: [
                {
                    name: "The Chapel",
                    space_type: "Chapel",
                    capacity: 80,
                    dimensions_length: 18.0,
                    dimensions_width: 8.0,
                    dimensions_height: 9.0,
                    description: "Intimate Georgian chapel attached to the south wing of the house. Simple, elegant interior with whitewashed walls, wooden pews, and a large arched window behind the altar flooding the space with soft light. Narrow centre aisle between two blocks of pews.",
                    indoor_outdoor: IndoorOutdoor.INDOOR,
                    natural_light: NaturalLight.MODERATE,
                    flooring: "Original stone flags with runner options",
                    ceiling_style: "Barrel-vaulted plaster ceiling, 9m at apex",
                    key_features: "Large arched east window, original wooden pews, stone font, intimate proportions",
                    accessibility_notes: "Two steps at entrance, temporary ramp available. Narrow doorway (85cm).",
                    tags: [
                        { type: SpaceType.CHAPEL, description: "Traditional chapel layout with fixed wooden pews in two rows of 8 each side. Couple stands at raised altar step beneath the arched window. Limited aisle width (1.2m) — intimate processional." },
                        { type: SpaceType.CEREMONY_AREA, description: "Licensed for civil ceremonies. Registrar table placed in front of the altar. Guests seated in pews facing forward." },
                    ],
                },
                {
                    name: "The Drawing Room",
                    space_type: "Reception Hall",
                    capacity: 120,
                    dimensions_length: 22.0,
                    dimensions_width: 14.0,
                    dimensions_height: 5.5,
                    description: "Principal reception room with Georgian proportions, duck-egg blue walls, ornate plasterwork ceiling, and two large sash windows overlooking the south lawn. The room has a rectangular layout with a marble fireplace centred on the long wall.",
                    indoor_outdoor: IndoorOutdoor.INDOOR,
                    natural_light: NaturalLight.MODERATE,
                    flooring: "Polished oak parquet",
                    ceiling_style: "Ornate Georgian plasterwork with central rose, 5.5m",
                    key_features: "Marble fireplace, Georgian sash windows, ornate ceiling rose, integrated wall sconces, grand piano",
                    accessibility_notes: "Ground floor, level threshold from hallway. Wide doorway.",
                    tags: [
                        { type: SpaceType.RECEPTION_HALL, description: "Round tables of 8 fill the room with top table in front of the fireplace. Dance floor created by clearing tables near the windows for evening. Built-in sound system available." },
                    ],
                },
                {
                    name: "Bridal Suite",
                    space_type: "Bridal Suite",
                    capacity: 6,
                    dimensions_length: 8.0,
                    dimensions_width: 6.0,
                    dimensions_height: 4.0,
                    description: "First-floor bridal suite with views over the formal gardens. Features a large bay window with window seat, full-length mirror, and a dedicated dressing area. Decorated in soft cream and blush tones with antique furniture.",
                    indoor_outdoor: IndoorOutdoor.INDOOR,
                    natural_light: NaturalLight.ABUNDANT,
                    flooring: "Cream carpet",
                    ceiling_style: "Flat plaster with decorative coving",
                    key_features: "Bay window with garden views, full-length antique mirror, chaise longue, en-suite bathroom, dressing table with Hollywood-style lights",
                    accessibility_notes: "First floor, stairs only. Not wheelchair accessible.",
                    tags: [
                        { type: SpaceType.BRIDAL_SUITE, description: "Spacious getting-ready room for the bride and up to 5 attendants. Large mirror station by the window for natural light. Seating area with chaise longue. Private en-suite with deep roll-top bath." },
                        { type: SpaceType.GETTING_READY_ROOM, description: "Hair and makeup setup at the bay window for best natural light. Space for two stylists working simultaneously. Full-length mirror opposite the window for final dress checks." },
                    ],
                },
                {
                    name: "The Gardens",
                    space_type: "Garden",
                    capacity: 150,
                    dimensions_length: 60.0,
                    dimensions_width: 40.0,
                    description: "Formal Georgian gardens with manicured lawns, box hedging, and mature specimen trees. A gravel path leads from the house to a sunken garden with a central fountain. Multiple distinct areas connected by hedge-lined pathways.",
                    indoor_outdoor: IndoorOutdoor.OUTDOOR,
                    natural_light: NaturalLight.ABUNDANT,
                    flooring: "Manicured lawn, gravel paths, flagstone terraces",
                    ceiling_style: "Open sky, mature tree canopy in places",
                    key_features: "Sunken fountain garden, box-hedge parterre, ancient yew walk, wildflower meadow, views across 27 acres",
                    accessibility_notes: "Gravel paths and some steps between levels. Main lawn accessible. Sunken garden has 4 steps.",
                    tags: [
                        { type: SpaceType.GARDEN, description: "Multiple zones: formal parterre for drinks reception (60 guests standing), sunken garden for intimate photos, yew walk for processional shots, main lawn for group photos with house backdrop." },
                        { type: SpaceType.OUTDOOR_AREA, description: "Open-air ceremony option on the main south lawn with chairs facing the house. Backup marquee position on the croquet lawn." },
                        { type: SpaceType.COCKTAIL_AREA, description: "Drinks reception on the flagstone terrace adjacent to the drawing room. Bar set up against the house wall, guests spill onto the lawn. Capacity 100 standing." },
                    ],
                },
            ]
        },
        {
            name: "Delbury Hall Estate",
            address_line1: "Delbury Hall",
            city: "Craven Arms",
            state: "Shropshire",
            country: "United Kingdom",
            postal_code: "SY7 9BH",
            lat: 52.4255,
            lng: -2.8344,
            contact_name: "Victoria Cartwright",
            contact_phone: "+44 1588 673204",
            contact_email: "weddings@delburyhall.co.uk",
            capacity: 160,
            notes: "Grade II listed Georgian manor house surrounded by 300 acres of rolling countryside. Offers exclusive use with luxurious bridal suites and stunning drawing rooms.",
            spaces: [
                {
                    name: "The Great Hall",
                    space_type: "Ceremony Area",
                    capacity: 120,
                    dimensions_length: 25.0,
                    dimensions_width: 12.0,
                    dimensions_height: 8.0,
                    description: "Double-height entrance hall with a sweeping stone staircase descending from the first-floor gallery. Pale stone walls, large mullioned windows on the east side, and a minstrels' gallery above the entrance. The staircase becomes the natural focal point for ceremonies.",
                    indoor_outdoor: IndoorOutdoor.INDOOR,
                    natural_light: NaturalLight.MODERATE,
                    flooring: "Original stone flags with Persian runner",
                    ceiling_style: "Double-height hammer-beam oak roof, 8m",
                    key_features: "Sweeping stone staircase, minstrels' gallery, mullioned windows, carved stone fireplace, heraldic shields",
                    accessibility_notes: "Ground floor, wide entrance. One shallow step at threshold.",
                    tags: [
                        { type: SpaceType.CEREMONY_AREA, description: "Chairs in theatre-style rows facing the base of the staircase. Bride descends the stone staircase for a dramatic entrance. Registrar table positioned on the half-landing. Musician space in the minstrels' gallery above." },
                        { type: SpaceType.ENTRANCE_HALL, description: "Also serves as the arrival hall — guests enter through the main oak doors directly into this space. Drinks reception can be held here before transitioning to the Drawing Room." },
                    ],
                },
                {
                    name: "The Drawing Room",
                    space_type: "Reception Hall",
                    capacity: 100,
                    dimensions_length: 18.0,
                    dimensions_width: 12.0,
                    dimensions_height: 5.0,
                    description: "Warm, richly decorated reception room with deep red walls, gilt-framed portraits, and two tall sash windows. A large stone fireplace with carved mantel anchors the room. Antique oak floorboards throughout.",
                    indoor_outdoor: IndoorOutdoor.INDOOR,
                    natural_light: NaturalLight.MODERATE,
                    flooring: "Antique oak floorboards",
                    ceiling_style: "Ornate plaster with painted ceiling medallion, 5m",
                    key_features: "Carved stone fireplace, gilt-framed oil portraits, tall sash windows, antique sideboard for cake display",
                    accessibility_notes: "Ground floor, level access from Great Hall. One standard doorway.",
                    tags: [
                        { type: SpaceType.RECEPTION_HALL, description: "Round tables of 8 with the top table positioned in front of the fireplace. Intimate feel due to warm colours and lower ceiling. Speeches work well with natural acoustics. Evening candles on mantelpiece and windowsills." },
                        { type: SpaceType.DINING_AREA, description: "Wedding breakfast layout: 12 round tables, max 100 seated. Table plan typically runs in two columns with a central aisle for service." },
                    ],
                },
                {
                    name: "Bridal Suite",
                    space_type: "Bridal Suite",
                    capacity: 6,
                    dimensions_length: 7.0,
                    dimensions_width: 5.5,
                    dimensions_height: 3.5,
                    description: "Second-floor corner suite with dual-aspect windows over the estate parkland. Furnished with a four-poster bed, freestanding copper bath visible from the bedroom, and a dedicated vanity area with natural light.",
                    indoor_outdoor: IndoorOutdoor.INDOOR,
                    natural_light: NaturalLight.ABUNDANT,
                    flooring: "Wide oak boards with sheepskin rugs",
                    ceiling_style: "Exposed oak beams, 3.5m",
                    key_features: "Four-poster bed, freestanding copper bath, dual-aspect parkland views, vanity mirror with ring light",
                    accessibility_notes: "Second floor, stairs only. Not wheelchair accessible.",
                    tags: [
                        { type: SpaceType.BRIDAL_SUITE, description: "Getting-ready space for bride and 4 bridesmaids. The copper bath is often used for detail shots. Vanity area has the best light in the morning (east-facing window). Four-poster provides a stunning backdrop." },
                    ],
                },
                {
                    name: "The Courtyard",
                    space_type: "Outdoor Space",
                    capacity: 80,
                    dimensions_length: 20.0,
                    dimensions_width: 15.0,
                    description: "Enclosed cobbled courtyard surrounded by the hall's stable wings. Warm brick walls on all four sides with climbing wisteria and jasmine. A central stone well acts as a natural centrepiece.",
                    indoor_outdoor: IndoorOutdoor.PARTIALLY_COVERED,
                    natural_light: NaturalLight.ABUNDANT,
                    flooring: "Original cobblestones with flagstone edges",
                    ceiling_style: "Open sky, partially sheltered by overhanging eaves on two sides",
                    key_features: "Climbing wisteria, original stone well, warm brick walls, festoon light canopy, stable-door arches",
                    accessibility_notes: "Cobblestone surface, uneven in places. Level access from ground floor corridor.",
                    tags: [
                        { type: SpaceType.OUTDOOR_AREA, description: "Outdoor ceremony option with chairs facing the well. Bride enters through the stable archway. Covered by a festoon-light canopy for evening events." },
                        { type: SpaceType.COCKTAIL_AREA, description: "Drinks reception layout with hay-bale seating around the edges and a mobile bar beneath the covered eaves. Capacity 80 standing." },
                    ],
                },
            ]
        },
        {
            name: "Battlefield 1403",
            address_line1: "Battlefield Church",
            address_line2: "Battlefield",
            city: "Shrewsbury",
            state: "Shropshire",
            country: "United Kingdom",
            postal_code: "SY4 3DB",
            lat: 52.7271,
            lng: -2.7294,
            contact_name: "James Morrison",
            contact_phone: "+44 1939 290685",
            contact_email: "info@battlefield1403.com",
            capacity: 140,
            notes: "Unique historical venue built on the site of the famous Battle of Shrewsbury. Features contemporary design within a historic setting, offering both indoor and outdoor ceremony options.",
            spaces: [
                {
                    name: "The Main Hall",
                    space_type: "Ceremony Area",
                    capacity: 100,
                    dimensions_length: 22.0,
                    dimensions_width: 14.0,
                    dimensions_height: 7.0,
                    description: "Contemporary barn-conversion hall with exposed steel beams and original sandstone walls. Floor-to-ceiling glazed gable end faces west towards the battlefield site, creating a dramatic sunset backdrop. Clean, modern interior with industrial accents.",
                    indoor_outdoor: IndoorOutdoor.INDOOR,
                    natural_light: NaturalLight.ABUNDANT,
                    flooring: "Polished concrete with underfloor heating",
                    ceiling_style: "Exposed steel A-frame with timber purlins, 7m at ridge",
                    key_features: "Full-height glazed gable with battlefield views, exposed sandstone feature wall, industrial pendant lighting, built-in AV system with projector",
                    accessibility_notes: "Ground floor, level entry, automatic doors. Fully wheelchair accessible. Accessible WC.",
                    tags: [
                        { type: SpaceType.CEREMONY_AREA, description: "Theatre-style seating in curved rows facing the glazed gable end. Couple stands on a low platform against the window. Dramatic afternoon light streams in — golden hour backdrops in summer. Built-in PA and microphone." },
                        { type: SpaceType.RECEPTION_HALL, description: "Flexible layout: round tables of 8–10 fill the space for wedding breakfast. Long trestle tables also possible. Dance floor created at the gable end after tables clear. Professional lighting rig in the ceiling." },
                    ],
                },
                {
                    name: "The Garden Room",
                    space_type: "Reception Hall",
                    capacity: 80,
                    dimensions_length: 16.0,
                    dimensions_width: 10.0,
                    dimensions_height: 4.5,
                    description: "Light-filled extension with bi-fold glass doors opening onto the walled garden. Modern oak-frame structure with a vaulted timber ceiling. When the doors are fully open the room merges with the garden creating a seamless indoor-outdoor space.",
                    indoor_outdoor: IndoorOutdoor.PARTIALLY_COVERED,
                    natural_light: NaturalLight.ABUNDANT,
                    flooring: "Oak engineered boards extending to garden threshold",
                    ceiling_style: "Vaulted oak glulam with skylights, 4.5m at ridge",
                    key_features: "Bi-fold glass doors (full width), walled garden access, skylights, underfloor heating, integrated speakers",
                    accessibility_notes: "Ground floor, flush threshold to garden when bi-folds open. Fully accessible.",
                    tags: [
                        { type: SpaceType.RECEPTION_HALL, description: "Wedding breakfast for 80 seated at round tables. Top table against the back wall facing the garden. Bi-folds open for summer receptions creating an indoor-outdoor flow." },
                        { type: SpaceType.COCKTAIL_AREA, description: "Drinks reception with furniture cleared, high tables dotted around. Guests flow between inside and the walled garden. Bar positioned near the kitchen pass." },
                    ],
                },
                {
                    name: "Bridal Suite",
                    space_type: "Bridal Suite",
                    capacity: 4,
                    dimensions_length: 6.0,
                    dimensions_width: 5.0,
                    dimensions_height: 3.0,
                    description: "Compact modern suite on the first floor with clean white walls and a large skylight. Purpose-built bridal prep space with a backlit vanity mirror, clothes rail, and mini-fridge. Minimalist aesthetic with Scandinavian furniture.",
                    indoor_outdoor: IndoorOutdoor.INDOOR,
                    natural_light: NaturalLight.MODERATE,
                    flooring: "Light oak laminate",
                    ceiling_style: "Flat with large central skylight",
                    key_features: "Backlit vanity mirror, full-length mirror, Velux skylight, clothes rail, mini-fridge",
                    accessibility_notes: "First floor, stairs only.",
                    tags: [
                        { type: SpaceType.BRIDAL_SUITE, description: "Compact prep room for the bride and 3 attendants. Best light is directly beneath the skylight — ideal for makeup. Clothes rail fits 6+ dresses. Mirror positioned to catch skylight for photography." },
                    ],
                },
            ]
        },
        {
            name: "Hawkstone Hall",
            address_line1: "Weston-under-Redcastle",
            city: "Shrewsbury",
            state: "Shropshire",
            country: "United Kingdom",
            postal_code: "SY4 5UY",
            lat: 52.8073,
            lng: -2.6831,
            contact_name: "Charlotte Williams",
            contact_phone: "+44 1939 200611",
            contact_email: "weddings@hawkstonehall.co.uk",
            capacity: 220,
            notes: "Magnificent 18th-century Grade I listed mansion with baroque architecture. Set in 400 acres of parkland with formal gardens, perfect for large celebrations and intimate gatherings alike.",
            spaces: [
                {
                    name: "The Ballroom",
                    space_type: "Ceremony Area",
                    capacity: 200,
                    dimensions_length: 30.0,
                    dimensions_width: 15.0,
                    dimensions_height: 10.0,
                    description: "Magnificent baroque ballroom with a gilded ceiling, enormous crystal chandeliers, and floor-to-ceiling mirrors along the long walls. The room runs the full width of the house with tall arched windows at each end letting light stream across the polished floor.",
                    indoor_outdoor: IndoorOutdoor.INDOOR,
                    natural_light: NaturalLight.MODERATE,
                    flooring: "Original sprung maple dance floor",
                    ceiling_style: "Gilded baroque plasterwork with painted panels, 10m, three crystal chandeliers",
                    key_features: "Gilded ceiling, floor-to-ceiling pier mirrors, crystal chandeliers, arched windows both ends, raised musicians' platform",
                    accessibility_notes: "Ground floor, wide double doors from hallway. Fully accessible. Hearing loop installed.",
                    tags: [
                        { type: SpaceType.CEREMONY_AREA, description: "Theatre-style chairs in two wide blocks with a central aisle running the full 30m length. Couple stands at the far end beneath the chandeliers with the arched window behind. Dramatic processional walk. Musicians on the raised platform." },
                        { type: SpaceType.DANCE_FLOOR, description: "Original sprung maple floor — the entire room is a dance floor. Band or DJ set up on the raised platform at the east end. Chandeliers on dimmers for evening atmosphere." },
                    ],
                },
                {
                    name: "The Saloon",
                    space_type: "Reception Hall",
                    capacity: 150,
                    dimensions_length: 22.0,
                    dimensions_width: 14.0,
                    dimensions_height: 6.0,
                    description: "Grand state dining room with rich burgundy damask walls, an ornate plasterwork ceiling, and a massive marble fireplace at each end. Two pairs of tall sash windows face south over the formal gardens. Portraits of the Hawkstone family line the walls.",
                    indoor_outdoor: IndoorOutdoor.INDOOR,
                    natural_light: NaturalLight.MODERATE,
                    flooring: "Polished dark oak parquet",
                    ceiling_style: "Ornate rococo plasterwork with central painted medallion, 6m",
                    key_features: "Two marble fireplaces, damask-panelled walls, family portraits, south-facing garden views, antique candelabras",
                    accessibility_notes: "Ground floor, level access from hallway. Standard double doorway.",
                    tags: [
                        { type: SpaceType.RECEPTION_HALL, description: "Round tables of 10 in two rows with the top table centred between the two fireplaces. Candelabras on each table complement the portraits. Speeches benefit from excellent natural acoustics." },
                        { type: SpaceType.DINING_AREA, description: "Formal wedding breakfast for 150 seated. Silver service possible with kitchen access through a side corridor. Two fireplaces lit for winter weddings." },
                    ],
                },
                {
                    name: "Bridal Suite",
                    space_type: "Bridal Suite",
                    capacity: 8,
                    dimensions_length: 10.0,
                    dimensions_width: 8.0,
                    dimensions_height: 4.5,
                    description: "Grand first-floor corner suite with dual-aspect south and west windows offering views over the formal gardens and the Shropshire hills beyond. Furnished with a canopied four-poster bed, Venetian mirrors, and a separate dressing room with natural light from a bay window.",
                    indoor_outdoor: IndoorOutdoor.INDOOR,
                    natural_light: NaturalLight.ABUNDANT,
                    flooring: "Period oak boards with handwoven rugs",
                    ceiling_style: "High plaster with decorative cornice, 4.5m",
                    key_features: "Canopied four-poster, Venetian mirrors, bay window dressing room, en-suite with marble fixtures, garden views",
                    accessibility_notes: "First floor, grand staircase access only. Not wheelchair accessible.",
                    tags: [
                        { type: SpaceType.BRIDAL_SUITE, description: "Spacious enough for the bride and 6 bridesmaids. Separate dressing room with bay window provides the best light for hair and makeup. Four-poster canopy and Venetian mirrors create multiple photography backdrops." },
                        { type: SpaceType.GETTING_READY_ROOM, description: "Two makeup stations in the bay-window dressing room. Main bedroom for dress reveal and detail shots. Morning light from south windows is warm and even." },
                    ],
                },
                {
                    name: "The Terrace",
                    space_type: "Terrace",
                    capacity: 180,
                    dimensions_length: 50.0,
                    dimensions_width: 10.0,
                    description: "Formal south-facing stone terrace running the full length of the house, overlooking the restored Italian parterre garden. Balustrade edging with stone urns at intervals. Steps descend to the garden from three points.",
                    indoor_outdoor: IndoorOutdoor.OUTDOOR,
                    natural_light: NaturalLight.ABUNDANT,
                    flooring: "York stone flags",
                    ceiling_style: "Open sky",
                    key_features: "South-facing aspect, stone balustrade, Italian parterre views, three sets of garden steps, festoon-light posts",
                    accessibility_notes: "Level access from Saloon through French doors. Steps to garden below — no ramp.",
                    tags: [
                        { type: SpaceType.TERRACE, description: "Full-length terrace used for drinks reception (180 standing). Festoon lights strung between posts for evening events. Bar tables at intervals along the balustrade. Views of the parterre are the hero backdrop." },
                        { type: SpaceType.OUTDOOR_AREA, description: "Outdoor ceremony option with chairs arranged facing the parterre. Couple stands at the central steps with the garden below. Sunset ceremonies face west — golden hour in summer." },
                        { type: SpaceType.COCKTAIL_AREA, description: "Champagne reception on the terrace immediately after ceremony. Canapé service runs from the Saloon French doors. Capacity 180 standing comfortably." },
                    ],
                },
                {
                    name: "The Library",
                    space_type: "Library",
                    capacity: 30,
                    dimensions_length: 10.0,
                    dimensions_width: 8.0,
                    dimensions_height: 4.5,
                    description: "Intimate wood-panelled library with floor-to-ceiling bookshelves on three walls, a carved marble fireplace, and deep leather armchairs. A single tall window overlooks the walled garden. Warm, enclosed atmosphere with rich mahogany tones.",
                    indoor_outdoor: IndoorOutdoor.INDOOR,
                    natural_light: NaturalLight.LOW,
                    flooring: "Dark mahogany boards with oriental rug",
                    ceiling_style: "Coffered mahogany panelling, 4.5m",
                    key_features: "Floor-to-ceiling bookshelves, carved marble fireplace, leather Chesterfield armchairs, globe bar, walled-garden window",
                    accessibility_notes: "Ground floor, narrow doorway (78cm). May not accommodate standard wheelchairs.",
                    tags: [
                        { type: SpaceType.LIBRARY, description: "Used as a signing room after the ceremony — couple and witnesses sign the register at the antique desk by the window. Also popular for intimate portrait photography with the bookshelf backdrop." },
                        { type: SpaceType.LOUNGE, description: "Evening retreat for guests wanting a quieter space. Whisky service from the globe bar. Seats 12 comfortably in armchairs and Chesterfields." },
                        { type: SpaceType.PRIVATE_ROOM, description: "Can be reserved for the groom's party getting ready — fits 6 standing. Fireplace provides a warm, masculine backdrop for detail shots." },
                    ],
                },
            ]
        },
    ];

    // Create the venues and their spaces with duplicate checking
    let createdVenuesCount = 0;
    let skippedVenuesCount = 0;
    let createdSpacesCount = 0;
    let updatedSpacesCount = 0;

    for (const venueData of shropshireVenues) {
        const { spaces, ...venueInfo } = venueData;

        // Check if venue already exists by name and brand
        const existingVenue = await prisma.locationsLibrary.findFirst({
            where: {
                name: venueData.name,
                brand_id: moonriseBrand.id
            }
        });

        let venue;
        if (existingVenue) {
            // Update coords and city in case they were missing from an earlier seed run
            venue = await prisma.locationsLibrary.update({
                where: { id: existingVenue.id },
                data: { lat: venueInfo.lat, lng: venueInfo.lng, city: venueInfo.city }
            });
            logger.skipped(`Venue "${venueData.name}" already exists (ID: ${existingVenue.id}) — coords updated`, undefined, 'verbose');
            skippedVenuesCount++;
        } else {
            venue = await prisma.locationsLibrary.create({
                data: {
                    ...venueInfo,
                    brand_id: moonriseBrand.id,
                    is_active: true
                }
            });
            logger.created(`Venue: ${venueData.name} (ID: ${venue.id})`, 'verbose');
            createdVenuesCount++;
        }

        // Create/update spaces for this venue
        if (spaces && spaces.length > 0) {
            for (const spaceData of spaces) {
                const { tags: tagDefs, space_type, ...spaceFields } = spaceData;
                const legacyTags = space_type ? (SPACE_TAG_MAP[space_type] ?? []) : [];
                const allTags = tagDefs ?? legacyTags;

                const existingSpace = await prisma.locationSpace.findFirst({
                    where: { location_id: venue.id, name: spaceData.name, is_active: true },
                });
                if (existingSpace) {
                    // Update with enriched data
                    await prisma.locationSpace.update({
                        where: { id: existingSpace.id },
                        data: {
                            capacity: spaceFields.capacity,
                            dimensions_length: spaceFields.dimensions_length,
                            dimensions_width: spaceFields.dimensions_width,
                            dimensions_height: spaceFields.dimensions_height,
                            description: spaceFields.description,
                            indoor_outdoor: spaceFields.indoor_outdoor,
                            natural_light: spaceFields.natural_light,
                            flooring: spaceFields.flooring,
                            ceiling_style: spaceFields.ceiling_style,
                            key_features: spaceFields.key_features,
                            accessibility_notes: spaceFields.accessibility_notes,
                            notes: 'notes' in spaceFields ? (spaceFields as any).notes : undefined,
                            space_type: space_type,
                        },
                    });
                    // Upsert type tags with descriptions
                    if (allTags.length) {
                        for (const tag of allTags) {
                            await prisma.locationSpaceTypeTag.upsert({
                                where: {
                                    location_space_id_space_type: {
                                        location_space_id: existingSpace.id,
                                        space_type: tag.type,
                                    },
                                },
                                update: { description: tag.description ?? null },
                                create: {
                                    location_space_id: existingSpace.id,
                                    space_type: tag.type,
                                    description: tag.description ?? null,
                                },
                            });
                        }
                    }
                    updatedSpacesCount++;
                } else {
                    await prisma.locationSpace.create({
                        data: {
                            location_id: venue.id,
                            ...spaceFields,
                            space_type,
                            ...(allTags.length ? {
                                type_tags: {
                                    create: allTags.map((t) => ({
                                        space_type: t.type,
                                        description: t.description ?? null,
                                    })),
                                },
                            } : {}),
                        },
                    });
                    createdSpacesCount++;
                }
            }
        }

    }
    logger.summary('Venues', { created: createdVenuesCount, updated: 0, skipped: skippedVenuesCount, total: createdVenuesCount + skippedVenuesCount });
    logger.summary('Spaces', { created: createdSpacesCount, updated: updatedSpacesCount, skipped: 0, total: createdSpacesCount + updatedSpacesCount });
    logger.success('Moonrise Films Locations Library seeding completed!');
}

// Allow this file to be run directly
if (require.main === module) {
    seedMoonriseLocationsLibrary()
        .catch((e) => {
            logger.error(`Error seeding Moonrise locations library: ${String(e)}`);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
            logger.info("Database connection closed.");
        });
}
