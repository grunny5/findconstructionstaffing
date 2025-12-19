export type UserRole = 'user' | 'agency_owner' | 'admin';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
  last_password_change: string;
}

export interface AuthUser {
  id: string;
  email: string;
  profile: Profile | null;
}

export interface RoleChangeAudit {
  id: string;
  user_id: string | null;
  admin_id: string | null;
  old_role: UserRole;
  new_role: UserRole;
  changed_at: string;
  notes: string | null;
  created_at: string;
}

// Agency Claim Management Types (Feature #008)
export type ClaimStatus = 'pending' | 'under_review' | 'approved' | 'rejected';
export type VerificationMethod = 'email' | 'phone' | 'manual';
export type ClaimAuditAction =
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'resubmitted';

export interface AgencyClaimRequest {
  id: string;
  agency_id: string;
  user_id: string;
  business_email: string;
  phone_number: string;
  position_title: string;
  verification_method: VerificationMethod;
  additional_notes: string | null;
  status: ClaimStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  email_domain_verified: boolean;
  documents_uploaded: boolean;
  created_at: string;
  updated_at: string;
}

export interface AgencyClaimAuditLog {
  id: string;
  claim_id: string;
  admin_id: string | null;
  action: ClaimAuditAction;
  notes: string | null;
  created_at: string;
}

export interface AgencyProfileEdit {
  id: string;
  agency_id: string;
  edited_by: string;
  field_name: string;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  created_at: string;
}
