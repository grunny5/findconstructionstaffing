# FSD: Agency Creation & Bulk Import

- **ID:** 011
- **Status:** Draft
- **Related Epic (from PKD):** Admin Portal / Database & Backend Core
- **Author:** Development Team
- **Last Updated:** December 29, 2025
- **Designs:** TBD

## 1. Problem & Goal

### Problem Statement

Currently, there is no way to add new agencies to the FindConstructionStaffing platform other than:

1. Running the seed script (developer-only, uses hardcoded mock data)
2. Direct database inserts via Supabase dashboard (DBA-only)

The existing **Agency Claim System** (Feature 008) only allows users to claim **existing** agencies in the database. If an agency doesn't exist, there's no self-service or admin workflow to create it.

As the platform grows, **Site Administrators** need the ability to:

- Manually add individual agencies discovered through research or outreach
- Bulk import hundreds of agencies from spreadsheets/CSV files (e.g., from industry databases, trade association lists, or partner data)

### Goal & Hypothesis

We believe that by building agency creation and bulk import capabilities for **Site Administrators**, we will:

1. Accelerate agency database growth from 12 to 100+ agencies
2. Enable rapid onboarding of agency data from external sources
3. Reduce manual database work and potential for data entry errors

We will know this is true when we see:

- 50+ agencies added via the admin interface within 30 days of launch
- Successful bulk imports of 20+ agencies per CSV upload
- Zero data integrity issues from imported agencies

## 2. User Stories & Acceptance Criteria

### Story 1: Admin Creates Individual Agency

> As a **Site Administrator**, I want **to create a new agency through the admin dashboard**, so that **I can add agencies discovered through research or outreach without direct database access**.

**Acceptance Criteria:**

- [ ] **Given** I am logged in as an admin, **When** I navigate to `/admin/agencies`, **Then** I see a "Create Agency" button.
- [ ] **Given** I click "Create Agency", **When** the form opens, **Then** I see fields for all agency properties (name, description, contact info, etc.).
- [ ] **Given** I fill in the required fields (name), **When** I submit the form, **Then** a new agency is created with `is_active=true` and `is_claimed=false`.
- [ ] **Given** the agency name already exists, **When** I submit the form, **Then** I see a validation error "An agency with this name already exists".
- [ ] **Given** the agency is created successfully, **When** the operation completes, **Then** a unique slug is auto-generated from the name.
- [ ] **Given** I provide invalid data (e.g., invalid URL format for website), **When** I submit, **Then** I see field-specific validation errors.

---

### Story 2: Admin Bulk Imports Agencies via CSV

> As a **Site Administrator**, I want **to upload a CSV file containing multiple agencies**, so that **I can quickly populate the database with data from external sources like trade associations or partner databases**.

**Acceptance Criteria:**

- [ ] **Given** I am on the admin agencies page, **When** I click "Bulk Import", **Then** I see a file upload interface accepting `.csv` and `.xlsx` files.
- [ ] **Given** I upload a valid CSV file, **When** the file is parsed, **Then** I see a preview of the agencies to be imported with validation status for each row.
- [ ] **Given** some rows have validation errors, **When** I review the preview, **Then** invalid rows are highlighted with specific error messages (e.g., "Missing required field: name", "Invalid email format").
- [ ] **Given** the preview shows valid data, **When** I click "Import", **Then** all valid agencies are created and I see a summary (X imported, Y skipped due to errors).
- [ ] **Given** an agency name in the CSV already exists, **When** I import, **Then** that row is skipped (not duplicated) and marked as "Already exists" in the summary.
- [ ] **Given** the import is successful, **When** I view the agencies list, **Then** all imported agencies appear with `is_active=true` and `is_claimed=false`.

---

### Story 3: Admin Downloads CSV Template

> As a **Site Administrator**, I want **to download a CSV template with the correct column headers**, so that **I can prepare bulk import data in the correct format**.

**Acceptance Criteria:**

- [ ] **Given** I am on the bulk import page, **When** I click "Download Template", **Then** a CSV file is downloaded with all supported column headers.
- [ ] **Given** I open the template, **When** I review the columns, **Then** I see headers for: `name`, `description`, `website`, `phone`, `email`, `headquarters`, `founded_year`, `employee_count`, `company_size`, `offers_per_diem`, `is_union`, `trades` (comma-separated), `regions` (comma-separated state codes).
- [ ] **Given** I fill in the template, **When** I upload it, **Then** the system correctly parses all columns.

