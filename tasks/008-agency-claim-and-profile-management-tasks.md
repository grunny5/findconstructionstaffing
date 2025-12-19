# Task Backlog: Agency Claim and Profile Management

**Source FSD:** `docs/features/active/008-agency-claim-and-profile-management.md`
**Project Foundation:** `CLAUDE.md` (TypeScript strict mode, 85%+ test coverage, Shadcn/ui patterns)
**Reference Documentation:** `PROJECT_KICKSTART_V2.md` (Epic: Agency Profile Management)

This document breaks down Feature #008 into sprint-ready engineering tasks. All tasks must adhere to project standards: TypeScript strict mode, 85%+ test coverage, no unnecessary comments, and use existing UI components from Shadcn/ui.

---

## 📦 Phase 1: Agency Claim Request (Sprint 1)

**Goal:** Enable agencies to discover and claim their profiles with email verification
**Estimated Duration:** 1 week (5 days)
**Dependencies:** Auth system (Feature 007 - Complete ✅)

---

### ➡️ Story 1.1: Discover Claimable Agency Profile

> As a **Staffing Agency Owner**, I want **to find my company's profile in the directory**, so that **I can claim ownership and manage it**.

### Engineering Tasks for this Story:

---

### Task 1.1.1: Add "Claim This Agency" Button to Agency Profile Page ✅ COMPLETE

- **Role:** Frontend Developer
- **Objective:** Add a prominent "Claim This Agency" button to agency profile pages for unclaimed agencies
- **Context:** Agency profile pages (`app/recruiters/[slug]/page.tsx`) currently show static information. Need to add claim button for agencies without `claimed_by` field set.
- **Key Files to Modify:**
  - `app/recruiters/[slug]/page.tsx` (lines 25-120)
  - `components/AgencyCard.tsx` (if button needed in search results)
- **Key Patterns to Follow:**
  - Use Shadcn/ui Button component
  - Check authentication status with `createClient()` from `lib/supabase/client.ts`
  - TypeScript strict mode compliance
  - Conditional rendering based on claim status
- **Acceptance Criteria (for this task):**
  - [x] Button displays only if `agency.claimed_by` is NULL (using `!agency.is_claimed`)
  - [x] Button is prominently placed in header section below agency name
  - [x] Button shows "Claim This Agency" text with badge/shield icon
  - [x] Button is hidden if agency is already claimed
  - [x] Clicking button navigates to `/claim/[agency-slug]` (auth check handled by claim page per Next.js patterns)
  - [x] Button follows Shadcn/ui Button component patterns with asChild and Link
- **Definition of Done:**
  - [x] Code complete and committed
  - [x] Component tests verify button visibility logic (4 tests created)
  - [x] Tests cover claimed/unclaimed states
  - [x] All existing tests still pass (35/35 tests passing)
  - [x] **Final Check:** Follows Shadcn/ui patterns

**Actual Effort:** 1.5 hours
**Implementation Notes:**

- Added claim button to `app/recruiters/[slug]/page.tsx` (lines 133-145)
- Created comprehensive test suite: `app/recruiters/[slug]/__tests__/claim-button.test.tsx`
- Button uses Shield icon and links to `/claim/${params.slug}`
- Auth redirect logic delegated to claim page (Task 1.1.2) per Next.js App Router best practices

---

### Task 1.1.2: Create Claim Request Page Route and Layout

- **Role:** Frontend Developer
- **Objective:** Create the claim request page structure and layout
- **Context:** Need new route at `/claim/[agency-slug]` to host the claim request form
- **Key Files to Create:**
  - `app/claim/[slug]/page.tsx`
  - `app/claim/[slug]/loading.tsx` (skeleton)
- **Key Patterns to Follow:**
  - Next.js App Router conventions
  - Server-side data fetching for agency details
  - TypeScript strict mode
  - Responsive design (mobile-first)
- **Acceptance Criteria (for this task):**
  - [ ] Route `/claim/[agency-slug]` is accessible
  - [ ] Page fetches agency data by slug from Supabase
  - [ ] Page shows 404 if agency doesn't exist
  - [ ] Page shows "Already Claimed" message if agency has `claimed_by` set
  - [ ] Loading skeleton displays while fetching
  - [ ] Page requires authentication (redirect to login if not logged in)
  - [ ] Layout shows agency name and logo at top as reference
- **Definition of Done:**
  - [ ] Route functional with proper data fetching
  - [ ] Tests verify 404 and already-claimed cases
  - [ ] Loading states tested
  - [ ] Auth check working
  - [ ] PR submitted
  - [ ] **Final Check:** Follows Next.js App Router patterns

**Estimated Effort:** 2 hours

---

### ➡️ Story 1.2: Submit Claim Request

> As a **Staffing Agency Owner**, I want **to submit a claim request for my company**, so that **I can prove ownership and gain management access**.

### Engineering Tasks for this Story:

---

### Task 1.2.1: Design Database Schema for Claim Requests

- **Role:** Backend Developer / Database Administrator
- **Objective:** Create database tables and relationships for agency claim requests
- **Context:** Need new tables to store claim requests, audit logs, and profile edits per FSD Technical Requirements
- **Key Files to Create:**
  - `supabase/migrations/[timestamp]_create_agency_claim_tables.sql`
- **Key Patterns to Follow:**
  - Supabase migration conventions
  - Foreign key relationships with CASCADE
  - Proper indexes for performance
  - Check constraints for data validation
- **Acceptance Criteria (for this task):**
  - [ ] `agency_claim_requests` table created with all fields from FSD
  - [ ] `agency_claim_audit_log` table created
  - [ ] `agency_profile_edits` table created
  - [ ] `agencies` table altered to add: `claimed_by`, `claimed_at`, `profile_completion_percentage`, `last_edited_at`, `last_edited_by`
  - [ ] Indexes created: `idx_agencies_claimed_by`, `idx_claim_requests_status`, `idx_claim_requests_agency_user`
  - [ ] Check constraints enforce valid enum values (status, verification_method)
  - [ ] UNIQUE constraint on `agency_id + user_id` in claim_requests
  - [ ] Migration runs successfully with no errors
- **Definition of Done:**
  - [ ] Migration file created and tested locally
  - [ ] Migration applied to local database
  - [ ] All tables and indexes verified with `\d` commands
  - [ ] Rollback script tested (migration down)
  - [ ] Documentation added to migration comments
  - [ ] PR submitted with migration file
  - [ ] **Final Check:** Schema matches FSD Technical Requirements exactly

**Estimated Effort:** 3 hours

---

### Task 1.2.2: Create Row Level Security (RLS) Policies for Claim Tables

- **Role:** Backend Developer / Security Engineer
- **Objective:** Implement RLS policies to secure claim request data
- **Context:** Claim requests contain sensitive business information and must be protected per user and admin roles
- **Key Files to Create:**
  - `supabase/migrations/[timestamp]_create_claim_rls_policies.sql`
- **Key Patterns to Follow:**
  - Supabase RLS best practices
  - Policy naming conventions: `[table]_[action]_policy`
  - Use `auth.uid()` for user identification
  - Check `profiles.role` for admin access
- **Acceptance Criteria (for this task):**
  - [ ] Policy: Users can SELECT their own claim requests
  - [ ] Policy: Users can INSERT their own claim requests
  - [ ] Policy: Admins can SELECT all claim requests
  - [ ] Policy: Admins can UPDATE all claim requests (approve/reject)
  - [ ] Policy: Agency owners can UPDATE their claimed agency
  - [ ] Policy: Anyone can SELECT agencies (public directory)
  - [ ] Policy: Only admins can INSERT/UPDATE agency_claim_audit_log
  - [ ] All policies tested with different user roles
  - [ ] Enable RLS on all three new tables
- **Definition of Done:**
  - [ ] Migration file created with all policies
  - [ ] Policies tested with test users (user, admin, agency_owner)
  - [ ] Verified users cannot access other users' claims
  - [ ] Verified admins can access all claims
  - [ ] Tests written to validate RLS policies
  - [ ] PR submitted with migration
  - [ ] **Final Check:** Security standards met per PKD

**Estimated Effort:** 4 hours

---

### Task 1.2.3: Create API Endpoint for Submitting Claim Request

- **Role:** Backend Developer
- **Objective:** Create API endpoint to handle claim request submissions with validation
- **Context:** Frontend form will POST to this endpoint with claim data; must validate email domain and create database record
- **Key Files to Create:**
  - `app/api/claims/request/route.ts`
  - `lib/utils/email-domain-verification.ts` (helper function)
- **Key Patterns to Follow:**
  - Next.js API route conventions
  - Supabase server client for database operations
  - Zod for request validation
  - TypeScript strict mode
