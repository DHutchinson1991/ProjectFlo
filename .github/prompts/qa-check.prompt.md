---
description: "QA check a page — find bugs, console errors, broken interactions, missing states, logic issues"
agent: "agent"
argument-hint: "Page URL path, e.g. /packages or /projects/123"
tools: ["playwright2"]
---

# QA Review: Functional Check

Navigate to `http://localhost:3001${input}` using **playwright2**. Log in and select **Moonrise** brand if needed.

## Rules
- Take JPEG screenshots (`type: "jpeg"`, `quality: 25`). Use `element` CSS selectors for specific components.
- Check `browser_console_messages` after every action.
- **NEVER call `browser_network_requests`**.
- Test like a real user — click everything, try edge cases, break things.

---

## 1. Page Load
- Does the page load without errors?
- Are there console errors or warnings?
- Do all sections/components render?
- Are loading states shown while data fetches?

## 2. Data Display
- Is data showing correctly? Any missing fields, wrong values, or "undefined"?
- Are empty states handled (no data scenario)?
- Are numbers, dates, currencies formatted correctly?
- Do lists/tables paginate or scroll properly?

## 3. Interactions
Click every button, link, toggle, tab, and dropdown on the page:
- Does each one do what it should?
- Are there dead buttons (click does nothing)?
- Do modals/dialogs open and close properly?
- Do forms validate inputs? Try submitting empty/invalid data.
- Does navigation work (back buttons, breadcrumbs, links)?

## 4. Edge Cases
- What happens with very long text? Does it truncate or overflow?
- Try rapid clicking — any double-submit issues?
- Refresh the page mid-flow — does state persist correctly?
- Try the browser back button — does it behave sensibly?

## 5. Error Handling
- Are error messages clear and helpful?
- If an API call fails, does the UI show a useful error or silently break?
- Are there any unhandled promise rejections in the console?

## Output
| # | Issue | Location | Severity | Description |
|---|-------|----------|----------|-------------|
| 1 | ...   | ...      | Critical/Major/Minor | ... |

Then list:
- **Console errors** found
- **Dead interactions** (buttons/links that do nothing)
- **Missing states** (loading, empty, error states not implemented)
