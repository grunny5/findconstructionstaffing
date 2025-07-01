// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Used for __tests__/testing-library.js
// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock environment variables for tests - must be set before any imports
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
process.env.NODE_ENV = 'test'

// Add Web API polyfills for Node.js environment tests
if (typeof global.Request === 'undefined') {
  try {
    // Try to use undici (built into Node.js 18+)
    const { Request, Response, Headers, fetch } = require('undici');
    global.Request = Request;
    global.Response = Response;
    global.Headers = Headers;
    global.fetch = fetch;
  } catch (error) {
    // Fallback to a minimal mock for older Node.js or environments without undici
    global.Request = class MockRequest {
      constructor(url, options = {}) {
        this.url = url;
        this.method = options.method || 'GET';
        this.headers = new Map(Object.entries(options.headers || {}));
      }
    };
    
    global.Response = class MockResponse {
      constructor(body, options = {}) {
        this.body = body;
        this.status = options.status || 200;
        this.headers = new Map(Object.entries(options.headers || {}));
      }
    };
    
    global.Headers = class MockHeaders extends Map {
      constructor(init) {
        super();
        if (init) {
          if (typeof init === 'object' && init.constructor === Object) {
            Object.entries(init).forEach(([key, value]) => this.set(key, value));
          }
        }
      }
    };
    
    global.fetch = jest.fn();
  }
}