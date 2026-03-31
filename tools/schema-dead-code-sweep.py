"""
Schema dead code sweep — removes 27 dead models, 10 dead enums,
dangling relation fields in live models, and deprecated column fields.

Run from repo root:  python tools/schema-dead-code-sweep.py
"""

import re
import sys
from pathlib import Path

SCHEMA = Path("packages/backend/prisma/schema.prisma")

# ── 1. Model blocks to delete entirely ───────────────────────────────────────
DEAD_MODELS = {
    "film_categories",
    "FilmMusicTrack",
    "FilmEquipment",
    "FilmTimelineTracks",
    "editing_styles",
    "PricingModifier",
    "permissions",
    "role_permissions",
    "inquiry_wizard_questions",
    "discovery_questionnaire_questions",
    "client_users",
    "event_tags",
    "tags",
    "project_assets",
    "payments",
    "project_expenses",
    "audit_log",
    "notifications",
    "activities",
    "documents",
    "client_feedback_surveys",
    "calendar_sync_tokens",
    "TimelineEditingSession",
    "task_library_benchmarks",
    "SceneMomentTemplate",
    "SceneTemplateSuggestedSubject",
    "EventDaySubjectRole",
}

# ── 2. Enum blocks to delete entirely ────────────────────────────────────────
DEAD_ENUMS = {
    "ProcessingLevel",
    "DeliveryFormat",
    "calendar_sync_status",
    "MediaType",
    "PricingModifierType",
    "project_asset_type",
    "document_status",
    "activity_type",
    "activity_status",
    "calendar_sync_provider",
}

# ── 3. Relation fields to drop from specific live models ─────────────────────
# Each entry: (model_name, exact_field_name_prefix_pattern)
# Using python regex that matches the full line
DEAD_RELATIONS = {
    "contacts": {
        r"\s+activities\s+activities\[\]",
        r"\s+event_attendees\s+event_attendees\[\]",
    },
    "Crew": {
        r"\s+activities_assigned\s+activities\[\]",
        r"\s+audit_logs\s+audit_log\[\]",
        r"\s+calendar_sync_token\s+calendar_sync_tokens\?",
        r"\s+notifications_received\s+notifications\[\]",
        r"\s+task_library_benchmarks\s+task_library_benchmarks\[\]",
        r"\s+timeline_sessions\s+TimelineEditingSession\[\]",
    },
    "projects": {
        r"\s+activities\s+activities\[\]",
        r"\s+documents\s+documents\[\]",
        r"\s+project_assets\s+project_assets\[\]",
        r"\s+project_expenses\s+project_expenses\[\]",
        r"\s+client_feedback_surveys\s+client_feedback_surveys\[\]",
    },
    "inquiries": {
        r"\s+activities\s+activities\[\]",
        r"\s+documents\s+documents\[\]",
    },
    "filmLibrary": {
        r"\s+equipment\s+FilmEquipment\[\]",
        r"\s+timeline_tracks\s+FilmTimelineTracks\[\]",
        r"\s+music_tracks\s+FilmMusicTrack\[\]",
        r"\s+timeline_sessions\s+TimelineEditingSession\[\]",
    },
    "clients": {
        r"\s+client_user\s+client_users\?",
    },
    "SystemRole": {
        r"\s+role_permissions\s+role_permissions\[\]",
    },
    "workflow_templates": {
        r"\s+editing_styles\s+editing_styles\[\]",
    },
    "coverage": {
        r"\s+project_assets\s+project_assets\[\]",
    },
    "calendar_events": {
        r"\s+event_tags\s+event_tags\[\]",
    },
    "SubjectRole": {
        r"\s+event_day_subject_roles\s+EventDaySubjectRole\[\]",
    },
    "EventDay": {
        r"\s+subject_roles\s+EventDaySubjectRole\[\]",
    },
    "SceneTemplate": {
        r"\s+moments\s+SceneMomentTemplate\[\]",
        r"\s+suggested_subjects\s+SceneTemplateSuggestedSubject\[\]",
    },
    "SubjectTemplate": {
        r"\s+suggested_scenes\s+SceneTemplateSuggestedSubject\[\]",
    },
    "task_library": {
        r"\s+task_library_benchmarks\s+task_library_benchmarks\[\]",
    },
    "inquiry_wizard_templates": {
        r"\s+questions\s+inquiry_wizard_questions\[\]",
    },
    "discovery_questionnaire_templates": {
        r"\s+questions\s+discovery_questionnaire_questions\[\]",
    },
}

