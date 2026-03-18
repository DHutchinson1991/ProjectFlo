-- Create wedding_types table
CREATE TABLE "wedding_types" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "brand_id" INTEGER,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "total_duration_hours" INTEGER NOT NULL,
    "event_start_time" TEXT NOT NULL,
    "typical_guest_count" INTEGER,
    "is_system_seeded" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "wedding_types_brand_id_name_key" UNIQUE("brand_id", "name"),
    CONSTRAINT "wedding_types_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands" ("id") ON DELETE CASCADE
);

-- Create wedding_type_activities table
CREATE TABLE "wedding_type_activities" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "wedding_type_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "color" TEXT,
    "duration_minutes" INTEGER NOT NULL,
    "start_time_offset_minutes" INTEGER NOT NULL,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "wedding_type_activities_wedding_type_id_order_index_key" UNIQUE("wedding_type_id", "order_index"),
    CONSTRAINT "wedding_type_activities_wedding_type_id_fkey" FOREIGN KEY ("wedding_type_id") REFERENCES "wedding_types" ("id") ON DELETE CASCADE
);

-- Create wedding_type_activity_moments table
CREATE TABLE "wedding_type_activity_moments" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "wedding_type_activity_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "duration_seconds" INTEGER NOT NULL DEFAULT 60,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "is_key_moment" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "wedding_type_activity_moments_wedding_type_activity_id_order_" UNIQUE("wedding_type_activity_id", "order_index"),
    CONSTRAINT "wedding_type_activity_moments_wedding_type_activity_id_fkey" FOREIGN KEY ("wedding_type_activity_id") REFERENCES "wedding_type_activities" ("id") ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX "wedding_types_brand_id_idx" ON "wedding_types"("brand_id");
CREATE INDEX "wedding_types_is_system_seeded_idx" ON "wedding_types"("is_system_seeded");
CREATE INDEX "wedding_types_is_active_idx" ON "wedding_types"("is_active");
CREATE INDEX "wedding_type_activities_wedding_type_id_idx" ON "wedding_type_activities"("wedding_type_id");
CREATE INDEX "wedding_type_activity_moments_wedding_type_activity_id_idx" ON "wedding_type_activity_moments"("wedding_type_activity_id");

-- ======================================
-- Seed Data: 5 UK Wedding Types
-- ======================================

-- 1. Traditional British Wedding (8-10 hrs, start 2pm, 150 guests)
INSERT INTO "wedding_types" ("name", "description", "total_duration_hours", "event_start_time", "typical_guest_count", "is_system_seeded", "is_active", "order_index")
VALUES (
    'Traditional British Wedding',
    'Classic UK wedding with ceremony, formal reception, and traditional timings. 8-10 hours, starting at 2pm.',
    10,
    '14:00',
    150,
    true,
    true,
    1
) RETURNING "id" AS wedding_type_id;

