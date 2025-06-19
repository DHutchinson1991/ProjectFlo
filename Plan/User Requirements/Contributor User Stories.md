# 🎨 Epic Specification: The Contributor Experience

<!-- ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ PROJECT METADATA ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ -->

🏷️ Project Name - ProjectFlo - The Creative OS  
🔢 Version - 1.0  
🗓️ Date - 11 June 2025

<!-- ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ EPIC OVERVIEW ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ -->

## 1. Epic Overview 🎯

**Goal:** To empower creative team members with the context and tools they need to produce their best work efficiently.

> **Success Metric:**  
> A focused workspace that minimizes administrative overhead and maximizes creative output.

<!-- ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ CORE PERSONA ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ -->

## 2. Core Persona: The Contributor

- **Who they are:** The internal production team member (e.g., Editor, Videographer) who performs the hands-on creative work.
- **Motivations:** They are driven by clarity, efficiency, and a desire to focus on their craft.
  > **Success Looks Like:** A personalized dashboard that provides all the context and assets needed for a task upfront, removing ambiguity and allowing them to get into a creative flow state.

<!-- ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ USER STORIES & ACCEPTANCE CRITERIA ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ -->

## 3. User Stories & Acceptance Criteria

| As a... 🎬      | I want to... 💡                                                                  | So that I can... ✅                                | Acceptance Criteria (AC) 📋                                                                                                                                                                                                                            |
| :-------------- | :------------------------------------------------------------------------------- | :------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Contributor** | see a personalized dashboard of all tasks assigned to me, ordered by due date    | know exactly what I need to work on next.          | - The dashboard must query the `tasks` table for the logged-in `contributor_id`.<br>- Tasks must be sorted by `due_date` (ascending, with nulls last).<br>- Each task card must be clickable and lead to the task detail view.                         |
| **Contributor** | click into a task and see all relevant context and a clear creative brief        | work efficiently without asking for clarification. | - The task detail view must display the task name, description, and any associated notes.<br>- It must link to the parent project and component.                                                                                                       |
| **Contributor** | easily see the planned hours for a task                                          | understand the time budget for my work.            | - The `planned_duration_hours` for the task must be prominently displayed.<br>- A visual indicator should show `actual_duration_hours` vs. `planned_duration_hours`.                                                                                   |
| **Contributor** | have my time automatically synced from our time-tracking tool (Clockify)         | not have to manually enter time logs.              | - The system must periodically (e.g., hourly) poll the Clockify API for new time entries.<br>- Time entries with a matching task ID in their description must be used to update the `actual_duration_hours` field on the corresponding `tasks` record. |
| **Editor**      | see direct links to relevant project assets (e.g., Frame.io files) within a task | find the media I need instantly.                   | - If a task is linked to a `project_asset` that has a `storage_path` pointing to Frame.io, that link must be displayed and clickable within the task view.                                                                                             |
| **Contributor** | view my personal performance benchmarks (average time vs. company targets)       | understand and improve my own efficiency.          | - A "My Performance" page must show a table of `task_templates` the user has worked on.<br>- It must compare their `contributor_average_hours` against the master `average_duration_hours` for that task template.                                     |
