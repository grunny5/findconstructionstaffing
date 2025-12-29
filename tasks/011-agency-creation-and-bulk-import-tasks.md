# Task Backlog: Agency Creation & Bulk Import

**Source FSD:** `docs/features/active/011-agency-creation-and-bulk-import.md`
**Project Foundation:** `CLAUDE.md` (TypeScript strict mode, 85%+ test coverage, Shadcn/ui patterns)
**Reference Documentation:** `PROJECT_KICKSTART_V2.md` (Epic: Admin Portal)

This document breaks down Feature #011 into sprint-ready engineering tasks. All tasks must adhere to project standards: TypeScript strict mode, 85%+ test coverage, no unnecessary comments, and use existing UI components from Shadcn/ui.

---

## 📦 Phase 1: Admin Agencies List & Individual Creation (Sprint 1)

**Goal:** Create admin interface for viewing and creating individual agencies
**Estimated Duration:** 1 week (5 days)
**Dependencies:** Auth system (Feature 007 - Complete ✅), Admin Portal (Feature 007 - Complete ✅)

---

### ➡️ Story 1.1: Admin Views and Manages All Agencies

> As a **Site Administrator**, I want **to view all agencies (claimed and unclaimed) in a management interface**, so that **I can monitor the agency database and take administrative actions**.

### Engineering Tasks for this Story:

---

### [x] Task 1.1.1: Create Admin Agencies List Page Route

- **Role:** Frontend Developer
- **Objective:** Create the admin agencies management page with table layout
- **Context:** Need new route at `/admin/agencies` to display all agencies with filtering and pagination
- **Key Files to Create:**
  - `app/(app)/admin/agencies/page.tsx`
  - `app/(app)/admin/agencies/loading.tsx`
- **Key Files to Reference:**
  - `app/(app)/admin/users/page.tsx` (existing admin pattern)
  - `app/(app)/admin/claims/page.tsx` (existing admin pattern)
  - `docs/features/active/011-agency-creation-and-bulk-import.md`
- **Key Patterns to Follow:**
  - Next.js App Router conventions
  - Server component with client components for interactivity
  - Shadcn/ui Table, Input, Select, Button components
  - Admin route protection (existing middleware)
- **Acceptance Criteria (for this task):**
  - [x] Route `/admin/agencies` is accessible to admin users only
  - [x] Page displays agencies in a table with columns: Name, Status, Claimed, Owner, Created Date, Profile Completion
  - [x] Loading skeleton displays while fetching data
  - [x] Non-admin users are redirected to home page
  - [x] Page header includes "Create Agency" and "Bulk Import" buttons
- **Definition of Done:**
  - [x] Code complete and committed
  - [x] Tests verify admin-only access
  - [x] Tests verify table rendering with mock data
  - [x] All existing tests still pass
  - [x] **Final Check:** Follows existing admin page patterns

**Estimated Effort:** 4 hours

---

### [x] Task 1.1.2: Create Admin Agencies API Endpoint (GET)

- **Role:** Backend Developer
- **Objective:** Create API endpoint to fetch all agencies with admin-level data
- **Context:** Admin needs to see all agencies including claimed status and owner information
- **Key Files to Create:**
  - `app/api/admin/agencies/route.ts`
  - `app/api/admin/agencies/__tests__/route.test.ts`
- **Key Files to Reference:**
  - `app/api/agencies/route.ts` (existing public API)
  - `app/api/admin/users/route.ts` (existing admin API pattern if exists)
- **Key Patterns to Follow:**
  - RESTful API conventions
  - Admin-only authentication check
  - Supabase RLS policies
  - Zod validation for query params
- **Acceptance Criteria (for this task):**
  - [x] `GET /api/admin/agencies` returns all agencies (active and inactive)
  - [x] Response includes: id, name, slug, is_active, is_claimed, claimed_by (with profile), created_at, profile_completion_percentage
  - [x] Supports query params: search, status (active/inactive/all), claimed (yes/no/all), limit, offset
  - [x] Returns 401 if user is not authenticated
  - [x] Returns 403 if user is not an admin
  - [x] Pagination info included in response
- **Definition of Done:**
  - [x] Endpoint functional with all query params
  - [x] Unit tests cover success, auth errors, query variations
  - [x] 85%+ test coverage for new code
  - [x] **Final Check:** Follows existing API patterns

**Estimated Effort:** 3 hours

---

### [ ] Task 1.1.3: Implement Agency Search and Filtering

- **Role:** Frontend Developer
- **Objective:** Add search box and filter dropdowns to admin agencies page
- **Context:** Admin needs to quickly find agencies by name and filter by status
- **Key Files to Modify:**
  - `app/(app)/admin/agencies/page.tsx`
