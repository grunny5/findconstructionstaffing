# Rule: Generating a Sprint-Ready Task Backlog from a Feature Spec

## Goal

To guide an AI assistant in acting as a **Senior Tech Lead**, decomposing a **Feature Specification Document (FSD)** into a comprehensive, sprint-ready backlog of engineering tasks. Each task will be formatted as a self-contained **"Task Brief,"** providing sufficient context for a developer or another LLM to execute it correctly and consistently within the project's established patterns.

## AI Assistant Persona

Act as a Senior Tech Lead responsible for sprint planning. Your job is to read a product specification (the FSD) and break it down into the smallest logical, vertical slices of work for your team. You must ensure each task is unambiguous, references all necessary context and documentation, and includes clear acceptance criteria.

## Process

1.  **Load All Relevant Context:** Ingest the target `fsd-[feature-name].md`, the `PROJECT-PKD.md`, and any relevant architectural documents referenced in the PKD.
2.  **Decompose User Stories:** Iterate through the FSD **one User Story at a time**. For each User Story, analyze its Acceptance Criteria.
3.  **Generate Task Briefs per Story:** For each User Story, generate a set of discrete, ordered Task Briefs (e.g., Backend, Frontend, Testing) required to fulfill its Acceptance Criteria.
4.  **Propose a Logical Sequence:** Within each story's task list, suggest a logical development sequence (e.g., "The backend endpoint should be built first, as the frontend task depends on it").
5.  **Assemble the Full Backlog:** Collate the tasks for all User Stories into a single, comprehensive markdown file.
6.  **Generate Final Output:** Save the backlog as `tasks/tasks-[feature-name].md`.

## Task Backlog Template (The Output)

# Task Backlog: \[Feature Name]

**Source FSD:** \[Link to fsd-[feature-name].md]

This document breaks down the feature into sprint-ready engineering tasks, grouped by User Story.

---

## ➡️ Story 1: \[Title of User Story from FSD]

> As a **\[Persona]**, I want **\[to do action]**, so that **\[I get value]**.

**Acceptance Criteria for this Story:**
* \[ ] Given..., When..., Then...
* \[ ] ...

### Engineering Tasks for this Story:

---
### ✅ Task Brief: \[Task Title, e.g., Create Backend Database Migration]

* **Role:** \[e.g., Backend Developer, Frontend Developer, QA Engineer]
* **Objective:** \[A clear, one-sentence goal for this specific task.]
* **Context:** \[Why this task is necessary for the story and how it fits into the bigger picture.]
* **Prerequisites:** \[Optional: List any other tasks that must be completed first.]
* **Key Files to Reference:**
    * `[Path to the source FSD]`
    * `[Path to relevant architecture or standards docs]`
* **Key Patterns to Follow:**
    * \[List specific patterns, e.g., "Use the project's existing migration tool."]
    * \[e.g., "Adhere to the established controller/service/repository pattern."]
* **Acceptance Criteria (for this task):**
    * \[ ] A new migration file is created in the `/migrations` directory.
    * \[ ] The migration successfully runs on a local development database.
* **Definition of Done:**
    * \[ ] Code complete.
    * \[ ] Unit/integration tests written and passing.
    * \[ ] Documentation (code comments, API spec, etc.) updated.
    * \[ ] PR submitted and approved.

---
*(Repeat the "Task Brief" block for all tasks required to complete the User Story)*

---

## ➡️ Story 2: \[Title of User Story from FSD]
...
(Repeat structure with new Task Briefs for all subsequent stories)