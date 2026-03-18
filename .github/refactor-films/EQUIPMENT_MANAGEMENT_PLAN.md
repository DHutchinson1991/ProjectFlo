# Equipment Management - Architecture Plan

## Problem
The film detail page tries to load equipment from `/films/{id}/equipment` but these endpoints don't exist. We need a clear equipment management system.

## Proposed Architecture

### 1. Equipment Library (Brand-Level)
**Purpose:** Manage your actual physical equipment inventory

**Database Schema:**
```prisma
model Equipment {
  id          Int      @id @default(autoincrement())
  brand_id    Int
  name        String   // "Sony A7III Camera #1"
  type        EquipmentType // CAMERA, AUDIO, LIGHTING, etc.
  category    String?  // "Mirrorless Camera", "Wireless Mic"
  model       String?  // "Sony A7III"
  serial_number String?
  purchase_date DateTime?
  status      EquipmentStatus @default(AVAILABLE) // AVAILABLE, IN_USE, MAINTENANCE, RETIRED
  
  brand       Brand    @relation(fields: [brand_id], references: [id])
  film_assignments FilmEquipment[]
  
  @@index([brand_id, type])
}

enum EquipmentType {
  CAMERA
  AUDIO
  LIGHTING
  MUSIC_PLAYBACK
  STABILIZER
  DRONE
  OTHER
}

enum EquipmentStatus {
  AVAILABLE
  IN_USE
  MAINTENANCE
  RETIRED
}
```

**API Endpoints:**
- `GET /equipment` - List all equipment (with filters: type, status)
- `GET /equipment/{id}` - Get equipment details
- `POST /equipment` - Add new equipment
- `PATCH /equipment/{id}` - Update equipment
- `DELETE /equipment/{id}` - Remove equipment

---

### 2. Package Templates (Brand-Level)
**Purpose:** Reusable equipment configurations for different types of shoots

**Database Schema:**
```prisma
model EquipmentPackageTemplate {
  id          Int      @id @default(autoincrement())
  brand_id    Int
  name        String   // "2-Camera Wedding Standard"
  description String?
  is_active   Boolean  @default(true)
  
  brand       Brand    @relation(fields: [brand_id], references: [id])
  items       EquipmentPackageTemplateItem[]
  
  @@index([brand_id])
}

model EquipmentPackageTemplateItem {
  id          Int      @id @default(autoincrement())
  template_id Int
  equipment_type EquipmentType
  quantity    Int      @default(1)
  is_required Boolean  @default(true)
  notes       String?  // "Primary camera for ceremony"
  
  template    EquipmentPackageTemplate @relation(fields: [template_id], references: [id])
}
```

**API Endpoints:**
- `GET /equipment/packages` - List all package templates
- `GET /equipment/packages/{id}` - Get package details
- `POST /equipment/packages` - Create package template
- `PATCH /equipment/packages/{id}` - Update package template
- `DELETE /equipment/packages/{id}` - Remove package template

---

### 3. Film Equipment Assignment (Film-Level)
**Purpose:** Track what equipment is assigned to each film

**Database Schema:**
```prisma
model FilmEquipment {
  id          Int      @id @default(autoincrement())
  film_id     Int
  equipment_id Int
  quantity    Int      @default(1)
  notes       String?  // "Primary camera for ceremony"
  assigned_at DateTime @default(now())
  
  film        Film     @relation(fields: [film_id], references: [id])
  equipment   Equipment @relation(fields: [equipment_id], references: [id])
  
  @@unique([film_id, equipment_id])
  @@index([film_id])
}
```

**API Endpoints:**
- `GET /films/{id}/equipment` - List equipment assigned to this film
- `POST /films/{id}/equipment` - Assign equipment to film
- `POST /films/{id}/equipment/from-template/{templateId}` - Initialize from template
- `PATCH /films/{id}/equipment/{equipmentId}` - Update assignment
- `DELETE /films/{id}/equipment/{equipmentId}` - Remove assignment
- `GET /films/{id}/equipment/summary` - Get equipment counts by type

---

## Implementation Phases

### Phase 1: Equipment Library (Backend)
1. Create database schema for Equipment
2. Implement CRUD endpoints
3. Add equipment type management
4. Test with sample data

### Phase 2: Equipment Library (Frontend)
1. Create equipment list page (`/equipment`)
2. Create equipment form (add/edit)
3. Add equipment type filters
4. Add status indicators

### Phase 3: Package Templates (Backend)
1. Create database schema for templates
2. Implement template CRUD endpoints
3. Add template item management
4. Test with sample templates

### Phase 4: Package Templates (Frontend)
1. Create template list page
2. Create template builder UI
3. Add template preview
4. Add template application to films

