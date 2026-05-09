---
description: "UX deep-dive — creative ideas to make a page dramatically better, simpler, more intuitive"
agent: "agent"
argument-hint: "Page URL path, e.g. /packages or /settings"
tools: ["playwright2"]
---

# UX Redesign Review

Navigate to `http://localhost:3001${input}` using **playwright2**. Log in and select **Moonrise** brand if needed.

## Rules
- Take JPEG screenshots (`type: "jpeg"`, `quality: 25`). Use `element` CSS selectors for specific components.
- **NEVER call `browser_network_requests`**.
- Think like a **product designer**, not a developer. Focus on what the user feels, not how it's built.
- Be bold. Suggest real changes — not just "add a tooltip". Think about fundamentally better ways to present information and guide the user.
- Reference best-in-class SaaS products (Linear, Notion, Stripe Dashboard, Figma) for inspiration where relevant.

---

## 1. First Impression (5-second test)
Screenshot the page. Then answer honestly:
- If you saw this for the first time, would you know what to do?
- What's the single most important action on this page? Is it obvious?
- What's competing for attention that shouldn't be?
- Does the page feel calm or overwhelming?

## 2. Information Architecture
- Is the hierarchy right? Most important info → most prominent position?
- Is anything hidden that should be front-and-center?
- Is anything shown that could be tucked away (progressive disclosure)?
- Are labels and terminology clear to someone who's never used the app?
- Would a first-time user need a tutorial, or is it self-explanatory?

## 3. User Flow
- What's the user trying to accomplish on this page?
- How many clicks/steps does it take? Can it be fewer?
- Are there unnecessary confirmations or intermediate screens?
- Is the happy path obvious? Does the page guide you through it?
- What happens after the user completes the main action — is the next step clear?

## 4. Visual & Emotional Design
- Does the page feel premium or utilitarian?
- Is whitespace used effectively, or is it cramped/sparse?
- Are related items visually grouped? Unrelated items separated?
- Do colors communicate meaning (success, warning, status)?
- Are there any opportunities for delight (animations, micro-interactions, clever copy)?

## 5. Empty & Onboarding States
- If this page had zero data, what would the user see?
- Is there a compelling empty state that guides them to take action?
- Could an illustration, example data, or quick-start guide help?
- For power users: is there a fast path that skips onboarding?

## 6. Bold Ideas
Propose **3-5 creative redesign ideas** for this page. For each:
- **What:** One-sentence description of the change
- **Why:** What user problem it solves
- **Inspiration:** Reference a product that does this well (if applicable)
- **Effort:** Low / Medium / High to implement

Think beyond incremental fixes. Consider:
- Could the entire layout be rethought?
- Could two separate pages be merged into one?
- Could a complex form become a guided wizard (or vice versa)?
- Could data visualization replace a table?
- Could AI/smart defaults eliminate manual steps?
- Could drag-and-drop replace click-based workflows?

## Output

### Page Assessment
One paragraph: what works, what doesn't, overall grade (A-F) for UX quality.

### Quick Wins (do these now)
| # | Change | Impact | Effort |
|---|--------|--------|--------|
| 1 | ...    | High/Med/Low | Low |

### Bold Redesign Ideas
Detailed descriptions of 3-5 bigger ideas with mockup-level specificity — describe exact layouts, component choices, and user flows.

### Inspiration References
Links or descriptions of how other products solve similar problems well.