---

### Story 4: Admin Views and Manages All Agencies

> As a **Site Administrator**, I want **to view all agencies (claimed and unclaimed) in a management interface**, so that **I can monitor the agency database and take administrative actions**.

**Acceptance Criteria:**

- [ ] **Given** I navigate to `/admin/agencies`, **When** the page loads, **Then** I see a table of all agencies with columns: Name, Status (Active/Inactive), Claimed (Yes/No), Owner, Created Date, Profile Completion.
- [ ] **Given** I view the agencies list, **When** I use the search box, **Then** I can filter by agency name.
- [ ] **Given** I view the agencies list, **When** I use filter dropdowns, **Then** I can filter by: Status (Active/Inactive), Claimed (Yes/No/All).
- [ ] **Given** I click on an agency row, **When** the detail view opens, **Then** I see all agency information and can edit any field.
- [ ] **Given** I edit an agency, **When** I save changes, **Then** the `updated_at` and `last_edited_by` fields are updated.

---

### Story 5: Admin Deactivates/Reactivates Agency

> As a **Site Administrator**, I want **to deactivate or reactivate an agency**, so that **I can remove agencies that are no longer in business or restore accidentally deactivated ones**.

**Acceptance Criteria:**

- [ ] **Given** I am viewing an active agency, **When** I click "Deactivate", **Then** I see a confirmation dialog explaining the consequences.
- [ ] **Given** I confirm deactivation, **When** the operation completes, **Then** `is_active` is set to `false` and the agency no longer appears in public search results.
- [ ] **Given** I am viewing an inactive agency, **When** I click "Reactivate", **Then** `is_active` is set to `true` and the agency reappears in public search results.
- [ ] **Given** an agency is claimed and I deactivate it, **When** the owner logs in, **Then** they see a banner explaining their agency has been deactivated by an admin.

---

### Story 6: Bulk Import Handles Trade and Region Associations

> As a **Site Administrator**, I want **the bulk import to create trade and region associations**, so that **imported agencies are fully searchable by specialty and location**.

**Acceptance Criteria:**

- [ ] **Given** a CSV row has a `trades` column with "Electrician, Plumber", **When** the agency is imported, **Then** the agency is linked to the matching trades in `agency_trades`.
- [ ] **Given** a CSV row has a `regions` column with "TX, CA, NY", **When** the agency is imported, **Then** the agency is linked to the matching regions in `agency_regions`.
- [ ] **Given** a trade name doesn't match any existing trade, **When** I review the preview, **Then** I see a warning "Unknown trade: [name] - will be skipped".
- [ ] **Given** a state code doesn't match any existing region, **When** I review the preview, **Then** I see a warning "Unknown region: [code] - will be skipped".

## 3. Technical & Design Requirements

### UX/UI Requirements

**Admin Agencies Page (`/admin/agencies`)**

- Agency list table with sorting and filtering
- "Create Agency" button in header
- "Bulk Import" button in header
- Search box for agency name
- Filter dropdowns for status and claimed state
- Pagination (20 agencies per page)

**Create Agency Modal/Page**

- Form with all agency fields
- Required field indicators
- Real-time validation
- Success/error toast notifications

**Bulk Import Interface**

- Drag-and-drop file upload zone
- File type validation (.csv, .xlsx)
- Preview table with validation status per row
- Import progress indicator
- Summary report after completion
- Download template button

### Technical Impact Analysis

#### Data Model

No schema changes required. Uses existing `agencies` table:

```sql
-- Existing agencies table (no changes needed)
agencies (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  website TEXT,
  phone TEXT,
  email TEXT,
  is_claimed BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  offers_per_diem BOOLEAN DEFAULT false,
  is_union BOOLEAN DEFAULT false,
  founded_year INTEGER,
  employee_count TEXT,
  headquarters TEXT,
  company_size TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  claimed_at TIMESTAMPTZ,
  claimed_by UUID REFERENCES auth.users(id),
  profile_completion_percentage INTEGER DEFAULT 0,
  last_edited_at TIMESTAMPTZ,
  last_edited_by UUID REFERENCES auth.users(id)
)
```

#### API Endpoints

