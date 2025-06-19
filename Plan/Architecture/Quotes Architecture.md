# 💰 Quotes Architecture

🏷️ Project Name - ProjectFlo - The Creative OS  
🔢 Version - 1.0  
🗓️ Date - 18 June 2025

---

## Overview
The ProjectFlo quotes system provides comprehensive quote generation, management, and client interaction capabilities, from initial public inquiries through final contract approval. It serves as the critical bridge between lead generation and project execution.

## Core Concepts

### Quote Lifecycle
```
🌐 Public Inquiry → 📋 Quote Generation → 📧 Client Review → ✅ Approval → 🚀 Project Creation
```

### Quote Types
- **Public Quotes**: Generated from public quote configurator (no authentication required)
- **Admin Quotes**: Created by administrators with full system capabilities
- **Revised Quotes**: Updated quotes following client feedback or scope changes
- **Approved Quotes**: Finalized quotes that become active projects

### Quote States
```
DRAFT → SENT → UNDER_REVIEW → REVISED → APPROVED → EXPIRED
       ↓
   ARCHIVED ← REJECTED
```

## Public Quote Configurator

### Purpose & Functionality
The public quote configurator is a critical lead-generation tool that provides immediate value and transparency to potential clients through real-time pricing calculation.

### Core Features

#### Interactive Configuration Interface
- **Coverage Selection**: Choose wedding coverage requirements (ceremony, reception, portraits)
- **Equipment Options**: Select equipment levels (single shooter, dual shooter, drone coverage)
- **Editing Style Selection**: Choose video style (cinematic, documentary, artistic, traditional)
- **Deliverable Configuration**: Select final products (highlight reel, ceremony film, reception film)
- **Timeline Input**: Wedding date and desired delivery timeline

#### Real-Time Pricing Engine
- **Instant Calculations**: Prices update immediately as selections change
- **Transparent Breakdown**: Detailed cost breakdown by component and modifier
- **Multiple Quote Options**: Generate essential, professional, and premium packages
- **Smart Recommendations**: System suggests optimizations and alternatives

#### Lead Capture & Qualification
- **Contact Information**: Capture client details for follow-up
- **Budget Indicators**: Assess client budget alignment from selections
- **Preference Analysis**: Understand client priorities from configuration choices
- **Conversion Tracking**: Monitor configurator-to-booking conversion rates

### Data Model

#### Public Quote Schema
```
PublicQuote
├── id: Unique identifier
├── sessionId: Anonymous session tracking
├── contactInfo: Client contact information
├── weddingDate: Event date for pricing modifiers
├── venue: Wedding venue information
├── coverageRequirements: Selected coverage scenes
├── equipmentLevel: Equipment package selection
├── editingStyle: Visual style preference
├── deliverables: Selected final products
├── deliveryTimeline: Desired completion timeline
├── pricingSnapshot: Calculated pricing breakdown
├── leadSource: How client found configurator
├── status: DRAFT | SUBMITTED | CONVERTED | EXPIRED
├── createdAt: Quote creation timestamp
├── submittedAt: Lead submission timestamp
└── metadata: Additional configuration data

PublicQuoteComponent
├── id: Unique identifier
├── publicQuoteId: Parent quote reference
├── componentLibraryId: Component reference
├── quantity: Number of instances
├── customConfiguration: Component-specific settings
├── basePrice: Component base pricing
├── adjustedPrice: Price after modifiers
└── estimatedHours: Task hour estimation

PublicQuotePricing
├── id: Unique identifier
├── publicQuoteId: Parent quote reference
├── totalBaseHours: Sum of all task hours
├── basePrice: Hours × base rate
├── appliedModifiers: JSON array of modifier details
├── finalPrice: Price after all modifiers
├── priceValidUntil: Quote expiration date
└── calculatedAt: Pricing calculation timestamp
```

## Real-Time Pricing Calculation

### Pricing Flow Architecture
```
Client Selection Input
        ↓
Component Mapping & Selection
        ↓
Task Hour Calculation
        ↓
Modifier Application
        ↓
Real-Time Price Display
        ↓
Lead Capture & Quote Generation
```

### Component Selection Logic

