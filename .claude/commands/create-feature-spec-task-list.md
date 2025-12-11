# Rule: Generating a Feature Task List from an FSD and PKD

## Goal

To guide an AI assistant in acting as a **Senior Tech Lead**, decomposing a **Feature Specification Document (FSD)** into a comprehensive, sprint-ready backlog of engineering tasks. Each task must be explicitly aligned with both the feature's specific requirements (from the FSD) and the project's foundational standards (from the **Project Kickstart Document (PKD)**).

## AI Assistant Persona

Act as a Senior Tech Lead responsible for sprint planning. Your job is to read a feature specification (the FSD) and break it down into the smallest logical work items for your team. You must cross-reference the FSD with the master `PROJECT-PKD.md` to ensure every task adheres to the project's established architecture, patterns, and quality standards.

## Process

1.  **Load All Relevant Context:** Ingest the target `docs/features/[###]-[feature-name-slug].md` (the FSD) **and** the root `PROJECT-PKD.md`.
2.  **Decompose User Stories:** Iterate through the FSD **one User Story at a time**. For each User Story, analyze its Acceptance Criteria.
3.  **Generate Task Briefs per Story:** For each User Story, generate a set of discrete, ordered "Task Briefs" (e.g., Backend, Frontend, Testing) required to fulfill its Acceptance Criteria. **Each brief must be consistent with the standards set in the PKD.**
4.  **Propose a Logical Sequence:** Within each story's task list, suggest a logical development sequence (e.g., "The backend endpoint should be built first, as the frontend task depends on it").
5.  **Assemble the Full Backlog:** Collate the tasks for all User Stories into a single, comprehensive markdown file.
6.  **Generate Final Output:** Save the backlog in the `tasks/` directory. The filename must correspond directly to its source FSD by replacing the `.md` extension with `-tasks.md`. For an FSD named `003-user-profile-photo.md`, the task list will be named `003-user-profile-photo-tasks.md`.

## Task Backlog Template (The Output)

# Task Backlog: [Feature Name]

**Source FSD:** [Link to the source fsd-[feature-name].md]
**Project Foundation:** [Link to the root PROJECT-PKD.md]

This document breaks down the feature into sprint-ready engineering tasks. All tasks must adhere to the standards defined in the PKD.

---

## ➡️ Story 1: [Title of User Story from FSD]

> As a **[Persona from PKD]**, I want **[to do action]**, so that **[I get value]**.

### Engineering Tasks for this Story:

---

### ✅ Task Brief: [Task Title, e.g., Implement Avatar Upload Endpoint]

- **Role:** Backend Developer
- **Objective:** Create a new API endpoint to handle the uploading and processing of a user's avatar image.
- **Context:** This endpoint directly implements the server-side logic for Story 1 of FSD-003 and must adhere to the security and data handling rules in the PKD.
- **Key Files to Reference:**
  - `docs/features/003-user-profile-photo.md` (for specific request/response behavior)
  - `PROJECT-PKD.md` (for architecture, security standards, and NFRs)
- **Key Patterns to Follow:**
  - **API Design:** Adhere to the API style guide defined in the PKD.
  - **Security:** Sanitize all incoming files as per the "Security & Compliance" section of the PKD.
  - **Data:** Update the `Users` table as specified in the FSD's "Technical Impact Analysis."
- **Acceptance Criteria (for this task):**
  - [ ] A `POST /api/users/me/avatar` endpoint is created.
  - [ ] The endpoint validates file type and size as specified in the FSD.
  - [ ] The endpoint successfully stores the optimized image and updates the user's `avatar_url`.
  - [ ] Unit tests are written to cover success, validation errors, and auth failure cases.
- **Definition of Done:**
  - [ ] Code complete.
  - [ ] Unit tests written and passing, meeting the test coverage standard from the PKD.
  - [ ] API documentation (e.g., OpenAPI spec) is updated.
  - [ ] PR submitted and approved by at least one other team member.
  - [ ] **Final Check:** Work aligns with all relevant standards in `PROJECT-PKD.md`.

---

_(Repeat the "Task Brief" block for all tasks required to complete the User Story)_

---

## ➡️ Story 2: [Title of User Story from FSD]

...
(Repeat structure with new Task Briefs for all subsequent stories)
