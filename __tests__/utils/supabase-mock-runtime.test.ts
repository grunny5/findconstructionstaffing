import { setupSupabaseMockRuntime, resetSupabaseMock } from './supabase-mock';

describe('Supabase Runtime Mock', () => {
  afterEach(() => {
    // Clear all module mocks after each test
    jest.resetModules();
  });

  it('should allow runtime mocking with jest.doMock', () => {
    // Setup runtime mock with custom data
    const mockData = [
      { id: 'runtime-1', name: 'Runtime Agency 1' },
      { id: 'runtime-2', name: 'Runtime Agency 2' }
    ];
    
    const mockSupabase = setupSupabaseMockRuntime({
      defaultData: mockData
    });

    // Now require the module after mocking
    const { supabase } = require('@/lib/supabase');
    
    // Verify the mock is in place
    expect(supabase).toBe(mockSupabase);
    expect(supabase.from).toBeDefined();
    expect(supabase.select).toBeDefined();
  });

  it('should allow changing mock behavior at runtime', async () => {
    // First setup
    const firstMock = setupSupabaseMockRuntime({
      defaultData: [{ id: '1', name: 'First' }]
    });

    let { supabase } = require('@/lib/supabase');
    expect(supabase).toBe(firstMock);

    // Reset modules to clear the previous mock
    jest.resetModules();

    // Second setup with different data
    const secondMock = setupSupabaseMockRuntime({
      defaultData: [{ id: '2', name: 'Second' }]
    });

    // Re-require after reset
    const supabaseModule = require('@/lib/supabase');
    expect(supabaseModule.supabase).toBe(secondMock);
  });

  it('should handle error configuration at runtime', () => {
    const testError = new Error('Runtime error');
    
    const mockSupabase = setupSupabaseMockRuntime({
      error: testError,
      throwError: true
    });

    const { supabase } = require('@/lib/supabase');
    
    expect(supabase._error).toBe(testError);
    expect(supabase._throwError).toBe(true);
  });

  it('should preserve utility functions when using runtime mock', () => {
    setupSupabaseMockRuntime();
    
    const { createSlug, formatPhoneNumber } = require('@/lib/supabase');
    
    expect(createSlug).toBeDefined();
    expect(formatPhoneNumber).toBeDefined();
    expect(createSlug('Test Slug')).toBe('test-slug');
    expect(formatPhoneNumber('1234567890')).toBe('(123) 456-7890');
  });
});