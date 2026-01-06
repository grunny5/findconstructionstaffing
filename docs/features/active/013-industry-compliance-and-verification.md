# FSD: Industry Compliance & Verification

- **ID:** 013
- **Status:** Draft
- **Related Epic (from PKD):** Industry Compliance & Verification (NEW)
- **Author:** Development Team
- **Last Updated:** January 6, 2026
- **Designs:** TBD

## 1. Problem & Goal

### Problem Statement

Construction companies require assurance that staffing agencies meet industry compliance standards before engaging their services. Currently, there is no way for agencies to display their certifications, insurance coverage, or compliance credentials on their profiles. This forces contractors to conduct manual verification through phone calls or email exchanges, slowing down the hiring process and reducing trust in the platform.

**Key Compliance Requirements in Construction Staffing:**

- OSHA safety training certification
- Drug testing policies
- Background check capabilities
- Workers' compensation insurance
- General liability insurance
- Bonding/surety bonds

Without visibility into these credentials, contractors cannot quickly identify agencies that meet their project requirements, and agencies cannot differentiate themselves based on their compliance posture.

### Goal & Hypothesis

We believe that by building **comprehensive compliance tracking and display capabilities** for **Agency Owners** and **Site Administrators**, we will achieve **increased trust and faster contractor-agency matching**. We will know this is true when we see:

- 50%+ of agencies with at least one compliance field populated
- Increased use of compliance filters in search
- Faster average time from agency view to contact initiation

## 2. User Stories & Acceptance Criteria

---

### Story 1: Agency Owner Manages Compliance Settings

> As an **Agency Owner**, I want **to add, edit, and remove compliance certifications from my agency profile**, so that **contractors can see my agency's qualifications and compliance status at a glance**.

**Acceptance Criteria:**

- [ ] **Given** an agency owner is on their dashboard, **When** they navigate to the compliance settings section, **Then** they see a form with toggle switches for each compliance type.
- [ ] **Given** an agency owner toggles a compliance item (e.g., OSHA Certified), **When** they save the form, **Then** the compliance status is persisted to the database.
- [ ] **Given** an agency has existing compliance data, **When** the owner opens the compliance settings, **Then** the existing values are pre-populated.
- [ ] **Given** an agency owner provides an expiration date for a certification, **When** they save, **Then** the expiration date is stored and displayed on the profile.
- [ ] **Given** an agency owner removes a compliance item (sets to false/unchecked), **When** they save, **Then** the compliance badge no longer appears on the public profile.

---

### Story 2: Admin Manages Agency Compliance

> As a **Site Administrator**, I want **to add, edit, and remove compliance items from any agency's profile**, so that **I can assist agencies with their profiles or correct inaccurate compliance information**.

**Acceptance Criteria:**

- [ ] **Given** an admin is on the agency edit form, **When** they view the compliance section, **Then** they see the same compliance controls available to agency owners.
- [ ] **Given** an admin modifies compliance settings for an agency, **When** they save, **Then** the agency's compliance data is updated in the database.
- [ ] **Given** an admin views an agency's compliance settings, **When** the agency has existing compliance data, **Then** the existing values are pre-populated.
- [ ] **Given** an admin modifies compliance settings, **When** they save successfully, **Then** an audit trail entry is created recording the change.
- [ ] **Given** an admin sets a verification status for a compliance item, **When** they save, **Then** the item displays as "Verified" on the public profile.

---

### Story 3: Display Compliance Badges on Agency Profile

> As a **Contractor**, I want **to see compliance badges on agency profiles**, so that **I can quickly assess whether an agency meets my project's compliance requirements**.

**Acceptance Criteria:**

- [ ] **Given** an agency has compliance items marked as true, **When** viewing the agency's public profile, **Then** compliance badges are displayed prominently in a dedicated section.
- [ ] **Given** an agency has a verified compliance item, **When** viewing the profile, **Then** the badge displays a "Verified" indicator distinguishing it from self-reported items.
- [ ] **Given** an agency has no compliance items set, **When** viewing the profile, **Then** no compliance section is displayed (graceful degradation).
- [ ] **Given** a compliance item has an expiration date, **When** viewing the profile, **Then** the expiration date is visible (e.g., "OSHA Certified - Expires Dec 2026").
- [ ] **Given** a compliance item is expired, **When** viewing the profile, **Then** the badge displays in a muted/warning state indicating expiration.

---

### Story 4: Filter Agencies by Compliance

