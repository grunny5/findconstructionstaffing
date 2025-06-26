/**
 * Tests for API mock utilities
 */

import { 
  createMockNextRequest, 
  extractResponseData, 
  extractResponseStatus,
  mockNextResponse 
} from './api-mocks';

describe('API Mock Utilities', () => {
  describe('createMockNextRequest', () => {
    it('should create a mock request with default values', () => {
      const request = createMockNextRequest();
      
      expect(request.url).toBe('http://localhost:3000/api/test');
      expect(request.method).toBe('GET');
      expect(request.headers).toBeInstanceOf(Headers);
      expect(request.nextUrl.pathname).toBe('/api/test');
    });

    it('should create a mock request with custom values', () => {
      const request = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      expect(request.url).toBe('http://localhost:3000/api/agencies');
      expect(request.method).toBe('POST');
      expect(request.headers.get('Content-Type')).toBe('application/json');
    });

    it('should handle search params correctly', () => {
      const request = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: {
          search: 'test',
          trades: ['electricians', 'plumbers'],
          limit: '10'
        }
      });
      
      expect(request.nextUrl.searchParams.get('search')).toBe('test');
      expect(request.nextUrl.searchParams.getAll('trades')).toEqual(['electricians', 'plumbers']);
      expect(request.nextUrl.searchParams.get('limit')).toBe('10');
    });

    it('should have working body reading methods', async () => {
      const request = createMockNextRequest();
      
      // These should be mocked functions that return promises
      expect(request.json).toBeDefined();
      expect(request.text).toBeDefined();
      expect(request.formData).toBeDefined();
      
      await expect(request.json()).resolves.toEqual({});
      await expect(request.text()).resolves.toBe('');
      await expect(request.formData()).resolves.toBeInstanceOf(FormData);
    });

    it('should have cookie methods', () => {
      const request = createMockNextRequest();
      
      expect(request.cookies.get).toBeDefined();
      expect(request.cookies.getAll).toBeDefined();
      expect(request.cookies.has).toBeDefined();
      expect(request.cookies.set).toBeDefined();
      expect(request.cookies.delete).toBeDefined();
      
      expect(request.cookies.has('test')).toBe(false);
      expect(request.cookies.getAll()).toEqual([]);
    });
  });

  describe('extractResponseData', () => {
    it('should extract data from valid mock response', async () => {
      const mockJsonCall = {
        mock: {
          results: [{
            value: {
              json: async () => ({ success: true, data: 'test' }),
              status: 200
            }
          }]
        }
      };
      
      const data = await extractResponseData(mockJsonCall);
      expect(data).toEqual({ success: true, data: 'test' });
    });

    it('should throw error when no mock results', async () => {
      const mockJsonCall = {
        mock: {
          results: []
        }
      };
      
      await expect(extractResponseData(mockJsonCall)).rejects.toThrow(
        'No mock results available. Ensure the mock function was called before extracting response data.'
      );
    });

    it('should throw error when results is not an array', async () => {
      const mockJsonCall = {
        mock: {
          results: null
        }
      };
      
      await expect(extractResponseData(mockJsonCall)).rejects.toThrow(
        'No mock results available. Ensure the mock function was called before extracting response data.'
      );
    });

    it('should throw error when result has no value', async () => {
      const mockJsonCall = {
        mock: {
          results: [{ value: null }]
        }
      };
      
      await expect(extractResponseData(mockJsonCall)).rejects.toThrow(
        'Mock result is invalid or has no value. Check your test setup.'
      );
    });

    it('should throw error when response has no json method', async () => {
      const mockJsonCall = {
        mock: {
          results: [{
            value: {
              status: 200
              // Missing json method
            }
          }]
        }
      };
      
      await expect(extractResponseData(mockJsonCall)).rejects.toThrow(
        'Mock response does not have a json() method. Ensure you are mocking NextResponse.json correctly.'
      );
    });
  });

  describe('extractResponseStatus', () => {
    it('should extract status from valid mock response', () => {
      const mockJsonCall = {
        mock: {
          results: [{
            value: {
              json: async () => ({}),
              status: 201
            }
          }]
        }
      };
      
      const status = extractResponseStatus(mockJsonCall);
      expect(status).toBe(201);
    });

    it('should throw error when no mock results', () => {
      const mockJsonCall = {
        mock: {
          results: []
        }
      };
      
      expect(() => extractResponseStatus(mockJsonCall)).toThrow(
        'No mock results available. Ensure the mock function was called before extracting response status.'
      );
    });

    it('should throw error when response has no status', () => {
      const mockJsonCall = {
        mock: {
          results: [{
            value: {
              json: async () => ({})
              // Missing status
            }
          }]
        }
      };
      
      expect(() => extractResponseStatus(mockJsonCall)).toThrow(
        'Mock response does not have a status property. Ensure you are mocking NextResponse.json correctly.'
      );
    });
  });

  describe('mockNextResponse', () => {
    it('should create response with json method', async () => {
      const data = { test: 'data' };
      const response = mockNextResponse.json(data, { status: 201 });
      
      expect(response.status).toBe(201);
      expect(await response.json()).toEqual(data);
    });

    it('should use default status 200', async () => {
      const response = mockNextResponse.json({ test: 'data' });
      
      expect(response.status).toBe(200);
    });

    it('should include headers in response', () => {
      const response = mockNextResponse.json({}, {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      expect(response.headers).toBeInstanceOf(Headers);
      expect(response.headers.get('Content-Type')).toBe('application/json');
      expect(response.headers.get('Cache-Control')).toBe('no-cache');
    });
  });
});