#### Coverage-to-Component Mapping
```typescript
// Map client coverage selections to system components
const coverageMapping = {
  ceremony: [
    'ceremony_processional',
    'ceremony_vows_exchange', 
    'ceremony_ring_exchange',
    'ceremony_kiss_recessional'
  ],
  reception: [
    'reception_grand_entrance',
    'reception_first_dance',
    'reception_speeches',
    'reception_party_dancing'
  ],
  portraits: [
    'couple_portraits',
    'family_photos', 
    'bridal_party_photos'
  ]
};
```

#### Deliverable-to-Component Assembly
```typescript
// Map deliverable selections to required components
const deliverableMapping = {
  highlight_reel: [
    'title_sequence',
    'ceremony_highlights_component',
    'portrait_montage_component', 
    'reception_highlights_component',
    'closing_credits'
  ],
  ceremony_film: [
    'pre_ceremony_setup',
    'full_processional_sequence',
    'complete_vows_exchange',
    'ring_ceremony_full',
    'recessional_sequence'
  ]
};
```

### Dynamic Modifier Application

#### Seasonal Pricing Modifiers
```typescript
const seasonalModifiers = {
  PEAK_SEASON: {
    months: [5, 6, 7, 8, 9, 10], // May-October
    multiplier: 1.25,
    description: "Peak wedding season premium"
  },
  OFF_PEAK: {
    months: [11, 12, 1, 2, 3, 4], // Nov-April
    multiplier: 0.90,
    description: "Off-season discount"
  }
};
```

#### Equipment-Based Modifiers
```typescript
const equipmentModifiers = {
  SINGLE_SHOOTER: {
    multiplier: 1.0,
    description: "Standard single videographer"
  },
  DUAL_SHOOTER: {
    multiplier: 1.40,
    description: "Two videographer coverage"
  },
  DUAL_PLUS_DRONE: {
    multiplier: 1.40,
    fixedFee: 500,
    description: "Dual shooter plus drone footage"
  }
};
```

#### Timeline-Based Modifiers
```typescript
const timelineModifiers = {
  RUSH_JOB: {
    daysNotice: { lt: 30 },
    multiplier: 1.30,
    description: "Rush delivery premium"
  },
  STANDARD: {
    daysNotice: { gte: 30, lt: 90 },
    multiplier: 1.0,
    description: "Standard timeline"
  },
  EXTENDED: {
    daysNotice: { gte: 90 },
    multiplier: 0.95,
    description: "Extended timeline discount"
  }
};
```

## Quote Management System

### Admin Quote Creation
Comprehensive quote building interface for administrators with advanced configuration options.

#### Advanced Configuration Features
- **Custom Component Selection**: Choose specific components beyond standard packages
- **Detailed Task Customization**: Modify task hours and requirements per component
- **Client-Specific Pricing**: Apply custom pricing rules for repeat clients
- **Package Variations**: Create multiple quote options (essential, professional, premium)
- **Proposal Templates**: Use pre-built templates for common quote types

#### Quote Building Workflow
1. **Client Information**: Enter client details and wedding information
2. **Requirements Analysis**: Assess client needs and preferences
3. **Component Configuration**: Select and configure appropriate components
4. **Pricing Calculation**: Apply modifiers and calculate final pricing
5. **Quote Review**: Validate quote accuracy and completeness
6. **Client Presentation**: Generate professional quote document
7. **Follow-Up Management**: Track quote status and client interactions

### Quote Approval Workflow

#### Client Review Process
- **Quote Delivery**: Secure quote delivery via email or client portal
- **Interactive Review**: Client can review detailed breakdown and options
- **Question Handling**: Direct communication channel for client inquiries
- **Modification Requests**: Process scope changes and quote revisions
- **Digital Approval**: Secure electronic signature and approval process

#### Quote-to-Project Conversion
```typescript
// Automatic project creation upon quote approval
async approveQuote(quoteId: string, clientSignature: string) {
  // 1. Validate quote and signature
  const quote = await this.validateQuoteApproval(quoteId, clientSignature);
  
  // 2. Create project from quote
  const project = await this.createProjectFromQuote(quote);
  
  // 3. Generate initial task list
  const tasks = await this.generateProjectTasks(project);
  
  // 4. Set up client communication
  await this.initializeClientCommunication(project);
  
  // 5. Notify team of new project
  await this.notifyTeamOfNewProject(project);
  
  return project;
}
```