> As a **Contractor**, I want **to filter search results by compliance requirements**, so that **I can quickly find agencies that meet my project's specific compliance needs**.

**Acceptance Criteria:**

- [ ] **Given** a contractor is on the agency search page, **When** they view the filters panel, **Then** they see compliance filter options (checkboxes or multi-select).
- [ ] **Given** a contractor selects "OSHA Certified" filter, **When** the filter is applied, **Then** only agencies with OSHA certification are displayed.
- [ ] **Given** a contractor selects multiple compliance filters, **When** applied, **Then** only agencies matching ALL selected criteria are displayed (AND logic).
- [ ] **Given** compliance filters are applied, **When** the contractor clicks "Clear Filters", **Then** compliance filters are reset and all agencies are shown.
- [ ] **Given** compliance filters are selected, **When** the URL is shared, **Then** the filters are persisted via query params.

---

### Story 5: Admin Verifies Compliance Documents

> As a **Site Administrator**, I want **to verify agency compliance claims by reviewing uploaded documents**, so that **contractors can trust that verified badges represent genuine credentials**.

**Acceptance Criteria:**

- [ ] **Given** an admin is viewing an agency's compliance settings, **When** a document has been uploaded for a compliance item, **Then** the admin can view/download the document.
- [ ] **Given** an admin reviews a compliance document, **When** they mark it as verified, **Then** the compliance item status changes to "verified" in the database.
- [ ] **Given** an admin verifies a compliance item, **When** viewing the agency's public profile, **Then** the badge displays a verified checkmark.
- [ ] **Given** an admin rejects a compliance document, **When** they provide a rejection reason, **Then** the agency owner is notified via email with the reason.
- [ ] **Given** an admin performs a verification action, **When** completed, **Then** an audit trail entry is created with timestamp and admin ID.

---

### Story 6: Agency Uploads Compliance Documents

> As an **Agency Owner**, I want **to upload documentation supporting my compliance claims**, so that **my agency can be verified and display trusted badges**.

**Acceptance Criteria:**

- [ ] **Given** an agency owner is on the compliance settings page, **When** they toggle a compliance item to true, **Then** they see an optional document upload field.
- [ ] **Given** an agency owner uploads a compliance document, **When** the upload completes, **Then** the document is stored securely in Supabase Storage.
- [ ] **Given** an agency owner has uploaded a document, **When** they view the compliance settings, **Then** they see the uploaded file name with options to view/replace/remove.
- [ ] **Given** an agency owner uploads an invalid file type, **When** they attempt upload, **Then** they see a validation error (allowed: PDF, PNG, JPG, max 10MB).
- [ ] **Given** an agency owner removes a compliance document, **When** they save, **Then** the file is deleted from storage and the compliance item remains self-reported.

---

### Story 7: Compliance Expiration Tracking

> As a **Site Administrator**, I want **the system to track compliance expiration dates and send reminders**, so that **agencies maintain up-to-date certifications**.

**Acceptance Criteria:**

- [ ] **Given** a compliance item has an expiration date, **When** the date is 30 days away, **Then** the agency owner receives an email reminder.
- [ ] **Given** a compliance item has an expiration date, **When** the date is 7 days away, **Then** the agency owner receives a second email reminder.
- [ ] **Given** a compliance item has expired, **When** the expiration date passes, **Then** the public badge displays as "Expired" with warning styling.
- [ ] **Given** an admin is viewing agency compliance, **When** an item is within 30 days of expiration, **Then** it is highlighted with a warning indicator.
- [ ] **Given** an admin is on the admin dashboard, **When** they navigate to compliance overview, **Then** they see a list of agencies with expiring/expired compliance items.

---

## 3. Technical & Design Requirements

### UX/UI Requirements

- Reuse existing toggle/switch patterns from Settings pages
- Add compliance section to AgencyFormModal (admin) and Agency Dashboard (owner)
- Display badges using consistent design with existing "Verified" and "Featured" badges
- Use Shadcn/ui `Badge`, `Switch`, `DatePicker`, and file upload components
- Mobile-responsive compliance section on agency profiles
- Filter checkboxes in search sidebar matching existing filter patterns

### Technical Impact Analysis

#### Data Model

**New Database Table: `agency_compliance`**

