import React from 'react';
import { render } from '@testing-library/react';

// Mock CSS imports
jest.mock('./globals.css', () => ({}));

// Mock ui components
jest.mock('@/components/ui/sonner', () => ({
  Toaster: () => <div data-testid="toaster">Toaster</div>,
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
    
    // Check children array
    const [children, toaster] = body.props.children;
    expect(children.props.children).toBe('Test Child Content');
  });

  it('should include the Toaster component', () => {
    const layout = RootLayout({ children: <div>Content</div> });
    const body = layout.props.children;
    const [_, toaster] = body.props.children;
    
    // Toaster should be the second child
    expect(toaster).toBeDefined();
  });

  it('should pass through children correctly', () => {
    const testChild = <div data-testid="test-child">Test Content</div>;
    const layout = RootLayout({ children: testChild });
    const body = layout.props.children;
    const [children] = body.props.children;
    
    expect(children).toBe(testChild);
  });
});