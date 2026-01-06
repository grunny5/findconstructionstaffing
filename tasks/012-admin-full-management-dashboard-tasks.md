# Task Backlog: Admin Full Management Dashboard

**Source FSD:** `docs/features/active/012-admin-full-management-dashboard.md`
**Project Foundation:** `CLAUDE.md` (TypeScript strict mode, 85%+ test coverage, Shadcn/ui patterns)
**Reference Documentation:** `PROJECT_KICKSTART_V2.md` (Epic: Admin Portal)

This document breaks down Feature #012 into sprint-ready engineering tasks. All tasks must adhere to project standards: TypeScript strict mode, 85%+ test coverage, no unnecessary comments, and use existing UI components from Shadcn/ui.

---

## 📦 Phase 1: Agency Full Editing (Sprint 1)

**Goal:** Enable admins to edit all agency fields including trades, regions, and logo
**Estimated Duration:** 1 week (5 days)
**Dependencies:** Feature 011 (Complete ✅), Feature 008 (Complete ✅)

---

### [x] ➡️ Story 1.1: Admin Edits Agency Trade Specialties

> As a **Site Administrator**, I want **to add, edit, or remove trade specialties from any agency's profile**, so that **I can ensure agencies are accurately categorized for search and matching without requiring the agency owner to make changes**.

### Engineering Tasks for Story 1.1:

---

### [x] Task 1.1.1: Add TradeSelector Component to AgencyFormModal

- **Role:** Frontend Developer
- **Objective:** Integrate the existing TradeSelector component into the admin AgencyFormModal
- **Context:** The TradeSelector already exists for agency owners; we need to reuse it for admin editing
- **Key Files to Modify:**
  - `components/admin/AgencyFormModal.tsx`
  - `components/admin/__tests__/AgencyFormModal.test.tsx`
- **Key Files to Reference:**
  - `components/dashboard/TradeSelector.tsx` (existing component)
  - `app/api/agencies/[slug]/trades/route.ts` (existing agency owner endpoint)
- **Key Patterns to Follow:**
  - React Hook Form integration with multi-select
  - Controlled component state
  - No trade limit for admins (unlike 10-trade limit for owners)
- **Acceptance Criteria (for this task):**
  - [ ] TradeSelector component rendered in AgencyFormModal
  - [ ] All 48 trades displayed and selectable
  - [ ] Current trades pre-selected when editing existing agency
  - [ ] Form state properly tracks selected trade IDs
  - [ ] No maximum trade limit enforced for admin
- **Definition of Done:**
  - [ ] Component integrated and functional
  - [ ] Tests verify trade selection UI
  - [ ] Tests verify pre-population in edit mode
  - [ ] **Final Check:** Follows existing form patterns in AgencyFormModal

**Estimated Effort:** 3 hours

---

### [x] Task 1.1.2: Extend Admin Agency PATCH Endpoint for Trades

- **Role:** Backend Developer
- **Objective:** Add trade_ids support to the existing PATCH /api/admin/agencies/[id] endpoint
- **Context:** The endpoint currently handles basic fields; needs to manage junction table updates
- **Key Files to Modify:**
  - `app/api/admin/agencies/[id]/route.ts`
  - `app/api/admin/agencies/[id]/__tests__/route.test.ts`
- **Key Files to Reference:**
  - `app/api/agencies/[slug]/trades/route.ts` (existing trade update logic)
  - `lib/validations/agency-trades.ts` (existing validation schema)
- **Key Patterns to Follow:**
  - Atomic transaction for junction table updates
  - Delete existing + insert new pattern
  - Validate trade IDs exist in trades table
- **Acceptance Criteria (for this task):**
  - [ ] PATCH accepts `trade_ids: string[]` in request body
  - [ ] Invalid trade IDs return 400 with specific error
  - [ ] Existing agency_trades records deleted and new ones created atomically
  - [ ] Empty array clears all trades for agency
  - [ ] Audit trail entry created for trade changes
  - [ ] Returns updated agency with trades in response
- **Definition of Done:**
  - [ ] Endpoint handles trade updates correctly
  - [ ] Unit tests cover success, validation errors, empty array
  - [ ] 85%+ test coverage for new code
  - [ ] **Final Check:** Follows existing admin API patterns

**Estimated Effort:** 3 hours

---

### [x] Task 1.1.3: Fetch and Display Current Agency Trades in Edit Modal

- **Role:** Frontend Developer
- **Objective:** Load current trades when opening the edit modal and pass to TradeSelector
- **Context:** When admin clicks "Edit" on an agency, the modal needs to show existing trades
- **Key Files to Modify:**
  - `components/admin/AgencyFormModal.tsx`
  - `app/(app)/admin/agencies/[id]/page.tsx`
