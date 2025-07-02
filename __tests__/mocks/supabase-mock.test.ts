import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient, PostgrestError } from '@supabase/supabase-js';

describe('Enhanced Supabase Mock', () => {
  let supabase: SupabaseClient;

  beforeEach(() => {
    jest.clearAllMocks();
    supabase = createClient('https://test.supabase.co', 'test-key');
  });

  describe('Client Creation', () => {
    it('should create a client with all required methods', () => {
      expect(supabase).toBeDefined();
      expect(supabase.from).toBeDefined();
      expect(supabase.auth).toBeDefined();
      expect(supabase.storage).toBeDefined();
      expect(supabase.functions).toBeDefined();
    });

    it('should track createClient calls', () => {
      expect(createClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'test-key'
      );
      expect(createClient).toHaveBeenCalledTimes(1);
    });
  });

  describe('Query Builder', () => {
    it('should support method chaining', () => {
      const query = supabase
        .from('agencies')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true })
        .limit(10);

      expect(query).toBeDefined();
      expect(supabase.from).toHaveBeenCalledWith('agencies');
    });

    it('should support promise-like behavior with then', async () => {
      const result = await supabase
        .from('agencies')
        .select('*')
        .then((res) => res);

      expect(result.data).toBeDefined();
      expect(result.error).toBeNull();
      expect(result.status).toBe(200);
      expect(result.statusText).toBe('OK');
    });

    it('should support promise-like behavior with catch', async () => {
      // Set up an error scenario
      const mockError: PostgrestError = {
        message: 'Test error',
        code: 'TEST_ERROR',
        details: '',
        hint: '',
        name: 'PostgrestError',
      };

      const mockClient = supabase as any;
      if (mockClient._setMockError) {
        mockClient._setMockError(mockError);
      }

      // The real Supabase client returns a promise-like object
      const query = supabase.from('agencies').select('*') as any;
      const result = await query.catch((err: any) => ({ caught: true, error: err }));

      expect(result).toBeDefined();
    });

    it('should support finally', async () => {
      let finallyCalled = false;

      const query = supabase.from('agencies').select('*') as any;
      await query.finally(() => {
        finallyCalled = true;
      });

      expect(finallyCalled).toBe(true);
    });
  });

  describe('Execution Methods', () => {
    it('should support single() method', async () => {
      const result = await supabase
        .from('agencies')
        .select('*')
        .eq('id', 'mock-001')
        .single();

      expect(result.data).toBeDefined();
      expect(result.data).toHaveProperty('id', 'mock-001');
      expect(result.data).toHaveProperty('name', 'Mock Construction Staffing');
    });

    it('should support maybeSingle() method', async () => {
      const result = await supabase
        .from('agencies')
        .select('*')
        .eq('id', 'nonexistent')
        .maybeSingle();

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
    });

    it('should support csv() method', async () => {
      const result = await supabase.from('agencies').select('id,name').csv();

      expect(result.data).toBeDefined();
      expect(typeof result.data).toBe('string');
      expect(result.data).toContain('id,name');
    });

    it('should support execute() method', async () => {
      const query = supabase.from('agencies').select('*') as any;
      const result = await query.execute();

      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);
    });
  });

  describe('Mock Data', () => {
    it('should return sample test data by default', async () => {
      const result = await supabase.from('agencies').select('*');

      expect(result.data).toBeDefined();
      expect(result.data).not.toBeNull();
      expect(result.data!.length).toBe(2);
      expect(result.data![0]).toHaveProperty(
        'name',
        'Mock Construction Staffing'
      );
      expect(result.data![1]).toHaveProperty('name', 'Test Builders Inc');
    });

    it('should include count in response', async () => {
      const result = await supabase.from('agencies').select('*');

      expect(result.count).toBe(2);
    });

    it('should allow setting custom mock data', async () => {
      const customData = [
        { id: 'custom-1', name: 'Custom Agency 1' },
        { id: 'custom-2', name: 'Custom Agency 2' },
        { id: 'custom-3', name: 'Custom Agency 3' },
      ];

      const mockClient = supabase as any;
      if (mockClient._setMockData) {
        mockClient._setMockData(customData);
      }

      const result = await supabase.from('agencies').select('*');

      expect(result.data).not.toBeNull();
      expect(result.data!).toHaveLength(3);
      expect(result.data![0]).toHaveProperty('name', 'Custom Agency 1');
    });

    it('should allow simulating errors', async () => {
      const mockError: PostgrestError = {
        message: 'Database connection failed',
        code: 'CONNECTION_ERROR',
        details: 'Connection refused',
        hint: 'Check your database configuration',
        name: 'PostgrestError',
      };

      const mockClient = supabase as any;
      if (mockClient._setMockError) {
        mockClient._setMockError(mockError);
      }

      const result = await supabase.from('agencies').select('*');

      expect(result.data).toBeNull();
      expect(result.error).toEqual(mockError);
      expect(result.status).toBe(400);
    });
  });

  describe('Auth Methods', () => {
    it('should mock signUp', async () => {
      const result = await supabase.auth.signUp({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.data).not.toBeNull();
      expect(result.data!.user).toBeDefined();
      expect(result.data!.user!.id).toBe('mock-user-id');
      expect(result.error).toBeNull();
    });

    it('should mock signIn', async () => {
      const result = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.data).not.toBeNull();
      expect(result.data!.session).toBeDefined();
      expect(result.data!.session!.access_token).toBe('mock-token');
      expect(result.error).toBeNull();
    });

    it('should mock getUser', async () => {
      const result = await supabase.auth.getUser();

      expect(result.data).not.toBeNull();
      expect(result.data!.user).toBeDefined();
      expect(result.data!.user!.id).toBe('mock-user-id');
    });
  });

  describe('Storage Methods', () => {
    it('should mock file upload', async () => {
      const bucket = supabase.storage.from('avatars');
      const result = await bucket.upload('user123/avatar.png', new Blob());

      expect(result.data).toBeDefined();
      expect(result.data).not.toBeNull();
      expect(result.data!.path).toBe('mock-path');
      expect(result.error).toBeNull();
    });
  });

  describe('Functions Methods', () => {
    it('should mock function invocation', async () => {
      const result = await supabase.functions.invoke('my-function', {
        body: { input: 'test' },
      });

      expect(result.data).toBeDefined();
      expect(result.data).not.toBeNull();
      expect(result.data!.result).toBe('mock-function-result');
      expect(result.error).toBeNull();
    });
  });

  describe('Filter Methods', () => {
    it('should support all filter methods', () => {
      const query = supabase.from('agencies');

      // Test that all filter methods exist and return the query builder
      const filters = [
        'eq',
        'neq',
        'gt',
        'gte',
        'lt',
        'lte',
        'like',
        'ilike',
        'is',
        'in',
        'contains',
        'containedBy',
        'or',
        'not',
        'match',
        'filter',
      ];

      filters.forEach((filter) => {
        const queryWithFilter = query as any;
        expect(queryWithFilter[filter]).toBeDefined();
        expect(typeof queryWithFilter[filter]).toBe('function');
        expect(queryWithFilter[filter]('test', 'value')).toBe(query);
      });
    });
  });
});
