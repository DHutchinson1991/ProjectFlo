// Moonrise Films Brand Seed - Simplified Setup
// Creates: Brand, team members, and simplified scenes for Moonrise Films
import { PrismaClient, $Enums } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
    console.log("🏢 Seeding Moonrise Films Brand (Complete Setup)...");
    console.log("");

    try {
        // --- 0. CREATE MOONRISE FILMS BRAND ---
        console.log("🏢 Creating Moonrise Films Brand...");

        const moonriseBrand = await prisma.brands.upsert({
            where: { name: "Moonrise Films" },
            update: {
                display_name: "Moonrise Films",
                description: "Premium wedding videography specializing in personal and intimate events",
                business_type: "Wedding Videography",
                website: "https://moonrisefilms.com",
                email: "hello@moonrisefilms.com",
                phone: "+1 (555) 123-4567",
                address_line1: "123 Creative Studio Lane",
                city: "Nashville",
                state: "TN",
                country: "United States",
                postal_code: "37201",
                timezone: "America/Chicago",
                currency: "USD",
                is_active: true,
            },
            create: {
                name: "Moonrise Films",
                display_name: "Moonrise Films",
                description: "Premium wedding videography specializing in personal and intimate events",
                business_type: "Wedding Videography",
                website: "https://moonrisefilms.com",
                email: "hello@moonrisefilms.com",
                phone: "+1 (555) 123-4567",
                address_line1: "123 Creative Studio Lane",
                city: "Nashville",
                state: "TN",
                country: "United States",
                postal_code: "37201",
                timezone: "America/Chicago",
                currency: "USD",
                is_active: true,
            },
        });

        // Create brand settings for Moonrise Films
        const brandSettings = [
            {
                brand_id: moonriseBrand.id,
                key: "default_timezone",
                value: "America/Chicago",
                data_type: "string",
                category: "general",
                description: "Default timezone for Moonrise Films",
            },
            {
                brand_id: moonriseBrand.id,
                key: "client_portal_enabled",
                value: "true",
                data_type: "boolean",
                category: "features",
                description: "Enable client portal access",
            },
            {
                brand_id: moonriseBrand.id,
                key: "default_film_length",
                value: "5",
                data_type: "number",
                category: "workflow",
                description: "Default film length in minutes",
            },
            {
                brand_id: moonriseBrand.id,
                key: "branding_colors",
                value: JSON.stringify({
                    primary: "#8B5A3C", // Warm brown
                    secondary: "#F4A460", // Sandy brown
                    accent: "#DAA520" // Goldenrod
                }),
                data_type: "json",
                category: "branding",
                description: "Moonrise Films brand color palette",
            },
        ];

        for (const settingData of brandSettings) {
            await prisma.brand_settings.upsert({
                where: {
                    brand_id_key: {
                        brand_id: settingData.brand_id,
                        key: settingData.key,
                    },
                },
                update: settingData,
                create: settingData,
            });
        }

        console.log(`  ✓ Created Moonrise Films brand with settings`);
        console.log("");

        // --- 1. CONTACTS & CONTRIBUTORS ---
        console.log("👥 Creating Moonrise Films Team...");

        // Create Manager role for Moonrise Films
        const managerRole = await prisma.roles.upsert({
            where: { name: "Manager" },
            update: {
                description: "Project and team management. Oversees workflows, schedules, and team coordination.",
                brand_id: moonriseBrand.id,
            },
            create: {
                name: "Manager",
                description: "Project and team management. Oversees workflows, schedules, and team coordination.",
                brand_id: moonriseBrand.id,
            },
        });

        // Hash passwords
        const managerPassword = await bcrypt.hash("Manager@2025", 10);

        // Create Andy Galloway (Manager)
        console.log("👤 Creating Andy Galloway (Manager)...");
        const andyContact = await prisma.contacts.upsert({
            where: { email: "andy.galloway@projectflo.co.uk" },
            update: {
                first_name: "Andy",
                last_name: "Galloway",
                type: $Enums.contacts_type.Contributor,
                brand_id: moonriseBrand.id,
            },
            create: {
                first_name: "Andy",
                last_name: "Galloway",
                email: "andy.galloway@projectflo.co.uk",
                type: $Enums.contacts_type.Contributor,
                brand_id: moonriseBrand.id,
            },
        });

        const andyContributor = await prisma.contributors.upsert({
            where: { contact_id: andyContact.id },
            update: {
                role_id: managerRole.id,
                contributor_type: "Internal",
                default_hourly_rate: 45.0,
                password_hash: managerPassword,
            },
            create: {
                contact_id: andyContact.id,
                role_id: managerRole.id,
                contributor_type: "Internal",
                default_hourly_rate: 45.0,
                password_hash: managerPassword,
            },
        });

        // Associate Andy with Moonrise Films brand
        await prisma.user_brands.upsert({
            where: {
                user_id_brand_id: {
                    user_id: andyContributor.id,
                    brand_id: moonriseBrand.id,
                },
            },
            update: {
                role: "Manager",
                is_active: true,
            },
            create: {
                user_id: andyContributor.id,
                brand_id: moonriseBrand.id,
                role: "Manager",
                is_active: true,
            },
        });

        // Create Corri Lee (Manager)
        console.log("👤 Creating Corri Lee (Manager)...");
        const corriContact = await prisma.contacts.upsert({
            where: { email: "corri.lee@projectflo.co.uk" },
            update: {
                first_name: "Corri",
                last_name: "Lee",
                type: $Enums.contacts_type.Contributor,
                brand_id: moonriseBrand.id,
            },
            create: {
                first_name: "Corri",
                last_name: "Lee",
                email: "corri.lee@projectflo.co.uk",
                type: $Enums.contacts_type.Contributor,
                brand_id: moonriseBrand.id,
            },
        });

        const corriContributor = await prisma.contributors.upsert({
            where: { contact_id: corriContact.id },
            update: {
                role_id: managerRole.id,
                contributor_type: "Internal",
                default_hourly_rate: 45.0,
                password_hash: managerPassword,
            },
            create: {
                contact_id: corriContact.id,
                role_id: managerRole.id,
                contributor_type: "Internal",
                default_hourly_rate: 45.0,
                password_hash: managerPassword,
            },
        });

        // Associate Corri with Moonrise Films brand
        await prisma.user_brands.upsert({
            where: {
                user_id_brand_id: {
                    user_id: corriContributor.id,
                    brand_id: moonriseBrand.id,
                },
            },
            update: {
                role: "Manager",
                is_active: true,
            },
            create: {
                user_id: corriContributor.id,
                brand_id: moonriseBrand.id,
                role: "Manager",
                is_active: true,
            },
        });

        console.log(`  ✓ Created 2 team members for Moonrise Films`);
        console.log("  👥 Managers: Andy Galloway, Corri Lee");
        console.log("  🌐 Global admin (Daniel) has access via admin system");
        console.log("");

        // --- 2. WEDDING SCENES ---
        console.log("� Creating Wedding Scenes with Media Components...");

        // Create First Dance Scene
        let firstDanceScene = await prisma.scenesLibrary.findFirst({
            where: {
                name: "First Dance",
                brand_id: moonriseBrand.id
            },
        });

        if (!firstDanceScene) {
            firstDanceScene = await prisma.scenesLibrary.create({
                data: {
                    name: "First Dance",
                    description: "Cinematic capture of the couple's first dance with multiple angles and audio",
                    type: $Enums.MediaType.VIDEO, // Primary type
                    complexity_score: 7,
                    estimated_duration: 240, // 4 minutes in seconds
                    base_task_hours: 4.5,
                    brand_id: moonriseBrand.id,
                },
            });
        }

        // Add media components for First Dance
        const firstDanceComponents = [
            {
                scene_id: firstDanceScene.id,
                media_type: 'VIDEO' as const,
                duration_seconds: 240,
                is_primary: true,
                notes: 'Primary video footage with multiple camera angles',
            },
            {
                scene_id: firstDanceScene.id,
                media_type: 'AUDIO' as const,
                duration_seconds: 240,
                is_primary: false,
                notes: 'Enhanced audio capture with ambient sound',
            },
            {
                scene_id: firstDanceScene.id,
                media_type: 'MUSIC' as const,
                duration_seconds: 240,
                is_primary: false,
                music_type: 'MODERN',
                notes: 'Background scoring to enhance the romantic moment',
            },
        ];

        for (const component of firstDanceComponents) {
            const existing = await prisma.sceneMediaComponent.findFirst({
                where: {
                    scene_id: component.scene_id,
                    media_type: component.media_type,
                },
            });

            if (!existing) {
                await prisma.sceneMediaComponent.create({
                    data: component,
                });
            }
        }

        // Create Ceremony Scene
        let ceremonyScene = await prisma.scenesLibrary.findFirst({
            where: {
                name: "Ceremony",
                brand_id: moonriseBrand.id
            },
        });

        if (!ceremonyScene) {
            ceremonyScene = await prisma.scenesLibrary.create({
                data: {
                    name: "Ceremony",
                    description: "Complete wedding ceremony coverage including processional, vows, and recessional",
                    type: $Enums.MediaType.VIDEO, // Primary type
                    complexity_score: 8,
                    estimated_duration: 1800, // 30 minutes in seconds
                    base_task_hours: 6.0,
                    brand_id: moonriseBrand.id,
                },
            });
        }

        // Add media components for Ceremony
        const ceremonyComponents = [
            {
                scene_id: ceremonyScene.id,
                media_type: 'VIDEO' as const,
                duration_seconds: 1800,
                is_primary: true,
                notes: 'Multi-camera ceremony coverage with processional, vows, and recessional',
            },
            {
                scene_id: ceremonyScene.id,
                media_type: 'AUDIO' as const,
                duration_seconds: 1800,
                is_primary: false,
                notes: 'High-quality ceremony audio including vows and readings',
            },
            {
                scene_id: ceremonyScene.id,
                media_type: 'MUSIC' as const,
                duration_seconds: 1800,
                is_primary: false,
                music_type: 'ORCHESTRAL',
                notes: 'Subtle orchestral background to enhance emotional moments',
            },
        ];

        for (const component of ceremonyComponents) {
            const existing = await prisma.sceneMediaComponent.findFirst({
                where: {
                    scene_id: component.scene_id,
                    media_type: component.media_type,
                },
            });

            if (!existing) {
                await prisma.sceneMediaComponent.create({
                    data: component,
                });
            }
        }

        console.log(`  ✓ Created 2 wedding scenes:`);
        console.log(`    🎬 First Dance (4 min) - Video + Audio + Music`);
        console.log(`    💒 Ceremony (30 min) - Video + Audio + Music`);

        // --- 3. FILM LIBRARY ---
        console.log("📚 Creating Film Library...");

        const filmItems = [
            {
                name: "First Dance Film",
                description: "A cinematic film capturing the couple's first dance",
                type: $Enums.FilmType.STANDARD,
                includes_music: true,
                default_music_type: $Enums.MusicType.MODERN,
                delivery_timeline: 14,
                version: "1.0",
                brand_id: moonriseBrand.id,
            },
            {
                name: "Ceremony Film",
                description: "Complete multi-camera edit of the wedding ceremony",
                type: $Enums.FilmType.STANDARD,
                includes_music: false,
                delivery_timeline: 21,
                version: "1.0",
                brand_id: moonriseBrand.id,
            },
        ];

        for (const film of filmItems) {
            await prisma.filmLibrary.upsert({
                where: { name: film.name },
                update: {
                    description: film.description,
                    type: film.type,
                    includes_music: film.includes_music,
                    default_music_type: film.default_music_type,
                    delivery_timeline: film.delivery_timeline,
                    version: film.version,
                },
                create: film,
            });
        }
        console.log(`  ✓ Created ${filmItems.length} film items`);

        // --- 4. TASK LIBRARY ---
        console.log("📋 Creating Task Library...");

        const taskLibraryItems = [
            // LEAD PHASE
            {
                name: "Lead Qualification",
                description: "Initial assessment of lead quality and fit",
                phase: $Enums.project_phase.Lead,
                pricing_type: $Enums.pricing_type_options.Fixed,
                effort_hours: 0.5,
                order_index: 1,
                brand_id: moonriseBrand.id,
            },
            {
                name: "Lead Follow-up",
                description: "Follow-up communication with potential client",
                phase: $Enums.project_phase.Lead,
                pricing_type: $Enums.pricing_type_options.Fixed,
                effort_hours: 0.25,
                order_index: 2,
                brand_id: moonriseBrand.id,
            },
            {
                name: "Lead Nurturing",
                description: "Ongoing relationship building with prospects",
                phase: $Enums.project_phase.Lead,
                pricing_type: $Enums.pricing_type_options.Fixed,
                effort_hours: 0.5,
                order_index: 3,
                brand_id: moonriseBrand.id,
            },

            // INQUIRY PHASE
            {
                name: "Initial Inquiry Response",
                description: "First response to client inquiry",
                phase: $Enums.project_phase.Inquiry,
                pricing_type: $Enums.pricing_type_options.Fixed,
                effort_hours: 0.5,
                order_index: 1,
                brand_id: moonriseBrand.id,
            },
            {
                name: "Consultation Scheduling",
                description: "Schedule and coordinate consultation meeting",
                phase: $Enums.project_phase.Inquiry,
                pricing_type: $Enums.pricing_type_options.Fixed,
                effort_hours: 0.25,
                order_index: 2,
                brand_id: moonriseBrand.id,
            },
            {
                name: "Portfolio Presentation",
                description: "Present work samples and discuss style preferences",
                phase: $Enums.project_phase.Inquiry,
                pricing_type: $Enums.pricing_type_options.Fixed,
                effort_hours: 1.0,
                order_index: 3,
                brand_id: moonriseBrand.id,
            },
            {
                name: "Requirements Discovery",
                description: "Detailed discussion of client needs and expectations",
                phase: $Enums.project_phase.Inquiry,
                pricing_type: $Enums.pricing_type_options.Fixed,
                effort_hours: 1.5,
                order_index: 4,
                brand_id: moonriseBrand.id,
            },

            // BOOKING PHASE
            {
                name: "Quote Generation",
                description: "Create detailed quote based on requirements",
                phase: $Enums.project_phase.Booking,
                pricing_type: $Enums.pricing_type_options.Fixed,
                effort_hours: 1.0,
                order_index: 1,
                brand_id: moonriseBrand.id,
            },
            {
                name: "Contract Preparation",
                description: "Prepare and customize contract for client",
                phase: $Enums.project_phase.Booking,
                pricing_type: $Enums.pricing_type_options.Fixed,
                effort_hours: 0.5,
                order_index: 2,
                brand_id: moonriseBrand.id,
            },
            {
                name: "Contract Negotiation",
                description: "Review and negotiate contract terms",
                phase: $Enums.project_phase.Booking,
                pricing_type: $Enums.pricing_type_options.Fixed,
                effort_hours: 1.0,
                order_index: 3,
                brand_id: moonriseBrand.id,
            },
            {
                name: "Booking Confirmation",
                description: "Finalize booking and process initial payment",
                phase: $Enums.project_phase.Booking,
                pricing_type: $Enums.pricing_type_options.Fixed,
                effort_hours: 0.5,
                order_index: 4,
                brand_id: moonriseBrand.id,
            },

            // CREATIVE DEVELOPMENT PHASE
            {
                name: "Creative Brief Development",
                description: "Develop comprehensive creative brief with client",
                phase: $Enums.project_phase.Creative_Development,
                pricing_type: $Enums.pricing_type_options.Fixed,
                effort_hours: 2.0,
                order_index: 1,
                brand_id: moonriseBrand.id,
            },
            {
                name: "Style Guide Creation",
                description: "Create visual style guide for the project",
                phase: $Enums.project_phase.Creative_Development,
                pricing_type: $Enums.pricing_type_options.Fixed,
                effort_hours: 1.5,
                order_index: 2,
                brand_id: moonriseBrand.id,
            },
            {
                name: "Shot List Planning",
                description: "Plan specific shots and sequences",
                phase: $Enums.project_phase.Creative_Development,
                pricing_type: $Enums.pricing_type_options.Fixed,
                effort_hours: 2.0,
                order_index: 3,
                brand_id: moonriseBrand.id,
            },
            {
                name: "Mood Board Creation",
                description: "Create visual mood boards for client approval",
                phase: $Enums.project_phase.Creative_Development,
                pricing_type: $Enums.pricing_type_options.Fixed,
                effort_hours: 1.0,
                order_index: 4,
                brand_id: moonriseBrand.id,
            },
            {
                name: "Creative Concept Approval",
                description: "Present and get approval for creative concepts",
                phase: $Enums.project_phase.Creative_Development,
                pricing_type: $Enums.pricing_type_options.Fixed,
                effort_hours: 1.0,
                order_index: 5,
                brand_id: moonriseBrand.id,
            },

            // PRE-PRODUCTION PHASE
            {
                name: "Location Scouting",
                description: "Scout and assess filming locations",
                phase: $Enums.project_phase.Pre_Production,
                pricing_type: $Enums.pricing_type_options.Fixed,
                effort_hours: 3.0,
                order_index: 1,
                brand_id: moonriseBrand.id,
            },
            {
                name: "Equipment Preparation",
                description: "Prepare and check all filming equipment",
                phase: $Enums.project_phase.Pre_Production,
                pricing_type: $Enums.pricing_type_options.Fixed,
                effort_hours: 2.0,
                order_index: 2,
                brand_id: moonriseBrand.id,
            },
            {
                name: "Timeline Coordination",
                description: "Coordinate timing with all parties involved",
                phase: $Enums.project_phase.Pre_Production,
                pricing_type: $Enums.pricing_type_options.Fixed,
                effort_hours: 1.5,
                order_index: 3,
                brand_id: moonriseBrand.id,
            },
            {
                name: "Vendor Coordination",
                description: "Coordinate with other wedding vendors",
                phase: $Enums.project_phase.Pre_Production,
                pricing_type: $Enums.pricing_type_options.Fixed,
                effort_hours: 1.0,
                order_index: 4,
                brand_id: moonriseBrand.id,
            },
            {
                name: "Client Pre-Production Meeting",
                description: "Final meeting before filming day",
                phase: $Enums.project_phase.Pre_Production,
                pricing_type: $Enums.pricing_type_options.Fixed,
                effort_hours: 1.0,
                order_index: 5,
                brand_id: moonriseBrand.id,
            },

            // PRODUCTION PHASE
            {
                name: "Getting Ready Coverage",
                description: "Film preparation and getting ready moments",
                phase: $Enums.project_phase.Production,
                pricing_type: $Enums.pricing_type_options.Fixed,
                effort_hours: 3.0,
                order_index: 1,
                brand_id: moonriseBrand.id,
            },
            {
                name: "Ceremony Filming",
                description: "Film the wedding ceremony",
                phase: $Enums.project_phase.Production,
                pricing_type: $Enums.pricing_type_options.Fixed,
                effort_hours: 4.0,
                order_index: 2,
                brand_id: moonriseBrand.id,
            },
            {
                name: "Couple Portrait Session",
                description: "Dedicated filming session for couple portraits",
                phase: $Enums.project_phase.Production,
                pricing_type: $Enums.pricing_type_options.Fixed,
                effort_hours: 2.0,
                order_index: 3,
                brand_id: moonriseBrand.id,
            },
            {
                name: "Family Portrait Session",
                description: "Film family group portraits and interactions",
                phase: $Enums.project_phase.Production,
                pricing_type: $Enums.pricing_type_options.Fixed,
                effort_hours: 1.5,
                order_index: 4,
                brand_id: moonriseBrand.id,
            },
            {
                name: "Reception Filming",
                description: "Film reception events and celebrations",
                phase: $Enums.project_phase.Production,
                pricing_type: $Enums.pricing_type_options.Fixed,
                effort_hours: 6.0,
                order_index: 5,
                brand_id: moonriseBrand.id,
            },
            {
                name: "B-Roll Footage",
                description: "Capture detail shots and supplementary footage",
                phase: $Enums.project_phase.Production,
                pricing_type: $Enums.pricing_type_options.Fixed,
                effort_hours: 2.0,
                order_index: 6,
                brand_id: moonriseBrand.id,
            },

            // POST-PRODUCTION PHASE
            {
                name: "Footage Review and Selection",
                description: "Review all footage and select best takes",
                phase: $Enums.project_phase.Post_Production,
                pricing_type: $Enums.pricing_type_options.Fixed,
                effort_hours: 4.0,
                order_index: 1,
                brand_id: moonriseBrand.id,
            },
            {
                name: "Audio Enhancement",
                description: "Clean and enhance audio from ceremony and reception",
                phase: $Enums.project_phase.Post_Production,
                pricing_type: $Enums.pricing_type_options.Fixed,
                effort_hours: 3.0,
                order_index: 2,
                brand_id: moonriseBrand.id,
            },
            {
                name: "Color Grading",
                description: "Color correct and grade all footage",
                phase: $Enums.project_phase.Post_Production,
                pricing_type: $Enums.pricing_type_options.Fixed,
                effort_hours: 6.0,
                order_index: 3,
                brand_id: moonriseBrand.id,
            },
            {
                name: "Music Selection and Licensing",
                description: "Select and license appropriate music",
                phase: $Enums.project_phase.Post_Production,
                pricing_type: $Enums.pricing_type_options.Fixed,
                effort_hours: 2.0,
                order_index: 4,
                brand_id: moonriseBrand.id,
            },
            {
                name: "Title Cards and Graphics",
                description: "Create title cards and graphic elements",
                phase: $Enums.project_phase.Post_Production,
                pricing_type: $Enums.pricing_type_options.Fixed,
                effort_hours: 3.0,
                order_index: 5,
                brand_id: moonriseBrand.id,
            },
            {
                name: "Video Editing - Highlight Reel",
                description: "Create 3-5 minute highlight reel",
                phase: $Enums.project_phase.Post_Production,
                pricing_type: $Enums.pricing_type_options.Fixed,
                effort_hours: 8.0,
                order_index: 6,
                brand_id: moonriseBrand.id,
            },
            {
                name: "Video Editing - Ceremony Edit",
                description: "Edit full ceremony footage",
                phase: $Enums.project_phase.Post_Production,
                pricing_type: $Enums.pricing_type_options.Fixed,
                effort_hours: 6.0,
                order_index: 7,
                brand_id: moonriseBrand.id,
            },
            {
                name: "Video Editing - Reception Edit",
                description: "Edit reception highlights and speeches",
                phase: $Enums.project_phase.Post_Production,
                pricing_type: $Enums.pricing_type_options.Fixed,
                effort_hours: 4.0,
                order_index: 8,
                brand_id: moonriseBrand.id,
            },
            {
                name: "Client Review and Revisions",
                description: "Present to client and make requested revisions",
                phase: $Enums.project_phase.Post_Production,
                pricing_type: $Enums.pricing_type_options.Fixed,
                effort_hours: 2.0,
                order_index: 9,
                brand_id: moonriseBrand.id,
            },

            // DELIVERY PHASE
            {
                name: "Final Export and Rendering",
                description: "Export final videos in all required formats",
                phase: $Enums.project_phase.Delivery,
                pricing_type: $Enums.pricing_type_options.Fixed,
                effort_hours: 2.0,
                order_index: 1,
                brand_id: moonriseBrand.id,
            },
            {
                name: "Quality Control Check",
                description: "Final quality check of all deliverables",
                phase: $Enums.project_phase.Delivery,
                pricing_type: $Enums.pricing_type_options.Fixed,
                effort_hours: 1.0,
                order_index: 2,
                brand_id: moonriseBrand.id,
            },
            {
                name: "USB/Physical Media Preparation",
                description: "Prepare physical delivery media",
                phase: $Enums.project_phase.Delivery,
                pricing_type: $Enums.pricing_type_options.Fixed,
                effort_hours: 0.5,
                order_index: 3,
                brand_id: moonriseBrand.id,
            },
            {
                name: "Online Gallery Setup",
                description: "Set up online gallery for client access",
                phase: $Enums.project_phase.Delivery,
                pricing_type: $Enums.pricing_type_options.Fixed,
                effort_hours: 1.0,
                order_index: 4,
                brand_id: moonriseBrand.id,
            },
            {
                name: "Client Delivery Coordination",
                description: "Coordinate delivery with client",
                phase: $Enums.project_phase.Delivery,
                pricing_type: $Enums.pricing_type_options.Fixed,
                effort_hours: 0.5,
                order_index: 5,
                brand_id: moonriseBrand.id,
            },
            {
                name: "Final Invoice and Payment",
                description: "Process final payment and close project",
                phase: $Enums.project_phase.Delivery,
                pricing_type: $Enums.pricing_type_options.Fixed,
                effort_hours: 0.5,
                order_index: 6,
                brand_id: moonriseBrand.id,
            },
            {
                name: "Project Archive",
                description: "Archive project files and documentation",
                phase: $Enums.project_phase.Delivery,
                pricing_type: $Enums.pricing_type_options.Fixed,
                effort_hours: 1.0,
                order_index: 7,
                brand_id: moonriseBrand.id,
            },
        ];

        for (const task of taskLibraryItems) {
            const existing = await prisma.task_library.findFirst({
                where: {
                    name: task.name,
                    brand_id: task.brand_id
                },
            });

            if (!existing) {
                await prisma.task_library.create({
                    data: task,
                });
            }
        }
        console.log(`  ✓ Created ${taskLibraryItems.length} task library items`);

        // Final Summary
        console.log("");
        console.log("🎉 =======================================");
        console.log("✅ Moonrise Films Brand Setup Complete!");
        console.log("📊 Summary:");
        console.log(`   • 1 brand (Moonrise Films)`);
        console.log(`   • 2 brand team members (Managers)`);
        console.log(`   • 1 role (Manager for this brand)`);
        console.log(`   • 2 wedding scenes (First Dance + Ceremony)`);
        console.log(`   • ${filmItems.length} film items`);
        console.log(`   • ${taskLibraryItems.length} task library items`);
        console.log("");
        console.log("🏢 Brand: Moonrise Films (Premium Wedding Videography)");
        console.log("");
        console.log("👥 Brand Team Members:");
        console.log("   🧑‍💼 Manager: Andy Galloway (andy.galloway@projectflo.co.uk)");
        console.log("   👥 Manager: Corri Lee (corri.lee@projectflo.co.uk)");
        console.log("");
        console.log("🔐 Brand Team Login:");
        console.log("   📧 Andy/Corri: [email] | 🔑 Password: Manager@2025");
        console.log("");
        console.log("🌐 Global Access:");
        console.log("   🌟 Global Admin: Daniel Hutchinson (from admin seed)");
        console.log("   📧 Global: info@dhutchinson.co.uk | 🔑 Password: Alined@2025");
        console.log("   🌟 Can access ALL brands including Moonrise Films");
        console.log("");
        console.log("🎬 Content Created:");
        console.log("   • First Dance Film");
        console.log("   • Ceremony Film");
        console.log("   • 2 scenes each with video, audio, and music components");
        console.log("");
        console.log("✨ Ready for simplified wedding film workflow!");
        console.log("=======================================");
    } catch (error) {
        console.error("❌ Wedding film seeding failed:", error);
        throw error;
    }
}

main()
    .catch((e) => {
        console.error("❌ Wedding film seeding failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
