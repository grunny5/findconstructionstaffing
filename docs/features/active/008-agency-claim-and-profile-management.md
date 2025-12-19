# FSD: Agency Claim and Profile Management

- **ID:** 008
- **Status:** Draft
- **Related Epic:** Agency Profile Management (Phase 2A)
- **Author:** Product Team
- **Last Updated:** 2025-12-19
- **Designs:** TBD
- **Reference:** `PROJECT_KICKSTART_V2.md` (Epic: Agency Profile Management)

## 1. Problem & Goal

### Problem Statement

**Current State:** FindConstructionStaffing has a directory of 12+ construction staffing agencies with public profile pages, but agencies cannot claim or manage their listings. This creates several critical issues:

1. **No Ownership Verification** - Anyone could claim to represent an agency without verification
2. **Outdated Information** - Agency data remains static; agencies cannot update contact info, services, or specializations
3. **No Value Proposition for Agencies** - Without the ability to manage profiles, agencies have no incentive to engage with the platform
4. **Blocked Revenue Generation** - Cannot monetize premium features (featured listings, compliance badges, etc.) without agency accounts

**User Impact:**

- **Staffing Agency Owners** cannot verify ownership, update their company information, or showcase their capabilities
- **Construction Companies** see potentially outdated agency information, reducing trust in the directory
- **Site Administrators** must manually update agency data via database, which doesn't scale
- **Platform Business** cannot launch paid features or generate revenue without agency engagement

### Goal & Hypothesis

We believe that by implementing **a verified agency claim workflow with comprehensive profile editing capabilities** for **Staffing Agency Owners**, we will achieve:

- 50+ agencies claim their profiles within first 3 months
- 80%+ profile completion rate among claimed agencies
- 90%+ information accuracy (self-managed by agencies)
- Foundation for monetization (premium features, compliance badges)

We will know this is true when we see:

- Agency claim request rate >20% of total agencies
- Claim verification completion time <2 business days
- Profile edit activity from 70%+ of claimed agencies within first 30 days
- Customer satisfaction score >4.0/5.0 for profile management features
- Zero manual database updates needed for agency information

## 2. User Stories & Acceptance Criteria

### Epic Breakdown

This feature encompasses 5 major sub-features:

1. **Agency Claim Request** (Critical - Business Foundation)
2. **Claim Verification & Approval** (Critical - Trust & Security)
3. **Profile Editing Dashboard** (High Priority - Core Value)
4. **Trade & Region Management** (High Priority - Search Accuracy)
5. **Profile Completion Tracking** (Medium Priority - Engagement)

---

### Sub-Feature 1: Agency Claim Request

#### Story 1.1: Discover Claimable Agency Profile

> As a **Staffing Agency Owner**, I want **to find my company's profile in the directory**, so that **I can claim ownership and manage it**.

**Acceptance Criteria:**

- [ ] **Given** I visit the homepage, **When** I search for my company name, **Then** I see my agency in the search results
- [ ] **Given** I click on my agency, **When** the profile page loads, **Then** I see all current information about my company
- [ ] **Given** the agency is unclaimed, **When** I view the profile, **Then** I see a prominent "Claim This Agency" button in the header
- [ ] **Given** the agency is already claimed, **When** I view the profile, **Then** the claim button is not visible
- [ ] **Given** I am not logged in, **When** I click "Claim This Agency", **Then** I am redirected to `/login?redirectTo=/claim/[agency-slug]`
- [ ] **Given** I am logged in, **When** I click "Claim This Agency", **Then** I am taken to the claim request form

#### Story 1.2: Submit Claim Request

> As a **Staffing Agency Owner**, I want **to submit a claim request for my company**, so that **I can prove ownership and gain management access**.

**Acceptance Criteria:**

- [ ] **Given** I am on the claim request page, **When** the form loads, **Then** I see the agency name pre-filled and read-only
- [ ] **Given** I am filling the claim form, **When** I view required fields, **Then** I must provide: Business Email, Phone Number, Position/Title, Verification Method
- [ ] **Given** I enter my business email, **When** I submit, **Then** the email domain must match the agency website domain (e.g., email@agencywebsite.com)
- [ ] **Given** my email domain doesn't match, **When** I submit, **Then** I see a warning "Email domain must match company website" but can still submit with explanation
- [ ] **Given** I select verification method, **When** I view options, **Then** I can choose: "Business Email", "Phone Verification", or "Manual Review"
- [ ] **Given** I provide all required information, **When** I submit the form, **Then** I see a success message "Claim request submitted! We'll review within 2 business days."
- [ ] **Given** I submitted a claim request, **When** submission completes, **Then** I receive a confirmation email with a request ID
- [ ] **Given** I already submitted a claim for this agency, **When** I try to submit again, **Then** I see "You have a pending claim request for this agency"

