# Feature Documentation

This directory contains detailed specifications for all features implemented in FindConstructionStaffing.

## Active Features

Features currently in development:

- [006 - CI/CD Pipeline](./active/006-cicd-pipeline.md) - GitHub Actions workflows for automation

## Completed Features

Features that have been fully implemented:

1. [001 - Supabase Infrastructure](./completed/001-supabase-infrastructure.md) - Database setup and configuration
2. [002 - Agencies API Endpoint](./completed/002-agencies-api-endpoint.md) - REST API for agency data
3. [003 - Database Seed Script](./completed/003-database-seed-script.md) - Automated data seeding
4. [004 - Agencies API Refactor](./completed/004-agencies-api-refactor.md) - API improvements and optimization
5. [005 - Test Standardization](./completed/005-test-standardization.md) - Unified testing approach
6. [006 - Frontend API Connection](./completed/006-frontend-api-connection.md) - UI integration with backend
7. [008 - Agency Claim and Profile Management](./completed/008-agency-claim-and-profile-management.md) - Complete claim workflow and profile editing

## Feature Naming Convention

Features follow a 3-digit numbering system:

```
NNN-feature-name.md
```

Where:

- `NNN` = 3-digit sequential number (001, 002, 003...)
- `feature-name` = kebab-case description

## Feature Template

When creating new features, use this structure:

```markdown
# Feature NNN: Feature Name

## Overview

Brief description

## Requirements

What needs to be implemented

## Implementation

How it was/will be implemented

## Testing

Test coverage and verification

## Documentation

Related docs and guides
```

## Status Legend

- **Active**: Currently being worked on
- **Completed**: Fully implemented and merged to main
- **Planned**: Designed but not started
- **Deprecated**: No longer relevant

---

**Last Updated**: 2025-12-23
