# Task Backlog: Industry Compliance & Verification

**Source FSD:** `docs/features/active/013-industry-compliance-and-verification.md`
**Project Foundation:** `CLAUDE.md` (TypeScript strict mode, 85%+ test coverage, Shadcn/ui patterns)
**Reference Documentation:** `PROJECT_KICKSTART_V2.md` (Epic: Industry Compliance & Verification)

This document breaks down Feature #013 into sprint-ready engineering tasks. All tasks must adhere to project standards: TypeScript strict mode, 85%+ test coverage, no unnecessary comments, and use existing UI components from Shadcn/ui.

---

## 📦 Phase 1: Database & API Foundation (Sprint 1) ✅ COMPLETE

**Goal:** Establish the data model and core API endpoints for compliance management
**Estimated Duration:** 3-4 days
**Dependencies:** Feature 008 (Complete ✅), Feature 012 (Complete ✅)
**Completed:** 2026-01-06

---

### [x] ➡️ Story 1.1: Database Schema & Storage Setup

> As a **Developer**, I want **to establish the compliance data model**, so that **we have a solid foundation for all compliance features**.

### Engineering Tasks for Story 1.1:

---

### [x] Task 1.1.1: Create agency_compliance Database Table

- **Role:** Backend Developer
- **Objective:** Create the database migration for the agency_compliance table
- **Context:** This table stores compliance items per agency with verification status and expiration tracking
- **Key Files to Create:**
  - `supabase/migrations/[timestamp]_create_agency_compliance_table.sql`
- **Key Files to Reference:**
  - `docs/features/active/013-industry-compliance-and-verification.md` (data model spec)
  - Existing migration patterns in `supabase/migrations/`
- **Key Patterns to Follow:**
  - UUID primary keys
  - Foreign key to agencies table
  - Unique constraint on (agency_id, compliance_type)
  - Timestamp columns with defaults
- **Schema:**
  ```sql
  CREATE TABLE agency_compliance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    compliance_type TEXT NOT NULL CHECK (compliance_type IN (
      'osha_certified', 'drug_testing', 'background_checks',
      'workers_comp', 'general_liability', 'bonding'
    )),
    is_active BOOLEAN NOT NULL DEFAULT false,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    verified_by UUID REFERENCES auth.users(id),
    verified_at TIMESTAMPTZ,
    document_url TEXT,
    expiration_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(agency_id, compliance_type)
  );
  ```
- **Acceptance Criteria (for this task):**
  - [ ] Migration creates agency_compliance table with all columns
  - [ ] Foreign key constraint to agencies with CASCADE delete
  - [ ] CHECK constraint validates compliance_type values
  - [ ] Unique constraint prevents duplicate compliance types per agency
  - [ ] Index created on agency_id for query performance
  - [ ] Trigger updates updated_at on row changes
- **Definition of Done:**
  - [ ] Migration created and tested locally
  - [ ] Rollback migration included
  - [ ] **Final Check:** Follows existing migration patterns

**Estimated Effort:** 2 hours

---

### [x] Task 1.1.2: Create RLS Policies for agency_compliance

- **Role:** Backend Developer
- **Objective:** Set up Row Level Security policies for the agency_compliance table
- **Context:** Need to control read/write access based on user roles
- **Key Files to Modify:**
  - `supabase/migrations/[timestamp]_create_agency_compliance_table.sql` (add policies)
- **Key Files to Reference:**
  - Existing RLS policies for agencies, profiles tables
- **Key Patterns to Follow:**
  - Public read for active compliance items
  - Agency owner can manage their own
  - Admin can manage all
- **Acceptance Criteria (for this task):**
  - [ ] SELECT policy: All users can read is_active=true compliance items (for public display)
  - [ ] SELECT policy: Agency owner can read all their compliance items
  - [ ] SELECT policy: Admin can read all compliance items
  - [ ] INSERT policy: Agency owner can insert for their claimed agency
  - [ ] INSERT policy: Admin can insert for any agency
  - [ ] UPDATE policy: Agency owner can update their compliance items
  - [ ] UPDATE policy: Admin can update any compliance items
  - [ ] DELETE policy: Agency owner can delete their compliance items
  - [ ] DELETE policy: Admin can delete any compliance items
- **Definition of Done:**
  - [ ] All policies created and tested
  - [ ] Verified with different user roles
  - [ ] **Final Check:** Security policies properly configured

**Estimated Effort:** 2 hours

---

### [x] Task 1.1.3: Create compliance-documents Storage Bucket

- **Role:** Backend Developer
- **Objective:** Set up Supabase Storage bucket for compliance document uploads
- **Context:** Private bucket for storing certification PDFs and images
- **Key Files to Create:**
  - `supabase/migrations/[timestamp]_create_compliance_documents_bucket.sql`
- **Key Files to Reference:**
  - `supabase/migrations/20260105_001_create_agency_logos_bucket.sql` (existing bucket pattern)
- **Key Patterns to Follow:**
  - Private bucket (not public)
  - Authenticated access only
  - RLS policies for owner and admin access
- **Acceptance Criteria (for this task):**
  - [ ] Storage bucket `compliance-documents` created
  - [ ] Bucket is private (not public read)
  - [ ] File size limit: 10MB
  - [ ] Allowed MIME types: application/pdf, image/png, image/jpeg
  - [ ] SELECT policy: Agency owner can read their documents
  - [ ] SELECT policy: Admin can read all documents
  - [ ] INSERT policy: Agency owner can upload to their agency folder
  - [ ] INSERT policy: Admin can upload to any agency folder
  - [ ] UPDATE/DELETE policies follow same pattern
  - [ ] File path structure: `{agency_id}/{compliance_type}/{filename}`
- **Definition of Done:**
  - [ ] Migration created and tested locally
  - [ ] Bucket accessible via Supabase client
  - [ ] **Final Check:** Security policies properly configured

**Estimated Effort:** 2 hours

---

### [x] Task 1.1.4: Create TypeScript Types for Compliance

- **Role:** Backend Developer
- **Objective:** Define TypeScript interfaces for compliance data structures
- **Context:** Type definitions for API requests/responses and component props
- **Key Files to Modify:**
  - `types/api.ts` (add compliance types)
  - `types/database.ts` (add database row type if needed)