#### Story 1.3: Track Claim Request Status

> As a **Staffing Agency Owner**, I want **to check the status of my claim request**, so that **I know when it will be approved**.

**Acceptance Criteria:**

- [ ] **Given** I submitted a claim, **When** I log in, **Then** I see a notification banner "Claim request pending review" with link to status page
- [ ] **Given** I navigate to my profile settings, **When** I view the page, **Then** I see a "Claim Requests" section showing: Agency Name, Status, Submitted Date, Request ID
- [ ] **Given** I view my claim status, **When** I check the status, **Then** it shows one of: Pending, Under Review, Approved, Rejected
- [ ] **Given** my claim is rejected, **When** I view the status, **Then** I see the rejection reason and a "Resubmit" button
- [ ] **Given** my claim is approved, **When** I log in after approval, **Then** I see a success banner "Your claim for [Agency Name] has been approved! Manage your profile."

---

### Sub-Feature 2: Claim Verification & Approval

#### Story 2.1: Admin Review of Claim Requests

> As a **Site Administrator**, I want **to review agency claim requests**, so that **I can verify legitimate ownership before granting access**.

**Acceptance Criteria:**

- [ ] **Given** I am logged in as admin, **When** I navigate to `/admin/claims`, **Then** I see a list of all claim requests with filters: Pending, Approved, Rejected, All
- [ ] **Given** I am viewing the claims list, **When** I see a pending claim, **Then** each row shows: Agency Name, Requester Name, Email, Phone, Submitted Date, Actions
- [ ] **Given** I want to review a claim, **When** I click "Review", **Then** I see a detailed view with all submitted information and verification evidence
- [ ] **Given** I am reviewing a claim, **When** I check verification method, **Then** I see: Email domain match status, Phone number provided, Any additional documents uploaded
- [ ] **Given** I want to verify the requester, **When** I view the detail page, **Then** I see links to: Agency website, LinkedIn (if provided), Google the company
- [ ] **Given** I am not an admin, **When** I try to access `/admin/claims`, **Then** I am redirected to the home page

#### Story 2.2: Approve or Reject Claim

> As a **Site Administrator**, I want **to approve or reject claim requests**, so that **only verified agency owners can manage profiles**.

**Acceptance Criteria:**

- [ ] **Given** I am reviewing a claim, **When** I click "Approve", **Then** I see a confirmation modal "Approve claim for [Agency Name]?"
- [ ] **Given** I confirm approval, **When** the action completes, **Then** the agency's `claimed_by` field is set to the requester's user ID
- [ ] **Given** I approve a claim, **When** the action completes, **Then** the requester's role is automatically updated to `agency_owner`
- [ ] **Given** I approve a claim, **When** the action completes, **Then** the requester receives an approval email with link to their dashboard
- [ ] **Given** I need to reject a claim, **When** I click "Reject", **Then** I must enter a rejection reason (min 20 characters)
- [ ] **Given** I reject a claim with reason, **When** the action completes, **Then** the requester receives a rejection email with the reason and resubmit instructions
- [ ] **Given** I process a claim (approve/reject), **When** the action completes, **Then** an audit log entry is created with: Admin ID, Action, Timestamp, Reason (if rejected)

#### Story 2.3: Automated Email Domain Verification

> As a **Site Administrator**, I want **email domain verification to be automated**, so that **valid claims are approved faster without manual intervention**.

**Acceptance Criteria:**

- [ ] **Given** a claim is submitted, **When** the requester's email domain exactly matches the agency website domain, **Then** the claim is automatically flagged as "Domain Verified"
- [ ] **Given** a claim is domain verified, **When** I review it, **Then** I see a green checkmark badge "Email Domain Verified"
- [ ] **Given** a claim is domain verified AND requester has no red flags, **When** it sits in queue for >4 hours, **Then** admin receives a notification "Pre-verified claim ready for quick approval"
- [ ] **Given** email domain doesn't match, **When** claim is submitted, **Then** it requires full manual review
- [ ] **Given** agency has no website URL, **When** claim is submitted, **Then** it defaults to full manual review process