- **Key Files to Reference:**
  - `app/api/admin/agencies/[id]/route.ts` (GET returns agency with trades)
- **Key Patterns to Follow:**
  - Fetch trades with agency data
  - Map trade objects to IDs for form default values
- **Acceptance Criteria (for this task):**
  - [ ] Agency detail API returns trades array with agency data
  - [ ] Edit modal receives trades as prop
  - [ ] TradeSelector shows existing trades as selected
  - [ ] Changes to trades reflected in form dirty state
- **Definition of Done:**
  - [ ] Trades pre-populated correctly in edit mode
  - [ ] Tests verify pre-population
  - [ ] **Final Check:** Consistent with existing edit patterns

**Estimated Effort:** 2 hours

---

### [x] ➡️ Story 1.2: Admin Edits Agency Service Areas (Regions)

> As a **Site Administrator**, I want **to add, edit, or remove service areas (regions/states) from any agency's profile**, so that **I can ensure agencies appear in location-based searches correctly**.

### Engineering Tasks for Story 1.2:

---

### [x] Task 1.2.1: Add RegionSelector Component to AgencyFormModal

- **Role:** Frontend Developer
- **Objective:** Integrate the existing RegionSelector component into the admin AgencyFormModal
- **Context:** The RegionSelector already exists for agency owners; we need to reuse it for admin editing
- **Key Files to Modify:**
  - `components/admin/AgencyFormModal.tsx`
  - `components/admin/__tests__/AgencyFormModal.test.tsx`
- **Key Files to Reference:**
  - `components/dashboard/RegionSelector.tsx` (existing component)
  - `app/api/agencies/[slug]/regions/route.ts` (existing agency owner endpoint)
- **Key Patterns to Follow:**
  - State checkbox grid pattern
  - React Hook Form integration
  - Controlled component state
- **Acceptance Criteria (for this task):**
  - [ ] RegionSelector component rendered in AgencyFormModal
  - [ ] All 35 US states/regions displayed as checkboxes
  - [ ] Current regions pre-selected when editing existing agency
  - [ ] Form state properly tracks selected region IDs
  - [ ] "Select All" / "Clear All" functionality works
- **Definition of Done:**
  - [ ] Component integrated and functional
  - [ ] Tests verify region selection UI
  - [ ] Tests verify pre-population in edit mode
  - [ ] **Final Check:** Follows existing form patterns

**Estimated Effort:** 3 hours

---

### [x] Task 1.2.2: Extend Admin Agency PATCH Endpoint for Regions

- **Role:** Backend Developer
- **Objective:** Add region_ids support to the existing PATCH /api/admin/agencies/[id] endpoint
- **Context:** Similar to trades, needs to manage agency_regions junction table
- **Key Files to Modify:**
  - `app/api/admin/agencies/[id]/route.ts`
  - `app/api/admin/agencies/[id]/__tests__/route.test.ts`
- **Key Files to Reference:**
  - `app/api/agencies/[slug]/regions/route.ts` (existing region update logic)
  - `lib/validations/agency-regions.ts` (existing validation schema)
- **Key Patterns to Follow:**
  - Atomic transaction for junction table updates
  - Delete existing + insert new pattern
  - Validate region IDs exist in regions table
- **Acceptance Criteria (for this task):**
  - [ ] PATCH accepts `region_ids: string[]` in request body
  - [ ] Invalid region IDs return 400 with specific error
  - [ ] Existing agency_regions records deleted and new ones created atomically
  - [ ] Empty array clears all regions for agency
  - [ ] Audit trail entry created for region changes
  - [ ] Returns updated agency with regions in response
- **Definition of Done:**
  - [ ] Endpoint handles region updates correctly
  - [ ] Unit tests cover success, validation errors, empty array
  - [ ] 85%+ test coverage for new code
  - [ ] **Final Check:** Follows existing admin API patterns

**Estimated Effort:** 3 hours

---

### [x] Task 1.2.3: Fetch and Display Current Agency Regions in Edit Modal

- **Role:** Frontend Developer
- **Objective:** Load current regions when opening the edit modal and pass to RegionSelector
- **Context:** When admin clicks "Edit" on an agency, the modal needs to show existing regions
- **Key Files to Modify:**
  - `components/admin/AgencyFormModal.tsx`
  - `app/(app)/admin/agencies/[id]/page.tsx`