- **Key Files to Create:**
  - `components/admin/AgenciesTable.tsx`
  - `components/admin/__tests__/AgenciesTable.test.tsx`
- **Key Patterns to Follow:**
  - Shadcn/ui Input, Select components
  - Debounced search input (use existing useDebounce hook)
  - URL query param state management
- **Acceptance Criteria (for this task):**
  - [ ] Search box filters agencies by name (debounced, 300ms)
  - [ ] Status filter dropdown with options: All, Active, Inactive
  - [ ] Claimed filter dropdown with options: All, Claimed, Unclaimed
  - [ ] Filters update URL query params for shareable links
  - [ ] Clear filters button resets all filters
  - [ ] Table updates when filters change
- **Definition of Done:**
  - [ ] Search and filters functional
  - [ ] Tests verify filter interactions
  - [ ] Tests verify URL param updates
  - [ ] **Final Check:** Follows DirectoryFilters component patterns

**Estimated Effort:** 3 hours

---

### [ ] Task 1.1.4: Implement Pagination for Agencies Table

- **Role:** Frontend Developer
- **Objective:** Add pagination controls to admin agencies table
- **Context:** Database may contain hundreds of agencies, need pagination for performance
- **Key Files to Modify:**
  - `components/admin/AgenciesTable.tsx`
- **Key Patterns to Follow:**
  - Shadcn/ui Pagination component
  - URL-based pagination state
  - 20 items per page default
- **Acceptance Criteria (for this task):**
  - [ ] Pagination shows current page and total pages
  - [ ] Previous/Next buttons navigate pages
  - [ ] Page number updates in URL for bookmarking
  - [ ] Shows "Showing X-Y of Z agencies" count
  - [ ] Disabled states for first/last page navigation
- **Definition of Done:**
  - [ ] Pagination functional
  - [ ] Tests verify page navigation
  - [ ] Tests verify edge cases (single page, empty results)
  - [ ] **Final Check:** Matches existing pagination patterns

**Estimated Effort:** 2 hours

---

### ➡️ Story 1.2: Admin Creates Individual Agency

> As a **Site Administrator**, I want **to create a new agency through the admin dashboard**, so that **I can add agencies discovered through research or outreach without direct database access**.

### Engineering Tasks for this Story:

---

### [ ] Task 1.2.1: Create Agency Form Modal Component

- **Role:** Frontend Developer
- **Objective:** Build reusable form component for creating/editing agencies
- **Context:** Modal form with all agency fields, validation, and submission handling
- **Key Files to Create:**
  - `components/admin/AgencyFormModal.tsx`
  - `components/admin/__tests__/AgencyFormModal.test.tsx`
- **Key Files to Reference:**
  - `components/admin/ClaimDetailModal.tsx` (existing modal pattern)
  - `components/agency-dashboard/ProfileEditor.tsx` (existing agency form fields)
- **Key Patterns to Follow:**
  - Shadcn/ui Dialog, Form, Input, Textarea, Switch components
  - React Hook Form with Zod validation
  - Controlled form state
- **Acceptance Criteria (for this task):**
  - [ ] Modal opens when "Create Agency" button clicked
  - [ ] Form includes fields: name (required), description, website, phone, email, headquarters, founded_year, employee_count, company_size, offers_per_diem, is_union
  - [ ] Real-time validation with error messages
  - [ ] Submit button disabled until form is valid
  - [ ] Cancel button closes modal without saving
  - [ ] Success closes modal and refreshes agencies list
- **Definition of Done:**
  - [ ] Modal component complete
  - [ ] Tests verify form validation
  - [ ] Tests verify submit/cancel behaviors
  - [ ] **Final Check:** Follows existing modal patterns

**Estimated Effort:** 4 hours

---

### [ ] Task 1.2.2: Create Agency API Endpoint (POST)

- **Role:** Backend Developer
- **Objective:** Create API endpoint to add a new agency
- **Context:** Admin submits form data, API creates agency with auto-generated slug
- **Key Files to Create:**
  - `app/api/admin/agencies/route.ts` (add POST handler)
- **Key Files to Reference:**
  - `lib/utils/formatting.ts` (createSlug function)
  - `types/supabase.ts` (Agency type)
- **Key Patterns to Follow:**
  - RESTful API conventions
  - Zod validation schema
  - Atomic database operations
  - Proper error responses
- **Acceptance Criteria (for this task):**
  - [ ] `POST /api/admin/agencies` creates new agency
  - [ ] Slug auto-generated from name using createSlug()
  - [ ] Validates name is unique (returns 409 if duplicate)
  - [ ] Validates URL format for website field
  - [ ] Validates email format for email field
  - [ ] Validates phone format for phone field
  - [ ] Sets is_active=true, is_claimed=false by default
  - [ ] Returns created agency with 201 status
  - [ ] Returns 401/403 for auth errors
  - [ ] Returns 400 for validation errors with details