| Column            | Type        | Description                                                                                                 |
| ----------------- | ----------- | ----------------------------------------------------------------------------------------------------------- |
| `id`              | UUID        | Primary key                                                                                                 |
| `agency_id`       | UUID        | Foreign key to agencies                                                                                     |
| `compliance_type` | TEXT        | Enum: 'osha_certified', 'drug_testing', 'background_checks', 'workers_comp', 'general_liability', 'bonding' |
| `is_active`       | BOOLEAN     | Whether this compliance item is claimed by agency                                                           |
| `is_verified`     | BOOLEAN     | Admin-verified status                                                                                       |
| `verified_by`     | UUID        | Admin who verified (nullable)                                                                               |
| `verified_at`     | TIMESTAMPTZ | Verification timestamp (nullable)                                                                           |
| `document_url`    | TEXT        | URL to uploaded document in Supabase Storage (nullable)                                                     |
| `expiration_date` | DATE        | Expiration date for certification (nullable)                                                                |
| `notes`           | TEXT        | Admin notes (nullable)                                                                                      |
| `created_at`      | TIMESTAMPTZ | Creation timestamp                                                                                          |
| `updated_at`      | TIMESTAMPTZ | Last update timestamp                                                                                       |

**Unique Constraint:** `(agency_id, compliance_type)` - one record per compliance type per agency

**New Storage Bucket: `compliance-documents`**

- Private bucket (authenticated access only)
- Admin and agency owner access via RLS
- File size limit: 10MB
- Allowed types: PDF, PNG, JPG

#### API Endpoints

**New Endpoints:**

| Endpoint                                       | Method | Purpose                                        |
| ---------------------------------------------- | ------ | ---------------------------------------------- |
| `/api/agencies/[id]/compliance`                | GET    | Get agency's compliance data (public)          |
| `/api/agencies/[id]/compliance`                | PUT    | Agency owner updates their compliance          |
| `/api/admin/agencies/[id]/compliance`          | GET    | Admin gets agency compliance with admin fields |
| `/api/admin/agencies/[id]/compliance`          | PUT    | Admin updates agency compliance                |
| `/api/admin/agencies/[id]/compliance/verify`   | POST   | Admin verifies a compliance item               |
| `/api/admin/agencies/[id]/compliance/document` | POST   | Upload compliance document                     |
| `/api/admin/agencies/[id]/compliance/document` | DELETE | Remove compliance document                     |
| `/api/dashboard/compliance`                    | GET    | Agency owner gets their compliance             |
| `/api/dashboard/compliance`                    | PUT    | Agency owner updates their compliance          |
| `/api/dashboard/compliance/document`           | POST   | Agency owner uploads document                  |
| `/api/dashboard/compliance/document`           | DELETE | Agency owner removes document                  |

**Modified Endpoints:**

| Endpoint             | Method | Change                                                                                                                    |
| -------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------- |
| `/api/agencies`      | GET    | Add compliance filter params: `osha`, `drug_testing`, `background_checks`, `workers_comp`, `general_liability`, `bonding` |
| `/api/agencies/[id]` | GET    | Include compliance data in response                                                                                       |

#### Component Changes

**New Components:**

| Component                   | Purpose                                                    |
| --------------------------- | ---------------------------------------------------------- |
| `ComplianceSettings`        | Form for managing compliance items (shared by admin/owner) |
| `ComplianceBadges`          | Display badges on agency profile                           |
| `ComplianceFilters`         | Filter checkboxes for search                               |
| `ComplianceDocumentUpload`  | File upload component for compliance docs                  |
| `ComplianceVerifyDialog`    | Admin dialog for verifying/rejecting documents             |
| `ComplianceExpirationAlert` | Warning display for expiring items                         |

**Modified Components:**

| Component         | Change                          |
| ----------------- | ------------------------------- |
| `AgencyFormModal` | Add ComplianceSettings section  |
| `AgencyProfile`   | Add ComplianceBadges section    |
| `SearchFilters`   | Add ComplianceFilters section   |
| `AgencyDashboard` | Add link to compliance settings |

#### Non-Functional Requirements

Per PKD requirements:

- **Performance:** API responses < 200ms, document upload < 10 seconds for 10MB file
- **Security:** Admin-only verification, RLS for document access, audit logging for all mutations
- **Accessibility:** WCAG 2.1 AA compliance for all new UI components
- **Testing:** 85%+ test coverage for new code

## 4. Scope

### Out of Scope

- **Third-party verification integrations:** No automated verification via external APIs (e.g., OSHA database lookup) in v1
- **Bulk document upload:** One document per compliance item only
- **Document OCR/parsing:** No automatic extraction of data from uploaded documents
- **Compliance scoring/ranking:** No aggregate compliance score in v1
- **Public document viewing:** Documents only visible to admin and agency owner, not contractors
- **Multiple documents per item:** One document per compliance type only

