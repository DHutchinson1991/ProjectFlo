---
description: "UX review a multi-page user journey — flow, transitions, friction points, and creative redesign ideas"
agent: "agent"
argument-hint: "Describe the journey, e.g. 'setting up a package from scratch' or 'inquiry to signed contract'"
tools: ["playwright2"]
---

# UX Journey Review

Review the end-to-end user journey: **${input}**

Use **playwright2** at `http://localhost:3001`. Log in and select **Moonrise** brand if needed.

## Rules
- Take JPEG screenshots (`type: "jpeg"`, `quality: 25`). Use `element` CSS selectors for specific components.
- **NEVER call `browser_network_requests`**.
- Think like a **product designer** walking through the flow for the first time.
- Focus on the journey as a whole — not just individual pages. Transitions, context-carrying, and momentum matter.
- Reference best-in-class SaaS products (Linear, Notion, Stripe, Figma, HubSpot) for inspiration.
- Be bold and opinionated.

---

## Phase 1 — Map the Journey

Before clicking anything, figure out the journey:
1. What pages/screens are involved?
2. What's the user's goal at the start? What does "done" look like?
3. Navigate to the starting point and begin.

## Phase 2 — Walk Through It

Go through the journey step by step as a real user would. At each step:

### Per-page check (keep brief — 2-3 bullets max):
- Screenshot the page.
- What is the user supposed to do here? Is it obvious?
- Any friction, confusion, or dead ends?

### Between pages, evaluate transitions:
- Does the user know where they are in the overall flow? (progress indicator, breadcrumbs, step counter)
- Is context carried forward? (e.g., if I picked "Wedding" in step 1, does step 2 acknowledge that?)
- Does the page load feel fast, or is there a jarring blank/loading moment?
- After completing an action, is the next step obvious? Or does the user get dumped somewhere unexpected?

## Phase 3 — Flow Critique

After completing the journey, assess the whole flow:

### Friction Map
List every moment where the user had to think, hesitate, or make an unclear choice:
| Step | Friction Point | Severity | Why it's confusing |
|------|---------------|----------|-------------------|

### Drop-off Risks
Where would a real user give up and leave? Why?

### Missing Guardrails
- Can the user accidentally skip a critical step?
- Can they lose work (no auto-save, no confirmation)?
- Can they recover from mistakes (undo, go back, edit later)?

### Unnecessary Steps
Are there screens/clicks/confirmations that could be eliminated entirely?

## Phase 4 — Redesign Ideas

Propose **3-5 ideas** to make this journey dramatically better:

For each idea:
- **What:** Describe the change in detail — layout, components, flow
- **Why:** What user problem does it solve?
- **Before → After:** Describe the current experience vs the proposed one
- **Inspiration:** A product that does something similar well
- **Effort:** Low / Medium / High

Think about:
- Could multiple steps be collapsed into one smart screen?
- Could defaults/AI eliminate decisions the user doesn't care about?
- Could a preview/summary travel with the user throughout the flow?
- Could drag-and-drop or inline editing replace separate pages?
- Could the journey be non-linear (let users do steps in any order)?
- Could a "template" or "duplicate" flow skip the whole journey for repeat users?

## Output

### Journey Score
Grade A-F with one paragraph explaining why.

### Flow Diagram
Describe the current flow as: `Page A → action → Page B → action → Page C`
Then propose the improved flow.

### Quick Wins
| # | Change | Impact | Effort |
|---|--------|--------|--------|
| 1 | ...    | High/Med/Low | Low |

### Bold Redesign Ideas
Detailed write-ups of 3-5 ideas.

### Competitive Inspiration
How do other products handle similar journeys? What can we steal?
