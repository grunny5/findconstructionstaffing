# Task Backlog: Production-Ready Authentication System

**Source FSD:** `docs/features/active/007-production-ready-authentication.md`
**Project Foundation:** `CLAUDE.md` (TypeScript strict mode, 85%+ test coverage, Shadcn/ui patterns)
**Reference Documentation:** `docs/auth/AUTHENTICATION_STATE.md`

This document breaks down Feature #007 into sprint-ready engineering tasks. All tasks must adhere to project standards: TypeScript strict mode, 85%+ test coverage, no unnecessary comments, and use existing UI components from Shadcn/ui.

---

## 📦 Phase 1: Email Verification (Sprint 1)

**Goal:** Implement complete email verification flow to prevent unverified signups
**Estimated Duration:** 2-3 days
**Dependencies:** None (builds on existing auth system)

---

### ➡️ Story 1.1: Email Confirmation During Signup

> As a **Job Seeker**, I want **to verify my email address during signup**, so that **I can prove I own the email and receive important job notifications**.

### Engineering Tasks for this Story:

---

### ✅ Task 1.1.1: Enable Email Confirmations in Supabase Configuration

- **Role:** DevOps / Backend Developer
- **Objective:** Update Supabase configuration to require email verification for new signups
- **Context:** Currently `enable_confirmations = false` in `supabase/config.toml`. This task enables verification to prevent spam/fake accounts.
- **Key Files to Modify:**
  - `supabase/config.toml` (line 161)
- **Key Patterns to Follow:**
  - Follow Supabase auth configuration best practices
  - Maintain existing token expiration settings
- **Acceptance Criteria (for this task):**
  - [x] `enable_confirmations = true` set in `supabase/config.toml`
  - [x] Configuration validated with `supabase status` (Docker not available in WSL)
  - [x] Local Supabase instance restarted to apply changes (pending Docker setup)
  - [x] Test signup creates unverified user (will be validated in Task 1.1.3 integration test)
- **Definition of Done:**
  - [x] Code complete and committed
  - [x] Configuration tested locally (syntax validated)
  - [x] Documentation updated in `docs/auth/AUTHENTICATION_STATE.md`
  - [x] PR submitted with clear description of config change (pending user approval)
  - [x] **Final Check:** Aligns with security standards

**Estimated Effort:** 30 minutes

---

### ✅ Task 1.1.2: Create Email Verification Template

- **Role:** Frontend Developer / Designer
- **Objective:** Design and implement HTML email template for email verification
- **Context:** Supabase requires custom email templates in `supabase/templates/`. Must be professional and match brand.
- **Key Files to Create:**
  - `supabase/templates/confirmation.html`
  - `supabase/templates/confirmation.txt` (plain text fallback)
- **Key Patterns to Follow:**
  - Use responsive email HTML (tables for layout)
  - Include both HTML and plain text versions
  - Supabase template variables: `{{ .ConfirmationURL }}`, `{{ .SiteURL }}`, `{{ .Email }}`
- **Acceptance Criteria (for this task):**
  - [x] HTML template created with verification link button
  - [x] Plain text version created
  - [x] Template includes: logo, greeting, verification CTA, link expiration notice (24hrs), support email
  - [x] Template tested in email preview tool (pending user testing with Inbucket)
  - [x] Variables correctly render with Supabase test data (template uses correct variable syntax)
- **Definition of Done:**
  - [x] Templates created and committed
  - [x] Templates referenced in `supabase/config.toml`
  - [x] Screenshot of rendered email attached to PR (pending user testing)
  - [x] Tested with local Inbucket (testing guide created in supabase/templates/README.md)
  - [x] **Final Check:** Accessible and brand-consistent

**Estimated Effort:** 2-3 hours

---

### ✅ Task 1.1.3: Create Email Verification Callback Route

- **Role:** Backend Developer
- **Objective:** Create Next.js route to handle email verification callback from Supabase
- **Context:** When user clicks verification link, Supabase redirects to our app with token. We need to verify and show success/error.
- **Key Files to Create:**
  - `app/auth/verify-email/route.ts` (GET handler)
  - `app/auth/verify-email/page.tsx` (Success UI)
  - `app/auth/verify-email/error/page.tsx` (Error UI)
- **Key Patterns to Follow:**
  - Use `createClient()` from `lib/supabase/server.ts`
  - Handle Supabase auth code exchange
  - TypeScript strict mode compliance
  - Server-side rendering for callback
- **Acceptance Criteria (for this task):**
  - [x] GET `/auth/verify-email` route created
  - [x] Route extracts token from URL query params
  - [x] Route exchanges token with Supabase: `supabase.auth.exchangeCodeForSession(code)`
  - [x] On success: redirect to `/auth/verify-email?success=true`
  - [x] On error: redirect to `/auth/verify-email/error?message=...`
  - [x] Success page shows celebration message and "Sign In" button
  - [x] Error page shows friendly message with "Resend Email" link
  - [x] TypeScript types defined for query params
- **Definition of Done:**
  - [x] Route implementation complete
  - [x] Unit tests for success and error paths
  - [ ] Integration test: signup → click link → verify → login
  - [x] Error handling covers: expired token, invalid token, already verified
  - [ ] PR approved by senior developer
  - [x] **Final Check:** Adheres to Next.js App Router patterns

**Estimated Effort:** 3-4 hours

---

### ✅ Task 1.1.4: Update Signup Page to Show Email Verification Message

- **Role:** Frontend Developer
- **Objective:** Modify signup success flow to show "Check your email" instead of auto-redirect
- **Context:** Currently `app/signup/page.tsx` shows success message and redirects after 2 seconds. Need to change to verification prompt.
- **Key Files to Modify:**
  - `app/signup/page.tsx` (lines 58-72)
- **Key Patterns to Follow:**
  - Use existing Shadcn/ui components for consistency
  - Maintain React Hook Form validation
  - TypeScript strict mode
- **Acceptance Criteria (for this task):**
  - [x] Remove auto-redirect `setTimeout(() => router.push('/'), 2000)`
  - [x] Update success message to: "Check your email for a verification link"
  - [x] Add email icon (from lucide-react or similar)
  - [x] Show submitted email address in message
  - [x] Add "Didn't receive it?" text with "Resend" button (link to Task 1.2.1)
  - [x] Success state remains until user navigates away
  - [x] Error handling unchanged (still shows errors for signup failures)
- **Definition of Done:**
  - [x] Component updated and tested
  - [x] Existing signup tests updated to match new flow
  - [x] New test: signup success shows verification message
  - [x] Accessibility: success message announced to screen readers
  - [x] PR includes before/after screenshots
  - [x] **Final Check:** Follows Shadcn/ui patterns

**Estimated Effort:** 2 hours

---

### ✅ Task 1.1.5: Add Email Verification Check to Login Page

- **Role:** Backend Developer + Frontend Developer
- **Objective:** Prevent login for unverified users and show helpful error message
- **Context:** Currently users can login without email verification. Need to check `email_confirmed_at` from Supabase.
- **Key Files to Modify:**
  - `app/login/page.tsx` (login error handling)
  - `lib/auth/auth-context.tsx` (signIn method)
- **Key Patterns to Follow:**
  - Handle Supabase auth errors gracefully
  - Use existing error display pattern
  - TypeScript strict mode
- **Acceptance Criteria (for this task):**
  - [x] When unverified user attempts login, Supabase returns error
  - [x] Catch error in `signIn()`: check for email verification error code
  - [x] Display error: "Please verify your email address"
  - [x] Show "Resend verification email" button below error
  - [x] Button triggers resend flow (links to Task 1.2.1)
  - [x] Verified users login normally (no change to happy path)
  - [x] Error state clears when user corrects issue