---

### Sub-Feature 3: Profile Editing Dashboard

#### Story 3.1: Access Agency Dashboard

> As a **Staffing Agency Owner**, I want **to access my agency management dashboard**, so that **I can update my company profile**.

**Acceptance Criteria:**

- [ ] **Given** my claim is approved, **When** I log in, **Then** I see a new "Agency Dashboard" link in the user dropdown menu
- [ ] **Given** I click "Agency Dashboard", **When** the page loads, **Then** I am taken to `/dashboard/agency/[agency-slug]`
- [ ] **Given** I am on the dashboard, **When** the page loads, **Then** I see sections for: Overview, Profile Edit, Services, Analytics (future)
- [ ] **Given** I view the Overview section, **When** page loads, **Then** I see my agency's current profile completeness percentage
- [ ] **Given** I view the Overview section, **When** page loads, **Then** I see quick stats: Profile Views (last 30 days), Lead Requests (future), Profile Completion %
- [ ] **Given** I am not logged in as agency owner, **When** I try to access `/dashboard/agency/[agency-slug]`, **Then** I am redirected to login
- [ ] **Given** I am logged in but don't own the agency, **When** I try to access another agency's dashboard, **Then** I see 403 Forbidden error

#### Story 3.2: Edit Basic Information

> As a **Staffing Agency Owner**, I want **to edit my company's basic information**, so that **potential clients see accurate details**.

**Acceptance Criteria:**

- [ ] **Given** I am on the Profile Edit page, **When** the form loads, **Then** I see editable fields: Company Name, Description, Website URL, Phone, Email, Founded Year
- [ ] **Given** I update the description, **When** I use the rich text editor, **Then** I can format text with: Bold, Italic, Bullet Lists, Numbered Lists, Links
- [ ] **Given** I update the company name, **When** I try to save, **Then** I see a warning "Changing company name requires admin approval" with confirmation checkbox
- [ ] **Given** I update other fields (website, phone, email), **When** I save, **Then** changes are saved immediately without approval
- [ ] **Given** I update the description, **When** I save, **Then** I see a success toast "Profile updated successfully" and preview updates in real-time
- [ ] **Given** I enter invalid data (e.g., malformed URL, phone), **When** I try to save, **Then** I see field-specific validation errors
- [ ] **Given** I made changes but haven't saved, **When** I try to navigate away, **Then** I see a confirmation "You have unsaved changes. Leave anyway?"

#### Story 3.3: Edit Company Details

> As a **Staffing Agency Owner**, I want **to edit additional company details**, so that **my profile showcases our size and capabilities**.

**Acceptance Criteria:**

- [ ] **Given** I am on the Profile Edit page, **When** I view additional fields, **Then** I see: Employee Count, Headquarters Location, Company Size Category
- [ ] **Given** I select Employee Count, **When** I view options, **Then** I can choose from: 1-10, 10-50, 50-100, 100-200, 200-500, 500-1000, 1000+
- [ ] **Given** I enter Headquarters Location, **When** I type, **Then** I see autocomplete suggestions for US cities
- [ ] **Given** I select Company Size, **When** I view options, **Then** I can choose: Small, Medium, Large, Enterprise
- [ ] **Given** I update these fields, **When** I save, **Then** changes are reflected on the public profile immediately
- [ ] **Given** I update these fields, **When** I save, **Then** an audit log records: Field changed, Old value, New value, Timestamp

#### Story 3.4: Preview Profile Changes

> As a **Staffing Agency Owner**, I want **to preview my profile before publishing**, so that **I can see how changes will appear to clients**.

**Acceptance Criteria:**

- [ ] **Given** I am editing my profile, **When** I click "Preview", **Then** I see a modal showing my profile as it will appear publicly
- [ ] **Given** I am in preview mode, **When** I view the modal, **Then** I see my profile exactly as construction companies will see it
- [ ] **Given** I am in preview mode, **When** I click "Back to Editing", **Then** the modal closes and I return to the edit form
- [ ] **Given** I am in preview mode, **When** I click "Publish Changes", **Then** my updates are saved and I see a success message
- [ ] **Given** I preview with unsaved changes, **When** I view the preview, **Then** it shows the draft version, not the currently published version

---

### Sub-Feature 4: Trade & Region Management

#### Story 4.1: Manage Trade Specializations

> As a **Staffing Agency Owner**, I want **to select the trades we specialize in**, so that **we appear in relevant searches**.