- **Definition of Done:**
  - [ ] Endpoint functional
  - [ ] Unit tests cover all validation scenarios
  - [ ] Tests cover duplicate name handling
  - [ ] 85%+ test coverage
  - [ ] **Final Check:** Follows existing admin API patterns

**Estimated Effort:** 3 hours

---

### [ ] Task 1.2.3: Create Zod Validation Schema for Agency Creation

- **Role:** Backend Developer
- **Objective:** Create comprehensive validation schema for agency data
- **Context:** Shared validation for both frontend and backend
- **Key Files to Create:**
  - `lib/validations/agency-creation.ts`
  - `lib/validations/__tests__/agency-creation.test.ts`
- **Key Files to Reference:**
  - `lib/validations/agency-profile.ts` (existing validation patterns)
  - `lib/validations/messages.ts` (existing patterns)
- **Key Patterns to Follow:**
  - Zod schema definitions
  - Reusable field validators
  - Clear error messages
- **Acceptance Criteria (for this task):**
  - [ ] Schema validates all agency fields
  - [ ] name: required, 2-200 characters, trimmed
  - [ ] description: optional, max 5000 characters
  - [ ] website: optional, valid URL format
  - [ ] phone: optional, valid phone format
  - [ ] email: optional, valid email format
  - [ ] founded_year: optional, integer 1800-current year
  - [ ] offers_per_diem, is_union: optional booleans
  - [ ] Error messages are user-friendly
- **Definition of Done:**
  - [ ] Schema complete and exported
  - [ ] Unit tests cover all validation rules
  - [ ] Tests verify error message format
  - [ ] **Final Check:** Consistent with existing validation patterns

**Estimated Effort:** 2 hours

---

### [ ] Task 1.2.4: Implement Slug Generation with Uniqueness Check

- **Role:** Backend Developer
- **Objective:** Ensure generated slugs are unique, appending numbers if needed
- **Context:** Multiple agencies may have similar names, need unique URL slugs
- **Key Files to Modify:**
  - `app/api/admin/agencies/route.ts`
- **Key Files to Reference:**
  - `lib/utils/formatting.ts` (createSlug function)
- **Key Patterns to Follow:**
  - Atomic slug generation with database check
  - Append incrementing number for duplicates
- **Acceptance Criteria (for this task):**
  - [ ] Slug generated from agency name (lowercase, hyphens)
  - [ ] If slug exists, append "-2", "-3", etc.
  - [ ] Maximum 5 attempts before failing with error
  - [ ] Slug stored in database with agency
- **Definition of Done:**
  - [ ] Slug generation with uniqueness check implemented
  - [ ] Tests verify duplicate handling
  - [ ] Tests verify edge cases (special characters, long names)
  - [ ] **Final Check:** Uses existing createSlug utility

**Estimated Effort:** 2 hours

---

## 📦 Phase 2: Bulk Import Functionality (Sprint 2)

**Goal:** Enable CSV/XLSX bulk import with validation preview
**Estimated Duration:** 1 week (5 days)
**Dependencies:** Phase 1 complete

---

### ➡️ Story 2.1: Admin Downloads CSV Template

> As a **Site Administrator**, I want **to download a CSV template with the correct column headers**, so that **I can prepare bulk import data in the correct format**.

### Engineering Tasks for this Story:

---

### [ ] Task 2.1.1: Create CSV Template Download Endpoint

- **Role:** Backend Developer
- **Objective:** Create API endpoint that returns downloadable CSV template
- **Context:** Admin needs template file with correct headers and example data
- **Key Files to Create:**
  - `app/api/admin/agencies/template/route.ts`
  - `app/api/admin/agencies/template/__tests__/route.test.ts`
- **Key Patterns to Follow:**
  - Return CSV file with Content-Disposition header
  - Include header row and 2 example rows
  - UTF-8 encoding for international characters
- **Acceptance Criteria (for this task):**
  - [ ] `GET /api/admin/agencies/template` returns CSV file
  - [ ] File includes headers: name, description, website, phone, email, headquarters, founded_year, employee_count, company_size, offers_per_diem, is_union, trades, regions
  - [ ] File includes 2 example rows with valid data
  - [ ] Content-Type is text/csv
  - [ ] Content-Disposition triggers download as "agency-import-template.csv"
  - [ ] Returns 401/403 for unauthorized users
- **Definition of Done:**
  - [ ] Endpoint returns valid CSV
  - [ ] Tests verify headers and content
  - [ ] Tests verify auth requirements
  - [ ] **Final Check:** CSV opens correctly in Excel/Google Sheets