- **Key Files to Reference:**
  - `app/api/admin/agencies/[id]/route.ts` (GET returns agency with regions)
- **Key Patterns to Follow:**
  - Fetch regions with agency data
  - Map region objects to IDs for form default values
- **Acceptance Criteria (for this task):**
  - [ ] Agency detail API returns regions array with agency data
  - [ ] Edit modal receives regions as prop
  - [ ] RegionSelector shows existing regions as checked
  - [ ] Changes to regions reflected in form dirty state
- **Definition of Done:**
  - [ ] Regions pre-populated correctly in edit mode
  - [ ] Tests verify pre-population
  - [ ] **Final Check:** Consistent with existing edit patterns

**Estimated Effort:** 2 hours

---

### [x] ➡️ Story 1.3: Admin Edits Agency Logo

> As a **Site Administrator**, I want **to upload or change an agency's logo**, so that **I can ensure agency profiles have proper branding without requiring owner action**.

### Engineering Tasks for Story 1.3:

---

### [x] Task 1.3.1: Create Supabase Storage Bucket for Agency Logos

- **Role:** Backend Developer
- **Objective:** Set up Supabase Storage bucket with proper policies for agency logos
- **Context:** Need secure storage for logo images with admin-only upload access
- **Key Files to Create:**
  - `supabase/migrations/[timestamp]_create_agency_logos_bucket.sql`
- **Key Files to Reference:**
  - Supabase Storage documentation
  - Existing RLS policy patterns
- **Key Patterns to Follow:**
  - Public read access for logo display
  - Admin-only write access
  - File path structure: `logos/{agency_id}/{filename}`
- **Acceptance Criteria (for this task):**
  - [ ] Storage bucket `agency-logos` created
  - [ ] Public SELECT policy for all users (to display logos)
  - [ ] INSERT/UPDATE/DELETE policies for admin role only
  - [ ] File size limit configured (5MB max)
  - [ ] Allowed MIME types: image/png, image/jpeg, image/webp
- **Definition of Done:**
  - [ ] Migration created and tested locally
  - [ ] Bucket accessible via Supabase client
  - [ ] **Final Check:** Security policies properly configured

**Estimated Effort:** 2 hours

---

### [x] Task 1.3.2: Create LogoUpload Component

- **Role:** Frontend Developer
- **Objective:** Build a reusable logo upload component with 300x300 preview and validation
- **Context:** Component will be used in AgencyFormModal for logo management. Logos are displayed on agency cards and profile pages.
- **Key Files to Create:**
  - `components/admin/LogoUpload.tsx`
  - `components/admin/__tests__/LogoUpload.test.tsx`
- **Key Files to Reference:**
  - `components/admin/BulkImportModal.tsx` (drag-and-drop pattern)
  - Shadcn/ui Avatar component
- **Key Patterns to Follow:**
  - Drag-and-drop upload zone
  - 300x300 square preview area
  - Client-side validation (type, size)
  - Loading state during upload
- **Logo Specifications:**
  - **Output dimensions:** 300px x 300px (square)
  - **Accepted formats:** PNG, JPG, WebP
  - **Max upload size:** 5MB
- **Acceptance Criteria (for this task):**
  - [ ] Drag-and-drop zone accepts image files
  - [ ] Click to browse functionality
  - [ ] Preview shows selected/current image in 300x300 square container
  - [ ] Validates file type (PNG, JPG, WebP only)
  - [ ] Validates file size (max 5MB)
  - [ ] Shows helpful text: "Recommended: Square image, 300x300px"
  - [ ] "Remove" button to clear selection/existing logo
  - [ ] Loading spinner during upload
  - [ ] Error messages for invalid files
- **Definition of Done:**
  - [ ] Component complete with all states
  - [ ] Tests verify all validation scenarios
  - [ ] Tests verify drag-and-drop functionality
  - [ ] **Final Check:** Accessible and mobile-friendly

**Estimated Effort:** 4 hours

---

### [x] Task 1.3.3: Create Logo Upload API Endpoint

- **Role:** Backend Developer
- **Objective:** Create endpoint to upload agency logos to Supabase Storage with server-side resizing
- **Context:** Handles file upload, resizes to 300x300, stores in Supabase, and updates agency.logo_url
- **Key Files to Create:**
  - `app/api/admin/agencies/[id]/logo/route.ts`
  - `app/api/admin/agencies/[id]/logo/__tests__/route.test.ts`
- **Key Files to Reference:**
  - Supabase Storage client documentation
  - Sharp library for image resizing (npm install sharp)
  - Existing admin endpoint patterns