- **Key Files to Reference:**
  - Existing type definitions in `types/api.ts`
- **Key Patterns to Follow:**
  - Consistent naming with existing types
  - Nullable fields properly typed
  - Enum for compliance types
- **Acceptance Criteria (for this task):**
  - [ ] `ComplianceType` enum with all 6 types
  - [ ] `AgencyCompliance` interface for database row
  - [ ] `ComplianceItem` interface for API responses (with display names)
  - [ ] `ComplianceUpdateRequest` interface for PUT requests
  - [ ] `ComplianceVerifyRequest` interface for admin verification
  - [ ] Helper function `getComplianceDisplayName(type: ComplianceType): string`
- **Definition of Done:**
  - [ ] All types defined with proper JSDoc comments
  - [ ] Types exported from types/api.ts
  - [ ] **Final Check:** Follows existing type patterns

**Estimated Effort:** 1 hour

---

### [x] ➡️ Story 1.2: Core API Endpoints

> As a **Developer**, I want **to create the compliance API endpoints**, so that **the frontend can read and update compliance data**.

### Engineering Tasks for Story 1.2:

---

### [x] Task 1.2.1: Create Public Compliance GET Endpoint

- **Role:** Backend Developer
- **Objective:** Create endpoint to retrieve agency compliance data for public display
- **Context:** Used by agency profile page to show compliance badges
- **Key Files to Create:**
  - `app/api/agencies/[slug]/compliance/route.ts`
  - `app/api/agencies/[slug]/compliance/__tests__/route.test.ts`
- **Key Files to Reference:**
  - `app/api/agencies/[slug]/route.ts` (existing agency detail pattern)
- **Key Patterns to Follow:**
  - Only return is_active=true items for public
  - Include display names and expiration status
  - Handle agency not found
- **Acceptance Criteria (for this task):**
  - [ ] `GET /api/agencies/[slug]/compliance` returns compliance data
  - [ ] Only returns items where is_active=true
  - [ ] Each item includes: type, display_name, is_verified, expiration_date, is_expired
  - [ ] Returns empty array if no compliance data
  - [ ] Returns 404 if agency not found
  - [ ] Cached for 5 minutes (same as agency data)
- **Definition of Done:**
  - [ ] Endpoint returns correct data
  - [ ] Unit tests cover all scenarios
  - [ ] 85%+ test coverage
  - [ ] **Final Check:** Follows existing API patterns

**Estimated Effort:** 2 hours

---

### [x] Task 1.2.2: Create Dashboard Compliance GET/PUT Endpoints

- **Role:** Backend Developer
- **Objective:** Create endpoints for agency owners to manage their compliance data
- **Context:** Used by agency dashboard compliance settings page
- **Key Files to Create:**
  - `app/api/dashboard/compliance/route.ts`
  - `app/api/dashboard/compliance/__tests__/route.test.ts`
- **Key Files to Reference:**
  - `app/api/dashboard/profile/route.ts` (existing dashboard pattern)
  - `app/api/agencies/[slug]/trades/route.ts` (upsert pattern)
- **Key Patterns to Follow:**
  - Authenticated user must be agency owner
  - Upsert pattern for compliance items
  - Return full compliance state after update
