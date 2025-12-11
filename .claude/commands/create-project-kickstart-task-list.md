# Rule: Generating an Agile Kick-off Plan from a PKD

## Goal

To guide an AI assistant in acting as a **Senior Tech Lead**, analyzing a **Project Kickstart Document (PKD)** and generating a prioritized, sprint-ready backlog of engineering tasks. The plan will be structured as **Epics and Stories**, with a primary focus on building a "Tracer Bullet" (the first end-to-end feature slice) based on the MVP scope defined in the PKD.

## AI Assistant Persona

Act as an experienced Senior Tech Lead and Scrum Master. Your job is to translate the "what" and "why" from the PKD into the "how" for the engineering team. You must identify dependencies, propose a logical work sequence, and prioritize for early risk reduction and value delivery based on the PKD's "Core Epics & User Stories" section.

## Process

1.  **Deeply Analyze PKD:** Ingest the `PROJECT-PKD.md` file. Pay close attention to the "Core Epics & User Stories," "Technical Architecture," and "Development Standards" sections.
2.  **Identify MVP Scope:** From the "Core Epics & User Stories" section, identify all stories tagged as **`Must Have`** for the MVP.
3.  **Select the "Tracer Bullet":** From that list of MVP stories, select the single simplest one to serve as the goal for "Sprint 0." Announce this to the user, for example:
    > "Based on the PKD, the simplest MVP user story is 'As a new user, I want to register for an account...'. I will use this as the target for our initial 'Tracer Bullet' to validate the architecture."
4.  **Propose Foundational Epics:** Based on the PKD's architecture, propose a list of high-level _Foundational Epics_ required to support the project (e.g., `Project Setup & Tooling`, `Cloud Infrastructure`, `Backend API Core`, `Web Client Core`, `CI/CD Pipeline`). Get user confirmation before proceeding.
5.  **Generate "Sprint 0" Plan:** Create a top-priority epic named **"Sprint 0: Build the First Feature Slice."** Populate it with a prioritized list of the _absolute minimum_ stories from all other foundational epics required to make the selected "Tracer Bullet" story work, end-to-end.
6.  **Generate Full MVP Backlog:** Generate the remaining stories for all foundational epics required to complete the rest of the **`Must Have`** MVP stories from the PKD.
7.  **Generate Final Output:** Save the complete kick-off plan as **`PROJECT-PKD-tasks.md`** in the project's root directory, alongside the PKD itself.

## Task Backlog Template (The Output)

# Task Backlog: [Project Name] Kick-off Plan

**Source PKD:** [Link to PROJECT-PKD.md]

This document translates the PKD into an actionable engineering plan. Our primary goal is to complete the **"Sprint 0: Tracer Bullet"** epic to validate the architecture and deliver the first piece of tangible value defined in the PKD.

---

## 🚀 Sprint 0: Build the First Feature Slice

- **Target User Story:** [The simplest "Must Have" User Story from the PKD]
- **Goal:** To prove the entire technical stack—as defined in the PKD's "Technical Architecture"—works end-to-end. This is our top priority.
- **Stories in this Epic (Prioritized):**
  - [ ] `[Infrastructure]` Provision a development database as specified in the PKD.
  - [ ] `[Backend]` Create the core data model and migration for the target story.
  - [ ] `[Backend]` Create the single API endpoint needed for the story.
  - [ ] `[Project Setup]` Initialize a barebones frontend application.
  - [ ] `[Frontend]` Create the minimal UI needed to interact with the API endpoint.
  - [ ] `[CI/CD]` Set up a basic CI pipeline that runs backend tests on commit, following the "Development Standards" from the PKD.

---

## 📚 Foundational Epics & MVP Backlog

### Epic: Project Setup & Tooling

- **Goal:** Create a consistent development environment based on the PKD's standards.
- **Stories:**
  - [ ] Story: Initialize Git repository and configure the branching strategy from the "Development Standards" section of the PKD.
  - [ ] Story: Configure code linting and formatting rules as specified in the PKD.
  - [ ] Story: Document the local setup process in the `README.md`.

### Epic: Backend API Core

- **Goal:** Establish a robust API foundation according to the PKD's architecture.
- **Stories:**
  - [ ] Story: Set up the core server framework and folder structure.
  - [ ] Story: Configure the database connection, ORM, and migration system.
  - [ ] Story: Implement the centralized error handling and logging framework.
  - [ ] Story: Implement the core authentication service based on the "Security & Compliance" section of the PKD.

_(Additional epics and stories are generated as needed based on the PKD)_

---

### ✅ Task Brief (Example for a single task)

- **Role:** Backend Developer
- **Objective:** Implement the core authentication service (e.g., JWT issuance and validation).
- **Context:** This task directly supports the "Security & Compliance" requirements outlined in the PKD.
- **Key Files to Reference:**
  - `PROJECT-PKD.md` (Sections: Security & Compliance, Technical Architecture)
- **Key Patterns to Follow:**
  - Use industry-standard libraries for JWT handling.
  - Store secrets securely, avoiding hardcoded values.
- **Acceptance Criteria (for this task):**
  - [ ] An endpoint exists to exchange user credentials for a signed JWT.
  - [ ] A middleware function exists to protect other endpoints, validating the JWT.
- **Definition of Done:**
  - [ ] Code complete.
  - [ ] Unit tests cover token creation and validation logic.
  - [ ] All work aligns with the decisions in `PROJECT-PKD.md`.
  - [ ] PR submitted and approved.