- **Key Patterns to Follow:**
  - FormData handling for file upload
  - Server-side resize to 300x300 using Sharp
  - Generate unique filename with agency ID
  - Delete old logo before uploading new
  - Return public URL after upload
- **Logo Processing:**
  - Resize to exactly 300x300 pixels
  - Maintain aspect ratio with cover fit (crop to fill)
  - Convert to WebP for optimal file size
  - Quality: 85%
- **Acceptance Criteria (for this task):**
  - [ ] `POST /api/admin/agencies/[id]/logo` accepts multipart form data
  - [ ] Validates file type and size server-side
  - [ ] Resizes image to 300x300 pixels using Sharp
  - [ ] Converts to WebP format for storage
  - [ ] Uploads to Supabase Storage in `logos/{agency_id}/` path
  - [ ] Updates agency.logo_url with public URL
  - [ ] Deletes old logo file if replacing
  - [ ] Returns 401/403 for unauthorized users
  - [ ] Returns 400 for invalid files with specific error
  - [ ] `DELETE /api/admin/agencies/[id]/logo` removes logo
  - [ ] DELETE sets logo_url to null and removes storage file
- **Definition of Done:**
  - [ ] Upload and delete endpoints functional
  - [ ] Image resizing tested with various input sizes
  - [ ] Unit tests cover all scenarios
  - [ ] 85%+ test coverage
  - [ ] **Final Check:** Follows existing admin API patterns

**Estimated Effort:** 5 hours

---

### [x] Task 1.3.4: Integrate LogoUpload into AgencyFormModal

- **Role:** Frontend Developer
- **Objective:** Add logo upload capability to the agency create/edit modal
- **Context:** Admin should be able to upload logo as part of agency editing flow
- **Key Files to Modify:**
  - `components/admin/AgencyFormModal.tsx`
  - `components/admin/__tests__/AgencyFormModal.test.tsx`
- **Key Files to Reference:**
  - `components/admin/LogoUpload.tsx` (created in Task 1.3.2)
- **Key Patterns to Follow:**
  - Separate upload call from form submission
  - Show current logo in edit mode
  - Handle upload errors gracefully
- **Acceptance Criteria (for this task):**
  - [ ] LogoUpload component rendered in AgencyFormModal
  - [ ] Current logo displayed when editing existing agency
  - [ ] New logo uploaded on form submission (if changed)
  - [ ] Logo removal triggers DELETE endpoint
  - [ ] Upload errors shown with option to retry
  - [ ] Form can be saved without logo
- **Definition of Done:**
  - [ ] Logo upload integrated and functional
  - [ ] Tests verify upload flow
  - [ ] Tests verify removal flow
  - [ ] **Final Check:** Consistent UX with other form fields

**Estimated Effort:** 3 hours

---

### [x] Task 1.3.5: Display Logo on Agency Cards and Profile Page

- **Role:** Frontend Developer
- **Objective:** Show agency logos on the directory listing cards and agency profile page header
- **Context:** Logos uploaded by admin should be visible to all users browsing agencies
- **Key Files to Modify:**
  - `components/AgencyCard.tsx` (directory listing card)
  - `app/recruiters/[slug]/page.tsx` (agency profile page)
- **Key Files to Reference:**
  - Shadcn/ui Avatar component
  - Next.js Image component for optimization
- **Key Patterns to Follow:**
  - Use Next.js Image for automatic optimization
  - Fallback to initials/placeholder if no logo
  - Responsive sizing for different viewports
- **Acceptance Criteria (for this task):**
  - [ ] Agency cards show logo (if available) in top-left or header area
  - [ ] Logo displayed at appropriate size on cards (e.g., 64x64 or 80x80)
  - [ ] Agency profile page shows logo prominently in header (e.g., 120x120 or 150x150)
  - [ ] Fallback placeholder shown when no logo (initials or generic icon)
  - [ ] Images lazy-loaded for performance
  - [ ] Alt text includes agency name for accessibility
- **Definition of Done:**
  - [ ] Logos display correctly on cards and profile
  - [ ] Fallback works when no logo
  - [ ] Tests verify logo rendering
  - [ ] **Final Check:** Responsive and accessible

**Estimated Effort:** 3 hours

---

## 📦 Phase 2: User Management (Sprint 2)

**Goal:** Enable admins to create, edit, and delete user accounts
**Estimated Duration:** 1 week (5 days)
**Dependencies:** Phase 1 complete, Feature 007 (Authentication - Complete ✅)

---

### [ ] ➡️ Story 2.1: Admin Creates New User Account

