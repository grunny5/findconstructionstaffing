// Mock for @/lib/supabase

export const supabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  neq: jest.fn().mockReturnThis(),
  or: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
  range: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  single: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis()
};

// Mock types
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
  created_at: string;
  updated_at: string;
  claimed_at?: string;
  claimed_by?: string;
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

// Utility functions
export const createSlug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return phone;
};