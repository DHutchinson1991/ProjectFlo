# Ceremony Film Test Data Setup

## Quick Start

To populate the Ceremony Film (ID: 2) with test data including moments, coverage assignments, music, and graphics:

### Step 1: Stop the Backend Server
```bash
# If the backend is running, press Ctrl+C to stop it
# Or from another terminal:
taskkill /F /IM node.exe
```

### Step 2: Check Current Database State
```bash
cd "c:\Users\works\Documents\Code Projects\ProjectFlo\packages\backend"
node check-ceremony-film-db.js
```

This will show you:
- Current film information
- Existing local scenes (should be empty)
- Existing moments (should be empty)
- Existing tracks (should be empty)
- Available coverage records in the database
- Original Ceremony scene from the library

### Step 3: Seed Test Data
```bash
cd "c:\Users\works\Documents\Code Projects\ProjectFlo\packages\backend"
node seed-ceremony-film-test-data.js
```

This will:
1. Clean up any existing local scenes and tracks
2. Create 7 timeline tracks:
   - Camera 1, Camera 2, Camera 3 (VIDEO)
   - Audio 1, Audio 2 (AUDIO)
   - Graphics (GRAPHICS)
   - Music (MUSIC)
3. Create 1 film-local Ceremony scene
4. Create 3 moments with different coverage assignments:
   - **Vows** (45s) → Camera 1, Audio 1, Graphics + "Emotional Piano" music
   - **Ring Exchange** (30s) → Camera 2, Camera 3, Audio 2, Graphics + "Soft Strings" music
   - **First Kiss** (15s) → Camera 1, Camera 2, Audio 1, Music + "Romantic Orchestral" music

### Step 4: Start Backend Server
```bash
cd "c:\Users\works\Documents\Code Projects\ProjectFlo\packages\backend"
npm run start:dev
```

### Step 5: View in Timeline
Navigate to: **http://localhost:3001/designer/films/2**

You should now see:
- ✅ Timeline with 7 tracks (Video, Audio, Graphics, Music)
- ✅ Ceremony scene with 3 moments
- ✅ Coverage checkboxes showing which tracks are assigned to each moment
- ✅ Different coverage for each moment

## Test Data Details

| Moment | Duration | Video Tracks | Audio Tracks | Graphics | Music |
|--------|----------|--------------|--------------|----------|-------|
| Vows | 45s | Camera 1 | Audio 1 | ✓ | Emotional Piano |
| Ring Exchange | 30s | Camera 2, 3 | Audio 2 | ✓ | Soft Strings |
| First Kiss | 15s | Camera 1, 2 | Audio 1 | - | Music + Romantic Orchestral |

## Troubleshooting

### "No scenes appear in timeline"
1. Run the check script: `node check-ceremony-film-db.js`
2. Look for "NO LOCAL SCENES FOUND" message
3. If found, run the seed script: `node seed-ceremony-film-test-data.js`
4. Restart backend server

### "Coverage checkboxes not showing"
1. Check that moments have coverage_items in the database
2. Run: `node check-ceremony-film-db.js` to inspect
3. Ensure tracks exist and match coverage names

### "Music not showing"
1. Check that SceneMomentMusic records exist
2. Verify moment has a valid `moment_id`

## Database Schema Reference

Key tables involved:
- `films` (id: 2 = Ceremony Film)
- `film_local_scenes` (scenes assigned to a specific film)
- `scene_moments` (individual moments within a scene)
- `scene_coverage` (assigns coverage/tracks to moments)
- `scene_moment_music` (music assigned to moments)
- `film_timeline_tracks` (the actual tracks shown in timeline UI)
- `coverage` (available camera/audio/graphics options)

## Running the Scripts Manually

If you need to inspect or modify the scripts before running:

```bash
# View the check script
cat check-ceremony-film-db.js

# View the seed script
cat seed-ceremony-film-test-data.js

# Run with verbose output
node seed-ceremony-film-test-data.js 2>&1 | tee seed-output.log
```

## Resetting Everything

To start completely fresh:

```bash
# From backend directory
node check-ceremony-film-db.js          # See what's there
node seed-ceremony-film-test-data.js    # Create fresh test data
npm run start:dev                        # Restart server
```

Then navigate to http://localhost:3001/designer/films/2 to see the timeline!
