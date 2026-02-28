# Scene Save Fix - Testing Checklist

## Pre-Test Setup

- [ ] Start backend server: `npm run start:dev` (in `packages/backend`)
- [ ] Start frontend server: `npm run dev` (in `packages/frontend`)
- [ ] Open DevTools Console (F12)
- [ ] Filter console to see `[SAVE]`, `[ENRICH]`, `[CONTEXT]` logs
- [ ] Open Database: `npx prisma studio` (port 5555) to verify saves

## Test 1: Scene Ordering ✅

**Objective**: Verify that newly saved scenes appear in correct position

**Steps**:
1. [ ] Open a film with existing scenes (e.g., "Test Film 1")
2. [ ] Observe initial scene order in timeline
3. [ ] Add a NEW scene with name "Test Scene Middle"
4. [ ] In the scene library modal, drag it to position between Scene 1 and Scene 2
5. [ ] Click "Save" button
6. [ ] Check console for:
   - [ ] `📍 [SAVE] Scene detected as NEW`
   - [ ] `📍 [SAVE] Order Index: 1` (should be 1, not 0 or last)
   - [ ] `✅ [SAVE] Scene saved successfully: {clientId: ..., databaseId: <number>}`
   - [ ] `📍 [SAVE] Updating scene order - Index 2/3`
   - [ ] `✅ [SAVE] Scene order synced for 3/3 scenes`
7. [ ] Verify timeline: Scene appears in correct middle position (not at start or end)
8. [ ] Check Prisma Studio:
   - [ ] Open `film_scenes` table
   - [ ] Verify new scene has:
     - [ ] Correct `order_index` (not 0, but position in sequence)
     - [ ] Correct `film_id`
     - [ ] Correct `name`

**Expected Result**: 
- Scene appears in timeline at the position it was dropped (middle)
- Database shows correct order_index
- No scenes appear "jumbled" or at wrong position

---

## Test 2: Moment Persistence ✅

**Objective**: Verify that moments are saved to database and persist after refresh

**Steps**:
1. [ ] Add a NEW scene with a template that has moments (e.g., template 1: "Ceremony" with 5 moments)
2. [ ] Click "Save"
3. [ ] Check console for moment save logs:
   - [ ] `📍 [SAVE] Saving 5 moments for scene <ID>`
   - [ ] `📍 [SAVE] Moment 1/5: <moment name> (60s)`
   - [ ] `✅ [SAVE] Moment created: ID <number>`
   - [ ] (Repeat for each moment)
   - [ ] `✅ [SAVE] All moments saved for scene <ID>`
4. [ ] Check timeline: Verify scene shows 5 moments ✅
5. [ ] Check Prisma Studio:
   - [ ] Open `film_scenes` table
   - [ ] Find the scene you just saved
   - [ ] Click on it to see related moments
   - [ ] Verify 5 moments exist in `film_scene_moments` table
   - [ ] Verify `order_index` for moments: 0, 1, 2, 3, 4
6. [ ] **REFRESH THE PAGE** (F5)
7. [ ] Wait for film to load
8. [ ] Check console for enrichment logs:
   - [ ] `✅ [ENRICH] Scene loaded 5 moments from database`
9. [ ] Verify timeline: Scene STILL shows 5 moments ✅

**Expected Result**:
- Moments table has 5 rows for the new scene
- After refresh, moments still appear (not 0)
- Console shows moments being created during save
- Console shows moments being loaded from DB during load

---

## Test 3: No Duplicate Scenes ✅

**Objective**: Verify that saving doesn't create duplicate scenes

**Steps**:
1. [ ] Add a NEW scene named "Duplicate Test Scene"
2. [ ] Click "Save"
3. [ ] Check console for:
   - [ ] `✅ [SAVE] Scene saved successfully: {clientId: ..., databaseId: 25}`
   - [ ] `💾 [CONTEXT] Updating scene ID: <clientId> → 25`
   - [ ] Scene shows `isNew: false` after save
4. [ ] Note the database ID (e.g., 25)
5. [ ] Click "Save" again (without making any changes)
6. [ ] Check console for:
   - [ ] `📍 [SAVE] Skipping already saved scene ID 25`
   - [ ] NOT `✅ [SAVE] Scene saved successfully` (should NOT save again)
