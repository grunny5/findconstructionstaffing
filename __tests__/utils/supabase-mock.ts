// Centralized Supabase mock setup for tests

export function createSupabaseMock() {
  const mockSupabase = {
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
    update: jest.fn()
  };

  // Set up chaining - each method returns the mockSupabase object
  Object.keys(mockSupabase).forEach(method => {
    if (typeof mockSupabase[method] === 'function') {
      mockSupabase[method].mockReturnValue(mockSupabase);
    }
  });

  return mockSupabase;
}

export function setupSupabaseMock() {
  const mockSupabase = createSupabaseMock();
  
  // Mock the module
  jest.mock('@/lib/supabase', () => ({
    supabase: mockSupabase,
    createSlug: (text: string) => text.toLowerCase().replace(/\s+/g, '-'),
    formatPhoneNumber: (phone: string) => phone
  }));
  
  return mockSupabase;
}