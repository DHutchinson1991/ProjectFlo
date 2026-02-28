# Proposal Builder v2.0 - "The Interactive Sales Microsite"

## 🎯 Vision
Transform our proposals from static "documents" into **interactive, cinematic microsites** that emotionally engage couples and drive higher conversion rates through psychology and interactivity.

---

## 🏗️ Technical Architecture

### 1. Data Model (JSON Structure)
Instead of a single text blob, the `content` field in the `proposals` database table will store an ordered array of "Sections".

```typescript
interface ProposalContent {
  theme: 'cinematic-dark' | 'clean-light' | 'soft-romance'; // Global style
  meta: {
    personalVideoUrl?: string; // For the "Loom-style" bubble
    expirationDate?: string;   // For the countdown
  };
  sections: ProposalSection[];
}

type ProposalSection = 
  | HeroSection 
  | TextSection 
  | PricingSection 
  | MediaSection 
  | InteractiveSection;

interface BaseSection {
  id: string; // UUID for React keys
  type: 'hero' | 'text' | 'pricing' | 'media' | 'interactive';
  isVisible: boolean;
}
```

### 2. Core Components
*   **`ProposalBuilder` (Container)**: Manages the state of `sections[]`. Handles "Add Section", "Move Up/Down", "Delete".
*   **`SectionRenderer`**: A switch component that takes a section data object and renders the correct component (e.g., `<HeroBlock />`).
*   **`BlockLibrary`**: The menu for adding new sections.

---

## 🧩 The Block Library (Innovative Features)

### 1. 🎬 `HeroBlock` (The "Hook")
*   **Function**: Full-screen landing area.
*   **Features**:
    *   Background: Auto-playing silent video loop (slow motion) or high-res image.
    *   Text: Title (e.g., "Jessica & Michael"), Date, Subtitle.
    *   **Innovation**: "Scroll to Start" animation to encourage engagement.

### 2. 📝 `TextBlock` (The "Narrative")
*   **Function**: Rich text for letters, "Our Approach", and contract terms.
*   **Tech**: Uses `EditorJS` (dynamically imported to fix SSR issues) for a distraction-free writing experience.

### 3. 💰 `PricingBlock` (The "Closer")
*   **Function**: Displays the investment.
*   **Innovation**: **"Smart Integration"**
    *   **Admin View**: Dropdown to select an existing `Quote` ID.
    *   **Client View**: Displays the selected Quote.
    *   **Interactivity**: Allows clients to toggle "Optional Add-ons" on/off (if configured in the Quote), watching the "Total Investment" update in real-time.

### 4. 🎞️ `MediaBlock` (The "Proof")
*   **Function**: Showcases portfolio work.
*   **Features**: Embed YouTube/Vimeo links.
*   **Innovation**: A "Cinema Mode" that dims the rest of the page when played.

### 5. ⚡ `InteractiveBlock` (The "Connection")
*   **Function**: "Vibe Check" or Mini-Questionnaire.
*   **Experiential**: "Which style fits you best?" (3 video thumbnails: Cinematic, Docu, Music Video).
*   **Logic**: Saves the client's selection to the database so you know their preference before the contract call.

---

## 🛣️ Implementation Roadmap

### Phase 1: Foundation (Immediate Fixes) 🛑
1.  **Fix SSR Crash**: Refactor the current `EditorJS` implementation to use Next.js `dynamic()` imports so the page actually loads.
2.  **State Migration**: Refactor `page.tsx` to hold a `sections` array state instead of a single editor instance.
3.  **Skeleton UI**: Build the vertical "Canvas" layout and the `Add Section` button.

### Phase 2: Core Blocks 🧱
1.  **Build `HeroBlock`**: Inputs for Title, Date, Image URL.
2.  **Refactor `TextBlock`**: Wrap EditorJS in a contained block component.
3.  **Build `PricingBlock`**: Connect it to the `quotesService` to fetch and render specific quotes.

### Phase 3: The "Wow" Factor ✨
1.  **Personal Video**: Add the "Loom-style" floating bubble component.
2.  **The Viewer**: Create the specialized "Public View" page (read-only) that the client actually sees.
3.  **Motion**: Add Framer Motion for smooth entrances/transitions.

---

## ❓ Questions for You
1.  **Default Structure**: Should a new proposal start blank, or with a default template (Hero -> Text -> Pricing)?
2.  **Asset Hosting**: For the "Hero Video", do you have URLs (Vimeo/S3), or do we need to build a file uploader?