-- Store the ID for use in subsequent inserts (PostgreSQL doesn't support RETURNING in INSERT...SELECT, so we use a CTE approach)
-- Actually, we'll just reference it directly by inserting in order

-- 2. Indian Wedding (12-16 hrs, start 6am, 300 guests)
INSERT INTO "wedding_types" ("name", "description", "total_duration_hours", "event_start_time", "typical_guest_count", "is_system_seeded", "is_active", "order_index")
VALUES (
    'Indian Wedding',
    'Multi-day celebration across Mehendi, Sangeet, Wedding day. Focus on key ceremonies. Typically 12-16 hours for single day coverage.',
    14,
    '06:00',
    300,
    true,
    true,
    2
);

-- 3. Pakistani Wedding (10-12 hrs, start 10am, 200 guests)
INSERT INTO "wedding_types" ("name", "description", "total_duration_hours", "event_start_time", "typical_guest_count", "is_system_seeded", "is_active", "order_index")
VALUES (
    'Pakistani Wedding',
    'Traditional Pakistani ceremonies including Walima and formal celebrations. 10-12 hours, typically starting mid-morning.',
    11,
    '10:00',
    200,
    true,
    true,
    3
);

-- 4. Registry Office + Celebration (6-8 hrs, start 2pm, 75 guests)
INSERT INTO "wedding_types" ("name", "description", "total_duration_hours", "event_start_time", "typical_guest_count", "is_system_seeded", "is_active", "order_index")
VALUES (
    'Registry Office + Celebration',
    'Intimate registry office ceremony followed by casual reception or party. 6-8 hours, afternoon coverage.',
    7,
    '14:00',
    75,
    true,
    true,
    4
);

-- 5. Garden/Intimate Wedding (8-10 hrs, start 2pm, 60 guests)
INSERT INTO "wedding_types" ("name", "description", "total_duration_hours", "event_start_time", "typical_guest_count", "is_system_seeded", "is_active", "order_index")
VALUES (
    'Garden/Intimate Wedding',
    'Small garden or venue ceremony with intimate gathering. 8-10 hours, afternoon to evening.',
    9,
    '14:00',
    60,
    true,
    true,
    5
);

-- ======================================
-- Activities for Traditional British Wedding (Wedding Type ID 1)
-- ======================================
INSERT INTO "wedding_type_activities" ("wedding_type_id", "name", "icon", "color", "duration_minutes", "start_time_offset_minutes", "order_index")
VALUES
    (1, 'Getting Ready', 'glam', '#FF69B4', 75, 0, 1),
    (1, 'Ceremony', 'church', '#8B4513', 45, 75, 2),
    (1, 'Confetti/Photos', 'photo', '#FFD700', 30, 120, 3),
    (1, 'Reception Entry', 'champagne', '#C41E3A', 30, 150, 4),
    (1, 'Formal Dinner', 'dinner', '#DC143C', 120, 180, 5),
    (1, 'Cake Cut & Speeches', 'cake', '#FFB6C1', 45, 300, 6),
    (1, 'First Dance & Evening', 'heart', '#FF1493', 90, 345, 7);

-- ======================================
-- Moments for Traditional British Wedding Activities
-- ======================================
-- Getting Ready (Activity 1)
INSERT INTO "wedding_type_activity_moments" ("wedding_type_activity_id", "name", "duration_seconds", "order_index", "is_key_moment")
VALUES
    ((SELECT id FROM "wedding_type_activities" WHERE "wedding_type_id" = 1 AND "order_index" = 1), 'Bridal Prep Begin', 120, 1, true),
    ((SELECT id FROM "wedding_type_activities" WHERE "wedding_type_id" = 1 AND "order_index" = 1), 'Dress Reveal', 180, 2, true),
    ((SELECT id FROM "wedding_type_activities" WHERE "wedding_type_id" = 1 AND "order_index" = 1), 'Final Check', 60, 3, false);

-- Ceremony (Activity 2)
INSERT INTO "wedding_type_activity_moments" ("wedding_type_activity_id", "name", "duration_seconds", "order_index", "is_key_moment")
VALUES
    ((SELECT id FROM "wedding_type_activities" WHERE "wedding_type_id" = 1 AND "order_index" = 2), 'Processional', 120, 1, true),
    ((SELECT id FROM "wedding_type_activities" WHERE "wedding_type_id" = 1 AND "order_index" = 2), 'Vows', 180, 2, true),
    ((SELECT id FROM "wedding_type_activities" WHERE "wedding_type_id" = 1 AND "order_index" = 2), 'Ring Exchange', 120, 3, true),
    ((SELECT id FROM "wedding_type_activities" WHERE "wedding_type_id" = 1 AND "order_index" = 2), 'First Kiss', 60, 4, true);

-- Confetti/Photos (Activity 3)
INSERT INTO "wedding_type_activity_moments" ("wedding_type_activity_id", "name", "duration_seconds", "order_index", "is_key_moment")
VALUES
    ((SELECT id FROM "wedding_type_activities" WHERE "wedding_type_id" = 1 AND "order_index" = 3), 'Confetti Moment', 120, 1, true),
    ((SELECT id FROM "wedding_type_activities" WHERE "wedding_type_id" = 1 AND "order_index" = 3), 'Group Photos', 900, 2, false),
    ((SELECT id FROM "wedding_type_activities" WHERE "wedding_type_id" = 1 AND "order_index" = 3), 'Couple Portraits', 600, 3, true);

-- Reception Entry (Activity 4)
INSERT INTO "wedding_type_activity_moments" ("wedding_type_activity_id", "name", "duration_seconds", "order_index", "is_key_moment")
VALUES
    ((SELECT id FROM "wedding_type_activities" WHERE "wedding_type_id" = 1 AND "order_index" = 4), 'Grand Entrance', 120, 1, true),
    ((SELECT id FROM "wedding_type_activities" WHERE "wedding_type_id" = 1 AND "order_index" = 4), 'Receiving Line', 900, 2, false);

-- Dinner (Activity 5)
INSERT INTO "wedding_type_activity_moments" ("wedding_type_activity_id", "name", "duration_seconds", "order_index", "is_key_moment")
VALUES
    ((SELECT id FROM "wedding_type_activities" WHERE "wedding_type_id" = 1 AND "order_index" = 5), 'Starter Course', 1200, 1, false),
    ((SELECT id FROM "wedding_type_activities" WHERE "wedding_type_id" = 1 AND "order_index" = 5), 'Main Course', 1800, 2, false),
    ((SELECT id FROM "wedding_type_activities" WHERE "wedding_type_id" = 1 AND "order_index" = 5), 'Dessert', 1200, 3, false);

-- Cake & Speeches (Activity 6)
INSERT INTO "wedding_type_activity_moments" ("wedding_type_activity_id", "name", "duration_seconds", "order_index", "is_key_moment")
VALUES
    ((SELECT id FROM "wedding_type_activities" WHERE "wedding_type_id" = 1 AND "order_index" = 6), 'Best Man Speech', 600, 1, true),
    ((SELECT id FROM "wedding_type_activities" WHERE "wedding_type_id" = 1 AND "order_index" = 6), 'Cake Cutting', 180, 2, true),
    ((SELECT id FROM "wedding_type_activities" WHERE "wedding_type_id" = 1 AND "order_index" = 6), 'Cake Sharing', 300, 3, false);

-- First Dance & Evening (Activity 7)
INSERT INTO "wedding_type_activity_moments" ("wedding_type_activity_id", "name", "duration_seconds", "order_index", "is_key_moment")
VALUES
    ((SELECT id FROM "wedding_type_activities" WHERE "wedding_type_id" = 1 AND "order_index" = 7), 'First Dance', 240, 1, true),
    ((SELECT id FROM "wedding_type_activities" WHERE "wedding_type_id" = 1 AND "order_index" = 7), 'Parent Dances', 180, 2, true),
    ((SELECT id FROM "wedding_type_activities" WHERE "wedding_type_id" = 1 AND "order_index" = 7), 'Dance Floor Open', 3600, 3, false);

-- ======================================
-- Activities for Indian Wedding (Wedding Type ID 2)
-- ======================================
INSERT INTO "wedding_type_activities" ("wedding_type_id", "name", "icon", "color", "duration_minutes", "start_time_offset_minutes", "order_index")
VALUES
    (2, 'Early Morning Prayers', 'prayer', '#FFA500', 60, 0, 1),
    (2, 'Mehendi', 'henna', '#C41E3A', 120, 60, 2),
    (2, 'Groom Arrival (Baraat)', 'horse', '#8B4513', 90, 180, 3),
    (2, 'Wedding Ceremony (Pheras)', 'mandap', '#FFD700', 120, 270, 4),
    (2, 'Aashirwad/Blessings', 'blessed', '#C41E3A', 90, 390, 5),
    (2, 'Reception & Dinner', 'feast', '#DC143C', 180, 480, 6),
    (2, 'Evening Celebrations', 'dance', '#FF1493', 120, 660, 7);

-- ======================================
-- Moments for Indian Wedding Activities
-- ======================================
-- Early Morning Prayers
INSERT INTO "wedding_type_activity_moments" ("wedding_type_activity_id", "name", "duration_seconds", "order_index", "is_key_moment")
VALUES
    ((SELECT id FROM "wedding_type_activities" WHERE "wedding_type_id" = 2 AND "order_index" = 1), 'Bride Prayers', 600, 1, true),
    ((SELECT id FROM "wedding_type_activities" WHERE "wedding_type_id" = 2 AND "order_index" = 1), 'Getting Ready', 1800, 2, false);

-- Mehendi
INSERT INTO "wedding_type_activity_moments" ("wedding_type_activity_id", "name", "duration_seconds", "order_index", "is_key_moment")
VALUES
    ((SELECT id FROM "wedding_type_activities" WHERE "wedding_type_id" = 2 AND "order_index" = 2), 'Mehendi Application', 1200, 1, true),
    ((SELECT id FROM "wedding_type_activities" WHERE "wedding_type_id" = 2 AND "order_index" = 2), 'Dancing & Celebrations', 4800, 2, true),
    ((SELECT id FROM "wedding_type_activities" WHERE "wedding_type_id" = 2 AND "order_index" = 2), 'Groom Tease', 1200, 3, true);

-- Baraat
INSERT INTO "wedding_type_activity_moments" ("wedding_type_activity_id", "name", "duration_seconds", "order_index", "is_key_moment")
VALUES
    ((SELECT id FROM "wedding_type_activities" WHERE "wedding_type_id" = 2 AND "order_index" = 3), 'Baraat Arrival', 600, 1, true),
    ((SELECT id FROM "wedding_type_activities" WHERE "wedding_type_id" = 2 AND "order_index" = 3), 'Groom Reception', 900, 2, true),
    ((SELECT id FROM "wedding_type_activities" WHERE "wedding_type_id" = 2 AND "order_index" = 3), 'Dancing Groom', 2700, 3, true);

-- Ceremony
INSERT INTO "wedding_type_activity_moments" ("wedding_type_activity_id", "name", "duration_seconds", "order_index", "is_key_moment")
VALUES
    ((SELECT id FROM "wedding_type_activities" WHERE "wedding_type_id" = 2 AND "order_index" = 4), 'Mandap Preparation', 600, 1, false),
    ((SELECT id FROM "wedding_type_activities" WHERE "wedding_type_id" = 2 AND "order_index" = 4), 'Pheras (Rounds)', 1800, 2, true),
    ((SELECT id FROM "wedding_type_activities" WHERE "wedding_type_id" = 2 AND "order_index" = 4), 'Mangal Sutra', 300, 3, true);

-- Aashirwad
INSERT INTO "wedding_type_activity_moments" ("wedding_type_activity_id", "name", "duration_seconds", "order_index", "is_key_moment")
VALUES
    ((SELECT id FROM "wedding_type_activities" WHERE "wedding_type_id" = 2 AND "order_index" = 5), 'Blessings Begin', 300, 1, true),
    ((SELECT id FROM "wedding_type_activities" WHERE "wedding_type_id" = 2 AND "order_index" = 5), 'Family Photos', 1800, 2, false),
    ((SELECT id FROM "wedding_type_activities" WHERE "wedding_type_id" = 2 AND "order_index" = 5), 'Blessing Line', 2700, 3, false);

-- Reception
INSERT INTO "wedding_type_activity_moments" ("wedding_type_activity_id", "name", "duration_seconds", "order_index", "is_key_moment")
VALUES
    ((SELECT id FROM "wedding_type_activities" WHERE "wedding_type_id" = 2 AND "order_index" = 6), 'Reception Entry', 300, 1, true),
    ((SELECT id FROM "wedding_type_activities" WHERE "wedding_type_id" = 2 AND "order_index" = 6), 'Dinner Course', 5400, 2, false),
    ((SELECT id FROM "wedding_type_activities" WHERE "wedding_type_id" = 2 AND "order_index" = 6), 'Cake Cutting', 600, 3, true);

-- Evening Celebrations
INSERT INTO "wedding_type_activity_moments" ("wedding_type_activity_id", "name", "duration_seconds", "order_index", "is_key_moment")
VALUES
    ((SELECT id FROM "wedding_type_activities" WHERE "wedding_type_id" = 2 AND "order_index" = 7), 'First Dance', 300, 1, true),
    ((SELECT id FROM "wedding_type_activities" WHERE "wedding_type_id" = 2 AND "order_index" = 7), 'Dance Floor', 5400, 2, true);

-- ======================================
-- Activities for Pakistani Wedding (Wedding Type ID 3)
-- ======================================
INSERT INTO "wedding_type_activities" ("wedding_type_id", "name", "icon", "color", "duration_minutes", "start_time_offset_minutes", "order_index")
VALUES
    (3, 'Groom Preparation', 'groom', '#8B4513', 90, 0, 1),
    (3, 'Nikkah Ceremony', 'ceremony', '#FFD700', 60, 90, 2),
    (3, 'Bride & Groom Photos', 'photo', '#FFB6C1', 60, 150, 3),
    (3, 'Reception Entry & Dinner', 'feast', '#C41E3A', 120, 210, 4),
    (3, 'Cake Cutting & Speeches', 'cake', '#FF1493', 45, 330, 5),
    (3, 'Dancing & Celebration', 'dance', '#DC143C', 60, 375, 6);

-- ======================================
-- Moments for Pakistani Wedding Activities
-- ======================================
-- Groom Preparation
INSERT INTO "wedding_type_activity_moments" ("wedding_type_activity_id", "name", "duration_seconds", "order_index", "is_key_moment")
VALUES
    ((SELECT id FROM "wedding_type_activities" WHERE "wedding_type_id" = 3 AND "order_index" = 1), 'Getting Ready', 1800, 1, false),
    ((SELECT id FROM "wedding_type_activities" WHERE "wedding_type_id" = 3 AND "order_index" = 1), 'Final Check', 900, 2, false);

-- Nikkah
INSERT INTO "wedding_type_activity_moments" ("wedding_type_activity_id", "name", "duration_seconds", "order_index", "is_key_moment")
VALUES
    ((SELECT id FROM "wedding_type_activities" WHERE "wedding_type_id" = 3 AND "order_index" = 2), 'Ceremony Begin', 300, 1, true),
    ((SELECT id FROM "wedding_type_activities" WHERE "wedding_type_id" = 3 AND "order_index" = 2), 'Vows', 600, 2, true),
    ((SELECT id FROM "wedding_type_activities" WHERE "wedding_type_id" = 3 AND "order_index" = 2), 'Signing', 300, 3, false);

-- Photos
INSERT INTO "wedding_type_activity_moments" ("wedding_type_activity_id", "name", "duration_seconds", "order_index", "is_key_moment")
VALUES
    ((SELECT id FROM "wedding_type_activities" WHERE "wedding_type_id" = 3 AND "order_index" = 3), 'Couple Portraits', 1800, 1, true),
    ((SELECT id FROM "wedding_type_activities" WHERE "wedding_type_id" = 3 AND "order_index" = 3), 'Group Photos', 1200, 2, false);

-- Reception
INSERT INTO "wedding_type_activity_moments" ("wedding_type_activity_id", "name", "duration_seconds", "order_index", "is_key_moment")
VALUES
    ((SELECT id FROM "wedding_type_activities" WHERE "wedding_type_id" = 3 AND "order_index" = 4), 'Grand Entrance', 300, 1, true),
    ((SELECT id FROM "wedding_type_activities" WHERE "wedding_type_id" = 3 AND "order_index" = 4), 'Dinner', 5400, 2, false);

-- Cake & Speeches
INSERT INTO "wedding_type_activity_moments" ("wedding_type_activity_id", "name", "duration_seconds", "order_index", "is_key_moment")
VALUES
    ((SELECT id FROM "wedding_type_activities" WHERE "wedding_type_id" = 3 AND "order_index" = 5), 'Speeches', 900, 1, false),
    ((SELECT id FROM "wedding_type_activities" WHERE "wedding_type_id" = 3 AND "order_index" = 5), 'Cake Cutting', 300, 2, true);

-- Dancing
INSERT INTO "wedding_type_activity_moments" ("wedding_type_activity_id", "name", "duration_seconds", "order_index", "is_key_moment")
VALUES
    ((SELECT id FROM "wedding_type_activities" WHERE "wedding_type_id" = 3 AND "order_index" = 6), 'First Dance', 300, 1, true),
    ((SELECT id FROM "wedding_type_activities" WHERE "wedding_type_id" = 3 AND "order_index" = 6), 'Dance Floor', 2700, 2, true);

-- ======================================
-- Activities for Registry Office + Celebration (Wedding Type ID 4)
-- ======================================
INSERT INTO "wedding_type_activities" ("wedding_type_id", "name", "icon", "color", "duration_minutes", "start_time_offset_minutes", "order_index")
VALUES
    (4, 'Registry Ceremony', 'rings', '#8B4513', 30, 0, 1),
    (4, 'Confetti Moment', 'confetti', '#FFD700', 20, 30, 2),
    (4, 'Couple Photos', 'photo', '#FFB6C1', 45, 50, 3),
    (4, 'Reception & Drinks', 'champagne', '#C41E3A', 90, 95, 4),
    (4, 'Food & Cake', 'cake', '#FF1493', 80, 185, 5);

-- ======================================
-- Moments for Registry Office Activities
-- ======================================
-- Registry Ceremony
INSERT INTO "wedding_type_activity_moments" ("wedding_type_activity_id", "name", "duration_seconds", "order_index", "is_key_moment")
VALUES
    ((SELECT id FROM "wedding_type_activities" WHERE "wedding_type_id" = 4 AND "order_index" = 1), 'Ceremony', 1200, 1, true),
    ((SELECT id FROM "wedding_type_activities" WHERE "wedding_type_id" = 4 AND "order_index" = 1), 'Registrar', 900, 2, false);

-- Confetti
INSERT INTO "wedding_type_activity_moments" ("wedding_type_activity_id", "name", "duration_seconds", "order_index", "is_key_moment")
VALUES
    ((SELECT id FROM "wedding_type_activities" WHERE "wedding_type_id" = 4 AND "order_index" = 2), 'Confetti Throw', 300, 1, true);

-- Photos
INSERT INTO "wedding_type_activity_moments" ("wedding_type_activity_id", "name", "duration_seconds", "order_index", "is_key_moment")
VALUES
    ((SELECT id FROM "wedding_type_activities" WHERE "wedding_type_id" = 4 AND "order_index" = 3), 'Couple Shots', 1200, 1, true),
    ((SELECT id FROM "wedding_type_activities" WHERE "wedding_type_id" = 4 AND "order_index" = 3), 'Group Photo', 900, 2, false);

-- Reception
INSERT INTO "wedding_type_activity_moments" ("wedding_type_activity_id", "name", "duration_seconds", "order_index", "is_key_moment")
VALUES
    ((SELECT id FROM "wedding_type_activities" WHERE "wedding_type_id" = 4 AND "order_index" = 4), 'Champagne Toast', 600, 1, true),
    ((SELECT id FROM "wedding_type_activities" WHERE "wedding_type_id" = 4 AND "order_index" = 4), 'Mingling', 4800, 2, false);

-- Food & Cake
INSERT INTO "wedding_type_activity_moments" ("wedding_type_activity_id", "name", "duration_seconds", "order_index", "is_key_moment")
VALUES
    ((SELECT id FROM "wedding_type_activities" WHERE "wedding_type_id" = 4 AND "order_index" = 5), 'Cake Cutting', 300, 1, true),
    ((SELECT id FROM "wedding_type_activities" WHERE "wedding_type_id" = 4 AND "order_index" = 5), 'Eating & Chatting', 3600, 2, false);

-- ======================================
-- Activities for Garden/Intimate Wedding (Wedding Type ID 5)
-- ======================================
INSERT INTO "wedding_type_activities" ("wedding_type_id", "name", "icon", "color", "duration_minutes", "start_time_offset_minutes", "order_index")
VALUES
    (5, 'Guest Arrival & Ceremony Setup', 'setup', '#8B4513', 30, 0, 1),
    (5, 'Garden Ceremony', 'heart', '#C41E3A', 45, 30, 2),
    (5, 'Photos & Cocktails', 'champagne', '#FFD700', 60, 75, 3),
    (5, 'Garden Games', 'fun', '#FF1493', 60, 135, 4),
    (5, 'Dinner & Celebration', 'feast', '#DC143C', 90, 195, 5),
    (5, 'Evening Dancing', 'dance', '#FFB6C1', 60, 285, 6);

-- ======================================
-- Moments for Garden/Intimate Wedding Activities
-- ======================================
-- Ceremony Setup
INSERT INTO "wedding_type_activity_moments" ("wedding_type_activity_id", "name", "duration_seconds", "order_index", "is_key_moment")
VALUES
    ((SELECT id FROM "wedding_type_activities" WHERE "wedding_type_id" = 5 AND "order_index" = 1), 'Guests Arriving', 1200, 1, false),
    ((SELECT id FROM "wedding_type_activities" WHERE "wedding_type_id" = 5 AND "order_index" = 1), 'Bride Processional', 300, 2, true);

-- Ceremony
INSERT INTO "wedding_type_activity_moments" ("wedding_type_activity_id", "name", "duration_seconds", "order_index", "is_key_moment")
VALUES
    ((SELECT id FROM "wedding_type_activities" WHERE "wedding_type_id" = 5 AND "order_index" = 2), 'Vows', 600, 1, true),
    ((SELECT id FROM "wedding_type_activities" WHERE "wedding_type_id" = 5 AND "order_index" = 2), 'First Kiss', 120, 2, true);

-- Photos & Cocktails
INSERT INTO "wedding_type_activity_moments" ("wedding_type_activity_id", "name", "duration_seconds", "order_index", "is_key_moment")
VALUES
    ((SELECT id FROM "wedding_type_activities" WHERE "wedding_type_id" = 5 AND "order_index" = 3), 'Couple Portraits', 1200, 1, true),
    ((SELECT id FROM "wedding_type_activities" WHERE "wedding_type_id" = 5 AND "order_index" = 3), 'Cocktail Hour', 2400, 2, false);

-- Games
INSERT INTO "wedding_type_activity_moments" ("wedding_type_activity_id", "name", "duration_seconds", "order_index", "is_key_moment")
VALUES
    ((SELECT id FROM "wedding_type_activities" WHERE "wedding_type_id" = 5 AND "order_index" = 4), 'Lawn Games', 3600, 1, false);

-- Dinner
INSERT INTO "wedding_type_activity_moments" ("wedding_type_activity_id", "name", "duration_seconds", "order_index", "is_key_moment")
VALUES
    ((SELECT id FROM "wedding_type_activities" WHERE "wedding_type_id" = 5 AND "order_index" = 5), 'Dinner Course', 3600, 1, false),
    ((SELECT id FROM "wedding_type_activities" WHERE "wedding_type_id" = 5 AND "order_index" = 5), 'Cake Cutting', 300, 2, true);

-- Dancing
INSERT INTO "wedding_type_activity_moments" ("wedding_type_activity_id", "name", "duration_seconds", "order_index", "is_key_moment")
VALUES
    ((SELECT id FROM "wedding_type_activities" WHERE "wedding_type_id" = 5 AND "order_index" = 6), 'First Dance', 300, 1, true),
    ((SELECT id FROM "wedding_type_activities" WHERE "wedding_type_id" = 5 AND "order_index" = 6), 'Open Dance Floor', 3600, 2, true);
