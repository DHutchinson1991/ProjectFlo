import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export type ServiceTypeKey = 'WEDDING' | 'BIRTHDAY' | 'ENGAGEMENT';

const DEFAULT_SLOT_TIERS = ['Budget', 'Basic', 'Standard', 'Premium'] as const;

@Injectable()
export class BrandProvisioningService {
    private readonly logger = new Logger(BrandProvisioningService.name);

    constructor(private prisma: PrismaService) {}

    /**
     * Provision all data for the given service type keys.
     * Idempotent: skips any service type that already has an EventType with that name for the brand.
     */
    async provision(brandId: number, serviceTypes: ServiceTypeKey[]): Promise<string[]> {
        const provisioned: string[] = [];

        for (const key of serviceTypes) {
            const existingEventType = await this.prisma.eventType.findFirst({
                where: { brand_id: brandId, name: this.getEventTypeName(key) },
            });
            if (existingEventType) {
                // Event type exists — ensure package category + set are present
                await this.ensurePackageCategoryAndSet(brandId, existingEventType.id, key);
                this.logger.log(`Brand ${brandId}: ${key} already provisioned, ensured category/set`);
                continue;
            }

            switch (key) {
                case 'WEDDING':
                    await this.provisionWedding(brandId);
                    break;
                case 'BIRTHDAY':
                    await this.provisionBirthday(brandId);
                    break;
                case 'ENGAGEMENT':
                    await this.provisionEngagement(brandId);
                    break;
            }
            provisioned.push(key);
            this.logger.log(`Brand ${brandId}: ${key} provisioned`);
        }

        return provisioned;
    }

    /**
     * Ensure a package category linked to the event type exists, and that
     * the category has at least one package set (with event_type_id set directly).
     */
    private async ensurePackageCategoryAndSet(brandId: number, eventTypeId: number, key: ServiceTypeKey) {
        const name = this.getEventTypeName(key);

        // Find or create category linked to this event type
        let category = await this.prisma.service_package_categories.findFirst({
            where: { brand_id: brandId, event_type_id: eventTypeId },
        });
        if (!category) {
            // Try to adopt an existing category with a matching name
            category = await this.prisma.service_package_categories.findFirst({
                where: { brand_id: brandId, name: { contains: name, mode: 'insensitive' }, event_type_id: null },
            });
            if (category) {
                await this.prisma.service_package_categories.update({
                    where: { id: category.id },
                    data: { event_type_id: eventTypeId },
                });
            } else {
                category = await this.prisma.service_package_categories.create({
                    data: { brand_id: brandId, name, description: `${name} packages`, order_index: 0, is_active: true, event_type_id: eventTypeId },
                });
            }
        }

        // Ensure at least one package set exists for this event type
        const setCount = await this.prisma.package_sets.count({ where: { brand_id: brandId, event_type_id: eventTypeId } });
        if (setCount === 0) {
            const set = await this.prisma.package_sets.create({
                data: { brand_id: brandId, name: `${name} Packages`, description: `Our ${name.toLowerCase()} packages`, emoji: this.getEventTypeEmoji(key), category_id: category.id, event_type_id: eventTypeId, is_active: true, order_index: 0 },
            });
            await this.prisma.$transaction(
                DEFAULT_SLOT_TIERS.map((label, i) =>
                    this.prisma.package_set_slots.create({ data: { package_set_id: set.id, slot_label: label, order_index: i } }),
                ),
            );
        }
    }

    private getEventTypeName(key: ServiceTypeKey): string {
        const names: Record<ServiceTypeKey, string> = {
            WEDDING: 'Wedding',
            BIRTHDAY: 'Birthday',
            ENGAGEMENT: 'Engagement',
        };
        return names[key];
    }

