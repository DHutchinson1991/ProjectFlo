# 👥 Epic Specification: The Client Experience

<!-- ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ PROJECT METADATA ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ -->

🏷️ Project Name - ProjectFlo - The Creative OS  
🔢 Version - 1.0  
🗓️ Date - 11 June 2025

<!-- ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ EPIC OVERVIEW ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ -->

## 1. Epic Overview 🎯

**Goal:** To provide clients with a modern, transparent, and empowering digital experience throughout their entire journey.

> **Success Metric:**  
> A seamless client portal that makes complex decisions easy and keeps clients informed and confident.

<!-- ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ CORE PERSONA ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ -->

## 2. Core Persona: The Client

- **Who they are:** The end customer, often planning a significant life event. They are investing a considerable amount of money and emotion into our services.
- **Motivations:** They crave transparency, convenience, and confidence.
  > **Success Looks Like:** A seamless, intuitive online portal where they can see everything in one place and feel like an empowered, collaborative partner.

<!-- ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ USER STORIES & ACCEPTANCE CRITERIA ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ -->

## 3. User Stories & Acceptance Criteria

### Core Client Experience

| As a... 🙋‍♀️           | I want to... 💡                                                                 | So that I can... ✅                                                 | Acceptance Criteria (AC) 📋                                                                                                                                                                                   |
| :------------------- | :------------------------------------------------------------------------------ | :------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Potential Client** | use an interactive configurator to select scenes, deliverables, and styles      | get an instant, accurate price for my unique vision.                | - Selections must be presented clearly.<br>- Total price must update in real-time (<200ms lag).<br>- The URL must be shareable, preserving the selected configuration.                                        |
| **Client**           | view a single, clear "Build Sheet" page showing my entire package               | have a single source of truth for what I am purchasing.             | - The page must list all selected deliverables, components, and billable items.<br>- It must clearly display the `approved_price`.<br>- A printable/PDF version must be available.                            |
| **Client**           | be able to make changes to my package after I've booked                         | have the flexibility to refine my vision as plans evolve.           | - The interface must clearly distinguish between the `approved_price` and the `live_price` of the new configuration.<br>- Changes must trigger a formal Change Order process.                                 |
| **Client**           | review and formally approve a "Change Order" before price changes are confirmed | feel secure and in control of my total investment.                  | - The change order must clearly show the price delta and the new total.<br>- An explicit "Approve Change Order" button must be present.<br>- Approval must require re-authentication (e.g., password entry).  |
| **Client**           | see a clear financial summary showing the approved price, payments, and balance | always know where I stand financially.                              | - The summary must show `total_approved_price`, `total_paid`, and `balance_due`.<br>- It must list all individual invoices and their payment status.                                                          |
| **Client**           | receive automated email notifications for key events                            | be kept informed without having to constantly log in.               | - Emails must be sent for: New Invoice, Payment Confirmation, Change Order Approval, and Key Milestone Completion.<br>- Emails must be professionally branded and contain a direct link to the relevant page. |
| **Client**           | view a high-level, interactive timeline of my project's progress                | see key milestones and feel confident my project is moving forward. | - The timeline must visualize key project phases (e.g., Pre-Production, Post-Production).<br>- Completed milestones must be clearly marked.<br>- It **must not** expose granular internal tasks.              |
| **Client**           | securely view and pay invoices online                                           | manage my payments conveniently via Stripe.                         | - The system must integrate with Stripe's Payment Intents API.<br>- Payment status must be updated automatically upon successful transaction.<br>- The transaction must be logged in the `payments` table.    |

### Enhanced Deliverable Configuration Experience

| As a... 🙋‍♀️           | I want to... 💡                                                                 | So that I can... ✅                                                 | Acceptance Criteria (AC) 📋                                                                                                                                                                                   |
| :------------------- | :------------------------------------------------------------------------------ | :------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Potential Client** | explore different video components to understand what's included in each deliverable | make informed decisions about my video package.                     | - Interactive component library with descriptions and examples.<br>- Visual representation of coverage-based vs. production components.<br>- Clear explanation of how components combine into deliverables.      |
| **Client**           | configure music preferences for my video deliverables                          | ensure my videos match my personal style and wedding theme.         | - Music type selection interface (orchestral, piano, modern, vintage, scene-matched).<br>- Music preview functionality for different component types.<br>- Multi-track music configuration for highlight reels. |
| **Client**           | select raw footage processing and delivery options                              | receive raw footage in the format that best suits my needs.         | - Processing level selection with clear descriptions (minimal, standard, premium).<br>- Delivery format options with file size and quality explanations.<br>- Scene selection interface for custom moments.   |
| **Client**           | see how my component selections affect the total project complexity and price   | understand the value and pricing of my custom configuration.        | - Real-time complexity visualization as components are selected.<br>- Price breakdown showing component contributions.<br>- Clear explanation of how complexity affects final pricing.                          |
| **Client**           | preview how my selected components will work together in the final deliverable  | visualize the final video product before committing.                | - Visual timeline showing component sequencing.<br>- Style and music compatibility indicators.<br>- Coverage requirement visualization for selected components.                                               |
| **Client**           | request specific moments or scenes for raw footage deliverables                 | get exactly the footage I want from my wedding day.                 | - Custom moment request interface with scene descriptions.<br>- Time-based moment selection from coverage timeline.<br>- Special request notes for unique footage needs.                                      |
| **Client**           | understand delivery timelines for different deliverable configurations          | plan around when I'll receive my video products.                    | - Timeline visualization showing delivery dates for each deliverable.<br>- Complexity-based delivery estimate explanations.<br>- Milestone-based progress tracking for complex deliverables.                  |
| **Client**           | make changes to component selection and music preferences after booking         | refine my vision as wedding planning evolves.                       | - Component modification interface with change order integration.<br>- Music preference updates with approval workflow.<br>- Impact assessment showing price and timeline changes.                           |
| **Client**           | approve deliverable configurations with detailed breakdowns                     | feel confident about exactly what I'm purchasing.                   | - Comprehensive deliverable breakdown with all selected components.<br>- Music and style selections clearly displayed.<br>- Coverage requirements and timeline summary.                                       |
| **Client**           | track the progress of individual video components within my deliverables        | understand where we are in the production process.                  | - Component-level progress tracking within deliverable timeline.<br>- Visual indicators for coverage-based component filming status.<br>- Production component editing progress updates.                      |
