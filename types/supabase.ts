// Shared Supabase type definitions
import type { Profile } from './database';

export type Agency = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  website?: string;
  phone?: string;
  email?: string;
  is_claimed: boolean;
  is_active: boolean;
  offers_per_diem: boolean;
  is_union: boolean;
  founded_year?: number;
  employee_count?: string;
  headquarters?: string;
  company_size?: string;
  created_at: string;
  updated_at: string;
  claimed_at?: string;
  claimed_by?: string;
  profile_completion_percentage?: number;
  last_edited_at?: string;
  last_edited_by?: string;
  // Integration fields
  integration_enabled?: boolean;
  integration_provider?: string;
  integration_config?: Record<string, any>;
  integration_last_sync_at?: string;
  integration_sync_status?: string;
  integration_sync_error?: string;
  trades?: Trade[];
  regions?: Region[];
};

export type Trade = {
  id: string;
  name: string;
  slug: string;
  description?: string;
};

export type Region = {
  id: string;
  name: string;
  state_code: string;
  slug: string;
};

export type Lead = {
  id: string;
  project_name: string;
  trade_needed: string;
  headcount: number;
  location: string;
  start_date: string;
  duration: string;
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
  additional_details?: string;
  created_at: string;
  status: 'pending' | 'sent' | 'responded';
  matched_agencies?: string[];
};

// Database interface for Supabase client
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>;
      };
      agencies: {
        Row: Agency;
        Insert: Omit<Agency, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Agency, 'id' | 'created_at'>>;
      };
      trades: {
        Row: Trade;
        Insert: Omit<Trade, 'id'>;
        Update: Partial<Omit<Trade, 'id'>>;
      };
      regions: {
        Row: Region;
        Insert: Omit<Region, 'id'>;
        Update: Partial<Omit<Region, 'id'>>;
      };
    };
  };
}
