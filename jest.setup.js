// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Used for __tests__/testing-library.js
// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock environment variables for tests - must be set before any imports
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
process.env.NODE_ENV = 'test';
process.env.FORCE_TEST_MOCKS = 'true';
process.env.CI = 'true'; // Force CI mode for all tests

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
            Object.entries(init).forEach(([key, value]) =>
              this.set(key, value)
            );
          }
        }
      }
    };

    global.fetch = jest.fn();
  }
}

// Add ResizeObserver polyfill for Radix UI components
if (typeof global.ResizeObserver === 'undefined') {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// Add document.elementFromPoint polyfill for TipTap and Radix UI interactions
if (typeof document !== 'undefined' && !document.elementFromPoint) {
  document.elementFromPoint = () => null;
}

// Add hasPointerCapture and setPointerCapture polyfills for Radix UI Select
if (typeof global.HTMLElement !== 'undefined') {
  if (!global.HTMLElement.prototype.hasPointerCapture) {
    global.HTMLElement.prototype.hasPointerCapture = function () {
      return false;
    };
  }
  if (!global.HTMLElement.prototype.setPointerCapture) {
    global.HTMLElement.prototype.setPointerCapture = function () {};
  }
  if (!global.HTMLElement.prototype.releasePointerCapture) {
    global.HTMLElement.prototype.releasePointerCapture = function () {};
  }
}

// Add DOM rect polyfills for ProseMirror/TipTap
if (
  typeof global.Range !== 'undefined' &&
  !global.Range.prototype.getBoundingClientRect
) {
  global.Range.prototype.getBoundingClientRect = function () {
    return {
      x: 0,
      y: 0,
      bottom: 0,
      height: 0,
      left: 0,
      right: 0,
      top: 0,
      width: 0,
      toJSON: () => {},
    };
  };
  global.Range.prototype.getClientRects = function () {
    return {
      length: 0,
      item: () => null,
      [Symbol.iterator]: function* () {},
    };
  };
}

if (typeof global.HTMLElement !== 'undefined') {
  if (!global.HTMLElement.prototype.getClientRects) {
    global.HTMLElement.prototype.getClientRects = function () {
      return {
        length: 1,
        item: () => ({
          x: 0,
          y: 0,
          bottom: 0,
          height: 0,
          left: 0,
          right: 0,
          top: 0,
          width: 0,
          toJSON: () => {},
        }),
        [Symbol.iterator]: function* () {
          yield {
            x: 0,
            y: 0,
            bottom: 0,
            height: 0,
            left: 0,
            right: 0,
            top: 0,
            width: 0,
            toJSON: () => {},
          };
        },
      };
    };
  }
  if (!global.HTMLElement.prototype.getBoundingClientRect) {
    global.HTMLElement.prototype.getBoundingClientRect = function () {
      return {
        x: 0,
        y: 0,
        bottom: 0,
        height: 0,
        left: 0,
        right: 0,
        top: 0,
        width: 0,
        toJSON: () => {},
      };
    };
  }
}

// Global safety net: ensure real timers after every test
// This catches any tests that use jest.useFakeTimers() without proper cleanup
afterEach(() => {
  try {
    jest.useRealTimers();
  } catch (e) {
    // Ignore if already using real timers
  }
});
