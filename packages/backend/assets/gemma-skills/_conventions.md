# Shared Conventions

These conventions apply to all skills in the pipeline. Skill-specific rules follow after this section.

## JSON Output

- Return **ONLY** valid JSON unless the skill explicitly says otherwise (e.g. Prompt Stylist returns plain text).
- Include every field in the output schema. Do not add extra fields.
- No markdown fences, no explanation outside the JSON.

## Emphasis Taxonomy

Three levels of subject importance. Always UPPERCASE.

| Level | Meaning | SD Attention Weight |
|---|---|---|
| `PRIMARY` | Main subject of this camera/moment | 1.2–1.4 |
| `SECONDARY` | Supporting subject, visible and relevant | 1.0–1.1 |
| `BACKGROUND` | Ambient presence, low rendering detail | 0.7–0.9 |

Only **one** subject per camera should be `PRIMARY` per moment (exceptionally two for mutual-focus scenes like vow exchange).

### Targeting → Emphasis

- `isTargeted: true` → almost always `PRIMARY` or `SECONDARY` (editorial intent: this camera is assigned to film them).
- `isTargeted: false` → almost always `SECONDARY` or `BACKGROUND` (visible bystander).
- **Exception:** A non-targeted subject in extreme-foreground may be promoted to `SECONDARY` (they'd look wrong at low weight) but never `PRIMARY`.

## Gaze Direction

Be specific — `"toward groom"`, `"down at rings"`, `"at officiant"`, `"to camera"`. Never vague like `"focused"` or `"looking"`.

| Moment Type | Typical Gazes |
|---|---|
| Processional | Bride → aisle ahead; Groom → Bride; Guests → aisle |
| Vow Exchange | Bride ↔ Groom (mutual); Officiant → couple |
| Ring Exchange | Both → hands/ring; Officiant → hands |
| First Kiss | Bride ↔ Groom (eyes closed); Guests → couple |
| Toasts | Speaker → audience; Couple → speaker; Guests → speaker |
| First Dance | Bride ↔ Groom; Guests → dance floor |
| Cake Cutting | Both → cake/knife; Guests → couple |
| Bouquet Toss | Bride → over shoulder; Crowd → bouquet |

## Group Subjects

Groups (Guests, Bridesmaids, Groomsmen) get **collective** visual descriptions:
- Good: `"seated in rows, some watching ceremony, some wiping tears, formal attire"`
- Bad: `"standing"` (too vague for Stable Diffusion)

## Scene Timeline Awareness

- **Early moments** (index 0–1): anticipation, setup, stillness.
- **Mid moments**: main action, peak emotion.
- **Late moments**: resolution, joy, transition.
- The moment BEFORE a climax should build tension. The moment AFTER should show release.

## Anti-Patterns

| Problem | Why It Fails |
|---|---|
| Moving subjects to new positions | Positions are ground truth from the floorplan |
| Generic actions ("standing", "sitting") | Too vague for SD to render meaningful output |
| Actions contradicting the moment | "Dancing" during vows makes no sense |
| Ignoring gaze for close-ups | Where someone looks IS the shot in a close-up |
| Everyone staring at camera | Only for posed photos, rarely in ceremony |
| Over-dramatic descriptions | "Tears streaming, trembling" for a toast is excessive |
| Ignoring timeline context | "Walking down aisle" when processional already happened |
