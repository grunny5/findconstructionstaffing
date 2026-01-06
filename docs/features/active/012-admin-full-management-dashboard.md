# FSD: Admin Full Management Dashboard

- **ID:** 012
- **Status:** Draft
- **Related Epic (from PKD):** Admin Portal (80% Complete)
- **Author:** Development Team
- **Last Updated:** January 5, 2026
- **Designs:** TBD

## 1. Problem & Goal

### Problem Statement

Currently, **Site Administrators** have limited ability to fully manage agency profiles and user accounts from the admin dashboard:

1. **Agency Editing Gaps:** Admins can edit 11 basic fields (name, description, contact info, etc.) but **cannot edit trades/specialties or regions/service areas** - the two most critical fields for search and matching. This forces admins to either ask agency owners to make changes or manipulate the database directly.

2. **User Management Gaps:** While admins can view users and change roles, they **cannot create new users, edit user profiles, or delete user accounts** from the dashboard. This limits administrative capabilities for onboarding, corrections, and account cleanup.

These limitations reduce operational efficiency and create unnecessary friction for platform management.

### Goal & Hypothesis

We believe that by building **comprehensive agency and user management capabilities** for the **Site Administrator**, we will achieve **full self-service administrative control without database access**. We will know this is true when we see **zero admin requests requiring direct database manipulation** for routine agency and user management tasks.

## 2. User Stories & Acceptance Criteria

---

### Story 1: Admin Edits Agency Trade Specialties

> As a **Site Administrator**, I want **to add, edit, or remove trade specialties from any agency's profile**, so that **I can ensure agencies are accurately categorized for search and matching without requiring the agency owner to make changes**.

**Acceptance Criteria:**

- [ ] **Given** an admin is on the agency edit form, **When** they view the form, **Then** they see a trade selector component with all 48 available trades.
- [ ] **Given** an admin selects trades for an agency, **When** they save the form, **Then** the agency_trades junction table is updated atomically.
- [ ] **Given** an agency has existing trades, **When** the admin opens the edit form, **Then** the existing trades are pre-selected.
- [ ] **Given** an admin removes all trades from an agency, **When** they save, **Then** all agency_trades records for that agency are deleted.
- [ ] **Given** an admin modifies trades, **When** they save successfully, **Then** an audit trail entry is created recording the change.

---

### Story 2: Admin Edits Agency Service Areas (Regions)

> As a **Site Administrator**, I want **to add, edit, or remove service areas (regions/states) from any agency's profile**, so that **I can ensure agencies appear in location-based searches correctly**.

**Acceptance Criteria:**

- [ ] **Given** an admin is on the agency edit form, **When** they view the form, **Then** they see a region selector component with all 35 US states/regions.
- [ ] **Given** an admin selects regions for an agency, **When** they save the form, **Then** the agency_regions junction table is updated atomically.
- [ ] **Given** an agency has existing regions, **When** the admin opens the edit form, **Then** the existing regions are pre-selected.
- [ ] **Given** an admin removes all regions from an agency, **When** they save, **Then** all agency_regions records for that agency are deleted.
- [ ] **Given** an admin modifies regions, **When** they save successfully, **Then** an audit trail entry is created recording the change.

---

### Story 3: Admin Edits Agency Logo

> As a **Site Administrator**, I want **to upload or change an agency's logo**, so that **I can ensure agency profiles have proper branding without requiring owner action**.

**Acceptance Criteria:**

- [ ] **Given** an admin is on the agency edit form, **When** they view the form, **Then** they see a logo upload component.
- [ ] **Given** an admin uploads a valid image (PNG, JPG, WebP, max 5MB), **When** they save the form, **Then** the image is stored in Supabase Storage and the logo_url is updated.
- [ ] **Given** an agency has an existing logo, **When** the admin opens the edit form, **Then** the current logo is displayed with an option to replace or remove.
- [ ] **Given** an admin removes a logo, **When** they save, **Then** the logo_url is set to null and the storage file is deleted.
- [ ] **Given** an admin uploads an invalid file type or oversized image, **When** they attempt to upload, **Then** they see a clear validation error message.

---

### Story 4: Admin Creates New User Account

> As a **Site Administrator**, I want **to create new user accounts directly from the admin dashboard**, so that **I can onboard users manually when needed (e.g., for agency owners who need assistance)**.

**Acceptance Criteria:**