**Acceptance Criteria:**

- [ ] **Given** I am on the Services Edit page, **When** page loads, **Then** I see "Trade Specializations" section with multi-select interface
- [ ] **Given** I view available trades, **When** I click "Add Trades", **Then** I see a searchable list of all standardized trades (48 trades from taxonomy)
- [ ] **Given** I search for a trade, **When** I type in search box, **Then** results filter in real-time
- [ ] **Given** I select a trade, **When** I click checkbox, **Then** it is added to "Selected Trades" list
- [ ] **Given** I want to feature primary trades, **When** I drag trades in "Selected Trades", **Then** I can reorder them (top 3 are featured on profile)
- [ ] **Given** I select more than 10 trades, **When** I try to add another, **Then** I see warning "Maximum 10 trades allowed. Remove one to add another."
- [ ] **Given** I save my trade selections, **When** save completes, **Then** the agency-trade relationships are updated in the database
- [ ] **Given** I save my trade selections, **When** save completes, **Then** my agency now appears in searches for those trades

#### Story 4.2: Manage Service Regions

> As a **Staffing Agency Owner**, I want **to select the regions we serve**, so that **we match with companies in those areas**.

**Acceptance Criteria:**

- [ ] **Given** I am on the Services Edit page, **When** I scroll to "Service Regions", **Then** I see a US map with state checkboxes
- [ ] **Given** I want to select states, **When** I click checkboxes, **Then** selected states are highlighted on the map
- [ ] **Given** I want to select multiple states, **When** I click "Select Region", **Then** I can choose: West Coast, East Coast, Midwest, South, Southwest, All USA
- [ ] **Given** I select "All USA", **When** I click it, **Then** all 50 states are automatically selected
- [ ] **Given** I selected states, **When** I save changes, **Then** the agency-region relationships are updated in database
- [ ] **Given** I saved my regions, **When** save completes, **Then** construction companies in those states can find my agency
- [ ] **Given** I have no regions selected, **When** I try to save, **Then** I see validation error "Please select at least one service region"

#### Story 4.3: Add Trade-Specific Capabilities (Optional Enhancement)

> As a **Staffing Agency Owner**, I want **to add details about our capabilities per trade**, so that **clients understand our capacity**.

**Acceptance Criteria:**

- [ ] **Given** I selected trades, **When** I expand a trade, **Then** I see optional fields: Workers Available, Project Size (Small/Med/Large), Response Time
- [ ] **Given** I want to highlight capacity, **When** I enter "Workers Available", **Then** I can enter a number or select from ranges: 1-10, 10-50, 50-100, 100+
- [ ] **Given** I select Project Size, **When** I view options, **Then** I can check multiple: Small (<10 workers), Medium (10-50), Large (50-200), Mega (200+)
- [ ] **Given** I enter Response Time, **When** I view field, **Then** I can select: Same Day, 24 Hours, 48 Hours, 1 Week
- [ ] **Given** I add capability details, **When** I save, **Then** these details appear on my public profile under each trade
- [ ] **Given** I don't add capabilities, **When** I save trades, **Then** only the trade name is shown (capabilities are optional)

---

### Sub-Feature 5: Profile Completion Tracking

#### Story 5.1: View Profile Completion Progress

> As a **Staffing Agency Owner**, I want **to see my profile completion percentage**, so that **I know what information is missing**.

**Acceptance Criteria:**

- [ ] **Given** I am on the dashboard, **When** page loads, **Then** I see a progress bar showing profile completion percentage (0-100%)
- [ ] **Given** I view the progress bar, **When** I hover over it, **Then** I see a tooltip "Complete your profile to attract more clients"
- [ ] **Given** my profile is incomplete, **When** I view the dashboard, **Then** I see a checklist of missing items: Logo, Description, Trades, Regions, Contact Info
- [ ] **Given** I complete an item, **When** I save it, **Then** the checklist updates in real-time and percentage increases
- [ ] **Given** my profile is 100% complete, **When** I view the dashboard, **Then** I see a success badge "Profile Complete!" and celebration animation

#### Story 5.2: Profile Completion Scoring

> As a **Platform Administrator**, I want **profile completion to be calculated automatically**, so that **we can track engagement metrics**.

**Acceptance Criteria:**

