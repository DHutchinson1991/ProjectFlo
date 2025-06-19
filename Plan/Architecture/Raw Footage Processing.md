# 📹 Raw Footage Processing Architecture

<!-- ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ PROJECT METADATA ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ -->

🏷️ Project Name - ProjectFlo - The Creative OS  
🔢 Version - 1.0  
🗓️ Date - 18 June 2025

## 1. Overview 🎯

Raw footage processing in ProjectFlo operates separately from the component system. It's designed for clients who want access to unedited footage with various levels of technical processing applied.

## 2. Processing Levels (Technical Quality) ⚙️

### 2.1 Processing Level Options

**MINIMAL Processing**
- File organization by coverage scene
- Basic filename standardization
- No color correction or audio processing
- Original camera settings preserved
- Fastest turnaround time

**STANDARD Processing**  
- File organization and standardization
- Basic color correction (exposure, white balance)
- Audio level normalization
- Standard export format (H.264 MP4)
- Moderate processing time

**PREMIUM Processing**
- Full file organization and metadata
- Professional color grading
- Audio mastering and noise reduction
- Multiple export formats available
- Longest processing time but highest quality

### 2.2 Database Schema

```sql
-- Raw footage deliverables (separate from component system)
CREATE TABLE raw_footage_deliverables (
  id SERIAL PRIMARY KEY,
  build_id INT NOT NULL,
  deliverable_name VARCHAR(255) NOT NULL,
  processing_level processing_level_enum NOT NULL, -- MINIMAL, STANDARD, PREMIUM
  delivery_format delivery_format_enum NOT NULL,   -- MP4_H264, PRORES_422, ORIGINAL_CODEC
  selected_scenes TEXT, -- JSON array of coverage_scene_ids
  custom_moments TEXT,  -- JSON array of custom moment requests
  estimated_file_size_gb DECIMAL(8,2),
  processing_status processing_status_enum DEFAULT 'PENDING',
  delivery_deadline DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (build_id) REFERENCES builds(id) ON DELETE CASCADE
);

-- Custom moment requests for raw footage
CREATE TABLE raw_footage_moments (
  id SERIAL PRIMARY KEY,
  raw_footage_id INT NOT NULL,
  coverage_scene_id INT NOT NULL,
  moment_description TEXT NOT NULL,
  start_time_estimate TIME,
  end_time_estimate TIME,
  priority_level INT DEFAULT 5, -- 1-10 scale
  client_notes TEXT,
  FOREIGN KEY (raw_footage_id) REFERENCES raw_footage_deliverables(id) ON DELETE CASCADE,
  FOREIGN KEY (coverage_scene_id) REFERENCES coverage_scenes(id)
);

-- Processing status tracking
CREATE TYPE processing_status_enum AS ENUM (
  'PENDING',
  'IN_PROGRESS', 
  'PROCESSING_COMPLETE',
  'UPLOADING',
  'DELIVERED',
  'FAILED'
);
```

## 3. Scene Selection System 🎬

### 3.1 Coverage Scene Selection

Clients can select which coverage scenes they want raw footage from:

**Available Coverage Scenes** (Wedding Example):
- Bridal Preparation
- Ceremony Setup  
- Guest Arrival
- Ceremony Processional
- Ceremony Vows
- Ceremony Exit
- Cocktail Hour
- Reception Entrance
- First Dance
- Dinner Service
- Reception Dancing
- Bouquet Toss
- Departure

### 3.2 Custom Moment Selection

Within selected coverage scenes, clients can request specific moments:

**Example Custom Moments:**
- "Bride's reaction during vows" (Ceremony Vows scene)
- "Flower girl walking down aisle" (Ceremony Processional scene)  
- "Grandparents dancing" (Reception Dancing scene)
- "Best man's speech" (Reception Dinner scene)

### 3.3 Selection Interface