> As a **Site Administrator**, I want **to create new user accounts directly from the admin dashboard**, so that **I can onboard users manually when needed (e.g., for agency owners who need assistance)**.

### Engineering Tasks for Story 2.1:

---

### [ ] Task 2.1.1: Create User Creation API Endpoint

- **Role:** Backend Developer
- **Objective:** Create endpoint to create new users via Supabase Auth Admin API
- **Context:** Admin needs to create users without them going through signup flow
- **Key Files to Create:**
  - `app/api/admin/users/route.ts` (POST handler)
  - `app/api/admin/users/__tests__/route.test.ts`
- **Key Files to Reference:**
  - Supabase Auth Admin API documentation
  - `app/api/admin/users/[id]/role/route.ts` (existing role change pattern)
- **Key Patterns to Follow:**
  - Use Supabase service role key for admin operations
  - Create auth user then profile in transaction
  - Generate temporary password or use invite flow
- **Acceptance Criteria (for this task):**
  - [ ] `POST /api/admin/users` creates new user
  - [ ] Accepts: email (required), full_name, role (default: user)
  - [ ] Creates auth.users record via Admin API
  - [ ] Creates profiles record with specified role
  - [ ] Sends password reset email automatically
  - [ ] Returns 409 if email already exists
  - [ ] Returns 401/403 for unauthorized users
  - [ ] Returns 400 for validation errors
- **Definition of Done:**
  - [ ] Endpoint creates users correctly
  - [ ] Unit tests cover all scenarios
  - [ ] Integration test verifies email sent
  - [ ] 85%+ test coverage
  - [ ] **Final Check:** Follows existing admin API patterns

**Estimated Effort:** 4 hours

---

### [ ] Task 2.1.2: Create UserFormModal Component

- **Role:** Frontend Developer
- **Objective:** Build modal form for creating new users
- **Context:** Modal opens from "Create User" button on admin users page
- **Key Files to Create:**
  - `components/admin/UserFormModal.tsx`
  - `components/admin/__tests__/UserFormModal.test.tsx`
- **Key Files to Reference:**
  - `components/admin/AgencyFormModal.tsx` (existing modal pattern)
  - `components/admin/RoleChangeModal.tsx` (role selection pattern)
- **Key Patterns to Follow:**
  - Shadcn/ui Dialog, Form components
  - React Hook Form with Zod validation
  - Role dropdown (user, agency_owner, admin)
- **Acceptance Criteria (for this task):**
  - [ ] Modal with fields: email (required), full_name, role
  - [ ] Email validation (format)
  - [ ] Role dropdown with all three options
  - [ ] Submit button calls POST /api/admin/users
  - [ ] Success toast and modal close on success
  - [ ] Error display for duplicate email
  - [ ] Cancel button closes without action
- **Definition of Done:**
  - [ ] Modal component complete
  - [ ] Tests verify form validation
  - [ ] Tests verify API integration
  - [ ] **Final Check:** Follows existing modal patterns

**Estimated Effort:** 3 hours

---

### [ ] Task 2.1.3: Add Create User Button to Admin Users Page

- **Role:** Frontend Developer
- **Objective:** Add "Create User" button that opens UserFormModal
- **Context:** Button should be in the page header alongside existing actions
- **Key Files to Modify:**
  - `app/(app)/admin/users/page.tsx`
- **Key Files to Create:**
  - `components/admin/AdminUsersActions.tsx`
  - `components/admin/__tests__/AdminUsersActions.test.tsx`
- **Key Files to Reference:**
  - `components/admin/AdminAgenciesActions.tsx` (existing pattern)
- **Key Patterns to Follow:**
  - Client component for modal state
  - Refresh list after successful creation
- **Acceptance Criteria (for this task):**
  - [ ] "Create User" button visible on admin users page
  - [ ] Button click opens UserFormModal
  - [ ] User list refreshes after successful creation
  - [ ] New user appears in list
- **Definition of Done:**
  - [ ] Button and integration complete
  - [ ] Tests verify button renders and opens modal
  - [ ] **Final Check:** Consistent with AdminAgenciesActions pattern

**Estimated Effort:** 2 hours

---

### [ ] ➡️ Story 2.2: Admin Edits User Profile

> As a **Site Administrator**, I want **to edit user profile information**, so that **I can correct errors or update user details without requiring the user to do it themselves**.

### Engineering Tasks for Story 2.2:

---

### [ ] Task 2.2.1: Create User Update API Endpoint