## Quote Variations & Packages

### Package Generation System
Automatic generation of multiple quote tiers to provide client options.

#### Essential Package
- **Core Coverage**: Ceremony and reception basics
- **Single Shooter**: One videographer coverage
- **Standard Editing**: Documentary style, basic transitions
- **Key Deliverable**: Highlight reel only
- **Pricing Target**: Budget-conscious clients

#### Professional Package  
- **Comprehensive Coverage**: Full ceremony and reception plus portraits
- **Dual Shooter**: Two videographer coverage for multiple angles
- **Enhanced Editing**: Cinematic style with advanced techniques
- **Multiple Deliverables**: Highlight reel plus ceremony film
- **Pricing Target**: Standard market positioning

#### Premium Package
- **Complete Coverage**: All coverage options plus detail shots
- **Premium Equipment**: Dual shooter plus drone coverage
- **Artistic Editing**: Full cinematic treatment with color grading
- **All Deliverables**: Highlight reel, ceremony film, reception film, raw footage
- **Pricing Target**: High-end market segment

### Smart Package Recommendations

#### Recommendation Engine
```typescript
// Analyze client selections and recommend optimal package
async generatePackageRecommendations(publicQuote: PublicQuote) {
  const clientBudgetIndicator = this.assessBudgetFromSelections(publicQuote);
  const complexityScore = this.calculateComplexityScore(publicQuote);
  const seasonalFactors = this.getSeasonalConsiderations(publicQuote.weddingDate);
  
  return {
    recommended: this.selectOptimalPackage(clientBudgetIndicator, complexityScore),
    alternatives: this.generateAlternativeOptions(publicQuote),
    savings: this.identifySavingOpportunities(publicQuote),
    upgrades: this.suggestValueUpgrades(publicQuote)
  };
}
```

#### Optimization Suggestions
- **Cost Savings**: "Save $200 by moving wedding to September (off-peak season)"
- **Value Additions**: "Add reception film for only $300 more (bundle discount applies)"
- **Equipment Options**: "Single shooter option saves $840 while maintaining quality"
- **Timeline Flexibility**: "Extended timeline discount available for bookings 90+ days out"

## Quote Analytics & Performance

### Quote Conversion Tracking
Comprehensive analytics to optimize quote performance and conversion rates.

#### Key Metrics
- **Configurator Usage**: Sessions, completions, abandonment points
- **Price Sensitivity**: Analysis of selections vs. final pricing acceptance
- **Conversion Rates**: Quote-to-booking conversion by package type
- **Revenue Impact**: Revenue generated from configurator leads
- **Client Behavior**: Configuration patterns and preference analysis

#### Conversion Optimization
- **A/B Testing**: Test different pricing presentations and package options
- **Price Point Analysis**: Identify optimal pricing thresholds for conversion
- **Feature Preference**: Understand which features drive conversion decisions
- **Seasonal Trends**: Analyze conversion patterns by season and timing

### Business Intelligence Integration

#### Quote Performance Dashboard
- **Lead Generation Metrics**: Configurator traffic and conversion rates
- **Revenue Pipeline**: Projected revenue from pending quotes  
- **Package Performance**: Which packages convert best and generate most revenue
- **Pricing Effectiveness**: Analysis of modifier impact on conversions
- **Client Segmentation**: Quote patterns by client type and budget range

#### Predictive Analytics
- **Conversion Probability**: Predict likelihood of quote approval based on selections
- **Revenue Forecasting**: Project revenue based on quote pipeline
- **Capacity Planning**: Anticipate resource needs from quote volume
- **Market Analysis**: Understand competitive positioning through quote feedback

## Integration Points

### With Pricing Engine
- **Real-Time Calculations**: Instant pricing updates during configuration
- **Modifier Application**: Automatic business rule application
- **Package Pricing**: Coordinated pricing across multiple deliverable options
- **Custom Pricing**: Support for client-specific pricing arrangements

### With Components System
- **Component Selection**: Map client requirements to system components
- **Configuration Validation**: Ensure component combinations are viable
- **Complexity Assessment**: Calculate project complexity from component selection
- **Resource Planning**: Estimate resource requirements from component choices

