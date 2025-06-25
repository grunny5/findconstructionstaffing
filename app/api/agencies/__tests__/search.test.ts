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
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    order: jest.fn()
  }
}));

describe('GET /api/agencies - Search Functionality', () => {
  const { supabase } = require('@/lib/supabase');
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default successful responses
    supabase.order.mockResolvedValue({
      data: [],
      error: null,
      count: null
    });
    
    // Mock for count query
    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          or: jest.fn().mockResolvedValue({
            count: 0,
            error: null
          })
        })
      })
    });
  });

  describe('Search Query Processing', () => {
    it('should apply full-text search when search parameter is provided', async () => {
      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: { search: 'construction' }
      });

      await GET(mockRequest);

      // Verify that or() was called with full-text search syntax
      expect(supabase.or).toHaveBeenCalledWith(
        'name.fts.construction,description.fts.construction,name.ilike.%construction%,description.ilike.%construction%'
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

      // Verify that dangerous characters are removed
      expect(supabase.or).toHaveBeenCalledWith(
        'name.fts.scriptalert("xss")/script,description.fts.scriptalert("xss")/script,name.ilike.%scriptalert("xss")/script%,description.ilike.%scriptalert("xss")/script%'
      );
    });

    it('should handle partial word searches', async () => {
      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: { search: 'elect' }
      });

      await GET(mockRequest);

      // Verify both full-text and partial matching are used
      expect(supabase.or).toHaveBeenCalledWith(
        'name.fts.elect,description.fts.elect,name.ilike.%elect%,description.ilike.%elect%'
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
        'name.fts.construction staffing,description.fts.construction staffing,name.ilike.%construction staffing%,description.ilike.%construction staffing%'
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
        'name.fts.construction,description.fts.construction,name.ilike.%construction%,description.ilike.%construction%'
      );
    });
  });

  describe('Search Integration', () => {
    it('should apply search filters to both main and count queries', async () => {
      const countQuery = {
        or: jest.fn().mockResolvedValue({ count: 5, error: null })
      };
      
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue(countQuery)
        })
      });

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: { search: 'electrical' }
      });

      await GET(mockRequest);

      // Verify main query uses search
      expect(supabase.or).toHaveBeenCalledWith(
        'name.fts.electrical,description.fts.electrical,name.ilike.%electrical%,description.ilike.%electrical%'
      );

      // Verify count query also uses search
      expect(countQuery.or).toHaveBeenCalledWith(
        'name.fts.electrical,description.fts.electrical,name.ilike.%electrical%,description.ilike.%electrical%'
      );
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
        'name.fts.plumbing,description.fts.plumbing,name.ilike.%plumbing%,description.ilike.%plumbing%'
      );
      
      // Verify pagination is applied
      expect(supabase.range).toHaveBeenCalledWith(20, 29);
    });
  });
});