- **Role:** Backend Developer
- **Objective:** Create endpoint to update user profile and optionally email
- **Context:** Admin can update profile fields and trigger email change with verification
- **Key Files to Create:**
  - `app/api/admin/users/[id]/route.ts` (PATCH handler)
  - `app/api/admin/users/[id]/__tests__/route.test.ts`
- **Key Files to Reference:**
  - `app/api/settings/profile/route.ts` (existing profile update)
  - `app/api/settings/email/route.ts` (existing email update)
- **Key Patterns to Follow:**
  - Separate profile update from email update
  - Email change requires Admin API
  - Audit logging for changes
- **Acceptance Criteria (for this task):**
  - [ ] `PATCH /api/admin/users/[id]` updates user
  - [ ] Can update: full_name, avatar_url (profile fields)
  - [ ] Can update: email (triggers re-verification)
  - [ ] Returns 404 if user not found
  - [ ] Returns 409 if new email already in use
  - [ ] Returns 401/403 for unauthorized users
  - [ ] Audit trail entry created for changes
- **Definition of Done:**
  - [ ] Endpoint updates users correctly
  - [ ] Unit tests cover all scenarios
  - [ ] 85%+ test coverage
  - [ ] **Final Check:** Follows existing admin API patterns

**Estimated Effort:** 3 hours

---

### [ ] Task 2.2.2: Add Edit Mode to UserFormModal

- **Role:** Frontend Developer
- **Objective:** Extend UserFormModal to support editing existing users
- **Context:** Same modal used for create and edit, pre-populated in edit mode
- **Key Files to Modify:**
  - `components/admin/UserFormModal.tsx`
  - `components/admin/__tests__/UserFormModal.test.tsx`
- **Key Files to Reference:**
  - `components/admin/AgencyFormModal.tsx` (create/edit pattern)
- **Key Patterns to Follow:**
  - Pass user prop for edit mode
  - Pre-populate form with existing data
  - Different title: "Edit User" vs "Create User"
  - PATCH vs POST based on mode
- **Acceptance Criteria (for this task):**
  - [ ] Modal shows "Edit User" title in edit mode
  - [ ] Form pre-populated with user data
  - [ ] Submit calls PATCH in edit mode
  - [ ] Role field shows current role
  - [ ] Email change warning displayed
  - [ ] Success message shows "User updated"
- **Definition of Done:**
  - [ ] Edit mode functional
  - [ ] Tests verify pre-population
  - [ ] Tests verify correct API calls
  - [ ] **Final Check:** No code duplication between modes

**Estimated Effort:** 2 hours

---

### [ ] Task 2.2.3: Add Edit Button to User Detail Page

- **Role:** Frontend Developer
- **Objective:** Add "Edit" button to user detail page header
- **Context:** Admin viewing a user's detail page can click to edit
- **Key Files to Modify:**
  - `app/(app)/admin/users/[id]/page.tsx`
- **Key Patterns to Follow:**
  - Button in page header
  - Opens UserFormModal in edit mode
  - Refresh page data after edit
- **Acceptance Criteria (for this task):**
  - [ ] "Edit" button visible on user detail page
  - [ ] Button click opens UserFormModal with user data
  - [ ] Page refreshes after successful edit
  - [ ] Updated data displayed immediately
- **Definition of Done:**
  - [ ] Edit button and integration complete
  - [ ] Tests verify edit flow
  - [ ] **Final Check:** Consistent with agency detail page pattern

**Estimated Effort:** 2 hours

---

### [ ] ➡️ Story 2.3: Admin Deletes User Account

> As a **Site Administrator**, I want **to delete user accounts that are spam, duplicate, or requested for removal**, so that **I can maintain data hygiene and honor deletion requests**.

### Engineering Tasks for Story 2.3:

---

### [ ] Task 2.3.1: Create User Delete API Endpoint

- **Role:** Backend Developer
- **Objective:** Create endpoint to delete users via Supabase Auth Admin API
- **Context:** Must handle cascade to profiles and handle agency ownership
- **Key Files to Create:**
  - `app/api/admin/users/[id]/route.ts` (DELETE handler)
- **Key Files to Modify:**
  - `app/api/admin/users/[id]/__tests__/route.test.ts`
- **Key Files to Reference:**
  - Supabase Auth Admin API documentation
  - `app/api/settings/account/route.ts` (existing self-delete pattern)
- **Key Patterns to Follow:**
  - Use Admin API for auth.users deletion
  - Check for claimed agencies before delete
  - Support reassign or unclaim agency
  - Audit logging