**Client Portal Interface:**
```typescript
// Scene selection component
interface SceneSelectionProps {
  availableScenes: CoverageScene[];
  selectedScenes: number[];
  onSceneToggle: (sceneId: number) => void;
}

// Custom moment request component  
interface MomentRequestProps {
  sceneId: number;
  onAddMoment: (moment: CustomMoment) => void;
}

type CustomMoment = {
  description: string;
  startTime?: string;
  endTime?: string;
  priority: number;
  notes?: string;
};
```

## 4. Processing Workflows 🔄

### 4.1 Processing Pipeline

**Step 1: Scene Filtering**
```typescript
async filterFootageByScenes(buildId: string, selectedScenes: number[]) {
  // Get all footage files for the build
  const allFootage = await getProjectFootage(buildId);
  
  // Filter by selected coverage scenes
  const filteredFootage = allFootage.filter(file => 
    selectedScenes.includes(file.coverage_scene_id)
  );
  
  return filteredFootage;
}
```

**Step 2: Moment Extraction**
```typescript
async extractCustomMoments(footage: FootageFile[], moments: CustomMoment[]) {
  // For each custom moment, identify relevant footage files
  // Extract time ranges based on moment requests
  // Flag high-priority moments for manual review
}
```

**Step 3: Processing Application**
```typescript
async applyProcessingLevel(footage: FootageFile[], level: ProcessingLevel) {
  switch (level) {
    case 'MINIMAL':
      return organizeAndRename(footage);
    case 'STANDARD':
      return organizeAndBasicProcess(footage);
    case 'PREMIUM':
      return organizeAndPremiumProcess(footage);
  }
}
```

### 4.2 Delivery Format Options

**MP4_H264**
- Universal compatibility
- Smaller file sizes
- Good for client review and sharing
- Standard web delivery format

**PRORES_422**  
- Professional editing format
- Larger file sizes but higher quality
- Preferred by professional editors
- Better for further post-production

**ORIGINAL_CODEC**
- Exactly as shot from camera
- Largest file sizes
- Perfect quality preservation
- For clients who want untouched files

## 5. Pricing & Estimation 💰

### 5.1 Pricing Factors

**Processing Level Impact:**
- MINIMAL: Base rate
- STANDARD: Base rate × 1.5
- PREMIUM: Base rate × 2.5

**Scene Quantity Impact:**
- Price per coverage scene selected
- Volume discounts for full-day coverage

**Custom Moment Impact:**
- Additional fee per custom moment
- Priority moments may have premium pricing

### 5.2 File Size Estimation

```typescript
function estimateDeliverySize(
  scenes: CoverageScene[],
  moments: CustomMoment[],
  format: DeliveryFormat
): number {
  // Base calculation
  let totalMinutes = scenes.reduce((sum, scene) => sum + scene.typical_duration, 0);
  
  // Add custom moments
  totalMinutes += moments.length * 5; // Assume 5 min per moment
  
  // Apply format multiplier
  const formatMultipliers = {
    MP4_H264: 0.1, // GB per minute
    PRORES_422: 1.0,
    ORIGINAL_CODEC: 2.0
  };
  
  return totalMinutes * formatMultipliers[format];
}
```

## 6. Client Experience 👥

### 6.1 Selection Process

**Step 1: Scene Selection**
- Visual grid of coverage scenes with thumbnails
- Duration and description for each scene
- Toggle selection with live price updates

**Step 2: Custom Moments**  
- For each selected scene, option to add custom moments
- Text description with optional time estimates
- Priority level selection (1-10)

**Step 3: Processing Options**
- Processing level explanation with examples
- Delivery format selection with file size estimates
- Estimated delivery timeline

**Step 4: Review & Approve**
- Summary of all selections
- Total price breakdown
- Estimated delivery date and file size

### 6.2 Progress Tracking

Clients can track raw footage processing status:
- **PENDING**: Request received, queued for processing
- **IN_PROGRESS**: Actively processing footage
- **PROCESSING_COMPLETE**: Processing done, preparing delivery
- **UPLOADING**: Uploading to delivery platform
- **DELIVERED**: Download links sent to client

This architecture provides flexibility for clients while maintaining clear processing workflows and realistic pricing based on technical complexity.
