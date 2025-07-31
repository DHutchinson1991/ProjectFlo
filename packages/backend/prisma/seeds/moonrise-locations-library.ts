// Moonrise Films Locations Library - Shropshire Wedding Venues
// Creates: 5 premium Shropshire wedding venues with detailed information and example spaces
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedMoonriseLocationsLibrary() {
    console.log("🏰 Seeding Moonrise Films Locations Library - Shropshire Wedding Venues...");

    // First, get the Moonrise Films brand ID
    const moonriseBrand = await prisma.brands.findUnique({
        where: { name: "Moonrise Films" }
    });

    if (!moonriseBrand) {
        console.warn("⚠️ Moonrise Films brand not found. Please run moonrise-brand-setup first.");
        return;
    }

    console.log(`🎬 Found Moonrise Films brand (ID: ${moonriseBrand.id})`);

    // Define the 5 Shropshire wedding venues
    const shropshireVenues = [
        {
            name: "Combermere Abbey Estate",
            address_line1: "Whitchurch Road",
            address_line2: "Combermere",
            city: "Whitchurch",
            state: "Shropshire",
            country: "United Kingdom",
            postal_code: "SY13 4AJ",
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
                    notes: "Magical outdoor ceremony space within the ancient abbey ruins, perfect for romantic vows with dramatic stone archways as backdrop."
                },
                {
                    name: "The Orangery",
                    space_type: "Reception Hall",
                    capacity: 150,
                    dimensions_length: 40.0,
                    dimensions_width: 25.0,
                    dimensions_height: 12.0,
                    notes: "Elegant glass orangery with panoramic views of the gardens and lake. Ideal for wedding breakfasts and evening receptions with natural light throughout the day."
                }
            ]
        },
        {
            name: "Iscoyd Park",
            address_line1: "Iscoyd Park",
            city: "Whitchurch",
            state: "Shropshire",
            country: "United Kingdom",
            postal_code: "SY13 3AT",
            contact_name: "Emma Godsal",
            contact_phone: "+44 1948 780785",
            contact_email: "events@iscoydpark.com",
            capacity: 180,
            notes: "Stunning 18th-century Georgian mansion set in 27 acres of beautiful Shropshire countryside. Features elegant reception rooms, manicured gardens, and a charming chapel."
        },
        {
            name: "Delbury Hall Estate",
            address_line1: "Delbury Hall",
            city: "Craven Arms",
            state: "Shropshire",
            country: "United Kingdom",
            postal_code: "SY7 9BH",
            contact_name: "Victoria Cartwright",
            contact_phone: "+44 1588 673204",
            contact_email: "weddings@delburyhall.co.uk",
            capacity: 160,
            notes: "Grade II listed Georgian manor house surrounded by 300 acres of rolling countryside. Offers exclusive use with luxurious bridal suites and stunning drawing rooms."
        },
        {
            name: "Battlefield 1403",
            address_line1: "Battlefield Church",
            address_line2: "Battlefield",
            city: "Shrewsbury",
            state: "Shropshire",
            country: "United Kingdom",
            postal_code: "SY4 3DB",
            contact_name: "James Morrison",
            contact_phone: "+44 1939 290685",
            contact_email: "info@battlefield1403.com",
            capacity: 140,
            notes: "Unique historical venue built on the site of the famous Battle of Shrewsbury. Features contemporary design within a historic setting, offering both indoor and outdoor ceremony options."
        },
        {
            name: "Hawkstone Hall",
            address_line1: "Weston-under-Redcastle",
            city: "Shrewsbury",
            state: "Shropshire",
            country: "United Kingdom",
            postal_code: "SY4 5UY",
            contact_name: "Charlotte Williams",
            contact_phone: "+44 1939 200611",
            contact_email: "weddings@hawkstonehall.co.uk",
            capacity: 220,
            notes: "Magnificent 18th-century Grade I listed mansion with baroque architecture. Set in 400 acres of parkland with formal gardens, perfect for large celebrations and intimate gatherings alike."
        }
    ];

    // Create the venues and their spaces
    for (const venueData of shropshireVenues) {
        const { spaces, ...venueInfo } = venueData;

        console.log(`🏛️ Creating venue: ${venueData.name}`);

        const venue = await prisma.locationsLibrary.upsert({
            where: {
                // Create a unique constraint based on name and brand_id
                id: -1 // This will always fail for where, so it will create
            },
            update: {},
            create: {
                ...venueInfo,
                brand_id: moonriseBrand.id,
                is_active: true
            }
        });

        // Create spaces if they exist
        if (spaces && spaces.length > 0) {
            console.log(`  📍 Creating ${spaces.length} spaces for ${venueData.name}`);

            for (const spaceData of spaces) {
                await prisma.locationSpaces.create({
                    data: {
                        ...spaceData,
                        location_id: venue.id,
                        is_active: true
                    }
                });
                console.log(`    ✅ Created space: ${spaceData.name}`);
            }
        }

        console.log(`✅ Successfully created venue: ${venueData.name} (ID: ${venue.id})`);
    }

    console.log("🎉 Moonrise Films Locations Library seeding completed!");
    console.log(`📊 Created ${shropshireVenues.length} Shropshire wedding venues`);
    console.log(`📍 Created ${shropshireVenues.reduce((total, venue) => total + (venue.spaces?.length || 0), 0)} location spaces`);
}

// Allow this file to be run directly
if (require.main === module) {
    seedMoonriseLocationsLibrary()
        .catch((e) => {
            console.error("❌ Error seeding Moonrise locations library:", e);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
            console.log("🔌 Database connection closed.");
        });
}