- [ ] **Given** an agency profile exists, **When** completion is calculated, **Then** scoring follows this formula:
  - Basic Info (20%): Name (5%), Description (10%), Website (5%)
  - Contact (15%): Phone (5%), Email (5%), Headquarters (5%)
  - Services (40%): Trades (20%), Regions (20%)
  - Additional (15%): Logo (10%), Founded Year (5%)
  - Details (10%): Employee Count (5%), Company Size (5%)
- [ ] **Given** a field is added, **When** profile is saved, **Then** completion percentage recalculates immediately
- [ ] **Given** an agency has 80%+ completion, **When** displayed in search results, **Then** they get a "Verified Profile" badge
- [ ] **Given** an agency has 100% completion, **When** displayed in search results, **Then** they get priority placement (featured first)

#### Story 5.3: Profile Completion Incentives

> As a **Staffing Agency Owner**, I want **to be incentivized to complete my profile**, so that **I get more visibility**.

**Acceptance Criteria:**

- [ ] **Given** my profile is <50% complete, **When** I log in, **Then** I see a banner "Complete your profile to get 3x more leads"
- [ ] **Given** my profile is 50-79% complete, **When** I view dashboard, **Then** I see "Almost there! Complete your profile for premium placement"
- [ ] **Given** my profile is 80-99% complete, **When** I view dashboard, **Then** I see "Just one more step to unlock Featured Agency status"
- [ ] **Given** I reach 100% completion, **When** completion triggers, **Then** I receive a congratulations email and unlock benefits
- [ ] **Given** my profile is 100% complete, **When** displayed in directory, **Then** I get: Featured badge, Higher search ranking, Profile completeness badge

---

## 3. Technical & Design Requirements

### UX/UI Requirements

**Wireframes & Mockups:**
- [ ] Claim request form design (TBD - Figma)
- [ ] Agency dashboard layout (TBD - Figma)
- [ ] Profile edit form with rich text editor (TBD - Figma)
- [ ] Trade/region multi-select interface (TBD - Figma)
- [ ] Admin claim review interface (TBD - Figma)

**Key UI Components Required:**

1. **Claim Request Flow:**
   - Form with validation (email domain matching)
   - File upload for optional verification documents
   - Success confirmation with tracking ID

2. **Agency Dashboard:**
   - Sidebar navigation: Overview, Profile, Services, Analytics
   - Profile completion progress bar with breakdown
   - Quick action cards: "Edit Profile", "Add Logo", "Update Trades"

3. **Profile Editor:**
   - Rich text editor (TipTap or similar)
   - Image upload with cropping (react-image-crop)
   - Multi-select for trades (Shadcn/ui Multi-select)
   - Interactive US map for regions (SVG-based or library)
   - Preview modal (full-screen overlay)

4. **Admin Claims Dashboard:**
   - Sortable/filterable table
   - Claim detail modal with verification checklist
   - Approve/Reject actions with confirmation
   - Audit log timeline

### Technical Impact Analysis

#### Data Model Changes

**New Tables:**

```sql
-- Agency Claim Requests
CREATE TABLE agency_claim_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Request Information
  business_email TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  position_title TEXT NOT NULL,
  verification_method TEXT NOT NULL CHECK (verification_method IN ('email', 'phone', 'manual')),
  additional_notes TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,

  -- Verification Flags
  email_domain_verified BOOLEAN DEFAULT FALSE,
  documents_uploaded BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(agency_id, user_id) -- One active claim per agency per user
);

-- Claim Audit Log
CREATE TABLE agency_claim_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID NOT NULL REFERENCES agency_claim_requests(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL CHECK (action IN ('submitted', 'under_review', 'approved', 'rejected', 'resubmitted')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profile Edit History (for audit trail)
CREATE TABLE agency_profile_edits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  edited_by UUID NOT NULL REFERENCES auth.users(id),
  field_name TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Modified Tables:**

```sql
-- Add to agencies table
ALTER TABLE agencies ADD COLUMN claimed_by UUID REFERENCES auth.users(id);
ALTER TABLE agencies ADD COLUMN claimed_at TIMESTAMPTZ;
ALTER TABLE agencies ADD COLUMN profile_completion_percentage INTEGER DEFAULT 0 CHECK (profile_completion_percentage >= 0 AND profile_completion_percentage <= 100);
ALTER TABLE agencies ADD COLUMN last_edited_at TIMESTAMPTZ;
ALTER TABLE agencies ADD COLUMN last_edited_by UUID REFERENCES auth.users(id);

