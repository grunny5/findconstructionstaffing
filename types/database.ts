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
  user_id: string;
  admin_id: string;
  old_role: UserRole;
  new_role: UserRole;
  changed_at: string;
  notes: string | null;
  created_at: string;
}