### Open Questions

- [x] **Document retention policy:** Documents retained until agency removes them or account deleted
- [x] **Expiration notification frequency:** 30 days and 7 days before expiration
- [x] **Verification workflow:** Simple approve/reject, no multi-step review in v1
- [ ] **Email templates:** Need to design reminder email templates for expiring compliance

---

## 5. Implementation Phases

### Phase 1: Database & API Foundation (Stories 1-2 partial)

**Priority:** HIGH - Establishes data model

**Tasks:**

1. Create `agency_compliance` database table with migration
2. Create `compliance-documents` storage bucket with RLS policies
3. Create GET/PUT endpoints for agency compliance (owner)
4. Create GET/PUT endpoints for admin agency compliance
5. Add compliance data to agency detail response
6. Comprehensive test suite for API endpoints

**Estimated Effort:** 12-16 hours

### Phase 2: Agency Owner Dashboard (Story 1, 6)

**Priority:** HIGH - Self-service compliance management

**Tasks:**

1. Create ComplianceSettings component
2. Add compliance page to agency dashboard
3. Implement document upload functionality
4. Create ComplianceDocumentUpload component
5. Add form validation and error handling
6. Comprehensive test suite

**Estimated Effort:** 12-16 hours

### Phase 3: Public Profile Display (Story 3)

**Priority:** HIGH - User-facing value

**Tasks:**

1. Create ComplianceBadges component
2. Add compliance section to agency profile page
3. Handle verified vs self-reported badge styling
4. Handle expiration date display and warnings
5. Graceful degradation for agencies without compliance data
6. Comprehensive test suite

**Estimated Effort:** 8-12 hours

### Phase 4: Search Filtering (Story 4)

**Priority:** MEDIUM - Discovery feature

**Tasks:**

1. Create ComplianceFilters component
2. Modify agencies API to support compliance filters
3. Add filter UI to search page
4. Persist filters in URL query params
5. Comprehensive test suite

**Estimated Effort:** 8-12 hours

### Phase 5: Admin Verification (Stories 2, 5)

**Priority:** MEDIUM - Trust building

**Tasks:**

1. Add ComplianceSettings to AgencyFormModal (admin)
2. Create ComplianceVerifyDialog component
3. Create verification API endpoint
4. Implement email notification on rejection
5. Add verification audit logging
6. Comprehensive test suite

**Estimated Effort:** 12-16 hours

### Phase 6: Expiration Tracking (Story 7)

**Priority:** LOW - Maintenance feature

**Tasks:**

1. Create scheduled job for expiration checks
2. Implement email reminders (30-day, 7-day)
3. Create ComplianceExpirationAlert component
4. Add admin dashboard view for expiring items
5. Update badge display for expired items
6. Comprehensive test suite

**Estimated Effort:** 12-16 hours

---

## 6. Success Metrics

| Metric                        | Target        | Measurement                                         |
| ----------------------------- | ------------- | --------------------------------------------------- |
| Agencies with compliance data | 50%+          | Count agencies with at least one compliance item    |
| Compliance filter usage       | 20%+ searches | Track search queries using compliance filters       |
| Verified compliance items     | 25%+          | Admin-verified vs self-reported ratio               |
| Profile completion increase   | +10%          | Average profile completion with compliance included |
| Test coverage                 | 85%+          | Jest coverage report                                |

---

## 7. Dependencies

- **Feature 008 (Complete):** Agency Claim and Profile Management - provides agency dashboard foundation
- **Feature 012 (In Progress):** Admin Full Management Dashboard - provides admin agency editing
- **Supabase Storage:** Required for document upload functionality
- **Email Service (Resend):** Required for expiration reminder notifications

---

## 8. Risks & Mitigations

| Risk                               | Impact                                        | Mitigation                                                       |
| ---------------------------------- | --------------------------------------------- | ---------------------------------------------------------------- |
| Low agency adoption                | Empty compliance badges look bad              | Default to not showing compliance section if no data             |
| Document storage costs             | High storage usage                            | 10MB file limit, periodic cleanup of orphaned files              |
| Verification bottleneck            | Admins overwhelmed with verification requests | Start with self-reported badges, add verification as enhancement |
| Expired compliance not updated     | Stale data reduces trust                      | Automated expiration checks, email reminders, visual warnings    |
| Compliance types not comprehensive | Missing important compliance types            | Allow for future expansion with generic compliance types         |
