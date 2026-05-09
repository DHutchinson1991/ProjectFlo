---
description: "Review a frontend page visually using the browser, check for design issues, console errors, and broken API calls"
agent: "agent"
argument-hint: "Page URL path or feature to review, e.g. /projects or /calendar"
tools: ["playwright"]
---

## Visual Frontend Review

Navigate to `http://localhost:3001${input}` in the Playwright browser (log in if needed, select Moonrise brand).

### Step 1 — Screenshot & Layout Review
Take a JPEG screenshot (type: "jpeg", quality: 25) of the page. For specific components, use an `element` CSS selector to target just that area. Evaluate:
- Overall layout and spacing — does it look balanced?
- Component alignment — are cards, tables, headers properly aligned?
- Typography — correct sizes, weights, no truncation issues?
- Empty states — if no data, is there a proper empty state?
- Responsive fit within the 1280×900 viewport

### Step 2 — Design System Compliance
Check against the ProjectFlo design system ([frontend-design-system.instructions.md](.github/instructions/frontend-design-system.instructions.md)):
- Are glass cards, status chips, and surface colours using design tokens?
- Are MUI components used (not raw HTML for layout/inputs)?
- Do page headers follow the standard pattern?

### Step 3 — Console Errors
Read `browser_console_messages` and report any errors. Ignore React dev-mode warnings.

### Step 4 — Network Health
Check for failed API requests (4xx/5xx responses). For each failure, report:
- URL and method
- Status code
- Brief description of what it was trying to do

### Output
Provide a concise report with:
1. **Screenshot** of the page
2. **Issues found** — list with severity (critical/minor/cosmetic)
3. **API failures** — if any
4. **Console errors** — if any
5. **Suggestions** — quick wins to improve the page
