import { PrismaClient, EquipmentCategory, EquipmentType, EquipmentCondition, EquipmentAvailability } from '@prisma/client';
import { createSeedLogger, SeedType, type SeedSummary } from '../utils/seed-logger';

const prisma = new PrismaClient();
const logger = createSeedLogger(SeedType.EQUIPMENT);

async function seedEquipment(): Promise<SeedSummary | void> {
    logger.sectionHeader('Equipment Setup', 'STEP 14/14: Equipment');
    logger.startTimer('equipment-seed');

    // Get the Moonrise Films brand specifically for equipment assignment
    const brand = await prisma.brands.findFirst({
        where: { name: "Moonrise Films" }
    });
    if (!brand) {
        logger.warning('Moonrise Films brand not found, skipping equipment seeding');
        logger.info('Make sure moonrise-films-seed runs before equipment-seed');
        return;
    }

    logger.success(`Assigning equipment to: ${brand.display_name} (${brand.name})`);
    logger.sectionDivider('Processing Equipment Items');

    // Define equipment data with proper enum types
    const equipmentData = [
        // CAMERAS
        {
            item_name: 'Canon EOS R5',
            item_code: 'CAM-R5-001',
            category: EquipmentCategory.CAMERA,
            type: EquipmentType.MIRRORLESS,
            brand_name: 'Canon',
            model: 'EOS R5',
            description: 'Full-frame mirrorless camera with 8K video recording',
            quantity: 2,
            condition: EquipmentCondition.EXCELLENT,
            availability_status: EquipmentAvailability.AVAILABLE,
            rental_price_per_day: 12.00,
            purchase_price: 3899.99,
            weight_kg: 0.738,
            power_usage_watts: 10,
            dimensions: '138.5 x 97.5 x 88.0 mm',
            specifications: {
                resolution: '45MP',
                video: '8K RAW, 4K 120p',
                iso_range: '100-51200',
                battery_life: '490 shots'
            },
            serial_number: 'R5-2024-001',
            location: 'Equipment Room A',
            brand_id: brand.id
        },
        {
            item_name: 'Sony A7S III',
            item_code: 'CAM-A7S3-001',
            category: EquipmentCategory.CAMERA,
            type: EquipmentType.MIRRORLESS,
            brand_name: 'Sony',
            model: 'A7S III',
            description: 'Full-frame camera optimized for video and low-light performance',
            quantity: 1,
            condition: EquipmentCondition.GOOD,
            availability_status: EquipmentAvailability.AVAILABLE,
            rental_price_per_day: 10.00,
            purchase_price: 3498.00,
            weight_kg: 0.699,
            power_usage_watts: 8,
            dimensions: '128.9 x 96.9 x 80.8 mm',
            specifications: {
                resolution: '12.1MP',
                video: '4K 120p, 16-bit RAW',
                iso_range: '80-409600',
                battery_life: '600 minutes video'
            },
            serial_number: 'A7S3-2023-001',
            location: 'Equipment Room A',
            brand_id: brand.id
        },
        {
            item_name: 'DJI Pocket 2',
            item_code: 'CAM-POCKET2-001',
            category: EquipmentCategory.CAMERA,
            type: EquipmentType.ACTION_CAM,
            brand_name: 'DJI',
            model: 'Pocket 2',
            description: 'Compact handheld camera with 3-axis gimbal',
            quantity: 3,
            condition: EquipmentCondition.EXCELLENT,
            availability_status: EquipmentAvailability.AVAILABLE,
            rental_price_per_day: 3.00,
            purchase_price: 449.00,
            weight_kg: 0.117,
            power_usage_watts: 3,
            dimensions: '124.7 x 38.1 x 30 mm',
            specifications: {
                resolution: '64MP photo, 4K 60p video',
                gimbal: '3-axis mechanical',
                battery_life: '140 minutes'
            },
            serial_number: 'POCKET2-2023-001',
            location: 'Mobile Kit A',
            brand_id: brand.id
        },

        // CAMCORDERS
        {
            item_name: 'Canon XA60 #1',
            item_code: 'CAM-XA60-001',
            category: EquipmentCategory.CAMERA,
            type: EquipmentType.CAMCORDER,
            brand_name: 'Canon',
            model: 'XA60',
            description: 'Professional UHD 4K camcorder with 20x optical zoom, ideal for weddings, events and documentary work',
            quantity: 1,
            condition: EquipmentCondition.EXCELLENT,
            availability_status: EquipmentAvailability.AVAILABLE,
            rental_price_per_day: 8.00,
            purchase_price: 2099.00,
            weight_kg: 0.980,
            power_usage_watts: 6,
            dimensions: '153 x 153 x 329 mm',
            specifications: {
                sensor: '1/2.3-inch CMOS',
                resolution: '4K UHD 30p / FHD 60p',
                zoom: '20x Optical, 40x Advanced',
                lens: 'f/1.8-2.8 wide angle',
                stabilization: 'Optical IS',
                recording_format: 'MP4 (HEVC/H.264)',
                audio: 'Linear PCM 4-channel',
                inputs: '2x XLR (with phantom power)',
                outputs: 'HDMI, 3G-SDI',
                battery: 'BP-820, approx 3hrs',
                storage: 'Dual SD card slots'
            },
            compatibility: 'XLR audio, SD cards, BP-800 series batteries',
            serial_number: 'XA60-2025-001',
            location: 'Equipment Room A',
            brand_id: brand.id
        },
        {
            item_name: 'Canon XA60 #2',
            item_code: 'CAM-XA60-002',
            category: EquipmentCategory.CAMERA,
            type: EquipmentType.CAMCORDER,
            brand_name: 'Canon',
            model: 'XA60',
            description: 'Professional UHD 4K camcorder with 20x optical zoom, ideal for weddings, events and documentary work',
            quantity: 1,
            condition: EquipmentCondition.EXCELLENT,
            availability_status: EquipmentAvailability.AVAILABLE,
            rental_price_per_day: 8.00,
            purchase_price: 2099.00,
            weight_kg: 0.980,
            power_usage_watts: 6,
            dimensions: '153 x 153 x 329 mm',
            specifications: {
                sensor: '1/2.3-inch CMOS',
                resolution: '4K UHD 30p / FHD 60p',
                zoom: '20x Optical, 40x Advanced',
                lens: 'f/1.8-2.8 wide angle',
                stabilization: 'Optical IS',
                recording_format: 'MP4 (HEVC/H.264)',
                audio: 'Linear PCM 4-channel',
                inputs: '2x XLR (with phantom power)',
                outputs: 'HDMI, 3G-SDI',
                battery: 'BP-820, approx 3hrs',
                storage: 'Dual SD card slots'
            },
            compatibility: 'XLR audio, SD cards, BP-800 series batteries',
            serial_number: 'XA60-2025-002',
            location: 'Equipment Room A',
            brand_id: brand.id
        },
        {
            item_name: 'Canon XA60 #3',
            item_code: 'CAM-XA60-003',
            category: EquipmentCategory.CAMERA,
            type: EquipmentType.CAMCORDER,
            brand_name: 'Canon',
            model: 'XA60',
            description: 'Professional UHD 4K camcorder with 20x optical zoom, ideal for weddings, events and documentary work',
            quantity: 1,
            condition: EquipmentCondition.EXCELLENT,
            availability_status: EquipmentAvailability.AVAILABLE,
            rental_price_per_day: 8.00,
            purchase_price: 2099.00,
            weight_kg: 0.980,
            power_usage_watts: 6,
            dimensions: '153 x 153 x 329 mm',
            specifications: {
                sensor: '1/2.3-inch CMOS',
                resolution: '4K UHD 30p / FHD 60p',
                zoom: '20x Optical, 40x Advanced',
                lens: 'f/1.8-2.8 wide angle',
                stabilization: 'Optical IS',
                recording_format: 'MP4 (HEVC/H.264)',
                audio: 'Linear PCM 4-channel',
                inputs: '2x XLR (with phantom power)',
                outputs: 'HDMI, 3G-SDI',
                battery: 'BP-820, approx 3hrs',
                storage: 'Dual SD card slots'
            },
            compatibility: 'XLR audio, SD cards, BP-800 series batteries',
            serial_number: 'XA60-2025-003',
            location: 'Equipment Room A',
            brand_id: brand.id
        },
        {
            item_name: 'Canon XA60 #4',
            item_code: 'CAM-XA60-004',
            category: EquipmentCategory.CAMERA,
            type: EquipmentType.CAMCORDER,
            brand_name: 'Canon',
            model: 'XA60',
            description: 'Professional UHD 4K camcorder with 20x optical zoom, ideal for weddings, events and documentary work',
            quantity: 1,
            condition: EquipmentCondition.EXCELLENT,
            availability_status: EquipmentAvailability.AVAILABLE,
            rental_price_per_day: 8.00,
            purchase_price: 2099.00,
            weight_kg: 0.980,
            power_usage_watts: 6,
            dimensions: '153 x 153 x 329 mm',
            specifications: {
                sensor: '1/2.3-inch CMOS',
                resolution: '4K UHD 30p / FHD 60p',
                zoom: '20x Optical, 40x Advanced',
                lens: 'f/1.8-2.8 wide angle',
                stabilization: 'Optical IS',
                recording_format: 'MP4 (HEVC/H.264)',
                audio: 'Linear PCM 4-channel',
                inputs: '2x XLR (with phantom power)',
                outputs: 'HDMI, 3G-SDI',
                battery: 'BP-820, approx 3hrs',
                storage: 'Dual SD card slots'
            },
            compatibility: 'XLR audio, SD cards, BP-800 series batteries',
            serial_number: 'XA60-2025-004',
            location: 'Equipment Room B',
            brand_id: brand.id
        },
        {
            item_name: 'Canon XA60 #5',
            item_code: 'CAM-XA60-005',
            category: EquipmentCategory.CAMERA,
            type: EquipmentType.CAMCORDER,
            brand_name: 'Canon',
            model: 'XA60',
            description: 'Professional UHD 4K camcorder with 20x optical zoom, ideal for weddings, events and documentary work',
            quantity: 1,
            condition: EquipmentCondition.EXCELLENT,
            availability_status: EquipmentAvailability.AVAILABLE,
            rental_price_per_day: 8.00,
            purchase_price: 2099.00,
            weight_kg: 0.980,
            power_usage_watts: 6,
            dimensions: '153 x 153 x 329 mm',
            specifications: {
                sensor: '1/2.3-inch CMOS',
                resolution: '4K UHD 30p / FHD 60p',
                zoom: '20x Optical, 40x Advanced',
                lens: 'f/1.8-2.8 wide angle',
                stabilization: 'Optical IS',
                recording_format: 'MP4 (HEVC/H.264)',
                audio: 'Linear PCM 4-channel',
                inputs: '2x XLR (with phantom power)',
                outputs: 'HDMI, 3G-SDI',
                battery: 'BP-820, approx 3hrs',
                storage: 'Dual SD card slots'
            },
            compatibility: 'XLR audio, SD cards, BP-800 series batteries',
            serial_number: 'XA60-2025-005',
            location: 'Equipment Room B',
            brand_id: brand.id
        },

        // LENSES
        {
            item_name: 'Canon RF 24-70mm f/2.8L IS USM',
            item_code: 'LENS-RF2470-001',
            category: EquipmentCategory.LENS,
            type: EquipmentType.CANON_RF,
            brand_name: 'Canon',
            model: 'RF 24-70mm f/2.8L IS USM',
            description: 'Professional standard zoom lens with image stabilization',
            quantity: 2,
            condition: EquipmentCondition.EXCELLENT,
            availability_status: EquipmentAvailability.AVAILABLE,
            rental_price_per_day: 7.00,
            purchase_price: 2299.00,
            weight_kg: 0.900,
            dimensions: '88.5 x 125.7 mm',
            specifications: {
                focal_length: '24-70mm',
                aperture: 'f/2.8',
                image_stabilization: '5-stop IS',
                filter_size: '82mm'
            },
            attachment_type: 'RF Mount',
            compatibility: 'Canon EOS R series',
            serial_number: 'RF2470-2023-001',
            location: 'Lens Cabinet A',
            brand_id: brand.id
        },
        {
            item_name: 'Sony FE 85mm f/1.4 GM',
            item_code: 'LENS-FE85-001',
            category: EquipmentCategory.LENS,
            type: EquipmentType.SONY_E_MOUNT,
            brand_name: 'Sony',
            model: 'FE 85mm f/1.4 GM',
            description: 'Premium portrait lens with beautiful bokeh',
            quantity: 1,
            condition: EquipmentCondition.EXCELLENT,
            availability_status: EquipmentAvailability.AVAILABLE,
            rental_price_per_day: 5.00,
            purchase_price: 1798.00,
            weight_kg: 0.820,
            dimensions: '89.5 x 107.5 mm',
            specifications: {
                focal_length: '85mm',
                aperture: 'f/1.4',
                filter_size: '77mm',
                elements: '11 elements in 8 groups'
            },
            attachment_type: 'E Mount',
            compatibility: 'Sony FE cameras',
            serial_number: 'FE85-2023-001',
            location: 'Lens Cabinet A',
            brand_id: brand.id
        },

        // AUDIO EQUIPMENT
        {
            item_name: 'Zoom H6 Handy Recorder',
            item_code: 'AUD-H6-001',
            category: EquipmentCategory.AUDIO,
            type: EquipmentType.RECORDER,
            brand_name: 'Zoom',
            model: 'H6',
            description: '6-track portable recorder with interchangeable capsules',
            quantity: 2,
            condition: EquipmentCondition.GOOD,
            availability_status: EquipmentAvailability.AVAILABLE,
            rental_price_per_day: 3.00,
            purchase_price: 399.99,
            weight_kg: 0.280,
            power_usage_watts: 5,
            dimensions: '77.8 x 152.4 x 47.3 mm',
            specifications: {
                tracks: '6 simultaneous',
                recording_format: 'WAV/MP3',
                battery_life: '20 hours',
                inputs: '4 XLR/TRS combo'
            },
            serial_number: 'H6-2022-001',
            location: 'Audio Cabinet',
            brand_id: brand.id
        },
        {
            item_name: 'Sennheiser MKE 600 Shotgun Mic',
            item_code: 'AUD-MKE600-001',
            category: EquipmentCategory.AUDIO,
            type: EquipmentType.CONDENSER,
            brand_name: 'Sennheiser',
            model: 'MKE 600',
            description: 'Professional shotgun microphone for camera mounting',
            quantity: 3,
            condition: EquipmentCondition.EXCELLENT,
            availability_status: EquipmentAvailability.AVAILABLE,
            rental_price_per_day: 2.00,
            purchase_price: 349.95,
            weight_kg: 0.128,
            dimensions: '256 x 20 mm',
            specifications: {
                polar_pattern: 'Super-cardioid',
                frequency_response: '40Hz-20kHz',
                power: 'Phantom/Battery',
                connector: 'XLR-3M'
            },
            attachment_type: 'Cold shoe mount',
            compatibility: 'Universal camera mount',
            serial_number: 'MKE600-2023-001',
            location: 'Audio Cabinet',
            brand_id: brand.id
        },
        {
            item_name: 'Rode Wireless GO II',
            item_code: 'AUD-WGOII-001',
            category: EquipmentCategory.AUDIO,
            type: EquipmentType.LAVALIER,
            brand_name: 'Rode',
            model: 'Wireless GO II',
            description: 'Dual-channel wireless microphone system',
            quantity: 2,
            condition: EquipmentCondition.EXCELLENT,
            availability_status: EquipmentAvailability.AVAILABLE,
            rental_price_per_day: 3.00,
            purchase_price: 299.00,
            weight_kg: 0.031,
            power_usage_watts: 2,
            dimensions: '44 x 45.3 x 18.5 mm',
            specifications: {
                range: '200m line of sight',
                battery_life: '7 hours',
                channels: 'Dual channel',
                recording: 'On-board backup'
            },
            serial_number: 'WGOII-2023-001',
            location: 'Audio Cabinet',
            brand_id: brand.id
        },

        // LIGHTING
        {
            item_name: 'ARRI SkyPanel S30-C',
            item_code: 'LIGHT-S30C-001',
            category: EquipmentCategory.LIGHTING,
            type: EquipmentType.LED,
            brand_name: 'ARRI',
            model: 'SkyPanel S30-C',
            description: 'Color LED soft light with advanced control features',
            quantity: 2,
            condition: EquipmentCondition.EXCELLENT,
            availability_status: EquipmentAvailability.AVAILABLE,
            rental_price_per_day: 5.00,
            purchase_price: 1590.00,
            weight_kg: 2.7,
            power_usage_watts: 150,
            dimensions: '315 x 315 x 142 mm',
            specifications: {
                color_temperature: '2800K-10000K',
                cri: '95+',
                tlci: '98+',
                beam_angle: '115°'
            },
            serial_number: 'S30C-2023-001',
            location: 'Lighting Room',
            brand_id: brand.id
        },
        {
            item_name: 'Aputure 300D Mark II',
            item_code: 'LIGHT-300D-001',
            category: EquipmentCategory.LIGHTING,
            type: EquipmentType.LED,
            brand_name: 'Aputure',
            model: '300D Mark II',
            description: 'High-output daylight LED with Bowens mount',
            quantity: 3,
            condition: EquipmentCondition.GOOD,
            availability_status: EquipmentAvailability.AVAILABLE,
            rental_price_per_day: 4.00,
            purchase_price: 799.00,
            weight_kg: 2.5,
            power_usage_watts: 300,
            dimensions: '190 x 190 x 280 mm',
            specifications: {
                color_temperature: '5500K',
                cri: '96+',
                tlci: '97+',
                output: '20000 lux at 1m'
            },
            attachment_type: 'Bowens Mount',
            serial_number: '300D-2022-001',
            location: 'Lighting Room',
            brand_id: brand.id
        },

        // GRIP EQUIPMENT
        {
            item_name: 'Manfrotto 504HD Tripod System',
            item_code: 'GRIP-504HD-001',
            category: EquipmentCategory.GRIP,
            type: EquipmentType.TRIPOD,
            brand_name: 'Manfrotto',
            model: '504HD with 535 Legs',
            description: 'Professional fluid head tripod system',
            quantity: 4,
            condition: EquipmentCondition.GOOD,
            availability_status: EquipmentAvailability.AVAILABLE,
            rental_price_per_day: 3.00,
            purchase_price: 649.95,
            weight_kg: 4.1,
            dimensions: 'Height: 1700mm max',
            specifications: {
                payload: '7.5kg',
                height_range: '55-170cm',
                counterbalance: '7 positions',
                drag: 'Continuous + stepped'
            },
            serial_number: '504HD-2022-001',
            location: 'Grip Room',
            brand_id: brand.id
        },
        {
            item_name: 'DJI Ronin SC',
            item_code: 'GRIP-RSC-001',
            category: EquipmentCategory.GRIP,
            type: EquipmentType.GIMBAL,
            brand_name: 'DJI',
            model: 'Ronin SC',
            description: '3-axis camera stabilizer for mirrorless cameras',
            quantity: 2,
            condition: EquipmentCondition.EXCELLENT,
            availability_status: EquipmentAvailability.AVAILABLE,
            rental_price_per_day: 4.00,
            purchase_price: 499.00,
            weight_kg: 1.1,
            power_usage_watts: 8,
            dimensions: '220 x 200 x 75 mm',
            specifications: {
                payload: '2kg',
                battery_life: '11 hours',
                control_range: '50m',
                modes: 'Pan Follow, Lock, FPV'
            },
            serial_number: 'RSC-2023-001',
            location: 'Grip Room',
            brand_id: brand.id
        },

        // POWER & STORAGE
        {
            item_name: 'Anton Bauer Titon 90 Battery',
            item_code: 'PWR-TITON90-001',
            category: EquipmentCategory.POWER,
            type: EquipmentType.BATTERY,
            brand_name: 'Anton Bauer',
            model: 'Titon 90',
            description: 'High-capacity V-Mount battery with smart technology',
            quantity: 6,
            condition: EquipmentCondition.EXCELLENT,
            availability_status: EquipmentAvailability.AVAILABLE,
            rental_price_per_day: 2.00,
            purchase_price: 279.00,
            weight_kg: 0.7,
            dimensions: '100 x 70 x 52 mm',
            specifications: {
                capacity: '90Wh',
                voltage: '14.4V',
                runtime: 'Up to 4 hours typical',
                mount: 'V-Mount'
            },
            attachment_type: 'V-Mount',
            serial_number: 'TITON90-2023-001',
            location: 'Power Station',
            brand_id: brand.id
        },
        {
            item_name: 'SanDisk Extreme PRO CFexpress',
            item_code: 'STOR-CFX-001',
            category: EquipmentCategory.STORAGE,
            type: EquipmentType.MEMORY_CARD,
            brand_name: 'SanDisk',
            model: 'Extreme PRO CFexpress 128GB',
            description: 'High-speed memory card for 8K recording',
            quantity: 8,
            condition: EquipmentCondition.EXCELLENT,
            availability_status: EquipmentAvailability.AVAILABLE,
            rental_price_per_day: 1.00,
            purchase_price: 199.99,
            weight_kg: 0.010,
            dimensions: '38.5 x 29.8 x 3.8 mm',
            specifications: {
                capacity: '128GB',
                read_speed: '1700MB/s',
                write_speed: '1400MB/s',
                type: 'CFexpress Type B'
            },
            serial_number: 'CFX128-2023-001',
            location: 'Media Storage',
            brand_id: brand.id
        },

        // ACCESSORIES
        {
            item_name: 'SmallRig Universal Cage',
            item_code: 'ACC-CAGE-001',
            category: EquipmentCategory.ACCESSORIES,
            type: EquipmentType.OTHER_EQUIPMENT,
            brand_name: 'SmallRig',
            model: 'Universal Camera Cage',
            description: 'Modular cage system for camera protection and mounting',
            quantity: 3,
            condition: EquipmentCondition.GOOD,
            availability_status: EquipmentAvailability.AVAILABLE,
            rental_price_per_day: 1.00,
            purchase_price: 89.00,
            weight_kg: 0.3,
            dimensions: 'Adjustable',
            specifications: {
                material: 'Aluminum alloy',
                thread: '1/4"-20, 3/8"-16',
                compatibility: 'Multiple camera models'
            },
            attachment_type: '1/4" and 3/8" threads',
            serial_number: 'CAGE-2023-001',
            location: 'Accessories Drawer',
            brand_id: brand.id
        },

        // BACKGROUNDS
        {
            item_name: 'Elgato Green Screen',
            item_code: 'BG-ELGATO-001',
            category: EquipmentCategory.BACKGROUNDS,
            type: EquipmentType.GREEN_SCREEN,
            brand_name: 'Elgato',
            model: 'Green Screen',
            description: 'Collapsible chroma key backdrop',
            quantity: 2,
            condition: EquipmentCondition.EXCELLENT,
            availability_status: EquipmentAvailability.AVAILABLE,
            rental_price_per_day: 2.00,
            purchase_price: 159.99,
            weight_kg: 8.2,
            dimensions: '148 x 180 cm',
            specifications: {
                material: 'Wrinkle-resistant fabric',
                setup: 'Pop-up design',
                color: 'Chroma key green'
            },
            serial_number: 'ELGSCREEN-2023-001',
            location: 'Studio B',
            brand_id: brand.id
        }
    ];

    // Create equipment records with duplicate checking
    let createdCount = 0;
    let skippedCount = 0;

    for (const equipment of equipmentData) {
        try {
            // Check if equipment already exists by item_code
            const existing = await prisma.equipment.findFirst({
                where: {
                    item_code: equipment.item_code,
                    brand_id: brand.id
                }
            });

            if (existing) {
                logger.skipped(`${equipment.item_name} (${equipment.item_code})`, 'already exists', 'verbose');
                skippedCount++;
            } else {
                await prisma.equipment.create({
                    data: {
                        ...equipment,
                        purchase_date: new Date('2023-01-15'), // Set a default purchase date
                        last_maintenance: new Date('2024-01-01'),
                        next_maintenance_due: new Date('2024-12-31')
                    }
                });
                logger.created(`${equipment.item_name} (${equipment.item_code})`, 'verbose');
                createdCount++;
            }
        } catch (error) {
            logger.error(`Failed to process equipment ${equipment.item_name}: ${error}`);
        }
    }

    // Full summary with totals
    const summary: SeedSummary = { created: createdCount, updated: 0, skipped: skippedCount, total: createdCount + skippedCount };
    logger.summary('Equipment items', summary);

    logger.endTimer('equipment-seed', 'Equipment seeding');
    logger.success(`Equipment seeding completed for ${brand.display_name}!`);

    return summary;
}

// Export the seed function for use in other modules
export { seedEquipment };

// Run the seed function
seedEquipment()
    .catch((e) => {
        console.error('Error seeding equipment:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
