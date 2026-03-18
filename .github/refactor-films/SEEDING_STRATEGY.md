# Seeding Strategy

**Complete guide for seeding database with templates and demo data**

---

## Seed File Organization

```
packages/backend/prisma/seeds/
├── moonrise-00-subject-templates.seed.ts       (~100 lines)
├── moonrise-01-scene-templates.seed.ts         (~150 lines)
├── moonrise-02-demo-film-structure.seed.ts     (~200 lines)
├── moonrise-03-demo-subjects.seed.ts           (~100 lines)
├── moonrise-04-demo-recording-setups.seed.ts   (~150 lines)
├── moonrise-05-demo-music.seed.ts              (~100 lines)
└── index.ts                           (existing seed runner)
```

---

## 1. Subject Templates (Moonrise - Always Seeded)

24 templates organized in 3 categories.

### People (12)
- Bride
- Groom
- Officiant
- Maid of Honor
- Best Man
- Parents
- Flower Girl
- Ring Bearer
- Grandparents
- Bridesmaids
- Groomsmen
- Guests

### Objects (7)
- Rings
- Bouquet
- Cake
- Decorations
- Dress Details
- Shoes
- Jewelry

### Locations (5)
- Venue Exterior
- Ceremony Space
- Reception Hall
- Bridal Suite
- Getting Ready Room

---

## 2. Scene Templates (Moonrise Library)

3 complete scenes with moments and suggested subjects.

### Ceremony
```
Moments:
1. Processional (60 sec)
2. Vows (45 sec)
3. Ring Exchange (30 sec)
4. First Kiss (15 sec)
5. Recessional (60 sec)

Suggested Subjects:
- Bride (required)
- Groom (required)
- Officiant (optional)
- Rings (required)
```

### Reception
```
Moments:
1. Grand Entrance (45 sec)
2. First Dance (120 sec)
3. Parent Dances (90 sec)
4. Toasts (60 sec)
5. Cake Cutting (30 sec)
6. Bouquet Toss (20 sec)

Suggested Subjects:
- Bride (required)
- Groom (required)
- Cake (optional)
- Bouquet (optional)
```

### Getting Ready
```
Moments:
1. Bridal Preparation (60 sec)
2. Groom Preparation (45 sec)
3. Details (30 sec)

Suggested Subjects:
- Bride (required)
- Groom (required)
- Dress Details (optional)
- Jewelry (optional)
```

---

## 3. Demo Film (Optional - Dev/Test Only)

### Film: "Smith Wedding"
- 3 video cameras (Camera 1, 2, 3)
- 2 audio recorders (Audio 1, 2)
- 1 graphics track
- 1 music track

### Demo Scene: Ceremony
- Uses CeremonyTemplate
- Contains 5 moments

### Demo Subjects (5 total)
- Bride (from template)
- Groom (from template)
- Officiant (from template)
- Rings (from template)
- Bride's Dog "Max" (custom)

### Demo Recording Setups

**Moment: Vows**
```
Cameras:
- Camera 1 → Bride
- Camera 2 → Groom

Audio:
- Audio 1 (active)

Graphics:
- Disabled
```

**Moment: Ring Exchange**
```
Cameras:
- Camera 3 → Bride + Groom
- Camera 1 → Rings

Audio:
- Audio 2 (active)

Graphics:
- Disabled
```

**Moment: First Kiss**
```
Cameras:
- Camera 2 → Bride + Groom
- Camera 3 → Bride + Groom

Audio:
- Audio 1 + Audio 2 (both active)

Graphics:
- Enabled (overlay)
```

### Demo Music
- Scene music: "Classical Ceremony Background"
- Vows override: "Emotional Piano"
- Ring Exchange override: "Soft Strings"
- First Kiss override: "Romantic Orchestral"

---

## Running Seeds

### Production (Templates Only)
```bash
cd packages/backend
npx prisma db seed
```

Creates:
- 24 SubjectTemplates
- 3 SceneTemplates with moments

### Development (Templates + Demo)
```bash
cd packages/backend
SEED_DEMO_DATA=true npx prisma db seed
```

Creates everything above plus:
- 1 Demo Film
- 5 Demo Subjects
- 3 Demo Recording Setups

---

## Deprecating Legacy Moonrise Seeds

Legacy Moonrise modules for subjects/scenes/moments/films/coverage are removed and replaced by the new template seeds.
Moonrise complete setup remains in the seed runner, but it no longer imports those legacy modules.

Rules:
- New Moonrise seeds use the naming pattern: `moonrise-<number>-<name>.seed.ts`
- Legacy Moonrise modules are removed from the repo
- `prisma/seeds/index.ts` should keep moonrise-complete-setup enabled
- Scene + Moment Music

### Via npm Scripts
```bash
# Add to backend package.json
{
  "scripts": {
    "prisma:seed": "prisma db seed",
    "prisma:seed:demo": "SEED_DEMO_DATA=true prisma db seed",
    "prisma:seed:reset": "prisma migrate reset"
  }
}

# Run them
npm run prisma:seed           # Templates only
npm run prisma:seed:demo      # Templates + demo
npm run prisma:seed:reset     # Drop DB, run migrations, seed
```

---

## Verification Commands

### Check Templates Seeded
```bash
npx prisma studio

# Or via API after backend starts:
curl http://localhost:3002/subjects/templates | jq 'length'
# Should output: 24
```

### Check Demo Data
```bash
curl http://localhost:3002/films | jq 'length'
# Should output: 1 (if seeded with SEED_DEMO_DATA=true)

curl http://localhost:3002/films/[filmId]/subjects | jq 'length'
# Should output: 5
```

### Check Scene Templates
```bash
curl http://localhost:3002/scene-templates | jq 'length'
# Should output: 3
```

---

## Seed File Structure

All seeds follow this pattern:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedXXX() {
  console.log('🌱 Seeding XXX...');
  
  try {
    // Create or update data
    const result = await prisma.xxxxx.upsert({...});
    
    console.log(`✅ Seeded ${count} XXX`);
    return result;
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

export default seedXXX;
```

Master index.ts (existing seed runner):

```typescript
// index.ts registers subject/scene template seeds
// and runs them along with the existing seed suite.
```

---

## Common Issues & Solutions

**Issue:** "Cannot find module '@prisma/client'"
```bash
npm install @prisma/client
npx prisma generate
```

**Issue:** Seed runs but no data appears
```bash
# Check seed output
npx prisma db seed --verbose

# Verify data exists
npx prisma studio
```

**Issue:** Duplicate key error when running seed twice
```bash
# Use upsert instead of create
# Or reset database
npx prisma migrate reset
```

**Issue:** "x table does not exist"
```bash
# Run migrations first
npx prisma migrate dev
# Then seed
npx prisma db seed
```

---

## See Also

- [PHASE_1_DATABASE.md](PHASE_1_DATABASE.md) - Complete database setup instructions
- [CLEANUP_STRATEGY.md](CLEANUP_STRATEGY.md) - How to clean old data
