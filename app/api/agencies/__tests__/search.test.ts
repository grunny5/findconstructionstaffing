import { GET } from '../route';
import { 
  isErrorResponse, 
  API_CONSTANTS,
  HTTP_STATUS 
} from '@/types/api';
import { 
  createMockNextRequest 
} from '@/__tests__/utils/api-mocks';

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data: any, init?: ResponseInit) => ({
      status: init?.status || 200,
      json: async () => data,
      headers: new Headers(init?.headers)
    }))
  }
}));

// Mock Supabase with proper chaining support
jest.mock('@/lib/supabase', () => {
  const mockSupabase = {
    from: jest.fn(),
    select: jest.fn(),
    eq: jest.fn(),
    or: jest.fn(),
    range: jest.fn(),
    order: jest.fn(),
    in: jest.fn()
  };
  
  // Setup chaining
  mockSupabase.from.mockReturnValue(mockSupabase);
  mockSupabase.select.mockReturnValue(mockSupabase);
  mockSupabase.eq.mockReturnValue(mockSupabase);
  mockSupabase.or.mockReturnValue(mockSupabase);
  mockSupabase.range.mockReturnValue(mockSupabase);
  mockSupabase.in.mockReturnValue(mockSupabase);
  
  return { supabase: mockSupabase };
});

describe('GET /api/agencies - Search Functionality', () => {
  const { supabase } = require('@/lib/supabase');
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset chaining
    supabase.from.mockReturnValue(supabase);
    supabase.select.mockReturnValue(supabase);
    supabase.eq.mockReturnValue(supabase);
    supabase.or.mockReturnValue(supabase);
    supabase.range.mockReturnValue(supabase);
    supabase.in.mockReturnValue(supabase);
    
    // Setup default successful responses
    supabase.order.mockResolvedValue({
      data: [],
      error: null,
      count: null
    });
  });

  describe('Search Query Processing', () => {
    it('should apply search filter when search parameter is provided', async () => {
      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: { search: 'construction' }
      });

      await GET(mockRequest);

      // Verify that or() was called with ilike for search
      expect(supabase.or).toHaveBeenCalledWith(
        'name.ilike.%construction%,description.ilike.%construction%'
      );
    });

    it('should not apply search filter when no search parameter provided', async () => {
      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies'
      });

      await GET(mockRequest);

      // Verify that or() was not called
      expect(supabase.or).not.toHaveBeenCalled();
    });

    it('should sanitize search input before applying filters', async () => {
      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: { search: '<script>alert("xss")</script>' }
      });

      await GET(mockRequest);

      // Verify that dangerous characters and keywords are removed
      // The sanitizer removes 'script' keyword, brackets, quotes, and other special chars
      expect(supabase.or).toHaveBeenCalledWith(
        'name.ilike.%xss%,description.ilike.%xss%'
      );
    });

    it('should handle partial word searches', async () => {
      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: { search: 'elect' }
      });

      await GET(mockRequest);

      // Verify partial matching is used
      expect(supabase.or).toHaveBeenCalledWith(
        'name.ilike.%elect%,description.ilike.%elect%'
      );
    });

    it('should handle multi-word searches', async () => {
      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: { search: 'construction staffing' }
      });

      await GET(mockRequest);

      // Verify search term is processed correctly
      expect(supabase.or).toHaveBeenCalledWith(
        'name.ilike.%construction staffing%,description.ilike.%construction staffing%'
      );
    });

    it('should trim whitespace from search terms', async () => {
      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: { search: '  construction  ' }
      });

      await GET(mockRequest);

      // Verify trimmed search term
      expect(supabase.or).toHaveBeenCalledWith(
        'name.ilike.%construction%,description.ilike.%construction%'
      );
    });
  });

  describe('Search Integration', () => {
    it('should apply search filters to both main and count queries', async () => {
      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: { search: 'electrical' }
      });

      await GET(mockRequest);

      // Verify main query uses search
      expect(supabase.or).toHaveBeenCalledWith(
        'name.ilike.%electrical%,description.ilike.%electrical%'
      );
      
      // The or() method should be called twice - once for main query, once for count query
      expect(supabase.or).toHaveBeenCalledTimes(2);
    });

    it('should combine search with other filters correctly', async () => {
      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: { 
          search: 'plumbing',
          limit: '10',
          offset: '20'
        }
      });

      await GET(mockRequest);

      // Verify active filter is applied
      expect(supabase.eq).toHaveBeenCalledWith('is_active', true);
      
      // Verify search filter is applied
      expect(supabase.or).toHaveBeenCalledWith(
        'name.ilike.%plumbing%,description.ilike.%plumbing%'
      );
      
      // Verify pagination is applied
      expect(supabase.range).toHaveBeenCalledWith(20, 29);
    });
  });
});