**Estimated Effort:** 2 hours

---

### [ ] Task 2.1.2: Add Download Template Button to UI

- **Role:** Frontend Developer
- **Objective:** Add button to download CSV template from admin agencies page
- **Context:** Button should be near the bulk import button
- **Key Files to Modify:**
  - `app/(app)/admin/agencies/page.tsx`
- **Key Patterns to Follow:**
  - Shadcn/ui Button component
  - Direct link to API endpoint
  - Download attribute on anchor
- **Acceptance Criteria (for this task):**
  - [ ] "Download Template" button visible on admin agencies page
  - [ ] Button triggers file download when clicked
  - [ ] Button shows download icon (Lucide Download)
  - [ ] Loading state while downloading (if needed)
- **Definition of Done:**
  - [ ] Button functional
  - [ ] Tests verify button renders
  - [ ] **Final Check:** Download works in all browsers

**Estimated Effort:** 1 hour

---

### ➡️ Story 2.2: Admin Bulk Imports Agencies via CSV

> As a **Site Administrator**, I want **to upload a CSV file containing multiple agencies**, so that **I can quickly populate the database with data from external sources**.

### Engineering Tasks for this Story:

---

### [ ] Task 2.2.1: Create Bulk Import Modal Component

- **Role:** Frontend Developer
- **Objective:** Build modal with file upload zone and import preview
- **Context:** Multi-step modal: upload → preview → import → results
- **Key Files to Create:**
  - `components/admin/BulkImportModal.tsx`
  - `components/admin/__tests__/BulkImportModal.test.tsx`
- **Key Files to Reference:**
  - `components/admin/AgencyFormModal.tsx` (modal pattern)
- **Key Patterns to Follow:**
  - Shadcn/ui Dialog, Button components
  - Drag-and-drop file upload zone
  - Multi-step wizard pattern
- **Acceptance Criteria (for this task):**
  - [ ] Modal opens when "Bulk Import" button clicked
  - [ ] Step 1: Drag-and-drop file upload zone
  - [ ] Accepts .csv and .xlsx files only
  - [ ] Shows file name and size after selection
  - [ ] "Remove" button to clear selected file
  - [ ] "Next" button to proceed to preview
  - [ ] Cancel button closes modal
- **Definition of Done:**
  - [ ] File upload UI complete
  - [ ] Tests verify file selection
  - [ ] Tests verify file type validation
  - [ ] **Final Check:** Drag-and-drop works

**Estimated Effort:** 3 hours

---

### [ ] Task 2.2.2: Implement CSV/XLSX Parsing

- **Role:** Frontend Developer
- **Objective:** Parse uploaded file and extract agency data
- **Context:** Use papaparse for CSV, xlsx library for Excel files
- **Key Files to Create:**
  - `lib/utils/csv-parser.ts`
  - `lib/utils/__tests__/csv-parser.test.ts`
- **Key Patterns to Follow:**
  - Type-safe parsing with TypeScript
  - Handle missing/extra columns gracefully
  - Normalize boolean values (yes/no, true/false, 1/0)
- **Acceptance Criteria (for this task):**
  - [ ] Parses CSV files correctly (including quoted fields, commas in values)
  - [ ] Parses XLSX files (first sheet only)
  - [ ] Returns array of agency objects with normalized field names
  - [ ] Handles missing columns (set to undefined)
  - [ ] Handles extra columns (ignore)
  - [ ] Normalizes boolean strings to true/false
  - [ ] Parses comma-separated trades and regions into arrays
  - [ ] Returns parsing errors for malformed files
- **Definition of Done:**
  - [ ] Parser handles CSV and XLSX
  - [ ] Comprehensive unit tests
  - [ ] Tests verify edge cases (empty rows, special characters)
  - [ ] **Final Check:** Handles real-world messy data

**Estimated Effort:** 4 hours

---

### [ ] Task 2.2.3: Create Bulk Import Preview API Endpoint

- **Role:** Backend Developer
- **Objective:** Validate parsed data and return preview with per-row status
- **Context:** Admin reviews validation results before committing import
- **Key Files to Create:**
  - `app/api/admin/agencies/bulk-import/preview/route.ts`
  - `app/api/admin/agencies/bulk-import/preview/__tests__/route.test.ts`
- **Key Patterns to Follow:**
  - POST endpoint receiving parsed rows
  - Validate each row against schema
  - Check for duplicate names (existing + within batch)
  - Resolve trades and regions to IDs