- **Acceptance Criteria (for this task):**
  - [ ] POST endpoint created at `/api/claims/request`
  - [ ] Request body validated with Zod schema (business_email, phone, position, verification_method, notes)
  - [ ] Endpoint checks if agency is already claimed (return 409 Conflict)
  - [ ] Endpoint checks if user already has pending claim (return 409 Conflict)
  - [ ] Email domain extracted and compared with agency website domain
  - [ ] `email_domain_verified` set to TRUE if domains match (case-insensitive)
  - [ ] Claim request inserted into `agency_claim_requests` table
  - [ ] Audit log entry created (action: 'submitted')
  - [ ] Returns 201 Created with claim ID
  - [ ] Error handling for database errors, validation errors
- **Definition of Done:**
  - [ ] Endpoint implementation complete
  - [ ] Unit tests cover all validation cases
  - [ ] Unit tests cover domain matching logic
  - [ ] Integration test: full claim submission flow
  - [ ] API documented with JSDoc comments
  - [ ] Error responses follow standard format
  - [ ] PR submitted with tests
  - [ ] **Final Check:** Meets API standards from PKD

**Estimated Effort:** 5 hours

---

### Task 1.2.4: Build Claim Request Form Component

- **Role:** Frontend Developer
- **Objective:** Create the claim request form UI with validation and submission
- **Context:** Form is displayed on `/claim/[slug]` page and must collect all required information per FSD Story 1.2
- **Key Files to Create:**
  - `components/ClaimRequestForm.tsx`
  - `lib/validations/claim-request.ts` (Zod schema)
- **Key Patterns to Follow:**
  - React Hook Form for form state management
  - Zod for client-side validation (matches API validation)
  - Shadcn/ui Form components
  - TypeScript strict mode
- **Acceptance Criteria (for this task):**
  - [ ] Form displays agency name (read-only)
  - [ ] Required fields: Business Email, Phone Number, Position/Title, Verification Method
  - [ ] Optional field: Additional Notes (textarea)
  - [ ] Email validation: must be valid email format
  - [ ] Phone validation: must match E.164 format (show format hint)
  - [ ] Verification Method: radio buttons (Email Domain, Phone Verification, Manual Review)
  - [ ] Email domain warning shows if domain doesn't match agency website
  - [ ] Submit button disabled while submitting (loading state)
  - [ ] Success message displays after submission with claim ID
  - [ ] Error messages display for validation and API errors
  - [ ] Form resets after successful submission
- **Definition of Done:**
  - [ ] Component complete with all fields
  - [ ] Client-side validation working
  - [ ] Form submission calls API endpoint
  - [ ] Success and error states handled
  - [ ] Component tests verify all validation rules
  - [ ] Component tests verify submission flow
  - [ ] Accessibility: proper labels, ARIA attributes, error announcements
  - [ ] PR submitted with component tests
  - [ ] **Final Check:** Uses Shadcn/ui patterns

**Estimated Effort:** 6 hours

---

### Task 1.2.5: Implement Email Notification for Claim Submission

- **Role:** Backend Developer
- **Objective:** Send confirmation email to user after claim submission
- **Context:** User should receive immediate confirmation with tracking ID per FSD Story 1.2
- **Key Files to Create:**
  - `lib/emails/claim-confirmation.ts` (email template)
  - `app/api/claims/request/route.ts` (modify to send email)
