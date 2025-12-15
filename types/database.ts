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
