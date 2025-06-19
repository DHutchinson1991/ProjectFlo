# 🎬 Domain Architecture

🏷️ Project Name - ProjectFlo - The Creative OS  
🔢 Version - 1.0  
🗓️ Date - 18 June 2025

---

This document combines the core domain architectures for ProjectFlo's wedding videography workflow: Coverage, Tasks, and Raw Footage Processing.

## 📹 Coverage Architecture

### Overview
Coverage represents the foundational filming requirements for wedding videography. It defines what needs to be captured during the wedding event to fulfill client deliverables.

### Coverage Types
- **Ceremony Coverage**: Processional, vows, rings, kiss, recessional
- **Reception Coverage**: Introductions, speeches, first dance, cake cutting
- **Portrait Coverage**: Couple portraits, family photos, bridal party
- **Detail Coverage**: Rings, dress, flowers, venue details
- **Candid Coverage**: Guest interactions, emotional moments

### Coverage Scenes
Each coverage type breaks down into specific scenes that must be captured:
- **Scene Requirements**: Specific shots needed (wide, medium, close-up)
- **Duration**: Minimum capture time for each scene
- **Priority**: Critical vs. optional scenes
- **Dependencies**: Scenes that must be captured together

### Coverage Data Model
```
Coverage
├── id: Unique identifier
├── name: Coverage type name
├── description: What this coverage entails
├── isRequired: Whether this coverage is mandatory
├── estimatedDuration: Expected filming time
└── scenes: Related CoverageScene records

CoverageScene
├── id: Unique identifier
├── coverageId: Parent coverage reference
├── name: Scene name
├── description: Scene requirements
├── priority: CRITICAL | HIGH | MEDIUM | LOW
├── estimatedDuration: Scene filming time
└── shotRequirements: Specific shots needed
```

---

## ✅ Tasks Architecture

### Overview
Tasks represent the actionable work items that need to be completed to deliver a wedding videography project. The task system orchestrates all work from pre-production planning through final delivery.

### Task Categories
- **Pre-Production Tasks**: Planning, scheduling, client consultation
- **Production Tasks**: Filming, coverage capture, equipment management
- **Post-Production Tasks**: Editing, color correction, audio mixing
- **Delivery Tasks**: Export, quality control, client handoff
- **Administrative Tasks**: Communication, invoicing, project management

### Task Generation
Tasks are automatically generated from component selections through the `ComponentTaskRecipe` system:
- **Recipe-Based Generation**: Each component type has predefined task templates
- **Hour Estimation**: Tasks include estimated duration for planning and pricing
- **Skill Requirements**: Tasks specify required contributor skills and experience
- **Dependencies**: Task ordering and prerequisite relationships
- **Resource Requirements**: Equipment, software, and asset needs

### Task Workflow
1. **Task Creation**: Generated from approved build configurations
2. **Assignment**: Tasks assigned to appropriate contributors based on skills
3. **Execution**: Contributors complete tasks with time tracking
4. **Review**: Quality assurance and approval process
5. **Completion**: Tasks marked complete and fed into next workflow stage

### Task Data Model
```
Task
├── id: Unique identifier
├── name: Task name
├── description: Task requirements
├── componentId: Associated component
├── contributorId: Assigned team member
├── status: PENDING | IN_PROGRESS | REVIEW | COMPLETE
├── plannedDurationHours: Estimated time
├── actualDurationHours: Tracked time
├── dueDate: Completion deadline
├── priority: Task priority level
└── dependencies: Prerequisites and relationships
```

---

## 📁 Raw Footage Processing Architecture

### Overview
Raw footage processing handles the delivery of unedited video files to clients who want access to source material. This system provides flexible processing levels and delivery options separate from the main component workflow.

### Processing Levels
- **MINIMAL**: Basic file organization and naming, no color correction
- **STANDARD**: File organization, basic color correction, format standardization  
- **PREMIUM**: Full color correction, audio sync, proxy file generation

### Delivery Formats
- **MP4_H264**: Universal compatibility for most devices and platforms
- **PRORES_422**: High-quality format for professional editing
- **ORIGINAL_CODEC**: Maintain original camera codec and settings
- **CUSTOM**: Client-specified format requirements

### Processing Workflow
1. **Scene Selection**: Client selects which coverage moments to include
2. **Processing Level**: Client chooses processing complexity
3. **Format Selection**: Client specifies delivery format preferences
4. **Processing Queue**: Files added to processing pipeline
5. **Quality Control**: Automated and manual quality checks
6. **Delivery Preparation**: Files organized and packaged for delivery
7. **Client Handoff**: Secure delivery via chosen method

### Raw Footage Data Model
```
RawFootageDeliverable
├── id: Unique identifier
├── buildId: Associated project
├── processingLevel: MINIMAL | STANDARD | PREMIUM
├── deliveryFormat: Format specification
├── scenes: Selected coverage scenes
├── status: PENDING | PROCESSING | COMPLETE
├── estimatedSize: File size estimate
├── deliveryMethod: How files will be delivered
└── completionDate: Processing completion

RawFootageScene
├── id: Unique identifier
├── deliverableId: Parent deliverable
├── coverageSceneId: Source coverage scene
├── includedShots: Specific shots to include
├── processingNotes: Special instructions
└── status: Individual scene processing status
```

### Integration with Main Workflow
- **Separate Pricing**: Raw footage has independent pricing structure
- **Parallel Processing**: Can be processed alongside main deliverables
- **Storage Management**: Efficient storage and archival of large files
- **Client Portal Integration**: Seamless delivery through client interface

---

## 🔗 Cross-Domain Integration

### Coverage → Components
- Coverage scenes drive component creation and requirements
- Component complexity calculated from coverage scene difficulty
- Scene timing influences component duration estimates

### Components → Tasks  
- Component selections automatically generate required tasks
- Task recipes define the work needed for each component type
- Component complexity affects task hour estimates and assignments

### Tasks → Deliverables
- Task completion drives deliverable assembly timeline
- Task quality gates ensure deliverable standards
- Task tracking provides project progress visibility

### Raw Footage → All Domains
- Raw footage delivery independent of main workflow
- Can reference same coverage scenes as components
- Separate task generation for processing workflows

---

*For detailed implementation of individual systems, see:*
- *[Component Architecture](Component Architecture.md) - Component creation and configuration*
- *[Deliverables Architecture](Deliverables Architecture.md) - Final product assembly*
- *[System Architecture](System Architecture.md) - Overall system integration*
