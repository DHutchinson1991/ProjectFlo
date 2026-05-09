---
mode: 'agent'
description: 'Quick feature diagram — generate and open in browser (no deep analysis)'
---

# Quick Feature Visualizer

Run the visualization script for the given `bucket/feature` (e.g. `content/moments`):

```
node tools/visualize-feature.js $ARGUMENTS
```

Then **open the generated HTML in the browser** using the `open_browser_page` tool with the file URI:
`file:///C:/Users/works/Documents/Code Projects/ProjectFlo/docs/feature-diagrams/{bucket}-{feature}.html`

Replace `{bucket}` and `{feature}` with the actual values from `$ARGUMENTS` (e.g. `content/moments` → `content-moments`).

That's it. No analysis file needed — just generate and open.