# ── 4. Specific column fields to drop from live models ────────────────────────
# These are deprecated columns in ProjectLocationSlot
DEAD_COLUMNS = {
    "ProjectLocationSlot": {
        # Match the whole line including trailing comment
        r"  name\s+String\?.*@deprecated.*\n",
        r"  address\s+String\?.*@deprecated.*\n",
    },
}


def remove_blocks(text: str, block_type: str, names: set) -> tuple[str, int]:
    """Remove entire model or enum blocks."""
    removed = 0
    for name in names:
        # Match: optional leading blank line + block header ... closing }
        pattern = rf"\n*(model|enum) {re.escape(name)} \{{[^}}]*(?:\{{[^}}]*\}}[^}}]*)?\}}\n?"
        # Use a proper brace-counting approach via line-by-line pass
        lines = text.split("\n")
        new_lines = []
        i = 0
        found = False
        while i < len(lines):
            line = lines[i]
            header_match = re.match(rf"^(model|enum) {re.escape(name)} \{{", line)
            if header_match:
                found = True
                removed += 1
                # Skip until matching closing brace
                depth = line.count("{") - line.count("}")
                i += 1
                while i < len(lines) and depth > 0:
                    depth += lines[i].count("{") - lines[i].count("}")
                    i += 1
                # Skip up to one trailing blank line
                if i < len(lines) and lines[i].strip() == "":
                    i += 1
                continue
            new_lines.append(line)
            i += 1
        text = "\n".join(new_lines)
    return text, removed


def remove_relation_lines(text: str, dead_relations: dict) -> tuple[str, int]:
    """Remove specific relation field lines from live model bodies."""
    removed = 0
    lines = text.split("\n")
    new_lines = []
    current_model = None
    i = 0
    while i < len(lines):
        line = lines[i]
        # Track which model we're in
        model_match = re.match(r"^model (\w+) \{", line)
        if model_match:
            current_model = model_match.group(1)
            new_lines.append(line)
            i += 1
            continue

        if current_model and current_model in dead_relations:
            dead = False
            for pattern in dead_relations[current_model]:
                if re.match(pattern + r"\s*$", line):
                    dead = True
                    removed += 1
                    break
            if dead:
                i += 1
                continue

        new_lines.append(line)
        i += 1
    return "\n".join(new_lines), removed


def remove_deprecated_columns(text: str, dead_columns: dict) -> tuple[str, int]:
    """Remove deprecated column field lines from specific live models."""
    removed = 0
    for model_name, patterns in dead_columns.items():
        for pattern in patterns:
            new_text, count = re.subn(pattern, "", text)
            if count:
                removed += count
                text = new_text
    return text, removed


def collapse_multiple_blanks(text: str) -> str:
    """Collapse 3+ consecutive blank lines down to 2."""
    return re.sub(r"\n{4,}", "\n\n\n", text)


def main():
    if not SCHEMA.exists():
        print(f"ERROR: {SCHEMA} not found. Run from repo root.", file=sys.stderr)
        sys.exit(1)

    original = SCHEMA.read_text(encoding="utf-8")
    stats = {}

    text = original

    # Step 1: Remove dead model blocks
    text, stats["models"] = remove_blocks(text, "model", DEAD_MODELS)
    print(f"  Removed {stats['models']} dead model blocks")

    # Step 2: Remove dead enum blocks
    text, stats["enums"] = remove_blocks(text, "enum", DEAD_ENUMS)
    print(f"  Removed {stats['enums']} dead enum blocks")

    # Step 3: Remove dangling relation fields
    text, stats["relations"] = remove_relation_lines(text, DEAD_RELATIONS)
    print(f"  Removed {stats['relations']} dangling relation fields")

    # Step 4: Remove deprecated columns
    text, stats["deprecated"] = remove_deprecated_columns(text, DEAD_COLUMNS)
    print(f"  Removed {stats['deprecated']} deprecated column fields")

    # Step 5: Clean up whitespace
    text = collapse_multiple_blanks(text)

    before = original.count("\n") + 1
    after = text.count("\n") + 1
    print(f"\n  Lines: {before} → {after}  (removed {before - after})")

    SCHEMA.write_text(text, encoding="utf-8")
    print(f"  Written: {SCHEMA}")


if __name__ == "__main__":
    main()