- **Acceptance Criteria (for this task):**
  - [ ] `POST /api/admin/agencies/bulk-import/preview` accepts array of agency objects
  - [ ] Returns validation result for each row: valid, errors[], warnings[]
  - [ ] Checks name uniqueness against database
  - [ ] Checks name uniqueness within upload batch
  - [ ] Validates trade names against trades table, returns warnings for unknown
  - [ ] Validates region codes against regions table, returns warnings for unknown
  - [ ] Returns summary: total, valid, invalid, warnings
  - [ ] Does NOT create any agencies (preview only)
- **Definition of Done:**
  - [ ] Preview endpoint functional
  - [ ] Tests cover all validation scenarios
  - [ ] Tests verify no data is created
  - [ ] **Final Check:** Handles large batches (500+ rows)

**Estimated Effort:** 4 hours

---

### [ ] Task 2.2.4: Build Import Preview Table UI

- **Role:** Frontend Developer
- **Objective:** Display validation results in a reviewable table format
- **Context:** Admin needs to see which rows are valid and what errors exist
- **Key Files to Modify:**
  - `components/admin/BulkImportModal.tsx`
- **Key Files to Create:**
  - `components/admin/ImportPreviewTable.tsx`
  - `components/admin/__tests__/ImportPreviewTable.test.tsx`
- **Key Patterns to Follow:**
  - Shadcn/ui Table with status indicators
  - Color-coded row status (green=valid, red=invalid, yellow=warning)
  - Expandable error/warning details
- **Acceptance Criteria (for this task):**
  - [ ] Table shows all parsed rows with status icon
  - [ ] Valid rows show green checkmark
  - [ ] Invalid rows show red X with error message on hover/expand
  - [ ] Warning rows show yellow triangle with warning on hover/expand
  - [ ] Summary bar shows: "X valid, Y invalid, Z with warnings"
  - [ ] "Import Valid Rows" button (disabled if no valid rows)
  - [ ] "Back" button to return to file selection
- **Definition of Done:**
  - [ ] Preview table complete
  - [ ] Tests verify status display
  - [ ] Tests verify summary calculation
  - [ ] **Final Check:** Handles 500+ rows without performance issues

**Estimated Effort:** 4 hours

---

### [ ] Task 2.2.5: Create Bulk Import Execution Endpoint

- **Role:** Backend Developer
- **Objective:** Execute bulk import for validated rows
- **Context:** After preview approval, create all valid agencies in transaction
- **Key Files to Create:**
  - `app/api/admin/agencies/bulk-import/route.ts`
  - `app/api/admin/agencies/bulk-import/__tests__/route.test.ts`
- **Key Patterns to Follow:**
  - Atomic transaction for all inserts
  - Skip duplicates (by name)
  - Create trade/region associations
  - Return detailed results
- **Acceptance Criteria (for this task):**
  - [ ] `POST /api/admin/agencies/bulk-import` accepts array of validated agency objects
  - [ ] Creates agencies in database transaction
  - [ ] Auto-generates unique slugs for each agency
  - [ ] Creates agency_trades relationships for valid trades
  - [ ] Creates agency_regions relationships for valid regions
  - [ ] Skips rows with duplicate names (marks as skipped in results)
  - [ ] Returns results: created[], skipped[], failed[]
  - [ ] Rolls back entire transaction on critical error
  - [ ] Sets is_active=true, is_claimed=false for all created agencies
- **Definition of Done:**
  - [ ] Bulk import endpoint functional
  - [ ] Tests cover success, partial success, rollback scenarios
  - [ ] Tests verify trade/region associations created
  - [ ] **Final Check:** Handles 500+ rows in reasonable time (<30s)

**Estimated Effort:** 5 hours

---

### [ ] Task 2.2.6: Implement Import Progress and Results UI

- **Role:** Frontend Developer
- **Objective:** Show import progress and final results to admin
- **Context:** Final step of bulk import wizard showing what was created
- **Key Files to Modify:**
  - `components/admin/BulkImportModal.tsx`
- **Key Patterns to Follow:**
  - Progress indicator during import
  - Results summary with success/skip/fail counts
  - Option to view created agencies
- **Acceptance Criteria (for this task):**
  - [ ] Shows progress bar during import
  - [ ] Displays "Importing X of Y agencies..." message
  - [ ] Shows results summary: "Created: X, Skipped: Y, Failed: Z"
  - [ ] Lists skipped agencies with reason (e.g., "Already exists")
  - [ ] Lists failed agencies with error message
  - [ ] "View Agencies" button links to admin agencies list
  - [ ] "Import More" button resets wizard
  - [ ] "Close" button closes modal
- **Definition of Done:**
  - [ ] Progress and results UI complete
  - [ ] Tests verify all states
  - [ ] **Final Check:** Handles large imports gracefully

**Estimated Effort:** 3 hours

---