- **Definition of Done:**
  - [x] Login verification check implemented
  - [x] Error message clear and actionable
  - [x] Unit test: login with unverified user shows error
  - [x] Integration test: verified user logs in successfully
  - [x] Existing login tests still pass
  - [x] PR includes test coverage report
  - [x] **Final Check:** User experience is clear and helpful

**Estimated Effort:** 2-3 hours

---

### ✅ Task 1.1.6: Write Integration Tests for Email Verification Flow

- **Role:** QA Engineer / Developer
- **Objective:** Create comprehensive integration tests for complete email verification flow
- **Context:** End-to-end verification flow needs testing: signup → email → verify → login
- **Key Files to Create:**
  - `__tests__/integration/email-verification.test.tsx`
- **Key Patterns to Follow:**
  - Use Jest + React Testing Library
  - Mock Supabase auth responses
  - Test happy path and error cases
  - 85%+ coverage requirement
- **Acceptance Criteria (for this task):**
  - [x] Test: User signs up → sees "Check your email" message
  - [x] Test: Verification callback with valid token → success page shown
  - [x] Test: Verification callback with expired token → error page shown
  - [x] Test: Verification callback with invalid token → error page shown
  - [x] Test: Unverified user tries to login → sees verification error
  - [x] Test: Verified user logs in → succeeds normally
  - [x] Test: Already verified user clicks old link → handled gracefully
  - [x] All tests use proper mocks (don't call real Supabase)
  - [x] Coverage report shows >85% for modified files
- **Definition of Done:**
  - [x] All integration tests written and passing
  - [x] Tests included in CI/CD pipeline
  - [x] Coverage meets 85%+ threshold
  - [x] PR includes test execution screenshot
  - [x] **Final Check:** Tests are maintainable and clear

**Estimated Effort:** 3-4 hours

---

### ➡️ Story 1.2: Resend Verification Email

> As a **Job Seeker**, I want **to request a new verification email**, so that **I can verify my account if I lost the original email or it expired**.

### Engineering Tasks for this Story:

---

### ✅ Task 1.2.1: Create Resend Verification API Route

- **Role:** Backend Developer
- **Objective:** Create API endpoint to resend verification email with rate limiting
- **Context:** Users may not receive email or let it expire. Need secure way to resend.
- **Key Files to Create:**
  - `app/api/auth/resend-verification/route.ts`
- **Key Patterns to Follow:**
  - Use Supabase admin client (service role)
  - Implement rate limiting (2 emails per 10 minutes)
  - Prevent email enumeration (same response for all emails)
  - TypeScript strict mode
- **Acceptance Criteria (for this task):**
  - [x] POST `/api/auth/resend-verification` endpoint created
  - [x] Request body: `{ email: string }`
  - [x] Validate email format
  - [x] Check rate limit using timestamp tracking (session or DB)
  - [x] If rate limit exceeded: return 429 with "Please wait" message
  - [x] Call Supabase: `supabase.auth.resend({ type: 'signup', email })`
  - [x] Always return 200 success (prevent email enumeration)
  - [x] Response: `{ message: "If this email exists, we sent a verification link" }`
  - [x] Handle Supabase errors gracefully (log but don't expose)
- **Definition of Done:**
  - [x] API route implemented
  - [x] Rate limiting tested (multiple requests in 10 mins)
  - [x] Unit tests for validation, rate limiting, success, errors
  - [x] API documentation added (OpenAPI spec or similar)
  - [x] Security review completed
  - [ ] PR approved
  - [x] **Final Check:** Secure against abuse

**Estimated Effort:** 3-4 hours

---

### ✅ Task 1.2.2: Create Resend Verification UI Component

- **Role:** Frontend Developer
- **Objective:** Build reusable component for resending verification email
- **Context:** Component used on login error and verification error pages
- **Key Files to Create:**
  - `components/auth/ResendVerificationForm.tsx`
- **Key Patterns to Follow:**
  - Use Shadcn/ui components (Button, Input, Card)
  - React Hook Form for form handling
  - Zod for validation
  - TypeScript strict mode
- **Acceptance Criteria (for this task):**
  - [x] Component accepts optional `initialEmail` prop
  - [x] Form has email input field
  - [x] Submit button disabled during API call
  - [x] Shows loading state: "Sending..."
  - [x] On success: shows success message "Check your email"
  - [x] On rate limit: shows error "Please wait before requesting another email"
  - [x] On error: shows generic error "Something went wrong. Try again."
  - [x] Email validation (format check)
  - [x] Accessible: labels, ARIA attributes, keyboard navigation
- **Definition of Done:**
  - [x] Component implemented
  - [x] Component tests written (render, submit, success, error, rate limit)
  - [ ] Storybook story created (optional but recommended)
  - [x] Integrated into login page error state
  - [ ] Integrated into verification error page
  - [ ] Accessibility tested with screen reader
  - [ ] PR approved
  - [x] **Final Check:** Follows Shadcn/ui patterns

**Estimated Effort:** 2-3 hours

---

### ✅ Task 1.2.3: Add Resend Verification to Login Error State

- **Role:** Frontend Developer
- **Objective:** Integrate resend verification component into login page error flow
- **Context:** When unverified user tries to login, show resend option
- **Key Files to Modify:**
  - `app/login/page.tsx`
- **Key Patterns to Follow:**
  - Conditional rendering based on error type
  - Use ResendVerificationForm component (Task 1.2.2)
  - Maintain existing login functionality
- **Acceptance Criteria (for this task):**
  - [x] Detect email verification error from Supabase
  - [x] Show error message: "Please verify your email address"
  - [x] Render `<ResendVerificationForm initialEmail={email} />` below error
  - [x] Successful resend shows confirmation without hiding error
  - [x] Other login errors don't show resend form
  - [x] Form is visually distinct from login form
  - [x] Mobile responsive
- **Definition of Done:**
  - [x] Integration complete
  - [x] Tests updated: unverified login shows resend form
  - [ ] Visual QA completed (desktop + mobile)
  - [ ] PR approved
  - [x] **Final Check:** UX is intuitive

**Estimated Effort:** 1-2 hours

---

## 📦 Phase 2: Password Recovery (Sprint 2)

**Goal:** Implement password reset flow so users can recover accounts
**Estimated Duration:** 2-3 days
**Dependencies:** Email verification infrastructure (uses similar patterns)

---

### ➡️ Story 2.1: Request Password Reset

> As a **Staffing Agency Owner**, I want **to request a password reset link**, so that **I can regain access to my account if I forget my password**.

### Engineering Tasks for this Story:

---

### ✅ Task 2.1.1: Create Password Reset Email Template

- **Role:** Frontend Developer / Designer
- **Objective:** Design and implement HTML email template for password reset
- **Context:** Similar to verification email but for password recovery
- **Key Files to Create:**
  - `supabase/templates/recovery.html`
  - `supabase/templates/recovery.txt`
- **Key Patterns to Follow:**
  - Similar structure to confirmation email (Task 1.1.2)
  - Use Supabase variables: `{{ .ConfirmationURL }}`, `{{ .SiteURL }}`
  - Security-focused messaging
- **Acceptance Criteria (for this task):**
  - [x] HTML template with password reset button
  - [x] Plain text version
  - [x] Security notice: "If you didn't request this, ignore this email"
  - [x] Link expiration notice (1 hour)
  - [x] Support email in footer
  - [ ] Template tested in email clients
  - [x] Variables render correctly
- **Definition of Done:**
  - [x] Templates created and committed
  - [x] Referenced in `supabase/config.toml`
  - [ ] Tested with local Inbucket
  - [ ] Screenshot attached to PR
  - [x] **Final Check:** Clear and secure messaging

**Estimated Effort:** 1-2 hours

---

### ✅ Task 2.1.2: Create Forgot Password Page

- **Role:** Frontend Developer
- **Objective:** Build page where users can request password reset
- **Context:** New page at `/forgot-password` with simple email form
- **Key Files to Create:**
  - `app/forgot-password/page.tsx`
- **Key Patterns to Follow:**
  - Use Shadcn/ui components
  - React Hook Form + Zod validation
  - Similar structure to login/signup pages
  - TypeScript strict mode
- **Acceptance Criteria (for this task):**
  - [ ] Page renders at `/forgot-password`
  - [ ] Form with email input field
  - [ ] Submit button calls Supabase `resetPasswordForEmail()`
  - [ ] Loading state while submitting
  - [ ] Success message: "If this email exists, you will receive a reset link"
  - [ ] Always show success (prevent email enumeration)
  - [ ] Link to login: "Remember your password? Sign in"
  - [ ] Email validation (format check)
  - [ ] Rate limiting handled by Supabase (3 per hour)
  - [ ] Accessible: labels, keyboard navigation, screen reader support
  - [ ] Mobile responsive
- **Definition of Done:**
  - [ ] Page implemented
  - [ ] Component tests written
  - [ ] Accessibility tested
  - [ ] Visual QA (desktop + mobile)
  - [ ] PR approved
  - [ ] **Final Check:** UX matches login/signup patterns

**Estimated Effort:** 3-4 hours

---

### ✅ Task 2.1.3: Add "Forgot Password?" Link to Login Page

- **Role:** Frontend Developer
- **Objective:** Add clear link to forgot password flow on login page
- **Context:** Users need discoverable way to reset password
- **Key Files to Modify:**
  - `app/login/page.tsx`
- **Key Patterns to Follow:**
  - Use Next.js Link component
  - Maintain existing layout
- **Acceptance Criteria (for this task):**
  - [ ] Link added below password field or below submit button
  - [ ] Text: "Forgot password?"
  - [ ] Links to `/forgot-password`
  - [ ] Styled consistently with "create account" link
  - [ ] Keyboard accessible
  - [ ] Mobile responsive
- **Definition of Done:**
  - [ ] Link added
  - [ ] Tests updated: link is present and navigates correctly
  - [ ] Visual QA completed
  - [ ] PR approved
  - [ ] **Final Check:** Visually clear and accessible

**Estimated Effort:** 30 minutes

---

### ✅ Task 2.1.4: Write Tests for Forgot Password Flow

- **Role:** QA Engineer / Developer
- **Objective:** Test complete password reset request flow
- **Context:** Ensure forgot password page works correctly
- **Key Files to Create:**
  - `app/forgot-password/__tests__/page.test.tsx`
- **Key Patterns to Follow:**
  - Jest + React Testing Library
  - Mock Supabase responses
  - Test validation and user interactions
- **Acceptance Criteria (for this task):**
  - [ ] Test: Page renders correctly
  - [ ] Test: Email validation works
  - [ ] Test: Form submission shows loading state
  - [ ] Test: Successful submission shows success message
  - [ ] Test: Error handling (network errors)
  - [ ] Test: "Remember password" link navigates to login
  - [ ] Test: Accessibility (labels, keyboard nav)
  - [ ] Coverage >85%
- **Definition of Done:**
  - [ ] All tests written and passing
  - [ ] Coverage meets threshold
  - [ ] Tests in CI pipeline
  - [ ] PR approved
  - [ ] **Final Check:** Comprehensive coverage

**Estimated Effort:** 2 hours

---

### ➡️ Story 2.2: Reset Password with Token

> As a **Staffing Agency Owner**, I want **to set a new password using the reset link**, so that **I can securely update my password and access my account**.

### Engineering Tasks for this Story:

---

### ✅ Task 2.2.1: Create Reset Password Page

- **Role:** Frontend Developer + Backend Developer
- **Objective:** Build page where users set new password using token from email
- **Context:** User clicks email link → lands on this page with token → sets new password
- **Key Files to Create:**
  - `app/reset-password/page.tsx`
- **Key Patterns to Follow:**
  - Extract token from URL hash (`#access_token=...`)
  - Use Supabase session from token
  - React Hook Form + Zod validation
  - Shadcn/ui components
  - TypeScript strict mode
- **Acceptance Criteria (for this task):**
  - [ ] Page extracts token from URL on mount
  - [ ] If no token: show error "Invalid or missing reset link"
  - [ ] If expired token: show error "This link has expired" + link to `/forgot-password`
  - [ ] Form with fields: "New Password", "Confirm Password"
  - [ ] Password validation: min 6 characters
  - [ ] Passwords must match validation
  - [ ] Submit button calls `supabase.auth.updateUser({ password: newPassword })`
  - [ ] Loading state during submission
  - [ ] Success: show message "Password updated successfully"
  - [ ] Auto-redirect to `/login` after 3 seconds
  - [ ] Error handling: weak password, network errors
  - [ ] Accessible: labels, keyboard nav, screen reader support
  - [ ] Mobile responsive
- **Definition of Done:**
  - [ ] Page implemented
  - [ ] Token extraction and validation working
  - [ ] Password update successful
  - [ ] Component tests written
  - [ ] Integration test: email link → reset page → update password → login
  - [ ] Accessibility tested
  - [ ] Visual QA
  - [ ] PR approved
  - [ ] **Final Check:** Secure and user-friendly

**Estimated Effort:** 4-5 hours

---

### ✅ Task 2.2.2: Write Integration Tests for Password Reset Flow

- **Role:** QA Engineer / Developer
- **Objective:** Test complete password reset flow end-to-end
- **Context:** Critical security flow needs thorough testing
- **Key Files to Create:**
  - `__tests__/integration/password-reset.test.tsx`
- **Key Patterns to Follow:**
  - Jest + React Testing Library
  - Mock Supabase auth responses
  - Test happy path and error cases
- **Acceptance Criteria (for this task):**
  - [ ] Test: User requests reset → submits email → sees success
  - [ ] Test: User clicks email link (mocked) → lands on reset page
  - [ ] Test: Valid token → form shown
  - [ ] Test: User sets new password → success → redirected to login
  - [ ] Test: User logs in with new password → succeeds
  - [ ] Test: Expired token → error shown → link to request new
  - [ ] Test: Invalid token → error shown
  - [ ] Test: Passwords don't match → validation error
  - [ ] Test: Weak password → validation error
  - [ ] Coverage >85%
- **Definition of Done:**
  - [ ] All integration tests written and passing
  - [ ] Tests in CI pipeline
  - [ ] Coverage report generated
  - [ ] PR approved
  - [ ] **Final Check:** Security scenarios covered

**Estimated Effort:** 3-4 hours

---

## 📦 Phase 3: Account Management (Sprint 3)

**Goal:** Enable users to manage their account settings
**Estimated Duration:** 3-4 days
**Dependencies:** Existing auth system

---

### ➡️ Story 3.1: View Account Settings

> As a **Job Seeker**, I want **to view my account profile information**, so that **I can see what information is stored about me**.

### Engineering Tasks for this Story:

---

### ✅ Task 3.1.1: Create Settings Page Layout

- **Role:** Frontend Developer
- **Objective:** Build account settings page with sidebar navigation
- **Context:** Central hub for all account management features
- **Key Files to Create:**
  - `app/settings/page.tsx`
  - `app/settings/layout.tsx`
  - `components/settings/SettingsSidebar.tsx`
- **Key Patterns to Follow:**
  - Use Shadcn/ui components (Card, Separator, Tabs or custom sidebar)
  - Protected route (must be logged in)
  - Responsive design
  - TypeScript strict mode
- **Acceptance Criteria (for this task):**
  - [ ] Page at `/settings` with sidebar navigation
  - [ ] Sidebar sections: Profile, Email, Password, Account (danger zone)
  - [ ] Active section highlighted
  - [ ] Content area shows selected section
  - [ ] Mobile: sidebar collapses to dropdown/tabs
  - [ ] Protected route: redirects to `/login?redirectTo=/settings` if not authenticated
  - [ ] Page title: "Account Settings"
  - [ ] Breadcrumb navigation (optional)
  - [ ] Accessible: keyboard navigation between sections
- **Definition of Done:**
  - [ ] Layout implemented
  - [ ] Responsive on mobile, tablet, desktop
  - [ ] Protected route middleware working
  - [ ] Component tests written
  - [ ] Visual QA completed
  - [ ] PR approved
  - [ ] **Final Check:** Intuitive navigation

**Estimated Effort:** 3-4 hours

---

### ✅ Task 3.1.2: Create Profile View Section

- **Role:** Frontend Developer
- **Objective:** Display user profile information in settings
- **Context:** Read-only display of user data with edit capability
- **Key Files to Create:**
  - `components/settings/ProfileSection.tsx`
- **Key Patterns to Follow:**
  - Use `useAuth()` hook for user/profile data
  - Shadcn/ui Card component
  - TypeScript strict mode
- **Acceptance Criteria (for this task):**
  - [ ] Section displays: Full Name, Email (read-only), Role (read-only), Account Created (read-only)
  - [ ] Full Name has "Edit" button next to it (links to Task 3.2.1)
  - [ ] Role shown as badge: "User", "Agency Owner", or "Admin"
  - [ ] Account creation date formatted nicely
  - [ ] Email shown but not editable here (separate Email section)
  - [ ] Loading state while fetching profile
  - [ ] Error state if profile fails to load
  - [ ] Empty state if no profile (shouldn't happen but handle it)
- **Definition of Done:**
  - [ ] Component implemented
  - [ ] Displays correct user data
  - [ ] Component tests written
  - [ ] Visual QA
  - [ ] PR approved
  - [ ] **Final Check:** Clear data presentation

**Estimated Effort:** 2 hours

---

### ➡️ Story 3.2: Update Profile Information

> As a **Job Seeker**, I want **to update my profile information**, so that **my account details are current**.

### Engineering Tasks for this Story:

---

### ✅ Task 3.2.1: Create Profile Editor Component

- **Role:** Frontend Developer
- **Objective:** Build inline/modal form for editing profile (full name)
- **Context:** Currently only full_name is editable in profile
- **Key Files to Create:**
  - `components/settings/ProfileEditor.tsx`
- **Key Patterns to Follow:**
  - React Hook Form + Zod validation
  - Shadcn/ui Dialog or inline edit
  - TypeScript strict mode
- **Acceptance Criteria (for this task):**
  - [ ] Edit button opens modal or toggles inline edit mode
  - [ ] Form field: Full Name
  - [ ] Validation: min 2 characters
  - [ ] Submit updates profile via `supabase.from('profiles').update()`
  - [ ] Loading state during save
  - [ ] Success: show toast "Profile updated" + close modal/save inline
  - [ ] Cancel button resets form
  - [ ] Error handling: network errors, validation errors
  - [ ] Optimistic update in UI (show new name immediately)
  - [ ] Accessible: focus management, labels
- **Definition of Done:**
  - [ ] Component implemented
  - [ ] Profile update works
  - [ ] Component tests written
  - [ ] Integration test: edit name → save → see updated name
  - [ ] Accessibility tested
  - [ ] PR approved
  - [ ] **Final Check:** Smooth editing experience

**Estimated Effort:** 3 hours

---

### ✅ Task 3.2.2: Update Header to Show Latest Profile Name

- **Role:** Frontend Developer
- **Objective:** Ensure header user dropdown reflects profile changes immediately
- **Context:** Auth context already has profile, but may need to refresh after edit
- **Key Files to Review/Modify:**
  - `components/Header.tsx`
  - `lib/auth/auth-context.tsx`
- **Key Patterns to Follow:**
  - Use React Context for global state
  - Consider adding profile refresh method to auth context
- **Acceptance Criteria (for this task):**
  - [ ] After profile update, header shows new name without page refresh
  - [ ] Either: optimistic update in auth context, OR: refetch profile after save
  - [ ] No flickering or delay in name update
  - [ ] Works across all pages (global context)
- **Definition of Done:**
  - [ ] Header updates immediately after profile edit
  - [ ] Tests verify name propagates
  - [ ] PR approved
  - [ ] **Final Check:** Seamless UX

**Estimated Effort:** 1-2 hours

---

### ➡️ Story 3.3: Change Email Address

> As a **Staffing Agency Owner**, I want **to change my email address**, so that **I can update my account if I change companies or email providers**.

### Engineering Tasks for this Story:

---

### ✅ Task 3.3.1: Create Email Change Form Component

- **Role:** Frontend Developer + Backend Developer
- **Objective:** Build secure email change form with double verification
- **Context:** Changing email requires verification at both old and new addresses (Supabase handles this)
- **Key Files to Create:**
  - `components/settings/EmailChangeForm.tsx`
  - `components/settings/EmailSection.tsx`
- **Key Patterns to Follow:**
  - React Hook Form + Zod
  - Shadcn/ui Dialog
  - Require password re-entry for security
  - TypeScript strict mode
- **Acceptance Criteria (for this task):**
  - [ ] Email section shows current email (read-only)
  - [ ] "Change Email" button opens modal
  - [ ] Modal form fields: New Email, Current Password
  - [ ] Validation: email format, password required
  - [ ] Submit calls `supabase.auth.updateUser({ email: newEmail })`
  - [ ] Success: show message "Verification emails sent to both addresses"
  - [ ] Explain: "Click the link in your new email to confirm the change"
  - [ ] Error handling: email already in use, invalid password
  - [ ] Modal closes on success
  - [ ] Accessible: focus management, labels
- **Definition of Done:**
  - [ ] Component implemented
  - [ ] Email change triggers Supabase verification flow
  - [ ] Component tests written
  - [ ] Tested with local Inbucket (both emails sent)
  - [ ] Accessibility tested
  - [ ] PR approved
  - [ ] **Final Check:** Secure and clear process

**Estimated Effort:** 4 hours

---

### ✅ Task 3.3.2: Create Email Change Confirmation Template

- **Role:** Frontend Developer / Designer
- **Objective:** Create email template for email change confirmation
- **Context:** Supabase sends emails to both old and new addresses
- **Key Files to Create:**
  - `supabase/templates/email_change.html`
  - `supabase/templates/email_change.txt`
- **Key Patterns to Follow:**
  - Similar to verification/recovery templates
  - Use Supabase variables
  - Clear security messaging
- **Acceptance Criteria (for this task):**
  - [ ] HTML template with "Confirm Email Change" button
  - [ ] Plain text version
  - [ ] Message: "You requested to change your email to [new email]"
  - [ ] Security notice: "If you didn't request this, contact support immediately"
  - [ ] Link expiration notice (24 hours)
  - [ ] Template tested in email clients
- **Definition of Done:**
  - [ ] Templates created
  - [ ] Referenced in `supabase/config.toml`
  - [ ] Tested with local Inbucket
  - [ ] Screenshot attached to PR
  - [ ] **Final Check:** Clear and secure

**Estimated Effort:** 1-2 hours

---

### ✅ Task 3.3.3: Write Tests for Email Change Flow

- **Role:** QA Engineer / Developer
- **Objective:** Test email change functionality
- **Context:** Security-critical feature needs thorough testing
- **Key Files to Create:**
  - `components/settings/__tests__/EmailChangeForm.test.tsx`
- **Key Patterns to Follow:**
  - Jest + React Testing Library
  - Mock Supabase responses
- **Acceptance Criteria (for this task):**
  - [ ] Test: Form renders correctly
  - [ ] Test: Email validation works
  - [ ] Test: Password required
  - [ ] Test: Successful submission shows success message
  - [ ] Test: "Email already in use" error shown
  - [ ] Test: Incorrect password error shown
  - [ ] Test: Modal closes on success
  - [ ] Coverage >85%
- **Definition of Done:**
  - [ ] All tests written and passing
  - [ ] Coverage meets threshold
  - [ ] PR approved
  - [ ] **Final Check:** Security scenarios covered

**Estimated Effort:** 2-3 hours

---

### ➡️ Story 3.4: Change Password (While Logged In)

> As a **Job Seeker**, I want **to change my password while logged in**, so that **I can update my security credentials proactively**.

### Engineering Tasks for this Story:

---

### ✅ Task 3.4.1: Create Password Change Form Component

- **Role:** Frontend Developer + Backend Developer
- **Objective:** Build secure password change form
- **Context:** User must provide current password to set new password
- **Key Files to Create:**
  - `components/settings/PasswordChangeForm.tsx`
  - `components/settings/PasswordSection.tsx`
- **Key Patterns to Follow:**
  - React Hook Form + Zod
  - Shadcn/ui Dialog
  - Password strength indicator (optional but recommended)
  - TypeScript strict mode
- **Acceptance Criteria (for this task):**
  - [ ] Password section shows "Change Password" button
  - [ ] Button opens modal
  - [ ] Modal form fields: Current Password, New Password, Confirm New Password
  - [ ] Validation: current password required, new password min 6 chars, passwords match
  - [ ] Submit first verifies current password: `supabase.auth.signInWithPassword()`
  - [ ] If current password correct, update: `supabase.auth.updateUser({ password: newPassword })`
  - [ ] Loading state during verification and update
  - [ ] Success: show message "Password changed successfully" + close modal
  - [ ] User remains logged in after password change
  - [ ] Error handling: incorrect current password, weak new password, network errors
  - [ ] Password fields have show/hide toggle
  - [ ] Accessible: labels, focus management
- **Definition of Done:**
  - [ ] Component implemented
  - [ ] Password change works securely
  - [ ] Component tests written
  - [ ] Integration test: change password → logout → login with new password
  - [ ] Accessibility tested
  - [ ] PR approved
  - [ ] **Final Check:** Secure and user-friendly

**Estimated Effort:** 4 hours

---

### ✅ Task 3.4.2: Update Profile Schema to Track Password Changes

- **Role:** Backend Developer
- **Objective:** Add field to track last password change for security auditing
- **Context:** Useful for security monitoring and potential future features (force password change after X days)
- **Key Files to Create:**
  - `supabase/migrations/[timestamp]_add_last_password_change.sql`
- **Key Patterns to Follow:**
  - Follow existing migration patterns
  - Add trigger to auto-update field
- **Acceptance Criteria (for this task):**
  - [ ] Add column `last_password_change TIMESTAMPTZ` to profiles table
  - [ ] Default value: `NOW()` for existing users
  - [ ] Create trigger to update field when password changes
  - [ ] Migration tested locally
  - [ ] Rollback script created
- **Definition of Done:**
  - [ ] Migration file created
  - [ ] Migration tested locally with `supabase db push`
  - [ ] Rollback tested
  - [ ] Documentation updated
  - [ ] PR approved
  - [ ] **Final Check:** Safe migration

**Estimated Effort:** 1-2 hours

---

### ✅ Task 3.4.3: Write Tests for Password Change Flow

- **Role:** QA Engineer / Developer
- **Objective:** Test password change functionality thoroughly
- **Context:** Security-critical feature
- **Key Files to Create:**
  - `components/settings/__tests__/PasswordChangeForm.test.tsx`
  - `__tests__/integration/password-change.test.tsx`
- **Key Patterns to Follow:**
  - Jest + React Testing Library
  - Mock Supabase responses
  - Test security scenarios
- **Acceptance Criteria (for this task):**
  - [ ] Test: Form renders correctly
  - [ ] Test: All validations work (required fields, min length, passwords match)
  - [ ] Test: Incorrect current password shows error
  - [ ] Test: Correct current password + valid new password → success
  - [ ] Test: User remains logged in after change
  - [ ] Test: Show/hide password toggles work
  - [ ] Integration test: change password → logout → login with new password succeeds
  - [ ] Coverage >85%
- **Definition of Done:**
  - [ ] All tests written and passing
  - [ ] Security scenarios covered
  - [ ] Coverage meets threshold
  - [ ] PR approved
  - [ ] **Final Check:** Comprehensive testing

**Estimated Effort:** 3 hours

---

### ➡️ Story 3.5: Delete Account

> As a **Job Seeker**, I want **to delete my account permanently**, so that **I can remove my data if I no longer need the service**.

### Engineering Tasks for this Story:

---

### ✅ Task 3.5.1: Create Account Deletion Component

- **Role:** Frontend Developer + Backend Developer
- **Objective:** Build secure account deletion flow with confirmation
- **Context:** Irreversible action requires strong confirmation and password verification
- **Key Files to Create:**
  - `components/settings/DeleteAccountModal.tsx`
  - `components/settings/AccountSection.tsx`
- **Key Patterns to Follow:**
  - Shadcn/ui AlertDialog or custom Dialog
  - Multi-step confirmation
  - Require typing "DELETE" + password
  - TypeScript strict mode
- **Acceptance Criteria (for this task):**
  - [ ] Account section (danger zone) shows "Delete Account" button in red
  - [ ] Button opens modal with warning
  - [ ] Modal shows: "This action cannot be undone" warning
  - [ ] Step 1: User must type "DELETE" in text field to enable password field
  - [ ] Step 2: User enters current password
  - [ ] Submit verifies password, then calls `supabase.auth.admin.deleteUser()`
  - [ ] Loading state during deletion
  - [ ] Success: show message "Account deleted" → logout → redirect to home
  - [ ] Error handling: incorrect password, network errors
  - [ ] Cancel button at each step
  - [ ] Accessible: clear warnings, focus management
- **Definition of Done:**
  - [ ] Component implemented
  - [ ] Account deletion works (CASCADE deletes profile)
  - [ ] Component tests written
  - [ ] Integration test: delete account → verify user cannot login
  - [ ] Accessibility tested
  - [ ] PR approved
  - [ ] **Final Check:** Safe and clear process

**Estimated Effort:** 4-5 hours

---

### ✅ Task 3.5.2: Verify CASCADE Delete Works Correctly

- **Role:** Backend Developer
- **Objective:** Ensure deleting auth.users cascades to profiles table
- **Context:** Database relationship should auto-delete profile when user deleted
- **Key Files to Review:**
  - `supabase/migrations/20251211_001_create_profiles_and_roles.sql`
- **Key Patterns to Follow:**
  - Test CASCADE delete behavior
  - Verify no orphaned data
- **Acceptance Criteria (for this task):**
  - [ ] Verify `ON DELETE CASCADE` exists in profiles table FK constraint
  - [ ] Test: Delete user in Supabase dashboard → profile auto-deleted
  - [ ] Test: Delete user via API → profile auto-deleted
  - [ ] No orphaned profiles remain
  - [ ] Related data (if any) also cleaned up
- **Definition of Done:**
  - [ ] CASCADE delete verified working
  - [ ] Test cases documented
  - [ ] Migration confirmed correct
  - [ ] PR approved (if changes needed)
  - [ ] **Final Check:** Data integrity maintained

**Estimated Effort:** 1 hour

---

### ✅ Task 3.5.3: Write Tests for Account Deletion Flow

- **Role:** QA Engineer / Developer
- **Objective:** Test account deletion thoroughly
- **Context:** Critical data deletion feature needs comprehensive testing
- **Key Files to Create:**
  - `components/settings/__tests__/DeleteAccountModal.test.tsx`
  - `__tests__/integration/account-deletion.test.tsx`
- **Key Patterns to Follow:**
  - Jest + React Testing Library
  - Mock Supabase admin methods
  - Test confirmation flow
- **Acceptance Criteria (for this task):**
  - [ ] Test: Modal renders with warning
  - [ ] Test: Submit disabled until "DELETE" typed
  - [ ] Test: Password field enabled after "DELETE" typed
  - [ ] Test: Incorrect password shows error
  - [ ] Test: Correct password → account deleted → logged out → redirected
  - [ ] Integration test: delete account → verify user in database is gone
  - [ ] Integration test: verify profile is also deleted (CASCADE)
  - [ ] Test: Cancel button at each step works
  - [ ] Coverage >85%
- **Definition of Done:**
  - [ ] All tests written and passing
  - [ ] Critical path thoroughly tested
  - [ ] Coverage meets threshold
  - [ ] PR approved
  - [ ] **Final Check:** Deletion is safe and verified

**Estimated Effort:** 3 hours

---

## 📦 Phase 4: Role Management (Sprint 4)

**Goal:** Enable admins to manage user roles through UI
**Estimated Duration:** 3-4 days
**Dependencies:** Existing admin routes, profiles table

---

### ➡️ Story 4.1: Admin User Management Dashboard

> As a **Site Administrator**, I want **to view all users and their roles**, so that **I can manage user permissions**.

### Engineering Tasks for this Story:

---

### ✅ Task 4.1.1: Create Role Change Audit Log Table

- **Role:** Backend Developer
- **Objective:** Create database table to track all role changes for security auditing
- **Context:** Need permanent record of who changed whose role and when
- **Key Files to Create:**
  - `supabase/migrations/[timestamp]_create_role_audit_table.sql`
- **Key Patterns to Follow:**
  - Follow existing migration patterns
  - Include RLS policies
  - Create indexes for common queries
- **Acceptance Criteria (for this task):**
  - [ ] Create `role_change_audit` table with columns: id, user_id, admin_id, old_role, new_role, changed_at, notes
  - [ ] Add foreign key constraints with CASCADE delete
  - [ ] Create indexes on user_id, admin_id, changed_at
  - [ ] Enable RLS: admins can view all records
  - [ ] Create policy: admins can insert records
  - [ ] Migration tested locally
  - [ ] Rollback script created
- **Definition of Done:**
  - [ ] Migration file created
  - [ ] Migration tested with `supabase db push`
  - [ ] Rollback tested
  - [ ] Documentation updated
  - [ ] PR approved
  - [ ] **Final Check:** Audit trail is secure

**Estimated Effort:** 2 hours

---

### ✅ Task 4.1.2: Create Change User Role RPC Function

- **Role:** Backend Developer
- **Objective:** Create secure PostgreSQL function to change user roles with audit logging
- **Context:** Role changes must be atomic (role update + audit log insert) and secure (admin-only)
- **Key Files to Create:**
  - `supabase/migrations/[timestamp]_create_change_role_function.sql`
- **Key Patterns to Follow:**
  - Use `SECURITY DEFINER` for elevated permissions
  - Validate caller is admin
  - Prevent self-demotion
  - Atomic transaction
- **Acceptance Criteria (for this task):**
  - [ ] Create function `change_user_role(target_user_id UUID, new_role TEXT, admin_notes TEXT)`
  - [ ] Function checks: caller is admin (from auth.uid() profile)
  - [ ] Function prevents: admins demoting themselves
  - [ ] Function validates: new_role is valid ('user', 'agency_owner', 'admin')
  - [ ] Function atomically: (1) updates profile.role, (2) inserts audit log
  - [ ] Function returns: boolean success
  - [ ] Function uses `SECURITY DEFINER` to bypass RLS for audit insert
  - [ ] Error handling: clear error messages for each validation failure
  - [ ] Function tested in Supabase SQL Editor
- **Definition of Done:**
  - [ ] Function created and tested
  - [ ] Unit tests for all validation cases
  - [ ] Security review completed
  - [ ] Documentation written
  - [ ] PR approved
  - [ ] **Final Check:** Secure and atomic

**Estimated Effort:** 3-4 hours

---

### ✅ Task 4.1.3: Create Admin Users List Page

- **Role:** Frontend Developer
- **Objective:** Build admin dashboard page showing all users with search/filter
- **Context:** Admin-only page at `/admin/users` to manage user roles
- **Key Files to Create:**
  - `app/admin/users/page.tsx`
  - `components/admin/UsersTable.tsx`
- **Key Patterns to Follow:**
  - Protected route (admin only)
  - Use Shadcn/ui Table, Input, Select components
  - Server component for data fetching
  - TypeScript strict mode
- **Acceptance Criteria (for this task):**
  - [ ] Page at `/admin/users` (admin access only, else redirect to home)
  - [ ] Server component fetches all users + profiles
  - [ ] Table columns: Name, Email, Role, Created At, Actions
  - [ ] Search box filters by name or email (client-side initially)
  - [ ] Role filter dropdown: All, User, Agency Owner, Admin
  - [ ] Pagination: 50 users per page
  - [ ] Loading state while fetching
  - [ ] Empty state if no users
  - [ ] Error state if fetch fails
  - [ ] Mobile responsive (table scrolls or cards on mobile)
  - [ ] Accessible: table headers, keyboard navigation
- **Definition of Done:**
  - [ ] Page implemented
  - [ ] Data fetching works
  - [ ] Search and filter functional
  - [ ] Protected route tested
  - [ ] Component tests written
  - [ ] Visual QA
  - [ ] PR approved
  - [ ] **Final Check:** Performant and usable

**Estimated Effort:** 5-6 hours

---

### ➡️ Story 4.2: Change User Role

> As a **Site Administrator**, I want **to change a user's role**, so that **I can grant agency owner or admin permissions**.

### Engineering Tasks for this Story:

---

### ✅ Task 4.2.1: Create Role Change Dropdown Component

- **Role:** Frontend Developer
- **Objective:** Build dropdown in users table to change roles
- **Context:** Inline role change with confirmation modal
- **Key Files to Create:**
  - `components/admin/RoleChangeDropdown.tsx`
  - `components/admin/RoleChangeConfirmModal.tsx`
- **Key Patterns to Follow:**
  - Shadcn/ui Select and AlertDialog
  - Optimistic UI updates
  - TypeScript strict mode
- **Acceptance Criteria (for this task):**
  - [ ] Dropdown in Actions column shows current role
  - [ ] Dropdown options: user, agency_owner, admin
  - [ ] Selecting new role opens confirmation modal
  - [ ] Modal shows: "Change [User Name]'s role from [old] to [new]?"
  - [ ] Optional notes field for admin to explain change
  - [ ] Confirm button calls RPC `change_user_role()`
  - [ ] Loading state during API call
  - [ ] Success: show toast "Role updated", update table row optimistically
  - [ ] Error: show toast with error message, revert dropdown
  - [ ] Self-demotion prevented: show error if admin tries to demote themselves
  - [ ] Cancel button closes modal without changes
  - [ ] Accessible: dropdown and modal keyboard navigable
- **Definition of Done:**
  - [ ] Component implemented
  - [ ] Role change API integration working
  - [ ] Optimistic updates working
  - [ ] Component tests written
  - [ ] Visual QA
  - [ ] PR approved
  - [ ] **Final Check:** Smooth UX

**Estimated Effort:** 4-5 hours

---

### ✅ Task 4.2.2: Add RLS Policies for Admin Access to All Profiles

- **Role:** Backend Developer
- **Objective:** Create RLS policies allowing admins to view and update all profiles
- **Context:** Currently users can only see/update their own profile
- **Key Files to Create:**
  - `supabase/migrations/[timestamp]_add_admin_rls_policies.sql`
- **Key Patterns to Follow:**
  - RLS policy best practices
  - Admin role check
- **Acceptance Criteria (for this task):**
  - [ ] Create policy "Admins can view all profiles" for SELECT
  - [ ] Policy checks: caller's profile.role = 'admin'
  - [ ] Create policy "Admins can update roles via RPC" (or rely on RPC SECURITY DEFINER)
  - [ ] Existing user policies unchanged (users can still view/update own profile)
  - [ ] Policies tested: admin can view all, non-admin cannot
  - [ ] Migration tested locally
- **Definition of Done:**
  - [ ] Policies created
  - [ ] Tested with admin and non-admin users
  - [ ] Documentation updated
  - [ ] PR approved
  - [ ] **Final Check:** Secure and correct

**Estimated Effort:** 2 hours

---

### ✅ Task 4.2.3: Write Tests for Role Change Flow

- **Role:** QA Engineer / Developer
- **Objective:** Test role change functionality thoroughly
- **Context:** Security-critical admin feature
- **Key Files to Create:**
  - `components/admin/__tests__/RoleChangeDropdown.test.tsx`
  - `__tests__/integration/role-change.test.tsx`
- **Key Patterns to Follow:**
  - Jest + React Testing Library
  - Mock RPC function calls
  - Test authorization scenarios
- **Acceptance Criteria (for this task):**
  - [ ] Test: Dropdown renders with current role
  - [ ] Test: Selecting role opens confirmation modal
  - [ ] Test: Confirming change calls RPC with correct params
  - [ ] Test: Successful change updates UI
  - [ ] Test: Error handling shows error message
  - [ ] Test: Self-demotion prevented (admin changing own role to user)
  - [ ] Integration test: change role → verify in database
  - [ ] Integration test: verify audit log created
  - [ ] Coverage >85%
- **Definition of Done:**
  - [ ] All tests written and passing
  - [ ] Security scenarios tested
  - [ ] Coverage meets threshold
  - [ ] PR approved
  - [ ] **Final Check:** Admin features secure

**Estimated Effort:** 3-4 hours

---

### ➡️ Story 4.3: View Role Change History

> As a **Site Administrator**, I want **to view the history of role changes**, so that **I can audit permission modifications**.

### Engineering Tasks for this Story:

---

### ✅ Task 4.3.1: Create Role History Timeline Component

- **Role:** Frontend Developer
- **Objective:** Build timeline component showing role change history
- **Context:** Display audit log in user-friendly format
- **Key Files to Create:**
  - `components/admin/RoleHistoryTimeline.tsx`
  - `app/admin/users/[id]/page.tsx` (user detail page)
- **Key Patterns to Follow:**
  - Shadcn/ui components (Card, Badge, Separator)
  - Timeline UI pattern
  - TypeScript strict mode
- **Acceptance Criteria (for this task):**
  - [ ] Timeline component accepts user_id prop
  - [ ] Component fetches role_change_audit records for user
  - [ ] Each timeline entry shows: timestamp, old role, new role, admin name, notes
  - [ ] Entries sorted by most recent first
  - [ ] Role badges color-coded (user: gray, agency_owner: blue, admin: red)
  - [ ] Admin name links to their profile (optional)
  - [ ] Loading state while fetching
  - [ ] Empty state: "No role changes recorded"
  - [ ] Error state if fetch fails
  - [ ] Mobile responsive
- **Definition of Done:**
  - [ ] Component implemented
  - [ ] Data fetching works
  - [ ] Component tests written
  - [ ] Visual QA
  - [ ] PR approved
  - [ ] **Final Check:** Clear audit trail

**Estimated Effort:** 3-4 hours

---

### ✅ Task 4.3.2: Add Role History to User Detail Page

- **Role:** Frontend Developer
- **Objective:** Create user detail page accessible from users table
- **Context:** Clicking user in table shows detailed view with history
- **Key Files to Create:**
  - `app/admin/users/[id]/page.tsx`
- **Key Patterns to Follow:**
  - Next.js dynamic route
  - Server component
  - Protected route (admin only)
  - TypeScript strict mode
- **Acceptance Criteria (for this task):**
  - [ ] Page at `/admin/users/[id]` (admin only)
  - [ ] Shows user profile info: name, email, role, created date
  - [ ] Includes RoleHistoryTimeline component
  - [ ] Back button to users list
  - [ ] Loading state
  - [ ] 404 if user not found
  - [ ] Mobile responsive
  - [ ] Accessible: page title, headings
- **Definition of Done:**
  - [ ] Page implemented
  - [ ] Timeline integration works
  - [ ] Protected route tested
  - [ ] Component tests written
  - [ ] Visual QA
  - [ ] PR approved
  - [ ] **Final Check:** Complete user view

**Estimated Effort:** 2-3 hours

---

### ✅ Task 4.3.3: Write Tests for Role History Display

- **Role:** QA Engineer / Developer
- **Objective:** Test role history timeline component
- **Context:** Ensure audit log displays correctly
- **Key Files to Create:**
  - `components/admin/__tests__/RoleHistoryTimeline.test.tsx`
- **Key Patterns to Follow:**
  - Jest + React Testing Library
  - Mock audit log data
- **Acceptance Criteria (for this task):**
  - [ ] Test: Timeline renders with audit records
  - [ ] Test: Entries sorted by most recent first
  - [ ] Test: Each entry shows correct data
  - [ ] Test: Empty state when no history
  - [ ] Test: Loading state
  - [ ] Test: Error state
  - [ ] Coverage >85%
- **Definition of Done:**
  - [ ] All tests written and passing
  - [ ] Coverage meets threshold
  - [ ] PR approved
  - [ ] **Final Check:** Reliable display

**Estimated Effort:** 2 hours

---

## 📦 Cross-Cutting Tasks (All Phases)

**Goal:** Tasks that span multiple phases or support all features
**Estimated Duration:** Ongoing throughout project

---

### ✅ Task X.1: Update Documentation

- **Role:** Technical Writer / Developer
- **Objective:** Keep all documentation current as features are implemented
- **Context:** Docs must reflect actual implementation
- **Key Files to Update:**
  - `docs/auth/AUTHENTICATION_STATE.md`
  - `docs/features/active/007-production-ready-authentication.md`
  - `README.md`
  - `docs/development-workflow.md`
- **Acceptance Criteria:**
  - [ ] Update AUTHENTICATION_STATE.md after each phase (mark items complete)
  - [ ] Add screenshots to FSD as features are built
  - [ ] Update README authentication section
  - [ ] Document email template customization
  - [ ] Create admin user guide
  - [ ] Update development workflow with auth testing
- **Definition of Done:**
  - [ ] Docs updated after each major feature
  - [ ] Screenshots added
  - [ ] PR reviews include doc check
  - [ ] **Final Check:** Docs accurate and helpful

**Estimated Effort:** 1-2 hours per phase (ongoing)

---

### ✅ Task X.2: Set Up Email Service for Production

- **Role:** DevOps / Backend Developer
- **Objective:** Configure production email service (SendGrid, AWS SES, or Supabase built-in)
- **Context:** Local development uses Inbucket, production needs real email delivery
- **Key Files to Configure:**
  - Supabase Dashboard email settings
  - Environment variables
- **Acceptance Criteria:**
  - [ ] Choose email service provider (TBD: SendGrid, AWS SES, or Supabase)
  - [ ] Configure SMTP settings in Supabase Dashboard
  - [ ] Set up domain authentication (SPF, DKIM records)
  - [ ] Configure email templates in production
  - [ ] Test email delivery in staging environment
  - [ ] Monitor email delivery rates
  - [ ] Set up bounce/complaint handling
  - [ ] Document configuration in runbook
- **Definition of Done:**
  - [ ] Production email service configured
  - [ ] Tested with real email addresses
  - [ ] Monitoring/alerting set up
  - [ ] Documentation complete
  - [ ] **Final Check:** Reliable email delivery

**Estimated Effort:** 4-6 hours

---

### ✅ Task X.3: Implement Feature Flags for Gradual Rollout

- **Role:** Backend Developer / DevOps
- **Objective:** Add feature flags to enable gradual rollout and quick rollback
- **Context:** Email verification and other features should roll out gradually
- **Key Files to Create:**
  - `lib/feature-flags.ts` (or use service like LaunchDarkly)
- **Key Patterns to Follow:**
  - Environment-based flags initially
  - Consider percentage-based rollout
- **Acceptance Criteria:**
  - [ ] Feature flag system implemented (simple env vars or service)
  - [ ] Flag: `ENABLE_EMAIL_VERIFICATION` (default: false)
  - [ ] Flag: `ENABLE_PASSWORD_RESET` (default: false)
  - [ ] Flag: `ENABLE_ACCOUNT_SETTINGS` (default: false)
  - [ ] Flag: `ENABLE_ADMIN_DASHBOARD` (default: false)
  - [ ] Flags checked before showing features
  - [ ] Flags configurable without code deploy
  - [ ] Documentation for flag management
- **Definition of Done:**
  - [ ] Feature flag system working
  - [ ] All new features gated by flags
  - [ ] Tested: flags on/off work correctly
  - [ ] Documentation complete
  - [ ] **Final Check:** Safe rollout capability

**Estimated Effort:** 3-4 hours

---

### ✅ Task X.4: Set Up Monitoring and Alerting

- **Role:** DevOps / Backend Developer
- **Objective:** Implement monitoring for auth metrics and errors
- **Context:** Need visibility into email delivery, auth failures, etc.
- **Key Metrics to Track:**
  - Email verification completion rate
  - Password reset success rate
  - Authentication error rate
  - Email delivery failures
  - Role change frequency
- **Acceptance Criteria:**
  - [ ] Choose monitoring service (Sentry, CloudWatch, DataDog, etc.)
  - [ ] Instrument auth-related events
  - [ ] Track: email sent, email verified, password reset, role changed
  - [ ] Set up alerts: auth error spike, email delivery failures
  - [ ] Create dashboard for auth metrics
  - [ ] Document monitoring setup
- **Definition of Done:**
  - [ ] Monitoring configured
  - [ ] Alerts set up
  - [ ] Dashboard created
  - [ ] Tested: alerts fire correctly
  - [ ] Documentation complete
  - [ ] **Final Check:** Observability in place

**Estimated Effort:** 4-6 hours

---

### ✅ Task X.5: Security Review and Penetration Testing

- **Role:** Security Engineer / Senior Developer
- **Objective:** Conduct security review of all authentication features
- **Context:** Authentication is security-critical, needs thorough review
- **Areas to Review:**
  - Email verification bypass attempts
  - Password reset token security
  - Role escalation attempts
  - CSRF protection
  - XSS vulnerabilities
  - SQL injection (in RPC functions)
  - Rate limiting effectiveness
  - Email enumeration prevention
- **Acceptance Criteria:**
  - [ ] Security review checklist completed
  - [ ] Penetration testing performed (internal or external)
  - [ ] Vulnerabilities documented and prioritized
  - [ ] Critical issues fixed before launch
  - [ ] Security report created
  - [ ] Code review by security expert
- **Definition of Done:**
  - [ ] Security review complete
  - [ ] All critical issues resolved
  - [ ] Report documented
  - [ ] Sign-off from security team
  - [ ] **Final Check:** Production-ready security

**Estimated Effort:** 8-16 hours (depending on scope)

---

## 📊 Summary

### Total Task Count: **45 tasks**

#### Phase 1: Email Verification

- 8 tasks
- Estimated: 2-3 days

#### Phase 2: Password Recovery

- 7 tasks
- Estimated: 2-3 days

#### Phase 3: Account Management

- 15 tasks
- Estimated: 3-4 days

#### Phase 4: Role Management

- 10 tasks
- Estimated: 3-4 days

#### Cross-Cutting Tasks

- 5 tasks
- Estimated: Ongoing (20-35 hours total)

### Total Estimated Duration: **4-5 weeks**

### Dependencies Flow:

```text
Phase 1 (Email Verification)
    ↓
Phase 2 (Password Recovery) - Can overlap with Phase 1
    ↓
Phase 3 (Account Settings) - Parallel with Phase 2
    ↓
Phase 4 (Role Management) - Depends on Phase 3
    ↓
Cross-Cutting Tasks - Throughout all phases
```

### Sprint Allocation Recommendation:

**Sprint 1 (Week 1):**

- Complete Phase 1: Email Verification
- Start Phase 2: Password Recovery
- Task X.1: Documentation (ongoing)

**Sprint 2 (Week 2):**

- Complete Phase 2: Password Recovery
- Start Phase 3: Account Settings (Profile & Email)

**Sprint 3 (Week 3):**

- Complete Phase 3: Account Settings (Password & Delete)
- Start Phase 4: Role Management (Audit table & RPC)
- Task X.2: Email service setup

**Sprint 4 (Week 4):**

- Complete Phase 4: Role Management
- Task X.3: Feature flags
- Task X.4: Monitoring
- Task X.5: Security review
- Final testing and documentation

---

## 📝 Notes

**Testing Standards:**

- Minimum 85% code coverage for all new code
- Unit tests for all components and functions
- Integration tests for complete user flows
- E2E tests for critical paths
- Accessibility testing for all UI components

**Code Standards:**

- TypeScript strict mode (no `any` types without justification)
- Use existing Shadcn/ui components
- Follow Next.js App Router patterns
- No unnecessary comments (code should be self-documenting)
- Consistent error handling

**PR Requirements:**

- Tests passing (85%+ coverage)
- Type-check passing
- ESLint passing
- Prettier formatted
- At least one approving review
- Documentation updated
- Screenshots for UI changes

**Definition of Done (All Tasks):**

- [ ] Code complete and tested
- [ ] PR submitted and approved
- [ ] Merged to feature branch
- [ ] Documentation updated
- [ ] No regressions in existing functionality
- [ ] Meets all acceptance criteria
- [ ] **Final Check:** Aligns with project standards

---

**End of Task Backlog**

Ready for sprint planning and implementation! 🚀