-- Add indexes for performance
CREATE INDEX idx_agencies_claimed_by ON agencies(claimed_by);
CREATE INDEX idx_claim_requests_status ON agency_claim_requests(status);
CREATE INDEX idx_claim_requests_agency_user ON agency_claim_requests(agency_id, user_id);
```

#### API Endpoints

**New Endpoints:**

```typescript
// Claim Management
POST   /api/claims/request              // Submit claim request
GET    /api/claims/my-requests           // Get user's claim requests
GET    /api/claims/:claimId              // Get specific claim details
GET    /api/claims/:claimId/status       // Get claim status

// Admin Claim Management
GET    /api/admin/claims                 // List all claims (admin only)
GET    /api/admin/claims/:claimId        // Get claim details (admin only)
POST   /api/admin/claims/:claimId/approve // Approve claim (admin only)
POST   /api/admin/claims/:claimId/reject  // Reject claim (admin only)

// Agency Profile Management
GET    /api/agencies/:agencyId/dashboard  // Get dashboard data
PUT    /api/agencies/:agencyId/profile    // Update profile (owner only)
POST   /api/agencies/:agencyId/logo       // Upload logo (owner only)
GET    /api/agencies/:agencyId/completion // Get completion percentage
GET    /api/agencies/:agencyId/edit-history // Get edit audit log (owner only)

// Trade & Region Management
PUT    /api/agencies/:agencyId/trades     // Update trade selections
PUT    /api/agencies/:agencyId/regions    // Update region selections
```

#### Authentication & Authorization

**Row Level Security (RLS) Policies:**

```sql
-- agency_claim_requests policies
-- Users can view their own claim requests
CREATE POLICY "Users can view own claims"
  ON agency_claim_requests FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own claim requests
CREATE POLICY "Users can create claims"
  ON agency_claim_requests FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Admins can view all claims
CREATE POLICY "Admins can view all claims"
  ON agency_claim_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can update claims (approve/reject)
CREATE POLICY "Admins can update claims"
  ON agency_claim_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- agencies table policies
-- Agency owners can update their claimed agency
CREATE POLICY "Owners can update their agency"
  ON agencies FOR UPDATE
  USING (claimed_by = auth.uid());

-- Anyone can view agencies (public directory)
CREATE POLICY "Anyone can view agencies"
  ON agencies FOR SELECT
  USING (true);
```

#### Non-Functional Requirements

**Performance:**
- Profile edit save operations must complete in <500ms
- Image upload and processing must complete in <3 seconds
- Dashboard load time must be <2 seconds
- Claim request submission must be <1 second

**Security:**
- All profile updates require authentication (session-based)
- Email domain verification must be case-insensitive
- File uploads must be scanned for malware (Supabase Storage)
- Sensitive admin actions (approve/reject) must be audit logged
- Rate limiting: 5 claim requests per user per day

**Accessibility:**
- Forms must be keyboard navigable (WCAG 2.1 AA)
- Rich text editor must support screen readers
- All images must have alt text
- Color contrast minimum 4.5:1

**Data Validation:**
- Email addresses must be RFC 5322 compliant
- Phone numbers must be E.164 format (international)
- URLs must be valid HTTP/HTTPS
- Description max length: 2000 characters
- Image upload max size: 5MB

#### Third-Party Integrations

**Required:**
- **Supabase Storage** - Logo and document uploads
- **Resend** - Email notifications (claim approved/rejected, profile updates)
- **TipTap** or **Draft.js** - Rich text editor for descriptions

**Optional (Future):**
- **Cloudinary** - Advanced image optimization and transformations
- **Google Places API** - Headquarters location autocomplete
- **Twilio** - SMS verification for phone-based claims

#### State Management

**Frontend State:**
```typescript
// Profile Edit State
interface ProfileEditState {
  isDirty: boolean;              // Has unsaved changes
  isSubmitting: boolean;         // Form submission in progress
  errors: Record<string, string>; // Field validation errors
  preview: boolean;              // Preview mode active
  completion: number;            // Profile completion percentage
}