- **Acceptance Criteria (for this task):**
  - [ ] `DELETE /api/admin/users/[id]` deletes user
  - [ ] Accepts optional: `agency_action` (reassign | unclaim)
  - [ ] Accepts optional: `reassign_to` (user_id if reassigning)
  - [ ] If user owns claimed agency, requires agency_action
  - [ ] Handles agency reassignment atomically
  - [ ] Handles agency unclaim atomically
  - [ ] Cannot delete own account (returns 403)
  - [ ] Deletes from auth.users (profiles cascade)
  - [ ] Returns 401/403 for unauthorized users
  - [ ] Audit trail entry created
- **Definition of Done:**
  - [ ] Endpoint deletes users correctly
  - [ ] Unit tests cover all scenarios
  - [ ] Tests verify agency handling
  - [ ] 85%+ test coverage
  - [ ] **Final Check:** Follows existing admin API patterns

**Estimated Effort:** 4 hours

---

### [ ] Task 2.3.2: Create UserDeleteDialog Component

- **Role:** Frontend Developer
- **Objective:** Build confirmation dialog for user deletion with agency handling
- **Context:** Must warn about consequences and handle agency ownership transfer
- **Key Files to Create:**
  - `components/admin/UserDeleteDialog.tsx`
  - `components/admin/__tests__/UserDeleteDialog.test.tsx`
- **Key Files to Reference:**
  - `components/admin/AgencyStatusDialog.tsx` (existing confirmation pattern)
  - Shadcn/ui AlertDialog component
- **Key Patterns to Follow:**
  - AlertDialog with destructive action
  - Conditional agency handling UI
  - User search for reassignment
- **Acceptance Criteria (for this task):**
  - [ ] Dialog shows user name and email
  - [ ] Explains deletion is permanent
  - [ ] If user owns agency: shows agency name
  - [ ] If user owns agency: radio buttons for "Reassign" or "Unclaim"
  - [ ] If reassign selected: user search/select dropdown
  - [ ] "Delete" button has destructive styling
  - [ ] "Cancel" button closes without action
  - [ ] Loading state during deletion
  - [ ] Keyboard accessible (Escape to close)
- **Definition of Done:**
  - [ ] Dialog component complete
  - [ ] Tests verify all states
  - [ ] Tests verify agency handling UI
  - [ ] **Final Check:** Follows existing confirmation patterns

**Estimated Effort:** 4 hours

---

### [ ] Task 2.3.3: Add Delete Button to User Detail Page

- **Role:** Frontend Developer
- **Objective:** Add "Delete" button to user detail page with confirmation
- **Context:** Admin viewing a user can delete them with proper confirmation
- **Key Files to Modify:**
  - `app/(app)/admin/users/[id]/page.tsx`
- **Key Patterns to Follow:**
  - Button with destructive variant
  - Opens UserDeleteDialog
  - Redirect to user list after deletion
- **Acceptance Criteria (for this task):**
  - [ ] "Delete" button visible on user detail page
  - [ ] Button has destructive/red styling
  - [ ] Button click opens UserDeleteDialog
  - [ ] Successful deletion redirects to /admin/users
  - [ ] Success toast displayed
  - [ ] Cannot delete own account (button disabled or hidden)
- **Definition of Done:**
  - [ ] Delete button and integration complete
  - [ ] Tests verify delete flow
  - [ ] Tests verify redirect
  - [ ] **Final Check:** Consistent with other admin delete actions

**Estimated Effort:** 2 hours

---

### [ ] ➡️ Story 2.4: Admin Searches and Filters Users

> As a **Site Administrator**, I want **enhanced user search and filtering capabilities**, so that **I can quickly find specific users across a growing user base**.

### Engineering Tasks for Story 2.4:

---

### [ ] Task 2.4.1: Enhance User Search Functionality

- **Role:** Frontend Developer
- **Objective:** Add debounced search that filters by name and email
- **Context:** Current search may need enhancement for larger user base
- **Key Files to Modify:**
  - `app/(app)/admin/users/page.tsx`
  - `components/admin/UsersTable.tsx` (if exists)
- **Key Files to Reference:**
  - `components/admin/AdminAgenciesTable.tsx` (search pattern)
  - `lib/hooks/useDebounce.ts` (existing hook)
- **Key Patterns to Follow:**
  - Debounced search (300ms)
  - URL query param persistence
  - Search across name and email
- **Acceptance Criteria (for this task):**
  - [ ] Search input in page header
  - [ ] Search filters by name OR email
  - [ ] Debounced to prevent excessive API calls
  - [ ] Search term persisted in URL
  - [ ] Clear button resets search