### ➡️ Story 2.3: Bulk Import Handles Trade and Region Associations

> As a **Site Administrator**, I want **the bulk import to create trade and region associations**, so that **imported agencies are fully searchable by specialty and location**.

### Engineering Tasks for this Story:

---

### [ ] Task 2.3.1: Implement Trade Name Matching Logic

- **Role:** Backend Developer
- **Objective:** Match trade names from CSV to database trade IDs
- **Context:** CSV contains trade names, need to match to trades table
- **Key Files to Modify:**
  - `app/api/admin/agencies/bulk-import/preview/route.ts`
  - `app/api/admin/agencies/bulk-import/route.ts`
- **Key Patterns to Follow:**
  - Case-insensitive matching
  - Fuzzy matching for common variations (optional)
  - Return unmatched trades as warnings
- **Acceptance Criteria (for this task):**
  - [ ] Matches trade names case-insensitively
  - [ ] Handles common variations: "Electrician" = "electrician" = "ELECTRICIAN"
  - [ ] Handles slug matching: "Electrician" matches trade with slug "electrician"
  - [ ] Unknown trades added to warnings list (not errors)
  - [ ] Creates agency_trades records for matched trades
- **Definition of Done:**
  - [ ] Trade matching implemented
  - [ ] Tests verify case-insensitive matching
  - [ ] Tests verify partial matches don't create false positives
  - [ ] **Final Check:** Matches all 48 existing trades

**Estimated Effort:** 2 hours

---

### [ ] Task 2.3.2: Implement Region Code Matching Logic

- **Role:** Backend Developer
- **Objective:** Match region/state codes from CSV to database region IDs
- **Context:** CSV contains state codes (TX, CA, NY), need to match to regions table
- **Key Files to Modify:**
  - `app/api/admin/agencies/bulk-import/preview/route.ts`
  - `app/api/admin/agencies/bulk-import/route.ts`
- **Key Patterns to Follow:**
  - Case-insensitive matching for state codes
  - Support both code (TX) and name (Texas)
  - Return unmatched regions as warnings
- **Acceptance Criteria (for this task):**
  - [ ] Matches state codes case-insensitively (TX = tx = Tx)
  - [ ] Matches full state names (Texas = TX)
  - [ ] Unknown regions added to warnings list (not errors)
  - [ ] Creates agency_regions records for matched regions
- **Definition of Done:**
  - [ ] Region matching implemented
  - [ ] Tests verify code and name matching
  - [ ] Tests verify all 50 states match
  - [ ] **Final Check:** Consistent with existing region data

**Estimated Effort:** 2 hours

---

## 📦 Phase 3: Agency Management Features (Sprint 3)

**Goal:** Enable admin editing and deactivation of agencies
**Estimated Duration:** 1 week (5 days)
**Dependencies:** Phase 1 & 2 complete

---

### ➡️ Story 3.1: Admin Edits Agency Details

> As a **Site Administrator**, I want **to edit any agency's details**, so that **I can correct errors or update information**.

### Engineering Tasks for this Story:

---

### [ ] Task 3.1.1: Create Admin Agency Detail Page

- **Role:** Frontend Developer
- **Objective:** Create page showing full agency details with edit capability
- **Context:** Clicking agency row in list opens detail page
- **Key Files to Create:**
  - `app/(app)/admin/agencies/[id]/page.tsx`
  - `app/(app)/admin/agencies/[id]/loading.tsx`
  - `app/(app)/admin/agencies/[id]/__tests__/page.test.tsx`
- **Key Files to Reference:**
  - `app/(app)/admin/users/[id]/page.tsx` (existing pattern)
- **Key Patterns to Follow:**
  - Server component with client components for forms
  - Breadcrumb navigation
  - Tabs for different sections (Details, Trades, Regions, History)
- **Acceptance Criteria (for this task):**
  - [ ] Route `/admin/agencies/[id]` shows agency details
  - [ ] Shows all agency fields in organized sections
  - [ ] Shows claimed status and owner (if claimed)
  - [ ] Shows created/updated timestamps
  - [ ] Includes "Edit" button to open edit modal
  - [ ] Includes "Back to Agencies" navigation
  - [ ] 404 if agency not found
- **Definition of Done:**
  - [ ] Detail page complete
  - [ ] Tests verify data display
  - [ ] Tests verify 404 handling
  - [ ] **Final Check:** Follows existing admin detail page patterns

**Estimated Effort:** 3 hours

---

### [ ] Task 3.1.2: Create Admin Agency Update Endpoint (PATCH)

- **Role:** Backend Developer
- **Objective:** Create API endpoint to update agency details
- **Context:** Admin edits agency, changes saved to database
- **Key Files to Modify:**
  - Create: `app/api/admin/agencies/[id]/route.ts`
  - Create: `app/api/admin/agencies/[id]/__tests__/route.test.ts`
