// Manual mock for @/lib/supabase
function createMockSupabase() {
  const mock = {
    from: jest.fn(),
    select: jest.fn(),
    eq: jest.fn(),
    neq: jest.fn(),
    or: jest.fn(),
    in: jest.fn(),
    range: jest.fn(),
    order: jest.fn(),
    limit: jest.fn(),
    single: jest.fn(),
    delete: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
  };

  // Set up method chaining - each method returns the mock object
  Object.keys(mock).forEach((method) => {
    if (method !== 'order') {
      mock[method].mockImplementation(() => mock);
    }
  });

  // Default order method to return successful empty result
  mock.order.mockImplementation(() => Promise.resolve({
    data: [],
    error: null,
    count: null,
  }));

  // Override from to ensure it always returns a chainable object
  const originalFrom = mock.from;
  mock.from.mockImplementation(() => {
    // Ensure all methods are chainable even after from() is called
    return mock;
  });

  return mock;
}

export const supabase = createMockSupabase();

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