- [ ] **Given** an admin is on the user management page, **When** they click "Create User", **Then** a modal opens with a user creation form.
- [ ] **Given** an admin fills in email (required), name, and role, **When** they submit the form, **Then** a new user account is created via Supabase Auth Admin API.
- [ ] **Given** a user is created successfully, **When** creation completes, **Then** a password reset email is sent to the new user automatically.
- [ ] **Given** an admin tries to create a user with an existing email, **When** they submit, **Then** they see a validation error "Email already registered".
- [ ] **Given** an admin creates a user, **When** they select a role (user, agency_owner, admin), **Then** the user's profile is created with the specified role.

---

### Story 5: Admin Edits User Profile

> As a **Site Administrator**, I want **to edit user profile information**, so that **I can correct errors or update user details without requiring the user to do it themselves**.

**Acceptance Criteria:**

- [ ] **Given** an admin is on a user detail page, **When** they click "Edit Profile", **Then** an edit modal opens with current profile data pre-populated.
- [ ] **Given** an admin edits a user's name or other profile fields, **When** they save, **Then** the profiles table is updated.
- [ ] **Given** an admin edits a user's email, **When** they save, **Then** the auth.users email is updated via Admin API and a verification email is sent.
- [ ] **Given** an admin makes profile changes, **When** they save successfully, **Then** an audit trail entry records who made the change.
- [ ] **Given** an admin tries to change email to one that's already in use, **When** they save, **Then** they see a validation error.

---

### Story 6: Admin Deletes User Account

> As a **Site Administrator**, I want **to delete user accounts that are spam, duplicate, or requested for removal**, so that **I can maintain data hygiene and honor deletion requests**.

**Acceptance Criteria:**

- [ ] **Given** an admin is on a user detail page, **When** they click "Delete User", **Then** a confirmation dialog appears explaining consequences.
- [ ] **Given** the confirmation dialog is shown, **When** the admin confirms deletion, **Then** the user is deleted from auth.users (which cascades to profiles).
- [ ] **Given** a user owns a claimed agency, **When** admin attempts to delete, **Then** they see a dialog offering to reassign the agency to another user OR unclaim it before proceeding.
- [ ] **Given** the admin is deleting their own account, **When** they attempt deletion, **Then** they see an error "Cannot delete your own account".
- [ ] **Given** a user is successfully deleted, **When** deletion completes, **Then** an audit log entry is created and admin is redirected to user list.

---

### Story 7: Admin Searches and Filters Users

> As a **Site Administrator**, I want **enhanced user search and filtering capabilities**, so that **I can quickly find specific users across a growing user base**.

**Acceptance Criteria:**

- [ ] **Given** an admin is on the user management page, **When** they type in the search box, **Then** users are filtered by name or email (debounced 300ms).
- [ ] **Given** an admin selects a role filter, **When** they apply it, **Then** only users with that role are displayed.
- [ ] **Given** an admin selects a status filter (active/suspended), **When** they apply it, **Then** users are filtered by account status.
- [ ] **Given** filters are applied, **When** the admin clicks "Clear Filters", **Then** all filters reset and all users are shown.
- [ ] **Given** filter selections, **When** they are applied, **Then** the URL is updated with query params for shareable links.

---

## 3. Technical & Design Requirements

### UX/UI Requirements

- Reuse existing `TradeSelector` and `RegionSelector` components from agency owner dashboard
- Reuse existing `AgencyFormModal` pattern with extended fields
- Follow existing admin modal patterns from `ClaimDetailModal` and role change flows
- Use Shadcn/ui `AlertDialog` for destructive actions (delete user, remove logo)
- Maintain mobile responsiveness for all new components

### Technical Impact Analysis

#### Data Model

No new database tables required. Changes to existing usage:

- **agency_trades:** Admin PATCH endpoint will manage this junction table (currently only agency owner can)
- **agency_regions:** Admin PATCH endpoint will manage this junction table (currently only agency owner can)
- **agencies.logo_url:** Will be updated via admin endpoint (new Supabase Storage bucket needed)
- **profiles:** Admin will be able to update via new endpoint
- **auth.users:** Admin will use Supabase Auth Admin API for create/delete/email changes

#### API Endpoints

**Modified Endpoints:**

| Endpoint | Method | Change |
|----------|--------|--------|
| `/api/admin/agencies/[id]` | PATCH | Add support for `trade_ids[]`, `region_ids[]`, `logo_url` |

