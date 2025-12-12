import React from 'react';
import { render } from '@testing-library/react';

// Mock CSS imports
jest.mock('./globals.css', () => ({}));

// Mock ui components
jest.mock('@/components/ui/sonner', () => ({
  Toaster: () => <div data-testid="toaster">Toaster</div>,
}));

// Mock AuthProvider as a passthrough component
jest.mock('@/lib/auth/auth-context', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock next/font/google to return consistent class name
jest.mock('next/font/google', () => ({
  Inter: () => ({
    className: '__Inter_abc123', // Simulates the actual generated class pattern
  }),
}));

import RootLayout from './layout';

describe('RootLayout', () => {
  // Since RootLayout returns html/body elements, we need to test it differently
  // We'll render the component and extract its content for testing

  it('should render with correct structure', () => {
    // Create a temporary container
    const container = document.createElement('div');

    // Render the layout
    const layout = RootLayout({ children: <div>Test Child Content</div> });

    // Check the structure
    expect(layout.type).toBe('html');
    expect(layout.props.lang).toBe('en');

    // Check body element
    const body = layout.props.children;
    expect(body.type).toBe('body');
    expect(body.props.className).toBe('__Inter_abc123');

    // AuthProvider wraps the children, so we need to look inside it
    const authProvider = body.props.children;
    expect(authProvider.type).toBeDefined(); // AuthProvider exists

    // Children are inside AuthProvider (mocked as fragment)
    const authChildren = authProvider.props.children;
    expect(authChildren).toBeDefined();

    // With the mock, children should be passed through
    // The first child is our test content, second is Toaster
    const childrenArray = Array.isArray(authChildren) ? authChildren : [authChildren];
    expect(childrenArray.length).toBeGreaterThan(0);
  });

  it('should include the Toaster component', () => {
    const layout = RootLayout({ children: <div>Content</div> });
    const body = layout.props.children;

    // Get children from inside AuthProvider
    const authProvider = body.props.children;
    const authChildren = authProvider.props.children;

    // authChildren should be an array with [children, Toaster]
    const childrenArray = Array.isArray(authChildren) ? authChildren : [authChildren];

    // Should have 2 children: the content and the Toaster
    expect(childrenArray.length).toBe(2);

    // Second child should be the Toaster (mocked component)
    expect(childrenArray[1]).toBeDefined();
    expect(childrenArray[1].type).toBeDefined(); // Has a type (is a component)
  });

  it('should pass through children correctly', () => {
    const testChild = <div data-testid="test-child">Test Content</div>;
    const layout = RootLayout({ children: testChild });
    const body = layout.props.children;

    // Get children from inside AuthProvider
    const authProvider = body.props.children;
    const authChildren = authProvider.props.children;

    // authChildren should be an array with [children, Toaster]
    const childrenArray = Array.isArray(authChildren) ? authChildren : [authChildren];

    // The first element should be our test child
    expect(childrenArray[0]).toBe(testChild);
  });
});
