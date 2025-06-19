# 📊 Business Model Overview

<!-- ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ PROJECT METADATA ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ -->

🏷️ Project Name - ProjectFlo - The Creative OS  
🔢 Version - 1.0  
🗓️ Date - 18 June 2025

<!-- ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ PURPOSE ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ -->

## 1. Purpose 🎯

This document provides a high-level overview of ProjectFlo's business model and data relationships, focusing on the key business concepts and how they flow through the system. It serves as a bridge between business requirements and technical implementation.

> **Key Objective:**  
> Explain how data flows through the system and how the core business entities relate to each other.

## 2. Business Context 💼

ProjectFlo is a **video production CRM and project management system**. While it's designed to handle various types of video production, we're initially seeding it with wedding videography data and focusing development on that vertical.

### Core Business Flow

```
Inquiry → Client → Project (Build) → Deliverables → Components → Tasks
```

1. **Inquiry**: Initial lead comes in
2. **Client**: Lead converts to client relationship  
3. **Project (Build)**: Client books a video production project
4. **Deliverables**: Project broken down into video products (e.g. "Feature Film", "Highlight Reel")
5. **Components**: Deliverables built from reusable components (e.g. "Ceremony Coverage", "Color Grading")
6. **Tasks**: Components generate specific work tasks for team members

## 3. Core Entity Relationships 🔗

### 3.1 Component Library Architecture

**ComponentLibrary** serves as the foundation for building flexible deliverables:

- **Coverage-based components**: Require filming (e.g. "Ceremony Processional", "Reception Dancing")
- **Production components**: Editing-only work (e.g. "Color Grading", "Audio Mixing")

**Key Relationships:**
- `ComponentLibrary` → `DeliverableAssignedComponents` (many-to-many with deliverables)
- `ComponentLibrary` → `ComponentTemplateDefaults` (default configurations per deliverable type)
- `ComponentLibrary` → `ComponentTaskRecipe` (generates specific work tasks)

### 3.2 Deliverable Configuration System

**Deliverables** are composed of multiple components with specific configurations:

- `DeliverableAssignedComponents`: Links components to deliverables with overrides
- `ComponentTemplateDefaults`: Defines which components are included by default in each deliverable type
- Supports editing style overrides, duration adjustments, and calculated pricing

### 3.3 Task Generation & Management

**Tasks** are automatically generated from approved configurations:

- Component selection → Task generation via `ComponentTaskRecipe`
- Tasks link to specific team members (`contributors`)
- Time tracking integration with external tools (Clockify)
- Progress feeds back into project health monitoring

## 4. Key Missing Elements 🚧

Based on our analysis, these areas need further documentation:

### 4.1 Music System Architecture
- Music that spans multiple components with timecode system
- Component-level music defaults and overrides
- Deliverable-level music configuration

### 4.2 Raw Footage Processing
- Separate from component system
- Processing levels: MINIMAL, STANDARD, PREMIUM
- Delivery formats: MP4_H264, PRORES_422, ORIGINAL_CODEC

### 4.3 Live Pricing Calculation
- Current algorithm unclear (complexity not used)
- Component base costs + overrides + style adjustments
- Real-time price updates in client portal

### 4.4 Task Generation Triggers
- Quote approval → component tasks
- Change orders → revision tasks
- Project milestones → administrative tasks

## 5. Next Steps 📋

1. **Create ER Diagram** showing current relationships
2. **Document music system architecture** with timecode approach
3. **Define live pricing algorithm** and document location
4. **Update System Architecture** with task generation workflows
5. **Add data access patterns** for different user roles