- **Key Patterns to Follow:**
  - PATCH for partial updates
  - Validate only provided fields
  - Update last_edited_at, last_edited_by
  - Audit logging
- **Acceptance Criteria (for this task):**
  - [ ] `PATCH /api/admin/agencies/[id]` updates agency fields
  - [ ] Only updates fields provided in request body
  - [ ] Validates fields using same schema as creation
  - [ ] Updates last_edited_at to current timestamp
  - [ ] Updates last_edited_by to admin's user ID
  - [ ] Returns updated agency with 200 status
  - [ ] Returns 404 if agency not found
  - [ ] Returns 401/403 for auth errors
- **Definition of Done:**
  - [ ] Update endpoint functional
  - [ ] Tests cover all scenarios
  - [ ] Tests verify audit fields updated
  - [ ] **Final Check:** Consistent with existing admin patterns

**Estimated Effort:** 3 hours

---

### [ ] Task 3.1.3: Enable Edit Mode in Agency Form Modal

- **Role:** Frontend Developer
- **Objective:** Reuse AgencyFormModal for editing existing agencies
- **Context:** Same form component, pre-populated with existing data
- **Key Files to Modify:**
  - `components/admin/AgencyFormModal.tsx`
- **Key Patterns to Follow:**
  - Pass agency prop to pre-populate form
  - Change submit to PATCH instead of POST
  - Different title: "Edit Agency" vs "Create Agency"
- **Acceptance Criteria (for this task):**
  - [ ] Form pre-populates when editing existing agency
  - [ ] Modal title shows "Edit Agency" in edit mode
  - [ ] Submit calls PATCH endpoint in edit mode
  - [ ] Success message shows "Agency updated" vs "Agency created"
  - [ ] Changes refresh detail page data
- **Definition of Done:**
  - [ ] Edit mode functional
  - [ ] Tests verify pre-population
  - [ ] Tests verify correct API calls
  - [ ] **Final Check:** No code duplication between create/edit

**Estimated Effort:** 2 hours

---

### ➡️ Story 3.2: Admin Deactivates/Reactivates Agency

> As a **Site Administrator**, I want **to deactivate or reactivate an agency**, so that **I can remove agencies that are no longer in business or restore accidentally deactivated ones**.

### Engineering Tasks for this Story:

---

### [ ] Task 3.2.1: Create Deactivation Confirmation Dialog

- **Role:** Frontend Developer
- **Objective:** Create confirmation dialog for agency deactivation
- **Context:** Admin must confirm before deactivating to prevent accidents
- **Key Files to Create:**
  - `components/admin/AgencyStatusDialog.tsx`
  - `components/admin/__tests__/AgencyStatusDialog.test.tsx`
- **Key Files to Reference:**
  - `components/admin/ClaimRejectionDialog.tsx` (existing pattern)
- **Key Patterns to Follow:**
  - Shadcn/ui AlertDialog component
  - Destructive button styling for deactivation
  - Clear explanation of consequences
- **Acceptance Criteria (for this task):**
  - [ ] Dialog explains consequences of deactivation
  - [ ] Shows agency name prominently
  - [ ] "Deactivate" button has destructive styling
  - [ ] "Cancel" button closes without action
  - [ ] "Reactivate" variant has success styling
  - [ ] Keyboard accessible (Escape to close)
- **Definition of Done:**
  - [ ] Dialog component complete
  - [ ] Tests verify both variants
  - [ ] Tests verify keyboard navigation
  - [ ] **Final Check:** Follows existing confirmation patterns

**Estimated Effort:** 2 hours

---

### [ ] Task 3.2.2: Implement Status Toggle Endpoint

- **Role:** Backend Developer
- **Objective:** Create endpoint to toggle agency active status
- **Context:** Changes is_active field, triggers appropriate side effects
- **Key Files to Modify:**
  - `app/api/admin/agencies/[id]/route.ts`
- **Key Patterns to Follow:**
  - POST for action (status change)
  - Audit logging
  - Consider notifying agency owner if claimed
- **Acceptance Criteria (for this task):**
  - [ ] `POST /api/admin/agencies/[id]/status` toggles is_active
  - [ ] Request body specifies: { active: boolean }
  - [ ] Updates last_edited_at, last_edited_by
  - [ ] Returns updated agency
  - [ ] Logs action in audit trail (optional)
  - [ ] Returns 401/403 for auth errors
- **Definition of Done:**
  - [ ] Status endpoint functional
  - [ ] Tests cover activate/deactivate
  - [ ] Tests verify audit fields
  - [ ] **Final Check:** Handles edge cases (already active/inactive)