**New Endpoints:**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/agencies/[id]/logo` | POST | Upload agency logo to Supabase Storage |
| `/api/admin/agencies/[id]/logo` | DELETE | Remove agency logo |
| `/api/admin/users` | POST | Create new user account |
| `/api/admin/users/[id]` | PATCH | Update user profile |
| `/api/admin/users/[id]` | DELETE | Delete user account |

#### Component Changes

**Modified Components:**

| Component | Change |
|-----------|--------|
| `AgencyFormModal` | Add TradeSelector, RegionSelector, LogoUpload components |
| `AdminAgenciesActions` | No changes needed (Create/Edit already wired) |

**New Components:**

| Component | Purpose |
|-----------|---------|
| `LogoUpload` | Drag-and-drop image upload with preview |
| `UserFormModal` | Create/edit user modal form |
| `UserDeleteDialog` | Confirmation dialog for user deletion |
| `AdminUsersActions` | Action buttons for user management page |

#### Non-Functional Requirements

Per PKD requirements:

- **Performance:** API responses < 200ms, logo upload < 5 seconds for 5MB file
- **Security:** All endpoints require admin role, audit logging for all mutations
- **Accessibility:** WCAG 2.1 AA compliance for all new UI components
- **Testing:** 85%+ test coverage for new code

## 4. Scope

### Out of Scope

- **Bulk user operations:** No bulk delete or bulk role change in v1
- **User impersonation:** Admin cannot "login as" another user
- **User password reset by admin:** Admin can only trigger password reset email, not set passwords directly
- **Agency logo cropping/editing:** Upload only, no in-browser editing
- **User suspension/ban:** Only full deletion, no temporary suspension in v1
- **Email template customization:** Uses existing Supabase email templates

### Open Questions (Resolved)

- [x] **Agency ownership on user delete:** Admin can choose to reassign the agency to another user OR unclaim it
- [x] **Trade limit for admin:** Admins have unlimited trades (no 10-trade cap like agency owners)
- [x] **Notification on admin edits:** No notification to agency owners when admin modifies trades/regions
- [x] **Admin notes field:** Not needed for v1

---

## 5. Implementation Phases

### Phase 1: Agency Full Editing (Stories 1-3)

**Priority:** HIGH - Addresses immediate admin pain point

**Tasks:**
1. Add TradeSelector to AgencyFormModal
2. Add RegionSelector to AgencyFormModal
3. Extend PATCH `/api/admin/agencies/[id]` for trade/region updates
4. Create Supabase Storage bucket for agency logos
5. Create LogoUpload component
6. Add logo upload to AgencyFormModal
7. Create logo upload/delete API endpoints
8. Add audit trail for trade/region/logo changes
9. Comprehensive test suite

**Estimated Effort:** 16-20 hours

### Phase 2: User Management (Stories 4-7)

**Priority:** MEDIUM - Enables complete admin self-service

**Tasks:**
1. Create UserFormModal component for create/edit
2. Create POST `/api/admin/users` endpoint (Supabase Admin API)
3. Create PATCH `/api/admin/users/[id]` endpoint
4. Create DELETE `/api/admin/users/[id]` endpoint
5. Create UserDeleteDialog with cascade warnings
6. Add "Create User" button to admin users page
7. Add "Edit" and "Delete" actions to user detail page
8. Enhance user search/filtering
9. Audit logging for all user mutations
10. Comprehensive test suite

**Estimated Effort:** 20-24 hours

---

## 6. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Admin database requests eliminated | 100% | Track support tickets requiring DB access |
| Agency profile completeness | +15% | More agencies with trades/regions populated |
| Admin task completion time | -50% | Time to update agency/user via dashboard |
| Test coverage | 85%+ | Jest coverage report |

---

## 7. Dependencies

- **Feature 011 (Complete):** Agency Creation & Bulk Import - provides base admin agency management
- **Feature 007 (Complete):** Authentication - provides role-based access control
- **Supabase Storage:** Required for logo upload functionality
- **Supabase Auth Admin API:** Required for user create/delete operations

---

## 8. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Supabase Admin API rate limits | User creation could fail | Implement retry logic, batch operations |
| Large logo uploads slow down form | Poor UX | Compress images client-side, show progress |
| Accidental user deletion | Data loss | Require confirmation, add soft-delete option later |
| Trade/region changes break search | Incorrect search results | Validate IDs exist before saving, atomic transactions |