### With Tasks System
- **Task Generation**: Preview task lists for client understanding
- **Timeline Estimation**: Provide realistic delivery timeline estimates
- **Resource Allocation**: Plan contributor assignments from quote approval
- **Progress Tracking**: Convert quote commitments to project milestones

### With Client Communication
- **Quote Delivery**: Professional quote presentation and delivery
- **Follow-Up Automation**: Automated quote follow-up sequences
- **Approval Process**: Secure quote approval and contract execution
- **Project Onboarding**: Seamless transition from quote to active project

## Related Documents
- [Pricing Engine](Pricing Engine.md) - Detailed pricing calculation algorithms
- [Component Architecture](Component Architecture.md) - Component selection and configuration
- [Tasks Architecture](Tasks Architecture.md) - Task generation from quotes
- [Integration Architecture](Integration Architecture.md) - External system integrations for quote processing

## Timeline-Based Quote Configuration

#### Visual Timeline Quote Builder
The quote configurator integrates with timeline visualization to help clients understand deliverable structure and duration impact on pricing.

##### Timeline Quote Features
- **Deliverable Duration Visualization**: Real-time timeline shows how components create final deliverable length
- **Component Placement Preview**: Visual representation of selected components on timeline
- **Timeline-Based Pricing**: Different deliverable durations affect final quote pricing
- **Package Timeline Comparison**: Side-by-side visual comparison of Essential vs Professional vs Premium timelines

##### Client Timeline Interaction Flow
```
Client Coverage Selection → Component Auto-Selection → Timeline Generation → 
Duration Calculation → Pricing Adjustment → Visual Timeline Preview → Quote Finalization
```

#### Timeline Pricing Integration

##### Duration-Based Pricing Factors
- **Total Timeline Duration**: Longer timelines require more editing hours (affects pricing multipliers)
- **Component Density**: Number of components per minute affects editing complexity
- **Timeline Snap Precision**: Professional 5-second snap timing included in premium packages
- **Multi-Track Complexity**: Audio, video, and graphics track usage affects final pricing

##### Timeline Template Packages
```typescript
interface TimelinePackage {
  packageName: string;
  timelineDuration: number;    // Total duration in seconds
  componentCount: number;      // Number of timeline components
  snapPrecision: number;       // Snap interval (5 seconds for premium)
  trackLayers: string[];       // Available timeline tracks
  basePrice: number;           // Starting price for this timeline complexity
}

const timelinePackages = {
  essential: {
    packageName: 'Essential Package',
    timelineDuration: 180,      // 3 minutes
    componentCount: 5,          // Basic components
    snapPrecision: 15,          // 15-second snap
    trackLayers: ['video'],     // Video only
    basePrice: 1200
  },
  professional: {
    packageName: 'Professional Package', 
    timelineDuration: 420,      // 7 minutes
    componentCount: 12,         // Extended components
    snapPrecision: 5,           // 5-second snap
    trackLayers: ['video', 'audio'], // Video + Audio
    basePrice: 2500
  },
  premium: {
    packageName: 'Premium Package',
    timelineDuration: 900,      // 15 minutes
    componentCount: 20,         // Complete components
    snapPrecision: 5,           // 5-second snap
    trackLayers: ['video', 'audio', 'graphics'], // All tracks
    basePrice: 4500
  }
};
```

#### Real-Time Timeline Pricing

##### Dynamic Price Calculation
As clients adjust timeline components, pricing updates instantly based on:
- **Timeline Duration Change**: Adding/removing components changes total duration
- **Component Complexity**: Different component types have different hour multipliers
- **Track Usage**: Multi-track timelines (audio + video + graphics) increase complexity
- **Professional Precision**: 5-second snap vs 15-second snap affects pricing tier

##### Timeline Quote Generation Process
1. **Client Component Selection**: Choose coverage requirements and deliverable types
2. **Automated Timeline Assembly**: System generates timeline with optimal component placement
3. **Duration Calculation**: Calculate total timeline duration and complexity score
4. **Pricing Integration**: Timeline data feeds into pricing engine for hour calculation
5. **Visual Presentation**: Show client the timeline structure with pricing breakdown
6. **Template Persistence**: Save approved timeline as deliverable template for production