- **Key Patterns to Follow:**
  - Resend email service (already integrated in Feature 007)
  - Email templates follow brand guidelines
  - Include claim ID for tracking
  - Non-blocking (don't fail request if email fails)
- **Acceptance Criteria (for this task):**
  - [ ] Email template created with: Greeting, Agency Name, Claim ID, Status ("Pending Review"), Expected Review Time (2 business days), Support contact
  - [ ] Email sent after successful claim creation
  - [ ] Email includes link to check status (future: `/settings/claims`)
  - [ ] Email send errors logged but don't block request
  - [ ] Plain text version of email provided
  - [ ] Email variables populated correctly
- **Definition of Done:**
  - [ ] Email template created and tested
  - [ ] Email sending integrated into API endpoint
  - [ ] Test email sent to verify formatting
  - [ ] Error handling for email failures
  - [ ] Email logged in database for audit
  - [ ] PR submitted with email preview
  - [ ] **Final Check:** Email branding matches site

**Estimated Effort:** 3 hours

---

### ➡️ Story 1.3: Track Claim Request Status

> As a **Staffing Agency Owner**, I want **to check the status of my claim request**, so that **I know when it will be approved**.

### Engineering Tasks for this Story:

---

### Task 1.3.1: Create API Endpoint to Fetch User's Claim Requests

- **Role:** Backend Developer
- **Objective:** Create endpoint to retrieve claim requests for authenticated user
- **Context:** User needs to view their pending/approved/rejected claims
- **Key Files to Create:**
  - `app/api/claims/my-requests/route.ts`
- **Key Patterns to Follow:**
  - Next.js API route conventions
  - RLS policies ensure users only see their own claims
  - TypeScript strict mode
- **Acceptance Criteria (for this task):**
  - [ ] GET endpoint created at `/api/claims/my-requests`
  - [ ] Endpoint requires authentication (check session)
  - [ ] Returns array of claim requests for `auth.uid()`
  - [ ] Includes related agency data (name, logo, slug)
  - [ ] Sorted by created_at DESC (newest first)
  - [ ] Returns 401 if not authenticated
  - [ ] Returns empty array if no claims
- **Definition of Done:**
  - [ ] Endpoint implementation complete
  - [ ] Unit tests verify authentication check
  - [ ] Unit tests verify query correctness
  - [ ] Integration test with test user
  - [ ] API response documented
  - [ ] PR submitted
  - [ ] **Final Check:** RLS policies applied

**Estimated Effort:** 2 hours

---

### Task 1.3.2: Add Claim Status Section to Settings Page

- **Role:** Frontend Developer
- **Objective:** Display user's claim requests in account settings
- **Context:** User navigates to settings and sees their claim status per FSD Story 1.3
- **Key Files to Modify:**
  - `app/settings/page.tsx` (add new section)
- **Key Files to Create:**
  - `components/ClaimStatusList.tsx`
- **Key Patterns to Follow:**
  - Shadcn/ui Card and Badge components
  - TypeScript strict mode
  - Loading skeletons
- **Acceptance Criteria (for this task):**
  - [ ] New "Claim Requests" section added to settings page
  - [ ] Section fetches data from `/api/claims/my-requests`
  - [ ] Each claim displays: Agency Name (with logo), Status Badge, Submitted Date, Claim ID
  - [ ] Status badge colors: Pending (yellow), Under Review (blue), Approved (green), Rejected (red)
  - [ ] Rejected claims show rejection reason
  - [ ] Rejected claims show "Resubmit" button (link to claim form)
  - [ ] Approved claims show "Manage Agency" button (link to dashboard)
  - [ ] Loading skeleton displays while fetching
  - [ ] Empty state: "No claim requests yet"
- **Definition of Done:**
  - [ ] Component complete with all states
  - [ ] Component tests verify rendering for all statuses
  - [ ] Component tests verify empty state
  - [ ] Loading states tested
  - [ ] Accessibility compliant
  - [ ] PR submitted with screenshots
  - [ ] **Final Check:** Matches Shadcn/ui patterns

**Estimated Effort:** 4 hours

---

### Task 1.3.3: Implement Claim Status Notification Banner

- **Role:** Frontend Developer
- **Objective:** Show notification banner for pending claims on dashboard/home
- **Context:** User should see reminder about pending claim per FSD Story 1.3
- **Key Files to Create:**
  - `components/ClaimStatusBanner.tsx`
- **Key Files to Modify:**
  - `app/page.tsx` (add banner if pending claim exists)
- **Key Patterns to Follow:**
  - Shadcn/ui Alert component
  - Conditional rendering based on claim status
  - TypeScript strict mode
- **Acceptance Criteria (for this task):**
  - [ ] Banner displays if user has status='pending' claim
  - [ ] Banner shows: "Claim request pending review for [Agency Name]"
  - [ ] Banner includes link "View Status" to settings
  - [ ] Banner is dismissible (stores in localStorage)
  - [ ] Banner re-appears on next login if still pending
  - [ ] Banner shows success message if claim approved
  - [ ] Success banner: "Your claim for [Agency Name] was approved! Manage your profile"
  - [ ] Banner doesn't show if no claims
- **Definition of Done:**
  - [ ] Component created and functional
  - [ ] Component tests verify all states
  - [ ] localStorage persistence tested
  - [ ] Banner displays correctly on homepage
  - [ ] Accessibility: proper ARIA role and labels
  - [ ] PR submitted
  - [ ] **Final Check:** Non-intrusive UX

**Estimated Effort:** 3 hours

---

## 📦 Phase 2: Claim Verification & Approval (Sprint 2)

**Goal:** Enable admins to review and approve/reject claim requests
**Estimated Duration:** 1 week (5 days)
**Dependencies:** Phase 1 complete

---

### ➡️ Story 2.1: Admin Review of Claim Requests

> As a **Site Administrator**, I want **to review agency claim requests**, so that **I can verify legitimate ownership before granting access**.

### Engineering Tasks for this Story:

---

### Task 2.1.1: Create Admin Claims Dashboard Page

- **Role:** Frontend Developer
- **Objective:** Create admin page to list all claim requests with filters
- **Context:** Admins need dedicated page at `/admin/claims` to manage all requests
- **Key Files to Create:**
  - `app/(app)/admin/claims/page.tsx`
  - `components/admin/ClaimsTable.tsx`
- **Key Patterns to Follow:**
  - Follow existing `/admin/users` structure
  - Shadcn/ui Table component
  - TypeScript strict mode
  - Server-side pagination
- **Acceptance Criteria (for this task):**
  - [ ] Page accessible at `/admin/claims` (admin role only)
  - [ ] Table displays columns: Agency Name, Requester Name, Email, Phone, Status, Submitted Date, Actions
  - [ ] Filter dropdown: All, Pending, Under Review, Approved, Rejected
  - [ ] Search box filters by agency name or requester email
  - [ ] Table sortable by Submitted Date (default: newest first)
  - [ ] Pagination: 25 claims per page
  - [ ] "Review" button for each claim (opens detail modal)
  - [ ] 403 Forbidden if user is not admin
  - [ ] Loading skeleton while fetching data
  - [ ] Empty state: "No claim requests found"
- **Definition of Done:**
  - [ ] Page complete with table and filters
  - [ ] Admin-only access enforced
  - [ ] Tests verify admin access control
  - [ ] Tests verify filtering and search
  - [ ] PR submitted with screenshots
  - [ ] **Final Check:** Follows `/admin/users` patterns

**Estimated Effort:** 5 hours

---

### Task 2.1.2: Create API Endpoint for Admin to List All Claims

- **Role:** Backend Developer
- **Objective:** Create endpoint for admins to fetch all claim requests with filters
- **Context:** Admin dashboard needs data from this endpoint
- **Key Files to Create:**
  - `app/api/admin/claims/route.ts`
- **Key Patterns to Follow:**
  - Admin-only endpoint (check role)
  - Query parameters for filtering
  - Pagination support
  - TypeScript strict mode
- **Acceptance Criteria (for this task):**
  - [ ] GET endpoint at `/api/admin/claims`
  - [ ] Requires admin role (check via RLS + middleware)
  - [ ] Query params: `status`, `search`, `page`, `limit`
  - [ ] Returns paginated results with total count
  - [ ] Includes related data: agency (name, logo), user (name, email)
  - [ ] Filters work: status filter, search by name/email
  - [ ] Sorted by created_at DESC
  - [ ] Returns 403 if not admin
  - [ ] Returns empty array if no results
- **Definition of Done:**
  - [ ] Endpoint complete with all features
  - [ ] Unit tests verify admin-only access
  - [ ] Unit tests verify filtering logic
  - [ ] Integration tests with test data
  - [ ] API response documented
  - [ ] PR submitted
  - [ ] **Final Check:** RLS policies enforced

**Estimated Effort:** 4 hours

---

### Task 2.1.3: Create Claim Detail Modal Component

- **Role:** Frontend Developer
- **Objective:** Create modal to show full claim details for admin review
- **Context:** Admin clicks "Review" button and sees detailed view per FSD Story 2.1
- **Key Files to Create:**
  - `components/admin/ClaimDetailModal.tsx`
  - `components/admin/ClaimVerificationChecklist.tsx`
- **Key Patterns to Follow:**
  - Shadcn/ui Dialog component
  - Display all claim information
  - TypeScript strict mode
- **Acceptance Criteria (for this task):**
  - [ ] Modal displays when "Review" clicked
  - [ ] Shows all claim data: Agency Name, Logo, Website, Requester Name, Email, Phone, Position, Verification Method, Additional Notes
  - [ ] Shows email domain match status (green check if verified, red X if not)
  - [ ] Shows submitted date and claim ID
  - [ ] Verification checklist section:
    - [ ] Email Domain Match: ✓ or ✗
    - [ ] Phone Provided: ✓ or ✗
    - [ ] Position/Title Provided: ✓ or ✗
  - [ ] External links section: Agency Website (opens in new tab), Google Search "[Agency Name]"
  - [ ] Action buttons: "Approve", "Reject", "Close"
  - [ ] Modal is keyboard accessible (ESC to close)
- **Definition of Done:**
  - [ ] Component complete with all sections
  - [ ] Component tests verify rendering
  - [ ] Tests verify verification checklist logic
  - [ ] Accessibility tested
  - [ ] PR submitted with screenshots
  - [ ] **Final Check:** Professional admin UI

**Estimated Effort:** 5 hours

---

### ➡️ Story 2.2: Approve or Reject Claim

> As a **Site Administrator**, I want **to approve or reject claim requests**, so that **only verified agency owners can manage profiles**.

### Engineering Tasks for this Story:

---

### Task 2.2.1: Create API Endpoint for Approving Claim

- **Role:** Backend Developer
- **Objective:** Create endpoint to approve claim and grant agency ownership
- **Context:** Admin approves claim, user becomes agency_owner, agency gets linked to user
- **Key Files to Create:**
  - `app/api/admin/claims/[claimId]/approve/route.ts`
- **Key Patterns to Follow:**
  - Admin-only endpoint
  - Database transactions (update multiple tables atomically)
  - TypeScript strict mode
- **Acceptance Criteria (for this task):**
  - [ ] POST endpoint at `/api/admin/claims/[claimId]/approve`
  - [ ] Requires admin role (403 if not)
  - [ ] Updates `agency_claim_requests.status` to 'approved'
  - [ ] Sets `reviewed_by` to admin's user ID
  - [ ] Sets `reviewed_at` to current timestamp
  - [ ] Updates `agencies.claimed_by` to requester's user ID
  - [ ] Sets `agencies.claimed_at` to current timestamp
  - [ ] Updates `profiles.role` to 'agency_owner' for requester
  - [ ] Creates audit log entry (action: 'approved', admin_id)
  - [ ] All updates in single database transaction (rollback on error)
  - [ ] Returns 200 with updated claim data
  - [ ] Returns 404 if claim doesn't exist
  - [ ] Returns 409 if claim already processed
- **Definition of Done:**
  - [ ] Endpoint implementation complete
  - [ ] Unit tests verify all database updates
  - [ ] Unit tests verify transaction rollback on error
  - [ ] Integration test: full approval flow
  - [ ] Error handling comprehensive
  - [ ] PR submitted
  - [ ] **Final Check:** Data consistency guaranteed

**Estimated Effort:** 5 hours

---

### Task 2.2.2: Create API Endpoint for Rejecting Claim

- **Role:** Backend Developer
- **Objective:** Create endpoint to reject claim with reason
- **Context:** Admin rejects claim, user is notified with reason
- **Key Files to Create:**
  - `app/api/admin/claims/[claimId]/reject/route.ts`
- **Key Patterns to Follow:**
  - Admin-only endpoint
  - Require rejection reason
  - TypeScript strict mode
- **Acceptance Criteria (for this task):**
  - [ ] POST endpoint at `/api/admin/claims/[claimId]/reject`
  - [ ] Requires admin role (403 if not)
  - [ ] Request body: `rejection_reason` (required, min 20 characters)
  - [ ] Updates `agency_claim_requests.status` to 'rejected'
  - [ ] Sets `rejection_reason` field
  - [ ] Sets `reviewed_by` to admin's user ID
  - [ ] Sets `reviewed_at` to current timestamp
  - [ ] Creates audit log entry (action: 'rejected', admin_id, notes: reason)
  - [ ] Returns 200 with updated claim data
  - [ ] Returns 400 if reason missing or too short
  - [ ] Returns 404 if claim doesn't exist
  - [ ] Returns 409 if claim already processed
- **Definition of Done:**
  - [ ] Endpoint implementation complete
  - [ ] Unit tests verify validation (reason required)
  - [ ] Unit tests verify database updates
  - [ ] Integration test: full rejection flow
  - [ ] PR submitted
  - [ ] **Final Check:** Rejection reason required

**Estimated Effort:** 3 hours

---

### Task 2.2.3: Implement Approve/Reject Actions in Modal

- **Role:** Frontend Developer
- **Objective:** Connect approve/reject buttons in modal to API endpoints
- **Context:** Admin clicks approve or reject, confirmation shown, action executed
- **Key Files to Modify:**
  - `components/admin/ClaimDetailModal.tsx`
- **Key Files to Create:**
  - `components/admin/ClaimApprovalConfirmation.tsx`
  - `components/admin/ClaimRejectionDialog.tsx`
- **Key Patterns to Follow:**
  - Shadcn/ui Dialog for confirmations
  - Optimistic UI updates
  - Error handling
  - TypeScript strict mode
- **Acceptance Criteria (for this task):**
  - [ ] "Approve" button opens confirmation dialog: "Approve claim for [Agency Name]?"
  - [ ] Approval dialog shows what will happen: "User will become agency_owner and can manage this profile"
  - [ ] Confirmation calls `/api/admin/claims/[id]/approve`
  - [ ] Success: modal closes, table refreshes, success toast shown
  - [ ] "Reject" button opens rejection dialog with reason textarea
  - [ ] Rejection dialog requires minimum 20 character reason
  - [ ] Rejection dialog shows character count
  - [ ] Rejection calls `/api/admin/claims/[id]/reject`
  - [ ] Success: modal closes, table refreshes, success toast shown
  - [ ] Loading states during API calls (buttons disabled)
  - [ ] Error handling: show error message if API fails
- **Definition of Done:**
  - [ ] Approve and reject flows complete
  - [ ] Confirmation dialogs functional
  - [ ] Component tests verify both flows
  - [ ] Tests verify validation (rejection reason)
  - [ ] Tests verify error states
  - [ ] PR submitted
  - [ ] **Final Check:** Clear admin UX

**Estimated Effort:** 5 hours

---

### Task 2.2.4: Send Approval Email Notification

- **Role:** Backend Developer
- **Objective:** Send email to user when claim is approved
- **Context:** User receives approval email with link to dashboard per FSD Story 2.2
- **Key Files to Create:**
  - `lib/emails/claim-approved.ts`
- **Key Files to Modify:**
  - `app/api/admin/claims/[claimId]/approve/route.ts` (add email send)
- **Key Patterns to Follow:**
  - Resend email service
  - Non-blocking email send
  - Email template follows brand
- **Acceptance Criteria (for this task):**
  - [ ] Email template created: Congratulations message, Agency Name, Link to dashboard (`/dashboard/agency/[slug]`), Next steps guidance
  - [ ] Email sent after successful approval
  - [ ] Email includes "Get Started" CTA button
  - [ ] Email send errors logged but don't fail approval
  - [ ] Plain text version provided
  - [ ] Email variables populated correctly
- **Definition of Done:**
  - [ ] Email template created and tested
  - [ ] Email integrated into approval endpoint
  - [ ] Test email sent to verify
  - [ ] Error handling for email failures
  - [ ] PR submitted with email preview
  - [ ] **Final Check:** Professional branding

**Estimated Effort:** 2 hours

---

### Task 2.2.5: Send Rejection Email Notification

- **Role:** Backend Developer
- **Objective:** Send email to user when claim is rejected with reason
- **Context:** User receives rejection email with reason and resubmit option per FSD Story 2.2
- **Key Files to Create:**
  - `lib/emails/claim-rejected.ts`
- **Key Files to Modify:**
  - `app/api/admin/claims/[claimId]/reject/route.ts` (add email send)
- **Key Patterns to Follow:**
  - Resend email service
  - Include rejection reason
  - Provide resubmit instructions
- **Acceptance Criteria (for this task):**
  - [ ] Email template created: Polite rejection message, Agency Name, Rejection Reason (from admin), Resubmit instructions, Link to resubmit form
  - [ ] Email sent after rejection
  - [ ] Email includes support contact
  - [ ] Email send errors logged but don't fail rejection
  - [ ] Plain text version provided
  - [ ] Tone is professional and helpful
- **Definition of Done:**
  - [ ] Email template created and tested
  - [ ] Email integrated into rejection endpoint
  - [ ] Test email sent to verify
  - [ ] Error handling for email failures
  - [ ] PR submitted with email preview
  - [ ] **Final Check:** Respectful, helpful tone

**Estimated Effort:** 2 hours

---

### ➡️ Story 2.3: Automated Email Domain Verification

> As a **Site Administrator**, I want **email domain verification to be automated**, so that **valid claims are approved faster without manual intervention**.

### Engineering Tasks for this Story:

---

### Task 2.3.1: Implement Email Domain Verification Helper Function

- **Role:** Backend Developer
- **Objective:** Create utility function to verify email domain matches agency website
- **Context:** Extract domain from email and website URL, compare case-insensitively
- **Key Files to Create:**
  - `lib/utils/email-domain-verification.ts`
- **Key Patterns to Follow:**
  - Pure function (no side effects)
  - Comprehensive unit tests
  - TypeScript strict mode
- **Acceptance Criteria (for this task):**
  - [ ] Function signature: `verifyEmailDomain(email: string, websiteUrl: string): boolean`
  - [ ] Extracts domain from email (e.g., "john@example.com" → "example.com")
  - [ ] Extracts domain from URL (e.g., "https://example.com/about" → "example.com")
  - [ ] Handles subdomains: "john@mail.example.com" matches "example.com"
  - [ ] Case-insensitive comparison
  - [ ] Handles missing website URL (returns false)
  - [ ] Handles invalid email format (returns false)
  - [ ] Returns true if domains match, false otherwise
- **Definition of Done:**
  - [ ] Function implementation complete
  - [ ] Unit tests cover all edge cases
  - [ ] Unit tests include: exact match, subdomain match, case insensitive, invalid inputs
  - [ ] JSDoc documentation added
  - [ ] PR submitted with tests
  - [ ] **Final Check:** 100% test coverage

**Estimated Effort:** 2 hours

---

### Task 2.3.2: Add Domain Verification Badge to Claims Table

- **Role:** Frontend Developer
- **Objective:** Show visual indicator for domain-verified claims in admin table
- **Context:** Admins should see at a glance which claims are pre-verified
- **Key Files to Modify:**
  - `components/admin/ClaimsTable.tsx`
- **Key Patterns to Follow:**
  - Shadcn/ui Badge component
  - Conditional rendering
  - TypeScript strict mode
- **Acceptance Criteria (for this task):**
  - [ ] New column "Verification" added to table
  - [ ] Shows green checkmark badge "Domain Verified" if `email_domain_verified = true`
  - [ ] Shows gray badge "Manual Review" if `email_domain_verified = false`
  - [ ] Tooltip on hover explains what verification means
  - [ ] Badge colors match status colors (green = verified)
  - [ ] Mobile responsive (badge stacks on small screens)
- **Definition of Done:**
  - [ ] Badge displays correctly in table
  - [ ] Component tests verify badge logic
  - [ ] Accessibility: badge has proper ARIA label
  - [ ] PR submitted with screenshots
  - [ ] **Final Check:** Visually clear indicator

**Estimated Effort:** 2 hours

---

### Task 2.3.3: Add Domain Verification Info to Detail Modal

- **Role:** Frontend Developer
- **Objective:** Show detailed domain verification info in claim review modal
- **Context:** Admin sees whether email domain matches, with explanation
- **Key Files to Modify:**
  - `components/admin/ClaimDetailModal.tsx`
  - `components/admin/ClaimVerificationChecklist.tsx`
- **Key Patterns to Follow:**
  - Clear visual indicators (✓ or ✗)
  - Explanatory text
  - TypeScript strict mode
- **Acceptance Criteria (for this task):**
  - [ ] Verification checklist shows "Email Domain Match" as first item
  - [ ] If verified: Shows "✓ Email Domain Verified" in green with checkmark icon
  - [ ] If verified: Explains "Email domain (example.com) matches agency website"
  - [ ] If not verified: Shows "✗ Manual Review Required" in yellow/orange
  - [ ] If not verified: Explains "Email domain doesn't match website. Verify ownership through other means."
  - [ ] Shows both email and website URL for admin reference
  - [ ] Verification logic uses same helper function as backend
- **Definition of Done:**
  - [ ] Checklist updated with domain verification
  - [ ] Component tests verify display logic
  - [ ] Clear visual difference between verified/not verified
  - [ ] PR submitted
  - [ ] **Final Check:** Helps admin make decision

**Estimated Effort:** 2 hours

---

## 📦 Phase 3: Profile Editing Dashboard (Sprint 3)

**Goal:** Enable agency owners to edit their profiles
**Estimated Duration:** 1 week (5 days)
**Dependencies:** Phase 2 complete (claims approved)

---

### ➡️ Story 3.1: Access Agency Dashboard

> As a **Staffing Agency Owner**, I want **to access my agency management dashboard**, so that **I can update my company profile**.

### Engineering Tasks for this Story:

---

### Task 3.1.1: Create Agency Dashboard Route and Layout

- **Role:** Frontend Developer
- **Objective:** Create the main agency dashboard page structure
- **Context:** Approved agency owners need dashboard at `/dashboard/agency/[agency-slug]`
- **Key Files to Create:**
  - `app/(app)/dashboard/agency/[slug]/page.tsx`
  - `app/(app)/dashboard/agency/[slug]/layout.tsx`
  - `components/dashboard/DashboardSidebar.tsx`
- **Key Patterns to Follow:**
  - Next.js App Router conventions
  - Protected route (requires agency_owner role)
  - Sidebar navigation pattern
  - TypeScript strict mode
- **Acceptance Criteria (for this task):**
  - [ ] Route accessible at `/dashboard/agency/[slug]`
  - [ ] Page requires authentication (redirect to login if not)
  - [ ] Page requires agency_owner role (403 if user role)
  - [ ] Page requires user owns this agency (check `claimed_by = auth.uid()`)
  - [ ] Layout includes sidebar with sections: Overview, Profile, Services, Analytics (future)
  - [ ] Sidebar active state shows current section
  - [ ] Mobile: sidebar is collapsible hamburger menu
  - [ ] Desktop: sidebar is always visible
  - [ ] Header shows agency name and logo
- **Definition of Done:**
  - [ ] Route and layout created
  - [ ] Authorization checks working
  - [ ] Sidebar navigation functional
  - [ ] Tests verify ownership check
  - [ ] Responsive layout tested
  - [ ] PR submitted with screenshots
  - [ ] **Final Check:** Follows Next.js patterns

**Estimated Effort:** 5 hours

---

### Task 3.1.2: Create Dashboard Overview Section

- **Role:** Frontend Developer
- **Objective:** Create the overview dashboard with stats and progress
- **Context:** First view when agency owner accesses dashboard per FSD Story 3.1
- **Key Files to Create:**
  - `components/dashboard/DashboardOverview.tsx`
  - `components/dashboard/StatsCard.tsx`
  - `components/dashboard/ProfileCompletionWidget.tsx`
- **Key Patterns to Follow:**
  - Shadcn/ui Card components
  - Grid layout for stats
  - TypeScript strict mode
- **Acceptance Criteria (for this task):**
  - [ ] Overview page shows three stat cards: Profile Views (30 days), Lead Requests (0 for now), Profile Completion %
  - [ ] Profile completion shows circular progress bar
  - [ ] Profile completion shows percentage (e.g., "65% Complete")
  - [ ] Quick action cards: "Edit Profile", "Add Logo", "Update Trades & Regions"
  - [ ] Recent activity section (placeholder for now)
  - [ ] "Need Help?" section with support link
  - [ ] Loading skeletons while fetching data
  - [ ] Mobile responsive (cards stack on small screens)
- **Definition of Done:**
  - [ ] Overview page complete with all cards
  - [ ] Component tests verify rendering
  - [ ] Loading states tested
  - [ ] Responsive design tested
  - [ ] PR submitted with screenshots
  - [ ] **Final Check:** Clean dashboard UI

**Estimated Effort:** 5 hours

---

### Task 3.1.3: Create API Endpoint for Dashboard Data

- **Role:** Backend Developer
- **Objective:** Create endpoint to fetch dashboard stats and data
- **Context:** Dashboard needs agency data, completion %, and stats
- **Key Files to Create:**
  - `app/api/agencies/[agencyId]/dashboard/route.ts`
- **Key Patterns to Follow:**
  - Owner-only endpoint (check `claimed_by`)
  - Aggregate data from multiple tables
  - TypeScript strict mode
- **Acceptance Criteria (for this task):**
  - [ ] GET endpoint at `/api/agencies/[agencyId]/dashboard`
  - [ ] Requires authentication and ownership
  - [ ] Returns agency data: name, logo, description, all fields
  - [ ] Returns profile_completion_percentage
  - [ ] Returns stats: profile_views (hardcoded 0 for now), lead_requests (0), last_edited_at
  - [ ] Returns recent_edits from agency_profile_edits table (last 5)
  - [ ] Returns 403 if user doesn't own agency
  - [ ] Returns 404 if agency doesn't exist
- **Definition of Done:**
  - [ ] Endpoint implementation complete
  - [ ] Unit tests verify ownership check
  - [ ] Unit tests verify data structure
  - [ ] Integration test with test data
  - [ ] API response documented
  - [ ] PR submitted
  - [ ] **Final Check:** Efficient query (no N+1)

**Estimated Effort:** 4 hours

---

### Task 3.1.4: Add "Agency Dashboard" Link to User Menu

- **Role:** Frontend Developer
- **Objective:** Add navigation link for agency owners to access their dashboard
- **Context:** Agency owners need easy way to access dashboard from anywhere
- **Key Files to Modify:**
  - `components/Header.tsx` (user dropdown menu)
- **Key Patterns to Follow:**
  - Conditional rendering (only for agency_owner role)
  - TypeScript strict mode
- **Acceptance Criteria (for this task):**
  - [ ] User dropdown shows "Agency Dashboard" link if role = agency_owner
  - [ ] Link navigates to `/dashboard/agency/[user's-agency-slug]`
  - [ ] Link has dashboard icon (from lucide-react)
  - [ ] Link doesn't show for regular users or admins without claimed agency
  - [ ] Link is above "Settings" in menu order
  - [ ] Link has proper hover state
- **Definition of Done:**
  - [ ] Link added to user menu
  - [ ] Component tests verify conditional rendering
  - [ ] Tests verify correct slug used
  - [ ] Accessibility tested
  - [ ] PR submitted
  - [ ] **Final Check:** Easy to find

**Estimated Effort:** 1 hour

---

### ➡️ Story 3.2: Edit Basic Information

> As a **Staffing Agency Owner**, I want **to edit my company's basic information**, so that **potential clients see accurate details**.

### Engineering Tasks for this Story:

---

### Task 3.2.1: Create Profile Edit Form Component

- **Role:** Frontend Developer
- **Objective:** Create the profile editing form with all basic fields
- **Context:** Form is main interface for editing agency profile per FSD Story 3.2
- **Key Files to Create:**
  - `components/dashboard/ProfileEditForm.tsx`
  - `lib/validations/agency-profile.ts` (Zod schema)
- **Key Patterns to Follow:**
  - React Hook Form for state management
  - Zod for validation
  - Shadcn/ui Form components
  - TypeScript strict mode
- **Acceptance Criteria (for this task):**
  - [ ] Form displays fields: Company Name, Description, Website URL, Phone, Email, Founded Year, Employee Count, Headquarters
  - [ ] Company Name field shows warning: "Changing name requires admin approval"
  - [ ] Description field is rich text editor (TipTap)
  - [ ] Description supports: Bold, Italic, Bullet Lists, Numbered Lists, Links
  - [ ] Description has character counter (max 2000 characters)
  - [ ] Website URL validation: must be valid HTTP/HTTPS URL
  - [ ] Phone validation: E.164 format with helper text
  - [ ] Email validation: must be valid email format
  - [ ] Founded Year: dropdown 1900-current year
  - [ ] Employee Count: dropdown with ranges (1-10, 10-50, 50-100, 100-200, 200-500, 500-1000, 1000+)
  - [ ] Headquarters: text input with autocomplete (future: Google Places)
  - [ ] Form loads with current agency data
  - [ ] "Save Changes" button disabled if no changes
  - [ ] "Cancel" button resets to original values
  - [ ] Unsaved changes warning on navigation
- **Definition of Done:**
  - [ ] Form component complete with all fields
  - [ ] TipTap rich text editor integrated
  - [ ] Client-side validation working
  - [ ] Component tests verify all fields
  - [ ] Component tests verify validation rules
  - [ ] Accessibility tested
  - [ ] PR submitted
  - [ ] **Final Check:** Professional form UI

**Estimated Effort:** 8 hours

---

### Task 3.2.2: Create API Endpoint for Updating Profile

- **Role:** Backend Developer
- **Objective:** Create endpoint to save profile updates with audit trail
- **Context:** Profile edit form POSTs to this endpoint to save changes
- **Key Files to Create:**
  - `app/api/agencies/[agencyId]/profile/route.ts`
- **Key Patterns to Follow:**
  - Owner-only endpoint
  - Create audit log for each field change
  - Validation matches frontend
  - TypeScript strict mode
- **Acceptance Criteria (for this task):**
  - [ ] PUT endpoint at `/api/agencies/[agencyId]/profile`
  - [ ] Requires authentication and ownership
  - [ ] Request body validated with Zod (matches frontend schema)
  - [ ] For each changed field: creates entry in `agency_profile_edits` with old_value and new_value
  - [ ] Updates agency record with new values
  - [ ] Sets `last_edited_at` to current timestamp
  - [ ] Sets `last_edited_by` to user ID
  - [ ] Company name changes flagged for admin review (future: approval workflow)
  - [ ] Returns 200 with updated agency data
  - [ ] Returns 400 for validation errors
  - [ ] Returns 403 if user doesn't own agency
  - [ ] Returns 404 if agency doesn't exist
- **Definition of Done:**
  - [ ] Endpoint implementation complete
  - [ ] Unit tests verify validation
  - [ ] Unit tests verify audit trail creation
  - [ ] Integration test: full update flow
  - [ ] Error handling comprehensive
  - [ ] PR submitted
  - [ ] **Final Check:** Audit trail working

**Estimated Effort:** 5 hours

---

### Task 3.2.3: Integrate TipTap Rich Text Editor

- **Role:** Frontend Developer
- **Objective:** Set up TipTap editor for description field with toolbar
- **Context:** Agency description needs rich formatting per FSD Story 3.2
- **Key Files to Create:**
  - `components/RichTextEditor.tsx`
  - `lib/tiptap-extensions.ts` (configure extensions)
- **Key Patterns to Follow:**
  - TipTap React library
  - Shadcn/ui styling
  - Controlled component pattern
  - TypeScript strict mode
- **Acceptance Criteria (for this task):**
  - [ ] TipTap editor installed and configured
  - [ ] Toolbar with buttons: Bold, Italic, Bullet List, Numbered List, Link, Undo, Redo
  - [ ] Editor accepts initial value (HTML string)
  - [ ] Editor outputs HTML on change
  - [ ] Character counter shows remaining characters
  - [ ] Link dialog for adding/editing hyperlinks
  - [ ] Editor has proper focus states
  - [ ] Editor is keyboard accessible
  - [ ] Editor maintains cursor position during edits
  - [ ] Mobile: toolbar is responsive and accessible
- **Definition of Done:**
  - [ ] TipTap editor component complete
  - [ ] Component tests verify toolbar actions
  - [ ] Component tests verify HTML output
  - [ ] Editor integrated into ProfileEditForm
  - [ ] Accessibility tested with screen reader
  - [ ] PR submitted with editor demo
  - [ ] **Final Check:** Professional editor UX

**Estimated Effort:** 6 hours

---

### Task 3.2.4: Implement Profile Preview Mode

- **Role:** Frontend Developer
- **Objective:** Create preview modal to show profile as it will appear publicly
- **Context:** Agency owner can preview changes before saving per FSD Story 3.4
- **Key Files to Create:**
  - `components/dashboard/ProfilePreviewModal.tsx`
- **Key Patterns to Follow:**
  - Shadcn/ui Dialog component (full-screen)
  - Reuse existing AgencyCard/Profile components
  - TypeScript strict mode
- **Acceptance Criteria (for this task):**
  - [ ] "Preview" button added to ProfileEditForm
  - [ ] Button opens full-screen modal
  - [ ] Modal shows profile exactly as on `/recruiters/[slug]`
  - [ ] Modal uses draft data (unsaved changes)
  - [ ] Modal header shows "Preview Mode" badge
  - [ ] Modal footer has "Back to Editing" and "Publish Changes" buttons
  - [ ] "Publish Changes" saves and closes modal
  - [ ] "Back to Editing" closes modal without saving
  - [ ] Modal is scrollable
  - [ ] ESC key closes modal
  - [ ] Mobile: preview is full-screen and scrollable
- **Definition of Done:**
  - [ ] Preview modal complete and functional
  - [ ] Component tests verify modal behavior
  - [ ] Modal shows correct preview
  - [ ] Integration with form tested
  - [ ] PR submitted with screenshots
  - [ ] **Final Check:** Accurate preview

**Estimated Effort:** 4 hours

---

### ➡️ Story 3.3: Edit Company Details

> As a **Staffing Agency Owner**, I want **to edit additional company details**, so that **my profile showcases our size and capabilities**.

**Note:** This story is covered by Task 3.2.1 (fields already included in ProfileEditForm: Employee Count, Headquarters, Company Size). No additional tasks needed.

---

### ➡️ Story 3.4: Preview Profile Changes

> As a **Staffing Agency Owner**, I want **to preview my profile before publishing**, so that **I can see how changes will appear to clients**.

**Note:** This story is covered by Task 3.2.4 (ProfilePreviewModal). No additional tasks needed.

---

## 📦 Phase 4: Trade & Region Management (Sprint 4)

**Goal:** Enable agencies to select trades and service regions
**Estimated Duration:** 4-5 days
**Dependencies:** Phase 3 complete

---

### ➡️ Story 4.1: Manage Trade Specializations

> As a **Staffing Agency Owner**, I want **to select the trades we specialize in**, so that **we appear in relevant searches**.

### Engineering Tasks for this Story:

---

### Task 4.1.1: Create Trade Selection Component

- **Role:** Frontend Developer
- **Objective:** Build multi-select interface for selecting trades from standardized list
- **Context:** Agency owner selects up to 10 trades, can reorder top 3 as featured
- **Key Files to Create:**
  - `components/dashboard/TradeSelector.tsx`
  - `components/dashboard/TradeSelectionModal.tsx`
- **Key Patterns to Follow:**
  - Shadcn/ui Multi-select or Command component
  - Drag-and-drop for reordering (dnd-kit library)
  - TypeScript strict mode
- **Acceptance Criteria (for this task):**
  - [ ] Component displays currently selected trades as chips/badges
  - [ ] "Add Trades" button opens selection modal
  - [ ] Modal shows searchable list of all 48 trades
  - [ ] Search filters trades in real-time
  - [ ] Clicking trade checkbox adds to "Selected Trades" list
  - [ ] Selected trades list shows drag handles for reordering
  - [ ] Trades can be dragged to reorder (top 3 become "featured")
  - [ ] Visual indicator for top 3 featured trades (star icon or badge)
  - [ ] Remove button (X) on each selected trade chip
  - [ ] Maximum 10 trades enforced with warning message
  - [ ] Modal footer: "Save" and "Cancel" buttons
  - [ ] Save closes modal and updates form state
  - [ ] Loading state while fetching current selections
- **Definition of Done:**
  - [ ] Component complete with all features
  - [ ] Component tests verify add/remove/reorder
  - [ ] Component tests verify 10-trade limit
  - [ ] Drag-and-drop tested
  - [ ] Accessibility tested (keyboard navigation for reordering)
  - [ ] PR submitted with screenshots
  - [ ] **Final Check:** Intuitive UX for selection

**Estimated Effort:** 7 hours

---

### Task 4.1.2: Create API Endpoint for Updating Trades

- **Role:** Backend Developer
- **Objective:** Create endpoint to update agency-trade relationships
- **Context:** Saves selected trades to database, maintaining order
- **Key Files to Create:**
  - `app/api/agencies/[agencyId]/trades/route.ts`
- **Key Patterns to Follow:**
  - Owner-only endpoint
  - Delete and re-create relationships (simpler than updating)
  - TypeScript strict mode
- **Acceptance Criteria (for this task):**
  - [ ] PUT endpoint at `/api/agencies/[agencyId]/trades`
  - [ ] Requires authentication and ownership
  - [ ] Request body: array of trade IDs with optional order field
  - [ ] Validates: maximum 10 trades
  - [ ] Validates: all trade IDs exist in trades table
  - [ ] Deletes existing agency_trades records for this agency
  - [ ] Inserts new agency_trades records with order preserved
  - [ ] Updates `last_edited_at` on agency
  - [ ] Creates audit log entry
  - [ ] Returns 200 with updated trade list
  - [ ] Returns 400 if >10 trades or invalid trade IDs
  - [ ] Returns 403 if not owner
  - [ ] Transaction ensures consistency (delete + insert atomic)
- **Definition of Done:**
  - [ ] Endpoint implementation complete
  - [ ] Unit tests verify validation
  - [ ] Unit tests verify transaction behavior
  - [ ] Integration test: full update flow
  - [ ] PR submitted
  - [ ] **Final Check:** Data consistency maintained

**Estimated Effort:** 4 hours

---

### Task 4.1.3: Update Public Profile to Display Featured Trades

- **Role:** Frontend Developer
- **Objective:** Show featured trades prominently on public profile
- **Context:** Top 3 selected trades should stand out on agency profile page
- **Key Files to Modify:**
  - `app/recruiters/[slug]/page.tsx`
  - `components/AgencyCard.tsx` (for search results)
- **Key Patterns to Follow:**
  - Visual distinction for featured trades
  - Responsive design
  - TypeScript strict mode
- **Acceptance Criteria (for this task):**
  - [ ] Profile page shows "Specializations" section
  - [ ] Top 3 trades displayed as large badges with star icon
  - [ ] Remaining trades shown as smaller tags below
  - [ ] Featured trades have accent color (brand primary)
  - [ ] All trades link to search filtered by that trade
  - [ ] Search results (AgencyCard) show top 3 featured trades
  - [ ] Mobile: trades wrap gracefully
  - [ ] If <3 trades selected, show all as featured
- **Definition of Done:**
  - [ ] Profile displays trades correctly
  - [ ] Search results show featured trades
  - [ ] Component tests verify rendering
  - [ ] Responsive design tested
  - [ ] PR submitted with screenshots
  - [ ] **Final Check:** Visually appealing display

**Estimated Effort:** 3 hours

---

### ➡️ Story 4.2: Manage Service Regions

> As a **Staffing Agency Owner**, I want **to select the regions we serve**, so that **we match with companies in those areas**.

### Engineering Tasks for this Story:

---

### Task 4.2.1: Create Region Selection Component

- **Role:** Frontend Developer
- **Objective:** Build US map and checkbox interface for selecting service regions
- **Context:** Agency owner selects states, can use quick-select regional groups
- **Key Files to Create:**
  - `components/dashboard/RegionSelector.tsx`
  - `components/dashboard/USMap.tsx` (SVG map component)
- **Key Patterns to Follow:**
  - SVG-based US map or library (react-usa-map)
  - Checkbox list as alternative to map
  - TypeScript strict mode
- **Acceptance Criteria (for this task):**
  - [ ] Component shows US map with clickable states
  - [ ] Selected states highlighted on map (filled with accent color)
  - [ ] Checkbox list of all 50 states below map (alphabetical)
  - [ ] Clicking map state or checkbox toggles selection
  - [ ] Quick-select buttons: West Coast, East Coast, Midwest, South, Southwest, All USA
  - [ ] "All USA" selects all 50 states
  - [ ] Regional buttons select states in that region
  - [ ] Selected state count shown: "X states selected"
  - [ ] "Clear All" button to deselect everything
  - [ ] Validation: at least 1 state required
  - [ ] Mobile: map is scrollable/zoomable or switches to list-only view
  - [ ] Save button updates selection
- **Definition of Done:**
  - [ ] Component complete with map and checkboxes
  - [ ] Component tests verify selection logic
  - [ ] Component tests verify quick-select buttons
  - [ ] Component tests verify validation
  - [ ] Mobile tested (responsive)
  - [ ] Accessibility: keyboard navigation for checkboxes
  - [ ] PR submitted with screenshots
  - [ ] **Final Check:** Easy to use interface

**Estimated Effort:** 7 hours

---

### Task 4.2.2: Create API Endpoint for Updating Regions

- **Role:** Backend Developer
- **Objective:** Create endpoint to update agency-region relationships
- **Context:** Saves selected regions (US states) to database
- **Key Files to Create:**
  - `app/api/agencies/[agencyId]/regions/route.ts`
- **Key Patterns to Follow:**
  - Owner-only endpoint
  - Delete and re-create relationships
  - TypeScript strict mode
- **Acceptance Criteria (for this task):**
  - [ ] PUT endpoint at `/api/agencies/[agencyId]/regions`
  - [ ] Requires authentication and ownership
  - [ ] Request body: array of region IDs (state IDs)
  - [ ] Validates: at least 1 region required
  - [ ] Validates: all region IDs exist in regions table
  - [ ] Deletes existing agency_regions records
  - [ ] Inserts new agency_regions records
  - [ ] Updates `last_edited_at` on agency
  - [ ] Creates audit log entry
  - [ ] Returns 200 with updated region list
  - [ ] Returns 400 if validation fails
  - [ ] Returns 403 if not owner
  - [ ] Transaction ensures consistency
- **Definition of Done:**
  - [ ] Endpoint implementation complete
  - [ ] Unit tests verify validation
  - [ ] Unit tests verify transaction
  - [ ] Integration test: full update flow
  - [ ] PR submitted
  - [ ] **Final Check:** Reliable updates

**Estimated Effort:** 3 hours

---

### Task 4.2.3: Update Public Profile to Display Service Regions

- **Role:** Frontend Developer
- **Objective:** Show service regions on public profile page
- **Context:** Display states agency serves for client awareness
- **Key Files to Modify:**
  - `app/recruiters/[slug]/page.tsx`
  - `components/AgencyCard.tsx`
- **Key Patterns to Follow:**
  - Compact display for many states
  - Link states to search filter
  - TypeScript strict mode
- **Acceptance Criteria (for this task):**
  - [ ] Profile shows "Service Regions" section
  - [ ] States displayed as small badges/tags
  - [ ] If <=5 states: show all expanded
  - [ ] If >5 states: show first 5 + "View All" button/link
  - [ ] "View All" expands to show all states
  - [ ] States link to search filtered by that state
  - [ ] Search results show "Serves: [State abbreviations]"
  - [ ] If all 50 states selected: show "Nationwide" badge
  - [ ] Mobile: tags wrap gracefully
- **Definition of Done:**
  - [ ] Profile displays regions correctly
  - [ ] Search results show regions
  - [ ] Component tests verify rendering
  - [ ] Component tests verify "Nationwide" logic
  - [ ] Responsive design tested
  - [ ] PR submitted with screenshots
  - [ ] **Final Check:** Clear geographic coverage

**Estimated Effort:** 3 hours

---

### ➡️ Story 4.3: Add Trade-Specific Capabilities (Optional Enhancement)

> As a **Staffing Agency Owner**, I want **to add details about our capabilities per trade**, so that **clients understand our capacity**.

**Note:** This story is marked as optional/future enhancement in FSD. Deferring to Phase 5 or later based on user feedback after MVP launch. No tasks created at this time.

---

## 📦 Phase 5: Profile Completion Tracking (Sprint 5)

**Goal:** Track and incentivize profile completion
**Estimated Duration:** 3 days
**Dependencies:** Phase 3 and 4 complete

---

### ➡️ Story 5.1: View Profile Completion Progress

> As a **Staffing Agency Owner**, I want **to see my profile completion percentage**, so that **I know what information is missing**.

### Engineering Tasks for this Story:

---

### Task 5.1.1: Implement Profile Completion Calculation Function

- **Role:** Backend Developer
- **Objective:** Create function to calculate profile completion percentage
- **Context:** Per FSD Story 5.2, scoring formula is defined: Basic 20%, Contact 15%, Services 40%, Additional 15%, Details 10%
- **Key Files to Create:**
  - `lib/utils/profile-completion.ts`
- **Key Patterns to Follow:**
  - Pure function (testable)
  - TypeScript strict mode
  - Comprehensive unit tests
- **Acceptance Criteria (for this task):**
  - [ ] Function signature: `calculateProfileCompletion(agency: Agency): number`
  - [ ] Scoring formula implemented exactly per FSD:
    - Basic Info (20%): Name (5%), Description (10%), Website (5%)
    - Contact (15%): Phone (5%), Email (5%), Headquarters (5%)
    - Services (40%): Trades selected (20%), Regions selected (20%)
    - Additional (15%): Logo (10%), Founded Year (5%)
    - Details (10%): Employee Count (5%), Company Size (5%)
  - [ ] Returns percentage 0-100
  - [ ] Empty/null fields count as 0%
  - [ ] Function handles missing optional fields gracefully
  - [ ] Trades and regions scoring: proportional (e.g., 1 trade = 20%, 5+ trades = 20%)
- **Definition of Done:**
  - [ ] Function implementation complete
  - [ ] Unit tests cover all scoring components
  - [ ] Unit tests verify edge cases (empty profile, fully complete)
  - [ ] JSDoc documentation added
  - [ ] PR submitted with tests
  - [ ] **Final Check:** 100% test coverage

**Estimated Effort:** 3 hours

---

### Task 5.1.2: Create Database Trigger to Auto-Update Completion Percentage

- **Role:** Backend Developer
- **Objective:** Create trigger to automatically recalculate completion on agency updates
- **Context:** Keep `profile_completion_percentage` field in sync without manual updates
- **Key Files to Create:**
  - `supabase/migrations/[timestamp]_create_profile_completion_trigger.sql`
- **Key Patterns to Follow:**
  - PostgreSQL trigger function
  - Trigger fires on INSERT/UPDATE of agencies table
  - TypeScript function in Supabase (or plpgsql)
- **Acceptance Criteria (for this task):**
  - [ ] Trigger function `calculate_profile_completion()` created
  - [ ] Function implements same logic as TypeScript version
  - [ ] Trigger fires BEFORE INSERT OR UPDATE on agencies table
  - [ ] Trigger sets `NEW.profile_completion_percentage`
  - [ ] Trigger handles NULL values gracefully
  - [ ] Trigger also fires when agency_trades or agency_regions change (or separate triggers)
  - [ ] Migration includes rollback (drop trigger)
  - [ ] Migration tested locally
- **Definition of Done:**
  - [ ] Migration created and tested
  - [ ] Trigger fires correctly on updates
  - [ ] Verified percentage updates automatically
  - [ ] Tests verify trigger logic
  - [ ] PR submitted
  - [ ] **Final Check:** Always in sync

**Estimated Effort:** 4 hours

---

### Task 5.1.3: Create Profile Completion Widget Component

- **Role:** Frontend Developer
- **Objective:** Build widget to display completion progress on dashboard
- **Context:** Widget shows on dashboard overview per FSD Story 5.1
- **Key Files to Create:**
  - `components/dashboard/ProfileCompletionWidget.tsx`
  - `components/dashboard/CompletionChecklist.tsx`
- **Key Patterns to Follow:**
  - Shadcn/ui Progress component
  - Shadcn/ui Card component
  - TypeScript strict mode
- **Acceptance Criteria (for this task):**
  - [ ] Widget displays circular or linear progress bar
  - [ ] Shows percentage prominently (e.g., "65%")
  - [ ] Progress bar color: <50% red, 50-79% yellow, 80-99% blue, 100% green
  - [ ] Checklist shows incomplete items:
    - [ ] "Add Logo" (if no logo)
    - [ ] "Complete Description" (if empty or <100 chars)
    - [ ] "Select Trades" (if <1 trade)
    - [ ] "Select Regions" (if <1 region)
    - [ ] "Add Contact Info" (if phone or email missing)
  - [ ] Each checklist item links to relevant edit page
  - [ ] Completed items shown with checkmark (faded)
  - [ ] "Complete your profile" CTA if <80%
  - [ ] Celebration animation if 100% (confetti or badge reveal)
- **Definition of Done:**
  - [ ] Widget complete with all features
  - [ ] Component tests verify checklist logic
  - [ ] Component tests verify color changes
  - [ ] Component tests verify 100% celebration
  - [ ] Accessibility tested
  - [ ] PR submitted with screenshots
  - [ ] **Final Check:** Motivating UI

**Estimated Effort:** 5 hours

---

### ➡️ Story 5.2: Profile Completion Scoring

> As a **Platform Administrator**, I want **profile completion to be calculated automatically**, so that **we can track engagement metrics**.

**Note:** This story is covered by Tasks 5.1.1 and 5.1.2 (calculation function + database trigger). No additional tasks needed.

---

### ➡️ Story 5.3: Profile Completion Incentives

> As a **Staffing Agency Owner**, I want **to be incentivized to complete my profile**, so that **I get more visibility**.

### Engineering Tasks for this Story:

---

### Task 5.3.1: Create Completion Incentive Banner Component

- **Role:** Frontend Developer
- **Objective:** Show motivational banners based on completion level
- **Context:** Banners appear on dashboard to encourage completion per FSD Story 5.3
- **Key Files to Create:**
  - `components/dashboard/CompletionIncentiveBanner.tsx`
- **Key Patterns to Follow:**
  - Shadcn/ui Alert component
  - Conditional rendering based on percentage
  - TypeScript strict mode
- **Acceptance Criteria (for this task):**
  - [ ] Banner displays based on completion %:
    - <50%: "Complete your profile to get 3x more leads" (red/warning)
    - 50-79%: "Almost there! Complete your profile for premium placement" (yellow/info)
    - 80-99%: "Just one more step to unlock Featured Agency status" (blue/info)
    - 100%: "Congratulations! Your profile is complete" (green/success) with confetti
  - [ ] Banner has call-to-action button linking to incomplete section
  - [ ] Banner is dismissible (stores in localStorage per session)
  - [ ] Banner reappears on next login if still incomplete
  - [ ] 100% banner shows for 1 week, then becomes small badge
- **Definition of Done:**
  - [ ] Banner component complete
  - [ ] Component tests verify all states
  - [ ] Component tests verify dismissal logic
  - [ ] Confetti tested (or celebration animation)
  - [ ] PR submitted with screenshots of all states
  - [ ] **Final Check:** Encouraging, not annoying

**Estimated Effort:** 4 hours

---

### Task 5.3.2: Update Search Results to Show Profile Badges

- **Role:** Frontend Developer
- **Objective:** Display completion badges in search results
- **Context:** 80%+ profiles get "Verified Profile" badge, 100% get priority placement
- **Key Files to Modify:**
  - `components/AgencyCard.tsx`
  - `app/api/agencies/route.ts` (update query for sorting)
- **Key Patterns to Follow:**
  - Badge component
  - Conditional rendering
  - TypeScript strict mode
- **Acceptance Criteria (for this task):**
  - [ ] AgencyCard shows "Verified Profile" badge if completion >= 80%
  - [ ] Badge has checkmark icon and blue color
  - [ ] AgencyCard shows "Featured Agency" badge if completion = 100%
  - [ ] Featured badge has star icon and gold/yellow color
  - [ ] Badges displayed prominently (top-right of card)
  - [ ] Search API sorts by: completion DESC, then name ASC
  - [ ] 100% complete agencies appear first in results
  - [ ] Tooltip on badge hover explains benefit
  - [ ] Mobile: badges still visible and readable
- **Definition of Done:**
  - [ ] Badges display correctly
  - [ ] Component tests verify badge logic
  - [ ] Search sorting tested
  - [ ] Integration test: 100% profile appears first
  - [ ] PR submitted with screenshots
  - [ ] **Final Check:** Clear visual incentive

**Estimated Effort:** 3 hours

---

### Task 5.3.3: Send Completion Milestone Email

- **Role:** Backend Developer
- **Objective:** Send congratulations email when profile reaches 100%
- **Context:** Email rewards completion and explains benefits per FSD Story 5.3
- **Key Files to Create:**
  - `lib/emails/profile-complete.ts`
- **Key Files to Modify:**
  - Database trigger or API endpoint that updates completion
- **Key Patterns to Follow:**
  - Resend email service
  - Trigger email when completion transitions to 100%
  - One-time email (don't resend if they dip below 100% and back)
- **Acceptance Criteria (for this task):**
  - [ ] Email template created: Congratulations message, "You've unlocked:", List of benefits (Featured badge, Priority search placement, Verified profile status), CTA: "View Your Profile"
  - [ ] Email sent when completion reaches 100% for first time
  - [ ] Flag in database prevents duplicate emails (`completion_email_sent` boolean)
  - [ ] Email includes link to public profile
  - [ ] Plain text version provided
  - [ ] Email send errors logged but don't block profile update
- **Definition of Done:**
  - [ ] Email template created
  - [ ] Email sending integrated
  - [ ] Test email sent and verified
  - [ ] Duplicate prevention tested
  - [ ] PR submitted with email preview
  - [ ] **Final Check:** Celebratory tone

**Estimated Effort:** 3 hours

---

## 📦 Summary & Estimates

### Total Effort Estimates by Phase

**Phase 1: Agency Claim Request**

- 10 tasks
- Estimated: 31 hours (~4 days)

**Phase 2: Claim Verification & Approval**

- 11 tasks
- Estimated: 36 hours (~4.5 days)

**Phase 3: Profile Editing Dashboard**

- 9 tasks
- Estimated: 41 hours (~5 days)

**Phase 4: Trade & Region Management**

- 6 tasks
- Estimated: 27 hours (~3.5 days)

**Phase 5: Profile Completion Tracking**

- 6 tasks
- Estimated: 22 hours (~3 days)

**Total: 42 tasks, ~157 hours (~20 working days / 4 weeks)**

### Critical Path Dependencies

1. **Week 1:** Phase 1 must complete before Phase 2
2. **Week 2:** Phase 2 must complete before Phase 3
3. **Week 3:** Phase 3 can run parallel with Phase 4 start
4. **Week 4:** Phase 4 and 5 can partially overlap

### Risk Factors

- TipTap integration complexity may add 2-4 hours
- US map component may require library evaluation time
- Email template iterations may add 1-2 hours per template
- Testing coverage target (85%+) requires discipline throughout

### Recommended Sprint Structure

**Sprint 1 (Week 1):** Phase 1 - Claims Foundation
**Sprint 2 (Week 2):** Phase 2 - Admin Approval
**Sprint 3 (Week 3):** Phase 3 - Profile Editing
**Sprint 4 (Week 4):** Phase 4 + 5 - Services & Completion

---

## 🎯 Next Steps

1. **Review this task list** with team for feedback
2. **Create GitHub issues** for each task brief
3. **Assign tasks** to developers
4. **Set up project board** with sprint columns
5. **Begin Phase 1 implementation**

---

**Task List Status:** Ready for Implementation
**Next Review:** After Phase 1 completion
**Last Updated:** 2025-12-19