// Dashboard State
interface DashboardState {
  agency: Agency;
  stats: {
    profileViews: number;
    leadRequests: number;
    completionPercentage: number;
  };
  recentEdits: ProfileEdit[];
  claimStatus: ClaimRequest | null;
}
```

## 4. Scope

### In Scope (MVP)

**Phase 1 - Core Claim Workflow (Weeks 1-2):**
- ✅ Agency claim request form
- ✅ Email domain verification (automated)
- ✅ Admin claim review dashboard
- ✅ Approve/reject workflow with email notifications
- ✅ Link claimed agency to user account
- ✅ Update user role to `agency_owner` on approval

**Phase 2 - Profile Editing (Weeks 2-3):**
- ✅ Agency dashboard (overview, stats)
- ✅ Basic profile editing (name, description, contact)
- ✅ Rich text editor for description
- ✅ Logo upload and display
- ✅ Preview mode
- ✅ Profile edit audit trail

**Phase 3 - Services Management (Week 3-4):**
- ✅ Trade specialization multi-select (from standardized list)
- ✅ Service region selection (US states)
- ✅ Update agency-trade and agency-region relationships
- ✅ Display selected services on public profile

**Phase 4 - Profile Completion (Week 4):**
- ✅ Calculate profile completion percentage
- ✅ Display completion progress on dashboard
- ✅ Show checklist of missing items
- ✅ Award badges for completion milestones

### Out of Scope (Future Phases)

**Not in MVP:**
- ❌ Multiple users per agency (multi-user accounts)
- ❌ Agency team member management (roles within agency)
- ❌ Real-time analytics dashboard (traffic, leads, conversions)
- ❌ A/B testing profile variations
- ❌ Profile templates or wizards
- ❌ Bulk import of agency data
- ❌ API access for agencies to programmatically update profiles
- ❌ Integration with ATS (Applicant Tracking Systems)
- ❌ Premium profile features (video, extended descriptions)
- ❌ Profile verification badges beyond email domain
- ❌ Social media integration (auto-populate from LinkedIn)
- ❌ SEO optimization tools for profiles
- ❌ Multi-language profile support

**Deferred to Phase 2B:**
- ❌ Lead request tracking and management
- ❌ In-platform messaging between agencies and companies
- ❌ Review and rating system for agencies
- ❌ Analytics on profile views and engagement

### Open Questions

**Technical Questions:**
- [ ] Which rich text editor library should we use? (TipTap vs Draft.js vs Slate)
- [ ] Should we use Cloudinary or stick with Supabase Storage for images?
- [ ] Do we need image cropping/resizing on the frontend or backend?
- [ ] Should trade reordering use drag-and-drop or up/down arrows?
- [ ] How do we handle concurrent edits from multiple tabs/devices?

**Business Questions:**
- [ ] What is the exact email template copy for claim approval/rejection?
- [ ] Who are the initial admins who will review claims?
- [ ] What is the SLA for claim review? (Currently targeting 2 business days)
- [ ] Should we auto-approve claims with verified email domains?
- [ ] Do we need a paid tier for premium profile features immediately?

**Design Questions:**
- [ ] Do we have brand guidelines for the agency dashboard design?
- [ ] Should the dashboard be single-page or multi-page navigation?
- [ ] How should we display the US map for region selection? (Interactive SVG, image with checkboxes, simple list?)
- [ ] What level of rich text formatting do we support? (Basic: Bold/Italic/Lists or Advanced: Tables/Images/Embeds?)
- [ ] Should profile preview be a modal or side-by-side split view?

**Legal/Compliance Questions:**
- [ ] Do we need agencies to agree to terms of service when claiming?
- [ ] What happens to profile data if agency deletes their account?
- [ ] Do we need GDPR compliance for agency data? (If operating in EU)
- [ ] Can agencies request to unpublish their profile without deleting account?

---

## 5. Success Metrics

### Primary Metrics (Must Track)

**Engagement Metrics:**
- Agency claim request rate (target: >20% of total agencies)
- Claim-to-approval conversion rate (target: >80%)
- Profile completion rate among claimed agencies (target: >80%)
- Time to complete profile after claim approval (target: <7 days)

**Usage Metrics:**
- Daily active agency owners (target: 30% weekly active rate)
- Profile edit frequency (target: 2+ edits per agency in first 30 days)
- Dashboard session duration (target: >3 minutes per session)

**Business Metrics:**
- Time-to-value: Claim submission to first profile edit (target: <48 hours)
- Admin efficiency: Claims reviewed per admin per day (target: >10)
- Profile accuracy: Self-reported vs manual update ratio (target: 90% self-serve)

### Secondary Metrics (Nice to Track)

- Feature adoption: % of agencies using logo upload, rich text, trade selection
- Search accuracy: % increase in relevant search results after agencies update trades
- Profile views: Increase in profile views for claimed vs unclaimed agencies
- User satisfaction: NPS score for profile management features (target: >40)

---

## 6. Dependencies & Risks

### Dependencies

**Internal Dependencies:**
- ✅ Authentication system must be complete (Feature 007 - Complete)
- ✅ Role-based access control (admin, agency_owner roles) (Feature 007 - Complete)
- ✅ Email service integration for notifications (Feature 007 - Complete)
- ❌ Standardized trade taxonomy list (Awaiting from user)
- ❌ Brand guidelines and design system (TBD)

**External Dependencies:**
- Supabase Storage setup and configuration
- Rich text editor library selection and integration
- Image upload/cropping library selection

### Risks & Mitigation

**Risk 1: Low Agency Claim Rate**
- **Impact:** Platform remains static, no agency engagement
- **Probability:** Medium
- **Mitigation:**
  - Launch with email campaign to top 50 agencies
  - Offer incentive for early adopters (free featured listing for 3 months)
  - Personal outreach from sales team

**Risk 2: Fraudulent Claim Requests**
- **Impact:** Agencies claimed by competitors or bad actors
- **Probability:** Low-Medium
- **Mitigation:**
  - Email domain verification (automated)
  - Admin manual review for all claims
  - Require business phone verification for high-value agencies
  - Audit trail for all claim actions

**Risk 3: Slow Admin Review Process**
- **Impact:** Agencies wait days/weeks, lose interest
- **Probability:** Medium
- **Mitigation:**
  - Set 2 business day SLA
  - Auto-approve domain-verified claims after 4 hours
  - Email notifications to admins for pending claims
  - Implement claim review dashboard with queue visibility

**Risk 4: Profile Data Quality Issues**
- **Impact:** Agencies enter incomplete/inaccurate data
- **Probability:** Medium-High
- **Mitigation:**
  - Profile completion incentives (featured placement)
  - Required fields enforced
  - Preview mode to catch errors before publishing
  - Periodic email reminders to complete profile

**Risk 5: Image Upload Performance**
- **Impact:** Slow uploads, poor UX, high server costs
- **Probability:** Low-Medium
- **Mitigation:**
  - Client-side image compression before upload
  - Supabase Storage automatic optimization
  - File size limits (5MB max)
  - Progress indicators for uploads

---

## 7. Implementation Plan

### Phase 1: Foundation (Week 1)
- Database schema updates (tables, indexes, RLS policies)
- Claim request form UI
- Claim submission API endpoint
- Email notifications setup

### Phase 2: Admin Tools (Week 1-2)
- Admin claims dashboard
- Claim review interface
- Approve/reject workflow
- Audit logging

### Phase 3: Agency Dashboard (Week 2-3)
- Dashboard layout and navigation
- Profile editing forms
- Rich text editor integration
- Logo upload functionality

### Phase 4: Services & Completion (Week 3-4)
- Trade multi-select interface
- Region selection UI
- Profile completion calculation
- Dashboard stats and progress tracking

### Phase 5: Testing & Polish (Week 4)
- Integration tests for claim workflow
- E2E tests for profile editing
- Performance optimization
- Bug fixes and polish

---

## 8. Next Steps

### Immediate Actions (This Week)

1. **Get Approval on FSD** ✅
   - Review this document with stakeholders
   - Confirm scope and priorities
   - Sign off on technical approach

2. **Design Phase**
   - Create wireframes for claim request flow
   - Design agency dashboard layout
   - Design profile edit forms
   - Design admin claim review interface

3. **Create Engineering Tasks**
   - Break down stories into implementable tasks
   - Create `tasks/009-agency-profile-claim-tasks.md`
   - Assign story point estimates
   - Prioritize task order

4. **Technical Preparation**
   - Select rich text editor library (recommend: TipTap)
   - Select image upload/crop library (recommend: react-easy-crop)
   - Set up Supabase Storage bucket for agency logos
   - Create database migration scripts

### Week 1 Deliverables

- [ ] Database migrations executed
- [ ] Claim request form completed
- [ ] Claim submission working end-to-end
- [ ] Email notifications sending
- [ ] Admin claims dashboard (basic view)

### Week 2-4 Deliverables

- [ ] Complete admin review workflow
- [ ] Agency dashboard functional
- [ ] Profile editing working
- [ ] Logo upload implemented
- [ ] Trade/region selection complete
- [ ] Profile completion tracking live

---

**Document Status:** Ready for Review
**Next Review Date:** After Phase 1 completion
**Last Updated:** 2025-12-19