### Phase 5: Film Equipment Assignment (Backend)
1. Create FilmEquipment schema
2. Implement assignment endpoints
3. Add template initialization logic
4. Add availability checking

### Phase 6: Film Equipment Assignment (Frontend)
1. Create film equipment tab/panel
2. Add equipment selector (from library)
3. Add "Apply Template" button
4. Add equipment summary display
5. Wire up to recording setup

---

## Current Fix: Handle Missing Endpoints Gracefully

**Immediate Action:**
Since the endpoints don't exist yet, we should handle the 404 errors gracefully in the UI.

**Update FilmEquipmentPanel.tsx:**
```typescript
// Option 1: Hide the equipment panel until feature is ready
if (!FEATURE_FLAGS.EQUIPMENT_MANAGEMENT) {
  return null;
}

// Option 2: Show "Coming Soon" message
return (
  <Box sx={{ p: 2 }}>
    <Alert severity="info">
      Equipment management is coming soon! You'll be able to assign cameras, 
      audio equipment, and other gear to your films.
    </Alert>
  </Box>
);

// Option 3: Mock data for now (development only)
const mockEquipment = [
  { id: 1, name: "Camera 1", type: "CAMERA" },
  { id: 2, name: "Camera 2", type: "CAMERA" },
  { id: 3, name: "Audio 1", type: "AUDIO" },
];
```

---

## Workflow Example

### Setup Phase (One-time per brand):
1. Admin adds equipment to library:
   - Sony A7III Camera #1
   - Sony A7III Camera #2
   - Rode Wireless GO #1
   - Rode Wireless GO #2

2. Admin creates package templates:
   - "2-Camera Wedding": 2x Camera, 2x Audio
   - "1-Camera Small Event": 1x Camera, 1x Audio
   - "3-Camera Corporate": 3x Camera, 4x Audio, 1x Lighting

### Film Creation Workflow:
1. User creates new film for "Johnson Wedding"
2. User selects template: "2-Camera Wedding"
3. System shows available equipment:
   - Camera 1: Sony A7III #1 ✓ Available
   - Camera 2: Sony A7III #2 ✓ Available
   - Audio 1: Rode Wireless GO #1 ✓ Available
   - Audio 2: Rode Wireless GO #2 ✓ Available
4. User confirms assignment
5. Equipment is marked as "IN_USE" for this film
6. Recording setup can now reference specific cameras

---

## Integration with Recording Setup

Once equipment is assigned to a film, the Recording Setup can reference it:

```typescript
// MomentRecordingSetup references FilmEquipment
model MomentRecordingSetup {
  // ... existing fields
  
  camera_assignments CameraSubjectAssignment[]
}

model CameraSubjectAssignment {
  id                Int    @id @default(autoincrement())
  recording_setup_id Int
  camera_equipment_id Int   // References FilmEquipment, not generic Equipment
  subject_id        Int
  
  recording_setup   MomentRecordingSetup @relation(...)
  camera           FilmEquipment @relation(...) // The actual camera assigned
  subject          FilmSubject @relation(...)
}
```

---

## Benefits

1. **Inventory Management**: Track all your physical equipment
2. **Availability Tracking**: Know what's in use vs. available
3. **Reusable Templates**: Quick setup for common shoot types
4. **Flexible Assignment**: Can override template choices per film
5. **Recording Setup Integration**: Know exactly which camera captured what
6. **Planning**: See equipment schedule across all films
7. **Reporting**: Track equipment usage, maintenance needs

---

## Next Steps

**Immediate (to fix current errors):**
1. Add graceful error handling to `FilmEquipmentPanel.tsx`
2. Add feature flag for equipment management
3. Show "Coming Soon" or hide the panel

**Short-term (Backend - Week 1-2):**
1. Implement Equipment Library schema and endpoints
2. Add sample equipment data for testing

**Medium-term (Frontend - Week 3-4):**
1. Build equipment library UI
2. Build equipment assignment UI for films

**Long-term (Templates - Week 5-6):**
1. Implement package templates
2. Add template application to film creation

---

## Questions to Answer

1. **Do you want to track equipment availability/scheduling?**
   - If yes, we need calendar integration
   - If no, simpler "assigned to film" tracking

2. **Do you want maintenance tracking?**
   - Service dates, repairs, etc.
   - Or just availability status?

3. **Do you want rental equipment support?**
   - Track owned vs. rented
   - Rental costs, return dates?

4. **How detailed should package templates be?**
   - Just types and quantities?
   - Or specific equipment models/preferences?

5. **Should equipment be required or optional on films?**
   - Can you create a film without assigning equipment?
   - Or is it required before certain stages?
