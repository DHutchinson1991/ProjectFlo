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
