# 👑 Epic Specification: The Administrator Experience

<!-- ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ PROJECT METADATA ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ -->

🏷️ Project Name - ProjectFlo - The Creative OS  
🔢 Version - 1.0  
🗓️ Date - 11 June 2025

<!-- ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ EPIC OVERVIEW ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ -->

## 1. Epic Overview 🎯

**Goal:** To equip internal power users with tools for automation, control, and business intelligence.

> **Success Metric:**  
> A central command center that automates repetitive work and provides the data needed to make smart, profitable decisions.

<!-- ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ CORE PERSONA ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ -->

## 2. Core Persona: The Administrator 🎭

### Profile

- **Who they are:** The internal power user (Project Manager, Owner) responsible for the health of the business
- **Primary Goals:** Efficiency, profitability, and control
- **Key Motivations:** Process optimization and business growth

---

## 📖 User Stories & Acceptance Criteria

| As an... 👑 | I want to... 💡                                                                        | So that I can... ✅                                                    | Acceptance Criteria (AC) 📋                                                                                                                                                                                                                       |
| :---------- | :------------------------------------------------------------------------------------- | :--------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Admin**   | manage all my business "ingredients" (scenes, deliverables, etc.) from a central panel | update my company's offerings without needing a developer.             | - Full CRUD (Create, Read, Update, Delete) functionality for all catalog tables (e.g., `deliverables`, `task_templates`).<br>- Changes must be reflected instantly in the client-facing configurator.                                             |
| **Admin**   | define the "recipes" that link client choices to actual production tasks               | have full control over the bottom-up pricing and workflow.             | - The UI must allow creating rules in `component_task_recipes`.<br>- A rule must link a combination of deliverable/scene/style to a specific `task_template`.<br>- A `priority` field must exist to resolve conflicts.                            |
| **Admin**   | use AI to suggest tasks and estimate hours for a new service                           | set up new offerings quickly and with greater accuracy.                | - A button "Suggest Tasks with AI" should exist on the service creation page.<br>- The system must send the service description to an LLM and parse the structured response into suggested `task_templates`.                                      |
| **Admin**   | view a master dashboard of all builds, filterable by status                            | get a real-time overview of my entire sales pipeline and project load. | - The dashboard must display all records from the `builds` table.<br>- Must be filterable by `status` (Inquiry, Booked, etc.).<br>- Must be searchable by client name.                                                                            |
| **Admin**   | receive instant notifications for key events like new inquiries                        | react quickly to business-critical events.                             | - A new inquiry must trigger a real-time notification in the admin UI via WebSockets.<br>- A record must be created in the `notifications` table.                                                                                                 |
| **Admin**   | view a detailed breakdown of a project's profitability, comparing price vs. cost       | make data-driven decisions about my pricing and services.              | - A "Profitability" tab must exist on the project page.<br>- It must calculate Total Revenue (from `approved_price`) vs. Total Costs (sum of `rate_at_time_of_assignment` \* `actual_duration_hours` from all tasks).                             |
| **Admin**   | manage a central contacts database                                                     | have a single record for every person we interact with.                | - A dedicated "Contacts" page with full CRUD functionality.<br>- The system must prevent the creation of a contact with a duplicate email address.                                                                                                |
| **Admin**   | track the lead source for every inquiry                                                | measure the ROI of my marketing efforts.                               | - The `inquiries` table must have a `lead_source` field.<br>- This field must be exposed on the inquiry creation form and be filterable in reports.                                                                                               |
| **Admin**   | use AI to draft communications like quote follow-ups                                   | save time while maintaining a professional brand voice.                | - A "Draft with AI" button should be present in communication fields.<br>- The system should send a prompt (e.g., "Draft a polite follow-up for a quote sent 3 days ago") to an LLM and populate the text area with the response.                 |
| **Admin**   | apply a percentage-based discount to a change order                                    | handle special pricing situations in an auditable way.                 | - The change order modal must have fields for `discount_type` ('Percentage' or 'Fixed'), `discount_amount`, and `discount_reason`.<br>- The discount must be logged in the `build_change_orders` table and reflected in the new `approved_price`. |