- **Acceptance Criteria (for this task):**
  - [ ] `GET /api/dashboard/compliance` returns owner's agency compliance
  - [ ] Returns all items (including is_active=false for form state)
  - [ ] Returns 401 if not authenticated
  - [ ] Returns 403 if user is not an agency owner
  - [ ] `PUT /api/dashboard/compliance` updates compliance items
  - [ ] Accepts array of compliance updates: `{ type, is_active, expiration_date? }`
  - [ ] Upserts compliance records (insert or update)
  - [ ] Cannot modify is_verified or verified_by (owner can't self-verify)
  - [ ] Returns updated compliance state
- **Definition of Done:**
  - [ ] Both endpoints functional
  - [ ] Unit tests cover all scenarios
  - [ ] 85%+ test coverage
  - [ ] **Final Check:** Follows existing dashboard API patterns

**Estimated Effort:** 3 hours

---

### [x] Task 1.2.3: Create Admin Compliance GET/PUT Endpoints

- **Role:** Backend Developer
- **Objective:** Create endpoints for admins to manage any agency's compliance
- **Context:** Used by admin agency edit form
- **Key Files to Create:**
  - `app/api/admin/agencies/[id]/compliance/route.ts`
  - `app/api/admin/agencies/[id]/compliance/__tests__/route.test.ts`
- **Key Files to Reference:**
  - `app/api/admin/agencies/[id]/route.ts` (existing admin agency pattern)
- **Key Patterns to Follow:**
  - Admin role required
  - Full access to all fields including verification
  - Audit logging for changes
- **Acceptance Criteria (for this task):**
  - [ ] `GET /api/admin/agencies/[id]/compliance` returns full compliance data
  - [ ] Includes all fields: is_verified, verified_by, document_url, notes
  - [ ] Returns 401 if not authenticated
  - [ ] Returns 403 if not admin
  - [ ] Returns 404 if agency not found
  - [ ] `PUT /api/admin/agencies/[id]/compliance` updates compliance
  - [ ] Can modify all fields including is_verified, notes
  - [ ] Audit trail entry created for changes
  - [ ] Returns updated compliance state
- **Definition of Done:**
  - [ ] Both endpoints functional
  - [ ] Unit tests cover all scenarios
  - [ ] 85%+ test coverage
  - [ ] **Final Check:** Follows existing admin API patterns

**Estimated Effort:** 3 hours

---

### [x] Task 1.2.4: Add Compliance Data to Agency Detail Response

- **Role:** Backend Developer
- **Objective:** Include compliance data in the agency detail API response
- **Context:** Agency profile page needs compliance data without separate API call
- **Key Files to Modify:**
  - `app/api/agencies/[slug]/route.ts`
  - `app/api/agencies/[slug]/__tests__/route.test.ts`
- **Key Files to Reference:**
  - Task 1.2.1 compliance response format
- **Key Patterns to Follow:**
  - Join compliance data in single query
  - Only include active compliance items
- **Acceptance Criteria (for this task):**
  - [ ] Agency detail response includes `compliance: ComplianceItem[]`
  - [ ] Only includes is_active=true items
  - [ ] Each item has: type, display_name, is_verified, expiration_date, is_expired
  - [ ] Existing tests still pass
  - [ ] New tests verify compliance inclusion
- **Definition of Done:**
  - [ ] Compliance included in response
  - [ ] Unit tests updated
  - [ ] **Final Check:** No breaking changes to existing API

**Estimated Effort:** 2 hours

---

## 📦 Phase 2: Agency Owner Dashboard (Sprint 2)

**Goal:** Enable agency owners to manage their compliance settings with document upload
**Estimated Duration:** 3-4 days
**Dependencies:** Phase 1 complete

---

### [x] ➡️ Story 2.1: Agency Owner Manages Compliance Settings

> As an **Agency Owner**, I want **to add, edit, and remove compliance certifications from my agency profile**, so that **contractors can see my agency's qualifications and compliance status at a glance**.

### Engineering Tasks for Story 2.1:

---

### [x] Task 2.1.1: Create ComplianceSettings Component

- **Role:** Frontend Developer
- **Objective:** Build the main compliance settings form component
- **Context:** Reusable component for both agency owner dashboard and admin forms
- **Key Files to Create:**
  - `components/compliance/ComplianceSettings.tsx`
  - `components/compliance/__tests__/ComplianceSettings.test.tsx`
- **Key Files to Reference:**
  - `components/dashboard/TradeSelector.tsx` (toggle pattern)
  - `components/settings/ProfileForm.tsx` (form pattern)
- **Key Patterns to Follow:**
  - React Hook Form integration
  - Switch toggles for each compliance type
  - Optional date picker for expiration
  - Zod validation schema
- **Compliance Types to Display:**
  - OSHA Certified
  - Drug Testing Policy
  - Background Checks
  - Workers' Compensation Insurance
  - General Liability Insurance
  - Bonding/Surety Bond
- **Acceptance Criteria (for this task):**
  - [ ] Displays all 6 compliance types with labels and descriptions
  - [ ] Each type has a Switch toggle for is_active
  - [ ] Each type has optional DatePicker for expiration_date
  - [ ] DatePicker only enabled when switch is on
  - [ ] Form tracks dirty state correctly
  - [ ] Props: `initialData`, `onSave`, `isLoading`, `isAdmin`
  - [ ] Shows document upload slot when is_active is true
  - [ ] Mobile-responsive layout (stacked on small screens)
- **Definition of Done:**
  - [ ] Component complete with all states
  - [ ] Tests verify toggle interactions
  - [ ] Tests verify date picker interactions
  - [ ] **Final Check:** Accessible and follows existing form patterns

**Estimated Effort:** 4 hours

---

### [x] Task 2.1.2: Create Compliance Dashboard Page

- **Role:** Frontend Developer
- **Objective:** Add compliance settings page to agency dashboard
- **Context:** New page at /dashboard/compliance for agency owners
- **Key Files to Create:**
  - `app/(app)/dashboard/compliance/page.tsx`
  - `app/(app)/dashboard/compliance/__tests__/page.test.tsx`
- **Key Files to Modify:**
  - `app/(app)/dashboard/layout.tsx` (add nav link)
- **Key Files to Reference:**
  - `app/(app)/dashboard/settings/page.tsx` (existing dashboard page pattern)
- **Key Patterns to Follow:**
  - Fetch compliance data on page load
  - Pass to ComplianceSettings component
  - Handle save with toast notifications
- **Acceptance Criteria (for this task):**
  - [ ] Page accessible at /dashboard/compliance
  - [ ] Navigation link added to dashboard sidebar
  - [ ] Page title: "Compliance & Certifications"
  - [ ] Fetches current compliance data on mount
  - [ ] Renders ComplianceSettings with data
  - [ ] Save button submits to PUT /api/dashboard/compliance
  - [ ] Success toast on save
  - [ ] Error handling with toast
  - [ ] Loading state while fetching/saving
- **Definition of Done:**
  - [ ] Page functional
  - [ ] Tests verify data loading
  - [ ] Tests verify save flow
  - [ ] **Final Check:** Follows existing dashboard page patterns

**Estimated Effort:** 3 hours

---

### [x] ➡️ Story 2.2: Agency Uploads Compliance Documents

> As an **Agency Owner**, I want **to upload documentation supporting my compliance claims**, so that **my agency can be verified and display trusted badges**.

### Engineering Tasks for Story 2.2:

---

### [x] Task 2.2.1: Create ComplianceDocumentUpload Component

- **Role:** Frontend Developer
- **Objective:** Build file upload component for compliance documents
- **Context:** Allows uploading PDF/images for each compliance item
- **Key Files to Create:**
  - `components/compliance/ComplianceDocumentUpload.tsx`
  - `components/compliance/__tests__/ComplianceDocumentUpload.test.tsx`
- **Key Files to Reference:**
  - `components/admin/LogoUpload.tsx` (existing upload pattern)
  - `components/admin/BulkImportModal.tsx` (drag-drop pattern)
- **Key Patterns to Follow:**
  - Drag-and-drop upload zone
  - File type validation (PDF, PNG, JPG)
  - Size validation (10MB max)
  - Preview for images, icon for PDFs
- **Acceptance Criteria (for this task):**
  - [ ] Drag-and-drop zone for file upload
  - [ ] Click to browse functionality
  - [ ] Accepts: PDF, PNG, JPG (max 10MB)
  - [ ] Shows preview for images
  - [ ] Shows PDF icon with filename for PDFs
  - [ ] "Remove" button to clear upload
  - [ ] "View" link to open document in new tab
  - [ ] Loading state during upload
  - [ ] Error messages for invalid files
  - [ ] Props: `complianceType`, `currentUrl`, `onUpload`, `onRemove`
- **Definition of Done:**
  - [ ] Component complete with all states
  - [ ] Tests verify file validation
  - [ ] Tests verify upload callbacks
  - [ ] **Final Check:** Accessible and mobile-friendly

**Estimated Effort:** 3 hours

---

### [x] Task 2.2.2: Create Document Upload API Endpoint

- **Role:** Backend Developer
- **Objective:** Create endpoint to upload compliance documents to Supabase Storage
- **Context:** Handles file upload and updates document_url in compliance record
- **Key Files to Create:**
  - `app/api/dashboard/compliance/document/route.ts`
  - `app/api/dashboard/compliance/document/__tests__/route.test.ts`
- **Key Files to Reference:**
  - `app/api/admin/agencies/[id]/logo/route.ts` (existing upload pattern)
- **Key Patterns to Follow:**
  - FormData handling
  - Server-side validation
  - Supabase Storage upload
  - Update compliance record with URL
- **Acceptance Criteria (for this task):**
  - [ ] `POST /api/dashboard/compliance/document` handles upload
  - [ ] Accepts: file (multipart), compliance_type (string)
  - [ ] Validates file type and size server-side
  - [ ] Uploads to `compliance-documents/{agency_id}/{compliance_type}/`
  - [ ] Generates unique filename with timestamp
  - [ ] Updates agency_compliance.document_url
  - [ ] Returns document URL on success
  - [ ] `DELETE /api/dashboard/compliance/document` removes document
  - [ ] DELETE accepts: compliance_type (query param)
  - [ ] DELETE removes file from storage
  - [ ] DELETE sets document_url to null
  - [ ] Returns 401/403 for unauthorized users
- **Definition of Done:**
  - [ ] Both endpoints functional
  - [ ] Unit tests cover all scenarios
  - [ ] 85%+ test coverage
  - [ ] **Final Check:** Follows existing upload patterns

**Estimated Effort:** 3 hours

---

### [x] Task 2.2.3: Integrate Document Upload into ComplianceSettings

- **Role:** Frontend Developer
- **Objective:** Add document upload capability to each compliance item
- **Context:** When a compliance item is active, show document upload option
- **Key Files to Modify:**
  - `components/compliance/ComplianceSettings.tsx`
  - `components/compliance/__tests__/ComplianceSettings.test.tsx`
- **Key Files to Reference:**
  - `components/compliance/ComplianceDocumentUpload.tsx` (created in 2.2.1)
- **Key Patterns to Follow:**
  - Show upload when is_active is true
  - Handle upload/remove callbacks
  - Show existing document if present
- **Acceptance Criteria (for this task):**
  - [ ] ComplianceDocumentUpload shown for each active item
  - [ ] Hidden when item is not active
  - [ ] Shows current document if document_url exists
  - [ ] Upload triggers POST to document endpoint
  - [ ] Remove triggers DELETE to document endpoint
  - [ ] Loading state during upload
  - [ ] Error handling with toast
- **Definition of Done:**
  - [ ] Integration complete
  - [ ] Tests verify upload integration
  - [ ] **Final Check:** Smooth UX for upload flow

**Estimated Effort:** 2 hours

---

## 📦 Phase 3: Public Profile Display (Sprint 3)

**Goal:** Display compliance badges on agency public profiles
**Estimated Duration:** 2-3 days
**Dependencies:** Phase 1 complete

---

### [x] ➡️ Story 3.1: Display Compliance Badges on Agency Profile

> As a **Contractor**, I want **to see compliance badges on agency profiles**, so that **I can quickly assess whether an agency meets my project's compliance requirements**.

### Engineering Tasks for Story 3.1:

---

### [x] Task 3.1.1: Create ComplianceBadges Component

- **Role:** Frontend Developer
- **Objective:** Build component to display compliance badges on agency profiles
- **Context:** Shows visual badges for each active compliance item
- **Key Files to Create:**
  - `components/compliance/ComplianceBadges.tsx`
  - `components/compliance/__tests__/ComplianceBadges.test.tsx`
- **Key Files to Reference:**
  - Existing badge patterns on agency cards (verified, featured)
  - Shadcn/ui Badge component
- **Key Patterns to Follow:**
  - Badge with icon for each type
  - Verified indicator (checkmark)
  - Expiration date display
  - Expired state styling
- **Badge Icons (Lucide):**
  - OSHA Certified: `ShieldCheck`
  - Drug Testing: `FlaskConical`
  - Background Checks: `UserCheck`
  - Workers' Comp: `HeartHandshake`
  - General Liability: `Shield`
  - Bonding: `BadgeCheck`
- **Acceptance Criteria (for this task):**
  - [ ] Renders badge for each compliance item
  - [ ] Each badge shows icon + label
  - [ ] Verified items show checkmark icon
  - [ ] Self-reported items show different styling (outline)
  - [ ] Expiration date shown (e.g., "Expires Dec 2026")
  - [ ] Expired items show warning styling (yellow/orange)
  - [ ] Tooltip on hover with full details
  - [ ] Responsive grid layout
  - [ ] Props: `compliance: ComplianceItem[]`
  - [ ] Returns null if compliance array is empty
- **Definition of Done:**
  - [ ] Component complete with all states
  - [ ] Tests verify badge rendering
  - [ ] Tests verify empty state
  - [ ] **Final Check:** Accessible with proper ARIA labels

**Estimated Effort:** 3 hours

---

### [x] Task 3.1.2: Add Compliance Section to Agency Profile Page

- **Role:** Frontend Developer
- **Objective:** Display ComplianceBadges on the agency profile page
- **Context:** New section on agency profile showing their compliance credentials
- **Key Files to Modify:**
  - `app/recruiters/[slug]/page.tsx`
  - Add test file if not exists
- **Key Files to Reference:**
  - Existing profile page sections
- **Key Patterns to Follow:**
  - Only show section if compliance data exists
  - Section heading: "Compliance & Certifications"
  - Position after company info, before contact
- **Acceptance Criteria (for this task):**
  - [ ] Compliance section added to agency profile page
  - [ ] Section heading: "Compliance & Certifications"
  - [ ] Renders ComplianceBadges component
  - [ ] Section hidden if no active compliance items
  - [ ] Graceful degradation - no empty section shown
  - [ ] Mobile-responsive layout
- **Definition of Done:**
  - [ ] Section displays correctly
  - [ ] Tests verify section rendering
  - [ ] Tests verify hidden when empty
  - [ ] **Final Check:** Consistent with page design

**Estimated Effort:** 2 hours

---

### [x] Task 3.1.3: Add Compliance Indicators to Agency Cards

- **Role:** Frontend Developer
- **Objective:** Show compliance summary on agency cards in directory listing
- **Context:** Quick visual indicator of compliance status on search results
- **Key Files to Modify:**
  - `components/AgencyCard.tsx`
  - Add/update test file
- **Key Files to Reference:**
  - Existing badge patterns on cards
- **Key Patterns to Follow:**
  - Compact indicator, not full badges
  - Show count or key indicators
  - Link to profile for details
- **Acceptance Criteria (for this task):**
  - [ ] Show compliance indicator if agency has active compliance
  - [ ] Indicator shows count (e.g., "5 Certifications")
  - [ ] OR show key badges (e.g., OSHA, Workers' Comp icons)
  - [ ] Verified indicator if any items are verified
  - [ ] No indicator shown if no compliance data
  - [ ] Does not clutter the card design
- **Definition of Done:**
  - [ ] Indicators display correctly
  - [ ] Tests verify rendering
  - [ ] **Final Check:** Card design remains clean

**Estimated Effort:** 2 hours

---

## 📦 Phase 4: Search Filtering (Sprint 3-4) ✅ COMPLETE

**Goal:** Enable contractors to filter agencies by compliance requirements
**Estimated Duration:** 2-3 days
**Dependencies:** Phase 1 complete
**Completed:** 2026-01-07

---

### [x] ➡️ Story 4.1: Filter Agencies by Compliance

> As a **Contractor**, I want **to filter search results by compliance requirements**, so that **I can quickly find agencies that meet my project's specific compliance needs**.

### Engineering Tasks for Story 4.1:

---

### [x] Task 4.1.1: Add Compliance Filters to Agencies API

- **Role:** Backend Developer
- **Objective:** Extend agencies list API to support compliance filtering
- **Context:** Allow filtering by one or more compliance types
- **Key Files to Modify:**
  - `app/api/agencies/route.ts`
  - `app/api/agencies/__tests__/route.test.ts`
- **Key Files to Reference:**
  - Existing filter logic (trades, states)
- **Key Patterns to Follow:**
  - Multiple filters use AND logic
  - Join to agency_compliance table
  - Only match is_active=true
- **Acceptance Criteria (for this task):**
  - [x] Accepts filter params: `osha`, `drug_testing`, `background_checks`, `workers_comp`, `general_liability`, `bonding`
  - [x] Each param is boolean (true to filter)
  - [x] Multiple params use AND logic (must have all selected)
  - [x] Only matches agencies with is_active=true for those types
  - [x] Can combine with existing filters (trades, states, search)
  - [x] Performance: query uses proper indexes
- **Definition of Done:**
  - [x] Filtering works correctly
  - [x] Unit tests cover filter combinations
  - [x] 85%+ test coverage
  - [x] **Final Check:** No performance regression

**Estimated Effort:** 3 hours

---

### [x] Task 4.1.2: Create ComplianceFilters Component

- **Role:** Frontend Developer
- **Objective:** Build filter checkboxes for compliance types
- **Context:** Component for search page filter sidebar
- **Key Files to Create:**
  - `components/compliance/ComplianceFilters.tsx`
  - `components/compliance/__tests__/ComplianceFilters.test.tsx`
- **Key Files to Reference:**
  - Existing filter components in search
  - Shadcn/ui Checkbox component
- **Key Patterns to Follow:**
  - Checkbox group
  - URL state management
  - Debounced updates
- **Acceptance Criteria (for this task):**
  - [x] Displays checkbox for each compliance type
  - [x] Each checkbox has label and icon
  - [x] Checkbox state reflects URL params
  - [x] Changes update URL params
  - [x] "Clear all" functionality
  - [x] Props: `selectedFilters`, `onChange`
- **Definition of Done:**
  - [x] Component complete
  - [x] Tests verify interactions
  - [x] **Final Check:** Matches existing filter patterns

**Estimated Effort:** 2 hours

---

### [x] Task 4.1.3: Integrate Compliance Filters into Search Page

- **Role:** Frontend Developer
- **Objective:** Add ComplianceFilters to the agency search/directory page
- **Context:** New filter section in the search sidebar
- **Key Files to Modify:**
  - `app/page.tsx` or search page component
  - Filter sidebar component
- **Key Files to Reference:**
  - Existing filter integration
- **Key Patterns to Follow:**
  - Collapsible filter section
  - URL param persistence
  - Combined with other filters
- **Acceptance Criteria (for this task):**
  - [x] ComplianceFilters added to filter sidebar
  - [x] Section heading: "Compliance Requirements"
  - [x] Collapsible section (expanded by default)
  - [x] Filters persist in URL as query params
  - [x] Filters apply to search results
  - [x] "Clear Filters" button clears compliance filters too
  - [x] Mobile-friendly filter panel
- **Definition of Done:**
  - [x] Filters integrated and functional
  - [x] Tests verify URL persistence
  - [x] **Final Check:** Consistent with existing filters UX

**Estimated Effort:** 2 hours

---

## 📦 Phase 5: Admin Verification (Sprint 4) ✅ COMPLETE

**Goal:** Enable admins to verify compliance documents and manage any agency's compliance
**Estimated Duration:** 3-4 days
**Dependencies:** Phase 1-2 complete
**Completed:** 2026-01-07

---

### [x] ➡️ Story 5.1: Admin Manages Agency Compliance

> As a **Site Administrator**, I want **to add, edit, and remove compliance items from any agency's profile**, so that **I can assist agencies with their profiles or correct inaccurate compliance information**.

### Engineering Tasks for Story 5.1:

---

### [x] Task 5.1.1: Add ComplianceSettings to AgencyFormModal

- **Role:** Frontend Developer
- **Objective:** Integrate compliance settings into admin agency edit modal
- **Context:** Admin can edit compliance while editing other agency details
- **Key Files to Modify:**
  - `components/admin/AgencyFormModal.tsx`
  - `components/admin/__tests__/AgencyFormModal.test.tsx`
- **Key Files to Reference:**
  - `components/compliance/ComplianceSettings.tsx` (created in Phase 2)
- **Key Patterns to Follow:**
  - New tab or section in modal
  - Pass isAdmin=true to enable admin features
  - Fetch compliance data with agency
- **Acceptance Criteria (for this task):**
  - [x] ComplianceSettings rendered in AgencyFormModal
  - [x] New tab: "Compliance" in modal tabs
  - [x] isAdmin=true passed to component
  - [x] Current compliance pre-populated in edit mode
  - [x] Changes saved with agency update
  - [x] Admin can set is_verified flag
  - [x] Admin can add notes
- **Definition of Done:**
  - [x] Integration complete
  - [x] Tests verify compliance tab
  - [x] **Final Check:** Consistent with other modal tabs

**Estimated Effort:** 3 hours

---

### [x] ➡️ Story 5.2: Admin Verifies Compliance Documents

> As a **Site Administrator**, I want **to verify agency compliance claims by reviewing uploaded documents**, so that **contractors can trust that verified badges represent genuine credentials**.

### Engineering Tasks for Story 5.2:

---

### [x] Task 5.2.1: Create Admin Document Upload Endpoint

- **Role:** Backend Developer
- **Objective:** Create endpoint for admin to upload/manage compliance documents
- **Context:** Admin can upload documents on behalf of agencies
- **Key Files to Create:**
  - `app/api/admin/agencies/[id]/compliance/document/route.ts`
  - `app/api/admin/agencies/[id]/compliance/document/__tests__/route.test.ts`
- **Key Files to Reference:**
  - `app/api/dashboard/compliance/document/route.ts` (owner endpoint)
- **Key Patterns to Follow:**
  - Same upload logic as owner endpoint
  - Admin role required
  - Can upload for any agency
- **Acceptance Criteria (for this task):**
  - [x] `POST /api/admin/agencies/[id]/compliance/document` handles upload
  - [x] Same validation as owner endpoint
  - [x] Admin can upload for any agency
  - [x] `DELETE /api/admin/agencies/[id]/compliance/document` removes
  - [x] Returns 401/403 for non-admin
  - [x] Returns 404 if agency not found
- **Definition of Done:**
  - [x] Endpoints functional
  - [x] Unit tests cover scenarios
  - [x] **Final Check:** Follows admin API patterns

**Estimated Effort:** 2 hours

---

### [x] Task 5.2.2: Create ComplianceVerifyDialog Component

- **Role:** Frontend Developer
- **Objective:** Build dialog for admin to review and verify/reject compliance documents
- **Context:** Admin clicks document to open review dialog
- **Key Files to Create:**
  - `components/admin/ComplianceVerifyDialog.tsx`
  - `components/admin/__tests__/ComplianceVerifyDialog.test.tsx`
- **Key Files to Reference:**
  - `components/admin/ClaimDetailModal.tsx` (review pattern)
  - Shadcn/ui Dialog component
- **Key Patterns to Follow:**
  - Dialog with document preview
  - Approve/Reject buttons
  - Notes field for admin comments
- **Acceptance Criteria (for this task):**
  - [x] Dialog shows document preview (image) or download link (PDF)
  - [x] Shows compliance type and agency name
  - [x] "Verify" button marks as verified
  - [x] "Reject" button opens rejection reason field
  - [x] Notes textarea for admin comments
  - [x] Loading state during actions
  - [x] Success toast on completion
  - [x] Props: `complianceItem`, `agencyId`, `onComplete`
- **Definition of Done:**
  - [x] Component complete
  - [x] Tests verify all states
  - [x] **Final Check:** Accessible and user-friendly

**Estimated Effort:** 3 hours

---

### [x] Task 5.2.3: Create Compliance Verify API Endpoint

- **Role:** Backend Developer
- **Objective:** Create endpoint for admin to verify or reject compliance items
- **Context:** Updates verification status and optionally sends rejection email
- **Key Files to Create:**
  - `app/api/admin/agencies/[id]/compliance/verify/route.ts`
  - `app/api/admin/agencies/[id]/compliance/verify/__tests__/route.test.ts`
- **Key Files to Reference:**
  - `app/api/admin/claims/[id]/route.ts` (approve/reject pattern)
- **Key Patterns to Follow:**
  - POST with action type
  - Update verification fields
  - Send email on rejection
  - Audit logging
- **Acceptance Criteria (for this task):**
  - [x] `POST /api/admin/agencies/[id]/compliance/verify`
  - [x] Accepts: `compliance_type`, `action` (verify | reject), `reason?`
  - [x] Verify: sets is_verified=true, verified_by, verified_at
  - [x] Reject: clears document_url, sends email with reason
  - [x] Returns 401/403 for non-admin
  - [x] Returns 404 if agency/compliance not found
  - [x] Audit trail entry created
- **Definition of Done:**
  - [x] Endpoint functional
  - [x] Unit tests cover scenarios
  - [x] Email sent on rejection
  - [x] 85%+ test coverage
  - [x] **Final Check:** Follows admin API patterns

**Estimated Effort:** 3 hours

---

### [x] Task 5.2.4: Create Rejection Email Template

- **Role:** Backend Developer
- **Objective:** Create email template for compliance document rejection
- **Context:** Sent to agency owner when admin rejects their document
- **Key Files to Create:**
  - `lib/email/templates/compliance-rejected.tsx` (if using React email)
- **Key Files to Reference:**
  - Existing email templates
  - Resend email patterns
- **Key Patterns to Follow:**
  - Clear subject line
  - Explain what was rejected
  - Include admin's reason
  - Link to re-upload
- **Acceptance Criteria (for this task):**
  - [x] Email template created
  - [x] Subject: "Compliance Document Rejected - [Compliance Type]"
  - [x] Body includes: agency name, compliance type, rejection reason
  - [x] Call to action: "Upload New Document"
  - [x] Link to dashboard compliance page
- **Definition of Done:**
  - [x] Template created
  - [x] Email renders correctly
  - [x] **Final Check:** Follows existing email patterns

**Estimated Effort:** 1 hour

---

## 📦 Phase 6: Expiration Tracking (Sprint 5)

**Goal:** Track compliance expiration dates and send reminder notifications
**Estimated Duration:** 3-4 days
**Dependencies:** Phase 1-2 complete, Email service

---

### [ ] ➡️ Story 6.1: Compliance Expiration Tracking

> As a **Site Administrator**, I want **the system to track compliance expiration dates and send reminders**, so that **agencies maintain up-to-date certifications**.

### Engineering Tasks for Story 6.1:

---

### [x] Task 6.1.1: Create Expiration Check Scheduled Job

- **Role:** Backend Developer
- **Objective:** Create cron job/scheduled function to check for expiring compliance
- **Context:** Runs daily to identify compliance items expiring within 30 days
- **Key Files to Create:**
  - `app/api/cron/compliance-expiration/route.ts`
  - `app/api/cron/compliance-expiration/__tests__/route.test.ts`
- **Key Files to Reference:**
  - Vercel cron job documentation
  - Existing scheduled job patterns (if any)
- **Key Patterns to Follow:**
  - Vercel cron with CRON_SECRET auth
  - Query for items expiring in 30 days and 7 days
  - Send appropriate emails
  - Log actions
- **Acceptance Criteria (for this task):**
  - [ ] `GET /api/cron/compliance-expiration` runs expiration check
  - [ ] Requires CRON_SECRET header for auth
  - [ ] Finds items expiring in exactly 30 days
  - [ ] Finds items expiring in exactly 7 days
  - [ ] Sends reminder emails to agency owners
  - [ ] Does not send duplicate emails (track last_reminder_sent)
  - [ ] Returns summary of actions taken
- **Definition of Done:**
  - [ ] Endpoint functional
  - [ ] Unit tests cover scenarios
  - [ ] Cron configured in vercel.json
  - [ ] **Final Check:** Proper rate limiting

**Estimated Effort:** 3 hours

---

### [x] Task 6.1.2: Create Expiration Reminder Email Templates

- **Role:** Backend Developer
- **Objective:** Create email templates for 30-day and 7-day expiration reminders
- **Context:** Sent to agency owners when compliance is expiring
- **Key Files to Create:**
  - `lib/email/templates/compliance-expiring-30.tsx`
  - `lib/email/templates/compliance-expiring-7.tsx`
- **Key Files to Reference:**
  - Existing email templates
- **Key Patterns to Follow:**
  - Clear urgency indication
  - List expiring items
  - Link to update compliance
- **Acceptance Criteria (for this task):**
  - [ ] 30-day template created
  - [ ] 7-day template created (more urgent styling)
  - [ ] Subject includes days remaining
  - [ ] Body lists expiring compliance items
  - [ ] Call to action: "Update Your Certifications"
  - [ ] Link to dashboard compliance page
- **Definition of Done:**
  - [ ] Templates created
  - [ ] Emails render correctly
  - [ ] **Final Check:** Follows existing email patterns

**Estimated Effort:** 2 hours

---

### [x] Task 6.1.3: Add last_reminder_sent Column

- **Role:** Backend Developer
- **Objective:** Add column to track when reminders were sent
- **Context:** Prevents duplicate reminder emails
- **Key Files to Create:**
  - `supabase/migrations/[timestamp]_add_compliance_reminder_tracking.sql`
- **Key Patterns to Follow:**
  - Nullable timestamp column
  - Migration only adds column
- **Acceptance Criteria (for this task):**
  - [ ] `last_30_day_reminder_sent` TIMESTAMPTZ column added
  - [ ] `last_7_day_reminder_sent` TIMESTAMPTZ column added
  - [ ] Both nullable (no reminder sent yet)
  - [ ] Cron job updates these after sending
- **Definition of Done:**
  - [ ] Migration created
  - [ ] **Final Check:** No breaking changes

**Estimated Effort:** 1 hour

---

### [ ] Task 6.1.4: Create ComplianceExpirationAlert Component

- **Role:** Frontend Developer
- **Objective:** Build alert component for expiring compliance items
- **Context:** Shown on agency dashboard when items are expiring soon
- **Key Files to Create:**
  - `components/compliance/ComplianceExpirationAlert.tsx`
  - `components/compliance/__tests__/ComplianceExpirationAlert.test.tsx`
- **Key Files to Reference:**
  - Shadcn/ui Alert component
- **Key Patterns to Follow:**
  - Warning styling for 30 days
  - Error styling for 7 days or expired
  - Dismissible
- **Acceptance Criteria (for this task):**
  - [ ] Shows alert for items expiring within 30 days
  - [ ] Warning (yellow) for 30-7 days
  - [ ] Error (red) for <7 days or expired
  - [ ] Lists affected compliance types
  - [ ] "Update Now" button links to compliance settings
  - [ ] Dismissible (dismissed state stored in localStorage)
  - [ ] Props: `expiringItems: ComplianceItem[]`
- **Definition of Done:**
  - [ ] Component complete
  - [ ] Tests verify all states
  - [ ] **Final Check:** Accessible and noticeable

**Estimated Effort:** 2 hours

---

### [ ] Task 6.1.5: Add Expiration Alert to Agency Dashboard

- **Role:** Frontend Developer
- **Objective:** Display ComplianceExpirationAlert on agency dashboard
- **Context:** Alert owners about expiring compliance items
- **Key Files to Modify:**
  - `app/(app)/dashboard/page.tsx`
- **Key Files to Reference:**
  - Dashboard layout patterns
- **Key Patterns to Follow:**
  - Fetch expiring items
  - Show alert at top of dashboard
  - Only show if items are expiring
- **Acceptance Criteria (for this task):**
  - [ ] Alert shown at top of dashboard
  - [ ] Only shown if there are expiring/expired items
  - [ ] Fetches compliance data on mount
  - [ ] Alert can be dismissed
- **Definition of Done:**
  - [ ] Alert integrated
  - [ ] Tests verify rendering
  - [ ] **Final Check:** Non-intrusive but noticeable

**Estimated Effort:** 1 hour

---

### [ ] Task 6.1.6: Create Admin Compliance Overview Page

- **Role:** Frontend Developer
- **Objective:** Build admin page showing compliance status across all agencies
- **Context:** Admin can see which agencies have expiring/expired compliance
- **Key Files to Create:**
  - `app/(app)/admin/compliance/page.tsx`
  - `app/(app)/admin/compliance/__tests__/page.test.tsx`
- **Key Files to Modify:**
  - `app/(app)/admin/layout.tsx` (add nav link)
- **Key Files to Reference:**
  - `app/(app)/admin/users/page.tsx` (table pattern)
- **Key Patterns to Follow:**
  - Data table with filtering
  - Status indicators
  - Links to agency detail
- **Acceptance Criteria (for this task):**
  - [ ] Page at /admin/compliance
  - [ ] Navigation link added to admin sidebar
  - [ ] Table showing agencies with compliance issues
  - [ ] Columns: Agency Name, Type, Status, Expiration Date, Actions
  - [ ] Filter by: Expired, Expiring Soon, Pending Verification
  - [ ] "View Agency" link to agency detail page
  - [ ] Empty state when no issues
- **Definition of Done:**
  - [ ] Page functional
  - [ ] Tests verify table rendering
  - [ ] **Final Check:** Useful for admin monitoring

**Estimated Effort:** 4 hours

---

## 📊 Summary

### Total Tasks: 30

| Phase                              | Tasks        | Estimated Hours |
| ---------------------------------- | ------------ | --------------- |
| Phase 1: Database & API Foundation | 8 tasks      | 18 hours        |
| Phase 2: Agency Owner Dashboard    | 5 tasks      | 15 hours        |
| Phase 3: Public Profile Display    | 3 tasks      | 7 hours         |
| Phase 4: Search Filtering          | 3 tasks      | 7 hours         |
| Phase 5: Admin Verification        | 5 tasks      | 12 hours        |
| Phase 6: Expiration Tracking       | 6 tasks      | 13 hours        |
| **Total**                          | **30 tasks** | **72 hours**    |

### Dependencies Graph

```text
Phase 1 (Days 1-4) - Database & API Foundation
├── Story 1.1: Database Setup
│   ├── 1.1.1 Create agency_compliance table
│   ├── 1.1.2 Create RLS policies
│   ├── 1.1.3 Create storage bucket
│   └── 1.1.4 Create TypeScript types
└── Story 1.2: Core API
    ├── 1.2.1 Public compliance GET
    ├── 1.2.2 Dashboard GET/PUT
    ├── 1.2.3 Admin GET/PUT
    └── 1.2.4 Add to agency detail

Phase 2 (Days 5-8) - Agency Owner Dashboard
├── Story 2.1: Compliance Settings
│   ├── 2.1.1 Create ComplianceSettings component
│   └── 2.1.2 Create compliance dashboard page
└── Story 2.2: Document Upload
    ├── 2.2.1 Create ComplianceDocumentUpload
    ├── 2.2.2 Create document upload API
    └── 2.2.3 Integrate into ComplianceSettings

Phase 3 (Days 9-11) - Public Profile Display
└── Story 3.1: Compliance Badges
    ├── 3.1.1 Create ComplianceBadges component
    ├── 3.1.2 Add to agency profile page
    └── 3.1.3 Add indicators to agency cards

Phase 4 (Days 12-14) - Search Filtering
└── Story 4.1: Compliance Filters
    ├── 4.1.1 Add filters to agencies API
    ├── 4.1.2 Create ComplianceFilters component
    └── 4.1.3 Integrate into search page

Phase 5 (Days 15-18) - Admin Verification
├── Story 5.1: Admin Compliance
│   └── 5.1.1 Add ComplianceSettings to AgencyFormModal
└── Story 5.2: Document Verification
    ├── 5.2.1 Create admin document upload API
    ├── 5.2.2 Create ComplianceVerifyDialog
    ├── 5.2.3 Create verify API endpoint
    └── 5.2.4 Create rejection email template

Phase 6 (Days 19-22) - Expiration Tracking
└── Story 6.1: Expiration System
    ├── 6.1.1 Create expiration check cron job
    ├── 6.1.2 Create reminder email templates
    ├── 6.1.3 Add reminder tracking columns
    ├── 6.1.4 Create ComplianceExpirationAlert
    ├── 6.1.5 Add alert to dashboard
    └── 6.1.6 Create admin compliance overview
```

### Key Files to Create

**Database Migrations:**

- `supabase/migrations/[timestamp]_create_agency_compliance_table.sql`
- `supabase/migrations/[timestamp]_create_compliance_documents_bucket.sql`
- `supabase/migrations/[timestamp]_add_compliance_reminder_tracking.sql`

**API Routes:**

- `app/api/agencies/[slug]/compliance/route.ts`
- `app/api/dashboard/compliance/route.ts`
- `app/api/dashboard/compliance/document/route.ts`
- `app/api/admin/agencies/[id]/compliance/route.ts`
- `app/api/admin/agencies/[id]/compliance/document/route.ts`
- `app/api/admin/agencies/[id]/compliance/verify/route.ts`
- `app/api/cron/compliance-expiration/route.ts`

**Components:**

- `components/compliance/ComplianceSettings.tsx`
- `components/compliance/ComplianceBadges.tsx`
- `components/compliance/ComplianceFilters.tsx`
- `components/compliance/ComplianceDocumentUpload.tsx`
- `components/compliance/ComplianceExpirationAlert.tsx`
- `components/admin/ComplianceVerifyDialog.tsx`

**Pages:**

- `app/(app)/dashboard/compliance/page.tsx`
- `app/(app)/admin/compliance/page.tsx`

**Types:**

- `types/api.ts` (add compliance types)

**Email Templates:**

- `lib/email/templates/compliance-rejected.tsx`
- `lib/email/templates/compliance-expiring-30.tsx`
- `lib/email/templates/compliance-expiring-7.tsx`

### Key Files to Modify

**API Routes:**

- `app/api/agencies/[slug]/route.ts` (include compliance in response)
- `app/api/agencies/route.ts` (add compliance filters)

**Components:**

- `components/admin/AgencyFormModal.tsx` (add compliance tab)
- `components/AgencyCard.tsx` (add compliance indicators)

**Pages:**

- `app/recruiters/[slug]/page.tsx` (add compliance section)
- `app/page.tsx` (add compliance filters)
- `app/(app)/dashboard/page.tsx` (add expiration alert)
- `app/(app)/dashboard/layout.tsx` (add compliance nav link)
- `app/(app)/admin/layout.tsx` (add compliance nav link)