7. [ ] Check Prisma Studio:
   - [ ] Open `film_scenes` table
   - [ ] Search for "Duplicate Test Scene"
   - [ ] Should have exactly 1 row, not 2

**Expected Result**:
- Second save is skipped
- Only 1 scene in database
- Console shows "Skipping already saved"

---

## Test 4: Save State Button ✅

**Objective**: Verify that save button shows correct state

**Steps**:
1. [ ] Add a new scene
2. [ ] Observe save button: should be AMBER (unsaved) ⚠️
3. [ ] Click Save
4. [ ] Observe console:
   - [ ] `✅ Film timeline saved successfully`
5. [ ] Observe save button: should turn GREEN (saved) ✅
6. [ ] Wait 2 seconds, button should revert to normal state
7. [ ] Make a change to the timeline
8. [ ] Save button should turn AMBER again ⚠️

**Expected Result**:
- Button is amber before save
- Button turns green after successful save
- Button returns to normal after a moment
- Button goes amber again on any change

---

## Test 5: Delete After Save ✅

**Objective**: Verify that delete works after save (uses correct database ID)

**Prerequisites**: Test 1-4 should pass first

**Steps**:
1. [ ] Create and save a scene (verify it has database ID)
2. [ ] Note the scene name and position
3. [ ] Right-click scene and select "Delete" or click delete button
4. [ ] Check console for:
   - [ ] `🗑️ [DELETE] Deleting scene <ID>` (should be database ID like 25, not client ID like 1769981721797)
   - [ ] `DELETE /scenes/<ID>?brandId=2 200` (NOT 500!)
   - [ ] `✅ [DELETE] Scene deleted successfully`
5. [ ] Verify timeline: scene is removed
6. [ ] Check Prisma Studio:
   - [ ] Open `film_scenes` table
   - [ ] Scene should be gone (or in deleted state)

**Expected Result**:
- Delete API call uses correct database ID
- No HTTP 500 errors
- Scene is removed from both timeline and database
- Console shows successful deletion

---

## Test 6: Complex Scenario (Multiple Scenes) ✅

**Objective**: Test saving multiple new scenes at once

**Steps**:
1. [ ] Start with a film that has 2 existing scenes
2. [ ] Add 3 NEW scenes with different templates
3. [ ] Click Save
4. [ ] Check console for:
   - [ ] `📍 [SAVE] Saving 5 scenes to film X`
   - [ ] For each scene:
     - [ ] `✅ [SAVE] Scene saved successfully`
     - [ ] `📍 [SAVE] Saving X moments for scene Y`
     - [ ] Moment creation logs
   - [ ] `✅ [SAVE] Scene order synced for 5/5 scenes`
5. [ ] Verify timeline:
   - [ ] All 5 scenes are visible
   - [ ] They appear in correct order (0, 1, 2, 3, 4)
   - [ ] Each shows correct moment count
6. [ ] Refresh page
7. [ ] Verify all 5 scenes still visible with moments

**Expected Result**:
- All scenes saved
- All moments saved
- Correct order maintained
- Data persists after refresh

---

## Error Cases to Verify ✅

### Case 1: Moment Save Failure (Non-Critical)
```
Scenario: Moment create API fails but scene succeeded
Expected: 
  - Scene is still in database ✅
  - Warning in console: "⚠️ [SAVE] Failed to save moments but scene itself was created"
  - Save operation completes (not blocked)
```

### Case 2: Scene Save Failure (Critical)
```
Scenario: Scene create API fails
Expected:
  - Error in console: "❌ [SAVE] Error details for scene..."
  - Save operation stops for that scene
  - Other scenes in same save still attempt
  - Error includes API response details
```

### Case 3: Missing Template ID
```
Scenario: Scene added without template
Expected:
  - Falls back to template_id: 1 (or default)
  - Console logs: "Using default template"
  - Scene still saves successfully
```

---

## Browser DevTools Tips

### Filter Console to See Only Save Logs
```javascript
// In DevTools Console, add filter:
[SAVE], [ENRICH], [CONTEXT], [DELETE]
```