    private getEventTypeEmoji(key: ServiceTypeKey): string {
        const emojis: Record<ServiceTypeKey, string> = {
            WEDDING: '💒',
            BIRTHDAY: '🎂',
            ENGAGEMENT: '💍',
        };
        return emojis[key];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // WEDDING
    // ─────────────────────────────────────────────────────────────────────────

    private async provisionWedding(brandId: number) {
        await this.prisma.$transaction(async (tx) => {
            // 1. Subject roles
            const weddingRolesData = [
                { role_name: 'Bride',           order_index: 0, is_core: true,  never_group: true,  is_group: false },
                { role_name: 'Groom',           order_index: 1, is_core: true,  never_group: true,  is_group: false },
                { role_name: 'Best Man',        order_index: 2, is_core: true,  never_group: true,  is_group: false },
                { role_name: 'Maid of Honour',  order_index: 3, is_core: true,  never_group: true,  is_group: false },
                { role_name: 'Father of Bride', order_index: 4, is_core: false, never_group: true,  is_group: false },
                { role_name: 'Mother of Bride', order_index: 5, is_core: false, never_group: true,  is_group: false },
                { role_name: 'Father of Groom', order_index: 6, is_core: false, never_group: true,  is_group: false },
                { role_name: 'Mother of Groom', order_index: 7, is_core: false, never_group: true,  is_group: false },
                { role_name: 'Bridesmaids',     order_index: 8, is_core: false, never_group: false, is_group: true  },
                { role_name: 'Groomsmen',       order_index: 9, is_core: false, never_group: false, is_group: true  },
                { role_name: 'Flower Girl',     order_index: 10, is_core: false, never_group: true, is_group: false },
                { role_name: 'Ring Bearer',     order_index: 11, is_core: false, never_group: true, is_group: false },
                { role_name: 'Guests',          order_index: 12, is_core: false, never_group: false, is_group: true  },
            ];
            const weddingSubjectRoles: { id: number; is_core: boolean }[] = [];
            for (const roleData of weddingRolesData) {
                const role = await tx.subjectRole.create({ data: { brand_id: brandId, ...roleData } });
                weddingSubjectRoles.push({ id: role.id, is_core: roleData.is_core });
            }

            // 2. Event day templates with activity presets
            const days = await this.createWeddingDayTemplates(tx, brandId);

            // 3. Event type
            const eventType = await tx.eventType.create({
                data: {
                    brand_id: brandId,
                    name: 'Wedding',
                    description: 'Full wedding day coverage',
                    icon: '💒',
                    color: '#ec4899',
                    default_duration_hours: 10,
                    default_start_time: '08:00',
                    typical_guest_count: 150,
                    is_system: false,
                    is_active: true,
                    order_index: 0,
                },
            });

            // 4. EventTypeDay junctions (is_default for first 3)
            for (let i = 0; i < days.length; i++) {
                await tx.eventTypeDay.create({
                    data: {
                        event_type_id: eventType.id,
                        event_day_template_id: days[i].id,
                        order_index: i,
                        is_default: i < 3,
                    },
                });
            }

            // 5. EventTypeSubject junctions (one per subject role)
            for (let i = 0; i < weddingSubjectRoles.length; i++) {
                await tx.eventTypeSubject.create({
                    data: {
                        event_type_id: eventType.id,
                        subject_role_id: weddingSubjectRoles[i].id,
                        order_index: i,
                        is_default: weddingSubjectRoles[i].is_core,
                    },
                });
            }

            // 6. Package category (auto-linked via event_type_id)
            const category = await tx.service_package_categories.create({
                data: {
                    brand_id: brandId,
                    name: 'Wedding',
                    description: 'Wedding videography packages',
                    order_index: 0,
                    is_active: true,
                    event_type_id: eventType.id,
                },
            });

            // 7. Default package set
            const weddingSet = await tx.package_sets.create({
                data: {
                    brand_id: brandId,
                    name: 'Wedding Packages',
                    description: 'Our wedding videography packages',
                    emoji: '💒',
                    category_id: category.id,
                    event_type_id: eventType.id,
                    is_active: true,
                    order_index: 0,
                },
            });
            for (let i = 0; i < DEFAULT_SLOT_TIERS.length; i++) {
                await tx.package_set_slots.create({ data: { package_set_id: weddingSet.id, slot_label: DEFAULT_SLOT_TIERS[i], order_index: i } });
            }
        });
    }

    private async createWeddingDayTemplates(tx: Prisma.TransactionClient, brandId: number) {
        const templates = [
            {
                name: 'Pre-Wedding Day',
                description: 'Activities before the main event — rehearsal, welcome party, bridal prep',
                order_index: 0,
                presets: [
                    {
                        name: 'Rehearsal', color: '#8b5cf6', default_start_time: '15:00', default_duration_minutes: 60, order_index: 0,
                        moments: [
                            { name: 'Arrival & Setup',   duration_seconds: 600,  is_key_moment: false, order_index: 0 },
                            { name: 'Walk-Through',      duration_seconds: 1200, is_key_moment: true,  order_index: 1 },
                            { name: 'Practice Run',      duration_seconds: 1200, is_key_moment: true,  order_index: 2 },
                            { name: 'Final Notes',       duration_seconds: 600,  is_key_moment: false, order_index: 3 },
                        ],
                    },
                    {
                        name: 'Welcome Party', color: '#f97316', default_start_time: '17:00', default_duration_minutes: 120, order_index: 1,
                        moments: [
                            { name: 'Guest Arrival',    duration_seconds: 900,  is_key_moment: false, order_index: 0 },
                            { name: 'Welcome Drinks',   duration_seconds: 1800, is_key_moment: false, order_index: 1 },
                            { name: 'Mingling',         duration_seconds: 2400, is_key_moment: false, order_index: 2 },
                            { name: 'Short Speeches',   duration_seconds: 600,  is_key_moment: true,  order_index: 3 },
                        ],
                    },
                    {
                        name: 'Bridal Prep Shopping', color: '#ec4899', default_start_time: '10:00', default_duration_minutes: 90, order_index: 2,
                        moments: [
                            { name: 'Store Arrival',      duration_seconds: 300,  is_key_moment: false, order_index: 0 },
                            { name: 'Browsing',           duration_seconds: 3600, is_key_moment: false, order_index: 1 },
                            { name: 'Decision Moment',    duration_seconds: 600,  is_key_moment: true,  order_index: 2 },
                        ],
                    },
                    {
                        name: 'Mehndi / Henna', color: '#d946ef', default_start_time: '12:00', default_duration_minutes: 120, order_index: 3,
                        moments: [
                            { name: 'Henna Artist Begins', duration_seconds: 600,  is_key_moment: false, order_index: 0 },
                            { name: "Bride's Henna",       duration_seconds: 3600, is_key_moment: true,  order_index: 1 },
                            { name: 'Guest Henna',         duration_seconds: 2400, is_key_moment: false, order_index: 2 },
                            { name: 'Dancing',             duration_seconds: 1200, is_key_moment: true,  order_index: 3 },
                        ],
                    },
                    {
                        name: 'Rehearsal Dinner', color: '#14b8a6', default_start_time: '18:00', default_duration_minutes: 120, order_index: 4,
                        moments: [
                            { name: 'Guest Arrival & Drinks', duration_seconds: 900,  is_key_moment: false, order_index: 0 },
                            { name: 'Dinner Service',         duration_seconds: 3600, is_key_moment: false, order_index: 1 },
                            { name: 'Toasts',                 duration_seconds: 1200, is_key_moment: true,  order_index: 2 },
                            { name: 'Candid Moments',         duration_seconds: 900,  is_key_moment: false, order_index: 3 },
                        ],
                    },
                    {
                        name: 'Vendor Walk-Through', color: '#06b6d4', default_start_time: '11:00', default_duration_minutes: 60, order_index: 5,
                        moments: [
                            { name: 'Venue Tour',        duration_seconds: 1200, is_key_moment: false, order_index: 0 },
                            { name: 'Lighting Review',   duration_seconds: 900,  is_key_moment: false, order_index: 1 },
                            { name: 'Final Decisions',   duration_seconds: 600,  is_key_moment: false, order_index: 2 },
                        ],
                    },
                ],
            },
            {
                name: 'Getting Ready',
                description: 'Morning-of preparations — hair, makeup, suit-up, detail shots',
                order_index: 5,
                presets: [
                    {
                        name: 'Hair & Makeup', color: '#ec4899', default_start_time: '07:00', default_duration_minutes: 90, order_index: 0,
                        moments: [
                            { name: 'Makeup Application', duration_seconds: 2400, is_key_moment: false, order_index: 0 },
                            { name: 'Hair Styling',       duration_seconds: 2400, is_key_moment: false, order_index: 1 },
                            { name: 'Final Look Reveal',  duration_seconds: 300,  is_key_moment: true,  order_index: 2 },
                        ],
                    },
                    {
                        name: 'Suit-Up / Dressing', color: '#648CFF', default_start_time: '09:00', default_duration_minutes: 30, order_index: 1,
                        moments: [
                            { name: 'Shirt & Tie',   duration_seconds: 600, is_key_moment: false, order_index: 0 },
                            { name: 'Jacket On',     duration_seconds: 300, is_key_moment: true,  order_index: 1 },
                            { name: 'Final Check',   duration_seconds: 300, is_key_moment: false, order_index: 2 },
                        ],
                    },
                    {
                        name: 'Detail Shots', color: '#06b6d4', default_start_time: '08:30', default_duration_minutes: 30, order_index: 2,
                        moments: [
                            { name: 'Dress on Hanger',          duration_seconds: 300, is_key_moment: true,  order_index: 0 },
                            { name: 'Shoes & Accessories',      duration_seconds: 300, is_key_moment: false, order_index: 1 },
                            { name: 'Rings & Jewellery',        duration_seconds: 300, is_key_moment: true,  order_index: 2 },
                            { name: 'Perfume',                  duration_seconds: 180, is_key_moment: false, order_index: 3 },
                            { name: 'Stationery',               duration_seconds: 300, is_key_moment: false, order_index: 4 },
                        ],
                    },
                    {
                        name: 'Letters & Gifts', color: '#a855f7', default_start_time: '09:30', default_duration_minutes: 20, order_index: 3,
                        moments: [
                            { name: 'Reading Letters', duration_seconds: 600, is_key_moment: true, order_index: 0 },
                            { name: 'Gift Opening',    duration_seconds: 600, is_key_moment: true, order_index: 1 },
                        ],
                    },
                    {
                        name: 'First Reveal (Family)', color: '#10b981', default_start_time: '10:00', default_duration_minutes: 15, order_index: 4,
                        moments: [
                            { name: 'Parent Reveal Reaction', duration_seconds: 300, is_key_moment: true,  order_index: 0 },
                            { name: 'Family Embrace',         duration_seconds: 300, is_key_moment: true,  order_index: 1 },
                            { name: 'Quick Family Photo',     duration_seconds: 300, is_key_moment: false, order_index: 2 },
                        ],
                    },
                    {
                        name: 'Candid Prep Moments', color: '#f97316', default_start_time: '10:15', default_duration_minutes: 30, order_index: 5,
                        moments: [
                            { name: 'Friends Laughing',      duration_seconds: 600, is_key_moment: true,  order_index: 0 },
                            { name: 'Champagne Toast',        duration_seconds: 300, is_key_moment: true,  order_index: 1 },
                            { name: 'Nervous Excitement',     duration_seconds: 600, is_key_moment: false, order_index: 2 },
                        ],
                    },
                ],
            },
            {
                name: 'Wedding Day',
                description: 'The main event day — ceremony, reception, first look, portraits',
                order_index: 1,
                presets: [
                    {
                        name: 'Bridal Prep', color: '#ec4899', default_start_time: '08:00', default_duration_minutes: 120, order_index: 0,
                        moments: [
                            { name: 'Hair & Makeup',     duration_seconds: 3600, is_key_moment: false, order_index: 0 },
                            { name: 'Getting Dressed',   duration_seconds: 900,  is_key_moment: true,  order_index: 1 },
                            { name: 'Final Touches',     duration_seconds: 600,  is_key_moment: false, order_index: 2 },
                            { name: 'Father Reaction',   duration_seconds: 300,  is_key_moment: true,  order_index: 3 },
                            { name: 'Bridesmaids Prep',  duration_seconds: 600,  is_key_moment: false, order_index: 4 },
                        ],
                    },
                    {
                        name: 'Groom Prep', color: '#648CFF', default_start_time: '09:00', default_duration_minutes: 90, order_index: 1,
                        moments: [
                            { name: 'Getting Dressed',   duration_seconds: 900,  is_key_moment: false, order_index: 0 },
                            { name: 'Suit-Up & Tie',     duration_seconds: 600,  is_key_moment: true,  order_index: 1 },
                            { name: 'Groomsmen Candids', duration_seconds: 1200, is_key_moment: false, order_index: 2 },
                            { name: 'Gift/Letter',       duration_seconds: 600,  is_key_moment: true,  order_index: 3 },
                        ],
                    },
                    {
                        name: 'First Look', color: '#a855f7', default_start_time: '11:00', default_duration_minutes: 30, order_index: 2,
                        moments: [
                            { name: 'Setup & Anticipation',  duration_seconds: 300, is_key_moment: false, order_index: 0 },
                            { name: 'The Reveal',            duration_seconds: 180, is_key_moment: true,  order_index: 1 },
                            { name: "Couple's Reaction",     duration_seconds: 300, is_key_moment: true,  order_index: 2 },
                            { name: 'Quick Portraits',       duration_seconds: 600, is_key_moment: false, order_index: 3 },
                        ],
                    },
                    {
                        name: 'Ceremony', color: '#f59e0b', default_start_time: '13:00', default_duration_minutes: 60, order_index: 3,
                        moments: [
                            { name: 'Guest Seating',   duration_seconds: 600, is_key_moment: false, order_index: 0 },
                            { name: 'Processional',    duration_seconds: 300, is_key_moment: true,  order_index: 1 },
                            { name: 'Vows',            duration_seconds: 600, is_key_moment: true,  order_index: 2 },
                            { name: 'Ring Exchange',   duration_seconds: 180, is_key_moment: true,  order_index: 3 },
                            { name: 'First Kiss',      duration_seconds: 120, is_key_moment: true,  order_index: 4 },
                            { name: 'Recessional',     duration_seconds: 300, is_key_moment: true,  order_index: 5 },
                        ],
                    },
                    {
                        name: 'Family Portraits', color: '#10b981', default_start_time: '14:00', default_duration_minutes: 30, order_index: 4,
                        moments: [
                            { name: 'Immediate Family', duration_seconds: 600, is_key_moment: true,  order_index: 0 },
                            { name: 'Extended Family',  duration_seconds: 600, is_key_moment: false, order_index: 1 },
                            { name: 'Bridal Party',     duration_seconds: 600, is_key_moment: false, order_index: 2 },
                        ],
                    },
                    {
                        name: 'Couple Portraits', color: '#0ea5e9', default_start_time: '14:30', default_duration_minutes: 45, order_index: 5,
                        moments: [
                            { name: 'Location Walk',        duration_seconds: 300,  is_key_moment: false, order_index: 0 },
                            { name: 'Formal Portraits',     duration_seconds: 900,  is_key_moment: true,  order_index: 1 },
                            { name: 'Candid / Lifestyle',   duration_seconds: 900,  is_key_moment: false, order_index: 2 },
                            { name: 'Dramatic / Creative',  duration_seconds: 600,  is_key_moment: true,  order_index: 3 },
                        ],
                    },
                    {
                        name: 'Cocktail Hour', color: '#f97316', default_start_time: '15:15', default_duration_minutes: 60, order_index: 6,
                        moments: [
                            { name: 'Guest Mingling',        duration_seconds: 1800, is_key_moment: false, order_index: 0 },
                            { name: 'Canapés & Drinks',      duration_seconds: 1200, is_key_moment: false, order_index: 1 },
                            { name: 'Candid Guest Moments',  duration_seconds: 600,  is_key_moment: false, order_index: 2 },
                        ],
                    },
                    {
                        name: 'Reception', color: '#14b8a6', default_start_time: '16:30', default_duration_minutes: 180, order_index: 7,
                        moments: [
                            { name: 'Grand Entrance',    duration_seconds: 300,  is_key_moment: true,  order_index: 0 },
                            { name: 'Welcome & Seating', duration_seconds: 600,  is_key_moment: false, order_index: 1 },
                            { name: 'Dinner Service',    duration_seconds: 3600, is_key_moment: false, order_index: 2 },
                            { name: 'Table Candids',     duration_seconds: 1200, is_key_moment: false, order_index: 3 },
                        ],
                    },
                    {
                        name: 'First Dance', color: '#d946ef', default_start_time: '19:30', default_duration_minutes: 10, order_index: 8,
                        moments: [
                            { name: 'First Dance',   duration_seconds: 240, is_key_moment: true, order_index: 0 },
                            { name: 'Parent Dances', duration_seconds: 360, is_key_moment: true, order_index: 1 },
                        ],
                    },
                    {
                        name: 'Speeches & Toasts', color: '#8b5cf6', default_start_time: '17:30', default_duration_minutes: 45, order_index: 9,
                        moments: [
                            { name: 'Best Man Speech',           duration_seconds: 600, is_key_moment: true,  order_index: 0 },
                            { name: 'Father of Bride Speech',    duration_seconds: 600, is_key_moment: true,  order_index: 1 },
                            { name: 'Groom / Couple Speech',     duration_seconds: 600, is_key_moment: true,  order_index: 2 },
                            { name: 'MoH Speech',                duration_seconds: 480, is_key_moment: false, order_index: 3 },
                        ],
                    },
                    {
                        name: 'Detail Shots', color: '#06b6d4', default_start_time: '10:30', default_duration_minutes: 30, order_index: 10,
                        moments: [
                            { name: 'Rings & Jewellery', duration_seconds: 300, is_key_moment: true,  order_index: 0 },
                            { name: 'Flowers & Bouquet', duration_seconds: 300, is_key_moment: false, order_index: 1 },
                            { name: 'Table Settings',    duration_seconds: 600, is_key_moment: false, order_index: 2 },
                            { name: 'Stationery',        duration_seconds: 300, is_key_moment: false, order_index: 3 },
                        ],
                    },
                    {
                        name: 'Send Off', color: '#ef4444', default_start_time: '21:00', default_duration_minutes: 15, order_index: 11,
                        moments: [
                            { name: 'Sparkler / Confetti Line', duration_seconds: 300, is_key_moment: true,  order_index: 0 },
                            { name: 'Couple Exit',              duration_seconds: 300, is_key_moment: true,  order_index: 1 },
                            { name: 'Getaway Car',              duration_seconds: 180, is_key_moment: false, order_index: 2 },
                        ],
                    },
                ],
            },
            {
                name: 'Day After Session',
                description: 'Post-wedding creative shoot — trash the dress, golden hour, drone',
                order_index: 2,
                presets: [
                    {
                        name: 'Trash the Dress', color: '#ec4899', default_start_time: '10:00', default_duration_minutes: 60, order_index: 0,
                        moments: [
                            { name: 'Location Arrival',          duration_seconds: 300,  is_key_moment: false, order_index: 0 },
                            { name: 'Creative Shots',            duration_seconds: 1800, is_key_moment: true,  order_index: 1 },
                            { name: 'Water / Nature Sequence',   duration_seconds: 1200, is_key_moment: true,  order_index: 2 },
                        ],
                    },
                    {
                        name: 'Couples Portraits', color: '#0ea5e9', default_start_time: '11:00', default_duration_minutes: 60, order_index: 1,
                        moments: [
                            { name: 'Scenic Walk',           duration_seconds: 600,  is_key_moment: false, order_index: 0 },
                            { name: 'Candid & Lifestyle',    duration_seconds: 1200, is_key_moment: true,  order_index: 1 },
                            { name: 'Formal Portraits',      duration_seconds: 900,  is_key_moment: false, order_index: 2 },
                        ],
                    },
                    {
                        name: 'Drone Aerials', color: '#648CFF', default_start_time: '12:00', default_duration_minutes: 45, order_index: 2,
                        moments: [
                            { name: 'Equipment Setup',       duration_seconds: 300,  is_key_moment: false, order_index: 0 },
                            { name: 'Wide Landscape',        duration_seconds: 900,  is_key_moment: true,  order_index: 1 },
                            { name: 'Couple in Landscape',   duration_seconds: 900,  is_key_moment: true,  order_index: 2 },
                            { name: 'Fly-Overs',             duration_seconds: 600,  is_key_moment: false, order_index: 3 },
                        ],
                    },
                    {
                        name: 'Beach / Nature Walk', color: '#10b981', default_start_time: '14:00', default_duration_minutes: 60, order_index: 3,
                        moments: [
                            { name: 'Walking Shots',     duration_seconds: 900,  is_key_moment: false, order_index: 0 },
                            { name: 'Seaside Poses',     duration_seconds: 1200, is_key_moment: true,  order_index: 1 },
                            { name: 'Playful Candids',   duration_seconds: 900,  is_key_moment: false, order_index: 2 },
                        ],
                    },
                    {
                        name: 'Golden Hour Session', color: '#f59e0b', default_start_time: '17:30', default_duration_minutes: 45, order_index: 4,
                        moments: [
                            { name: 'Warm Light Portraits', duration_seconds: 1200, is_key_moment: true,  order_index: 0 },
                            { name: 'Silhouette Shots',     duration_seconds: 600,  is_key_moment: true,  order_index: 1 },
                            { name: 'Final Embrace',        duration_seconds: 300,  is_key_moment: true,  order_index: 2 },
                        ],
                    },
                ],
            },
            {
                name: 'Engagement Session',
                description: 'Pre-wedding couple shoot — portraits, lifestyle, golden hour',
                order_index: 3,
                presets: [
                    {
                        name: 'Location Portraits', color: '#0ea5e9', default_start_time: '15:00', default_duration_minutes: 60, order_index: 0,
                        moments: [
                            { name: 'Arrival & Settling In',  duration_seconds: 300, is_key_moment: false, order_index: 0 },
                            { name: 'Formal Poses',           duration_seconds: 900, is_key_moment: false, order_index: 1 },
                            { name: 'Walking Together',       duration_seconds: 600, is_key_moment: true,  order_index: 2 },
                            { name: 'Close-Up Portraits',     duration_seconds: 900, is_key_moment: true,  order_index: 3 },
                        ],
                    },
                    {
                        name: 'Lifestyle Footage', color: '#10b981', default_start_time: '16:00', default_duration_minutes: 45, order_index: 1,
                        moments: [
                            { name: 'Casual Candids',    duration_seconds: 900, is_key_moment: false, order_index: 0 },
                            { name: 'Activity Together', duration_seconds: 900, is_key_moment: true,  order_index: 1 },
                            { name: 'Laughter',          duration_seconds: 600, is_key_moment: true,  order_index: 2 },
                        ],
                    },
                    {
                        name: 'Interview / Vows Read', color: '#8b5cf6', default_start_time: '16:45', default_duration_minutes: 30, order_index: 2,
                        moments: [
                            { name: 'How We Met',      duration_seconds: 600, is_key_moment: true, order_index: 0 },
                            { name: 'Proposal Story',  duration_seconds: 600, is_key_moment: true, order_index: 1 },
                            { name: 'Vow Reading',     duration_seconds: 480, is_key_moment: true, order_index: 2 },
                        ],
                    },
                    {
                        name: 'Outfit Change', color: '#ec4899', default_start_time: '17:15', default_duration_minutes: 15, order_index: 3,
                        moments: [
                            { name: 'Quick Change',       duration_seconds: 600, is_key_moment: false, order_index: 0 },
                            { name: 'Fresh Look Reveal',  duration_seconds: 300, is_key_moment: true,  order_index: 1 },
                        ],
                    },
                    {
                        name: 'Golden Hour', color: '#f59e0b', default_start_time: '17:30', default_duration_minutes: 45, order_index: 4,
                        moments: [
                            { name: 'Warm Light Portraits', duration_seconds: 1200, is_key_moment: true,  order_index: 0 },
                            { name: 'Silhouette Shots',     duration_seconds: 600,  is_key_moment: true,  order_index: 1 },
                            { name: 'Final Moments',        duration_seconds: 600,  is_key_moment: false, order_index: 2 },
                        ],
                    },
                    {
                        name: 'Detail Shots', color: '#06b6d4', default_start_time: '15:30', default_duration_minutes: 20, order_index: 5,
                        moments: [
                            { name: 'Ring Close-Ups',    duration_seconds: 300, is_key_moment: true,  order_index: 0 },
                            { name: 'Outfit Details',    duration_seconds: 300, is_key_moment: false, order_index: 1 },
                            { name: 'Personal Items',    duration_seconds: 300, is_key_moment: false, order_index: 2 },
                        ],
                    },
                ],
            },
            {
                name: 'Rehearsal Dinner',
                description: 'Evening before the wedding — dinner, toasts, and gathering',
                order_index: 4,
                presets: [
                    {
                        name: 'Welcome Drinks', color: '#f97316', default_start_time: '17:00', default_duration_minutes: 45, order_index: 0,
                        moments: [
                            { name: 'Guest Arrival',       duration_seconds: 600,  is_key_moment: false, order_index: 0 },
                            { name: 'Drinks & Mingling',   duration_seconds: 1800, is_key_moment: false, order_index: 1 },
                            { name: 'Candid Group',        duration_seconds: 600,  is_key_moment: false, order_index: 2 },
                        ],
                    },
                    {
                        name: 'Rehearsal Walk-Through', color: '#8b5cf6', default_start_time: '15:30', default_duration_minutes: 30, order_index: 1,
                        moments: [
                            { name: 'Venue Walk-Through',   duration_seconds: 900, is_key_moment: true,  order_index: 0 },
                            { name: 'Practice Processional', duration_seconds: 600, is_key_moment: false, order_index: 1 },
                            { name: 'Final Notes',          duration_seconds: 300, is_key_moment: false, order_index: 2 },
                        ],
                    },
                    {
                        name: 'Dinner', color: '#14b8a6', default_start_time: '18:00', default_duration_minutes: 90, order_index: 2,
                        moments: [
                            { name: 'Table Seating',   duration_seconds: 600,  is_key_moment: false, order_index: 0 },
                            { name: 'Dinner Service',  duration_seconds: 3600, is_key_moment: false, order_index: 1 },
                            { name: 'Table Candids',   duration_seconds: 900,  is_key_moment: false, order_index: 2 },
                        ],
                    },
                    {
                        name: 'Toasts & Speeches', color: '#a855f7', default_start_time: '19:30', default_duration_minutes: 30, order_index: 3,
                        moments: [
                            { name: 'Welcome Toast',      duration_seconds: 300, is_key_moment: true,  order_index: 0 },
                            { name: 'Family Speeches',    duration_seconds: 900, is_key_moment: true,  order_index: 1 },
                            { name: 'Emotional Moments',  duration_seconds: 300, is_key_moment: true,  order_index: 2 },
                        ],
                    },
                    {
                        name: 'Candid Moments', color: '#0ea5e9', default_start_time: '20:00', default_duration_minutes: 30, order_index: 4,
                        moments: [
                            { name: 'Friends Catching Up',  duration_seconds: 600, is_key_moment: false, order_index: 0 },
                            { name: 'Laughter & Stories',   duration_seconds: 600, is_key_moment: true,  order_index: 1 },
                            { name: 'End of Night Hugs',    duration_seconds: 300, is_key_moment: false, order_index: 2 },
                        ],
                    },
                ],
            },
            {
                name: 'Welcome Party',
                description: 'Pre-wedding celebration — cocktails, entertainment, guest interactions',
                order_index: 6,
                presets: [
                    {
                        name: 'Cocktail Reception', color: '#f97316', default_start_time: '17:00', default_duration_minutes: 60, order_index: 0,
                        moments: [
                            { name: 'First Guests Arrive',   duration_seconds: 600,  is_key_moment: false, order_index: 0 },
                            { name: 'Drinks & Canapés',      duration_seconds: 1800, is_key_moment: false, order_index: 1 },
                            { name: 'Mingling Wide Shots',   duration_seconds: 900,  is_key_moment: false, order_index: 2 },
                        ],
                    },
                    {
                        name: 'Meet & Greet', color: '#10b981', default_start_time: '18:00', default_duration_minutes: 45, order_index: 1,
                        moments: [
                            { name: 'Couple Greeting Guests',  duration_seconds: 1200, is_key_moment: true,  order_index: 0 },
                            { name: 'First-Time Meetings',     duration_seconds: 900,  is_key_moment: false, order_index: 1 },
                            { name: 'Group Candids',           duration_seconds: 600,  is_key_moment: false, order_index: 2 },
                        ],
                    },
                    {
                        name: 'Live Entertainment', color: '#d946ef', default_start_time: '19:00', default_duration_minutes: 60, order_index: 2,
                        moments: [
                            { name: 'Performance Start',  duration_seconds: 300,  is_key_moment: true,  order_index: 0 },
                            { name: 'Crowd Reactions',    duration_seconds: 1200, is_key_moment: false, order_index: 1 },
                            { name: 'Dancing',            duration_seconds: 1800, is_key_moment: true,  order_index: 2 },
                        ],
                    },
                    {
                        name: 'Guest Interviews', color: '#8b5cf6', default_start_time: '18:45', default_duration_minutes: 30, order_index: 3,
                        moments: [
                            { name: 'Best Wishes Messages', duration_seconds: 900, is_key_moment: true,  order_index: 0 },
                            { name: 'Funny Stories',        duration_seconds: 600, is_key_moment: true,  order_index: 1 },
                            { name: 'Advice for Couple',    duration_seconds: 300, is_key_moment: false, order_index: 2 },
                        ],
                    },
                    {
                        name: 'Casual Group Photos', color: '#0ea5e9', default_start_time: '20:00', default_duration_minutes: 30, order_index: 4,
                        moments: [
                            { name: 'Friend Group Shots',   duration_seconds: 600, is_key_moment: false, order_index: 0 },
                            { name: 'Family Groups',        duration_seconds: 600, is_key_moment: true,  order_index: 1 },
                            { name: 'Full Party Photo',     duration_seconds: 300, is_key_moment: true,  order_index: 2 },
                        ],
                    },
                ],
            },
        ];

        const created: { id: number }[] = [];
        for (const tpl of templates) {
            const { presets, ...dayData } = tpl;
            const existing = await tx.eventDay.findFirst({ where: { brand_id: brandId, name: dayData.name } });
            if (existing) { created.push(existing); continue; }
            const day = await tx.eventDay.create({
                data: {
                    brand_id: brandId,
                    name: dayData.name,
                    description: dayData.description,
                    order_index: dayData.order_index,
                    is_active: true,
                    activity_presets: {
                        create: presets.map(({ moments, ...p }) => ({
                            ...p,
                            is_active: true,
                            moments: { create: moments },
                        })),
                    },
                },
            });
            created.push(day);
        }
        return created;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // BIRTHDAY
    // ─────────────────────────────────────────────────────────────────────────

    private async provisionBirthday(brandId: number) {
        await this.prisma.$transaction(async (tx) => {
            const birthdayRolesData = [
                { role_name: 'Birthday Person', order_index: 0, is_core: true,  never_group: true,  is_group: false },
                { role_name: 'Partner',         order_index: 1, is_core: true,  never_group: true,  is_group: false },
                { role_name: 'Parents',         order_index: 2, is_core: false, never_group: false, is_group: true  },
                { role_name: 'Close Friends',   order_index: 3, is_core: false, never_group: false, is_group: true  },
                { role_name: 'Guests',          order_index: 4, is_core: false, never_group: false, is_group: true  },
            ];
            const birthdaySubjectRoles: { id: number; is_core: boolean }[] = [];
            for (const roleData of birthdayRolesData) {
                const role = await tx.subjectRole.create({ data: { brand_id: brandId, ...roleData } });
                birthdaySubjectRoles.push({ id: role.id, is_core: roleData.is_core });
            }

            const days = await this.createBirthdayDayTemplates(tx, brandId);

            const eventType = await tx.eventType.create({
                data: {
                    brand_id: brandId,
                    name: 'Birthday',
                    description: 'Birthday party and celebration coverage',
                    icon: '🎂',
                    color: '#f59e0b',
                    default_duration_hours: 5,
                    default_start_time: '16:00',
                    typical_guest_count: 50,
                    is_system: false,
                    is_active: true,
                    order_index: 1,
                },
            });

            for (let i = 0; i < days.length; i++) {
                await tx.eventTypeDay.create({
                    data: {
                        event_type_id: eventType.id,
                        event_day_template_id: days[i].id,
                        order_index: i,
                        is_default: i === 0,
                    },
                });
            }

            for (let i = 0; i < birthdaySubjectRoles.length; i++) {
                await tx.eventTypeSubject.create({
                    data: {
                        event_type_id: eventType.id,
                        subject_role_id: birthdaySubjectRoles[i].id,
                        order_index: i,
                        is_default: birthdaySubjectRoles[i].is_core,
                    },
                });
            }

            const category = await tx.service_package_categories.create({
                data: {
                    brand_id: brandId,
                    name: 'Birthday',
                    description: 'Birthday videography packages',
                    order_index: 1,
                    is_active: true,
                    event_type_id: eventType.id,
                },
            });

            const birthdaySet = await tx.package_sets.create({
                data: {
                    brand_id: brandId,
                    name: 'Birthday Packages',
                    description: 'Our birthday celebration packages',
                    emoji: '🎂',
                    category_id: category.id,
                    event_type_id: eventType.id,
                    is_active: true,
                    order_index: 1,
                },
            });
            for (let i = 0; i < DEFAULT_SLOT_TIERS.length; i++) {
                await tx.package_set_slots.create({ data: { package_set_id: birthdaySet.id, slot_label: DEFAULT_SLOT_TIERS[i], order_index: i } });
            }
        });
    }

    private async createBirthdayDayTemplates(tx: Prisma.TransactionClient, brandId: number) {
        const templates = [
            {
                name: 'Birthday Day',
                description: 'The main birthday party — arrival, cake, speeches, dancing',
                order_index: 0,
                presets: [
                    {
                        name: 'Guest Arrival & Drinks', color: '#f97316', default_start_time: '16:00', default_duration_minutes: 45, order_index: 0,
                        moments: [
                            { name: 'First Guests Arrive',   duration_seconds: 600,  is_key_moment: false, order_index: 0 },
                            { name: 'Welcome Drinks',        duration_seconds: 1200, is_key_moment: false, order_index: 1 },
                            { name: 'Mingling',              duration_seconds: 1800, is_key_moment: false, order_index: 2 },
                        ],
                    },
                    {
                        name: 'Cake & Candles', color: '#ec4899', default_start_time: '18:00', default_duration_minutes: 20, order_index: 1,
                        moments: [
                            { name: 'Candle Lighting',        duration_seconds: 300, is_key_moment: false, order_index: 0 },
                            { name: 'Happy Birthday Singing', duration_seconds: 120, is_key_moment: true,  order_index: 1 },
                            { name: 'Blowing Out Candles',    duration_seconds: 60,  is_key_moment: true,  order_index: 2 },
                            { name: 'Cake Cutting',           duration_seconds: 300, is_key_moment: true,  order_index: 3 },
                        ],
                    },
                    {
                        name: 'Speeches & Toasts', color: '#8b5cf6', default_start_time: '18:30', default_duration_minutes: 30, order_index: 2,
                        moments: [
                            { name: 'Welcome Speech',         duration_seconds: 300, is_key_moment: false, order_index: 0 },
                            { name: 'Heartfelt Messages',     duration_seconds: 900, is_key_moment: true,  order_index: 1 },
                            { name: 'Birthday Tribute',       duration_seconds: 600, is_key_moment: true,  order_index: 2 },
                        ],
                    },
                    {
                        name: 'Emotional Reactions', color: '#14b8a6', default_start_time: '18:30', default_duration_minutes: 20, order_index: 3,
                        moments: [
                            { name: 'Genuine Reactions',          duration_seconds: 600, is_key_moment: true,  order_index: 0 },
                            { name: 'Hugs & Congratulations',     duration_seconds: 600, is_key_moment: true,  order_index: 1 },
                        ],
                    },
                    {
                        name: 'Group Dancing', color: '#d946ef', default_start_time: '19:30', default_duration_minutes: 60, order_index: 4,
                        moments: [
                            { name: 'First Dance Moment',  duration_seconds: 300,  is_key_moment: true,  order_index: 0 },
                            { name: 'Floor Fills',         duration_seconds: 1800, is_key_moment: true,  order_index: 1 },
                            { name: 'Candid Dance Moments', duration_seconds: 900, is_key_moment: false, order_index: 2 },
                        ],
                    },
                    {
                        name: 'Candid Party Coverage', color: '#0ea5e9', default_start_time: '17:00', default_duration_minutes: 90, order_index: 5,
                        moments: [
                            { name: 'Table Candids',       duration_seconds: 1200, is_key_moment: false, order_index: 0 },
                            { name: 'Friend Group Shots',  duration_seconds: 900,  is_key_moment: false, order_index: 1 },
                            { name: 'General Atmosphere',  duration_seconds: 1800, is_key_moment: false, order_index: 2 },
                        ],
                    },
                    {
                        name: 'Departure & Send Off', color: '#10b981', default_start_time: '22:00', default_duration_minutes: 20, order_index: 6,
                        moments: [
                            { name: 'End of Night',       duration_seconds: 600, is_key_moment: false, order_index: 0 },
                            { name: 'Final Group Photo',  duration_seconds: 300, is_key_moment: true,  order_index: 1 },
                            { name: 'Birthday Person Departs', duration_seconds: 300, is_key_moment: true, order_index: 2 },
                        ],
                    },
                ],
            },
            {
                name: 'Pre-Party Setup',
                description: 'Venue decoration and supplier arrivals before guests arrive',
                order_index: 1,
                presets: [
                    {
                        name: 'Venue Decoration', color: '#f59e0b', default_start_time: '12:00', default_duration_minutes: 90, order_index: 0,
                        moments: [
                            { name: 'Setting Up',              duration_seconds: 1800, is_key_moment: false, order_index: 0 },
                            { name: 'Venue Transformation',    duration_seconds: 1200, is_key_moment: true,  order_index: 1 },
                        ],
                    },
                    {
                        name: 'Supplier Arrivals', color: '#06b6d4', default_start_time: '14:00', default_duration_minutes: 60, order_index: 1,
                        moments: [
                            { name: 'Florist / Decorator Arrives', duration_seconds: 600,  is_key_moment: false, order_index: 0 },
                            { name: 'Catering Setup',              duration_seconds: 1800, is_key_moment: false, order_index: 1 },
                            { name: 'Lighting Check',              duration_seconds: 600,  is_key_moment: false, order_index: 2 },
                        ],
                    },
                    {
                        name: 'Final Walk-Through', color: '#8b5cf6', default_start_time: '15:30', default_duration_minutes: 30, order_index: 2,
                        moments: [
                            { name: 'Venue Inspection',    duration_seconds: 900, is_key_moment: true,  order_index: 0 },
                            { name: 'Table Settings Shot', duration_seconds: 600, is_key_moment: false, order_index: 1 },
                        ],
                    },
                ],
            },
            {
                name: 'After Party',
                description: 'Continuation with close friends after the main event',
                order_index: 2,
                presets: [
                    {
                        name: 'Small Group Candids', color: '#10b981', default_start_time: '22:30', default_duration_minutes: 45, order_index: 0,
                        moments: [
                            { name: 'Close Circle Winding Down', duration_seconds: 1200, is_key_moment: false, order_index: 0 },
                            { name: 'Candid Conversations',      duration_seconds: 900,  is_key_moment: false, order_index: 1 },
                        ],
                    },
                    {
                        name: 'Final Moments', color: '#ec4899', default_start_time: '23:30', default_duration_minutes: 20, order_index: 1,
                        moments: [
                            { name: 'Last Shots',    duration_seconds: 600, is_key_moment: false, order_index: 0 },
                            { name: 'Farewell Hugs', duration_seconds: 300, is_key_moment: true,  order_index: 1 },
                        ],
                    },
                ],
            },
        ];

        const created: { id: number }[] = [];
        for (const tpl of templates) {
            const { presets, ...dayData } = tpl;
            const existing = await tx.eventDay.findFirst({ where: { brand_id: brandId, name: dayData.name } });
            if (existing) { created.push(existing); continue; }
            const day = await tx.eventDay.create({
                data: {
                    brand_id: brandId,
                    name: dayData.name,
                    description: dayData.description,
                    order_index: dayData.order_index,
                    is_active: true,
                    activity_presets: {
                        create: presets.map(({ moments, ...p }) => ({
                            ...p,
                            is_active: true,
                            moments: { create: moments },
                        })),
                    },
                },
            });
            created.push(day);
        }
        return created;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ENGAGEMENT
    // ─────────────────────────────────────────────────────────────────────────

    private async provisionEngagement(brandId: number) {
        await this.prisma.$transaction(async (tx) => {
            const engagementRolesData = [
                { role_name: 'Partner 1', order_index: 0, is_core: true,  never_group: true,  is_group: false },
                { role_name: 'Partner 2', order_index: 1, is_core: true,  never_group: true,  is_group: false },
                { role_name: 'Friends',   order_index: 2, is_core: false, never_group: false, is_group: true  },
                { role_name: 'Family',    order_index: 3, is_core: false, never_group: false, is_group: true  },
            ];
            const engagementSubjectRoles: { id: number; is_core: boolean }[] = [];
            for (const roleData of engagementRolesData) {
                const role = await tx.subjectRole.create({ data: { brand_id: brandId, ...roleData } });
                engagementSubjectRoles.push({ id: role.id, is_core: roleData.is_core });
            }

            const days = await this.createEngagementDayTemplates(tx, brandId);

            const eventType = await tx.eventType.create({
                data: {
                    brand_id: brandId,
                    name: 'Engagement',
                    description: 'Engagement shoots and celebration coverage',
                    icon: '💍',
                    color: '#8b5cf6',
                    default_duration_hours: 4,
                    default_start_time: '14:00',
                    typical_guest_count: 30,
                    is_system: false,
                    is_active: true,
                    order_index: 2,
                },
            });

            for (let i = 0; i < days.length; i++) {
                await tx.eventTypeDay.create({
                    data: {
                        event_type_id: eventType.id,
                        event_day_template_id: days[i].id,
                        order_index: i,
                        is_default: i === 0,
                    },
                });
            }

            for (let i = 0; i < engagementSubjectRoles.length; i++) {
                await tx.eventTypeSubject.create({
                    data: {
                        event_type_id: eventType.id,
                        subject_role_id: engagementSubjectRoles[i].id,
                        order_index: i,
                        is_default: engagementSubjectRoles[i].is_core,
                    },
                });
            }

            const category = await tx.service_package_categories.create({
                data: {
                    brand_id: brandId,
                    name: 'Engagement',
                    description: 'Engagement videography packages',
                    order_index: 2,
                    is_active: true,
                    event_type_id: eventType.id,
                },
            });

            const engagementSet = await tx.package_sets.create({
                data: {
                    brand_id: brandId,
                    name: 'Engagement Packages',
                    description: 'Our engagement photography & videography packages',
                    emoji: '💍',
                    category_id: category.id,
                    event_type_id: eventType.id,
                    is_active: true,
                    order_index: 2,
                },
            });
            for (let i = 0; i < DEFAULT_SLOT_TIERS.length; i++) {
                await tx.package_set_slots.create({ data: { package_set_id: engagementSet.id, slot_label: DEFAULT_SLOT_TIERS[i], order_index: i } });
            }
        });
    }

    private async createEngagementDayTemplates(tx: Prisma.TransactionClient, brandId: number) {
        const templates = [
            {
                name: 'Engagement Portrait Session',
                description: 'Couple portrait session — lifestyle, golden hour, detail shots',
                order_index: 0,
                presets: [
                    {
                        name: 'Location Portraits', color: '#0ea5e9', default_start_time: '15:00', default_duration_minutes: 60, order_index: 0,
                        moments: [
                            { name: 'Arrival & Settling In', duration_seconds: 300, is_key_moment: false, order_index: 0 },
                            { name: 'Formal Poses',          duration_seconds: 900, is_key_moment: false, order_index: 1 },
                            { name: 'Walking Together',      duration_seconds: 600, is_key_moment: true,  order_index: 2 },
                            { name: 'Close-Up Portraits',    duration_seconds: 900, is_key_moment: true,  order_index: 3 },
                        ],
                    },
                    {
                        name: 'Lifestyle Footage', color: '#10b981', default_start_time: '16:00', default_duration_minutes: 45, order_index: 1,
                        moments: [
                            { name: 'Casual Candids',    duration_seconds: 900, is_key_moment: false, order_index: 0 },
                            { name: 'Activity Together', duration_seconds: 900, is_key_moment: true,  order_index: 1 },
                            { name: 'Laughter',          duration_seconds: 600, is_key_moment: true,  order_index: 2 },
                        ],
                    },
                    {
                        name: 'Interview / Story', color: '#8b5cf6', default_start_time: '16:45', default_duration_minutes: 30, order_index: 2,
                        moments: [
                            { name: 'How We Met',      duration_seconds: 600, is_key_moment: true, order_index: 0 },
                            { name: 'Proposal Story',  duration_seconds: 600, is_key_moment: true, order_index: 1 },
                            { name: 'Future Plans',    duration_seconds: 480, is_key_moment: true, order_index: 2 },
                        ],
                    },
                    {
                        name: 'Golden Hour', color: '#f59e0b', default_start_time: '17:30', default_duration_minutes: 45, order_index: 3,
                        moments: [
                            { name: 'Warm Light Portraits', duration_seconds: 1200, is_key_moment: true,  order_index: 0 },
                            { name: 'Silhouette Shots',     duration_seconds: 600,  is_key_moment: true,  order_index: 1 },
                            { name: 'Final Moments',        duration_seconds: 600,  is_key_moment: false, order_index: 2 },
                        ],
                    },
                    {
                        name: 'Ring & Detail Shots', color: '#ec4899', default_start_time: '15:30', default_duration_minutes: 20, order_index: 4,
                        moments: [
                            { name: 'Ring Close-Ups',    duration_seconds: 300, is_key_moment: true,  order_index: 0 },
                            { name: 'Outfit Details',    duration_seconds: 300, is_key_moment: false, order_index: 1 },
                            { name: 'Personal Items',    duration_seconds: 300, is_key_moment: false, order_index: 2 },
                        ],
                    },
                ],
            },
            {
                name: 'Engagement Party',
                description: 'Celebration gathering with friends and family',
                order_index: 1,
                presets: [
                    {
                        name: 'Guest Arrival & Drinks', color: '#f97316', default_start_time: '17:00', default_duration_minutes: 45, order_index: 0,
                        moments: [
                            { name: 'Welcome Atmosphere',      duration_seconds: 600,  is_key_moment: false, order_index: 0 },
                            { name: 'Couple Greets Guests',    duration_seconds: 1200, is_key_moment: true,  order_index: 1 },
                        ],
                    },
                    {
                        name: 'Couple Entrance', color: '#8b5cf6', default_start_time: '18:00', default_duration_minutes: 15, order_index: 1,
                        moments: [
                            { name: 'Formal Announcement',  duration_seconds: 120, is_key_moment: true, order_index: 0 },
                            { name: 'Crowd Reaction',       duration_seconds: 300, is_key_moment: true, order_index: 1 },
                        ],
                    },
                    {
                        name: 'Speeches & Toasts', color: '#a855f7', default_start_time: '18:30', default_duration_minutes: 30, order_index: 2,
                        moments: [
                            { name: 'Parents & Friends Toast', duration_seconds: 900, is_key_moment: true,  order_index: 0 },
                            { name: 'Couple Speech',           duration_seconds: 600, is_key_moment: true,  order_index: 1 },
                        ],
                    },
                    {
                        name: 'Dinner & Candids', color: '#14b8a6', default_start_time: '19:00', default_duration_minutes: 90, order_index: 3,
                        moments: [
                            { name: 'Food Service',        duration_seconds: 2400, is_key_moment: false, order_index: 0 },
                            { name: 'Table Candids',       duration_seconds: 900,  is_key_moment: false, order_index: 1 },
                            { name: 'Genuine Laughter',    duration_seconds: 600,  is_key_moment: true,  order_index: 2 },
                        ],
                    },
                    {
                        name: 'Dancing & Send Off', color: '#d946ef', default_start_time: '21:00', default_duration_minutes: 45, order_index: 4,
                        moments: [
                            { name: 'Casual Dancing',   duration_seconds: 1800, is_key_moment: false, order_index: 0 },
                            { name: 'Final Embrace',    duration_seconds: 300,  is_key_moment: true,  order_index: 1 },
                        ],
                    },
                ],
            },
            {
                name: 'Proposal Re-enactment',
                description: 'Creative re-capture of the proposal moment',
                order_index: 2,
                presets: [
                    {
                        name: 'Setting the Scene', color: '#0ea5e9', default_start_time: '14:00', default_duration_minutes: 30, order_index: 0,
                        moments: [
                            { name: 'Location Staging',      duration_seconds: 900, is_key_moment: false, order_index: 0 },
                            { name: 'Nervous Anticipation',  duration_seconds: 600, is_key_moment: true,  order_index: 1 },
                        ],
                    },
                    {
                        name: 'The Proposal', color: '#ec4899', default_start_time: '14:30', default_duration_minutes: 15, order_index: 1,
                        moments: [
                            { name: 'Getting Down on One Knee', duration_seconds: 60,  is_key_moment: true, order_index: 0 },
                            { name: 'Ring Reveal',              duration_seconds: 120, is_key_moment: true, order_index: 1 },
                            { name: 'Reaction',                 duration_seconds: 300, is_key_moment: true, order_index: 2 },
                        ],
                    },
                    {
                        name: 'Celebration Shots', color: '#f59e0b', default_start_time: '14:45', default_duration_minutes: 30, order_index: 2,
                        moments: [
                            { name: 'Couple Embracing', duration_seconds: 600, is_key_moment: true,  order_index: 0 },
                            { name: 'Happy Tears',      duration_seconds: 300, is_key_moment: true,  order_index: 1 },
                            { name: 'Ring On Finger',   duration_seconds: 300, is_key_moment: true,  order_index: 2 },
                        ],
                    },
                ],
            },
        ];

        const created: { id: number }[] = [];
        for (const tpl of templates) {
            const { presets, ...dayData } = tpl;
            const existing = await tx.eventDay.findFirst({ where: { brand_id: brandId, name: dayData.name } });
            if (existing) { created.push(existing); continue; }
            const day = await tx.eventDay.create({
                data: {
                    brand_id: brandId,
                    name: dayData.name,
                    description: dayData.description,
                    order_index: dayData.order_index,
                    is_active: true,
                    activity_presets: {
                        create: presets.map(({ moments, ...p }) => ({
                            ...p,
                            is_active: true,
                            moments: { create: moments },
                        })),
                    },
                },
            });
            created.push(day);
        }
        return created;
    }
}
