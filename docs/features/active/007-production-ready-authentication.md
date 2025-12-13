# FSD: Production-Ready Authentication System

- **ID:** 007
- **Status:** Draft
- **Related Epic:** User Authentication & Authorization
- **Author:** System Analysis (Claude Code)
- **Last Updated:** 2025-12-12
- **Designs:** TBD
- **Reference:** `docs/auth/AUTHENTICATION_STATE.md`

## 1. Problem & Goal

### Problem Statement

**Current State:** The authentication system (implemented in PR #28) provides basic signup/login functionality but has critical gaps that prevent production deployment:

1. **Email verification is disabled** - Users can register with any email address without verification, creating security and spam risks
2. **No password recovery** - Users who forget their passwords cannot recover their accounts
3. **No account management** - Users cannot update their profile, change email/password, or manage their account
4. **Manual role assignment** - Admin and agency_owner roles require direct database access to assign

**User Impact:**

- **Job Seekers & Construction Workers** cannot recover forgotten passwords, leading to account abandonment
- **Staffing Agency Owners** cannot verify legitimate business emails, risking spam/fake accounts
- **Site Administrators** lack tools to manage user roles and permissions through the UI
- **All Users** have no self-service options for account management

### Goal & Hypothesis

We believe that by implementing **complete authentication workflows with email verification, password recovery, and account management** for all user personas, we will achieve:

- Verified email addresses for 95%+ of new signups
- <5% account abandonment due to password recovery issues
- Zero manual database interventions for role assignments
- 90%+ user satisfaction with account management capabilities

We will know this is true when we see:

- Email verification completion rate >90% within 24 hours of signup
- Password reset usage >80% success rate
- Account settings page engagement from 60%+ of active users
- Admin role assignment completion time <30 seconds (vs current manual DB updates)

## 2. User Stories & Acceptance Criteria

### Epic Breakdown

This feature encompasses 4 major sub-features:

1. **Email Verification** (Critical - Security)
2. **Password Recovery** (Critical - UX)
3. **Account Management** (High Priority - User Experience)
4. **Role Management** (Medium Priority - Admin Tools)

---

### Sub-Feature 1: Email Verification

#### Story 1.1: Email Confirmation During Signup

> As a **Job Seeker**, I want **to verify my email address during signup**, so that **I can prove I own the email and receive important job notifications**.

**Acceptance Criteria:**

- [ ] **Given** I submit a valid signup form, **When** signup completes, **Then** I see a message "Check your email for a verification link" instead of being logged in immediately
- [ ] **Given** I check my email inbox, **When** I look for the verification email, **Then** I receive an email within 60 seconds with a clear verification link
- [ ] **Given** I click the verification link in my email, **When** the page loads, **Then** I am redirected to a confirmation success page that shows "Email verified! You can now sign in."
- [ ] **Given** I have verified my email, **When** I attempt to login, **Then** I can successfully authenticate
- [ ] **Given** I have not verified my email within 24 hours, **When** I attempt to login, **Then** I see an error "Please verify your email address" with a "Resend verification email" link
- [ ] **Given** my verification link has expired (>24 hours), **When** I click it, **Then** I see a message "This link has expired. Request a new verification email" with a form to resend

#### Story 1.2: Resend Verification Email

> As a **Job Seeker**, I want **to request a new verification email**, so that **I can verify my account if I lost the original email or it expired**.

**Acceptance Criteria:**

- [ ] **Given** I am on the login page with an unverified account, **When** I see the verification error, **Then** I see a "Resend verification email" button
- [ ] **Given** I click "Resend verification email", **When** I enter my email address, **Then** I receive a new verification email within 60 seconds
- [ ] **Given** I request multiple verification emails, **When** I click resend more than twice in 10 minutes, **Then** I see a rate limit message "Please wait before requesting another email"
- [ ] **Given** I already verified my email, **When** I try to resend verification, **Then** I see a message "This email is already verified"

---

### Sub-Feature 2: Password Recovery

#### Story 2.1: Request Password Reset

> As a **Staffing Agency Owner**, I want **to request a password reset link**, so that **I can regain access to my account if I forget my password**.

**Acceptance Criteria:**

- [ ] **Given** I am on the login page, **When** I click "Forgot password?", **Then** I am taken to `/forgot-password` page
- [ ] **Given** I am on the forgot password page, **When** I enter my email address and submit, **Then** I see "If this email exists, you will receive a password reset link"
- [ ] **Given** I submitted a valid email, **When** I check my inbox, **Then** I receive a password reset email within 60 seconds
- [ ] **Given** I submitted an invalid/non-existent email, **When** I check the UI, **Then** I still see the success message (prevent email enumeration)
- [ ] **Given** I request multiple password resets, **When** I submit more than 3 times in 1 hour, **Then** I hit the rate limit and see "Too many reset requests. Please try again later."

#### Story 2.2: Reset Password with Token

> As a **Staffing Agency Owner**, I want **to set a new password using the reset link**, so that **I can securely update my password and access my account**.

**Acceptance Criteria:**

- [ ] **Given** I click the reset link in my email, **When** the page loads, **Then** I am taken to `/reset-password` with a valid token in the URL
- [ ] **Given** I am on the reset password page, **When** I see the form, **Then** it contains fields for "New Password" and "Confirm Password"
- [ ] **Given** I enter a new password (min 6 characters), **When** both passwords match and I submit, **Then** my password is updated and I see "Password updated successfully"
- [ ] **Given** my password was updated, **When** I am redirected, **Then** I am taken to the login page with a success message
- [ ] **Given** my reset token has expired (>1 hour), **When** I load the reset page, **Then** I see "This reset link has expired. Please request a new one."
- [ ] **Given** I enter passwords that don't match, **When** I submit, **Then** I see validation error "Passwords must match"
- [ ] **Given** I enter a weak password (<6 characters), **When** I submit, **Then** I see validation error "Password must be at least 6 characters"

---

### Sub-Feature 3: Account Management

#### Story 3.1: View Account Settings

> As a **Job Seeker**, I want **to view my account profile information**, so that **I can see what information is stored about me**.

**Acceptance Criteria:**

- [ ] **Given** I am logged in, **When** I navigate to `/settings`, **Then** I see my account settings page
- [ ] **Given** I am on the settings page, **When** I view the page, **Then** I see sections for: Profile, Email, Password, and Account Deletion
- [ ] **Given** I view the Profile section, **When** I look at my information, **Then** I see my full name, email, role (read-only), and account creation date
- [ ] **Given** I am not logged in, **When** I try to access `/settings`, **Then** I am redirected to `/login?redirectTo=/settings`

#### Story 3.2: Update Profile Information

> As a **Job Seeker**, I want **to update my profile information**, so that **my account details are current**.

**Acceptance Criteria:**

- [ ] **Given** I am on the settings page, **When** I click "Edit Profile", **Then** I see an editable form with my full name
- [ ] **Given** I update my full name, **When** I save the changes, **Then** I see a success message "Profile updated successfully"
- [ ] **Given** I updated my full name, **When** I refresh the page, **Then** the new name persists
- [ ] **Given** I updated my full name, **When** I view the header, **Then** the user dropdown shows my new name
- [ ] **Given** I enter an invalid name (e.g., empty, too short), **When** I try to save, **Then** I see validation errors

#### Story 3.3: Change Email Address

> As a **Staffing Agency Owner**, I want **to change my email address**, so that **I can update my account if I change companies or email providers**.

**Acceptance Criteria:**

- [ ] **Given** I am on the settings page, **When** I navigate to the Email section, **Then** I see my current email and a "Change Email" button
- [ ] **Given** I click "Change Email", **When** the form appears, **Then** I must enter my current password and new email
- [ ] **Given** I submit a new email, **When** the request processes, **Then** I receive verification emails at BOTH old and new addresses
- [ ] **Given** I verify the email change from the new address, **When** verification completes, **Then** my email is updated and I remain logged in
- [ ] **Given** I am changing my email, **When** I enter an email already in use, **Then** I see error "This email is already registered"
- [ ] **Given** I change my email, **When** I forget to verify within 24 hours, **Then** the change request expires and my old email remains

#### Story 3.4: Change Password (While Logged In)

> As a **Job Seeker**, I want **to change my password while logged in**, so that **I can update my security credentials proactively**.

**Acceptance Criteria:**

- [ ] **Given** I am on the settings page, **When** I navigate to the Password section, **Then** I see a "Change Password" button
- [ ] **Given** I click "Change Password", **When** the form appears, **Then** I must enter: Current Password, New Password, Confirm New Password
- [ ] **Given** I enter my current password correctly and new matching passwords, **When** I submit, **Then** my password is updated and I see "Password changed successfully"
- [ ] **Given** I changed my password, **When** update completes, **Then** I remain logged in with the new password
- [ ] **Given** I enter incorrect current password, **When** I submit, **Then** I see error "Current password is incorrect"
- [ ] **Given** I enter mismatched new passwords, **When** I submit, **Then** I see error "New passwords must match"
- [ ] **Given** I enter a weak new password, **When** I submit, **Then** I see error "Password must be at least 6 characters"

#### Story 3.5: Delete Account

> As a **Job Seeker**, I want **to delete my account permanently**, so that **I can remove my data if I no longer need the service**.

**Acceptance Criteria:**

- [ ] **Given** I am on the settings page, **When** I navigate to the Account section, **Then** I see a "Delete Account" button in the danger zone
- [ ] **Given** I click "Delete Account", **When** the confirmation modal appears, **Then** I see a warning "This action cannot be undone" and must type "DELETE" to confirm
- [ ] **Given** I type "DELETE" and confirm, **When** I submit, **Then** I must enter my password to authenticate the deletion
- [ ] **Given** I enter my correct password, **When** deletion completes, **Then** my account and profile are permanently deleted (CASCADE from auth.users)
- [ ] **Given** my account was deleted, **When** deletion completes, **Then** I am logged out and redirected to the home page
- [ ] **Given** my account was deleted, **When** I try to login again, **Then** I see error "Invalid credentials"

---

### Sub-Feature 4: Role Management (Admin Features)

#### Story 4.1: Admin User Management Dashboard

> As a **Site Administrator**, I want **to view all users and their roles**, so that **I can manage user permissions**.

**Acceptance Criteria:**

- [ ] **Given** I am logged in as an admin, **When** I navigate to `/admin/users`, **Then** I see a list of all users with columns: Name, Email, Role, Created At, Actions
- [ ] **Given** I am on the users page, **When** I view the list, **Then** users are paginated (50 per page) with search and filter options
- [ ] **Given** I want to find a user, **When** I use the search box, **Then** I can search by name or email
- [ ] **Given** I want to filter users, **When** I use the role filter dropdown, **Then** I can filter by: All, User, Agency Owner, Admin
- [ ] **Given** I am not an admin, **When** I try to access `/admin/users`, **Then** I am redirected to the home page

#### Story 4.2: Change User Role

> As a **Site Administrator**, I want **to change a user's role**, so that **I can grant agency owner or admin permissions**.

**Acceptance Criteria:**

- [ ] **Given** I am viewing a user in the admin dashboard, **When** I click "Change Role", **Then** I see a dropdown with options: user, agency_owner, admin
- [ ] **Given** I select a new role, **When** I confirm the change, **Then** I see a confirmation modal "Change [User Name]'s role from [old] to [new]?"
- [ ] **Given** I confirm the role change, **When** it processes, **Then** the user's role is updated immediately and I see "Role updated successfully"
- [ ] **Given** I changed a user's role, **When** that user refreshes their page, **Then** they see updated navigation/permissions based on their new role
- [ ] **Given** I try to change my own role to 'user', **When** I attempt this, **Then** I see error "You cannot demote your own admin account"
- [ ] **Given** a role change occurs, **When** the operation completes, **Then** an audit log entry is created with: admin_id, user_id, old_role, new_role, timestamp

#### Story 4.3: View Role Change History

> As a **Site Administrator**, I want **to view the history of role changes**, so that **I can audit permission modifications**.

**Acceptance Criteria:**

- [ ] **Given** I am on the user detail page, **When** I click "Role History", **Then** I see a timeline of all role changes for that user
- [ ] **Given** I view the role history, **When** I see each entry, **Then** it shows: timestamp, old role, new role, changed by (admin name)
- [ ] **Given** role history exists, **When** I view it, **Then** entries are sorted by most recent first
- [ ] **Given** no role changes have occurred, **When** I view history, **Then** I see "No role changes recorded"

---

## 3. Technical & Design Requirements

### UX/UI Requirements

#### Email Verification Flow

- **Signup Success Page:** Full-screen confirmation with email icon, message "Check your email", and "Didn't receive it? Resend" link
- **Verification Email Template:**
  - Subject: "Verify your FindConstructionStaffing account"
  - Plain text and HTML versions
  - Clear CTA button "Verify Email"
  - Link expiration notice (24 hours)
  - Support email in footer
- **Verification Success Page:** Celebration message, "Your email is verified!", CTA button "Go to Login"
- **Verification Error Page:** Expired/invalid link message with "Request New Link" form

#### Password Reset Flow

- **Forgot Password Page:** Simple form with email input, submit button, and "Remember your password? Sign in" link
- **Reset Email Template:**
  - Subject: "Reset your FindConstructionStaffing password"
  - Security notice: "If you didn't request this, ignore this email"
  - CTA button "Reset Password"
  - Link expiration notice (1 hour)
- **Reset Password Page:** Form with New Password, Confirm Password fields, password requirements display, submit button
- **Reset Success:** Success message with auto-redirect to login after 3 seconds

#### Account Settings Page

- **Layout:** Sidebar navigation with sections: Profile, Email, Password, Account
- **Profile Section:** Display-only fields (email, role, created date) + editable full name with inline edit
- **Email Section:** Current email display + "Change Email" button that opens modal
- **Password Section:** "Change Password" button that opens secure form modal
- **Account Section:** Danger zone with "Delete Account" button in red

#### Admin Dashboard

- **Users Table:** Responsive table with sortable columns, search bar, role filter dropdown
- **Role Change:** Inline dropdown in Actions column, confirmation modal on change
- **User Detail Modal:** Popup showing full user info, role history timeline, action buttons

### Technical Impact Analysis

#### Data Model Changes

**New Tables:**

```sql
-- Audit log for role changes
CREATE TABLE public.role_change_audit (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  old_role TEXT NOT NULL,
  new_role TEXT NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

CREATE INDEX idx_role_audit_user ON public.role_change_audit(user_id);
CREATE INDEX idx_role_audit_admin ON public.role_change_audit(admin_id);
CREATE INDEX idx_role_audit_timestamp ON public.role_change_audit(changed_at DESC);
```

**Modified Tables:**

```sql
-- Add email_verified_at to profiles (optional - Supabase handles this in auth.users)
-- Add last_password_change to profiles for security tracking
ALTER TABLE public.profiles
ADD COLUMN last_password_change TIMESTAMPTZ DEFAULT NOW();
```

**RLS Policies:**

```sql
-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow admins to update any profile's role (handled via RPC for audit logging)
-- Restrict users from changing their own role
CREATE POLICY "Users cannot change own role"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    role = (SELECT role FROM public.profiles WHERE id = auth.uid())
  );
```

#### API Endpoints & Functions

**Supabase Edge Functions / Database RPC Functions:**

```sql
-- Function to change user role with audit logging
CREATE OR REPLACE FUNCTION public.change_user_role(
  target_user_id UUID,
  new_role TEXT,
  admin_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  old_role TEXT;
  calling_user_role TEXT;
BEGIN
  -- Check if caller is admin
  SELECT role INTO calling_user_role
  FROM public.profiles
  WHERE id = auth.uid();

  IF calling_user_role != 'admin' THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can change roles';
  END IF;

  -- Prevent self-demotion
  IF target_user_id = auth.uid() AND new_role != 'admin' THEN
    RAISE EXCEPTION 'Cannot demote your own admin account';
  END IF;

  -- Get old role
  SELECT role INTO old_role
  FROM public.profiles
  WHERE id = target_user_id;

  -- Update role
  UPDATE public.profiles
  SET role = new_role, updated_at = NOW()
  WHERE id = target_user_id;

  -- Create audit log
  INSERT INTO public.role_change_audit (user_id, admin_id, old_role, new_role, notes)
  VALUES (target_user_id, auth.uid(), old_role, new_role, admin_notes);

  RETURN TRUE;
END;
$$;
```

**Next.js API Routes:**

- `POST /api/auth/resend-verification` - Resend verification email
- `GET /api/auth/verify-email?token=xxx` - Verify email callback (redirects to success page)
- `POST /api/auth/request-password-reset` - Send password reset email
- `POST /api/auth/reset-password` - Update password with reset token
- `GET /api/admin/users` - List all users (admin only)
- `POST /api/admin/users/:id/change-role` - Change user role (admin only)
- `GET /api/admin/users/:id/role-history` - Get role change audit log

#### Supabase Configuration Changes

**File:** `supabase/config.toml`

```toml
[auth.email]
enable_signup = true
enable_confirmations = true              # CHANGE: Enable email verification (Task 1.1.1 ✅ COMPLETE)
double_confirm_changes = true
secure_password_change = false
minimum_password_length = 6
max_frequency = "1s"
```

**Note:** Email templates are configured separately via Supabase Dashboard or template files (Tasks 1.1.2, 2.1.2).

**Email Templates:**

Create template files in `supabase/templates/`:

- `confirmation.html` - Email verification template
- `recovery.html` - Password reset template
- `email_change.html` - Email change confirmation template

Each template should use Supabase variables:

- `{{ .ConfirmationURL }}` or `{{ .Token }}`
- `{{ .SiteURL }}`
- `{{ .Email }}`

#### Frontend Components

**New Components:**

```typescript
// components/auth/VerifyEmailBanner.tsx
// Shows banner prompting unverified users to check email

// components/auth/ResendVerificationButton.tsx
// Button to resend verification email

// components/settings/ProfileEditor.tsx
// Editable profile form (full name)

// components/settings/EmailChangeForm.tsx
// Modal form for changing email

// components/settings/PasswordChangeForm.tsx
// Modal form for changing password

// components/settings/DeleteAccountModal.tsx
// Confirmation modal for account deletion

// components/admin/UsersTable.tsx
// Admin table showing all users

// components/admin/RoleChangeDropdown.tsx
// Dropdown for changing user roles

// components/admin/RoleHistoryTimeline.tsx
// Timeline showing role change history
```

**Modified Components:**

```typescript
// app/signup/page.tsx
// Change success flow to show "Check your email" instead of auto-login

// app/login/page.tsx
// Add "Forgot password?" link
// Show error for unverified emails with resend link

// components/Header.tsx
// Add "Settings" link to user dropdown

// lib/auth/auth-context.tsx
// Add email_verified check
// Add method to trigger resend verification
```

#### New Routes

```
/auth/verify-email           - Email verification callback page
/forgot-password             - Request password reset page
/reset-password              - Reset password with token page
/settings                    - Account settings page
  /settings/profile          - Edit profile (optional sub-route)
  /settings/security         - Change email/password (optional sub-route)
/admin/users                 - Admin user management dashboard
/admin/users/[id]            - User detail page with role history
```

#### Security Considerations

1. **Rate Limiting:**
   - Email verification resend: 2 per 10 minutes per user
   - Password reset requests: 3 per hour per email
   - Role changes: No specific limit (admin only)

2. **Token Expiration:**
   - Email verification links: 24 hours
   - Password reset links: 1 hour
   - Session tokens: 1 hour (already configured)

3. **Validation:**
   - Email format validation (client and server)
   - Password strength (min 6 chars, consider increasing to 8)
   - CSRF protection on all forms
   - Sanitize user inputs (XSS prevention)

4. **Audit Logging:**
   - Log all role changes with admin ID
   - Log email changes (both old and new)
   - Log password resets (timestamp only, not values)
   - Log account deletions (for compliance)

5. **Data Privacy:**
   - Account deletion must CASCADE to all related data
   - Email in audit logs must be handled per GDPR
   - Provide data export option (future)

### Non-Functional Requirements

#### Performance

- Email delivery: <60 seconds for all transactional emails
- Email verification callback: <200ms response time
- Password reset: <300ms response time
- Admin users table: Load 50 users in <500ms
- Settings page: Load in <300ms

#### Accessibility

- All forms must be WCAG 2.2 AA compliant
- Keyboard navigation for all interactive elements
- Screen reader labels for all form fields
- Error messages must be announced to screen readers
- Focus management in modals

#### Testing

- Unit tests for all auth helper functions
- Integration tests for email verification flow
- Integration tests for password reset flow
- E2E tests for complete signup→verify→login flow
- E2E tests for complete forgot→reset→login flow
- Admin role change E2E tests
- Maintain 85%+ code coverage

#### Monitoring & Observability

- Track email delivery success rate
- Monitor verification completion rate
- Track password reset success rate
- Alert on authentication failures spike
- Dashboard for auth metrics

## 4. Scope

### In Scope (MVP)

**Phase 1: Email Verification (Sprint 1)**

- Enable email confirmations in Supabase config
- Create email verification templates
- Implement verification callback route
- Update signup flow to show "check email" message
- Add resend verification button
- Test with local Inbucket

**Phase 2: Password Recovery (Sprint 2)**

- Create forgot password page
- Create reset password page
- Configure password reset email template
- Implement reset callback and token validation
- Add "Forgot password?" link to login page
- Test complete reset flow

**Phase 3: Account Settings (Sprint 3)**

- Create settings page layout
- Implement profile editing (full name)
- Implement email change with double verification
- Implement password change (while logged in)
- Implement account deletion with confirmation
- Add "Settings" link to header dropdown

**Phase 4: Role Management (Sprint 4)**

- Create admin users dashboard
- Implement users table with search/filter
- Implement role change dropdown
- Create audit logging database function
- Implement role history timeline
- Add RLS policies for admin access

### Out of Scope (Future Iterations)

**Not included in this feature:**

- **OAuth/Social Authentication** (Google, GitHub, LinkedIn)
  - Requires separate OAuth provider setup
  - Additional complexity in profile merging
  - Target: Feature #008

- **Two-Factor Authentication (2FA)**
  - Optional security enhancement
  - Requires TOTP implementation
  - Target: Feature #009

- **Magic Link Authentication**
  - Passwordless email-only login
  - Lower priority than password recovery
  - Target: Future

- **Session Management UI**
  - View active sessions
  - Revoke devices
  - Target: Feature #010

- **Advanced Password Policies**
  - Password complexity requirements (uppercase, numbers, symbols)
  - Password history (prevent reuse)
  - Target: Future security enhancement

- **Account Suspension/Ban**
  - Admin ability to suspend accounts
  - Requires appeals process
  - Target: Feature #011

- **Bulk User Management**
  - CSV import/export
  - Bulk role changes
  - Target: Admin tools feature

- **Email Preferences**
  - Opt-in/out of notification emails
  - Marketing email preferences
  - Target: Notifications feature

- **Profile Pictures/Avatars**
  - Upload profile photo
  - Requires file storage setup
  - Target: Profile enhancement feature

- **Multi-tenancy/Organization Support**
  - Agency-level user management
  - Sub-accounts
  - Target: Future business model enhancement

### Open Questions

- [ ] **Email Service Configuration:** What email service provider should we use for production? (Supabase's built-in? SendGrid? AWS SES?)
- [ ] **Email Template Design:** Do we have brand guidelines for email templates? Who will provide HTML/CSS for emails?
- [ ] **Password Policy:** Should we enforce stronger password requirements than 6 characters? (Recommend 8+ chars, mixed case, numbers)
- [ ] **Verification Window:** Is 24 hours appropriate for email verification links, or should we extend/shorten?
- [ ] **Account Deletion:** What is the compliance requirement for data retention? Should we soft-delete with retention period?
- [ ] **Admin Hierarchy:** Can there be multiple admins? Can admins create other admins?
- [ ] **Role Naming:** Are 'user', 'agency_owner', 'admin' the final role names, or should we use different terminology?
- [ ] **Email Change Security:** Should we require password re-entry after email change confirmation?
- [ ] **Monitoring Setup:** What monitoring/alerting system should we integrate with? (Sentry? CloudWatch? DataDog?)
- [ ] **Testing Email Domain:** What test domain should we use for development? (Currently using local Inbucket)
- [ ] **Production Email Volume:** What is the expected email send volume? (Affects email service tier selection)

### Dependencies

**External Dependencies:**

- Supabase Auth service (existing)
- Email service provider (to be determined)
- Next.js 13+ with App Router (existing)
- React Hook Form + Zod (existing)

**Internal Dependencies:**

- Feature #001: Supabase Infrastructure (✅ Complete)
- Feature #010: Phase 1 Authentication (✅ Complete - PR #28)
- Profiles table migration (✅ Complete)
- Auth context implementation (✅ Complete)

**Blocking Issues:**

- None currently identified

### Success Metrics

**Quantitative Metrics:**

- **Email Verification Rate:** >90% of signups verify email within 24 hours
- **Password Reset Success:** >80% of initiated resets complete successfully
- **Authentication Errors:** <5% of login attempts fail due to auth issues
- **Account Settings Engagement:** 60%+ of users visit settings within first 30 days
- **Admin Efficiency:** Role assignments complete in <30 seconds (vs current 5+ minutes manual)
- **Email Delivery Rate:** >98% of auth emails delivered successfully

**Qualitative Metrics:**

- User feedback: "Easy to recover password"
- Support ticket reduction: <10 auth-related tickets per week
- Admin feedback: "Role management is intuitive"
- Zero security incidents related to unverified emails

**Engineering Metrics:**

- 85%+ test coverage maintained
- <200ms p95 response time for auth endpoints
- Zero production incidents during rollout
- All accessibility tests pass (WCAG 2.2 AA)

## 5. Implementation Plan

### Phase 1: Email Verification (Week 1)

**Tasks:**

1. Update `supabase/config.toml` to enable confirmations
2. Create email templates in `supabase/templates/`
3. Create `/app/auth/verify-email/route.ts` callback handler
4. Update `/app/signup/page.tsx` success flow
5. Create `ResendVerificationButton` component
6. Update login error handling for unverified accounts
7. Test with local Inbucket
8. Write integration tests
9. Deploy to staging

**Estimated Effort:** 2-3 days

### Phase 2: Password Recovery (Week 1-2)

**Tasks:**

1. Create `/app/forgot-password/page.tsx`
2. Create `/app/reset-password/page.tsx`
3. Create password reset email template
4. Implement rate limiting for reset requests
5. Add "Forgot password?" link to login
6. Test complete reset flow
7. Write E2E tests
8. Deploy to staging

**Estimated Effort:** 2-3 days

### Phase 3: Account Settings (Week 2-3)

**Tasks:**

1. Create `/app/settings/page.tsx` layout
2. Implement profile editing
3. Implement email change with verification
4. Implement password change
5. Implement account deletion
6. Add settings link to header
7. Write component tests
8. Deploy to staging

**Estimated Effort:** 3-4 days

### Phase 4: Role Management (Week 3-4)

**Tasks:**

1. Create audit log table migration
2. Create `change_user_role` RPC function
3. Create `/app/admin/users/page.tsx`
4. Implement users table with pagination
5. Implement role change dropdown
6. Create role history timeline
7. Add RLS policies for admin
8. Write admin E2E tests
9. Deploy to staging

**Estimated Effort:** 3-4 days

### Testing Strategy

**Unit Tests:**

- Auth helper functions
- Email validation
- Token generation/validation
- Role change logic

**Integration Tests:**

- Email verification flow
- Password reset flow
- Profile update operations
- Role change with audit logging

**E2E Tests:**

- Complete signup→verify→login flow
- Complete forgot→reset→login flow
- Settings page interactions
- Admin role management flow

**Manual QA Checklist:**

- Test all email deliveries
- Verify link expiration handling
- Test error states
- Verify accessibility compliance
- Test on mobile devices
- Test with screen readers

### Deployment Plan

**Staging Deployment:**

1. Deploy Phase 1 to staging
2. Test email verification with real email service
3. Gather internal feedback
4. Deploy Phases 2-4 incrementally
5. Complete regression testing

**Production Deployment:**

1. Enable feature flag for email verification
2. Monitor email delivery rates
3. Roll out to 10% of new signups
4. Monitor metrics for 48 hours
5. Roll out to 50% of new signups
6. Monitor for another 48 hours
7. Roll out to 100%

**Rollback Plan:**

- Feature flag can disable email verification
- Revert to `enable_confirmations = false`
- Password reset can be disabled via feature flag
- Monitor error rates and rollback if >5%

### Documentation Updates

**Files to Create/Update:**

- `docs/auth/AUTHENTICATION_STATE.md` - Update status to "Production Ready"
- `docs/auth/EMAIL_TEMPLATES.md` - Document email template customization
- `docs/auth/ADMIN_GUIDE.md` - Guide for role management
- `docs/development-workflow.md` - Add auth testing section
- `README.md` - Update authentication section

## 6. Risk Assessment

### High Risk

**Risk:** Email delivery failures in production

- **Mitigation:** Test with multiple email providers in staging, set up monitoring alerts
- **Contingency:** Have backup email service configured

**Risk:** Users locked out during email verification rollout

- **Mitigation:** Grandfather existing users (don't require verification), use feature flag for gradual rollout
- **Contingency:** Quick rollback capability

### Medium Risk

**Risk:** Rate limiting too aggressive, blocking legitimate users

- **Mitigation:** Start with conservative limits, monitor support tickets
- **Contingency:** Adjust rate limits via config without code deploy

**Risk:** Admin accidentally demotes all admins

- **Mitigation:** Prevent self-demotion in code, require 2+ admins minimum
- **Contingency:** Manual database restoration procedure

### Low Risk

**Risk:** Email templates look broken in some email clients

- **Mitigation:** Test with Email on Acid or Litmus before launch
- **Contingency:** Provide plain text fallback

**Risk:** Accessibility issues with modals

- **Mitigation:** Use Radix UI components with built-in a11y
- **Contingency:** Manual testing with screen readers before launch

## 7. Alternatives Considered

### Alternative 1: Magic Link Authentication (No Passwords)

**Description:** Use passwordless authentication with email links instead of passwords

**Pros:**

- Simpler UX (no password to remember)
- More secure (no password to steal)
- No password reset needed

**Cons:**

- Requires email access every time
- Slower login flow (wait for email)
- User confusion (less familiar pattern)
- Doesn't eliminate need for email verification

**Decision:** Rejected for MVP. Traditional password auth is more familiar to construction industry users. Consider for future enhancement.

### Alternative 2: SMS Verification Instead of Email

**Description:** Use phone number + SMS for account verification

**Pros:**

- Higher verification completion rate
- Faster (SMS arrives in seconds)
- Phone numbers less likely to be fake

**Cons:**

- SMS costs ($0.01-0.05 per message)
- International SMS complexity
- Privacy concerns (not all users want to share phone)
- Excludes users without phones

**Decision:** Rejected. Email verification is free, international, and aligns with business communication norms. Phone verification could be optional enhancement.

### Alternative 3: No Email Verification (Current State)

**Description:** Keep email verification disabled, trust users

**Pros:**

- Simpler implementation (already done)
- Faster signup flow
- No email deliverability concerns

**Cons:**

- Security risk (spam accounts)
- Invalid email addresses in database
- Cannot send reliable notifications
- Industry compliance issues

**Decision:** Rejected. Email verification is critical for production readiness and required for reliable user communication.

### Alternative 4: OAuth-Only Authentication

**Description:** Remove email/password auth, require Google/Microsoft OAuth

**Pros:**

- More secure (delegated to OAuth provider)
- No password management
- Faster login (if already logged into provider)

**Cons:**

- Requires OAuth provider account
- Privacy concerns (user doesn't trust Google with job search)
- Complexity for non-tech-savvy users
- Vendor lock-in

**Decision:** Rejected for MVP. Email/password is most accessible. OAuth should be added as optional alternative method.

## 8. Appendix

### Related Documents

- `docs/auth/AUTHENTICATION_STATE.md` - Current authentication analysis
- `lib/auth/auth-context.tsx` - Auth context implementation
- `supabase/migrations/20251211_001_create_profiles_and_roles.sql` - Database schema
- PR #28 - Phase 1 authentication implementation

### Glossary

- **RLS:** Row Level Security - Postgres security feature for table-level access control
- **JWT:** JSON Web Token - Token format used for session management
- **2FA:** Two-Factor Authentication - Additional security layer requiring second factor
- **TOTP:** Time-based One-Time Password - Algorithm for 2FA codes
- **OAuth:** Open Authorization - Standard for delegated authentication
- **Supabase SSR:** Server-Side Rendering client for Supabase with cookie management
- **WCAG:** Web Content Accessibility Guidelines - Accessibility standards

### Timeline Summary

```
Week 1:      Email Verification + Password Recovery (Phase 1-2)
Week 2-3:    Account Settings (Phase 3)
Week 3-4:    Role Management (Phase 4)
Week 4:      Testing, Documentation, Deployment

Total: 4 weeks for complete implementation
```

### Stakeholder Sign-Off

- [ ] Product Owner: \***\*\*\*\*\***\_\***\*\*\*\*\*** Date: **\_\_\_**
- [ ] Engineering Lead: **\*\*\*\***\_\_**\*\*\*\*** Date: **\_\_\_**
- [ ] UX/UI Designer: **\*\*\*\***\_\_\_\_**\*\*\*\*** Date: **\_\_\_**
- [ ] QA Lead: \***\*\*\*\*\*\*\***\_\_\_\***\*\*\*\*\*\*\*** Date: **\_\_\_**
- [ ] Security Review: **\*\*\*\***\_\_\_**\*\*\*\*** Date: **\_\_\_**

---

**Status:** Draft - Awaiting Review
**Next Steps:**

1. Review this FSD with stakeholders
2. Answer open questions
3. Create engineering task breakdown
4. Assign to sprint and begin Phase 1 implementation