| Method  | Endpoint                          | Description                    | Auth  |
| ------- | --------------------------------- | ------------------------------ | ----- |
| `GET`   | `/api/admin/agencies`             | List all agencies with filters | Admin |
| `POST`  | `/api/admin/agencies`             | Create single agency           | Admin |
| `GET`   | `/api/admin/agencies/[id]`        | Get agency details             | Admin |
| `PATCH` | `/api/admin/agencies/[id]`        | Update agency                  | Admin |
| `POST`  | `/api/admin/agencies/bulk-import` | Bulk import from CSV           | Admin |
| `GET`   | `/api/admin/agencies/template`    | Download CSV template          | Admin |

#### CSV Template Format

```csv
name,description,website,phone,email,headquarters,founded_year,employee_count,company_size,offers_per_diem,is_union,trades,regions
"ABC Staffing","Industrial staffing experts","https://abcstaffing.com","555-123-4567","contact@abc.com","Houston, TX",2005,"50-100","Medium",true,false,"Electrician,Welder,Pipefitter","TX,LA,OK"
```

#### Validation Rules

**Required Fields:**

- `name` - Must be non-empty, unique

**Optional Fields with Validation:**

- `website` - Valid URL format if provided
- `phone` - Valid phone format if provided
- `email` - Valid email format if provided
- `founded_year` - Integer between 1800 and current year
- `offers_per_diem` - Boolean (true/false, yes/no, 1/0)
- `is_union` - Boolean (true/false, yes/no, 1/0)
- `trades` - Comma-separated list of valid trade names
- `regions` - Comma-separated list of valid state codes

#### Non-Functional Requirements

- **Performance:** Bulk import should handle 500+ rows without timeout (streaming/chunked processing)
- **Security:** Admin-only access enforced via RLS and middleware
- **Data Integrity:** All imports wrapped in transactions for atomic operations
- **Audit Trail:** Log all agency creations with admin user ID and timestamp
- **Error Handling:** Detailed error messages for validation failures

### Dependencies

- **Feature 007:** Authentication system (admin role verification)
- **Feature 008:** Agency model and RLS policies (existing)
- **Library:** CSV parsing library (e.g., `papaparse` or `csv-parse`)
- **Library:** Excel parsing library (e.g., `xlsx` or `exceljs`) for .xlsx support

## 4. Scope

### In Scope (v1)

- Admin UI for agency management (`/admin/agencies`)
- Create individual agency form
- CSV bulk import with preview and validation
- CSV template download
- Trade and region association during import
- Agency deactivation/reactivation
- Basic search and filtering

### Out of Scope (v1)

- Self-service agency registration (public users creating agencies)
- Logo upload during bulk import (agencies start without logos)
- Bulk update of existing agencies (import only creates new)
- Export agencies to CSV (read-only export)
- Duplicate detection beyond exact name match
- Agency merge functionality
- Import history/audit log UI

### Future Enhancements (v2+)

- Self-service agency registration with admin approval workflow
- Bulk update existing agencies via CSV
- Import from external APIs (industry databases)
- Duplicate detection with fuzzy matching
- Agency merge tool for consolidating duplicates
- Export functionality

## 5. Open Questions

- [ ] Should we support .xlsx files in addition to CSV for bulk import?
- [ ] What is the maximum file size for bulk imports? (Suggested: 5MB)
- [ ] Should bulk import update existing agencies if name matches, or always skip?
- [ ] Do we need email notifications when agencies are created/deactivated?
- [ ] Should there be rate limiting on bulk imports to prevent abuse?

## 6. Success Metrics

| Metric                      | Target                          | Measurement    |
| --------------------------- | ------------------------------- | -------------- |
| Agencies added via admin UI | 50+ in first 30 days            | Database count |
| Successful bulk imports     | 5+ imports of 20+ agencies each | Import logs    |
| Data integrity errors       | 0                               | Error tracking |
| Admin task completion time  | <5 min for bulk import          | User feedback  |
| Validation accuracy         | 100% of invalid rows caught     | Testing        |

## 7. Implementation Phases

### Phase 1: Core Admin UI (Week 1)

- Admin agencies list page
- Create single agency form
- Basic search and filtering

### Phase 2: Bulk Import (Week 2)

- CSV template download
- File upload and parsing
- Preview with validation
- Import execution

### Phase 3: Management Features (Week 3)

- Agency edit functionality
- Deactivation/reactivation
- Trade/region association UI
- Polish and testing

## 8. Related Documents

- [Feature 008: Agency Claim and Profile Management](./008-agency-claim-and-profile-management.md)
- [Feature 007: Production Ready Authentication](./007-production-ready-authentication.md)
- [PROJECT_KICKSTART_V2.md](../../../PROJECT_KICKSTART_V2.md)