### Check Network Tab
1. Open Network tab
2. Filter by "scenes" or "moments"
3. Should see:
   - [ ] POST /scenes/films/X/scenes (scene creation)
   - [ ] POST /moments (one per moment)
   - [ ] PATCH /scenes/X (scene order update)
   - [ ] DELETE /scenes/X (if testing delete)

### Check Prisma Studio
1. Run: `npx prisma studio` in backend directory
2. Navigate to `film_scenes` table
3. Click on film
4. Verify:
   - [ ] `id` (database ID, auto-incremented)
   - [ ] `film_id` (matches film ID)
   - [ ] `name` (matches what you entered)
   - [ ] `order_index` (0, 1, 2, 3, ...)
   - [ ] `scene_template_id` (matches template)

4. Click on scene to see related `film_scene_moments`
5. Verify:
   - [ ] `film_scene_id` (matches scene ID)
   - [ ] `order_index` (0, 1, 2, ...)
   - [ ] `name` (moment names from template)
   - [ ] `duration` (moment duration)

---

## Success Criteria

✅ **All Tests Pass** = Fix is working correctly
- [ ] Test 1: Scene Ordering - PASS
- [ ] Test 2: Moment Persistence - PASS
- [ ] Test 3: No Duplicates - PASS
- [ ] Test 4: Save Button State - PASS
- [ ] Test 5: Delete Works - PASS
- [ ] Test 6: Complex Scenario - PASS
- [ ] All Error Cases handled - PASS

🟡 **Some Tests Fail** = Needs debugging (check console logs)
🔴 **Major Tests Fail** = Core issue remains

---

## Debugging If Tests Fail

### Issue: Scenes appear at wrong position
**Check**:
1. [ ] Console: Look for `📊 [ENRICH-SORT]` logs
2. [ ] Verify `order_index` is being set: `📍 [SAVE] Order Index:`
3. [ ] Check Prisma: `order_index` values in database
4. [ ] Verify enrichment is sorting: `✅ [ENRICH] Scenes sorted by order_index`

### Issue: Moments show as 0 after refresh
**Check**:
1. [ ] Console during save: Look for `📍 [SAVE] Saving X moments`
2. [ ] Verify moment creation: `✅ [SAVE] Moment created: ID`
3. [ ] Prisma Studio: Check `film_scene_moments` table (should have rows)
4. [ ] Console during load: Look for `✅ [ENRICH] Scene loaded X moments from database`

### Issue: Duplicate scenes created
**Check**:
1. [ ] Console: Look for `isNew: false` after save
2. [ ] Multiple saves: Should see `📍 [SAVE] Skipping already saved scene`
3. [ ] Database: Check `film_scenes` for duplicates

### Issue: Save button doesn't turn green
**Check**:
1. [ ] Console: `✅ Film timeline saved successfully` should appear
2. [ ] Check SaveControls component receives `handleSave` prop
3. [ ] Verify `useSaveState` updates are working

---

## Performance Notes

⏱️ **Expected Timing**:
- Scene creation: ~200ms
- Per moment creation: ~150ms
- Order update: ~100ms
- Total for 1 scene + 3 moments: ~800ms

⚠️ **If Very Slow** (>2s):
- Check network latency
- Check database query performance
- Review Prisma logs for slow queries

⚠️ **If Very Fast** (<100ms):
- Verify API calls actually completed (check Network tab)
- Ensure DB inserts were successful (check Prisma Studio)

---

## Next Steps After Testing

1. **If All Tests Pass**:
   - ✅ Fix is complete and verified
   - Update project status: "Scene save/order/moments fixed"
   - Archive old debugging notes

2. **If Some Tests Fail**:
   - Use console logs to identify root cause
   - Check error messages in DevTools
   - Review the data flow diagrams
   - May need to add additional debugging logs

3. **If Major Tests Fail**:
   - Revert changes and review the fix
   - Check git history for what changed
   - Verify all file edits were applied correctly

---

**Test Date**: _______________
**Tester**: _______________
**Result**: _______________
**Notes**: _______________________________________________________________
________________________________________________________________________