- **Definition of Done:**
  - [ ] Search functional
  - [ ] Tests verify debounce behavior
  - [ ] Tests verify URL persistence
  - [ ] **Final Check:** Matches agency search UX

**Estimated Effort:** 2 hours

---

### [ ] Task 2.4.2: Add Role and Status Filters

- **Role:** Frontend Developer
- **Objective:** Add filter dropdowns for role and account status
- **Context:** Admin needs to quickly filter to specific user types
- **Key Files to Modify:**
  - `app/(app)/admin/users/page.tsx`
  - `app/api/admin/users/route.ts` (if filter params not supported)
- **Key Files to Reference:**
  - `components/admin/AdminAgenciesTable.tsx` (filter pattern)
- **Key Patterns to Follow:**
  - Shadcn/ui Select component
  - URL query param state
  - Combine with search
- **Acceptance Criteria (for this task):**
  - [ ] Role filter: All, User, Agency Owner, Admin
  - [ ] Status filter: All, Active, Suspended (if applicable)
  - [ ] Filters update URL query params
  - [ ] Filters combine with search
  - [ ] Clear filters button resets all
  - [ ] API supports filter query params
- **Definition of Done:**
  - [ ] Filters functional
  - [ ] Tests verify filter interactions
  - [ ] Tests verify URL param updates
  - [ ] **Final Check:** Matches agency filters UX

**Estimated Effort:** 3 hours

---

## 📊 Summary

### Total Tasks: 19

| Phase                        | Tasks        | Estimated Hours |
| ---------------------------- | ------------ | --------------- |
| Phase 1: Agency Full Editing | 11 tasks     | 33 hours        |
| Phase 2: User Management     | 8 tasks      | 27 hours        |
| **Total**                    | **19 tasks** | **60 hours**    |

### Dependencies Graph

```text
Phase 1 (Week 1) - Agency Full Editing
├── Story 1.1: Trade Editing
│   ├── 1.1.1 Add TradeSelector to Modal
│   ├── 1.1.2 Extend PATCH for Trades ──────┐
│   └── 1.1.3 Fetch/Display Trades ─────────┘
├── Story 1.2: Region Editing
│   ├── 1.2.1 Add RegionSelector to Modal
│   ├── 1.2.2 Extend PATCH for Regions ─────┐
│   └── 1.2.3 Fetch/Display Regions ────────┘
└── Story 1.3: Logo Editing
    ├── 1.3.1 Create Storage Bucket
    ├── 1.3.2 Create LogoUpload Component
    ├── 1.3.3 Create Logo API ──────────────┐
    ├── 1.3.4 Integrate into Modal ─────────┤
    └── 1.3.5 Display on Cards/Profile ─────┘

Phase 2 (Week 2) - User Management
├── Story 2.1: Create User
│   ├── 2.1.1 Create User API
│   ├── 2.1.2 Create UserFormModal ─────────┐
│   └── 2.1.3 Add Create Button ────────────┘
├── Story 2.2: Edit User
│   ├── 2.2.1 User Update API
│   ├── 2.2.2 Edit Mode in Modal ───────────┐
│   └── 2.2.3 Add Edit Button ──────────────┘
├── Story 2.3: Delete User
│   ├── 2.3.1 User Delete API
│   ├── 2.3.2 UserDeleteDialog ─────────────┐
│   └── 2.3.3 Add Delete Button ────────────┘
└── Story 2.4: Search & Filter
    ├── 2.4.1 Enhance Search
    └── 2.4.2 Add Filters
```

### Key Files to Create

**API Routes:**

- `app/api/admin/agencies/[id]/logo/route.ts` (POST, DELETE)
- `app/api/admin/users/route.ts` (POST)
- `app/api/admin/users/[id]/route.ts` (PATCH, DELETE)

**Components:**

- `components/admin/LogoUpload.tsx`
- `components/admin/UserFormModal.tsx`
- `components/admin/UserDeleteDialog.tsx`
- `components/admin/AdminUsersActions.tsx`

**Migrations:**

- `supabase/migrations/[timestamp]_create_agency_logos_bucket.sql`

### Key Files to Modify

**API Routes:**

- `app/api/admin/agencies/[id]/route.ts` (add trade_ids, region_ids support)

**Components:**

- `components/admin/AgencyFormModal.tsx` (add TradeSelector, RegionSelector, LogoUpload)

**Pages:**

- `app/(app)/admin/users/page.tsx` (add create button, enhanced search/filters)
- `app/(app)/admin/users/[id]/page.tsx` (add edit/delete buttons)
- `app/(app)/admin/agencies/[id]/page.tsx` (pass trades/regions to edit modal)