**Estimated Effort:** 2 hours

---

### [ ] Task 3.2.3: Add Status Toggle Button to Agency Detail Page

- **Role:** Frontend Developer
- **Objective:** Add deactivate/reactivate button to agency detail page
- **Context:** Admin can change status from detail page header
- **Key Files to Modify:**
  - `app/(app)/admin/agencies/[id]/page.tsx`
- **Key Patterns to Follow:**
  - Conditional button text based on current status
  - Opens confirmation dialog
  - Refreshes page after status change
- **Acceptance Criteria (for this task):**
  - [ ] Shows "Deactivate" button if agency is active
  - [ ] Shows "Reactivate" button if agency is inactive
  - [ ] Button click opens confirmation dialog
  - [ ] Page refreshes after successful status change
  - [ ] Shows toast notification on success/error
- **Definition of Done:**
  - [ ] Status toggle functional
  - [ ] Tests verify button states
  - [ ] Tests verify API integration
  - [ ] **Final Check:** Consistent with existing admin actions

**Estimated Effort:** 2 hours

---

### [ ] Task 3.2.4: Add Status Badge to Agencies Table

- **Role:** Frontend Developer
- **Objective:** Show visual status indicator in agencies list
- **Context:** Admin can quickly see which agencies are active/inactive
- **Key Files to Modify:**
  - `components/admin/AgenciesTable.tsx`
- **Key Patterns to Follow:**
  - Shadcn/ui Badge component
  - Color coding: green=active, gray=inactive
- **Acceptance Criteria (for this task):**
  - [ ] Status column shows badge with "Active" or "Inactive"
  - [ ] Active badge is green
  - [ ] Inactive badge is gray/muted
  - [ ] Badge is visually distinct and scannable
- **Definition of Done:**
  - [ ] Status badges implemented
  - [ ] Tests verify badge rendering
  - [ ] **Final Check:** Accessible color contrast

**Estimated Effort:** 1 hour

---

## 📊 Summary

### Total Tasks: 24

| Phase                          | Tasks        | Estimated Hours |
| ------------------------------ | ------------ | --------------- |
| Phase 1: Admin List & Creation | 8 tasks      | 23 hours        |
| Phase 2: Bulk Import           | 10 tasks     | 31 hours        |
| Phase 3: Management Features   | 6 tasks      | 15 hours        |
| **Total**                      | **24 tasks** | **69 hours**    |

### Dependencies Graph

```
Phase 1 (Week 1)
├── 1.1.1 Admin List Page
├── 1.1.2 Admin List API ──────────┐
├── 1.1.3 Search & Filters ────────┤
├── 1.1.4 Pagination ──────────────┘
├── 1.2.1 Agency Form Modal
├── 1.2.2 Create Agency API ───────┐
├── 1.2.3 Zod Validation ──────────┤
└── 1.2.4 Slug Generation ─────────┘

Phase 2 (Week 2)
├── 2.1.1 Template API
├── 2.1.2 Template Button
├── 2.2.1 Import Modal
├── 2.2.2 CSV Parser
├── 2.2.3 Preview API ─────────────┐
├── 2.2.4 Preview Table ───────────┤
├── 2.2.5 Import API ──────────────┤
├── 2.2.6 Progress UI ─────────────┘
├── 2.3.1 Trade Matching
└── 2.3.2 Region Matching

Phase 3 (Week 3)
├── 3.1.1 Detail Page
├── 3.1.2 Update API
├── 3.1.3 Edit Mode
├── 3.2.1 Status Dialog
├── 3.2.2 Status API
├── 3.2.3 Status Button
└── 3.2.4 Status Badge
```

### Key Files to Create

**API Routes:**

- `app/api/admin/agencies/route.ts` (GET, POST)
- `app/api/admin/agencies/[id]/route.ts` (GET, PATCH)
- `app/api/admin/agencies/[id]/status/route.ts` (POST)
- `app/api/admin/agencies/template/route.ts` (GET)
- `app/api/admin/agencies/bulk-import/route.ts` (POST)
- `app/api/admin/agencies/bulk-import/preview/route.ts` (POST)

**Pages:**

- `app/(app)/admin/agencies/page.tsx`
- `app/(app)/admin/agencies/[id]/page.tsx`

**Components:**

- `components/admin/AgenciesTable.tsx`
- `components/admin/AgencyFormModal.tsx`
- `components/admin/BulkImportModal.tsx`
- `components/admin/ImportPreviewTable.tsx`
- `components/admin/AgencyStatusDialog.tsx`

**Utilities:**

- `lib/validations/agency-creation.ts`
- `lib/utils/csv-parser.ts`
